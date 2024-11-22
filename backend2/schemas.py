from pydantic import BaseModel
from typing import Optional, List

class ProductCreate(BaseModel):
    name: str
    sku: str
    quantity: int
    price: float
    category: Optional[str] = None
    description: Optional[str] = None
    low_stock_threshold: Optional[int] = 10
    image_paths: Optional[List[str]] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    quantity: Optional[int] = None
    price: Optional[float] = None
    category: Optional[str] = None
    description: Optional[str] = None
    low_stock_threshold: Optional[int] = None
    image_paths: Optional[List[str]] = None