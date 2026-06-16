from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import appointments, packages, reminders, service_items, treatment_plans
from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.services.salon_service import seed_demo_data


app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_demo_data(db)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/")
def root():
    return {
        "message": "Beauty Care Package API is running",
        "frontend": "http://localhost:5173",
        "docs": "/docs",
        "api_prefix": "/api",
    }


app.include_router(service_items.router, prefix="/api")
app.include_router(packages.router, prefix="/api")
app.include_router(treatment_plans.router, prefix="/api")
app.include_router(appointments.router, prefix="/api")
app.include_router(reminders.router, prefix="/api")
