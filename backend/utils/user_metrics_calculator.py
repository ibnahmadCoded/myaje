from sqlalchemy import func, desc, and_
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from models import (Product, Order, OrderStatus, InvoiceRequest, InvoiceStatus,
                    ProductView, ProductWishlist, ProductReview)
from decimal import Decimal
import random  # For dummy data

class MetricsCalculator:
    def __init__(self, db: Session, user_id: int):
        self.db = db
        self.user_id = user_id

    def get_inventory_metrics(self) -> Dict:
        """Calculate inventory-related metrics"""
        total_items = self.db.query(Product).filter(
            Product.user_id == self.user_id
        ).count()

        low_stock_items = self.db.query(Product).filter(
            Product.user_id == self.user_id,
            Product.quantity <= Product.low_stock_threshold
        ).count()

        out_of_stock = self.db.query(Product).filter(
            Product.user_id == self.user_id,
            Product.quantity == 0
        ).count()

        categories = self.db.query(Product.category).filter(
            Product.user_id == self.user_id,
            Product.category != None  # Exclude null categories
        ).distinct().count()

        return {
            "total_items": {
                "value": total_items,
                "trend": self._calculate_dummy_trend()
            },
            "low_stock": {
                "value": low_stock_items,
                "trend": self._calculate_dummy_trend(),
                "status": "warning" if low_stock_items > 0 else "normal"
            },
            "out_of_stock": {
                "value": out_of_stock,
                "trend": self._calculate_dummy_trend(),
                "status": "danger" if out_of_stock > 0 else "normal"
            },
            "categories": {
                "value": categories,
                "trend": "0%"  # Categories typically don't change frequently
            }
        }

    def get_orders_metrics(self) -> Dict:
        """Calculate order-related metrics"""
        # Get current date range
        now = datetime.utcnow()
        thirty_days_ago = now - timedelta(days=30)

        # New orders (created in last 24 hours)
        new_orders = self.db.query(Order).filter(
            Order.seller_id == self.user_id,
            Order.created_at >= now - timedelta(days=1)
        ).count()

        # Processing orders
        processing = self.db.query(Order).filter(
            Order.seller_id == self.user_id,
            Order.status == OrderStatus.pending
        ).count()

        # Shipped/fulfilled orders
        shipped = self.db.query(Order).filter(
            Order.seller_id == self.user_id,
            Order.status == OrderStatus.fulfilled,
            Order.updated_at >= thirty_days_ago
        ).count()

        # Returns (dummy data as we don't have returns in our model)
        returns = random.randint(2, 6)  # Dummy value

        return {
            "new_orders": {
                "value": new_orders,
                "trend": self._calculate_dummy_trend()
            },
            "processing": {
                "value": processing,
                "trend": self._calculate_dummy_trend()
            },
            "shipped": {
                "value": shipped,
                "trend": self._calculate_dummy_trend()
            },
            "returns": {
                "value": returns,
                "trend": self._calculate_dummy_trend(),
                "status": "warning" if returns > 5 else "normal"
            }
        }

    def get_restock_metrics(self) -> Dict:
        """Calculate restock-related metrics (dummy data as we don't have restock model)"""
        return {
            "new_requests": {
                "value": random.randint(5, 10),
                "trend": self._calculate_dummy_trend()
            },
            "in_progress": {
                "value": random.randint(8, 15),
                "trend": self._calculate_dummy_trend()
            },
            "fulfilled": {
                "value": random.randint(20, 30),
                "trend": self._calculate_dummy_trend()
            },
            "urgent": {
                "value": random.randint(2, 5),
                "trend": self._calculate_dummy_trend(),
                "status": "warning"
            }
        }

    def get_invoice_metrics(self) -> Dict:
        """Calculate invoice-related metrics for the current user through order relationship"""
        # Base query joining InvoiceRequest with Order to get seller's invoices
        base_query = self.db.query(InvoiceRequest).join(
            Order,
            InvoiceRequest.order_id == Order.id
        ).filter(
            Order.seller_id == self.user_id
        )
        
        # Pending invoices
        pending = base_query.filter(
            InvoiceRequest.status == InvoiceStatus.pending
        ).count()

        # Sent invoices
        sent = base_query.filter(
            InvoiceRequest.status == InvoiceStatus.sent
        ).count()

        # Paid invoices
        paid = base_query.filter(
            InvoiceRequest.status == InvoiceStatus.paid
        ).count()

        # Overdue invoices
        overdue = base_query.filter(
            InvoiceRequest.status == InvoiceStatus.overdue
        ).count()

        return {
            "pending": {
                "value": pending,
                "trend": self._calculate_dummy_trend()
            },
            "sent": {
                "value": sent,
                "trend": self._calculate_dummy_trend()
            },
            "paid": {
                "value": paid,
                "trend": self._calculate_dummy_trend()
            },
            "overdue": {
                "value": overdue,
                "trend": self._calculate_dummy_trend(),
                "status": "danger" if overdue > 0 else "normal"
            }
        }

    def get_gmv_metrics(self) -> Dict:
        """Calculate Gross Merchandise Value metrics"""
        # Current month GMV
        now = datetime.utcnow()
        start_of_month = datetime(now.year, now.month, 1)
        
        current_month_gmv = self.db.query(func.sum(Order.total_amount)).filter(
            Order.seller_id == self.user_id,
            Order.created_at >= start_of_month,
            Order.status != OrderStatus.cancelled
        ).scalar() or Decimal('0')

        # Previous month GMV
        start_of_prev_month = (start_of_month - timedelta(days=1)).replace(day=1)
        prev_month_gmv = self.db.query(func.sum(Order.total_amount)).filter(
            Order.seller_id == self.user_id,
            Order.created_at >= start_of_prev_month,
            Order.created_at < start_of_month,
            Order.status != OrderStatus.cancelled
        ).scalar() or Decimal('0')

        # Calculate growth percentage
        if prev_month_gmv > 0:
            growth_percentage = ((current_month_gmv - prev_month_gmv) / prev_month_gmv) * 100
        else:
            growth_percentage = 100 if current_month_gmv > 0 else 0

        return {
            "current_month_gmv": float(current_month_gmv),
            "prev_month_gmv": float(prev_month_gmv),
            "growth_percentage": float(growth_percentage)
        }

    def _calculate_dummy_trend(self) -> str:
        """Helper method to generate a dummy trend percentage"""
        trend = random.uniform(-20, 20)
        return f"+{trend:.1f}%" if trend >= 0 else f"{trend:.1f}%"

class PersonalMetricsCalculator:
    def __init__(self, db: Session, user_id: int):
        self.db = db
        self.user_id = user_id

    def get_viewing_metrics(self) -> Dict:
        """Calculate viewing related metrics"""
        total_views = self.db.query(ProductView).filter(
            ProductView.user_id == self.user_id
        ).count()

        # Get views in last 30 days for trend
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_views = self.db.query(ProductView).filter(
            ProductView.user_id == self.user_id,
            ProductView.viewed_at >= thirty_days_ago
        ).count()

        # Calculate trend compared to previous 30 days
        previous_period = self.db.query(ProductView).filter(
            ProductView.user_id == self.user_id,
            ProductView.viewed_at >= thirty_days_ago - timedelta(days=30),
            ProductView.viewed_at < thirty_days_ago
        ).count()

        trend = calculate_trend(recent_views, previous_period)

        return {
            "total_views": {
                "value": total_views,
                "trend": trend
            }
        }

    def get_wishlist_metrics(self) -> Dict:
        """Calculate wishlist metrics"""
        total_wishlisted = self.db.query(ProductWishlist).filter(
            ProductWishlist.user_id == self.user_id
        ).count()

        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_wishlisted = self.db.query(ProductWishlist).filter(
            ProductWishlist.user_id == self.user_id,
            ProductWishlist.created_at >= thirty_days_ago
        ).count()

        previous_period = self.db.query(ProductWishlist).filter(
            ProductWishlist.user_id == self.user_id,
            ProductWishlist.created_at >= thirty_days_ago - timedelta(days=30),
            ProductWishlist.created_at < thirty_days_ago
        ).count()

        trend = calculate_trend(recent_wishlisted, previous_period)

        return {
            "total_wishlisted": {
                "value": total_wishlisted,
                "trend": trend
            }
        }

    def get_review_metrics(self) -> Dict:
        """Calculate review metrics"""
        total_reviews = self.db.query(ProductReview).filter(
            ProductReview.user_id == self.user_id
        ).count()

        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_reviews = self.db.query(ProductReview).filter(
            ProductReview.user_id == self.user_id,
            ProductReview.created_at >= thirty_days_ago
        ).count()

        previous_period = self.db.query(ProductReview).filter(
            ProductReview.user_id == self.user_id,
            ProductReview.created_at >= thirty_days_ago - timedelta(days=30),
            ProductReview.created_at < thirty_days_ago
        ).count()

        trend = calculate_trend(recent_reviews, previous_period)

        return {
            "total_reviews": {
                "value": total_reviews,
                "trend": trend
            }
        }

    def get_purchase_metrics(self) -> Dict:
        """Calculate purchase metrics"""
        total_purchases = self.db.query(Order).filter(
            Order.buyer_id == self.user_id,
            Order.status == OrderStatus.fulfilled
        ).count()

        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_purchases = self.db.query(Order).filter(
            Order.buyer_id == self.user_id,
            Order.status == OrderStatus.fulfilled,
            Order.created_at >= thirty_days_ago
        ).count()

        previous_period = self.db.query(Order).filter(
            Order.buyer_id == self.user_id,
            Order.status == OrderStatus.fulfilled,
            Order.created_at >= thirty_days_ago - timedelta(days=30),
            Order.created_at < thirty_days_ago
        ).count()

        trend = calculate_trend(recent_purchases, previous_period)

        return {
            "total_purchases": {
                "value": total_purchases,
                "trend": trend
            }
        }

def calculate_trend(current: int, previous: int) -> str:
    """Helper function to calculate trend percentage"""
    if previous == 0:
        return "+100%" if current > 0 else "0%"
    
    change = ((current - previous) / previous) * 100
    return f"+{change:.1f}%" if change >= 0 else f"{change:.1f}%"

async def get_all_metrics(db: Session, user_id: int, active_view: str) -> Dict:
    """Get all metrics based on active view"""
    if active_view == "business":
        calculator = MetricsCalculator(db, user_id)
        return {
            "inventory": calculator.get_inventory_metrics(),
            "orders": calculator.get_orders_metrics(),
            "restock": calculator.get_restock_metrics(),
            "invoicing": calculator.get_invoice_metrics(),
            "gmv": calculator.get_gmv_metrics()
        }
    else:
        calculator = PersonalMetricsCalculator(db, user_id)
        return {
            "viewing": calculator.get_viewing_metrics(),
            "wishlist": calculator.get_wishlist_metrics(),
            "reviews": calculator.get_review_metrics(),
            "purchases": calculator.get_purchase_metrics()
        }

"""async def get_all_metrics(db: Session, user_id: int) -> Dict:

    calculator = MetricsCalculator(db, user_id)
    
    return {
        "inventory": calculator.get_inventory_metrics(),
        "orders": calculator.get_orders_metrics(),
        "restock": calculator.get_restock_metrics(),
        "invoicing": calculator.get_invoice_metrics(),
        "gmv": calculator.get_gmv_metrics()
    }"""