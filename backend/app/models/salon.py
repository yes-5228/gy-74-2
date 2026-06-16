from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ServiceItem(Base):
    __tablename__ = "service_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    category: Mapped[str] = mapped_column(String(80), default="护理")
    duration_minutes: Mapped[int] = mapped_column(Integer, default=60)
    price: Mapped[float] = mapped_column(Float, default=0)
    description: Mapped[str] = mapped_column(Text, default="")

    package_links: Mapped[list["PackageItem"]] = relationship(back_populates="service_item")
    appointments: Mapped[list["Appointment"]] = relationship(back_populates="service_item")


class CarePackage(Base):
    __tablename__ = "care_packages"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    price: Mapped[float] = mapped_column(Float, default=0)
    validity_days: Mapped[int] = mapped_column(Integer, default=90)
    description: Mapped[str] = mapped_column(Text, default="")

    items: Mapped[list["PackageItem"]] = relationship(
        back_populates="package",
        cascade="all, delete-orphan",
    )
    treatment_plans: Mapped[list["TreatmentPlan"]] = relationship(back_populates="package")


class PackageItem(Base):
    __tablename__ = "package_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    package_id: Mapped[int] = mapped_column(ForeignKey("care_packages.id", ondelete="CASCADE"))
    service_item_id: Mapped[int] = mapped_column(ForeignKey("service_items.id"))
    included_sessions: Mapped[int] = mapped_column(Integer, default=1)

    package: Mapped[CarePackage] = relationship(back_populates="items")
    service_item: Mapped[ServiceItem] = relationship(back_populates="package_links")


class TreatmentPlan(Base):
    __tablename__ = "treatment_plans"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    customer_name: Mapped[str] = mapped_column(String(120), index=True)
    customer_phone: Mapped[str] = mapped_column(String(30), default="")
    package_id: Mapped[int] = mapped_column(ForeignKey("care_packages.id"))
    sessions_total: Mapped[int] = mapped_column(Integer, default=1)
    sessions_used: Mapped[int] = mapped_column(Integer, default=0)
    purchased_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    status: Mapped[str] = mapped_column(String(30), default="active")

    package: Mapped[CarePackage] = relationship(back_populates="treatment_plans")
    appointments: Mapped[list["Appointment"]] = relationship(back_populates="treatment_plan")


class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    customer_name: Mapped[str] = mapped_column(String(120), index=True)
    customer_phone: Mapped[str] = mapped_column(String(30), default="")
    service_item_id: Mapped[int] = mapped_column(ForeignKey("service_items.id"))
    treatment_plan_id: Mapped[int | None] = mapped_column(ForeignKey("treatment_plans.id"), nullable=True)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    beautician: Mapped[str] = mapped_column(String(80), default="")
    status: Mapped[str] = mapped_column(String(30), default="booked")
    notes: Mapped[str] = mapped_column(Text, default="")

    service_item: Mapped[ServiceItem] = relationship(back_populates="appointments")
    treatment_plan: Mapped[TreatmentPlan | None] = relationship(back_populates="appointments")
