from datetime import datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.salon import Appointment, CarePackage, PackageItem, ServiceItem, TreatmentPlan
from app.schemas.salon import (
    AppointmentCreate,
    AppointmentUpdate,
    CarePackageCreate,
    CarePackageUpdate,
    ServiceItemCreate,
    ServiceItemUpdate,
    TreatmentPlanCreate,
    TreatmentPlanUpdate,
)


def _get_or_404(db: Session, model: type, object_id: int):
    record = db.get(model, object_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
    return record


def _apply_updates(record, payload):
    values = payload.model_dump(exclude_unset=True)
    for field, value in values.items():
        setattr(record, field, value)
    return record


def serialize_treatment_plan(plan: TreatmentPlan) -> dict:
    return {
        **plan.__dict__,
        "sessions_remaining": max(plan.sessions_total - plan.sessions_used, 0),
    }


def list_service_items(db: Session) -> list[ServiceItem]:
    return list(db.scalars(select(ServiceItem).order_by(ServiceItem.id)))


def create_service_item(db: Session, payload: ServiceItemCreate) -> ServiceItem:
    record = ServiceItem(**payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def update_service_item(db: Session, item_id: int, payload: ServiceItemUpdate) -> ServiceItem:
    record = _get_or_404(db, ServiceItem, item_id)
    _apply_updates(record, payload)
    db.commit()
    db.refresh(record)
    return record


def delete_service_item(db: Session, item_id: int) -> None:
    record = _get_or_404(db, ServiceItem, item_id)
    db.delete(record)
    db.commit()


def list_packages(db: Session) -> list[CarePackage]:
    stmt = select(CarePackage).options(selectinload(CarePackage.items).selectinload(PackageItem.service_item))
    return list(db.scalars(stmt.order_by(CarePackage.id)))


def create_package(db: Session, payload: CarePackageCreate) -> CarePackage:
    values = payload.model_dump(exclude={"items"})
    package = CarePackage(**values)
    package.items = [PackageItem(**item.model_dump()) for item in payload.items]
    db.add(package)
    db.commit()
    return get_package(db, package.id)


def get_package(db: Session, package_id: int) -> CarePackage:
    stmt = (
        select(CarePackage)
        .where(CarePackage.id == package_id)
        .options(selectinload(CarePackage.items).selectinload(PackageItem.service_item))
    )
    package = db.scalar(stmt)
    if not package:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Package not found")
    return package


def update_package(db: Session, package_id: int, payload: CarePackageUpdate) -> CarePackage:
    package = get_package(db, package_id)
    values = payload.model_dump(exclude_unset=True, exclude={"items"})
    for field, value in values.items():
        setattr(package, field, value)
    if payload.items is not None:
        package.items = [PackageItem(**item.model_dump()) for item in payload.items]
    db.commit()
    return get_package(db, package_id)


def delete_package(db: Session, package_id: int) -> None:
    package = get_package(db, package_id)
    db.delete(package)
    db.commit()


def list_treatment_plans(db: Session) -> list[dict]:
    stmt = (
        select(TreatmentPlan)
        .options(
            selectinload(TreatmentPlan.package)
            .selectinload(CarePackage.items)
            .selectinload(PackageItem.service_item)
        )
        .order_by(TreatmentPlan.expires_at)
    )
    return [serialize_treatment_plan(plan) for plan in db.scalars(stmt)]


def create_treatment_plan(db: Session, payload: TreatmentPlanCreate) -> dict:
    data = payload.model_dump()
    if data["purchased_at"] is None:
        data["purchased_at"] = datetime.utcnow()
    plan = TreatmentPlan(**data)
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return get_treatment_plan(db, plan.id)


def get_treatment_plan(db: Session, plan_id: int) -> dict:
    stmt = (
        select(TreatmentPlan)
        .where(TreatmentPlan.id == plan_id)
        .options(
            selectinload(TreatmentPlan.package)
            .selectinload(CarePackage.items)
            .selectinload(PackageItem.service_item)
        )
    )
    plan = db.scalar(stmt)
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Treatment plan not found")
    return serialize_treatment_plan(plan)


def update_treatment_plan(db: Session, plan_id: int, payload: TreatmentPlanUpdate) -> dict:
    plan = _get_or_404(db, TreatmentPlan, plan_id)
    _apply_updates(plan, payload)
    if plan.sessions_used > plan.sessions_total:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Used sessions cannot exceed total")
    db.commit()
    return get_treatment_plan(db, plan_id)


def consume_treatment_session(db: Session, plan_id: int) -> dict:
    plan = _get_or_404(db, TreatmentPlan, plan_id)
    if plan.sessions_used >= plan.sessions_total:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No sessions remaining")
    plan.sessions_used += 1
    if plan.sessions_used >= plan.sessions_total:
        plan.status = "completed"
    db.commit()
    return get_treatment_plan(db, plan_id)


def list_appointments(db: Session) -> list[Appointment]:
    stmt = select(Appointment).options(selectinload(Appointment.service_item)).order_by(Appointment.scheduled_at)
    return list(db.scalars(stmt))


def create_appointment(db: Session, payload: AppointmentCreate) -> Appointment:
    _get_or_404(db, ServiceItem, payload.service_item_id)
    if payload.treatment_plan_id is not None:
        _get_or_404(db, TreatmentPlan, payload.treatment_plan_id)
    record = Appointment(**payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def update_appointment(db: Session, appointment_id: int, payload: AppointmentUpdate) -> Appointment:
    record = _get_or_404(db, Appointment, appointment_id)
    _apply_updates(record, payload)
    db.commit()
    db.refresh(record)
    return record


def list_reminders(db: Session, days: int = 14) -> list[dict]:
    now = datetime.utcnow()
    deadline = now + timedelta(days=days)
    stmt = (
        select(TreatmentPlan)
        .where(TreatmentPlan.status == "active")
        .where(TreatmentPlan.expires_at <= deadline)
        .options(selectinload(TreatmentPlan.package))
        .order_by(TreatmentPlan.expires_at)
    )
    reminders = []
    for plan in db.scalars(stmt):
        days_left = (plan.expires_at.date() - now.date()).days
        remaining = max(plan.sessions_total - plan.sessions_used, 0)
        reason = "即将到期" if days_left >= 0 else "已过期"
        if remaining <= 1:
            reason = f"{reason} / 次数不足"
        reminders.append(
            {
                "id": plan.id,
                "customer_name": plan.customer_name,
                "customer_phone": plan.customer_phone,
                "package_name": plan.package.name,
                "expires_at": plan.expires_at,
                "days_left": days_left,
                "sessions_remaining": remaining,
                "reason": reason,
            }
        )
    return reminders


def seed_demo_data(db: Session) -> None:
    if db.scalar(select(ServiceItem.id).limit(1)):
        return

    hydrate = ServiceItem(
        name="水光补水护理",
        category="面部护理",
        duration_minutes=60,
        price=398,
        description="清洁、补水、修护屏障。",
    )
    repair = ServiceItem(
        name="舒缓修护护理",
        category="敏感肌",
        duration_minutes=75,
        price=468,
        description="舒缓泛红并提升肌肤稳定性。",
    )
    lift = ServiceItem(
        name="紧致提升护理",
        category="抗衰护理",
        duration_minutes=90,
        price=688,
        description="轮廓提升与精华导入。",
    )
    package = CarePackage(
        name="焕肤基础疗程",
        price=2680,
        validity_days=120,
        description="适合首次建档客户的基础护理套餐。",
        items=[
            PackageItem(service_item=hydrate, included_sessions=4),
            PackageItem(service_item=repair, included_sessions=2),
        ],
    )
    plan = TreatmentPlan(
        customer_name="林女士",
        customer_phone="13800000001",
        package=package,
        sessions_total=6,
        sessions_used=4,
        expires_at=datetime.utcnow() + timedelta(days=10),
    )
    appointment = Appointment(
        customer_name="林女士",
        customer_phone="13800000001",
        service_item=hydrate,
        treatment_plan=plan,
        scheduled_at=datetime.utcnow() + timedelta(days=2, hours=3),
        beautician="Ada",
        status="booked",
        notes="偏干肌，注意补水。",
    )
    db.add_all([hydrate, repair, lift, package, plan, appointment])
    db.commit()
