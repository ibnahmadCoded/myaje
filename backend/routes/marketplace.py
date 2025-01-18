from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sql_database import get_db
from models import StorefrontProduct, User, Product, ProductReview, ProductView, ProductWishlist
from pydantic import BaseModel
from typing import Optional
from routes.auth import get_current_user, get_optional_current_user
from utils.cache_decorators import cache_response
from utils.helper_functions import serialize_datetime
from datetime import datetime
from sqlalchemy import func, desc

router = APIRouter()

class ReviewCreate(BaseModel):
    rating: int
    review_text: Optional[str]

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

@router.post("/{product_id}/review")
async def create_product_review(
    product_id: int,
    review: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if product exists
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product.user_id == current_user.id:
        raise HTTPException(status_code=404, detail="Sorry, you cannot review your own product!")
        
    # Check if user already reviewed this product
    existing_review = db.query(ProductReview).filter(
        ProductReview.user_id == current_user.id,
        ProductReview.product_id == product_id
    ).first()
    
    if existing_review:
        # Update existing review
        existing_review.rating = review.rating
        existing_review.review_text = review.review_text
        existing_review.created_at = datetime.utcnow()
    else:
        # Create new review
        new_review = ProductReview(
            user_id=current_user.id,
            product_id=product_id,
            rating=review.rating,
            review_text=review.review_text
        )
        db.add(new_review)
    
    db.commit()
    return {"message": "Review submitted successfully"}

@router.get("/{product_id}/reviews")
async def get_product_reviews(
    product_id: int,
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    reviews = db.query(ProductReview).filter(
        ProductReview.product_id == product_id
    ).order_by(desc(ProductReview.created_at)).offset(skip).limit(limit).all()
    
    total = db.query(func.count(ProductReview.id)).filter(
        ProductReview.product_id == product_id
    ).scalar()
    
    avg_rating = db.query(func.avg(ProductReview.rating)).filter(
        ProductReview.product_id == product_id
    ).scalar()
    
    return {
        "reviews": [
            {
                "id": review.id,
                "rating": review.rating,
                "review_text": review.review_text,
                "user_name": review.user.business_name,
                "created_at": serialize_datetime(review.created_at)
            }
            for review in reviews
        ],
        "total": total,
        "average_rating": float(avg_rating) if avg_rating else 0
    }

@router.post("/{product_id}/wishlist")
async def toggle_wishlist(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if product exists
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product.user_id == current_user.id:
        raise HTTPException(status_code=404, detail="Sorry, you cannot review your own product!")

    existing_wishlist = db.query(ProductWishlist).filter(
        ProductWishlist.user_id == current_user.id,
        ProductWishlist.product_id == product_id
    ).first()
    
    if existing_wishlist:
        db.delete(existing_wishlist)
        action = "removed from"
    else:
        new_wishlist = ProductWishlist(
            user_id=current_user.id,
            product_id=product_id
        )
        db.add(new_wishlist)
        action = "added to"
    
    db.commit()
    return {"message": f"Product {action} wishlist"}

@router.get("/{product_id}/wishlist-count")
async def get_wishlist_count(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_current_user),
):
    count = db.query(func.count(ProductWishlist.id)).filter(
        ProductWishlist.product_id == product_id
    ).scalar()

    existing_wishlist = db.query(ProductWishlist).filter(
        ProductWishlist.user_id == current_user.id,
        ProductWishlist.product_id == product_id
    ).first()
    
    if existing_wishlist:
        return {"count": count, "wishlisted_by_current_user": True}
    
    return {"count": count}

@router.post("/{product_id}/view")
async def record_product_view(
    product_id: int,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    # Check if product exists
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    new_view = ProductView(
        product_id=product_id,
        user_id=current_user.id if current_user else None
    )
    db.add(new_view)
    db.commit()
    return {"message": "View recorded"}

@router.get("/{product_id}/stats")
@cache_response(expire=3600)
async def get_product_stats(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_current_user),
):
    # Get view count
    view_count = db.query(func.count(ProductView.id)).filter(
        ProductView.product_id == product_id
    ).scalar()
    
    # Get average rating
    avg_rating = db.query(func.avg(ProductReview.rating)).filter(
        ProductReview.product_id == product_id
    ).scalar()
    
    # Get review count
    review_count = db.query(func.count(ProductReview.id)).filter(
        ProductReview.product_id == product_id
    ).scalar()
    
    # Get wishlist count
    wishlist_count = db.query(func.count(ProductWishlist.id)).filter(
        ProductWishlist.product_id == product_id
    ).scalar()

    existing_current_user_wishlist = None
    if current_user:
        existing_current_user_wishlist = db.query(ProductWishlist).filter(
            ProductWishlist.user_id == current_user.id,
            ProductWishlist.product_id == product_id
        ).first()
    
    return {
        "views": view_count,
        "average_rating": float(avg_rating) if avg_rating else 0,
        "review_count": review_count,
        "wishlist_count": wishlist_count,
        "wishlisted_by_current_user": True if existing_current_user_wishlist else False
    }
