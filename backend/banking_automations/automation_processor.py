from datetime import datetime, timedelta
import asyncio
from sqlalchemy import and_
from sqlalchemy.orm import Session
from fastapi import BackgroundTasks
from models import BankingAutomation, BankAccount, User, ExternalAccount
from banking_automations.automation_functions import process_pool_transfer, process_bank_transfer, calculate_next_run
from sql_database import get_db
import logging

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
        if automation.type == "pool_transfer":
            await process_pool_transfer(
                user_id=automation.user_id,
                source_pool_id=automation.source_pool_id,
                destination_pool_id=automation.destination_pool_id,
                amount=automation.amount,
                percentage=automation.percentage,
                db=db
            )
        else:  # bank_transfer
            await handle_bank_transfer(automation, db)

        # Update run timestamps
        automation.last_run = datetime.utcnow()
        automation.next_run = calculate_next_run(automation.schedule)
        db.commit()

    except Exception as e:
        db.rollback()
        logger.error(f"Error in single automation {automation.id}: {str(e)}")
        raise


async def handle_bank_transfer(automation: BankingAutomation, db: Session):
    """
    Handle bank transfer automations.
    """
    if automation.destination_account:  # External bank
        destination = db.query(ExternalAccount).filter_by(
            account_number=automation.destination_account
        ).first()

        if not destination:
            raise ValueError("Destination account not found")

        await process_bank_transfer(
            user_id=automation.user_id,
            source_pool_id=automation.source_pool_id,
            destination_account_id=destination.id,
            is_external=True,
            amount=automation.amount,
            percentage=automation.percentage,
            db=db
        )
    else:  # BAM bank transfer
        destination_account = db.query(BankAccount).join(User).filter(
            User.phone == automation.destination_bam_details['phone'],
            BankAccount.account_type == automation.destination_bam_details['account_type']
        ).first()

        if not destination_account:
            raise ValueError("BAM destination account not found")

        await process_bank_transfer(
            user_id=automation.user_id,
            source_pool_id=automation.source_pool_id,
            destination_account_id=destination_account.id,
            is_external=False,
            amount=automation.amount,
            percentage=automation.percentage,
            db=db
        )
