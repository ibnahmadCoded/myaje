from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from models import User, RestockRequest, RestockRequestStatus
from routes.auth import get_admin_user
from sql_database import get_db
from utils.cache_constants import ADMIN_CACHE_KEYS, CACHE_KEYS
from utils.cache_decorators import cache_response, CacheNamespace, invalidate_cache
from utils.helper_functions import serialize_sqlalchemy_obj

router = APIRouter()

class AdminRestockUpdate(BaseModel):
    status: RestockRequestStatus
    admin_notes: Optional[str]

class RestockRequestDetail(BaseModel):
    id: int
    user_id: int
    product_id: Optional[int]
    product_name: str
    quantity: int
    description: Optional[str]
    address: str
    additional_notes: Optional[str]
    urgency: str
    status: str
    type: str
    request_date: datetime
    expected_delivery: datetime
    delivered_date: Optional[datetime]
    admin_notes: Optional[str]
    user_email: str  # Added to show who made the request

@router.get("", response_model=List[RestockRequestDetail])
@cache_response(expire=300, include_user_id=False)  # 5 minute cache, no user isolation
async def get_all_restock_requests(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user)
):
    """
    Get all restock requests with optional status filtering.
    Only accessible by admin users.
    """
    query = db.query(RestockRequest).join(User)
    
    # Add status filter if provided
    if status and status != 'all':
        query = query.filter(RestockRequest.status == status)
    
    # Order by date with most recent first
    query = query.order_by(desc(RestockRequest.request_date))
    
    requests = query.all()
    
    # Prepare response with user email included
    response_requests = []
    for request in requests:
        request_dict = serialize_sqlalchemy_obj(request)
        request_dict['user_email'] = request.user.email
        response_requests.append(request_dict)
    
    return response_requests

@router.get("/{request_id}", response_model=RestockRequestDetail)
@cache_response(expire=300, include_user_id=False)
async def get_restock_request_detail(
    request_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user)
):
    """
    Get detailed information about a specific restock request.
    Only accessible by admin users.
    """
    request = db.query(RestockRequest).filter(RestockRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Restock request not found")
    
    # Serialize and add user email
    request_dict = serialize_sqlalchemy_obj(request)
    request_dict['user_email'] = request.user.email

    return request_dict

@router.put("/{request_id}", response_model=RestockRequestDetail)
@invalidate_cache(
    namespaces=[CacheNamespace.RESTOCK],
    user_id_arg=None,
    custom_keys=[
        lambda result: ADMIN_CACHE_KEYS["all_restock_requests"](),
        lambda result: ADMIN_CACHE_KEYS["restock_detail"](result["id"]),
        lambda result: CACHE_KEYS["restock_requests"](result["user_id"]),
        lambda result: CACHE_KEYS["restock_detail"](result["id"])
    ]
)
async def update_restock_request(
    request_id: int,
    update_data: AdminRestockUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user)
):
    """
    Update the status and add admin notes to a restock request.
    Only accessible by admin users.
    """
    request = db.query(RestockRequest).filter(RestockRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Restock request not found")
    
    # Update status
    request.status = update_data.status
    
    # Update admin notes if provided
    if update_data.admin_notes is not None:
        request.admin_notes = update_data.admin_notes
    
    # If status is changed to delivered, update delivered_date
    if update_data.status == RestockRequestStatus.DELIVERED:
        request.delivered_date = datetime.utcnow()
    
    db.commit()
    db.refresh(request)
    
    # Serialize and add user email
    request_dict = serialize_sqlalchemy_obj(request)
    request_dict['user_email'] = request.user.email

    return request_dict

