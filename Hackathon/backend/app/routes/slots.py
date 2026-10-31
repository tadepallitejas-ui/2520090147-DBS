from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime
from bson import ObjectId
from app.database import parking_slots_collection, parking_locations_collection
from app.schemas.slot import SlotCreate, SlotUpdate
from app.utils.auth import get_admin_user, get_current_user
from app.utils.helpers import serialize_doc
from typing import Optional

router = APIRouter(prefix="/api/slots", tags=["Parking Slots"])

@router.get("/location/{location_id}")
async def get_slots_by_location(location_id: str, status: Optional[str] = Query(None)):
    query = {"location_id": location_id}
    if status:
        query["status"] = status
    
    slots = list(parking_slots_collection.find(query).sort("slot_number", 1))
    return serialize_doc(slots)

@router.get("/{slot_id}")
async def get_slot(slot_id: str):
    slot = parking_slots_collection.find_one({"_id": ObjectId(slot_id)})
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    return serialize_doc(slot)

@router.post("/")
async def create_slot(slot: SlotCreate, admin: dict = Depends(get_admin_user)):
    # Verify location exists
    location = parking_locations_collection.find_one({"_id": ObjectId(slot.location_id)})
    if not location:
        raise HTTPException(status_code=404, detail="Parking location not found")
    
    # Check for duplicate slot number in location
    existing = parking_slots_collection.find_one({
        "location_id": slot.location_id,
        "slot_number": slot.slot_number
    })
    if existing:
        raise HTTPException(status_code=400, detail="Slot number already exists at this location")
    
    slot_doc = {
        "location_id": slot.location_id,
        "slot_number": slot.slot_number,
        "slot_type": slot.slot_type,
        "status": "Available",
        "created_at": datetime.utcnow()
    }
    
    result = parking_slots_collection.insert_one(slot_doc)
    slot_doc["_id"] = result.inserted_id
    
    return {"message": "Slot created successfully", "slot": serialize_doc(slot_doc)}

@router.put("/{slot_id}")
async def update_slot(slot_id: str, update: SlotUpdate, admin: dict = Depends(get_admin_user)):
    slot = parking_slots_collection.find_one({"_id": ObjectId(slot_id)})
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    parking_slots_collection.update_one({"_id": ObjectId(slot_id)}, {"$set": update_data})
    return {"message": "Slot updated successfully"}

@router.delete("/{slot_id}")
async def delete_slot(slot_id: str, admin: dict = Depends(get_admin_user)):
    result = parking_slots_collection.delete_one({"_id": ObjectId(slot_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Slot not found")
    return {"message": "Slot deleted successfully"}
