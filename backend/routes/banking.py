#backend/routes/banking.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from sql_database import get_db
from routes.auth import get_current_user
from models import User, BankAccount, AccountType
import random

router = APIRouter()

class BankAccountCreate(BaseModel):
    account_name: str
    account_type: AccountType
    bank_name: str = "BAM Bank"
    bvn: Optional[str] = None

class BankAccountResponse(BaseModel):
    id: int
    account_name: str
    account_number: str
    account_type: str
    bank_name: str
    balance: float
    is_active: bool
    created_at: datetime

class OnboardingUpdate(BaseModel):
    view: str  # 'business' or 'personal'

def generate_account_number(account_type: AccountType, user: User) -> str:
    """
    Generate account number based on account type:
    - Personal accounts use the user's phone number
    - Business accounts get a random 10-digit number
    """
    if account_type == AccountType.PERSONAL:
        if not user.phone:
            raise HTTPException(
                status_code=400,
                detail="Phone number is required for personal account creation"
            )
        # Remove any non-digit characters and take last 10 digits
        phone_number = ''.join(filter(str.isdigit, user.phone))
        if len(phone_number) < 10:
            raise HTTPException(
                status_code=400,
                detail="Invalid phone number format"
            )
        return phone_number[-10:]
    else:
        # For business accounts, generate random 10-digit number
        return str(random.randint(1000000000, 9999999999))

@router.post("/accounts", response_model=BankAccountResponse)
async def create_bank_account(
    account_data: BankAccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if user already has an account of this type
    existing_account = db.query(BankAccount).filter(
        BankAccount.user_id == current_user.id,
        BankAccount.account_type == account_data.account_type
    ).first()
    
    if existing_account:
        raise HTTPException(
            status_code=400,
            detail=f"User already has a {account_data.account_type.value} account"
        )
    
    if account_data.account_type == AccountType.PERSONAL and account_data.bvn:
        if not account_data.bvn.isdigit() or len(account_data.bvn) != 11:
            raise HTTPException(
                status_code=400,
                detail="BVN must be exactly 11 digits."
            )

    # Generate account number based on type
    if account_data.account_type == AccountType.BUSINESS:
        # For business accounts, keep trying until we get a unique number
        while True:
            account_number = generate_account_number(account_data.account_type, current_user)
            exists = db.query(BankAccount).filter(
                BankAccount.account_number == account_number
            ).first()
            if not exists:
                break
    else:
        # For personal accounts, use phone number
        account_number = generate_account_number(account_data.account_type, current_user)
        # Check if this phone number is already used as an account number
        exists = db.query(BankAccount).filter(
            BankAccount.account_number == account_number
        ).first()
        if exists:
            raise HTTPException(
                status_code=400,
                detail="An account with this phone number already exists"
            )

    # Set initial balance based on account type
    initial_balance = 1000000.00 if account_data.account_type == AccountType.BUSINESS else 100000.00 # should be 0.00

    new_account = BankAccount(
        user_id=current_user.id,
        account_name=account_data.account_name,
        account_number=account_number,
        bvn=account_data.bvn,
        account_type=account_data.account_type,
        bank_name=account_data.bank_name,
        balance=initial_balance
    )
    
    db.add(new_account)
    db.commit()
    db.refresh(new_account)
    
    return new_account

@router.get("/accounts", response_model=List[BankAccountResponse])
async def get_user_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(BankAccount).filter(
        BankAccount.user_id == current_user.id,
        BankAccount.is_active == True
    ).all()

@router.get("/accounts/{account_type}", response_model=Optional[BankAccountResponse])
async def get_account_by_type(
    account_type: AccountType,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    account = db.query(BankAccount).filter(
        BankAccount.user_id == current_user.id,
        BankAccount.account_type == account_type,
        BankAccount.is_active == True
    ).first()
    
    if not account:
        raise HTTPException(
            status_code=404,
            detail=f"No {account_type.value} account found"
        )
    
    return account

@router.post("/update-banking-onboarding")
async def update_banking_onboarding(
    data: OnboardingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if data.view not in ['business', 'personal']:
        raise HTTPException(
            status_code=400,
            detail="Invalid view type. Must be 'business' or 'personal'"
        )
    
    if data.view == 'business':
        current_user.business_banking_onboarded = True
    else:
        current_user.personal_banking_onboarded = True
    
    db.commit()
    return {"status": "success", "message": f"{data.view} banking onboarding completed"}

@router.put("/accounts/{account_id}")
async def update_account(
    account_id: int,
    account_data: BankAccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    account = db.query(BankAccount).filter(
        BankAccount.id == account_id,
        BankAccount.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    account.account_name = account_data.account_name
    account.bank_name = account_data.bank_name
    
    db.commit()
    db.refresh(account)
    
    return account