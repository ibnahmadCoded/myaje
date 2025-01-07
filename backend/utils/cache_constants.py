#utils/cache_constants.py
from enum import Enum

class CacheNamespace(str, Enum):
    ACCOUNT = "account"
    USER = "user"
    TRANSACTION = "transaction"
    PAYMENT = "payment"
    POOL = "pool"
    NOTIFICATION = "notification"
    INVENTORY = "inventory"
    STOREFRONT = "storefront"
    ORDER = "order"
    INVOICE = "invoice"
    MARKETPLACE = "marketplace"
    DASHBOARD = "dashboard"
    FEEDBACK = "feedback"
    RESTOCK = "restock"

CACHE_KEYS = {
    # Account related keys
    "user_accounts": lambda user_id: f"{CacheNamespace.ACCOUNT}:user:{user_id}:list",
    "account_detail": lambda user_id, account_id: f"{CacheNamespace.ACCOUNT}:user:{user_id}:id:{account_id}",
    "account_by_type": lambda user_id, account_type: f"{CacheNamespace.ACCOUNT}:user:{user_id}:type:{account_type}",
    
    # Transaction related keys
    "account_transactions": lambda account_id: f"{CacheNamespace.TRANSACTION}:account:{account_id}:list",
    "transaction_detail": lambda transaction_id: f"{CacheNamespace.TRANSACTION}:id:{transaction_id}",
    
    # Payment related keys
    "account_payments": lambda account_id: f"{CacheNamespace.PAYMENT}:account:{account_id}:list",
    "payment_detail": lambda payment_id: f"{CacheNamespace.PAYMENT}:id:{payment_id}",
    
    # Pool related keys
    "user_pools": lambda user_id: f"{CacheNamespace.POOL}:user:{user_id}:list",
    "pool_detail": lambda pool_id: f"{CacheNamespace.POOL}:id:{pool_id}",
    
    # User related keys
    "user_profile": lambda user_id: f"{CacheNamespace.USER}:id:{user_id}:profile",
    
    # Notification related keys
    "user_notifications": lambda user_id: f"{CacheNamespace.NOTIFICATION}:user:{user_id}:list",

    # Inventory related keys
    "user_products": lambda user_id: f"{CacheNamespace.INVENTORY}:user:{user_id}:products",
    "product_detail": lambda product_id: f"{CacheNamespace.INVENTORY}:product:{product_id}",
    "product_images": lambda product_id: f"{CacheNamespace.INVENTORY}:product:{product_id}:images",
    
    # Storefront related keys
    "store_settings": lambda user_id: f"{CacheNamespace.STOREFRONT}:user:{user_id}:settings",
    "store_products": lambda user_id: f"{CacheNamespace.STOREFRONT}:user:{user_id}:products",
    
    # Order related keys
    "user_orders": lambda user_id: f"{CacheNamespace.ORDER}:user:{user_id}:list",
    "order_detail": lambda order_id: f"{CacheNamespace.ORDER}:id:{order_id}",
    "order_items": lambda order_id: f"{CacheNamespace.ORDER}:id:{order_id}:items",
    
    # Invoice related keys
    "user_invoices": lambda user_id: f"{CacheNamespace.INVOICE}:user:{user_id}:list",
    "invoice_detail": lambda invoice_id: f"{CacheNamespace.INVOICE}:id:{invoice_id}",
    
    # Marketplace related keys
    "marketplace_orders": lambda: f"{CacheNamespace.MARKETPLACE}:orders",
    "marketplace_order": lambda order_id: f"{CacheNamespace.MARKETPLACE}:order:{order_id}",
    
    # Dashboard related keys
    "user_dashboard": lambda user_id: f"{CacheNamespace.DASHBOARD}:user:{user_id}:stats",
    "dashboard_analytics": lambda user_id: f"{CacheNamespace.DASHBOARD}:user:{user_id}:analytics",
    
    # Feedback related keys
    "user_feedback": lambda user_id: f"{CacheNamespace.FEEDBACK}:user:{user_id}:list",
    "feedback_detail": lambda feedback_id: f"{CacheNamespace.FEEDBACK}:id:{feedback_id}",
    
    # Restock related keys
    "restock_requests": lambda user_id: f"{CacheNamespace.RESTOCK}:user:{user_id}:list",
    "restock_detail": lambda request_id: f"{CacheNamespace.RESTOCK}:id:{request_id}",

    # admin routes
    "admin_users_list": lambda: f"{CacheNamespace.USER}:admin:list",
    "admin_user_detail": lambda user_id: f"{CacheNamespace.USER}:admin:{user_id}",
    "app_metrics": lambda: f"{CacheNamespace.DASHBOARD}:admin:metrics",
}

# Custom cache key for admin restock requests
ADMIN_CACHE_KEYS = {
    "all_restock_requests": lambda status=None: f"admin:restock:all:{status or 'all'}",
    "restock_detail": lambda request_id: f"admin:restock:detail:{request_id}"
}
