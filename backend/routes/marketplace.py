from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sql_database import get_db
from models import StorefrontProduct, User
from utils.cache_decorators import cache_response
from utils.helper_functions import serialize_datetime

router = APIRouter()

@router.get("/get_products")
@cache_response(expire=3600)
async def fetch_storefront_products(
    db: Session = Depends(get_db)
):
    storefront_products = db.query(StorefrontProduct).all()
    return [
        {
            'id': sp.id,
            'user_id': sp.user_id,
            'product_id': sp.product_id,
            'price': sp.storefront_price,
            'created_at': serialize_datetime(sp.created_at),
            'name': sp.product.name,
            'description': sp.product.description,
            'category': sp.product.category,
            'images': [img.image_url for img in sp.product.images],
            'store': sp.owner.business_name,
        }
        for sp in storefront_products
    ]

@router.get("/store/{store_slug}")
@cache_response(expire=3600)
async def fetch_store_details(
    store_slug: str,
    db: Session = Depends(get_db)
):
    # First get the store/user details
    store = db.query(User).filter(User.store_slug == store_slug).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
        
    # Get store settings
    store_settings = store.store_settings
    
    # Get store products
    storefront_products = db.query(StorefrontProduct).filter(
        StorefrontProduct.user_id == store.id
    ).all()
    
    return {
        "store": {
            "name": store.business_name,
            "slug": store.store_slug,
            "tagline": store_settings.tagline if store_settings else None,
            "address": store_settings.street_address if store_settings else None,
            "phone": store_settings.phone_number if store_settings else None,
            "email": store_settings.contact_email if store_settings else None,
        },
        "products": [
            {
                'id': sp.id,
                'product_id': sp.product_id,
                'price': sp.storefront_price,
                'created_at': serialize_datetime(sp.created_at),
                'name': sp.product.name,
                'description': sp.product.description,
                'category': sp.product.category,
                'images': [img.image_url for img in sp.product.images],
                'store': store.business_name,
            }
            for sp in storefront_products
        ]
    }