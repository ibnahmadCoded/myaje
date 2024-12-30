# storefront.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sql_database import get_db
from models import Product, User, StorefrontProduct, StoreSettings
from routes.auth import get_current_user
from typing import List
from pydantic import BaseModel

router = APIRouter()

class StorefrontProductCreate(BaseModel):
    product_id: int
    storefront_price: float

class StorefrontProductUpdate(BaseModel):
    storefront_price: float

@router.get("/get_products")
async def get_storefront_products(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    storefront_products = (
        db.query(StorefrontProduct)
        .filter_by(user_id=current_user.id)
        .all()
    )
    
    return [
        {
            'id': sp.id,
            'product_id': sp.product_id,
            'name': sp.product.name,
            'description': sp.product.description,
            'quantity': sp.product.quantity,
            'category': sp.product.category,
            'storefront_price': sp.storefront_price,
            'low_stock_threshold': sp.product.low_stock_threshold,
            'images': [img.image_url for img in sp.product.images]
        }
        for sp in storefront_products
    ]

@router.post("/add_products")
async def add_to_storefront(
    product: StorefrontProductCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify product exists and belongs to user
    inventory_product = db.query(Product).filter_by(
        id=product.product_id,
        user_id=current_user.id
    ).first()
    
    if not inventory_product:
        raise HTTPException(status_code=404, detail="Product not found in inventory")
    
    # Check if product is already in storefront
    existing = db.query(StorefrontProduct).filter_by(
        user_id=current_user.id,
        product_id=product.product_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Product already in storefront")
    
    storefront_product = StorefrontProduct(
        user_id=current_user.id,
        product_id=product.product_id,
        storefront_price=product.storefront_price
    )
    
    db.add(storefront_product)
    try:
        db.commit()
        return {"message": "Product added to storefront"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/update_products/{product_id}")
async def update_storefront_product(
    product_id: int,
    product: StorefrontProductUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    storefront_product = db.query(StorefrontProduct).filter_by(
        user_id=current_user.id,
        product_id=product_id
    ).first()
    
    if not storefront_product:
        raise HTTPException(status_code=404, detail="Product not found in storefront")
    
    storefront_product.storefront_price = product.storefront_price
    
    try:
        db.commit()
        return {"message": "Product updated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/storefront_preview/{user_id}")
async def get_storefront_preview(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter_by(id=user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Store not found")
    
    storefront_products = (
        db.query(StorefrontProduct)
        .filter_by(user_id=user_id)
        .all()
    )
    
    return {
        "business_name": user.business_name,
        "contact": {
            "address": "123 Main St, City, Country",  # Dummy data
            "phone": "+1 234 567 8900",  # Dummy data
            "email": user.email
        },
        "products": [
            {
                'id': sp.id,
                'name': sp.product.name,
                'description': sp.product.description,
                'price': sp.storefront_price,
                'category': sp.product.category,
                'images': [img.image_url for img in sp.product.images]
            }
            for sp in storefront_products
        ]
    }

@router.delete("/delete_products/{product_id}")
async def remove_from_storefront(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    storefront_product = db.query(StorefrontProduct).filter_by(
        user_id=current_user.id,
        product_id=product_id
    ).first()
    
    if not storefront_product:
        raise HTTPException(status_code=404, detail="Product not found in storefront")
    
    try:
        db.delete(storefront_product)
        db.commit()
        return {"message": "Product removed from storefront"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    
@router.put("/update_store_details")
async def update_store_details(
    store_details: dict,  # Flexible schema to handle various fields
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    store_settings = db.query(StoreSettings).filter_by(user_id=current_user.id).first()
    
    if not store_settings:
        store_settings = StoreSettings(user_id=current_user.id)
        db.add(store_settings)
    
    # Update fields dynamically
    for key, value in store_details.items():
        setattr(store_settings, key, value)
    
    try:
        db.commit()
        return {"message": "Store details updated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/get_store_details")
async def get_store_details(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    store_settings = db.query(StoreSettings).filter_by(user_id=current_user.id).first()
    
    if not store_settings:
        # Return default/empty details if no settings exist
        return {
            "tagline": "Quality Products for Every Need",
            "street_address": "123 Main St, City, Country",
            "phone_number": "+1 234 567 8900",
            "contact_email": current_user.email
        }
    
    return {
        "tagline": store_settings.tagline,
        "street_address": store_settings.street_address,
        "phone_number": store_settings.phone_number,
        "contact_email": store_settings.contact_email or current_user.email
    }