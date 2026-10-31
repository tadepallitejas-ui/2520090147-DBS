from pydantic import BaseModel, Field
from typing import Optional

class SlotCreate(BaseModel):
    location_id: str
    slot_number: str = Field(..., min_length=1)
    slot_type: str = Field(default="Regular", description="Regular, EV, Disabled")

class SlotUpdate(BaseModel):
    slot_type: Optional[str] = None
    status: Optional[str] = None

class SlotResponse(BaseModel):
    id: str
    location_id: str
    slot_number: str
    slot_type: str
    status: str
    created_at: Optional[str] = None
