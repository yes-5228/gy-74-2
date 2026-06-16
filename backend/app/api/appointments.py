from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.salon import AppointmentCreate, AppointmentRead, AppointmentUpdate
from app.services import salon_service

router = APIRouter(prefix="/appointments", tags=["appointments"])


@router.get("", response_model=list[AppointmentRead])
def list_appointments(db: Session = Depends(get_db)):
    return salon_service.list_appointments(db)


@router.post("", response_model=AppointmentRead, status_code=status.HTTP_201_CREATED)
def create_appointment(payload: AppointmentCreate, db: Session = Depends(get_db)):
    return salon_service.create_appointment(db, payload)


@router.put("/{appointment_id}", response_model=AppointmentRead)
def update_appointment(appointment_id: int, payload: AppointmentUpdate, db: Session = Depends(get_db)):
    return salon_service.update_appointment(db, appointment_id, payload)
