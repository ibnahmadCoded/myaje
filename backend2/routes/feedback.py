from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from models import Feedback, User
from routes.auth import get_current_user
from sql_database import get_db

router = APIRouter()

class FeedbackCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str]
    message: str

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