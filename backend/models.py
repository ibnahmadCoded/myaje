from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, UniqueConstraint, Enum, JSON, Boolean
from starlette.concurrency import run_in_threadpool
from sqlalchemy.orm import relationship
from sql_database import Base, engine
from sqlalchemy.sql import func
from slugify import slugify
import enum

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    email = Column(String(120), unique=True, nullable=False)
    password = Column(String(60), nullable=False)
    business_name = Column(String(100), nullable=False)
    store_slug = Column(String(150), unique=True, nullable=False)
    is_admin = Column(Boolean, default=False)
    admin_role = Column(String(50), nullable=True)
    last_login = Column(DateTime, default=datetime.utcnow)  # Added last_login field
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    products = relationship('Product', back_populates='owner')
    transactions = relationship('Transaction', back_populates='owner')
    store_settings = relationship('StoreSettings', back_populates='owner', uselist=False)
    orders = relationship("Order", back_populates="seller")
    bank_details = relationship("BankDetails", back_populates="user_data")
    notifications = relationship("Notification", back_populates="user")
    feedbacks = relationship("Feedback", back_populates="user")
    restock_requests = relationship('RestockRequest', back_populates='user')

    def generate_store_slug(self, db):
        base_slug = slugify(self.business_name)
        slug = base_slug
        counter = 1
        
        while True:
            existing = db.query(User).filter_by(store_slug=slug).first()
            if not existing or existing.id == self.id:
                break
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        self.store_slug = slug

class BankDetails(Base):
    __tablename__ = 'bank_details'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))  # Assuming you have a User model
    bank_name = Column(String, index=True)
    account_number = Column(String)
    account_name = Column(String)
    sort_code = Column(String)
    account_type = Column(String)
    
    user_data = relationship("User", back_populates="bank_details") 

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    name = Column(String(100), nullable=False)
    sku = Column(String(50), nullable=False)
    quantity = Column(Integer, default=0)
    price = Column(Float, nullable=False)
    low_stock_threshold = Column(Integer, default=10)
    category = Column(String(50))
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    owner = relationship('User', back_populates='products')
    images = relationship('ProductImage', back_populates='product', cascade="all, delete-orphan")
    restock_requests = relationship('RestockRequest', back_populates='product')
    
    __table_args__ = (UniqueConstraint('user_id', 'sku'),)

class ProductImage(Base):
    __tablename__ = "product_images"
    
    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey('products.id'), nullable=False)
    image_url = Column(String(255), nullable=False)  # Path or URL to the image
    
    # Relationships
    product = relationship('Product', back_populates='images')

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    type = Column(String(20), nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(String(200))
    date = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    owner = relationship('User', back_populates='transactions')

class StoreSettings(Base):
    __tablename__ = "store_settings"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    theme = Column(String(50), default='default')
    logo_url = Column(String(200))
    primary_color = Column(String(7))
    secondary_color = Column(String(7))
    
    # New fields for store details
    tagline = Column(String(200))  # "Quality Products for Every Need"
    street_address = Column(String(200))  # "123 Main St, City, Country"
    phone_number = Column(String(20))  # "+1 234 567 8900"
    contact_email = Column(String(120))  # "store@example.com"
    
    # Relationships
    owner = relationship('User', back_populates='store_settings')

class TokenBlacklist(Base):
    __tablename__ = "token_blacklist"
    
    id = Column(Integer, primary_key=True)
    token = Column(String(500), nullable=False, unique=True)
    blacklisted_on = Column(DateTime, nullable=False, default=datetime.utcnow)

class StorefrontProduct(Base):
    __tablename__ = "storefront_products"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    product_id = Column(Integer, ForeignKey('products.id'), nullable=False)
    storefront_price = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    owner = relationship('User', backref='storefront_products')
    product = relationship('Product')
    
    __table_args__ = (UniqueConstraint('user_id', 'product_id'),)

class OrderStatus(enum.Enum):
    pending = "pending"
    fulfilled = "fulfilled"
    cancelled = "cancelled"

class MarketplaceOrder(Base):
    __tablename__ = "marketplace_orders"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String)
    customer_email = Column(String)
    customer_phone = Column(String)
    shipping_address = Column(String)
    total_amount = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    payment_info = Column(JSON)  # Store payment details
    order_type=Column(String)  # "payment" or "invoice"
    
    # Relationships
    seller_orders = relationship("Order", back_populates="marketplace_order")

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    marketplace_order_id = Column(Integer, ForeignKey("marketplace_orders.id"))
    seller_id = Column(Integer, ForeignKey("users.id"))  # The store owner
    customer_name = Column(String)
    customer_email = Column(String)
    customer_phone = Column(String)
    shipping_address = Column(String)
    total_amount = Column(Float)
    payment_info = Column(JSON)  # Store payment details
    order_type=Column(String)  # "payment" or "invoice"
    status = Column(Enum(OrderStatus), default=OrderStatus.pending)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    seller = relationship("User", back_populates="orders")
    marketplace_order = relationship("MarketplaceOrder", back_populates="seller_orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="order")
    invoice_requests = relationship("InvoiceRequest", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer)
    price = Column(Float)  # Price at time of purchase
    
    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product")

# payments
class PaymentStatus(str, Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"
    refunded = "refunded"
    cancelled = "cancelled"

class InvoiceStatus(str, Enum):
    pending = "pending"
    generated = "generated"
    sent = "sent"
    paid = "paid"
    cancelled = "cancelled"
    overdue = "overdue"

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(String, nullable=False)  # e.g., "card", "bank_transfer"
    status = Column(String, nullable=False, default=PaymentStatus.pending)
    payment_details = Column(JSON)  # Store payment gateway response, transaction IDs, etc.
    
    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # Reference fields
    transaction_id = Column(String, unique=True, nullable=True)  # Payment gateway transaction ID
    reference_number = Column(String, unique=True, nullable=True)  # Internal reference number
    
    # Error handling
    error_message = Column(String, nullable=True)
    retry_count = Column(Integer, default=0)
    
    # Relationships
    order = relationship("Order", back_populates="payments")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.reference_number:
            self.reference_number = f"PAY-{datetime.utcnow().strftime('%Y%m%d')}-{id:06d}"

class InvoiceRequest(Base):
    __tablename__ = "invoice_requests"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    customer_name = Column(String, nullable=False)
    customer_email = Column(String, nullable=False)
    customer_phone = Column(String, nullable=True)
    shipping_address = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    items = Column(JSON, nullable=False)  # Store list of items with details
    status = Column(String, nullable=False, default=InvoiceStatus.pending)
    
    # Invoice specific fields
    invoice_number = Column(String, unique=True, nullable=True)
    notes = Column(String, nullable=True)
    payment_terms = Column(String, nullable=True)  # e.g., "Net 30"
    due_date = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    generated_at = Column(DateTime, nullable=True)
    sent_at = Column(DateTime, nullable=True)
    paid_at = Column(DateTime, nullable=True)
    
    # User tracking
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    generated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    order = relationship("Order", back_populates="invoice_requests")
    creator = relationship("User", foreign_keys=[created_by])
    generator = relationship("User", foreign_keys=[generated_by])
    updater = relationship("User", foreign_keys=[updated_by])

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.invoice_number and self.id:
            self.invoice_number = f"INV-{datetime.utcnow().strftime('%Y%m%d')}-{self.id:06d}"
    
    def to_dict(self, include_relationships=True):
        """
        Convert the invoice request to a dictionary.
        
        Args:
            include_relationships (bool): Whether to include related objects data
        
        Returns:
            dict: Dictionary representation of the invoice request
        """
        def format_datetime(dt):
            return dt.isoformat() if dt else None

        # Base dictionary with direct fields
        result = {
            "id": self.id,
            "order_id": self.order_id,
            "customer_name": self.customer_name,
            "customer_email": self.customer_email,
            "customer_phone": self.customer_phone,
            "shipping_address": self.shipping_address,
            "amount": float(self.amount),  # Ensure float serialization
            "items": self.items,  # JSON field
            "status": self.status,
            "invoice_number": self.invoice_number,
            "notes": self.notes,
            "payment_terms": self.payment_terms,
            "due_date": format_datetime(self.due_date),
            
            # Timestamps
            "created_at": format_datetime(self.created_at),
            "updated_at": format_datetime(self.updated_at),
            "generated_at": format_datetime(self.generated_at),
            "sent_at": format_datetime(self.sent_at),
            "paid_at": format_datetime(self.paid_at),
            
            # User IDs
            "created_by": self.created_by,
            "generated_by": self.generated_by,
            "updated_by": self.updated_by,
        }
        
        # Include relationship data if requested
        if include_relationships:
            result.update({
                "order": {
                    "id": self.order.id,
                    # Add other relevant order fields later
                } if self.order else None,
                
                "creator": {
                    "id": self.creator.id,
                    "name": self.creator.name,
                    "email": self.creator.email
                } if self.creator else None,
                
                "generator": {
                    "id": self.generator.id,
                    "name": self.generator.name,
                    "email": self.generator.email
                } if self.generator else None,
                
                "updater": {
                    "id": self.updater.id,
                    "name": self.updater.name,
                    "email": self.updater.email
                } if self.updater else None
            })
        
        return result

# models.py (add this to your existing models)
class NotificationType(str, enum.Enum):
    NEW_ORDER = "new_order"
    NEW_INVOICE = "new_invoice"
    LOW_STOCK = "low_stock"
    PAYMENT_RECEIVED = "payment_received"
    ORDER_STATUS_CHANGE = "order_status_change"
    INVOICE_STATUS_CHANGE = "invoice_status_change"
    RESTOCK_STATUS_CHANGE = "restock_status_change"

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    type = Column(String, nullable=False)  # Uses NotificationType
    text = Column(String, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    reference_id = Column(Integer)  # ID of related order/invoice/etc
    reference_type = Column(String)  # "order", "invoice", etc
    
    # Relationships
    user = relationship("User", back_populates="notifications")

class Feedback(Base):
    __tablename__ = "feedback"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    name = Column(String(100), nullable=False)
    email = Column(String(120), nullable=False)
    phone = Column(String(20))
    message = Column(Text, nullable=False)
    status = Column(String(20), default="pending")  # pending, in_progress, resolved
    admin_notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship with User model
    user = relationship("User", back_populates="feedbacks")

class RestockRequestStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class RestockRequestUrgency(str, enum.Enum):
    NORMAL = "normal"
    HIGH = "high"

class RestockRequest(Base):
    __tablename__ = "restock_requests"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    product_id = Column(Integer, ForeignKey('products.id'), nullable=True)  # Null for new products
    product_name = Column(String(100), nullable=False)
    quantity = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    address = Column(Text, nullable=False)
    additional_notes = Column(Text, nullable=True)
    urgency = Column(Enum(RestockRequestUrgency), default=RestockRequestUrgency.NORMAL)
    status = Column(Enum(RestockRequestStatus), default=RestockRequestStatus.PENDING)
    type = Column(String(20), nullable=False)  # 'existing' or 'new'
    request_date = Column(DateTime, default=datetime.utcnow)
    expected_delivery = Column(DateTime)
    admin_notes = Column(Text, nullable=True)
    delivered_date = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship('User', back_populates='restock_requests')
    product = relationship('Product', back_populates='restock_requests')

# Create tables function
async def create_tables():
    await run_in_threadpool(Base.metadata.create_all, bind=engine)