
from fastapi import APIRouter, Depends
from routes.auth import get_current_user
from utils.metrics_calculator import get_all_metrics
from sqlalchemy.orm import Session
from sql_database import get_db
from models import User

router = APIRouter()

@router.get("/metrics")
async def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    print("here")
    return await get_all_metrics(db, current_user.id)