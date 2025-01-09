# notifications.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional, Dict
from datetime import datetime
from models import Notification, NotificationType, User
from sql_database import get_db
from routes.auth import get_current_user
from pydantic import BaseModel
from utils.cache_constants import CACHE_KEYS
from utils.cache_decorators import cache_response, CacheNamespace, invalidate_cache

router = APIRouter()

class NotificationRead(BaseModel):
    id: int
    type: str
    text: str
    is_read: bool
    created_at: datetime
    reference_id: Optional[int]
    reference_type: Optional[str]
    notification_metadata: Optional[Dict] = None

class NotificationCreate(BaseModel):
    user_id: int
    type: str
    text: str
    reference_id: Optional[int] = None
    reference_type: Optional[str] = None

async def create_notification(
    db: Session,
    user_id: int,
    type: str,
    text: str,
    notification_metadata: Optional[Dict] = None,
    reference_id: Optional[int] = None,
    reference_type: Optional[str] = None
):
    """Utility function to create a new notification"""
    notification = Notification(
        user_id=user_id,
        type=type,
        text=text,
        notification_metadata=notification_metadata,
        reference_id=reference_id,
        reference_type=reference_type
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification

@router.get("/get_notifications", response_model=List[NotificationRead])
@cache_response(expire=300)
async def get_notifications(
    unread_only: bool = False,
    user_view: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all notifications for the current user"""
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    
    if unread_only:
        query = query.filter(Notification.is_read == False)

    if user_view:
        # Filter based on user_view in notification_metadata
        query = query.filter(
            Notification.notification_metadata.has_key("user_view"),
            Notification.notification_metadata["user_view"].astext == user_view
        )

    
    
    notifications = query.order_by(desc(Notification.created_at)).all()
    return notifications

@router.post("/{notification_id}/mark-read")
@invalidate_cache(
    namespaces=[CacheNamespace.NOTIFICATION],
    user_id_arg='current_user',
    custom_keys=[lambda result: CACHE_KEYS["user_notifications"](result["user_id"])]
)
async def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a notification as read"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = True
    db.commit()
    return {"message": "Notification marked as read", "user_id": current_user.id}

@router.post("/mark-all-read")
@invalidate_cache(
    namespaces=[CacheNamespace.NOTIFICATION],
    user_id_arg='current_user',
    custom_keys=[lambda result: CACHE_KEYS["user_notifications"](result["user_id"])]
)
async def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark all notifications as read for the current user"""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({Notification.is_read: True})
    
    db.commit()
    return {"message": "All notifications marked as read", "user_id": current_user.id}