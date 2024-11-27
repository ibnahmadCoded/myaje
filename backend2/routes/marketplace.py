from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sql_database import get_db
from models import StorefrontProduct


router = APIRouter()

@router.get("/get_products")
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
            'created_at': sp.created_at,
            'name': sp.product.name,
            'description': sp.product.description,
            'category': sp.product.category,
            'images': [img.image_url for img in sp.product.images],
            'store': sp.owner.business_name,
        }
        for sp in storefront_products
    ]
