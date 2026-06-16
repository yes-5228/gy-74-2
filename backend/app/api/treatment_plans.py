from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.salon import TreatmentPlanCreate, TreatmentPlanRead, TreatmentPlanUpdate
from app.services import salon_service

router = APIRouter(prefix="/treatment-plans", tags=["treatment-plans"])


@router.get("", response_model=list[TreatmentPlanRead])
def list_plans(db: Session = Depends(get_db)):
    return salon_service.list_treatment_plans(db)


@router.post("", response_model=TreatmentPlanRead, status_code=status.HTTP_201_CREATED)
def create_plan(payload: TreatmentPlanCreate, db: Session = Depends(get_db)):
    return salon_service.create_treatment_plan(db, payload)


@router.put("/{plan_id}", response_model=TreatmentPlanRead)
def update_plan(plan_id: int, payload: TreatmentPlanUpdate, db: Session = Depends(get_db)):
    return salon_service.update_treatment_plan(db, plan_id, payload)


@router.patch("/{plan_id}/consume", response_model=TreatmentPlanRead)
def consume_session(plan_id: int, db: Session = Depends(get_db)):
    return salon_service.consume_treatment_session(db, plan_id)
