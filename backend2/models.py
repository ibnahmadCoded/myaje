from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, UniqueConstraint, Enum, JSON
from starlette.concurrency import run_in_threadpool
from sqlalchemy.orm import relationship
from sql_database import Base, engine
from sqlalchemy.sql import func
import enum

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    email = Column(String(120), unique=True, nullable=False)
    password = Column(String(60), nullable=False)
    business_name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    products = relationship('Product', back_populates='owner')
    transactions = relationship('Transaction', back_populates='owner')
    store_settings = relationship('StoreSettings', back_populates='owner', uselist=False)
    orders = relationship("Order", back_populates="seller")

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
    blacklisted_on = Column(DateTime, nullable=False)

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
    status = Column(Enum(OrderStatus), default=OrderStatus.pending)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    seller = relationship("User", back_populates="orders")
    marketplace_order = relationship("MarketplaceOrder", back_populates="seller_orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

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

# Create tables function
async def create_tables():
    await run_in_threadpool(Base.metadata.create_all, bind=engine)