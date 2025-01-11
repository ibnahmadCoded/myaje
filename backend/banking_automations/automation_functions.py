from datetime import datetime, timedelta
from fastapi import Depends 
from sqlalchemy.orm import Session
from typing import Optional
from models import BankAccount, FinancialPool, User
from routes.auth import get_current_user
from sql_database import get_db

def calculate_next_run(schedule: str, from_date: Optional[datetime] = None) -> datetime:
    if from_date is None:
        from_date = datetime.utcnow()
        
    if schedule == "daily":
        next_run = from_date + timedelta(days=1)
    elif schedule == "weekly":
        next_run = from_date + timedelta(weeks=1)
    elif schedule == "biweekly":
        next_run = from_date + timedelta(weeks=2)
    elif schedule == "monthly":
        # Add a month while handling month transitions
        year = from_date.year + ((from_date.month + 1) - 1) // 12
        month = ((from_date.month + 1) - 1) % 12 + 1
        day = min(from_date.day, [31, 29 if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0) else 28,
                                31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1])
        next_run = from_date.replace(year=year, month=month, day=day)
    else:
        raise ValueError(f"Invalid schedule: {schedule}")
        
    return next_run

async def process_pool_transfer(
    source_pool_id: int,
    destination_pool_id: int,
    amount: Optional[float],
    percentage: Optional[float],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> bool:
    """Process a pool-to-pool transfer"""
    source_pool = db.query(FinancialPool).filter_by(id=source_pool_id).first()
    if not source_pool:
        raise ValueError("Source pool not found")
        
    # Calculate transfer amount
    transfer_amount = amount if amount is not None else (source_pool.balance * percentage / 100)
    
    if transfer_amount > source_pool.balance:
        raise ValueError("Insufficient funds in source pool")
        
    # Perform transfer
    source_pool.balance -= transfer_amount
    destination_pool = db.query(FinancialPool).filter_by(id=destination_pool_id).first()
    destination_pool.balance += transfer_amount
    
    # Record transaction
    # Add your transaction recording logic here
    
    return True

async def process_bank_transfer(
    source_pool_id: int,
    destination_account_id: int,
    is_external: bool,
    amount: Optional[float],
    percentage: Optional[float],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> bool:
    """Process a transfer to a bank account"""
    source_pool = db.query(FinancialPool).filter_by(id=source_pool_id).first()
    if not source_pool:
        raise ValueError("Source pool not found")
        
    # Calculate transfer amount
    transfer_amount = amount if amount is not None else (source_pool.balance * percentage / 100)
    
    if transfer_amount > source_pool.balance:
        raise ValueError("Insufficient funds in source pool")
        
    # Deduct from source pool
    source_pool.balance -= transfer_amount
    
    if is_external:
        # Process external bank transfer
        # Add your external transfer logic here
        pass
    else:
        # Process internal BAM transfer
        destination_account = db.query(BankAccount).filter_by(id=destination_account_id).first()
        if not destination_account:
            raise ValueError("Destination account not found")
            
        destination_account.balance += transfer_amount
        
    # Record transaction
    # Add your transaction recording logic here
    
    return True