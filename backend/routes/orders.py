# routes/orders.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional, Dict, Literal
from datetime import datetime
from models import MarketplaceOrder, Order, OrderItem, User, Product, OrderStatus, StorefrontProduct, InvoiceRequest, InvoiceStatus, Payment
from routes.notifications import create_notification, NotificationType
from routes.invoice import notify_seller_of_new_invoice
from sql_database import get_db
from routes.auth import get_current_user
from pydantic import BaseModel, EmailStr
import logging
from utils.cache_constants import CACHE_KEYS
from utils.cache_decorators import cache_response, CacheNamespace, invalidate_cache
from utils.helper_functions import serialize_datetime
from config import CACHE_EXPIRATION_TIME

router = APIRouter()

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int

class MarketplaceOrderCreate(BaseModel):
    order_type: Literal["payment", "invoice"]
    customer_name: str
    customer_email: EmailStr
    customer_phone: Optional[str]
    shipping_address: str
    items: List[OrderItemCreate]
    payment_info: Optional[dict] = None

class OrderUpdate(BaseModel):
    status: OrderStatus

async def notify_seller_of_new_order(db: Session, order):
    await create_notification(
        db=db,
        user_id=order.seller_id,
        type=NotificationType.NEW_ORDER,
        text=f"New order received #{order.id} from {order.customer_name}",
        reference_id=order.id,
        reference_type="order",
        notification_metadata={
            'user_view': 'business',
            'order_amount': float(order.total_amount),
            'customer_name': order.customer_name,
            'order_items_count': len(order.items)
        },
    )

@router.post("/submit")
@invalidate_cache(
    namespaces=[
        CacheNamespace.MARKETPLACE,
        CacheNamespace.ORDER,
        CacheNamespace.INVENTORY
    ],
    custom_keys=[
        lambda result: CACHE_KEYS["marketplace_orders"](),
        lambda result: CACHE_KEYS["marketplace_order"](result["marketplace_order_id"]),
        # Invalidate each seller's order list
        lambda result: [CACHE_KEYS["user_orders"](order["seller_id"]) 
                       for order in result["seller_orders"]]
    ]
)

async def submit_marketplace_order(
    order: MarketplaceOrderCreate,
    db: Session = Depends(get_db)
):
    # Group items by seller
    seller_items: Dict[int, List[dict]] = {}
    total_amount = 0
    
    # Verify all products and group by seller
    for item in order.items:
        storefront_product = db.query(StorefrontProduct).join(Product).filter(
            Product.id == item.product_id
        ).first()
        
        if not storefront_product:
            raise HTTPException(
                status_code=404,
                detail=f"Product {item.product_id} not found in marketplace"
            )
        
        product = storefront_product.product
        seller_id = storefront_product.user_id
        
        # Check stock
        if product.quantity < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for product {product.name}"
            )
        
        # Calculate item total
        item_total = storefront_product.storefront_price * item.quantity
        total_amount += item_total
        
        # Group by seller
        if seller_id not in seller_items:
            seller_items[seller_id] = []
            
        seller_items[seller_id].append({
            "product_id": item.product_id,
            "quantity": item.quantity,
            "price": storefront_product.storefront_price,
            "name": product.name  # Added for invoice generation
        })
    
    try:
        # Create marketplace order
        marketplace_order = MarketplaceOrder(
            customer_name=order.customer_name,
            customer_email=order.customer_email,
            customer_phone=order.customer_phone,
            shipping_address=order.shipping_address,
            total_amount=total_amount,
            payment_info=order.payment_info,
            order_type=order.order_type  # "payment" or "invoice" or "cash (later implementation)"
        )
        db.add(marketplace_order)
        db.flush()
        
        # Create individual seller orders and their corresponding payments/invoices
        seller_orders = []
        for seller_id, items in seller_items.items():
            seller_total = sum(item["price"] * item["quantity"] for item in items)
            
            # Create seller order
            seller_order = Order(
                marketplace_order_id=marketplace_order.id,
                seller_id=seller_id,
                customer_name=order.customer_name,
                customer_email=order.customer_email,
                customer_phone=order.customer_phone,
                shipping_address=order.shipping_address,
                total_amount=seller_total,
                status=OrderStatus.pending,
                order_type=order.order_type
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
            
            # Process payment or create invoice based on order type
            if order.order_type == "payment":
                # Create payment record for this seller's portion
                payment = Payment(
                    order_id=seller_order.id,
                    amount=seller_total,
                    payment_method=order.payment_info["method"],
                    status="pending",
                    payment_details=order.payment_info
                )
                db.add(payment) 

                # we should notify seller of payment here (after payment integration)
            else:  # invoice
                # Create invoice request for this seller's portion
                invoice_request = InvoiceRequest(
                    order_id=seller_order.id,
                    customer_name=order.customer_name,
                    customer_email=order.customer_email,
                    customer_phone=order.customer_phone,
                    shipping_address=order.shipping_address,
                    amount=seller_total,
                    items=[{
                        "product_id": item["product_id"],
                        "quantity": item["quantity"],
                        "price": item["price"],
                        "name": item["name"]
                    } for item in items],
                    status=InvoiceStatus.pending,
                    created_at=datetime.utcnow()
                )
                db.add(invoice_request)
                db.flush()

                # Create notification
                await notify_seller_of_new_invoice(db=db, invoice_request=invoice_request)
            
            seller_orders.append(seller_order)

            # Create notification for this seller
            await notify_seller_of_new_order(db, seller_order)
        
        db.commit()
        
        return {
            "message": "Order submitted successfully",
            "marketplace_order_id": marketplace_order.id,
            "seller_orders": [
                {
                    "seller_id": order.seller_id,
                    "order_id": order.id,
                    "total_amount": order.total_amount,
                    "type": order.order_type
                }
                for order in seller_orders
            ]
        }
        
    except Exception as e:
        db.rollback()
        logging.error(f"Error submitting order: {str(e)}")
        raise HTTPException(status_code=500, detail="Error processing order")

@router.get("/marketplace/{marketplace_order_id}")
@cache_response(expire=CACHE_EXPIRATION_TIME)
async def get_marketplace_order(
    marketplace_order_id: int,
    db: Session = Depends(get_db)
):
    order = db.query(MarketplaceOrder).filter(
        MarketplaceOrder.id == marketplace_order_id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {
        "id": order.id,
        "customer_name": order.customer_name,
        "customer_email": order.customer_email,
        "customer_phone": order.customer_phone,
        "shipping_address": order.shipping_address,
        "total_amount": order.total_amount,
        "created_at": serialize_datetime(order.created_at),
        "seller_orders": [{
            "seller_id": seller_order.seller_id,
            "order_id": seller_order.id,
            "total_amount": seller_order.total_amount,
            "status": seller_order.status.value,
            "items": [{
                "product_id": item.product_id,
                "product_name": item.product.name,
                "quantity": item.quantity,
                "price": item.price
            } for item in seller_order.items]
        } for seller_order in order.seller_orders]
    }

@router.get("/seller/list")
@cache_response(expire=CACHE_EXPIRATION_TIME)
async def get_seller_orders(
    status: Optional[OrderStatus] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Order).filter(Order.seller_id == current_user.id)
    
    if status:
        query = query.filter(Order.status == status)
    
    orders = query.order_by(desc(Order.created_at)).all()
    
    return [{
        "id": order.id,
        "marketplace_order_id": order.marketplace_order_id,
        "customer_name": order.customer_name,
        "customer_email": order.customer_email,
        "customer_phone": order.customer_phone,
        "shipping_address": order.shipping_address,
        "total_amount": order.total_amount,
        "status": order.status.value,
        "created_at": serialize_datetime(order.created_at),
        "items": [{
            "product_id": item.product_id,
            "product_name": item.product.name,
            "quantity": item.quantity,
            "price": item.price
        } for item in order.items]
    } for order in orders]

@router.put("/seller/{order_id}/fulfill")
@invalidate_cache(
    namespaces=[CacheNamespace.ORDER, CacheNamespace.MARKETPLACE],
    custom_keys=[
        lambda result: CACHE_KEYS["order_detail"](result["order_id"]),
        lambda result: CACHE_KEYS["user_orders"](result["user_id"]),
        lambda result: CACHE_KEYS["marketplace_orders"]()
    ]
)
async def fulfill_seller_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.seller_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.status != OrderStatus.pending:
        raise HTTPException(status_code=400, detail="Order cannot be fulfilled")
    
    order.status = OrderStatus.fulfilled
    order.updated_at = datetime.utcnow()
    
    try:
        db.commit()
        return {"message": "Order fulfilled successfully", "order_id": order.id, "user_id": current_user.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/seller/{order_id}")
@invalidate_cache(
    namespaces=[
        CacheNamespace.ORDER,
        CacheNamespace.MARKETPLACE,
        CacheNamespace.INVENTORY,
        CacheNamespace.INVOICE
    ],
    custom_keys=[
        lambda result: CACHE_KEYS["order_detail"](result["order_id"]),
        lambda result: CACHE_KEYS["user_orders"](result["user_id"]),
        lambda result: CACHE_KEYS["marketplace_orders"](),
        lambda result: CACHE_KEYS["user_invoices"](result["user_id"])
    ]
)
async def delete_seller_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Start a transaction
    try:
        order = db.query(Order).filter(
            Order.id == order_id,
            Order.seller_id == current_user.id
        ).first()
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Delete associated unpaid invoice requests
        unpaid_invoices = db.query(InvoiceRequest).filter(
            InvoiceRequest.order_id == order_id,
            InvoiceRequest.status != InvoiceStatus.paid,
            InvoiceRequest.paid_at.is_(None)
        ).all()
        
        for invoice in unpaid_invoices:
            db.delete(invoice)
        
        # Restore product quantities if order is being deleted
        if order.status == OrderStatus.pending:
            for item in order.items:
                product = db.query(Product).filter(Product.id == item.product_id).first()
                if product:
                    product.quantity += item.quantity
        
        # Delete the order (this will cascade delete order items due to relationship config)
        db.delete(order)
        db.commit()
        
        return {
            "message": "Order and associated unpaid invoices deleted successfully",
            "order_id": order.id,
            "user_id": current_user.id,
            "deleted_invoices_count": len(unpaid_invoices)
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))