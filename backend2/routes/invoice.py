#invoice.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr
from models import InvoiceRequest, User
from sql_database import get_db
from routes.auth import get_current_user
import logging
from enum import Enum

router = APIRouter()

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

@router.post("/request")
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

@router.post("/generate/{request_id}")
async def generate_invoice(
    request_id: int,
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
        # Generate invoice number (you can customize this format)
        invoice_request.invoice_number = f"INV-{datetime.utcnow().strftime('%Y%m%d')}-{request_id:04d}"
        invoice_request.status = InvoiceStatus.generated
        invoice_request.generated_at = datetime.utcnow()
        invoice_request.generated_by = current_user.id
        
        db.commit()
        
        return {
            "message": "Invoice generated successfully",
            "invoice_number": invoice_request.invoice_number
        }
    except Exception as e:
        db.rollback()
        logging.error(f"Error generating invoice: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating invoice")

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