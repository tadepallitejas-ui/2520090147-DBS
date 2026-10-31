from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import create_indexes
from app.routes import auth, vehicles, parking, slots, reservations, parking_logs, admin, predictions
from app.seed import seed_database

app = FastAPI(
    title="Smart Parking Management System",
    description="A comprehensive parking management system with real-time slot tracking, reservations, and ML-based occupancy predictions.",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(auth.router)
app.include_router(vehicles.router)
app.include_router(parking.router)
app.include_router(slots.router)
app.include_router(reservations.router)
app.include_router(parking_logs.router)
app.include_router(admin.router)
app.include_router(predictions.router)

@app.on_event("startup")
async def startup():
    create_indexes()
    seed_database()

@app.get("/")
async def root():
    return {"message": "Smart Parking Management System API", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
