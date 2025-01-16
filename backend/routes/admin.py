from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from typing import List, Optional
from sql_database import get_db
from pydantic import BaseModel, EmailStr
from routes.auth import get_admin_user, pwd_context
from models import (AccountType, BankAccount, User, Loan, PaymentType, PayoutBankDetails, 
                    Payment, AccountSource, Transaction, PaymentStatus, 
                    TransactionTag, TransactionType, Notification, Order,
                    NotificationType, FinancialPool, Payout, MarketplaceOrder)
from enum import Enum
from utils.app_metrics_calculator import get_all_metrics
from utils.cache_decorators import cache_response, invalidate_cache
from utils.cache_constants import CacheNamespace, CACHE_KEYS
from config import CACHE_EXPIRATION_TIME, MYAJE_BANK_ACCOUNT_ID
from sqlalchemy import and_
import uuid

router = APIRouter()

class AdminRole(str, Enum):
    super_admin = "super_admin"
    support_admin = "support_admin"
    content_admin = "content_admin"

class AdminUserCreate(BaseModel):
    email: EmailStr
    password: str
    admin_role: AdminRole
    business_name: str

class AdminUserResponse(BaseModel):
    id: int
    email: str
    admin_role: str
    business_name: Optional[str] = None
    created_at: datetime

class PayoutBankDetailsResponse(BaseModel):
    id: int
    bank_name: str
    account_number: str
    account_name: str
    created_at: datetime
    
    class Config:
        orm_mode = True

class PayoutResponse(BaseModel):
    id: int
    seller_id: int
    order_id: int
    amount: float
    status: str
    created_at: datetime
    paid_at: Optional[datetime]
    seller_email: str
    seller_phone: str
    marketplace_order_id: int
    bank_details: Optional[PayoutBankDetailsResponse]

    class Config:
        orm_mode = True

class RelatedOrder(BaseModel):
    id: int
    seller_email: str
    total_amount: float
    status: str

class RelatedPayout(BaseModel):
    id: int
    seller_email: str
    amount: float
    status: str

class RelatedOrderResponse(BaseModel):
    id: int
    seller_email: Optional[str]
    total_amount: float
    status: str


class RelatedPayoutResponse(BaseModel):
    id: int
    seller_email: Optional[str]
    amount: float
    status: str


class MarketplaceOrderResponse(BaseModel):
    id: int
    customer_name: str
    customer_email: str
    customer_phone: str
    shipping_address: str
    total_amount: float
    created_at: str
    orders: List[RelatedOrderResponse]
    payouts: List[RelatedPayoutResponse]

@router.post("/create_admin_user", response_model=AdminUserResponse)
@invalidate_cache(
    namespaces=[CacheNamespace.USER],
    user_id_arg='current_admin',
    custom_keys=[
        lambda _: CACHE_KEYS["admin_users_list"]()
    ]
)
async def create_admin_user(
    user_data: AdminUserCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user)
):
    if current_admin.admin_role != "super_admin":
        raise HTTPException(
            status_code=403,
            detail="Only super admins can create new admin users"
        )
    
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    new_admin = User(
        email=user_data.email,
        password=pwd_context.hash(user_data.password),
        is_admin=True,
        admin_role=user_data.admin_role,
        business_name=user_data.business_name,
        store_slug="No Slug for admin"
    )
    
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)
    return new_admin

@router.get("/get_admin_users", response_model=List[AdminUserResponse])
@cache_response(expire=CACHE_EXPIRATION_TIME)
async def get_admin_users(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user)
):
    if current_admin.admin_role != "super_admin":
        raise HTTPException(
            status_code=403,
            detail="Only super admins can view admin users"
        )
    
    return db.query(User).filter(User.is_admin == True).all()

@router.delete("/users/{user_id}")
@invalidate_cache(
    namespaces=[CacheNamespace.USER],
    user_id_arg='current_admin',
    custom_keys=[
        lambda _: CACHE_KEYS["admin_users_list"](),
        lambda _, user_id=None: CACHE_KEYS["admin_user_detail"](user_id) if user_id else None
    ]
)
async def delete_admin_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user)
):
    if current_admin.admin_role != "super_admin":
        raise HTTPException(
            status_code=403,
            detail="Only super admins can delete admin users"
        )
    
    if current_admin.id == user_id:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete your own admin account"
        )
    
    admin_user = db.query(User).filter(User.id == user_id, User.is_admin == True).first()
    if not admin_user:
        raise HTTPException(status_code=404, detail="Admin user not found")
    
    db.delete(admin_user)
    db.commit()
    return {"message": "Admin user deleted successfully"}

@router.get("/metrics")
@cache_response(expire=300)  # Short expiration time (5 minutes) for metrics
async def get_app_metrics(
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    return await get_all_metrics(db)

@router.get("/loans")
async def get_all_loans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    loans = db.query(Loan).all()
    return [{
        "id": loan.id,
        "amount": loan.amount,
        "purpose": loan.purpose,
        "status": loan.status,
        "user_email": loan.user.email,
        "account_type": loan.bank_account.account_type.value,
        "created_at": loan.created_at,
        "equity_share": loan.equity_share
    } for loan in loans]

@router.post("/loans/{loan_id}/accept")
@invalidate_cache(
    namespaces=[CacheNamespace.ACCOUNT, CacheNamespace.TRANSACTION, CacheNamespace.NOTIFICATION]
)
async def accept_loan(
    loan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    loan = db.query(Loan).filter(
        and_(Loan.id == loan_id, Loan.status == "pending")
    ).first()
    
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found or already processed")
    
    bank_account = db.query(BankAccount).filter(BankAccount.id==loan.bank_account_id).first()

    if not bank_account:
        raise HTTPException(status_code=404, detail="Bank account with which loan is related cannot be found")
    
    # Get MYAJE account (sender)
    myaje_account = db.query(BankAccount).filter(BankAccount.id == MYAJE_BANK_ACCOUNT_ID).first()  # Admin account
    if not myaje_account:
        raise HTTPException(status_code=404, detail="MYAJE account not found")

    # Get Loans Pool
    loans_pool = db.query(FinancialPool).filter(
        FinancialPool.bank_account_id == myaje_account.id,
        FinancialPool.name == "Loans Pool"
    ).first()
    if not loans_pool:
        raise HTTPException(status_code=404, detail="Loans pool not found")

    # Get recipient's credit pool
    recipient_credit_pool = db.query(FinancialPool).filter(
        FinancialPool.bank_account_id == bank_account.id,
        FinancialPool.is_credit_pool == True
    ).first()
    if not recipient_credit_pool:
        raise HTTPException(status_code=404, detail="Recipient credit pool not found")

    account_type = "personal" if bank_account.account_type == AccountType.PERSONAL else "business"

    # Create payment
    payment = Payment(
        from_account_id=myaje_account.id,
        from_account_source=AccountSource.INTERNAL,
        to_account_id=loan.bank_account_id,
        to_account_source=AccountSource.INTERNAL,
        amount=loan.amount,
        description=f"Loan disbursement - {loan.purpose}",
        reference_number=f"LOAN-{uuid.uuid4().hex[:8].upper()}",
        payment_type=PaymentType.LOAN,
        status=PaymentStatus.COMPLETED,
        completed_at=datetime.utcnow()
    )
    db.add(payment)
    db.flush()

    # Create transactions
    debit_transaction = Transaction(
        bank_account_id=myaje_account.id,
        type=TransactionType.DEBIT,
        amount=loan.amount,
        description=f"Loan disbursement to {loan.user.email}",
        reference=payment.reference_number,
        tag=TransactionTag.LOAN,
        payment_id=payment.id
    )
    db.add(debit_transaction)

    credit_transaction = Transaction(
        bank_account_id=loan.bank_account_id,
        type=TransactionType.CREDIT,
        amount=loan.amount,
        description=f"Loan disbursement",
        reference=payment.reference_number,
        tag=TransactionTag.LOAN,
        payment_id=payment.id
    )
    db.add(credit_transaction)

    # Update balances
    # MYAJE account (sender)
    myaje_account.balance -= loan.amount
    loans_pool.balance -= loan.amount

    # Recipient account
    bank_account.balance += loan.amount
    recipient_credit_pool.balance += loan.amount

    # Update loan status
    loan.status = "active"
    loan.disbursed_at = datetime.utcnow()

    # Create notification for recipient
    notification = Notification(
        user_id=loan.user_id,
        type=NotificationType.LOAN_STATUS_CHANGE,
        text=f"Your loan request for ₦{loan.amount:,.2f} has been approved",
        reference_id=loan.id,
        reference_type="loan",
        notification_metadata={
            'amount': loan.amount,
            'status': 'active',
            'user_view': account_type
        }
    )
    db.add(notification)

    db.commit()
    return {"status": "success"}

@router.post("/loans/{loan_id}/reject")
async def reject_loan(
    loan_id: int,
    rejection: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    loan = db.query(Loan).filter(
        and_(Loan.id == loan_id, Loan.status == "pending")
    ).first()
    
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found or already processed")
    
    bank_account = db.query(BankAccount).filter(BankAccount.id==loan.bank_account_id).first()

    if not bank_account:
        raise HTTPException(status_code=404, detail="Bank account with which loan is related cannot be found")
    
    account_type = "personal" if bank_account.account_type == AccountType.PERSONAL else "business"

    loan.status = "rejected"
    loan.rejection_reason = rejection.get("reason")

    notification = Notification(
        user_id=loan.user_id,
        type=NotificationType.LOAN_STATUS_CHANGE,
        text=f"Your loan request for ₦{loan.amount:,.2f} has been rejected",
        reference_id=loan.id,
        reference_type="loan",
        notification_metadata={
            'amount': loan.amount,
            'status': 'rejected',
            'reason': rejection.get("reason"),
            'user_view': account_type
        }
    )
    db.add(notification)

    db.commit()
    return {"status": "success"}

@router.get("/payouts", response_model=List[PayoutResponse])
async def get_payouts(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user)
):
    """Get all payouts with optional status filter"""
    query = (
        db.query(Payout)
        .join(Payout.seller)
        .join(Payout.order)
        .options(joinedload(Payout.seller))  # Eager load seller relationship
    )
    
    if status and status.upper() in ['PENDING', 'PAID']:
        query = query.filter(Payout.status == status.upper())
    
    payouts = query.order_by(Payout.created_at.desc()).all()
    
    # Enhance payout objects with additional info
    payouts_with_details = []
    for payout in payouts:
        # Get bank details for each seller
        bank_details = (
            db.query(PayoutBankDetails)
            .filter(PayoutBankDetails.user_id == payout.seller_id)
            .first()
        )
        
        payouts_with_details.append({
            "id": payout.id,
            "seller_id": payout.seller_id,
            "order_id": payout.order_id,
            "amount": payout.amount,
            "status": payout.status,
            "created_at": payout.created_at,
            "paid_at": payout.paid_at,
            "seller_email": payout.seller.email,
            "seller_phone": payout.seller.phone,
            "marketplace_order_id": payout.order.marketplace_order_id,
            "bank_details": {
                "id": bank_details.id,
                "bank_name": bank_details.bank_name,
                "account_number": bank_details.account_number,
                "account_name": bank_details.account_name,
                "created_at": bank_details.created_at
            } if bank_details else None,
        })
    
    return payouts_with_details

@router.put("/payouts/{payout_id}/complete")
async def complete_payout(
    payout_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user)
):
    """Mark a payout as completed/paid"""
    payout = (
        db.query(Payout)
        .options(joinedload(Payout.seller))
        .filter(Payout.id == payout_id)
        .first()
    )
    
    if not payout:
        raise HTTPException(status_code=404, detail="Payout not found")
    
    if payout.status == 'PAID':
        raise HTTPException(status_code=400, detail="Payout is already marked as paid")
    
    # Check if seller has bank details
    bank_details = (
        db.query(PayoutBankDetails)
        .filter(PayoutBankDetails.user_id == payout.seller_id)
        .first()
    )
    
    if not bank_details:
        raise HTTPException(
            status_code=400,
            detail="Seller has not provided bank details for payout"
        )
    
    payout.status = 'PAID'
    payout.paid_at = datetime.utcnow()
    
    # Send notification    
    notification = Notification(
        user_id=payout.seller_id, 
        text=f"Your payout of ₦{payout.amount:,.2f} has been processed and sent to your bank account.",
        type=NotificationType.PAYOUT,
        notification_metadata={
            'user_view': 'business',
            "payout_id": payout.id,
            "amount": payout.amount,
            "bank_name": bank_details.bank_name,
            "account_number": bank_details.account_number[-4:] # Last 4 digits only
        })
    db.add(notification)
    db.commit()
    
    return {"message": "Payout marked as completed and notification sent"}

@router.get(
    "/payouts/marketplace-orders/{marketplace_order_id}",
    response_model=MarketplaceOrderResponse
)
async def get_marketplace_order_details(
    marketplace_order_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user)
):
    """Get marketplace order details with related orders and payouts"""
    marketplace_order = (
        db.query(MarketplaceOrder)
        .filter(MarketplaceOrder.id == marketplace_order_id)
        .options(joinedload(MarketplaceOrder.seller_orders).joinedload(Order.payout))
        .first()
    )
    
    if not marketplace_order:
        raise HTTPException(status_code=404, detail="Marketplace order not found")
    
    # Serialize related orders
    related_orders = [
        {
            "id": order.id,
            "seller_email": order.seller.email if order.seller else None,
            "total_amount": order.total_amount,
            "status": order.status.value,
        }
        for order in marketplace_order.seller_orders
    ]
    
    # Serialize related payouts
    related_payouts = [
        {
            "id": order.payout.id,
            "seller_email": order.payout.seller.email if order.payout and order.payout.seller else None,
            "amount": order.payout.amount,
            "status": order.payout.status,
        }
        for order in marketplace_order.seller_orders
        if order.payout  # Only include orders with a payout
    ]
    
    # Convert marketplace_order to dictionary
    marketplace_order_data = {
        "id": marketplace_order.id,
        "customer_name": marketplace_order.customer_name,
        "customer_email": marketplace_order.customer_email,
        "customer_phone": marketplace_order.customer_phone,
        "shipping_address": marketplace_order.shipping_address,
        "total_amount": marketplace_order.total_amount,
        "created_at": marketplace_order.created_at.isoformat(),
        "orders": related_orders,
        "payouts": related_payouts,
    }
    
    return marketplace_order_data
