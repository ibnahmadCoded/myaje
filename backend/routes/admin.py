from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional
from sql_database import get_db
from pydantic import BaseModel, EmailStr
from routes.auth import get_admin_user, pwd_context
from models import (AccountType, BankAccount, User, Loan, PaymentType, 
                    Payment, AccountSource, Transaction, PaymentStatus, 
                    TransactionTag, TransactionType, Notification, 
                    NotificationType, FinancialPool)
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