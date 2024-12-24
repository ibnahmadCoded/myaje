from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional, Union
from pydantic import BaseModel
from models import User, RestockRequest, Product, RestockRequestStatus, RestockRequestUrgency
from routes.auth import get_current_user
from sql_database import get_db

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

@router.post("/requests", response_model=RestockRequestResponse)
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
async def get_restock_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    requests = db.query(RestockRequest).filter_by(user_id=current_user.id).all()
    return requests

@router.get("/requests/{request_id}", response_model=RestockRequestResponse)
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