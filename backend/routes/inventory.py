from math import prod
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from sql_database import get_db
from models import Product, User, ProductImage, StorefrontProduct
from uuid import uuid4
from typing import List, Optional
import os
from routes.auth import get_current_user
from config import UPLOAD_DIRECTORY
from utils.cache_constants import CACHE_KEYS
from utils.cache_decorators import cache_response, CacheNamespace, invalidate_cache

router = APIRouter()

@router.get("/get_inventory")
@cache_response(expire=3600)  # Cache for 1 hour
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
            'low_stock_threshold': p.low_stock_threshold,
            'images': [img.image_url for img in p.images]
        } for p in products
    ]

@router.post("/add_to_inventory")
@invalidate_cache(
    namespaces=[CacheNamespace.INVENTORY, CacheNamespace.STOREFRONT],
    user_id_arg='current_user',
    custom_keys=[
        lambda result: CACHE_KEYS["user_products"](result["user_id"]) if isinstance(result, dict) else (result.user_id),
        lambda result: CACHE_KEYS["store_products"](result["user_id"]) if isinstance(result, dict) else (result.user_id)
    ]
)
async def add_product_to_inventory(
    name: str = Form(...),
    sku: str = Form(...),
    quantity: int = Form(...),
    price: float = Form(...),
    category: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    low_stock_threshold: Optional[int] = Form(10),
    images: List[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Check if SKU is unique for the user
    existing_product = db.query(Product).filter_by(user_id=current_user.id, sku=sku).first()
    if existing_product:
        raise HTTPException(status_code=400, detail="SKU already exists for this user.")
    
    # Process images
    image_paths = []
    if images:
        if len(images) > 3:
            raise HTTPException(status_code=400, detail="You can upload a maximum of 3 images.")
        
        for image in images:
            ext = os.path.splitext(image.filename)[-1]
            if ext.lower() not in [".jpg", ".jpeg", ".png", ".gif"]:  # Validate file types
                raise HTTPException(status_code=400, detail="Invalid file type.")
            
            filename = f"{uuid4().hex}{ext}"
            file_path = os.path.join(UPLOAD_DIRECTORY, filename)
            print(file_path)
            os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)
            
            with open(file_path, "wb") as f:
                f.write(await image.read())
            
            image_paths.append(file_path)
    
    # Create the product
    new_product = Product(
        user_id=current_user.id,
        name=name,
        sku=sku,
        quantity=quantity,
        price=price,
        category=category,
        description=description,
        low_stock_threshold=low_stock_threshold,
    )
    db.add(new_product)
    db.flush()  # Flush to get the product ID
    
    # Add product images
    if image_paths:
        product_images = [
            ProductImage(product_id=new_product.id, image_url=path)
            for path in image_paths
        ]
        db.add_all(product_images)
    
    # Commit the transaction
    try:
        db.commit()
        return {"message": "Product added successfully", "user_id": current_user.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to add product: {str(e)}")

@router.delete("/delete_from_inventory/{product_id}")
@invalidate_cache(
    namespaces=[CacheNamespace.INVENTORY, CacheNamespace.STOREFRONT],
    user_id_arg='current_user',
    custom_keys=[
        lambda result: CACHE_KEYS["product_detail"](result["id"]) if isinstance(result, dict) else (result.id),
        lambda result: CACHE_KEYS["user_products"](result["user_id"]) if isinstance(result, dict) else (result.user_id),
        lambda result: CACHE_KEYS["store_products"](result["user_id"]) if isinstance(result, dict) else (result.user_id)
    ]
)
async def delete_product_from_inventory(
    product_id: int, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter_by(id=product_id, user_id=current_user.id).first()

    storefront_product = db.query(StorefrontProduct).filter_by(product_id=product.id).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Delete images from the upload folder
    product_images = db.query(ProductImage).filter_by(product_id=product.id).all()
    for image in product_images:
        try:
            if os.path.exists(image.image_url):
                os.remove(image.image_url)
        except Exception as e:
            print(f"Error deleting file {image.image_url}: {e}")
    
    db.delete(product)

    # Delete product from storefront
    if storefront_product:
        db.delete(storefront_product)

    db.commit()
    return {"message": "Product deleted successfully", "user_id": current_user.id, "id": product.id}

@router.get("/is_low_stock")
@cache_response(expire=1800)
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

@router.put("/update_product/{product_id}")
@invalidate_cache(
    namespaces=[CacheNamespace.INVENTORY, CacheNamespace.STOREFRONT],
    user_id_arg='current_user',
    custom_keys=[
        lambda result: CACHE_KEYS["product_detail"](result["id"]) if isinstance(result, dict) else (result.id),
        lambda result: CACHE_KEYS["user_products"](result["id"]) if isinstance(result, dict) else (result.id),
        lambda result: CACHE_KEYS["store_products"](result["user_id"]) if isinstance(result, dict) else (result.user_id)
    ]
)
async def update_product(
    product_id: int,
    name: Optional[str] = Form(None),
    sku: Optional[str] = Form(None),
    quantity: Optional[int] = Form(None),
    price: Optional[float] = Form(None),
    category: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    low_stock_threshold: Optional[int] = Form(None),
    images: List[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter_by(id=product_id, user_id=current_user.id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check SKU uniqueness if changed
    if sku and sku != product.sku:
        existing_product = db.query(Product).filter_by(user_id=current_user.id, sku=sku).first()
        if existing_product:
            raise HTTPException(status_code=400, detail="SKU already exists for this user.")
    
    # Update product details
    if name: product.name = name
    if sku: product.sku = sku
    if quantity is not None: product.quantity = quantity
    if price is not None: product.price = price
    if category: product.category = category
    if description: product.description = description
    if low_stock_threshold is not None: product.low_stock_threshold = low_stock_threshold
    
    # Process and update images
    if images:
        if len(images) > 3:
            raise HTTPException(status_code=400, detail="You can upload a maximum of 3 images.")
        
        # Delete existing images from the upload folder
        existing_images = db.query(ProductImage).filter_by(product_id=product.id).all()
        for image in existing_images:
            try:
                if os.path.exists(image.image_url):
                    os.remove(image.image_url)
            except Exception as e:
                print(f"Error deleting file {image.image_url}: {e}")
        
        # Delete existing images from the database
        db.query(ProductImage).filter_by(product_id=product.id).delete()
        
        # Add new images
        image_paths = []
        for image in images:
            ext = os.path.splitext(image.filename)[-1]
            if ext.lower() not in [".jpg", ".jpeg", ".png", ".gif"]:
                raise HTTPException(status_code=400, detail="Invalid file type.")
            
            filename = f"{uuid4().hex}{ext}"
            file_path = os.path.join(UPLOAD_DIRECTORY, filename)
            os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)
            
            with open(file_path, "wb") as f:
                f.write(await image.read())
            
            image_paths.append(file_path)
        
        # Add new product images
        product_images = [
            ProductImage(product_id=product.id, image_url=path)
            for path in image_paths
        ]
        db.add_all(product_images)
    
    try:
        db.commit()
        return {"message": "Product updated successfully", "user_id": current_user.id, "id": product.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update product: {str(e)}")