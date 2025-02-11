from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional, Union
from pydantic import BaseModel
from models import User, RestockRequest, Product, RestockRequestStatus, RestockRequestUrgency
from routes.auth import get_current_user
from sql_database import get_db
from utils.cache_constants import CACHE_KEYS
from utils.cache_decorators import cache_response, CacheNamespace, invalidate_cache

router = APIRouter()

class RestockRequestCreate(BaseModel):
    product_id: Optional[Union[int, None, str]]
    product_name: str
    quantity: int
    description: Optional[str]
    address: str
    additional_notes: Optional[str]
    urgency: RestockRequestUrgency
    type: str

class RestockRequestResponse(BaseModel):
    id: Union[int, None, str]
    product_name: str
    quantity: int
    type: str
    status: RestockRequestStatus
    request_date: datetime
    expected_delivery: datetime
    urgency: RestockRequestUrgency

class RestockRequestUpdate(BaseModel):
    quantity: int

@router.post("/requests", response_model=RestockRequestResponse)
@invalidate_cache(
    namespaces=[CacheNamespace.RESTOCK, CacheNamespace.INVENTORY],
    user_id_arg='current_user',
    custom_keys=[
        lambda result: CACHE_KEYS["restock_requests"](result.user_id),
        lambda result: CACHE_KEYS["restock_detail"](result.id),
        lambda result: CACHE_KEYS["user_products"](result.user_id) if result.product_id else None
    ]
)
async def create_restock_request(
    request_data: RestockRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validate product_id for existing products
    if request_data.type == "existing" and request_data.product_id:
        product = db.query(Product).filter_by(
            id=request_data.product_id,
            user_id=current_user.id
        ).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        product_name = product.name
    else:
        product_name = request_data.product_name

    # Calculate expected delivery (next business day)
    expected_delivery = datetime.utcnow() + timedelta(days=1)
    
    new_request = RestockRequest(
        user_id=current_user.id,
        product_id=request_data.product_id if request_data.type == "existing" else None,
        product_name=product_name,
        quantity=request_data.quantity,
        description=request_data.description,
        address=request_data.address,
        additional_notes=request_data.additional_notes,
        urgency=request_data.urgency,
        type=request_data.type,
        expected_delivery=expected_delivery
    )
    
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return new_request

@router.get("/requests", response_model=List[RestockRequestResponse])
@cache_response(expire=1800)  # 30 minute cache
async def get_restock_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    requests = db.query(RestockRequest).filter_by(user_id=current_user.id).all()
    return requests

@router.get("/requests/{request_id}", response_model=RestockRequestResponse)
@cache_response(expire=1800)  # 30 minute cache
async def get_restock_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    request = db.query(RestockRequest).filter_by(
        id=request_id,
        user_id=current_user.id
    ).first()
    if not request:
        raise HTTPException(status_code=404, detail="Restock request not found")
    return request

@router.put("/requests/{request_id}", response_model=RestockRequestResponse)
@invalidate_cache(
    namespaces=[CacheNamespace.RESTOCK],
    user_id_arg='current_user',
    custom_keys=[
        lambda result: CACHE_KEYS["restock_requests"](result.user_id),
        lambda result: CACHE_KEYS["restock_detail"](result.id)
    ]
)
async def update_restock_request(
    request_id: int,
    request_data: RestockRequestUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    request = db.query(RestockRequest).filter_by(
        id=request_id,
        user_id=current_user.id
    ).first()
    
    if not request:
        raise HTTPException(status_code=404, detail="Restock request not found")
    
    # Check if request is within 3-hour window
    time_difference = datetime.utcnow() - request.request_date
    if time_difference > timedelta(hours=3):
        raise HTTPException(status_code=403, detail="Cannot modify request after 3 hours")
    
    # Check if request is in a modifiable state
    if request.status != RestockRequestStatus.PENDING:
        raise HTTPException(status_code=403, detail="Can only modify pending requests")
    
    request.quantity = request_data.quantity
    db.commit()
    db.refresh(request)
    return request

@router.put("/requests/{request_id}/cancel", response_model=RestockRequestResponse)
@invalidate_cache(
    namespaces=[CacheNamespace.RESTOCK],
    user_id_arg='current_user',
    custom_keys=[
        lambda result: CACHE_KEYS["restock_requests"](result.user_id),
        lambda result: CACHE_KEYS["restock_detail"](result.id)
    ]
)
async def cancel_restock_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    request = db.query(RestockRequest).filter_by(
        id=request_id,
        user_id=current_user.id
    ).first()
    
    if not request:
        raise HTTPException(status_code=404, detail="Restock request not found")
    
    # Check if request is within 3-hour window
    time_difference = datetime.utcnow() - request.request_date
    if time_difference > timedelta(hours=3):
        raise HTTPException(status_code=403, detail="Cannot cancel request after 3 hours")
    
    # Check if request is in a cancellable state
    if request.status != RestockRequestStatus.PENDING:
        raise HTTPException(status_code=403, detail="Can only cancel pending requests")
    
    request.status = RestockRequestStatus.CANCELLED
    db.commit()
    db.refresh(request)
    return request