from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional
from sql_database import get_db
from pydantic import BaseModel, EmailStr
from routes.auth import get_admin_user, pwd_context
from models import User
from enum import Enum
from utils.app_metrics_calculator import get_all_metrics
from utils.cache_decorators import cache_response, invalidate_cache
from utils.cache_constants import CacheNamespace, CACHE_KEYS
from config import CACHE_EXPIRATION_TIME

router = APIRouter()

class AdminRole(str, Enum):
    super_admin = "super_admin"
    support_admin = "support_admin"
    content_admin = "content_admin"

class AdminUserCreate(BaseModel):
    email: EmailStr
    password: str
    admin_role: AdminRole
    business_name: str

class AdminUserResponse(BaseModel):
    id: int
    email: str
    admin_role: str
    business_name: Optional[str] = None
    created_at: datetime

@router.post("/create_admin_user", response_model=AdminUserResponse)
@invalidate_cache(
    namespaces=[CacheNamespace.USER],
    user_id_arg='current_admin',
    custom_keys=[
        lambda _: CACHE_KEYS["admin_users_list"]()
    ]
)
async def create_admin_user(
    user_data: AdminUserCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user)
):
    if current_admin.admin_role != "super_admin":
        raise HTTPException(
            status_code=403,
            detail="Only super admins can create new admin users"
        )
    
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    new_admin = User(
        email=user_data.email,
        password=pwd_context.hash(user_data.password),
        is_admin=True,
        admin_role=user_data.admin_role,
        business_name=user_data.business_name,
        store_slug="No Slug for admin"
    )
    
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)
    return new_admin

@router.get("/get_admin_users", response_model=List[AdminUserResponse])
@cache_response(expire=CACHE_EXPIRATION_TIME)
async def get_admin_users(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user)
):
    if current_admin.admin_role != "super_admin":
        raise HTTPException(
            status_code=403,
            detail="Only super admins can view admin users"
        )
    
    return db.query(User).filter(User.is_admin == True).all()

@router.delete("/users/{user_id}")
@invalidate_cache(
    namespaces=[CacheNamespace.USER],
    user_id_arg='current_admin',
    custom_keys=[
        lambda _: CACHE_KEYS["admin_users_list"](),
        lambda _, user_id=None: CACHE_KEYS["admin_user_detail"](user_id) if user_id else None
    ]
)
async def delete_admin_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_admin_user)
):
    if current_admin.admin_role != "super_admin":
        raise HTTPException(
            status_code=403,
            detail="Only super admins can delete admin users"
        )
    
    if current_admin.id == user_id:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete your own admin account"
        )
    
    admin_user = db.query(User).filter(User.id == user_id, User.is_admin == True).first()
    if not admin_user:
        raise HTTPException(status_code=404, detail="Admin user not found")
    
    db.delete(admin_user)
    db.commit()
    return {"message": "Admin user deleted successfully"}

@router.get("/metrics")
@cache_response(expire=300)  # Short expiration time (5 minutes) for metrics
async def get_app_metrics(
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    return await get_all_metrics(db)