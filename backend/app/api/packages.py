from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.salon import CarePackageCreate, CarePackageRead, CarePackageUpdate
from app.services import salon_service

router = APIRouter(prefix="/packages", tags=["packages"])


@router.get("", response_model=list[CarePackageRead])
def list_packages(db: Session = Depends(get_db)):
    return salon_service.list_packages(db)


@router.post("", response_model=CarePackageRead, status_code=status.HTTP_201_CREATED)
def create_package(payload: CarePackageCreate, db: Session = Depends(get_db)):
    return salon_service.create_package(db, payload)


@router.get("/{package_id}", response_model=CarePackageRead)
def get_package(package_id: int, db: Session = Depends(get_db)):
    return salon_service.get_package(db, package_id)


@router.put("/{package_id}", response_model=CarePackageRead)
def update_package(package_id: int, payload: CarePackageUpdate, db: Session = Depends(get_db)):
    return salon_service.update_package(db, package_id, payload)


@router.delete("/{package_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_package(package_id: int, db: Session = Depends(get_db)):
    salon_service.delete_package(db, package_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
