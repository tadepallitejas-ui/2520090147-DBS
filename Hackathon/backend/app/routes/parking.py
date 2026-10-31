from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime
from bson import ObjectId
from app.database import parking_locations_collection, parking_slots_collection
from app.schemas.parking import ParkingLocationCreate, ParkingLocationUpdate
from app.utils.auth import get_current_user, get_admin_user
from app.utils.helpers import serialize_doc
from typing import Optional

router = APIRouter(prefix="/api/parking-locations", tags=["Parking Locations"])

def get_available_slots_count(location_id: str) -> int:
    """Calculate available slots for a location from slots collection."""
    return parking_slots_collection.count_documents({
        "location_id": location_id,
        "status": "Available"
    })

def get_total_slots_count(location_id: str) -> int:
    """Get total slots for a location from slots collection."""
    return parking_slots_collection.count_documents({
        "location_id": location_id
    })

@router.get("/")
async def get_parking_locations(
    city: Optional[str] = Query(None),
    parking_type: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    available: Optional[bool] = Query(None)
):
    query = {}
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if parking_type:
        query["parking_type"] = parking_type
    if min_price is not None:
        query["price_per_hour"] = query.get("price_per_hour", {})
        query["price_per_hour"]["$gte"] = min_price
    if max_price is not None:
        query["price_per_hour"] = query.get("price_per_hour", {})
        query["price_per_hour"]["$lte"] = max_price
    
    locations = list(parking_locations_collection.find(query))
    result = []
    for loc in locations:
        loc_id = str(loc["_id"])
        available_count = get_available_slots_count(loc_id)
        total = get_total_slots_count(loc_id)
        loc_data = serialize_doc(loc)
        loc_data["available_slots"] = available_count
        loc_data["total_slots"] = total if total > 0 else loc.get("total_slots", 0)
        
        if available and available_count == 0:
            continue
        
        result.append(loc_data)
    
    return result

@router.get("/{location_id}")
async def get_parking_location(location_id: str):
    location = parking_locations_collection.find_one({"_id": ObjectId(location_id)})
    if not location:
        raise HTTPException(status_code=404, detail="Parking location not found")
    
    loc_id = str(location["_id"])
    loc_data = serialize_doc(location)
    loc_data["available_slots"] = get_available_slots_count(loc_id)
    loc_data["total_slots"] = get_total_slots_count(loc_id) or location.get("total_slots", 0)
    return loc_data

@router.post("/")
async def create_parking_location(location: ParkingLocationCreate, admin: dict = Depends(get_admin_user)):
    loc_doc = {
        "name": location.name,
        "address": location.address,
        "city": location.city,
        "description": location.description,
        "total_slots": location.total_slots,
        "price_per_hour": location.price_per_hour,
        "operating_hours": location.operating_hours,
        "parking_type": location.parking_type,
        "created_at": datetime.utcnow()
    }
    
    result = parking_locations_collection.insert_one(loc_doc)
    loc_id = str(result.inserted_id)
    
    # Auto-create slots
    slots = []
    for i in range(1, location.total_slots + 1):
        slot_type = "Regular"
        if i <= max(1, location.total_slots // 10):
            slot_type = "Disabled"
        elif i <= max(2, location.total_slots // 5):
            slot_type = "EV"
        
        slots.append({
            "location_id": loc_id,
            "slot_number": f"S{str(i).zfill(3)}",
            "slot_type": slot_type,
            "status": "Available",
            "created_at": datetime.utcnow()
        })
    
    if slots:
        parking_slots_collection.insert_many(slots)
    
    loc_doc["_id"] = result.inserted_id
    return {"message": "Parking location created successfully", "location": serialize_doc(loc_doc)}

@router.put("/{location_id}")
async def update_parking_location(location_id: str, update: ParkingLocationUpdate, admin: dict = Depends(get_admin_user)):
    location = parking_locations_collection.find_one({"_id": ObjectId(location_id)})
    if not location:
        raise HTTPException(status_code=404, detail="Parking location not found")
    
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    parking_locations_collection.update_one({"_id": ObjectId(location_id)}, {"$set": update_data})
    return {"message": "Parking location updated successfully"}

@router.delete("/{location_id}")
async def delete_parking_location(location_id: str, admin: dict = Depends(get_admin_user)):
    result = parking_locations_collection.delete_one({"_id": ObjectId(location_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Parking location not found")
    
    # Delete associated slots
    parking_slots_collection.delete_many({"location_id": location_id})
    
    return {"message": "Parking location and associated slots deleted successfully"}
