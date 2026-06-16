from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.salon import ServiceItemCreate, ServiceItemRead, ServiceItemUpdate
from app.services import salon_service

router = APIRouter(prefix="/service-items", tags=["service-items"])


@router.get("", response_model=list[ServiceItemRead])
def list_items(db: Session = Depends(get_db)):
    return salon_service.list_service_items(db)


@router.post("", response_model=ServiceItemRead, status_code=status.HTTP_201_CREATED)
def create_item(payload: ServiceItemCreate, db: Session = Depends(get_db)):
    return salon_service.create_service_item(db, payload)


@router.put("/{item_id}", response_model=ServiceItemRead)
def update_item(item_id: int, payload: ServiceItemUpdate, db: Session = Depends(get_db)):
    return salon_service.update_service_item(db, item_id, payload)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int, db: Session = Depends(get_db)):
    salon_service.delete_service_item(db, item_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
