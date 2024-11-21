from pydantic import BaseModel
from typing import Optional

class ProductCreate(BaseModel):
    name: str
    sku: str
    quantity: int
    price: float
    category: Optional[str] = None
    description: Optional[str] = None
    low_stock_threshold: Optional[int] = 10