# routes/orders.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional, Dict
from datetime import datetime
from models import MarketplaceOrder, Order, OrderItem, User, Product, OrderStatus, StorefrontProduct
from sql_database import get_db
from routes.auth import get_current_user
from pydantic import BaseModel, EmailStr
import logging

router = APIRouter()

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int

class MarketplaceOrderCreate(BaseModel):
    customer_name: str
    customer_email: EmailStr
    customer_phone: Optional[str] = None
    shipping_address: str
    items: List[OrderItemCreate]
    payment_info: Dict  # Payment processing details

class OrderUpdate(BaseModel):
    status: OrderStatus

@router.post("/submit")
async def submit_marketplace_order(
    order: MarketplaceOrderCreate,
    db: Session = Depends(get_db)
):
    # Group items by seller
    seller_items: Dict[int, List[dict]] = {}
    total_amount = 0
    
    # Verify all products and group by seller
    for item in order.items:
        # Get the storefront product (which includes the seller info)
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
            "price": storefront_product.storefront_price
        })
    
    try:
        # Create marketplace order
        marketplace_order = MarketplaceOrder(
            customer_name=order.customer_name,
            customer_email=order.customer_email,
            customer_phone=order.customer_phone,
            shipping_address=order.shipping_address,
            total_amount=total_amount,
            payment_info=order.payment_info
        )
        db.add(marketplace_order)
        db.flush()  # Get the marketplace_order id
        
        # Create individual seller orders
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
                status=OrderStatus.pending
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
            
            seller_orders.append(seller_order)
        
        db.commit()
        
        return {
            "message": "Order submitted successfully",
            "marketplace_order_id": marketplace_order.id,
            "seller_orders": [
                {
                    "seller_id": order.seller_id,
                    "order_id": order.id,
                    "total_amount": order.total_amount
                }
                for order in seller_orders
            ]
        }
        
    except Exception as e:
        db.rollback()
        logging.error(f"Error submitting order: {str(e)}")
        raise HTTPException(status_code=500, detail="Error processing order")

@router.get("/marketplace/{marketplace_order_id}")
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
        "created_at": order.created_at,
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
        "created_at": order.created_at,
        "items": [{
            "product_id": item.product_id,
            "product_name": item.product.name,
            "quantity": item.quantity,
            "price": item.price
        } for item in order.items]
    } for order in orders]

@router.put("/seller/{order_id}/fulfill")
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
        return {"message": "Order fulfilled successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/seller/{order_id}")
async def delete_seller_order(
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
    
    # Restore product quantities if order is being deleted
    if order.status == OrderStatus.pending:
        for item in order.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                product.quantity += item.quantity
    
    db.delete(order)
    
    try:
        db.commit()
        return {"message": "Order deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))