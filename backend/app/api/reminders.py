from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.salon import ReminderRead
from app.services import salon_service

router = APIRouter(prefix="/reminders", tags=["reminders"])


@router.get("", response_model=list[ReminderRead])
def list_reminders(days: int = Query(default=14, ge=1, le=365), db: Session = Depends(get_db)):
    return salon_service.list_reminders(db, days=days)
