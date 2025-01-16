from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from models import Payout, User, PayoutBankDetails
from sql_database import get_db
from routes.auth import get_current_user
from pydantic import BaseModel
from utils.cache_constants import CACHE_KEYS
from utils.cache_decorators import cache_response, CacheNamespace, invalidate_cache
from utils.helper_functions import serialize_datetime
from config import CACHE_EXPIRATION_TIME

router = APIRouter()

class OrderDetailsResponse(BaseModel):
    id: int
    total_amount: float
    status: str
    created_at: datetime
    customer_name: Optional[str]
    customer_email: Optional[str]

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
    order_details: Optional[OrderDetailsResponse]
    bank_details: Optional[PayoutBankDetailsResponse]

class PayoutBankDetailsCreate(BaseModel):
    bank_name: str
    account_number: str
    account_name: str

@router.get("/get_payouts", response_model=List[PayoutResponse])
async def get_user_payouts(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all payouts for the current user with optional status filter"""
    query = db.query(Payout).join(Payout.order).filter(Payout.seller_id == current_user.id)
    
    if status and status.upper() in ['PENDING', 'PAID']:
        query = query.filter(Payout.status == status.upper())
    
    payouts = query.order_by(Payout.created_at.desc()).all()
    
    # Get bank details
    bank_details = (
        db.query(PayoutBankDetails)
        .filter(PayoutBankDetails.user_id == current_user.id)
        .first()
    )
    
    # Enhance payout objects with additional info
    payouts_with_details = []
    for payout in payouts:
        payouts_with_details.append({
            "id": payout.id,
            "seller_id": payout.seller_id,
            "order_id": payout.order_id,
            "amount": payout.amount,
            "status": payout.status,
            "created_at": payout.created_at,
            "paid_at": payout.paid_at,
            "bank_details": {
                "id": bank_details.id,
                "bank_name": bank_details.bank_name,
                "account_number": bank_details.account_number,
                "account_name": bank_details.account_name,
                "created_at": bank_details.created_at
            } if bank_details else None,
            "order_details": {
                "id": payout.order.id,
                "total_amount": payout.order.total_amount,
                "status": payout.order.status.value,
                "created_at": payout.order.created_at,
                "customer_name": payout.order.marketplace_order.customer_name if payout.order.marketplace_order else None,
                "customer_email": payout.order.marketplace_order.customer_email if payout.order.marketplace_order else None,
            } if payout.order else None,
        })
    
    return payouts_with_details

@router.post("/bank-details", response_model=PayoutBankDetailsResponse)
async def create_bank_details(
    details: PayoutBankDetailsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create or update bank details for the current user"""
    existing_details = (
        db.query(PayoutBankDetails)
        .filter(PayoutBankDetails.user_id == current_user.id)
        .first()
    )
    
    if existing_details:
        for key, value in details.dict().items():
            setattr(existing_details, key, value)
        existing_details.updated_at = datetime.utcnow()
        bank_details = existing_details
    else:
        bank_details = PayoutBankDetails(
            user_id=current_user.id,
            **details.dict()
        )
        db.add(bank_details)
    
    db.commit()
    db.refresh(bank_details)
    return bank_details

@router.get("/bank-details", response_model=PayoutBankDetailsResponse)
async def get_bank_details(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get bank details for the current user"""
    bank_details = (
        db.query(PayoutBankDetails)
        .filter(PayoutBankDetails.user_id == current_user.id)
        .first()
    )
    
    if not bank_details:
        raise HTTPException(status_code=404, detail="Bank details not found")
    
    return bank_details