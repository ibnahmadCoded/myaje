from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, func
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, List
from enum import Enum

from sql_database import get_db
from models import User, Order, OrderItem, Product, ProductReview, ProductWishlist
from .auth import get_current_user
from utils.helper_functions import serialize_datetime

router = APIRouter()

class OrderFilter(str, Enum):
    ALL = "all"
    PENDING = "pending"
    FULFILLED = "fulfilled"
    CANCELLED = "cancelled"

@router.get("/orders")
async def get_my_orders(
    status: OrderFilter = OrderFilter.ALL,
    category: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    search: Optional[str] = None,
    page: int = Query(1, gt=0),
    limit: int = Query(10, gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Order).filter(Order.buyer_id == current_user.id)
    
    # Apply status filter
    if status != OrderFilter.ALL:
        query = query.filter(Order.status == status)
    
    # Apply date filters
    if start_date:
        query = query.filter(Order.created_at >= start_date)
    if end_date:
        query = query.filter(Order.created_at <= end_date)
    
    # Apply category and search filters through join with OrderItem and Product
    if category or search:
        query = query.join(OrderItem).join(Product)
        if category:
            query = query.filter(Product.category == category)
        if search:
            query = query.filter(Product.name.ilike(f"%{search}%"))
    
    # Get total count before pagination
    total_count = query.count()
    
    # Apply pagination
    query = query.order_by(desc(Order.created_at))\
                 .offset((page - 1) * limit)\
                 .limit(limit)
    
    orders = query.all()
    
    return {
        "items": [
            {
                "id": order.id,
                "status": order.status.value,
                "total_amount": order.total_amount,
                "created_at": serialize_datetime(order.created_at),
                "items": [
                    {
                        "id": item.product.id,
                        "name": item.product.name,
                        "quantity": item.quantity,
                        "price": item.price,
                        "category": item.product.category,
                        "images": [img.image_url for img in item.product.images],
                    }
                    for item in order.items
                ]
            }
            for order in orders
        ],
        "total": total_count,
        "page": page,
        "pages": (total_count + limit - 1) // limit
    }

@router.get("/reviews")
async def get_my_reviews(
    search: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    page: int = Query(1, gt=0),
    limit: int = Query(10, gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ProductReview).filter(ProductReview.user_id == current_user.id)
    
    # Apply date filters
    if start_date:
        query = query.filter(ProductReview.created_at >= start_date)
    if end_date:
        query = query.filter(ProductReview.created_at <= end_date)
    
    # Apply search filter
    if search:
        query = query.join(Product).filter(Product.name.ilike(f"%{search}%"))
    
    # Get total count before pagination
    total_count = query.count()
    
    # Apply pagination
    query = query.order_by(desc(ProductReview.created_at))\
                 .offset((page - 1) * limit)\
                 .limit(limit)
    
    reviews = query.all()
    
    return {
        "items": [
            {
                "id": review.id,
                "product": {
                    "id": review.product.id,
                    "name": review.product.name,
                    "price": review.product.price,
                    "category": review.product.category,
                    "images": [img.image_url for img in review.product.images],
                },
                "rating": review.rating,
                "review_text": review.review_text,
                "created_at": serialize_datetime(review.created_at)
            }
            for review in reviews
        ],
        "total": total_count,
        "page": page,
        "pages": (total_count + limit - 1) // limit
    }

@router.get("/wishlist")
async def get_my_wishlist(
    search: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    page: int = Query(1, gt=0),
    limit: int = Query(10, gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ProductWishlist).filter(ProductWishlist.user_id == current_user.id)
    
    # Apply date filters
    if start_date:
        query = query.filter(ProductWishlist.created_at >= start_date)
    if end_date:
        query = query.filter(ProductWishlist.created_at <= end_date)
    
    # Apply search filter
    if search:
        query = query.join(Product).filter(Product.name.ilike(f"%{search}%"))
    
    # Get total count before pagination
    total_count = query.count()
    
    # Apply pagination
    query = query.order_by(desc(ProductWishlist.created_at))\
                 .offset((page - 1) * limit)\
                 .limit(limit)
    
    wishlist_items = query.all()
    
    return {
        "items": [
            {
                "id": item.id,
                "product": {
                    "id": item.product.id,
                    "name": item.product.name,
                    "price": item.product.price,
                    "category": item.product.category,
                    "images": [img.image_url for img in item.product.images],
                },
                "created_at": serialize_datetime(item.created_at)
            }
            for item in wishlist_items
        ],
        "total": total_count,
        "page": page,
        "pages": (total_count + limit - 1) // limit
    }