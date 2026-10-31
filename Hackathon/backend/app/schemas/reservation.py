from pydantic import BaseModel, Field
from typing import Optional

class ReservationCreate(BaseModel):
    location_id: str
    slot_id: str
    vehicle_id: str
    entry_time: str  # ISO format datetime string
    exit_time: str   # ISO format datetime string

class ReservationResponse(BaseModel):
    id: str
    reservation_id: str
    user_id: str
    location_id: str
    slot_id: str
    vehicle_id: str
    entry_time: str
    exit_time: str
    status: str
    estimated_cost: float
    actual_cost: Optional[float] = None
    created_at: Optional[str] = None
