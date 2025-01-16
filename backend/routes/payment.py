from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends
import requests
from sqlalchemy import and_
from sqlalchemy.orm import Session
from models import (User, BankAccount, Payment, PaymentStatus, Loan, Notification,
                    AccountType, Order, OrderStatus, PaymentType, RestockRequest,
                    RestockRequestStatus, AccountSource, Product, StorefrontProduct,
                    NotificationType, MarketplaceOrder, OrderItem, Payout)
from sql_database import get_db
from sqlalchemy.sql import func
from config import PERSONAL_LOAN_TIERS, MYAJE_BANK_ACCOUNT_ID, BUSINESS_LOAN_TIERS, PAYSTACK_BASE_URL, PAYSTACK_SECRET
from routes.auth import get_optional_current_user
from enum import Enum
import logging
import uuid

router = APIRouter()

class PaymentMethod(Enum):
    CARD = "card"
    BANK_TRANSFER = "bank_transfer"
    BNPL_7 = "bnpl_7"
    BNPL_15 = "bnpl_15"
    BNPL_30 = "bnpl_30"
    BORROW = "borrow"
    INSTALLMENT_2 = "installment_2"
    INSTALLMENT_3 = "installment_3"
    INSTALLMENT_4 = "installment_4"

async def verify_user_eligibility(
    user_id: int,
    payment_method: PaymentMethod,
    amount: float,
    db: Session
) -> bool:
    """Verify if user is eligible for the selected payment method"""
    if payment_method in [
        PaymentMethod.BNPL_7,
        PaymentMethod.BNPL_15,
        PaymentMethod.BNPL_30,
        PaymentMethod.BORROW,
        PaymentMethod.INSTALLMENT_2,
        PaymentMethod.INSTALLMENT_3,
        PaymentMethod.INSTALLMENT_4
    ]:
        # Check if user exists and has bank account
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        bank_account = db.query(BankAccount).filter(
            BankAccount.user_id == user_id,
            BankAccount.is_active == True
        ).first()
        
        if not bank_account:
            raise HTTPException(
                status_code=400,
                detail="Active bank account required for this payment method"
            )

        # For borrow to pay, check purchase history
        if payment_method == PaymentMethod.BORROW:
            purchase_count = db.query(Payment).filter(
                Payment.from_account_id == bank_account.id,
                Payment.status == PaymentStatus.COMPLETED
            ).count()

            eligible_amount = 0
            for tier in PERSONAL_LOAN_TIERS:
                if purchase_count >= tier["purchases"]:
                    eligible_amount = tier["amount"]

            if amount > eligible_amount:
                raise HTTPException(
                    status_code=400,
                    detail=f"Not eligible for loan amount. Maximum eligible amount: ₦{eligible_amount}"
                )

    return True

async def create_payment_record(
    payment_data: Dict,
    payment_method: PaymentMethod,
    db: Session
) -> Payment:
    """Create payment record in database"""
    payment_type = None
    reference_number = None
    if payment_data["payment_method"] == "card":
        payment_type = PaymentType.ORDER_CARD
        reference_number = f"ORDCRD-{uuid.uuid4().hex[:8].upper()}"
    elif payment_data["payment_method"] == "bank_transfer":
        payment_type = PaymentType.ORDER_TRANSFER
        reference_number = f"ORDTRF-{uuid.uuid4().hex[:8].upper()}"
    elif payment_data["payment_method"] == "installment":
        payment_type = PaymentType.ORDER_TRANSFER
        reference_number = f"ORDINS-{uuid.uuid4().hex[:8].upper()}"
    elif payment_data["payment_method"] == "bnpl":
        payment_type = PaymentType.BUY_NOW_PAY_LATER
        reference_number = f"ORDBNPL-{uuid.uuid4().hex[:8].upper()}"

    payment = Payment(
        payment_type=payment_type,
        amount=payment_data["amount"],
        status=PaymentStatus.PENDING,
        from_account_source=AccountSource.EXTERNAL, # fow now, no bam
        to_account_source=AccountSource.EXTERNAL, # for now, no BAM pay
        reference_number=reference_number
    )

    # Set payment specific fields
    if payment_method in [PaymentMethod.BNPL_7, PaymentMethod.BNPL_15, PaymentMethod.BNPL_30]:
        days = int(payment_method.value.split("_")[1])
        payment.due_date = datetime.utcnow() + timedelta(days=days)
    
    elif payment_method in [
        PaymentMethod.INSTALLMENT_2,
        PaymentMethod.INSTALLMENT_3,
        PaymentMethod.INSTALLMENT_4
    ]:
        installments = int(payment_method.value.split("_")[1])
        payment.total_installments = installments
        payment.current_installment = 1
        payment.installment_amount = payment_data["amount"] / installments
    
    elif payment_method == PaymentMethod.BORROW:
        # Create loan record (fix this later)
        loan = Loan(
            user_id=payment_data["user_id"],
            bank_account_id=payment_data["from_account_id"],
            amount=payment_data["amount"],
            purpose="Purchase payment",
            status="active",
            remaining_amount=payment_data["amount"]
        )
        db.add(loan)
        db.flush()
        payment.loan_id = loan.id

    db.add(payment)
    db.flush()
    return payment

async def initialize_paystack_payment(amount: float, email: str, payment_method: str, reference: str) -> Dict:
    """Initialize payment with Paystack"""
    try:
        headers = {
            "Authorization": f"Bearer {PAYSTACK_SECRET}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "amount": int(amount * 100),  # Convert to kobo
            "email": email,
            "reference": reference,
            "channels": ["card"] if payment_method == "card" else ["bank_transfer"],
            "callback_url": "your_callback_url"
        }
        
        response = requests.post(
            f"{PAYSTACK_BASE_URL}/transaction/initialize",
            json=payload,
            headers=headers
        )
        
        response.raise_for_status()
        return response.json()["data"]
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/eligibility")
async def get_eligibility(
    active_view: str = Query(..., regex="^(personal|business)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_current_user)
):
    if not active_view:
        return None  
    try:
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
            
            for tier in loan_tiers:
                if total_purchases >= tier["purchases"]:
                    available_limit = tier["amount"] # this is the limit

                    # calculate avaliable amount, which is limit - (total_loans - total_loan_repayments)
                    available_amount = available_limit - (total_loans_sum - total_loan_repayments_sum)
                    break   

 
            return {
                "has_active_bank": True if bank_account else False,
                "can_loan": True if available_amount > 0 else False,
                "max_loan_amount": available_amount
            }
        
        else:  # business view
            return None # People should always make purchases from personal accounts. 
    except requests.exceptions.RequestException as e:
        return None

@router.post("/verify")
async def verify_payment(
    verification_data: Dict[str, str],
    db: Session = Depends(get_db)
):
    """Verify payment with Paystack"""
    try:
        headers = {
            "Authorization": f"Bearer {PAYSTACK_SECRET}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(
            f"{PAYSTACK_BASE_URL}/transaction/verify/{verification_data['reference']}",
            headers=headers
        )
        
        response.raise_for_status()
        verification_data = response.json()["data"]
        
        if verification_data["status"] == "success":
            # Update payment record
            payment = db.query(Payment).filter(
                Payment.reference_number == verification_data["reference"]
            ).first()
            
            if not payment:
                raise HTTPException(status_code=404, detail="Payment not found")
            
            payment.status = PaymentStatus.COMPLETED
            payment.gateway_transaction_id = verification_data["id"]
            payment.completed_at = datetime.utcnow()
            
            db.commit()
            
            return {"status": "success", "message": "Payment verified successfully"}
        else:
            # Get marketplace order and related data
            marketplace_payment = db.query(Payment).filter(
                Payment.reference_number == verification_data["reference"]
            ).first()
            
            if marketplace_payment:
                marketplace_order = db.query(MarketplaceOrder).filter(
                    MarketplaceOrder.id == marketplace_payment.marketplace_order_id
                ).first()
                
                if marketplace_order:
                    # Get all seller orders
                    seller_orders = db.query(Order).filter(
                        Order.marketplace_order_id == marketplace_order.id
                    ).all()
                    
                    # Delete all related data
                    for order in seller_orders:
                        # Delete order items
                        db.query(OrderItem).filter(OrderItem.order_id == order.id).delete()
                        
                        # Delete order payments
                        db.query(Payment).filter(Payment.order_id == order.id).delete()
                        
                        # Delete order payouts
                        db.query(Payout).filter(Payout.order_id == order.id).delete()
                        
                        # Delete notifications
                        db.query(Notification).filter(
                            and_(
                                Notification.reference_id == order.id,
                                Notification.reference_type == "order"
                            )
                        ).delete()
                        
                        # Delete the order itself
                        db.delete(order)
                    
                    # Delete marketplace payment
                    db.delete(marketplace_payment)
                    
                    # Delete marketplace order
                    db.delete(marketplace_order)
                    
                    db.commit()
            
            raise HTTPException(status_code=400, detail="Payment verification failed")
            
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=400, detail=str(e))

# initialize_payment route
@router.post("/initialize")
async def initialize_payment(
    payment_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_current_user)
):
    """Initialize payment process"""
    try:
        payment_method = PaymentMethod(payment_data["payment_method"])
        
        order = payment_data
        seller_items: Dict[int, List[dict]] = {}
        total_amount = 0
        
        # Extract customer info from nested structure
        customer_info = order["customer_info"]
        
        # Verify all products and group by seller
        for item in order["items"]:
            storefront_product = db.query(StorefrontProduct).join(Product).filter(
                Product.id == item["product_id"]
            ).first()
            
            if not storefront_product:
                raise HTTPException(
                    status_code=404,
                    detail=f"Product {item['product_id']} not found in marketplace"
                )
            
            product = storefront_product.product
            seller_id = storefront_product.user_id
            
            # Check stock
            if product.quantity < item["quantity"]:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for product {product.name}"
                )
            
            # Calculate item total
            item_total = storefront_product.storefront_price * item["quantity"]
            total_amount += item_total
            
            # Group by seller
            if seller_id not in seller_items:
                seller_items[seller_id] = []
                
            seller_items[seller_id].append({
                "product_id": item["product_id"],
                "quantity": item["quantity"],
                "price": storefront_product.storefront_price,
                "name": product.name
            })
        try:
            # Create marketplace order using nested customer info
            marketplace_order = MarketplaceOrder(
                customer_name=customer_info["name"],
                customer_email=customer_info["email"],
                customer_phone=customer_info["phone"],
                shipping_address=customer_info["address"],
                total_amount=total_amount,
                payment_info={},  # You might want to store payment method here
                order_type=order["order_type"]
            )
            db.add(marketplace_order)
            db.flush()

            # Create payment record for marketplace order
            payment_type = None
            reference_number = None
            if order["payment_method"] == "card":
                payment_type = PaymentType.ORDER_CARD
                reference_number = f"ORDCRD-{uuid.uuid4().hex[:8].upper()}"
            elif order["payment_method"] == "bank_transfer":
                payment_type = PaymentType.ORDER_TRANSFER
                reference_number = f"ORDTRF-{uuid.uuid4().hex[:8].upper()}"

            marketplace_order_payment = Payment(
                payment_type=payment_type,
                amount=order["amount"],
                status=PaymentStatus.PENDING,
                from_account_source=AccountSource.EXTERNAL,
                to_account_source=AccountSource.EXTERNAL,
                reference_number=reference_number,
                marketplace_order_id=marketplace_order.id
            )
            
            db.add(marketplace_order_payment)
            db.flush()

            marketplace_order.payment_id = marketplace_order_payment.id
            
            # Create individual seller orders
            seller_orders = []
            for seller_id, items in seller_items.items():
                seller_total = sum(item["price"] * item["quantity"] for item in items)
                
                buyer_id = current_user.id if current_user else None
                seller_order = Order(
                    marketplace_order_id=marketplace_order.id,
                    seller_id=seller_id,
                    buyer_id=buyer_id,
                    customer_name=customer_info["name"],
                    customer_email=customer_info["email"],
                    customer_phone=customer_info["phone"],
                    shipping_address=customer_info["address"],
                    total_amount=seller_total,
                    status=OrderStatus.pending,
                    order_type=order["order_type"]
                )
                db.add(seller_order)
                db.flush()
                
                # Create order items and update inventory
                for item in items:
                    order_item = OrderItem(
                        order_id=seller_order.id,
                        product_id=item["product_id"],
                        quantity=item["quantity"],
                        price=item["price"]
                    )
                    db.add(order_item)
                    
                    # Update product quantity
                    product = db.query(Product).filter(Product.id == item["product_id"]).first()
                    product.quantity -= item["quantity"]
                
                # Create payment record for each seller order
                if order["order_type"] == "payment":
                    payment_type = None
                    reference_number = None
                    if order["payment_method"] == "card":
                        payment_type = PaymentType.ORDER_CARD
                        reference_number = f"ORDCRD-{uuid.uuid4().hex[:8].upper()}"
                    elif order["payment_method"] == "bank_transfer":
                        payment_type = PaymentType.ORDER_TRANSFER
                        reference_number = f"ORDTRF-{uuid.uuid4().hex[:8].upper()}"

                    order_payment = Payment(
                        payment_type=payment_type,
                        order_id=seller_order.id,
                        amount=seller_total,
                        status=PaymentStatus.PENDING,
                        from_account_source=AccountSource.EXTERNAL,
                        to_account_source=AccountSource.EXTERNAL,
                        reference_number=reference_number
                    )
                    
                    db.add(order_payment)
                
                seller_orders.append(seller_order)

                # Create notification
                notification = Notification(
                    user_id=seller_order.seller_id,
                    type=NotificationType.NEW_ORDER,
                    text=f"New order and payment received #{seller_order.id} from {customer_info['name']}",
                    notification_metadata={
                        'user_view': 'business',
                        'order_amount': float(seller_order.total_amount),
                        'customer_name': customer_info['name'],
                        'order_items_count': len(items)
                    },
                    reference_id=seller_order.id,
                    reference_type="order"
                )
                db.add(notification)

                # Create payout record
                payout = Payout(
                    seller_id=seller_id,
                    order_id=seller_order.id,
                    amount=seller_total,
                    status='PENDING'
                )
                db.add(payout)

            response_data = {
                "reference_number": marketplace_order_payment.reference_number
            }
            
            if payment_method in [PaymentMethod.CARD, PaymentMethod.BANK_TRANSFER]:
                paystack_data = await initialize_paystack_payment(
                    payment_data["amount"],
                    payment_data["email"],
                    payment_method.value,
                    marketplace_order_payment.reference_number
                )
                response_data.update(paystack_data)
            
            db.commit()
            return response_data
            
        except Exception as e:
            db.rollback()
            logging.error(f"Error submitting order: {str(e)}")
            raise HTTPException(status_code=500, detail="Error processing order")
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))