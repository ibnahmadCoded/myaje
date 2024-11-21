from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, UniqueConstraint
from starlette.concurrency import run_in_threadpool
from sqlalchemy.orm import relationship
from sql_database import Base, engine

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
    
    __table_args__ = (UniqueConstraint('user_id', 'sku'),)

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
    store_name = Column(String(100), nullable=False)
    theme = Column(String(50), default='default')
    logo_url = Column(String(200))
    primary_color = Column(String(7))
    secondary_color = Column(String(7))
    
    # Relationships
    owner = relationship('User', back_populates='store_settings')

class TokenBlacklist(Base):
    __tablename__ = "token_blacklist"
    
    id = Column(Integer, primary_key=True)
    token = Column(String(500), nullable=False, unique=True)
    blacklisted_on = Column(DateTime, nullable=False)

# Create tables function
async def create_tables():
    await run_in_threadpool(Base.metadata.create_all, bind=engine)