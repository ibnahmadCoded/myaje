# automation_processor.py
from datetime import datetime
import asyncio
from sqlalchemy import and_
from sqlalchemy.orm import Session
from models import (BankingAutomation, BankAccount, User, ExternalAccount, 
                    Payment, AccountSource, PaymentStatus, PaymentType,
                    Transaction, TransactionTag, TransactionType, Notification,
                    NotificationType, AccountType, FinancialPool)
from utils.cache_constants import CacheNamespace
from utils.cache_manager import cache_manager
from banking_automations.automation_functions import calculate_next_run
from sql_database import get_db
import logging
import uuid

logger = logging.getLogger(__name__)

async def process_automations():
    """
    Continuously checks and processes due automations.
    """
    while True:
        try:
            with next(get_db()) as db:  # Ensures session cleanup
                current_time = datetime.utcnow()
                
                # Fetch due automations
                due_automations = db.query(BankingAutomation).filter(
                    and_(
                        BankingAutomation.is_active == True,
                        BankingAutomation.next_run <= current_time
                    )
                ).all()
                
                for automation in due_automations:
                    try:
                        await process_single_automation(automation, db)
                    except Exception as e:
                        logger.error(
                            f"Error processing automation {automation.id} for user {automation.user_id}: {str(e)}"
                        )
                        continue
                
            # Wait before the next check
            await asyncio.sleep(60)
        
        except Exception as e:
            logger.error(f"Error in automation processor: {str(e)}")
            await asyncio.sleep(60)  # Prevents tight looping on error
            continue


async def process_single_automation(automation: BankingAutomation, db: Session):
    """
    Process a single automation and update its next run time.
    """
    try:
        # Calculate transfer amount
        transfer_amount = automation.amount if automation.amount is not None else (
            automation.source_pool.balance * automation.percentage / 100
        )
        
        if transfer_amount > automation.source_pool.balance:
            logger.error(f"Insufficient funds in pool for automation {automation.id}")
            return
        
        if automation.type == "pool_transfer":
            await process_automated_pool_transfer(automation, transfer_amount, db)
        else:  # bank_transfer
            await process_automated_bank_transfer(automation, transfer_amount, db)

        # Update run timestamps
        automation.last_run = datetime.utcnow()
        automation.next_run = calculate_next_run(
            automation.schedule,
            automation.schedule_details.__dict__,
            from_date=automation.last_run
        )
        db.commit()

    except Exception as e:
        db.rollback()
        logger.error(f"Error in single automation {automation.id}: {str(e)}")
        raise

async def process_automated_pool_transfer(automation: BankingAutomation, transfer_amount: float, db: Session):
    """
    Process an automated pool-to-pool transfer.
    """
    # Verify destination pool exists
    if not automation.destination_pool:
        logger.error(f"Destination pool not found for automation {automation.id}")
        return
        
    # Create payment record
    payment = Payment(
        from_account_id=automation.bank_account_id,
        from_account_source=AccountSource.INTERNAL,
        to_account_id=automation.bank_account_id,  # Same account for pool transfers
        to_account_source=AccountSource.INTERNAL,
        amount=transfer_amount,
        description=f"Automated pool transfer: {automation.name}",
        reference_number=f"ATP-{uuid.uuid4().hex[:8].upper()}",
        payment_type=PaymentType.TRANSFER,
        status=PaymentStatus.COMPLETED,
        completed_at=datetime.utcnow()
    )
    db.add(payment)
    db.flush()

    # Create transactions
    debit_transaction = Transaction(
        bank_account_id=automation.bank_account_id,
        type=TransactionType.DEBIT,
        amount=transfer_amount,
        description=f"Pool transfer from {automation.source_pool.name} to {automation.destination_pool.name}",
        reference=payment.reference_number,
        tag=TransactionTag.TRANSFER,
        payment_id=payment.id
    )
    db.add(debit_transaction)

    # Update pool balances
    automation.source_pool.balance -= transfer_amount
    automation.destination_pool.balance += transfer_amount

    # Create notification for the user
    notification = Notification(
        user_id=automation.user_id,
        type=NotificationType.AUTOMATION_EXECUTED,
        text=f"Automated pool transfer completed: ₦{transfer_amount:,.2f} from {automation.source_pool.name} to {automation.destination_pool.name}",
        reference_id=payment.id,
        reference_type="payment",
        notification_metadata={
            'amount': transfer_amount,
            'automation_name': automation.name,
            'source_pool': automation.source_pool.name,
            'destination_pool': automation.destination_pool.name,
            'user_view': automation.user.active_view
        }
    )
    db.add(notification)

async def process_automated_bank_transfer(automation: BankingAutomation, transfer_amount: float, db: Session):
    """
    Process an automated bank transfer (either to external bank or BAM account).
    """
    is_bam_transfer = automation.destination_bam_account_id is not None
    
    if is_bam_transfer:
        # Get recipient's BAM account
        recipient_account = db.query(BankAccount).filter(
            BankAccount.id == automation.destination_bam_account_id
        ).first()

        if not recipient_account:
            logger.error(f"Recipient BAM account not found for automation {automation.id}")
            return

        recipient_user = db.query(User).filter(
            User.id == recipient_account.user_id
        ).first()
        
        if not recipient_user:
            logger.error(f"Recipient BAM user not found for automation {automation.id}")
            return

        # Create payment record for BAM transfer
        payment = Payment(
            from_account_id=automation.bank_account_id,
            from_account_source=AccountSource.INTERNAL,
            to_account_id=recipient_account.id,
            to_account_source=AccountSource.INTERNAL,
            amount=transfer_amount,
            description=f"Automated BAM transfer: {automation.name}",
            reference_number=f"ATB-{uuid.uuid4().hex[:8].upper()}",
            payment_type=PaymentType.TRANSFER,
            status=PaymentStatus.COMPLETED,
            completed_at=datetime.utcnow()
        )
        
    else:
        # Create payment record for external transfer
        payment = Payment(
            from_account_id=automation.bank_account_id,
            from_account_source=AccountSource.INTERNAL,
            to_external_account_id=automation.destination_account_id,
            to_account_source=AccountSource.EXTERNAL,
            amount=transfer_amount,
            description=f"Automated bank transfer: {automation.name}",
            reference_number=f"ATB-{uuid.uuid4().hex[:8].upper()}",
            payment_type=PaymentType.TRANSFER,
            status=PaymentStatus.COMPLETED,
            completed_at=datetime.utcnow()
        )

    db.add(payment)
    db.flush()

    # Create debit transaction
    debit_transaction = Transaction(
        bank_account_id=automation.bank_account_id,
        type=TransactionType.DEBIT,
        amount=transfer_amount,
        description=f"Automated transfer to {automation.destination_account.account_number if not is_bam_transfer else automation.destination_bam_account.account_number}",
        reference=payment.reference_number,
        tag=TransactionTag.TRANSFER,
        payment_id=payment.id
    )
    db.add(debit_transaction)

    # Update source pool balance
    automation.source_pool.balance -= transfer_amount

    # Update source account balance
    automation.bank_account.balance -= transfer_amount
    
    if is_bam_transfer:
        # Update recipient's balance and create credit transaction
        recipient_account.balance += transfer_amount
        
        # Get receiver's credit pool
        receiver_credit_pool = db.query(FinancialPool).filter(
            FinancialPool.bank_account_id == recipient_account.id,
            FinancialPool.is_credit_pool == True
        ).first()
        
        if receiver_credit_pool:
            receiver_credit_pool.balance += transfer_amount

        credit_transaction = Transaction(
            bank_account_id=recipient_account.id,
            type=TransactionType.CREDIT,
            amount=transfer_amount,
            description=f"Automated transfer from {automation.bank_account.account_number}",
            reference=payment.reference_number,
            tag=TransactionTag.TRANSFER,
            payment_id=payment.id
        )
        db.add(credit_transaction)

        account_type = 'personal' if recipient_account.account_type == AccountType.PERSONAL else 'business'

        # Create notification for recipient
        recipient_notification = Notification(
            user_id=recipient_user.id,
            type=NotificationType.PAYMENT_RECEIVED,
            text=f"You received ₦{transfer_amount:,.2f} from automated transfer",
            reference_id=payment.id,
            reference_type="payment",
            notification_metadata={
                'amount': transfer_amount,
                'sender_email': automation.user.email,
                'automation_name': automation.name,
                'user_view': account_type
            }
        )
        db.add(recipient_notification)

        # Invalidate recipient's cache
        cache_manager.invalidate_user_cache(
            recipient_user.id,
            [CacheNamespace.ACCOUNT, CacheNamespace.TRANSACTION]
        )

    # Create notification for sender
    sender_notification = Notification(
        user_id=automation.user_id,
        type=NotificationType.AUTOMATION_EXECUTED,
        text=f"Automated bank transfer completed: ₦{transfer_amount:,.2f} to {automation.destination_account.account_number if not is_bam_transfer else automation.destination_bam_account.account_number}",
        reference_id=payment.id,
        reference_type="payment",
        notification_metadata={
            'amount': transfer_amount,
            'automation_name': automation.name,
            'recipient': automation.destination_account.account_number if not is_bam_transfer else automation.destination_bam_account.account_number,
            'user_view': automation.user.active_view
        }
    )
    db.add(sender_notification)