from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sql_database import get_db
from models import Product, User
from schemas import ProductCreate
from routes.auth import get_current_user

router = APIRouter()

@router.get("/get_inventory")
async def get_inventory(
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    products = db.query(Product).filter_by(user_id=current_user.id).all()
    return [
        {
            'id': p.id,
            'name': p.name,
            'sku': p.sku,
            'quantity': p.quantity,
            'price': p.price,
            'category': p.category,
            'description': p.description,
            'low_stock_threshold': p.low_stock_threshold
        } for p in products
    ]

@router.post("/add_to_inventory")
async def add_product_to_inventory(
    product: ProductCreate, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    new_product = Product(
        user_id=current_user.id,
        name=product.name,
        sku=product.sku,
        quantity=product.quantity,
        price=product.price,
        category=product.category,
        description=product.description,
        low_stock_threshold=product.low_stock_threshold or 10
    )
    db.add(new_product)
    try:
        db.commit()
        return {"message": "Product added successfully"}
    except:
        db.rollback()
        raise HTTPException(status_code=400, detail="SKU must be unique")

@router.delete("/delete_from_inventory/{product_id}")
async def delete_product_from_inventory(
    product_id: int, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter_by(id=product_id, user_id=current_user.id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(product)
    db.commit()
    return {"message": "Product deleted successfully"}

@router.get("/is_low_stock")
async def get_low_stock(
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    low_stock_products = db.query(Product).filter_by(user_id=current_user.id)\
        .filter(Product.quantity <= Product.low_stock_threshold).all()
    
    return [
        {
            'id': p.id,
            'name': p.name,
            'sku': p.sku,
            'quantity': p.quantity,
            'low_stock_threshold': p.low_stock_threshold
        } for p in low_stock_products
    ]