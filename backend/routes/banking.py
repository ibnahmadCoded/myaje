#backend/routes/banking.py
from fastapi.encoders import jsonable_encoder
import re
from fastapi import APIRouter, Depends, HTTPException, Query, Body, Path
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.sql import func
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime, timedelta
from sql_database import get_db
from routes.auth import get_current_user
from models import (AccountSource, AutomationSchedule, AutomationType, User, BankAccount, AccountType, Payment, ExternalAccount, 
                    Transaction, TransactionTag, TransactionType, MoneyRequest, 
                    Notification, Loan, NotificationType, BankingAutomation, Order,
                    FinancialPool, PaymentType, PaymentStatus, AccountSource, 
                    RestockRequest, RestockRequestStatus, OrderStatus, AutomationScheduleDetails,
                    AutomationType, AutomationSchedule)
from utils.cache_decorators import cache_response, invalidate_cache
from utils.cache_manager import cache_manager
from banking_automations.automation_functions import calculate_next_run
from config import BUSINESS_ACCOUNT_INITIAL_BALANCE, CACHE_EXPIRATION_TIME, MYAJE_BANK_ACCOUNT_ID, PERSONAL_ACCOUNT_INITIAL_BALANCE, PERSONAL_LOAN_TIERS, BUSINESS_LOAN_TIERS, BUSINESS_LOAN_EQUITY_PERCENTAGE
from enum import Enum
import random
import uuid
from utils.cache_constants import CacheNamespace, CACHE_KEYS

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

class CreditPool(BaseModel):
    name: str = "Default Credit Pool"
    is_locked: bool = False

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

@router.post("/accounts")
@invalidate_cache(
    namespaces=[CacheNamespace.ACCOUNT],
    user_id_arg='current_user',
    custom_keys=[
        lambda result: CACHE_KEYS["user_accounts"](result.user_id),
        lambda result: CACHE_KEYS["account_detail"](result.user_id, result.id),
        lambda result: CACHE_KEYS["account_by_type"](result.user_id, result.account_type),
        lambda result: CACHE_KEYS["user_pools"](result.user_id)
    ]
)
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
    
    if account_data.bvn:
        if not account_data.bvn.isdigit() or len(account_data.bvn) != 11:
            raise HTTPException(
                status_code=400,
                detail="BVN must be exactly 11 digits."
            )

    # Generate account number based on type
    if account_data.account_type == AccountType.BUSINESS:
        while True:
            account_number = generate_account_number(account_data.account_type, current_user)
            exists = db.query(BankAccount).filter(
                BankAccount.account_number == account_number
            ).first()
            if not exists:
                break
    else:
        account_number = generate_account_number(account_data.account_type, current_user)
        exists = db.query(BankAccount).filter(
            BankAccount.account_number == account_number
        ).first()
        if exists:
            raise HTTPException(
                status_code=400,
                detail="An account with this phone number already exists"
            )

    initial_balance = BUSINESS_ACCOUNT_INITIAL_BALANCE if account_data.account_type == AccountType.BUSINESS else PERSONAL_ACCOUNT_INITIAL_BALANCE

    new_account = BankAccount(
        user_id=current_user.id,
        account_name=account_data.account_name,
        account_number=account_number,
        bvn=account_data.bvn,
        account_type=account_data.account_type,
        bank_name=account_data.bank_name,
        balance=0.0
    )
    
    db.add(new_account)
    db.flush()

    # Create default credit pool
    credit_pool: Optional[CreditPool] = None # CREATE CREDIT POOL DURING ACCOUNT CREATION
    pool_name = credit_pool.name if credit_pool else "Credit Pool"
    pool = FinancialPool(
        user_id=current_user.id,
        name=pool_name,
        bank_account_id=new_account.id,
        balance=initial_balance,
        percentage = 0.00, # Credit pool percentage is always 0% since it is just for receiving money
        is_credit_pool = True,
        is_locked=credit_pool.is_locked if credit_pool else False
    )
    db.add(pool)
    db.flush()

    # Set account balance to 0 after pool transfer
    new_account.balance = pool.balance # total account balance is always the sum of all pool balances.

    db.commit()
    db.refresh(new_account)
    
    return new_account

@router.get("/accounts", response_model=List[BankAccountResponse])
@cache_response(expire=CACHE_EXPIRATION_TIME)
async def get_user_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    accounts = db.query(BankAccount).filter(
        BankAccount.user_id == current_user.id,
        BankAccount.is_active == True
    ).all()

    return accounts

@router.get("/accounts/{account_type}", response_model=Optional[BankAccountResponse])
@cache_response(expire=CACHE_EXPIRATION_TIME)
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
@invalidate_cache(
    namespaces=[CacheNamespace.USER],
    user_id_arg='current_user',
    custom_keys=[
        lambda result: CACHE_KEYS["user_profile"](result["user_id"]) if "user_id" in result else None
    ]
)
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
    return {"status": "success", "message": f"{data.view} banking onboarding completed", "user_id": current_user.id}

@router.put("/accounts/{account_id}")
@invalidate_cache(
    namespaces=[CacheNamespace.ACCOUNT],
    user_id_arg='current_user',
    custom_keys=[
        lambda result: CACHE_KEYS["account_detail"](result.user_id, result.id),
        lambda result: CACHE_KEYS["account_by_type"](result.user_id, result.account_type),
        lambda result: CACHE_KEYS["user_accounts"](result.user_id)
    ]
)
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


### TRANSACTIONS ROUTES ##########
# Request Models
class TransferRequest(BaseModel):
    recipient_type: str  # "bam" or "external"
    recipient_identifier: str  # phone number for BAM, account number for external
    recipient_account_type: Optional[str]  # "personal" or "business", only for BAM
    bank_name: Optional[str]  # required for external
    account_name: Optional[str]  # required for external
    amount: float
    description: Optional[str]
    from_account_type: str  # personal or business
    selected_pool_id: str

class MoneyRequestCreate(BaseModel):
    recipient_phone: str
    account_type: str  # Which account type to receive the money
    request_from_account_type: str  # Which account type to request from
    amount: float
    description: Optional[str]

class MoneyRequestCreateResponse(BaseModel):
    id: int
    requester_id: int
    requested_from_id: int
    amount: float
    description: Optional[str]
    account_type: str
    request_from_account_type: str
    status: str
    created_at: datetime
    expires_at: datetime

class MoneyRequestResponse(BaseModel):
    id: int
    requester_id: int
    requested_from_id: int
    amount: float
    description: Optional[str]
    account_type: str
    request_from_account_type: str
    status: str
    created_at: datetime
    expires_at: datetime
    requester_email: str
    requested_from_email: str

    @staticmethod
    def from_orm_with_emails(money_request: MoneyRequest) -> "MoneyRequestResponse":
        return MoneyRequestResponse(
            id=money_request.id,
            requester_id=money_request.requester_id,
            requested_from_id=money_request.requested_from_id,
            amount=money_request.amount,
            description=money_request.description,
            account_type=money_request.account_type,
            request_from_account_type=money_request.request_from_account_type,
            status=money_request.status,
            created_at=money_request.created_at,
            expires_at=money_request.expires_at,
            requester_email=money_request.requester.email,  # Assuming relationship is loaded
            requested_from_email=money_request.requested_from.email  # Assuming relationship is loaded
        )

@router.post("/transfer")
@invalidate_cache(
    namespaces=[CacheNamespace.ACCOUNT, CacheNamespace.TRANSACTION, CacheNamespace.PAYMENT],
    user_id_arg='current_user',
    custom_keys=[
        lambda result: CACHE_KEYS["account_transactions"](result["from_account_id"]),
        lambda result: CACHE_KEYS["account_payments"](result["from_account_id"]),
        lambda result: CACHE_KEYS["user_accounts"](result["user_id"])
    ]
)
async def transfer_money(
    transfer_data: TransferRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get sender's account
    sender_account = db.query(BankAccount).filter(
        BankAccount.user_id == current_user.id,
        BankAccount.account_type == (
            AccountType.BUSINESS if transfer_data.from_account_type == "business" else AccountType.PERSONAL
        )
    ).first()
    
    if not sender_account:
        raise HTTPException(status_code=404, detail="Sender account not found")
    
    if sender_account.balance < transfer_data.amount:
        raise HTTPException(status_code=400, detail="Insufficient funds")
    
    # get formatted user identifier
    formatted_user_identifier = transfer_data.recipient_identifier
    if transfer_data.recipient_type == "bam":
        # format recipient identifier
        recipient_identifier = transfer_data.recipient_identifier

        # Clean the number by removing non-numeric characters and leading zeros
        cleaned_number = re.sub(r'\D', '', recipient_identifier).lstrip('0')

        # Format the cleaned number into XXX-XXX-XXXX
        if len(cleaned_number) == 10:  # Ensure it's a valid 10-digit number
            formatted_user_identifier = f"{cleaned_number[:3]}-{cleaned_number[3:6]}-{cleaned_number[6:]}"
        else:
            raise ValueError("Invalid recipient identifier format")

    # Handle BAM transfer
    if transfer_data.recipient_type == "bam":
        recipient_user = db.query(User).filter(
            User.phone == formatted_user_identifier
        ).first()
        
        if not recipient_user:
            raise HTTPException(status_code=404, detail="Recipient not found")

        recipient_account = db.query(BankAccount).filter(
            BankAccount.user_id == recipient_user.id,
            BankAccount.account_type == (
                AccountType.BUSINESS if transfer_data.recipient_account_type == "business" else AccountType.PERSONAL
            )
        ).first()
        
        if not recipient_account:
            raise HTTPException(status_code=404, detail="Recipient account not found")
            
        # Create payment record
        payment = Payment(
            from_account_id=sender_account.id,
            from_account_source=AccountSource.INTERNAL,
            to_account_id=recipient_account.id,
            to_account_source=AccountSource.INTERNAL,
            amount=transfer_data.amount,
            description=transfer_data.description,
            reference_number=f"TRF-{uuid.uuid4().hex[:8].upper()}",
            payment_type=PaymentType.TRANSFER,
            status=PaymentStatus.COMPLETED,
            completed_at=datetime.utcnow()
        )
        
    else:  # External transfer
        if not all([transfer_data.bank_name, transfer_data.account_name]):
            raise HTTPException(status_code=400, detail="Bank name and account name required for external transfer")
            
        # Create or get external account
        external_account = db.query(ExternalAccount).filter(
            ExternalAccount.account_number == transfer_data.recipient_identifier,
            ExternalAccount.bank_name == transfer_data.bank_name
        ).first()
        
        if not external_account:
            external_account = ExternalAccount(
                user_id=current_user.id,
                account_name=transfer_data.account_name,
                account_number=transfer_data.recipient_identifier,
                bank_name=transfer_data.bank_name,
                description=transfer_data.description
            )
            db.add(external_account)
            db.flush()
        
        # Create payment record
        payment = Payment(
            from_account_id=sender_account.id,
            from_account_source=AccountSource.INTERNAL,
            to_external_account_id=external_account.id,
            to_account_source=AccountSource.EXTERNAL,
            amount=transfer_data.amount,
            description=transfer_data.description,
            reference_number=f"TRF-{uuid.uuid4().hex[:8].upper()}",
            payment_type=PaymentType.TRANSFER,
            status=PaymentStatus.COMPLETED,
            completed_at=datetime.utcnow()
        )

    db.add(payment)
    db.flush()
    
    # Create transactions
    debit_transaction_description = f"Transfer to {transfer_data.recipient_identifier}"
    if transfer_data.recipient_type == "bam":
        debit_transaction_description = f"Transfer to {formatted_user_identifier}"

    debit_transaction = Transaction(
        bank_account_id=sender_account.id,
        type=TransactionType.DEBIT,
        amount=transfer_data.amount,
        description=debit_transaction_description,
        reference=payment.reference_number,
        tag=TransactionTag.TRANSFER,
        payment_id=payment.id
    )
    
    db.add(debit_transaction)
    
    # Update balances (account and pool)
    pool = db.query(FinancialPool).filter(FinancialPool.id == int(transfer_data.selected_pool_id)).first()

    if pool:
        sender_account.balance -= transfer_data.amount
        pool.balance -= transfer_data.amount
        if transfer_data.recipient_type == "bam":
            

            # get receivers's credit pool
            receiver_credit_pool = db.query(FinancialPool).filter(FinancialPool.bank_account_id == recipient_account.id, FinancialPool.is_credit_pool == True).first()

            receiver_credit_pool.balance += transfer_data.amount
            recipient_account.balance += transfer_data.amount
            
            credit_transaction = Transaction(
                bank_account_id=recipient_account.id,
                type=TransactionType.CREDIT,
                amount=transfer_data.amount,
                description=f"Transfer from {sender_account.account_number}",
                reference=payment.reference_number,
                tag=TransactionTag.TRANSFER,
                payment_id=payment.id
            )
            db.add(credit_transaction)
            
            # Create notification for recipient
            notification = Notification(
                user_id=recipient_user.id,
                type=NotificationType.PAYMENT_RECEIVED,
                text=f"You received ₦{transfer_data.amount:,.2f} from {current_user.email}",
                reference_id=payment.id,
                reference_type="payment",
                notification_metadata={
                    'amount': transfer_data.amount,
                    'sender_email': current_user.email,
                    'user_view': transfer_data.recipient_account_type  # Add user_view to metadata
                }
            )
            db.add(notification)
    
    # Add cache invalidation for recipient if it's a BAM account
    if transfer_data.recipient_type == "bam":
        recipient_user = db.query(User).filter(
            User.phone == formatted_user_identifier
        ).first()
        if recipient_user:
            cache_manager.invalidate_user_cache(
                recipient_user.id, 
                [CacheNamespace.ACCOUNT, CacheNamespace.TRANSACTION]
            )
            
    db.commit()
    return {"status": "success", "reference": payment.reference_number, 
            "from_account_id": sender_account.id, "user_id": current_user.id}

def format_phone_number(phone: str) -> str:
    """
    Format phone number to XXX-XXX-XXXX format.
    Strips all non-numeric characters and formats the result.
    Returns None if the resulting number doesn't have exactly 10 digits.
    """
    # Remove all non-numeric characters
    digits = re.sub(r'\D', '', phone)
    
    # Check if we have exactly 10 digits
    if len(digits) != 10:
        raise HTTPException(status_code=400, detail="Phone number must have exactly 10 digits")
    
    # Format as XXX-XXX-XXXX
    return f"{digits[:3]}-{digits[3:6]}-{digits[6:]}"

@router.post("/request-money", response_model=MoneyRequestCreateResponse)
@invalidate_cache(
    namespaces=[CacheNamespace.NOTIFICATION],
    user_id_arg='current_user',
    custom_keys=[
        lambda result: CACHE_KEYS["user_notifications"](result.requested_from_id)
    ]
)
async def request_money(
    request_data: MoneyRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Handle money request creation with proper error handling and logging
    """
    try:
        # Find recipient user
        recipient = db.query(User).filter(User.phone == format_phone_number(request_data.recipient_phone)).first()
        if not recipient:
            raise HTTPException(status_code=404, detail="Recipient not found")

        # Create money request
        money_request = MoneyRequest(
            requester_id=current_user.id,
            requested_from_id=recipient.id,
            amount=request_data.amount,
            description=request_data.description,
            account_type=request_data.account_type,
            request_from_account_type=request_data.request_from_account_type,
            status='pending',
            expires_at=datetime.utcnow() + timedelta(hours=48)
        )
        db.add(money_request)

        # Create notification
        notification = Notification(
            user_id=recipient.id,
            type=NotificationType.MONEY_REQUEST,
            text=f"{current_user.email} requested ₦{request_data.amount:,.2f} from your {request_data.request_from_account_type} account",
            notification_metadata={
                'requester_name': current_user.email,
                'amount': request_data.amount,
                'from_account_type': request_data.request_from_account_type,
                'to_account_type': request_data.account_type,
                'description': request_data.description,
                'user_view': request_data.request_from_account_type
            },
            reference_id=money_request.id,
            reference_type="money_request"
        )
        db.add(notification)
        
        # Commit changes
        db.commit()
        db.refresh(money_request)
        
        return money_request

    except Exception as e:
        db.rollback()
        # Log the error here
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/money-requests/sent", response_model=List[MoneyRequestResponse])
@cache_response(expire=CACHE_EXPIRATION_TIME)
async def get_sent_money_requests(
    user_view: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    money_requests = db.query(MoneyRequest).filter(
        MoneyRequest.requester_id == current_user.id,
        MoneyRequest.account_type == user_view
    ).order_by(MoneyRequest.created_at.desc()).all()
    
    response = [MoneyRequestResponse.from_orm_with_emails(mr) for mr in money_requests]
    return jsonable_encoder(response)

@router.get("/money-requests/received", response_model=List[MoneyRequestResponse])
@cache_response(expire=CACHE_EXPIRATION_TIME)
async def get_received_money_requests(
    user_view: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    money_requests = db.query(MoneyRequest).filter(
        MoneyRequest.requested_from_id == current_user.id,
        MoneyRequest.request_from_account_type == user_view
    ).order_by(MoneyRequest.created_at.desc()).all()
    
    response = [MoneyRequestResponse.from_orm_with_emails(mr) for mr in money_requests]
    return jsonable_encoder(response)

@router.post("/money-requests/{request_id}/accept")
@invalidate_cache(
    namespaces=[CacheNamespace.ACCOUNT, CacheNamespace.TRANSACTION, CacheNamespace.NOTIFICATION],
    user_id_arg='current_user',
    custom_keys=[
        lambda result: CACHE_KEYS["user_notifications"](result["requester_id"]) if "requester_id" in result else None
    ]
)
async def accept_money_request(
    request_id: int,
    pool_id: int = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    money_request = db.query(MoneyRequest).filter(
        MoneyRequest.id == request_id,
        MoneyRequest.requested_from_id == current_user.id,
        MoneyRequest.status == "pending"
    ).first()
    
    if not money_request:
        raise HTTPException(status_code=404, detail="Money request not found or already processed")

    # Get sender's pool and account
    sender_pool = db.query(FinancialPool).filter(
        FinancialPool.id == pool_id,
        FinancialPool.bank_account.has(user_id=current_user.id)
    ).first()
    
    if not sender_pool:
        raise HTTPException(status_code=404, detail="Sender pool not found")
    
    sender_account = sender_pool.bank_account
    if sender_pool.balance < money_request.amount:
        raise HTTPException(status_code=400, detail="Insufficient funds in sender's pool")
    if sender_account.balance < money_request.amount:
        raise HTTPException(status_code=400, detail="Insufficient funds in sender's account")

    # Get recipient's account and credit pool
    recipient_user = db.query(User).filter(User.id == money_request.requester_id).first()
    if not recipient_user:
        raise HTTPException(status_code=404, detail="Recipient not found")

    recipient_account_type = None
    if money_request.account_type == "business":
        recipient_account_type = AccountType.BUSINESS
    else:
        recipient_account_type = AccountType.PERSONAL

    recipient_account = db.query(BankAccount).filter(
        BankAccount.user_id == recipient_user.id,
        BankAccount.account_type == recipient_account_type
    ).first()

    if not recipient_account:
        raise HTTPException(status_code=404, detail="Recipient account not found")

    recipient_pool = db.query(FinancialPool).filter(
        FinancialPool.bank_account_id == recipient_account.id, 
        FinancialPool.name == 'Credit Pool'
    ).first()

    if not recipient_pool:
        raise HTTPException(status_code=404, detail="Recipient pool not found")

    # Update sender balances
    sender_pool.balance -= money_request.amount
    sender_account.balance -= money_request.amount

    # Update recipient balances
    recipient_pool.balance += money_request.amount
    recipient_account.balance += money_request.amount

    # Create Payment for the transfer
    payment = Payment(
        from_account_id=sender_account.id,
        from_account_source=AccountSource.INTERNAL,
        to_account_id=recipient_account.id,
        to_account_source=AccountSource.INTERNAL,
        amount=money_request.amount,
        description=money_request.description,
        reference_number=f"REQ-{uuid.uuid4().hex[:8].upper()}",
        payment_type=PaymentType.MONEY_REQUEST,
        status=PaymentStatus.COMPLETED,
        completed_at=datetime.utcnow()
    )
    db.add(payment)
    db.flush()

    # Create sender's debit transaction
    debit_transaction = Transaction(
        bank_account_id=sender_account.id,
        type=TransactionType.DEBIT,
        amount=money_request.amount,
        description=f"Payment for money request ID {request_id}",
        reference=payment.reference_number,
        tag=TransactionTag.MONEY_REQUEST,
        payment_id=payment.id
    )
    db.add(debit_transaction)

    # Create recipient's credit transaction
    credit_transaction = Transaction(
        bank_account_id=recipient_account.id,
        type=TransactionType.CREDIT,
        amount=money_request.amount,
        description=f"Money request ID {request_id} accepted by {current_user.email}",
        reference=payment.reference_number,
        tag=TransactionTag.MONEY_REQUEST,
        payment_id=payment.id
    )
    db.add(credit_transaction)

    # Update money request status
    money_request.status = "accepted"

    # Create notification for the requester (recipient)
    recipient_notification = Notification(
        user_id=money_request.requester_id,
        type=NotificationType.MONEY_REQUEST_STATUS_CHANGE,
        text=f"Your money request for ₦{money_request.amount:,.2f} was accepted",
        reference_id=money_request.id,
        reference_type="money_request",
        notification_metadata={
            'amount': money_request.amount,
            'status': 'accepted',
            'user_view': money_request.account_type  # Add user_view to metadata
        }
    )
    db.add(recipient_notification)

    # Create notification for the sender
    sender_notification = Notification(
        user_id=current_user.id,
        type=NotificationType.MONEY_REQUEST_STATUS_CHANGE,
        text=f"You accepted a money request for ₦{money_request.amount:,.2f}",
        reference_id=money_request.id,
        reference_type="money_request",
        notification_metadata={
            'amount': money_request.amount,
            'status': 'accepted',
            'user_view': money_request.request_from_account_type  # Add user_view to metadata
        }
    )
    db.add(sender_notification)

    # Commit all changes
    db.commit()

    return {
        "status": "success",
        "message": "Request accepted",
        "requester_id": money_request.requester_id,
        "payment_reference": payment.reference_number
    }

@router.post("/money-requests/{request_id}/reject")
@invalidate_cache(
    namespaces=[CacheNamespace.NOTIFICATION],
    user_id_arg='current_user',
    custom_keys=[
        lambda result: CACHE_KEYS["user_notifications"](result["requester_id"]) if "requester_id" in result else None
    ]
)
async def reject_money_request(
    request_id: int,
    rejection_reason: str = Body(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    money_request = db.query(MoneyRequest).filter(
        MoneyRequest.id == request_id,
        MoneyRequest.requested_from_id == current_user.id,
        MoneyRequest.status == "pending"
    ).first()
    
    if not money_request:
        raise HTTPException(status_code=404, detail="Money request not found or already processed")
        
    money_request.status = "rejected"
    money_request.rejection_reason = rejection_reason
    
    # Create notification with rejection reason if provided
    notification_text = f"Money request for ₦{money_request.amount:,.2f} was rejected"
    if rejection_reason:
        notification_text += f". Reason: {rejection_reason}"
        
    notification = Notification(
        user_id=money_request.requester_id,
        type=NotificationType.MONEY_REQUEST_STATUS_CHANGE,
        text=notification_text,
        reference_id=money_request.id,
        reference_type="money_request",
        notification_metadata={
            'amount': money_request.amount,
            'status': 'rejected',
            'user_view': money_request.account_type  # Add user_view to metadata
        }
    )
    db.add(notification)
    
    db.commit()
    return {
        "status": "success", 
        "message": "Request rejected", 
        "requester_id": money_request.requester_id
    }

@router.get("/transactions")
@cache_response(expire=CACHE_EXPIRATION_TIME)
async def get_transactions(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    transaction_type: Optional[str] = None,
    transaction_tag: Optional[str] = None,
    user_view: str = Query(..., regex="^(personal|business)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get the appropriate bank account based on user view
    bank_account = db.query(BankAccount).filter(
        BankAccount.user_id == current_user.id,
        BankAccount.account_type == (AccountType.BUSINESS if user_view == "business" else AccountType.PERSONAL)
    ).first()
    
    if not bank_account:
        raise HTTPException(status_code=404, detail="Bank account not found")
    
    # Build the base query
    query = db.query(Transaction).filter(Transaction.bank_account_id == bank_account.id)
    
    # Apply filters
    if start_date:
        query = query.filter(Transaction.created_at >= start_date)
    if end_date:
        query = query.filter(Transaction.created_at <= end_date)
    if transaction_type and transaction_type != 'all':
        query = query.filter(Transaction.type == transaction_type.upper())
    if transaction_tag and transaction_tag != 'all-tags':
        query = query.filter(Transaction.tag == transaction_tag.upper())
    
    # Order by most recent first
    query = query.order_by(Transaction.created_at.desc())
    
    transactions = query.all()
    
    return [{
        "id": t.id,
        "type": t.type.value.lower(),
        "amount": t.amount,
        "description": t.description,
        "reference": t.reference,
        "tag": t.tag.value.lower(),
        "date": t.created_at.isoformat(),
        "payment_id": t.payment_id
    } for t in transactions]

############### FINANCIAL POOL ROUTES ############################################
class PoolUpdate(BaseModel):
    name: str
    percentage: float
    is_locked: bool

class RedistributePoolsRequest(BaseModel):
    active_view: str
    pools: List[PoolUpdate]
    
@router.get("/pools/available", response_model=List[dict])
@cache_response(expire=CACHE_EXPIRATION_TIME)
async def get_available_pools(
    active_view: str = Query(..., regex="^(personal|business)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if active_view == 'personal' and current_user.has_personal_account:
        bank_account = db.query(BankAccount).filter(
            BankAccount.user_id == current_user.id,
            BankAccount.account_type == AccountType.PERSONAL,
            BankAccount.is_active == True
        ).first()
    elif active_view == 'business' and current_user.has_business_account:
        bank_account = db.query(BankAccount).filter(
            BankAccount.user_id == current_user.id,
            BankAccount.account_type == AccountType.BUSINESS,
            BankAccount.is_active == True
        ).first()
    else:
        raise HTTPException(status_code=400, detail="Invalid active view or account not onboarded.")

    if not bank_account:
        return []

    pools = db.query(FinancialPool).filter(
        FinancialPool.bank_account_id == bank_account.id
    ).all()

    return [
        {
            "id": pool.id,
            "name": pool.name,
            "percentage": pool.percentage,
            "balance": pool.balance,
            "is_locked": pool.is_locked,
            "is_credit_pool": pool.is_credit_pool
        }
        for pool in pools
    ]

@router.post("/pools/redistribute", response_model=dict)
async def redistribute_pools(
    request: RedistributePoolsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Get bank account based on active_view
        account_type = AccountType.BUSINESS if request.active_view == 'business' else AccountType.PERSONAL
        
        bank_account = db.query(BankAccount).filter(
            BankAccount.user_id == current_user.id,
            BankAccount.account_type == account_type,
            BankAccount.is_active == True
        ).first()
        
        if not bank_account:
            raise HTTPException(
                status_code=404, 
                detail=f"Active {request.active_view} bank account not found"
            )
        
        # Get all pools associated with the bank account
        pools = db.query(FinancialPool).filter(
            FinancialPool.bank_account_id == bank_account.id
        ).all()
        
        # Create a map of pool names and ids from the database
        db_pool_map = {pool.name: pool for pool in pools}

        # Create a map of pool names from the request
        request_pool_names = {update.name for update in request.pools}
        
        # Ensure credit pool exists
        credit_pool = next((pool for pool in pools if pool.is_credit_pool), None)
        if not credit_pool:
            raise HTTPException(status_code=404, detail="Credit pool not found")
        
        # Calculate total available funds
        total_funds = sum(pool.balance for pool in pools)
        
        # Move all funds to the credit pool temporarily
        credit_pool.balance = total_funds
        for pool in pools:
            if not pool.is_credit_pool:
                pool.balance = 0
        
        # Handle new pools and update existing ones
        for update in request.pools:
            if update.name in db_pool_map:
                # Update existing pool
                pool = db_pool_map[update.name]
                pool.percentage = update.percentage
                pool.balance = (total_funds * update.percentage) / 100
                pool.is_locked = update.is_locked
            else:
                # Create new pool
                new_pool = FinancialPool(
                    name=update.name,
                    user_id=current_user.id,
                    percentage=update.percentage,
                    balance=(total_funds * update.percentage) / 100,
                    bank_account_id=bank_account.id,
                    is_credit_pool=False,
                    is_locked=update.is_locked
                )
                db.add(new_pool)
        
        # Delete pools that are in the database but not in the request
        pools_to_delete = db.query(FinancialPool).filter(
            FinancialPool.bank_account_id == bank_account.id,
            FinancialPool.name.not_in(request_pool_names),
            FinancialPool.is_credit_pool == False
        ).all()
        
        for pool in pools_to_delete:
            db.delete(pool)
        
        # Clear credit pool as all funds are redistributed
        credit_pool.balance = 0
        
        # Update bank account balance
        bank_account.balance = total_funds
        
        # Commit transaction
        db.commit()
        
        # Return updated pools
        updated_pools = db.query(FinancialPool).filter(
            FinancialPool.bank_account_id == bank_account.id
        ).all()
        
        return {
            "pools": [
                {
                    "id": pool.id,
                    "name": pool.name,
                    "percentage": pool.percentage,
                    "balance": pool.balance,
                    "percentage": pool.percentage,
                    "is_credit_pool": pool.is_credit_pool,
                    "is_locked": pool.is_locked,
                }
                for pool in updated_pools
            ]
        }
            
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

#################################### LOAN ROUTES ##########################################
class LoanPurpose(str, Enum):
    PRODUCT_PURCHASE = "product_purchase"
    INVENTORY_RESTOCK = "inventory_restock"

@router.get("/loans/availability")
async def get_loan_availability(
    active_view: str = Query(..., regex="^(personal|business)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    account_type = AccountType.PERSONAL if active_view == "personal" else AccountType.BUSINESS
    
    bank_account = db.query(BankAccount).filter(
        BankAccount.user_id == current_user.id,
        BankAccount.account_type == account_type
    ).first()
    
    if not bank_account:
        raise HTTPException(status_code=404, detail="No bank account found for the selected view")
    
    if active_view == "personal":
        # Calculate based on purchase history
        total_purchases = db.query(Order).filter(
            Order.buyer_id == current_user.id,
            Order.status == OrderStatus.fulfilled,
            Order.seller_id != current_user.id
        ).count()

        # Sum of all loan amounts
        total_loans_sum = db.query(func.sum(Loan.amount)).filter(
            Loan.bank_account_id == bank_account.id,
            Loan.user_id == current_user.id
        ).scalar()  # Use scalar() to get the single result directly

        # Sum of all loan repayment amounts
        total_loan_repayments_sum = db.query(func.sum(Payment.amount)).filter(
            Payment.payment_type == PaymentType.LOAN,
            Payment.from_account_id == bank_account.id,
            Payment.to_account_id == MYAJE_BANK_ACCOUNT_ID
        ).scalar()

        total_loans_sum = total_loans_sum or 0
        total_loan_repayments_sum = total_loan_repayments_sum or 0
        
        # Define loan tiers
        loan_tiers = PERSONAL_LOAN_TIERS
        
        # Calculate available amount
        available_amount = 0
        next_milestone = None
        
        for tier in loan_tiers:
            if total_purchases >= tier["purchases"]:
                available_limit = tier["amount"] # this is the limit

                # calculate avaliable amount, which is limit - (total_loans - total_loan_repayments)
                available_amount = available_limit - (total_loans_sum - total_loan_repayments_sum)
            else:
                next_milestone = {
                    "purchases_needed": tier["purchases"] - total_purchases,
                    "amount_unlock": tier["amount"]
                }
                break       
        return {
            "total_purchases": total_purchases,
            "available_amount": available_amount,
            "next_milestone": next_milestone
        }
    
    else:  # business view
        # Calculate based on restock orders and GMV
        restock_orders = db.query(RestockRequest).filter(
            RestockRequest.user_id == current_user.id,
            RestockRequest.status == RestockRequestStatus.APPROVED
        ).count()
        
        total_gmv = db.query(func.sum(Order.total_amount)).filter(
            Order.seller_id == current_user.id,
            Order.status == OrderStatus.fulfilled,
            Order.buyer_id != current_user.id
        ).scalar() or 0

        # Sum of all loan amounts
        total_loans_sum = db.query(func.sum(Loan.amount)).filter(
            Loan.bank_account_id == bank_account.id,
            Loan.user_id == current_user.id
        ).scalar()  # Use scalar() to get the single result directly

        # Sum of all loan repayment amounts
        total_loan_repayments_sum = db.query(func.sum(Payment.amount)).filter(
            Payment.payment_type == PaymentType.LOAN,
            Payment.from_account_id == bank_account.id,
            Payment.to_account_id == MYAJE_BANK_ACCOUNT_ID
        ).scalar()

        total_loans_sum = total_loans_sum or 0
        total_loan_repayments_sum = total_loan_repayments_sum or 0

        tiers = BUSINESS_LOAN_TIERS

        # Calculate available amount
        available_amount = 0
        
        for tier in tiers:
            if restock_orders >= tier["restock_orders"] and total_gmv >= tier["total_gmv"]:
                available_limit = tier["amount"] # this is the limit

                # calculate avaliable amount, which is limit - (total_loans - total_loan_repayments)
                available_amount = available_limit - (total_loans_sum - total_loan_repayments_sum)
            
        return {
            "restock_orders": restock_orders,
            "total_gmv": total_gmv,
            "available_amount": available_amount
        }

@router.get("/loans/history")
async def get_loan_history(
    active_view: str = Query(..., regex="^(personal|business)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    account_type = AccountType.PERSONAL if active_view == "personal" else AccountType.BUSINESS
    
    bank_account = db.query(BankAccount).filter(
        BankAccount.user_id == current_user.id,
        BankAccount.account_type == account_type
    ).first()
    
    if not bank_account:
        raise HTTPException(status_code=404, detail="No bank account found for the selected view")
    
    # we should fetch loans for specific account
    loans = db.query(Loan).filter(
        Loan.user_id == current_user.id,
        Loan.bank_account_id == bank_account.id
    ).order_by(Loan.created_at.desc()).all()
    
    return [
        {
            "id": loan.id,
            "amount": loan.amount,
            "remaining_amount": loan.remaining_amount,
            "status": loan.status,
            "purpose": loan.purpose,
            "created_at": loan.created_at,
            "equity_share": loan.equity_share
        }
        for loan in loans
    ]

@router.post("/loans/request")
async def request_loan(
    loan_request: dict,
    active_view: str = Query(..., regex="^(personal|business)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    account_type = AccountType.PERSONAL if active_view == "personal" else AccountType.BUSINESS
    
    bank_account = db.query(BankAccount).filter(
        BankAccount.user_id == current_user.id,
        BankAccount.account_type == account_type
    ).first()
    
    if not bank_account:
        raise HTTPException(status_code=404, detail="No bank account found for the selected view")
    
    # Verify loan eligibility
    availability = await get_loan_availability(
        active_view=active_view,
        db=db,
        current_user=current_user
    )
    
    if loan_request["amount"] > availability["available_amount"]:
        raise HTTPException(status_code=400, detail="Requested amount exceeds available limit")
    
    new_loan = Loan(
        user_id=current_user.id,
        bank_account_id = bank_account.id,
        amount=loan_request["amount"],
        remaining_amount=loan_request["amount"],
        purpose=loan_request["purpose"],
        status="pending",
        equity_share=BUSINESS_LOAN_EQUITY_PERCENTAGE if current_user.active_view == "business" else None
    )
    
    db.add(new_loan)
    db.commit()
    
    return {"id": new_loan.id, "status": "pending"}


########################################## Automation Routes #####################################################

@router.get("/automations")
async def get_automations(
    active_view: str = Query(..., regex="^(personal|business)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    account_type = AccountType.PERSONAL if active_view == "personal" else AccountType.BUSINESS
    
    bank_account = db.query(BankAccount).filter(
        BankAccount.user_id == current_user.id,
        BankAccount.account_type == account_type
    ).first()
    
    if not bank_account:
        raise HTTPException(status_code=404, detail="No bank account found for the selected view")
    
    automations = db.query(BankingAutomation).options(
        joinedload(BankingAutomation.schedule_details)
    ).filter(
        BankingAutomation.user_id == current_user.id,
        BankingAutomation.bank_account_id == bank_account.id
    ).all()
    
    return [
        {
            "id": auto.id,
            "name": auto.name,
            "type": auto.type,
            "schedule": auto.schedule,
            "amount": auto.amount,
            "source_pool_id": auto.source_pool_id,
            "destination_pool_id": auto.destination_pool_id,
            "percentage": auto.percentage,
            "is_active": auto.is_active,
            "next_run": auto.next_run,
            "schedule_details": {
                "execution_time": auto.schedule_details.execution_time.strftime("%H:%M") if auto.schedule_details else "07:00",
                "day_of_week": auto.schedule_details.day_of_week if auto.schedule_details else None,
                "day_of_month": auto.schedule_details.day_of_month if auto.schedule_details else None
            }
        }
        for auto in automations
    ]

@router.post("/automations")
async def create_automation(
    automation: dict,
    active_view: str = Query(..., regex="^(personal|business)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    account_type = AccountType.PERSONAL if active_view == "personal" else AccountType.BUSINESS
    
    bank_account = db.query(BankAccount).filter(
        BankAccount.user_id == current_user.id,
        BankAccount.account_type == account_type
    ).first()
    
    if not bank_account:
        raise HTTPException(status_code=404, detail="No bank account found for the selected view")
    
    # Validate source pool
    source_pool = db.query(FinancialPool).filter(
        FinancialPool.id == automation["source_pool_id"],
        FinancialPool.user_id == current_user.id
    ).first()
    
    if not source_pool:
        raise HTTPException(status_code=400, detail="Invalid source pool")

    # Parse schedule details
    schedule_details = automation.get("schedule_details", {})
    execution_time = datetime.strptime(
        schedule_details.get("execution_time", "07:00"),
        "%H:%M"
    ).time()
    
    # Calculate next run based on schedule details
    next_run = calculate_next_run(
        automation["schedule"],
        {
            "execution_time": execution_time,
            "day_of_week": schedule_details.get("day_of_week"),
            "day_of_month": schedule_details.get("day_of_month")
        }
    )

    automation_type = AutomationType.TRANSFER if automation["type"] == "bank_transfer" else AutomationType.POOL_TRANSFER
    automation_schedule = None
    if automation["schedule"] == "daily":
        automation_schedule = AutomationSchedule.DAILY
    elif automation["schedule"] == "weekly":
        automation_schedule = AutomationSchedule.WEEKLY
    elif automation["schedule"] == "biweekly":
        automation_schedule = AutomationSchedule.BIWEEKLY
    elif automation["schedule"] == "monthly":
        automation_schedule = AutomationSchedule.MONTHLY
    else:
        automation_schedule = None

    # Initialize automation data
    automation_data = {
        "user_id": current_user.id,
        "bank_account_id": bank_account.id,
        "name": automation["name"],
        "type": automation_type,
        "schedule": automation_schedule,
        "amount": automation.get("amount"),
        "percentage": automation.get("percentage"),
        "source_pool_id": automation["source_pool_id"],
        "next_run": next_run,
        "is_active": True
    }
    
    if automation["type"] == "pool_transfer":
        destination_pool = db.query(FinancialPool).filter(
            FinancialPool.id == automation["destination_pool_id"],
            FinancialPool.user_id == current_user.id
        ).first()
        
        if not destination_pool:
            raise HTTPException(status_code=400, detail="Invalid destination pool")
            
        automation_data["destination_pool_id"] = automation["destination_pool_id"]
        
    else:  # bank_transfer
        if "destination_bam_details" in automation:
            # BAM bank transfer
            # Normalize phone number by removing non-numeric characters
            formatted_phone = re.sub(r'(\d{3})(\d{3})(\d{4})', r'\1-\2-\3', automation["destination_bam_details"]["phone"])

            # Map account type string to AccountType enum
            account_type = (
                AccountType.PERSONAL
                if automation["destination_bam_details"]["account_type"].lower() == "personal"
                else AccountType.BUSINESS
            )

            # Query the destination account
            destination_account = db.query(BankAccount).join(User).filter(
                User.phone == formatted_phone,  # Normalize User.phone in the query
                BankAccount.account_type == account_type
            ).first()
            
            if not destination_account:
                raise HTTPException(status_code=400, detail="Destination BAM account not found")
                
            automation_data["destination_bam_account_id"] = destination_account.id
            
        elif "destination_bank_details" in automation:
            # External bank transfer
            external_account = db.query(ExternalAccount).filter(
                ExternalAccount.user_id == current_user.id,
                ExternalAccount.account_number == automation["destination_bank_details"]["account_number"],
                ExternalAccount.bank_name == automation["destination_bank_details"]["bank_name"]
            ).first()
            
            if not external_account:
                external_account = ExternalAccount(
                    user_id=current_user.id,
                    account_name=automation["destination_bank_details"]["account_name"],
                    account_number=automation["destination_bank_details"]["account_number"],
                    bank_name=automation["destination_bank_details"]["bank_name"]
                )
                db.add(external_account)
                db.flush()
            
            automation_data["destination_account_id"] = external_account.id
        
        else:
            raise HTTPException(status_code=400, detail="Missing destination account details")
    
    # Create automation
    new_automation = BankingAutomation(**automation_data)
    db.add(new_automation)
    db.flush()
    
    # Create schedule details
    schedule_details_data = AutomationScheduleDetails(
        automation_id=new_automation.id,
        execution_time=execution_time,
        day_of_week=schedule_details.get("day_of_week"),
        day_of_month=schedule_details.get("day_of_month")
    )
    db.add(schedule_details_data)
    
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    
    return {"id": new_automation.id}

@router.patch("/automations/{automation_id}")
async def update_automation(
    update_data: dict,
    automation_id: int = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an automation's schedule and timing details."""
    # Query the automation with user validation
    automation = db.query(BankingAutomation).filter(BankingAutomation.id == automation_id).first()
    
    if not automation:
        raise HTTPException(status_code=404, detail="Automation not found")
    
    # Check if schedule details exist for this automation
    automation_schedule_details = db.query(AutomationScheduleDetails).filter(
        AutomationScheduleDetails.automation_id == automation_id
    ).first()

    if not automation_schedule_details:
        raise HTTPException(status_code=404, detail="Schedule details for automation not found")
    
    # Parse schedule details
    schedule_details = update_data.get("schedule_details", {})
    execution_time = datetime.strptime(
        schedule_details.get("execution_time", "07:00"),
        "%H:%M"
    ).time()

    try:
        if "execution_time" in schedule_details:
            automation_schedule_details.execution_time = execution_time
        if "day_of_week" in schedule_details:
            automation_schedule_details.day_of_week = schedule_details["day_of_week"]
        if "day_of_month" in schedule_details:
            automation_schedule_details.day_of_month = schedule_details["day_of_month"]
        
        # Commit the updates for schedule details
        db.commit()
        db.refresh(automation_schedule_details)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update schedule details")
    
    
    # Update the automation
    automation_schedule = None
    if update_data["schedule"] == "daily":
        automation_schedule = AutomationSchedule.DAILY
    elif update_data["schedule"] == "weekly":
        automation_schedule = AutomationSchedule.WEEKLY
    elif update_data["schedule"] == "biweekly":
        automation_schedule = AutomationSchedule.BIWEEKLY
    elif update_data["schedule"] == "monthly":
        automation_schedule = AutomationSchedule.MONTHLY
    else:
        automation_schedule = None

    automation.schedule = automation_schedule
    
    # Calculate next run based on schedule details
    next_run = calculate_next_run(
        update_data["schedule"],
        {
            "execution_time": execution_time,
            "day_of_week": schedule_details.get("day_of_week"),
            "day_of_month": schedule_details.get("day_of_month")
        }
    )

    automation.next_run = next_run
    
    try:
        db.commit()
        db.refresh(automation)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update automation")
    
    return automation

@router.delete("/automations/{automation_id}")
async def delete_automation(
    automation_id: int = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an automation."""
    # Query the automation with user validation
    automation = db.query(BankingAutomation).filter(BankingAutomation.id == automation_id).first()

    # Get automation schedule details
    automation_schedule_details = db.query(AutomationScheduleDetails).filter(AutomationScheduleDetails.automation_id == automation_id).first()
    
    if not automation:
        raise HTTPException(status_code=404, detail="Automation not found")
    
    if not automation_schedule_details:
        raise HTTPException(status_code=404, detail="Schedule details for automation not found")
    
    try:
        db.delete(automation_schedule_details)
        db.delete(automation)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete automation")
    
    return {"message": "Automation deleted successfully"}