#invoice.py
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from datetime import datetime, timedelta
from jinja2 import Environment, FileSystemLoader
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import smtplib
import os
from pydantic import BaseModel, EmailStr
from models import InvoiceRequest, StoreSettings, User, BankDetails
from routes.notifications import create_notification, NotificationType
from sql_database import get_db
from routes.auth import get_current_user
import logging
from typing import Dict
from enum import Enum
from config import SMTP_USERNAME, SMTP_PASSWORD, SMTP_SERVER, SMTP_PORT

router = APIRouter()

# Configure Jinja2 template environment
base_dir = os.path.dirname(os.path.abspath(__file__))  
template_dir = os.path.join(base_dir, "../templates")
env = Environment(loader=FileSystemLoader(template_dir))

async def notify_seller_of_new_invoice(db: Session, invoice_request):
    await create_notification(
        db=db,
        user_id=invoice_request.order.seller_id,
        type=NotificationType.NEW_INVOICE,
        text=f"New invoice request #{invoice_request.id} from {invoice_request.customer_name}",
        reference_id=invoice_request.id,
        reference_type="invoice"
    )

class InvoiceItemCreate(BaseModel):
    product_id: int
    quantity: int
    price: float
    name: str

class InvoiceStatus(str, Enum):
    pending = "pending"
    generated = "generated"
    sent = "sent"
    paid = "paid"
    cancelled = "cancelled"
    overdue = "overdue"

class InvoiceRequestCreate(BaseModel):
    customer_name: str
    customer_email: EmailStr
    customer_phone: Optional[str] = None
    shipping_address: str
    items: List[InvoiceItemCreate]
    amount: float
    status: InvoiceStatus = InvoiceStatus.pending

class InvoiceUpdate(BaseModel):
    status: InvoiceStatus
    notes: Optional[str] = None

class BankDetailsRequestCreate(BaseModel):
    bankName: str
    accountNumber: str
    accountName: str
    sortCode: str
    accountType: str

@router.post("/request") # currently not using the route but can be useful in the future if we want buyers to request new invoices fromt thier accounts (when buyers start having accounts)
async def create_invoice_request(
    request: InvoiceRequestCreate,
    db: Session = Depends(get_db)
):
    try:
        # Create invoice request
        invoice_request = InvoiceRequest(
            customer_name=request.customer_name,
            customer_email=request.customer_email,
            customer_phone=request.customer_phone,
            shipping_address=request.shipping_address,
            amount=request.amount,
            items=request.items,
            status=InvoiceStatus.pending,
            created_at=datetime.utcnow()
        )
        
        db.add(invoice_request)
        db.flush()

        # Create notification
        await notify_seller_of_new_invoice(db=db, invoice_request=invoice_request)

        db.commit()
        db.refresh(invoice_request)
        
        return {
            "message": "Invoice request submitted successfully",
            "invoice_request_id": invoice_request.id
        }
        
    except Exception as e:
        db.rollback()
        logging.error(f"Error creating invoice request: {str(e)}")
        raise HTTPException(status_code=500, detail="Error processing invoice request")

@router.get("/requests")
async def get_invoice_requests(
    status: Optional[InvoiceStatus] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(InvoiceRequest)
    
    if status:
        query = query.filter(InvoiceRequest.status == status)
    
    requests = query.order_by(desc(InvoiceRequest.created_at)).all()
    
    return [{
        "id": req.id,
        "customer_name": req.customer_name,
        "customer_email": req.customer_email,
        "customer_phone": req.customer_phone,
        "shipping_address": req.shipping_address,
        "amount": req.amount,
        "status": req.status,
        "created_at": req.created_at,
        "invoice_number": req.invoice_number,
        "items": req.items
    } for req in requests]

@router.get("/request/{request_id}")
async def get_invoice_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    invoice_request = db.query(InvoiceRequest).filter(
        InvoiceRequest.id == request_id
    ).first()
    
    if not invoice_request:
        raise HTTPException(status_code=404, detail="Invoice request not found")
    
    return {
        "id": invoice_request.id,
        "customer_name": invoice_request.customer_name,
        "customer_email": invoice_request.customer_email,
        "customer_phone": invoice_request.customer_phone,
        "shipping_address": invoice_request.shipping_address,
        "amount": invoice_request.amount,
        "status": invoice_request.status,
        "created_at": invoice_request.created_at,
        "invoice_number": invoice_request.invoice_number,
        "items": invoice_request.items,
        "generated_at": invoice_request.generated_at,
        "generated_by": invoice_request.generated_by
    }

async def send_invoice_email(invoice: Dict, account: Dict, db: Session, current_user: User) -> None:
    """Send invoice as HTML email and update sent_at timestamp."""
    template = env.get_template("invoice_email.html")

    # get store settings
    store_settings = db.query(StoreSettings).filter(
        StoreSettings.user_id == current_user.id
    ).first()

    html_content = template.render(
        invoice=invoice,
        invoice_items=invoice["items"],
        generated_date=datetime.now().strftime("%Y-%m-%d"),
        due_date=invoice.get("due_date"),
        company_name=current_user.business_name,
        company_address=store_settings.street_address,
        company_email=current_user.email,
        company_phone=store_settings.phone_number,
        account=account
    )
    
    msg = MIMEMultipart("alternative")
    msg["From"] = SMTP_USERNAME
    msg["To"] = invoice["customer_email"]
    msg["Subject"] = f"Invoice {invoice['invoice_number']}"
    
    msg.attach(MIMEText(html_content, "html"))
    
    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        
        # Update sent_at timestamp in database
        invoice_request = db.query(InvoiceRequest).filter(
            InvoiceRequest.id == invoice["id"]
        ).first()
        if invoice_request:
            invoice_request.sent_at = datetime.utcnow()
            invoice_request.status = InvoiceStatus.sent
            db.commit()
    except Exception as e:
        logging.error(f"Error sending invoice email: {str(e)}")
        raise

class InvoiceGenerationParams(BaseModel):
    payment_terms: Optional[str] = "Net 30"
    due_date: Optional[datetime] = None

@router.post("/generate/{request_id}")
async def generate_invoice(
    request_id: int,
    params: InvoiceGenerationParams,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    invoice_request = db.query(InvoiceRequest).filter(
        InvoiceRequest.id == request_id
    ).first()
    
    if not invoice_request:
        raise HTTPException(status_code=404, detail="Invoice request not found")
    
    if invoice_request.status != InvoiceStatus.pending:
        raise HTTPException(status_code=400, detail="Invoice already generated")
    
    try:
        # Generate invoice number
        invoice_request.invoice_number = f"INV-{datetime.utcnow().strftime('%Y%m%d')}-{request_id:04d}"
        invoice_request.status = InvoiceStatus.generated
        invoice_request.generated_at = datetime.utcnow()
        invoice_request.generated_by = current_user.id
        
        # Set payment terms and calculate due date
        invoice_request.payment_terms = params.payment_terms
        if params.due_date:
            invoice_request.due_date = params.due_date
        else:
            # Default due date based on payment terms
            days = int(params.payment_terms.split()[1]) if params.payment_terms else 30
            invoice_request.due_date = datetime.utcnow() + timedelta(days=days)
        
        # Prepare invoice data before commit
        invoice_data = invoice_request.to_dict(include_relationships=False)
        
        # Commit the changes
        db.commit()
        
        # Add email task after successful commit
        try:
            # get bank details
            account = db.query(BankDetails).filter(BankDetails.user_id == current_user.id).first()

            background_tasks.add_task(send_invoice_email, invoice_data, account, db, current_user)
        except Exception as email_error:
            logging.error(f"Error queuing email for invoice {invoice_request.invoice_number}: {str(email_error)}")
            # Don't raise an exception here as the invoice was generated successfully
        
        return {
            "message": "Invoice generated successfully",
            "invoice_number": invoice_request.invoice_number,
            "due_date": invoice_request.due_date.isoformat(),
            "status": "email_queued"
        }
    except Exception as e:
        db.rollback()
        logging.error(f"Error generating invoice: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating invoice")

@router.post("/{invoice_id}/send-email")
async def resend_email(
    invoice_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    invoice = db.query(InvoiceRequest).filter(
        InvoiceRequest.id == invoice_id
    ).first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    try:
        invoice_data = invoice.to_dict(include_relationships=False)
        # get bank details
        account = db.query(BankDetails).filter(BankDetails.user_id == current_user.id).first()

        background_tasks.add_task(send_invoice_email, invoice_data, account, db, current_user)
        return {"message": "Email sent successfully"}
    except Exception as e:
        logging.error(f"Error sending email: {str(e)}")
        raise HTTPException(status_code=500, detail="Error sending email")

@router.put("/request/{request_id}")
async def update_invoice_request(
    request_id: int,
    update_data: InvoiceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    invoice_request = db.query(InvoiceRequest).filter(
        InvoiceRequest.id == request_id
    ).first()
    
    if not invoice_request:
        raise HTTPException(status_code=404, detail="Invoice request not found")
    
    try:
        invoice_request.status = update_data.status
        if update_data.notes:
            invoice_request.notes = update_data.notes
        
        invoice_request.updated_at = datetime.utcnow()
        invoice_request.updated_by = current_user.id
        
        db.commit()
        
        return {
            "message": "Invoice request updated successfully",
            "status": invoice_request.status
        }
    except Exception as e:
        db.rollback()
        logging.error(f"Error updating invoice request: {str(e)}")
        raise HTTPException(status_code=500, detail="Error updating invoice request")

@router.delete("/request/{request_id}")
async def delete_invoice_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Only administrators can delete invoice requests")
    
    invoice_request = db.query(InvoiceRequest).filter(
        InvoiceRequest.id == request_id
    ).first()
    
    if not invoice_request:
        raise HTTPException(status_code=404, detail="Invoice request not found")
    
    try:
        db.delete(invoice_request)
        db.commit()
        
        return {"message": "Invoice request deleted successfully"}
    except Exception as e:
        db.rollback()
        logging.error(f"Error deleting invoice request: {str(e)}")
        raise HTTPException(status_code=500, detail="Error deleting invoice request")

@router.post("/save_bank_details")
async def save_bank_details(bank_details: BankDetailsRequestCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check if the user already has bank details, if yes, update them
    existing_bank_details = db.query(BankDetails).filter(BankDetails.user_id == current_user.id).first()

    if existing_bank_details:
        existing_bank_details.bank_name = bank_details.bankName
        existing_bank_details.account_name = bank_details.accountName
        existing_bank_details.account_number = bank_details.accountNumber
        existing_bank_details.sort_code = bank_details.sortCode
        existing_bank_details.account_type = bank_details.accountType
    else:
        # Save new bank details if none exist
        new_bank_details = BankDetails(
            user_id=current_user.id,
            bank_name=bank_details.bankName,
            account_name=bank_details.accountName,
            account_number=bank_details.accountNumber,
            sort_code=bank_details.sortCode,
            account_type=bank_details.accountType,
        )
        db.add(new_bank_details)
    
    db.commit()
    return {"message": "Bank details saved successfully"}

@router.get("/get_bank_details")
async def get_bank_details(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    bank_details = db.query(BankDetails).filter(BankDetails.user_id == current_user.id).first()
    if not bank_details:
        raise HTTPException(status_code=404, detail="Bank details not found")
    
    return {
        "bankName": bank_details.bank_name,
        "accountName": bank_details.account_name,
        "accountNumber": bank_details.account_number,
        "sortCode": bank_details.sort_code,
        "accountType": bank_details.account_type,
    }
