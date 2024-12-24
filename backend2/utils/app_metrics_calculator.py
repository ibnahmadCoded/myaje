from sqlalchemy import func, desc, and_
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Dict
from decimal import Decimal
from models import (
    User, Product, Order, OrderStatus, Payment, PaymentStatus,
    InvoiceRequest, InvoiceStatus, StorefrontProduct
)

class AdminMetricsCalculator:
    def __init__(self, db: Session):
        self.db = db
        
    def get_user_metrics(self) -> Dict:
        """
        Calculate user-related metrics including total users, new users,
        active users, and verified users over the last 30 days.
        
        Returns:
            Dict: Dictionary containing metrics with their values and trends
        """
        now = datetime.utcnow()
        thirty_days_ago = now - timedelta(days=30)
        
        # Basic user counts
        total_users = self.db.query(User).count()
        
        new_users = self.db.query(User).filter(
            User.created_at >= thirty_days_ago
        ).count()
        
        active_users = self.db.query(User.id).filter(
            User.last_login >= thirty_days_ago
        ).distinct().count()
        
        verified_users = self.db.query(User).filter(
            User.is_verified == True
        ).count()
        
        # Calculate engagement rate
        engagement_rate = (active_users / total_users * 100) if total_users > 0 else 0
        
        return {
            "total_users": {
                "value": total_users,
                "trend": self._calculate_trend(total_users, thirty_days_ago, User)
            },
            "new_users": {
                "value": new_users,
                "trend": self._calculate_trend(new_users, thirty_days_ago, User)
            },
            "active_users": {
                "value": active_users,
                "trend": self._calculate_trend(active_users, thirty_days_ago, User, 
                                            filter_by_login=True)  # Added parameter for login-based trend
            },
            "verified_users": {
                "value": verified_users,
                "trend": self._calculate_trend(verified_users, thirty_days_ago, User, 
                                            verified_only=True)
            },
            "engagement_rate": {
                "value": round(engagement_rate, 2),
                "unit": "%"
            }
        }
    
    def get_platform_metrics(self) -> Dict:
        """Calculate platform-wide metrics"""
        now = datetime.utcnow()
        start_of_month = datetime(now.year, now.month, 1)
        
        total_gmv = self.db.query(func.sum(Order.total_amount)).filter(
            Order.status != OrderStatus.cancelled
        ).scalar() or Decimal('0')
        
        monthly_gmv = self.db.query(func.sum(Order.total_amount)).filter(
            Order.created_at >= start_of_month,
            Order.status != OrderStatus.cancelled
        ).scalar() or Decimal('0')
        
        total_orders = self.db.query(Order).count()
        successful_orders = self.db.query(Order).filter(
            Order.status == OrderStatus.fulfilled
        ).count()
        
        conversion_rate = (successful_orders / total_orders * 100) if total_orders > 0 else 0
        
        return {
            "total_gmv": float(total_gmv),
            "monthly_gmv": float(monthly_gmv),
            "total_orders": total_orders,
            "conversion_rate": round(conversion_rate, 2)
        }
    
    def get_inventory_metrics(self) -> Dict:
        """
        Calculate platform-wide inventory metrics including total products,
        products in storefronts, low stock products, and out of stock products
        """
        now = datetime.utcnow()
        thirty_days_ago = now - timedelta(days=30)
        
        # Total products count
        total_products = self.db.query(Product).count()
        
        # Active (storefront) products count - products that are listed in any storefront
        active_products = self.db.query(Product)\
            .join(StorefrontProduct)\
            .distinct()\
            .count()
        
        # Low stock products
        low_stock_products = self.db.query(Product).filter(
            Product.quantity <= Product.low_stock_threshold
        ).count()
        
        # Out of stock products
        out_of_stock = self.db.query(Product).filter(
            Product.quantity == 0
        ).count()
        
        # Calculate trends
        # For active products, we need to compare with products in storefront 30 days ago
        previous_active = self.db.query(Product)\
            .join(StorefrontProduct)\
            .filter(StorefrontProduct.created_at < thirty_days_ago)\
            .distinct()\
            .count()
        
        active_trend = self._calculate_trend(
            active_products, 
            thirty_days_ago, 
            Product,
            custom_previous_value=previous_active
        )
        
        return {
            "total_products": {
                "value": total_products,
                "trend": self._calculate_trend(total_products, thirty_days_ago, Product)
            },
            "active_products": {
                "value": active_products,
                "trend": active_trend
            },
            "low_stock_products": {
                "value": low_stock_products,
                "status": "warning" if low_stock_products > total_products * 0.1 else "normal"
            },
            "out_of_stock": {
                "value": out_of_stock,
                "status": "danger" if out_of_stock > total_products * 0.05 else "normal"
            }
        }
    
    def get_financial_metrics(self) -> Dict:
        """Calculate financial metrics"""
        now = datetime.utcnow()
        start_of_month = datetime(now.year, now.month, 1)
        
        monthly_revenue = self.db.query(func.sum(Payment.amount)).filter(
            Payment.status == 'completed',
            Payment.created_at >= start_of_month
        ).scalar() or Decimal('0')
        
        pending_payouts = self.db.query(func.sum(Payment.amount)).filter(
            Payment.status == 'pending'
        ).scalar() or Decimal('0')
        
        successful_transactions = self.db.query(Payment).filter(
            Payment.status == 'completed'
        ).count()
        
        failed_transactions = self.db.query(Payment).filter(
            Payment.status == 'failed'
        ).count()
        
        return {
            "monthly_revenue": float(monthly_revenue),
            "pending_payouts": float(pending_payouts),
            "successful_transactions": successful_transactions,
            "failed_transactions": {
                "value": failed_transactions,
                "status": "danger" if failed_transactions > successful_transactions * 0.1 else "normal"
            }
        }
    
    def _calculate_trend(self, current_value: int, compare_date: datetime, model, 
                    verified_only: bool = False, active_only: bool = False, 
                    filter_by_login: bool = False, custom_previous_value: int = None) -> str:
        """
        Helper method to calculate actual trends
        
        Args:
            current_value: Current value of the metric
            compare_date: Date to compare against
            model: Database model to query
            verified_only: Filter for verified users only
            active_only: Filter for active users only
            filter_by_login: Filter by last login date instead of created_at
            custom_previous_value: Optional custom previous value to use instead of querying
        
        Returns:
            str: Formatted percentage change with sign (e.g. "+10.5%" or "-5.2%")
        """
        if custom_previous_value is not None:
            previous_value = custom_previous_value
        else:
            base_query = self.db.query(model)
            
            if verified_only:
                base_query = base_query.filter(model.is_verified == True)
            if active_only:
                base_query = base_query.join(StorefrontProduct)
            
            if filter_by_login:
                previous_value = base_query.filter(
                    model.last_login < compare_date
                ).distinct().count()
            else:
                previous_value = base_query.filter(
                    model.created_at < compare_date
                ).count()
        
        if previous_value == 0:
            return "+100%" if current_value > 0 else "0%"
        
        change = ((current_value - previous_value) / previous_value) * 100
        return f"+{change:.1f}%" if change >= 0 else f"{change:.1f}%"
    
    def get_invoice_metrics(self) -> Dict:
        """Calculate invoice-related metrics"""
        now = datetime.utcnow()
        start_of_month = datetime(now.year, now.month, 1)
        thirty_days_ago = now - timedelta(days=30)
        
        total_invoices = self.db.query(InvoiceRequest).count()
        pending_invoices = self.db.query(InvoiceRequest).filter(
            InvoiceRequest.status == InvoiceStatus.pending
        ).count()
        
        overdue_invoices = self.db.query(InvoiceRequest).filter(
            InvoiceRequest.status != InvoiceStatus.paid,
            InvoiceRequest.due_date < now
        ).count()
        
        monthly_invoice_volume = self.db.query(func.sum(InvoiceRequest.amount)).filter(
            InvoiceRequest.created_at >= start_of_month
        ).scalar() or Decimal('0')
        
        paid_invoices = self.db.query(InvoiceRequest).filter(
            InvoiceRequest.status == InvoiceStatus.paid
        ).count()
        
        invoice_success_rate = (paid_invoices / total_invoices * 100) if total_invoices > 0 else 0
        
        return {
            "total_invoices": {
                "value": total_invoices,
                "trend": self._calculate_trend(total_invoices, thirty_days_ago, InvoiceRequest)
            },
            "pending_invoices": {
                "value": pending_invoices,
                "status": "warning" if pending_invoices > total_invoices * 0.3 else "normal"
            },
            "overdue_invoices": {
                "value": overdue_invoices,
                "status": "danger" if overdue_invoices > 0 else "normal"
            },
            "monthly_invoice_volume": float(monthly_invoice_volume),
            "invoice_success_rate": {
                "value": round(invoice_success_rate, 2),
                "status": "normal" if invoice_success_rate >= 70 else "warning"
            }
        }
    
    def get_payment_metrics(self) -> Dict:
        """Calculate payment-related metrics"""
        now = datetime.utcnow()
        start_of_month = datetime(now.year, now.month, 1)
        
        total_payments = self.db.query(Payment).count()
        successful_payments = self.db.query(Payment).filter(
            Payment.status == PaymentStatus.completed
        ).count()
        
        failed_payments = self.db.query(Payment).filter(
            Payment.status == PaymentStatus.failed
        ).count()
        
        monthly_payment_volume = self.db.query(func.sum(Payment.amount)).filter(
            Payment.created_at >= start_of_month,
            Payment.status == PaymentStatus.completed
        ).scalar() or Decimal('0')
        
        pending_payments = self.db.query(Payment).filter(
            Payment.status == PaymentStatus.pending
        ).count()
        
        payment_success_rate = (successful_payments / total_payments * 100) if total_payments > 0 else 0
        
        return {
            "total_payments": {
                "value": total_payments,
                "trend": self._calculate_trend(total_payments, now - timedelta(days=30), Payment)
            },
            "successful_payments": {
                "value": successful_payments,
                "status": "normal"
            },
            "failed_payments": {
                "value": failed_payments,
                "status": "danger" if failed_payments > total_payments * 0.1 else "normal"
            },
            "monthly_payment_volume": float(monthly_payment_volume),
            "pending_payments": {
                "value": pending_payments,
                "status": "warning" if pending_payments > total_payments * 0.2 else "normal"
            },
            "payment_success_rate": {
                "value": round(payment_success_rate, 2),
                "status": "normal" if payment_success_rate >= 85 else "warning"
            }
        }
    
    def get_restock_metrics(self) -> Dict:
        """Calculate restock and inventory management metrics"""
        total_products = self.db.query(Product).count()
        
        low_stock_items = self.db.query(Product).filter(
            Product.quantity <= Product.low_stock_threshold,
            Product.quantity > 0
        ).count()
        
        out_of_stock_items = self.db.query(Product).filter(
            Product.quantity == 0
        ).count()
        
        critical_stock_items = self.db.query(Product).filter(
            Product.quantity <= Product.low_stock_threshold * 0.5,
            Product.quantity > 0
        ).count()
        
        healthy_stock_items = total_products - low_stock_items - out_of_stock_items
        
        return {
            "total_products": {
                "value": total_products,
                "trend": self._calculate_trend(total_products, datetime.utcnow() - timedelta(days=30), Product)
            },
            "low_stock_items": {
                "value": low_stock_items,
                "status": "warning" if low_stock_items > total_products * 0.2 else "normal"
            },
            "out_of_stock_items": {
                "value": out_of_stock_items,
                "status": "danger" if out_of_stock_items > total_products * 0.1 else "normal"
            },
            "critical_stock_items": {
                "value": critical_stock_items,
                "status": "danger" if critical_stock_items > total_products * 0.1 else "normal"
            },
            "healthy_stock_items": {
                "value": healthy_stock_items,
                "status": "normal" if healthy_stock_items > total_products * 0.7 else "warning"
            }
        }

async def get_all_metrics(db: Session) -> Dict:
    """Get all metrics for the admin dashboard"""
    calculator = AdminMetricsCalculator(db)
    
    return {
        "users": calculator.get_user_metrics(),
        "platform": calculator.get_platform_metrics(),
        "inventory": calculator.get_inventory_metrics(),
        "financial": calculator.get_financial_metrics(),
        "invoices": calculator.get_invoice_metrics(),
        "payments": calculator.get_payment_metrics(),
        "restock": calculator.get_restock_metrics()
    }