from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from enum import Enum
from datetime import datetime
from models import Feedback, User
from routes.auth import get_current_user, get_admin_user
from sql_database import get_db

router = APIRouter()

class FeedbackCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str]
    message: str
class FeedbackStatus(str, Enum):
    pending = "pending"
    in_progress = "in_progress"
    resolved = "resolved"

class FeedbackUpdate(BaseModel):
    status: FeedbackStatus
    admin_notes: Optional[str] = None

class FeedbackResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str]
    message: str
    status: str
    created_at: datetime
    user_id: int
    admin_notes: Optional[str]

@router.post("/submit")
async def submit_feedback(
    feedback: FeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        new_feedback = Feedback(
            user_id=current_user.id,
            name=feedback.name,
            email=feedback.email,
            phone=feedback.phone,
            message=feedback.message
        )
        
        db.add(new_feedback)
        db.commit()
        db.refresh(new_feedback)
        
        return {"message": "Feedback submitted successfully", "id": new_feedback.id}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/admin/feedback", response_model=List[FeedbackResponse]) # only available in admin page
async def get_all_feedback(
    status: Optional[FeedbackStatus] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):

    query = db.query(Feedback)
    if status:
        query = query.filter(Feedback.status == status)
    return query.order_by(Feedback.created_at.desc()).all()

@router.put("/admin/feedback/{feedback_id}") # only available in admin page
async def update_feedback_status(
    feedback_id: int,
    update: FeedbackUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    feedback.status = update.status
    if update.admin_notes:
        feedback.admin_notes = update.admin_notes
    
    db.commit()
    db.refresh(feedback)
    return feedback