from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from bson import ObjectId
from app.database import vehicles_collection
from app.schemas.vehicle import VehicleCreate, VehicleUpdate
from app.utils.auth import get_current_user
from app.utils.helpers import serialize_doc
import re

router = APIRouter(prefix="/api/vehicles", tags=["Vehicles"])

def validate_registration_number(reg_num: str) -> bool:
    """Validate vehicle registration number format."""
    # Accept common formats like AB12CD3456 or AB-12-CD-3456
    pattern = r'^[A-Za-z0-9\-\s]{4,20}$'
    return bool(re.match(pattern, reg_num))

@router.post("/")
async def create_vehicle(vehicle: VehicleCreate, current_user: dict = Depends(get_current_user)):
    if not validate_registration_number(vehicle.registration_number):
        raise HTTPException(status_code=400, detail="Invalid vehicle registration number format")
    
    # Check for duplicate
    existing = vehicles_collection.find_one({"registration_number": vehicle.registration_number.upper()})
    if existing:
        raise HTTPException(status_code=400, detail="Vehicle with this registration number already exists")
    
    vehicle_doc = {
        "user_id": current_user["_id"],
        "registration_number": vehicle.registration_number.upper(),
        "vehicle_type": vehicle.vehicle_type,
        "vehicle_model": vehicle.vehicle_model,
        "vehicle_color": vehicle.vehicle_color,
        "created_at": datetime.utcnow()
    }
    
    result = vehicles_collection.insert_one(vehicle_doc)
    vehicle_doc["_id"] = result.inserted_id
    
    return {"message": "Vehicle registered successfully", "vehicle": serialize_doc(vehicle_doc)}

@router.get("/")
async def get_my_vehicles(current_user: dict = Depends(get_current_user)):
    vehicles = list(vehicles_collection.find({"user_id": current_user["_id"]}))
    return serialize_doc(vehicles)

@router.get("/{vehicle_id}")
async def get_vehicle(vehicle_id: str, current_user: dict = Depends(get_current_user)):
    vehicle = vehicles_collection.find_one({"_id": ObjectId(vehicle_id), "user_id": current_user["_id"]})
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return serialize_doc(vehicle)

@router.put("/{vehicle_id}")
async def update_vehicle(vehicle_id: str, update: VehicleUpdate, current_user: dict = Depends(get_current_user)):
    vehicle = vehicles_collection.find_one({"_id": ObjectId(vehicle_id), "user_id": current_user["_id"]})
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    vehicles_collection.update_one({"_id": ObjectId(vehicle_id)}, {"$set": update_data})
    return {"message": "Vehicle updated successfully"}

@router.delete("/{vehicle_id}")
async def delete_vehicle(vehicle_id: str, current_user: dict = Depends(get_current_user)):
    result = vehicles_collection.delete_one({"_id": ObjectId(vehicle_id), "user_id": current_user["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return {"message": "Vehicle deleted successfully"}
