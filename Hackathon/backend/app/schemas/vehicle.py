from pydantic import BaseModel, Field
from typing import Optional

class VehicleCreate(BaseModel):
    registration_number: str = Field(..., min_length=4, max_length=20)
    vehicle_type: str = Field(..., description="Car, Motorcycle, SUV, Truck, Van")
    vehicle_model: str = Field(..., min_length=1, max_length=100)
    vehicle_color: str = Field(..., min_length=1, max_length=50)

class VehicleUpdate(BaseModel):
    vehicle_type: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_color: Optional[str] = None

class VehicleResponse(BaseModel):
    id: str
    user_id: str
    registration_number: str
    vehicle_type: str
    vehicle_model: str
    vehicle_color: str
    created_at: Optional[str] = None
