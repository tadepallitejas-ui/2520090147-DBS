from pydantic import BaseModel, Field
from typing import Optional

class ParkingLocationCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    address: str = Field(..., min_length=5)
    city: str = Field(..., min_length=2)
    description: Optional[str] = None
    total_slots: int = Field(..., ge=1)
    price_per_hour: float = Field(..., ge=0)
    operating_hours: str = Field(default="24/7")
    parking_type: str = Field(default="Indoor", description="Indoor, Outdoor, Underground, Multi-level")

class ParkingLocationUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    description: Optional[str] = None
    total_slots: Optional[int] = None
    price_per_hour: Optional[float] = None
    operating_hours: Optional[str] = None
    parking_type: Optional[str] = None

class ParkingLocationResponse(BaseModel):
    id: str
    name: str
    address: str
    city: str
    description: Optional[str] = None
    total_slots: int
    available_slots: int
    price_per_hour: float
    operating_hours: str
    parking_type: str
    created_at: Optional[str] = None
