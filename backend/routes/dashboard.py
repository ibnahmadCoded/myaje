
from fastapi import APIRouter, Depends
from routes.auth import get_current_user
from utils.user_metrics_calculator import get_all_metrics
from sqlalchemy.orm import Session
from sql_database import get_db
from models import User
from utils.cache_decorators import cache_response

router = APIRouter()
@cache_response(expire=1800)  # Cache for 30 minutes
@router.get("/metrics")
async def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await get_all_metrics(db, current_user.id)