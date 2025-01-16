from venv import logger
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime, time
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, UniqueConstraint, Enum, JSON, Boolean, Time
from sqlalchemy.orm import relationship
from sql_database import Base
from sqlalchemy.sql import func
from slugify import slugify
import enum

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    email = Column(String(120), unique=True, nullable=False)
    phone = Column(String(15), unique=True, nullable=True)  
    password = Column(String(60), nullable=False)
    business_name = Column(String(100), nullable=True)  
    store_slug = Column(String(150), unique=True, nullable=True)  
    has_business_account = Column(Boolean, default=False)
    has_personal_account = Column(Boolean, default=True)  
    business_banking_onboarded = Column(Boolean, default=False)  
    personal_banking_onboarded = Column(Boolean, default=False)  
    is_admin = Column(Boolean, default=False)
    admin_role = Column(String(50), nullable=True)
    last_login = Column(DateTime, default=datetime.utcnow)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    active_view = Column(String(20), default='personal')  
    
    # Relationships
    products = relationship('Product', back_populates='owner')
    store_settings = relationship('StoreSettings', back_populates='owner', uselist=False)
    orders = relationship("Order", back_populates="seller", foreign_keys="[Order.seller_id]")
    purchases = relationship("Order", back_populates="buyer", foreign_keys="[Order.buyer_id]")
    bank_details = relationship("BankDetails", back_populates="user_data")
    notifications = relationship("Notification", back_populates="user")
    feedbacks = relationship("Feedback", back_populates="user")
    restock_requests = relationship('RestockRequest', back_populates='user')
    bank_accounts = relationship("BankAccount", back_populates="user")
    financial_pools = relationship("FinancialPool", back_populates="user")
    loans = relationship("Loan", back_populates="user")
    automations = relationship("BankingAutomation", back_populates="user")
    external_accounts = relationship("ExternalAccount", back_populates="user")
    payout_bank_details = relationship("PayoutBankDetails", back_populates="user", uselist=False)

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
    """Bank Details in Invocing page, not to be confuse with external bank account"""
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
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=True)
    order_type=Column(String)  # "payment" or "invoice"
    
    # Relationships
    seller_orders = relationship("Order", back_populates="marketplace_order")

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    marketplace_order_id = Column(Integer, ForeignKey("marketplace_orders.id"))
    seller_id = Column(Integer, ForeignKey("users.id"))  # The store owner
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # The buyer if they are logged
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
    seller = relationship("User", back_populates="orders", foreign_keys="[Order.seller_id]")
    buyer = relationship("User", back_populates="purchases", foreign_keys="[Order.buyer_id]")
    marketplace_order = relationship("MarketplaceOrder", back_populates="seller_orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="order", foreign_keys="[Payment.order_id]")
    invoice_requests = relationship("InvoiceRequest", back_populates="order")
    payout = relationship("Payout", uselist=False, back_populates="order")

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

class Payout(Base):
    __tablename__ = "payouts"
    
    id = Column(Integer, primary_key=True)
    seller_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    order_id = Column(Integer, ForeignKey('orders.id'), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(Enum('PENDING', 'PAID', name='payout_status'), default='PENDING')
    created_at = Column(DateTime, default=datetime.utcnow)
    paid_at = Column(DateTime, nullable=True)
    
    # Relationships
    seller = relationship("User", backref="payouts")
    order = relationship("Order", back_populates="payout")

class InvoiceStatus(str, Enum):
    pending = "pending"
    generated = "generated"
    sent = "sent"
    paid = "paid"
    cancelled = "cancelled"
    overdue = "overdue"

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
    payments = relationship("Payment", back_populates="invoice_request")

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

class NotificationType(str, enum.Enum):
    NEW_ORDER = "new_order"
    NEW_INVOICE = "new_invoice"
    LOW_STOCK = "low_stock"
    PAYMENT_RECEIVED = "payment_received"
    ORDER_STATUS_CHANGE = "order_status_change"
    INVOICE_STATUS_CHANGE = "invoice_status_change"
    RESTOCK_STATUS_CHANGE = "restock_status_change"
    MONEY_REQUEST = "money_request"  
    MONEY_REQUEST_STATUS_CHANGE = "money_request_status_change"
    LOAN_STATUS_CHANGE = "loan_status_change"
    PAYOUT = "payout"

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    type = Column(String, nullable=False)  # Uses NotificationType
    notification_metadata = Column(JSONB)  # New field to store additional notification data
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
    #await run_in_threadpool(Base.metadata.create_all, bind=engine)
    logger.info("Skipping table creation - handled by Alembic migrations")
    pass

###############################################################
#################### BANKING_RELATED MODELS ###################
class AccountType(enum.Enum):
    PERSONAL = "personal"
    BUSINESS = "business"

class TransactionType(enum.Enum):
    CREDIT = "credit"
    DEBIT = "debit"

class PaymentType(enum.Enum):
    ORDER_CARD = "order_card" # marketplace order payment with card
    ORDER_TRANSFER = "order_transfer" # marketplace order payment with bank transfer
    INVOICE = "invoice"
    INSTALLMENT = "installment"
    LOAN = "loan"
    TRANSFER = "transfer"
    BUY_NOW_PAY_LATER = "buy_now_pay_later"
    MONEY_REQUEST = "money_request"


class PaymentStatus(enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class TransactionTag(enum.Enum):
    SALES = "sales"
    RESTOCK = "restock"
    ONLINE = "online"
    LOAN = "loan"
    TRANSFER = "transfer"
    OTHERS = "others"
    MONEY_REQUEST = "money_request"

class AutomationType(enum.Enum):
    TRANSFER = "transfer"
    POOL_TRANSFER = "pool_transfer"

class AutomationSchedule(enum.Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"

class AccountSource(enum.Enum):
    INTERNAL = "internal"
    EXTERNAL = "external"

class MoneyRequestStatus(enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    CANCELLED = "cancelled"
    EXPIRED = "expired"

class ExternalAccount(Base):
    __tablename__ = "external_accounts"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    account_name = Column(String(100), nullable=False)
    account_number = Column(String(20), nullable=False)
    bank_name = Column(String(100), nullable=False)
    description = Column(String(255))
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="external_accounts")
    outgoing_payments = relationship("Payment", foreign_keys="[Payment.from_external_account_id]")
    incoming_payments = relationship("Payment", foreign_keys="[Payment.to_external_account_id]")

class BankAccount(Base):
    __tablename__ = "bank_accounts"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    account_type = Column(Enum(AccountType), nullable=False)
    account_name = Column(String(100), nullable=False)
    account_number = Column(String(20), nullable=False)
    bvn = Column(String(11), nullable=True, default=None)
    bank_name = Column(String(100), nullable=False)
    balance = Column(Float, default=0.00)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="bank_accounts")
    transactions = relationship("Transaction", back_populates="bank_account")
    pools = relationship("FinancialPool", back_populates="bank_account")
    outgoing_payments = relationship("Payment", foreign_keys="[Payment.from_account_id]")
    incoming_payments = relationship("Payment", foreign_keys="[Payment.to_account_id]")
    loans = relationship("Loan", back_populates="bank_account")
    automations = relationship("BankingAutomation", back_populates="bank_account", foreign_keys="[BankingAutomation.bank_account_id]")
    
class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True)
    bank_account_id = Column(Integer, ForeignKey('bank_accounts.id'), nullable=False)
    type = Column(Enum(TransactionType), nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(String(255))
    reference = Column(String(50), nullable=False)
    tag = Column(Enum(TransactionTag), nullable=False)
    payment_id = Column(Integer, ForeignKey('payments.id'), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    bank_account = relationship("BankAccount", back_populates="transactions")
    payment = relationship("Payment", back_populates="transactions")

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True)
    payment_type = Column(Enum(PaymentType), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(Enum(PaymentStatus), nullable=False)
    
    # Source account (either internal or external)
    from_account_id = Column(Integer, ForeignKey('bank_accounts.id'), nullable=True)
    from_external_account_id = Column(Integer, ForeignKey('external_accounts.id'), nullable=True)
    from_account_source = Column(Enum(AccountSource), nullable=False)
    
    # Destination account (either internal or external)
    to_account_id = Column(Integer, ForeignKey('bank_accounts.id'), nullable=True)
    to_external_account_id = Column(Integer, ForeignKey('external_accounts.id'), nullable=True)
    to_account_source = Column(Enum(AccountSource), nullable=False)
    
    description = Column(String(255))
    # Reference fields
    gateway_transaction_id = Column(String, unique=True, nullable=True)  # Payment gateway transaction ID
    reference_number = Column(String(50), unique=True, nullable=True) # Internal reference number
    due_date = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # For installment/BNPL payments
    total_installments = Column(Integer, nullable=True)
    current_installment = Column(Integer, nullable=True)
    installment_amount = Column(Float, nullable=True)
    
    # For loan payments
    loan_id = Column(Integer, ForeignKey('loans.id'), nullable=True)

    # For Order payments
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    marketplace_order_id = Column(Integer, ForeignKey("marketplace_orders.id"), nullable=True)

    # For Invoice Payments
    invoice_request_id = Column(Integer, ForeignKey("invoice_requests.id"), nullable=True)

    # For money requests
    money_request_id = Column(Integer, ForeignKey('money_requests.id'), nullable=True)
    
    # Relationships
    from_account = relationship("BankAccount", foreign_keys=[from_account_id], overlaps="outgoing_payments")
    to_account = relationship("BankAccount", foreign_keys=[to_account_id], overlaps="incoming_payments")
    from_external_account = relationship("ExternalAccount", foreign_keys=[from_external_account_id], overlaps="outgoing_payments")
    to_external_account = relationship("ExternalAccount", foreign_keys=[to_external_account_id], overlaps="incoming_payments")
    transactions = relationship("Transaction", back_populates="payment")
    loan = relationship("Loan", back_populates="payments")
    order = relationship("Order", back_populates="payments")
    invoice_request = relationship("InvoiceRequest", back_populates="payments")
    money_request = relationship("MoneyRequest", back_populates="payment")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.reference_number:
            self.reference_number = f"PAY-{datetime.utcnow().strftime('%Y%m%d')}-{id:06d}"

class AutomationScheduleDetails(Base):
    __tablename__ = "automation_schedule_details"
    
    id = Column(Integer, primary_key=True)
    automation_id = Column(Integer, ForeignKey('banking_automations.id'), nullable=False)
    execution_time = Column(Time, nullable=False, default=time(7, 0))  # Default 7:00 AM
    day_of_week = Column(Integer, nullable=True)  # 0-6 for Sunday-Saturday
    day_of_month = Column(Integer, nullable=True)  # 1-31
    
    automation = relationship("BankingAutomation", back_populates="schedule_details")

class BankingAutomation(Base):
    __tablename__ = "banking_automations"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    bank_account_id = Column(Integer, ForeignKey('bank_accounts.id'), nullable=False)
    name = Column(String(100), nullable=False)
    type = Column(Enum(AutomationType), nullable=False)
    schedule = Column(Enum(AutomationSchedule), nullable=False)
    amount = Column(Float, nullable=True)  # For fixed amount transfers
    percentage = Column(Float, nullable=True)  # For percentage-based transfers
    source_pool_id = Column(Integer, ForeignKey('financial_pools.id'), nullable=False)
    destination_pool_id = Column(Integer, ForeignKey('financial_pools.id'), nullable=True)  # For pool transfers
    destination_account_id = Column(Integer, ForeignKey('external_accounts.id'), nullable=True)  # For external bank transfers
    destination_bam_account_id = Column(Integer, ForeignKey('bank_accounts.id'), nullable=True) # for BAM transfers
    is_active = Column(Boolean, default=True)
    last_run = Column(DateTime, nullable=True)
    next_run = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="automations")
    bank_account = relationship("BankAccount", foreign_keys=[bank_account_id], back_populates="automations")  # The account doing the automation
    destination_bam_account = relationship("BankAccount", foreign_keys=[destination_bam_account_id])  # The account receiving the transfers
    source_pool = relationship("FinancialPool", foreign_keys=[source_pool_id], back_populates="source_automations")
    destination_pool = relationship("FinancialPool", foreign_keys=[destination_pool_id], back_populates="destination_automations")
    destination_account = relationship("ExternalAccount", foreign_keys=[destination_account_id])
    schedule_details = relationship("AutomationScheduleDetails", back_populates="automation", uselist=False)

class FinancialPool(Base):
    __tablename__ = "financial_pools"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    bank_account_id = Column(Integer, ForeignKey('bank_accounts.id'), nullable=False)
    name = Column(String(100), nullable=False)
    percentage = Column(Float, nullable=False)
    balance = Column(Float, default=0.0)
    is_credit_pool = Column(Boolean, default=False)
    is_locked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="financial_pools")
    bank_account = relationship("BankAccount", back_populates="pools")
    source_automations = relationship("BankingAutomation", 
                                    foreign_keys=[BankingAutomation.source_pool_id],
                                    back_populates="source_pool")
    destination_automations = relationship("BankingAutomation",
                                         foreign_keys=[BankingAutomation.destination_pool_id],
                                         back_populates="destination_pool")

class Loan(Base):
    __tablename__ = "loans"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    bank_account_id = Column(Integer, ForeignKey('bank_accounts.id'), nullable=False)
    amount = Column(Float, nullable=False)
    purpose = Column(String(255))
    status = Column(String(50), nullable=False)  # active, completed, defaulted
    remaining_amount = Column(Float, nullable=False)
    equity_share = Column(Float, nullable=True)  # For business loans
    rejection_reason = Column(Text, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="loans")
    bank_account = relationship("BankAccount", back_populates="loans")
    payments = relationship("Payment", back_populates="loan")


class MoneyRequest(Base):
    __tablename__ = "money_requests"
    
    id = Column(Integer, primary_key=True)
    requester_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    requested_from_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(String)
    account_type = Column(String, nullable=False)  # Account to receive money
    request_from_account_type = Column(String, nullable=True)  # Account to send money
    status = Column(String, default='pending')
    rejection_reason = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)

    # Relationships
    requester = relationship("User", foreign_keys=[requester_id], backref="sent_money_requests")
    requested_from = relationship("User", foreign_keys=[requested_from_id], backref="received_money_requests")
    payment = relationship("Payment", back_populates="money_request", uselist=False)

class PayoutBankDetails(Base):
    __tablename__ = "payout_bank_details"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    bank_name = Column(String, nullable=False)
    account_number = Column(String, nullable=False)
    account_name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="payout_bank_details")