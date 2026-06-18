from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ServiceItemBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    category: str = "护理"
    duration_minutes: int = Field(default=60, ge=1)
    price: float = Field(default=0, ge=0)
    description: str = ""


class ServiceItemCreate(ServiceItemBase):
    pass


class ServiceItemUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    category: str | None = None
    duration_minutes: int | None = Field(default=None, ge=1)
    price: float | None = Field(default=None, ge=0)
    description: str | None = None


class ServiceItemRead(ServiceItemBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class PackageItemInput(BaseModel):
    service_item_id: int
    included_sessions: int = Field(default=1, ge=1)


class PackageItemRead(BaseModel):
    id: int
    service_item_id: int
    included_sessions: int
    service_item: ServiceItemRead

    model_config = ConfigDict(from_attributes=True)


class CarePackageBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    price: float = Field(default=0, ge=0)
    validity_days: int = Field(default=90, ge=1)
    description: str = ""


class CarePackageCreate(CarePackageBase):
    items: list[PackageItemInput] = Field(default_factory=list)


class CarePackageUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    price: float | None = Field(default=None, ge=0)
    validity_days: int | None = Field(default=None, ge=1)
    description: str | None = None
    items: list[PackageItemInput] | None = None


class CarePackageRead(CarePackageBase):
    id: int
    items: list[PackageItemRead] = []

    model_config = ConfigDict(from_attributes=True)


class TreatmentPlanBase(BaseModel):
    customer_name: str = Field(min_length=1, max_length=120)
    customer_phone: str = ""
    package_id: int
    sessions_total: int = Field(default=1, ge=1)
    sessions_used: int = Field(default=0, ge=0)
    purchased_at: datetime | None = None
    expires_at: datetime
    status: str = "active"


class TreatmentPlanCreate(TreatmentPlanBase):
    pass


class TreatmentPlanUpdate(BaseModel):
    customer_name: str | None = Field(default=None, min_length=1, max_length=120)
    customer_phone: str | None = None
    package_id: int | None = None
    sessions_total: int | None = Field(default=None, ge=1)
    sessions_used: int | None = Field(default=None, ge=0)
    purchased_at: datetime | None = None
    expires_at: datetime | None = None
    status: str | None = None


class TreatmentPlanRead(TreatmentPlanBase):
    id: int
    package: CarePackageRead
    sessions_remaining: int
    is_expired: bool

    model_config = ConfigDict(from_attributes=True)


class AppointmentBase(BaseModel):
    customer_name: str = Field(min_length=1, max_length=120)
    customer_phone: str = ""
    service_item_id: int
    treatment_plan_id: int | None = None
    scheduled_at: datetime
    beautician: str = ""
    status: str = "booked"
    notes: str = ""


class AppointmentCreate(AppointmentBase):
    pass


class AppointmentUpdate(BaseModel):
    customer_name: str | None = Field(default=None, min_length=1, max_length=120)
    customer_phone: str | None = None
    service_item_id: int | None = None
    treatment_plan_id: int | None = None
    scheduled_at: datetime | None = None
    beautician: str | None = None
    status: str | None = None
    notes: str | None = None


class AppointmentRead(AppointmentBase):
    id: int
    service_item: ServiceItemRead

    model_config = ConfigDict(from_attributes=True)


class ReminderRead(BaseModel):
    id: int
    customer_name: str
    customer_phone: str
    package_name: str
    expires_at: datetime
    days_left: int
    sessions_remaining: int
    reason: str
