from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from bson import ObjectId
from pydantic import BaseModel
from app.database import (
    reservations_collection, parking_slots_collection,
    parking_logs_collection, vehicles_collection, parking_locations_collection
)
from app.utils.auth import get_admin_user
from app.utils.helpers import serialize_doc

router = APIRouter(prefix="/api/parking-logs", tags=["Parking Logs"])

class CheckInRequest(BaseModel):
    reservation_id: str

class CheckOutRequest(BaseModel):
    reservation_id: str

@router.post("/check-in")
async def vehicle_check_in(request: CheckInRequest, admin: dict = Depends(get_admin_user)):
    reservation = reservations_collection.find_one({"_id": ObjectId(request.reservation_id)})
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    if reservation["status"] != "confirmed":
        raise HTTPException(status_code=400, detail=f"Cannot check in. Reservation status is '{reservation['status']}'")
    
    # Verify vehicle exists
    vehicle = vehicles_collection.find_one({"_id": ObjectId(reservation["vehicle_id"])})
    if not vehicle:
        raise HTTPException(status_code=404, detail="Registered vehicle not found")
    
    now = datetime.utcnow()
    
    # Create parking log
    log_doc = {
        "reservation_id": str(reservation["_id"]),
        "vehicle_id": str(reservation["vehicle_id"]),
        "slot_id": str(reservation["slot_id"]),
        "location_id": str(reservation["location_id"]),
        "entry_timestamp": now,
        "exit_timestamp": None,
        "duration_hours": None,
        "parking_fee": None,
        "status": "checked_in",
        "created_at": now
    }
    
    parking_logs_collection.insert_one(log_doc)
    
    # Update reservation status
    reservations_collection.update_one(
        {"_id": ObjectId(request.reservation_id)},
        {"$set": {"status": "checked_in", "actual_entry_time": now}}
    )
    
    # Update slot status
    parking_slots_collection.update_one(
        {"_id": ObjectId(reservation["slot_id"])},
        {"$set": {"status": "Occupied"}}
    )
    
    return {"message": "Vehicle checked in successfully", "entry_time": now.isoformat()}

@router.post("/check-out")
async def vehicle_check_out(request: CheckOutRequest, admin: dict = Depends(get_admin_user)):
    reservation = reservations_collection.find_one({"_id": ObjectId(request.reservation_id)})
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    if reservation["status"] != "checked_in":
        raise HTTPException(status_code=400, detail=f"Cannot check out. Reservation status is '{reservation['status']}'")
    
    now = datetime.utcnow()
    
    # Get location for pricing
    location = parking_locations_collection.find_one({"_id": ObjectId(reservation["location_id"])})
    price_per_hour = location["price_per_hour"] if location else 0
    
    # Find the parking log
    log = parking_logs_collection.find_one({
        "reservation_id": str(reservation["_id"]),
        "status": "checked_in"
    })
    
    if log:
        entry_time = log["entry_timestamp"]
        duration_hours = (now - entry_time).total_seconds() / 3600
        duration_hours = max(duration_hours, 0.5)  # Minimum 30 min charge
        parking_fee = round(duration_hours * price_per_hour, 2)
        
        # Update parking log
        parking_logs_collection.update_one(
            {"_id": log["_id"]},
            {"$set": {
                "exit_timestamp": now,
                "duration_hours": round(duration_hours, 2),
                "parking_fee": parking_fee,
                "status": "completed"
            }}
        )
    else:
        # Fallback calculation from reservation times
        entry_time = reservation.get("actual_entry_time", reservation["entry_time"])
        duration_hours = (now - entry_time).total_seconds() / 3600
        duration_hours = max(duration_hours, 0.5)
        parking_fee = round(duration_hours * price_per_hour, 2)
    
    # Update reservation
    reservations_collection.update_one(
        {"_id": ObjectId(request.reservation_id)},
        {"$set": {
            "status": "completed",
            "actual_exit_time": now,
            "actual_cost": parking_fee
        }}
    )
    
    # Release slot
    parking_slots_collection.update_one(
        {"_id": ObjectId(reservation["slot_id"])},
        {"$set": {"status": "Available"}}
    )
    
    return {
        "message": "Vehicle checked out successfully",
        "exit_time": now.isoformat(),
        "duration_hours": round(duration_hours, 2),
        "parking_fee": parking_fee
    }

@router.get("/")
async def get_parking_logs(admin: dict = Depends(get_admin_user)):
    logs = list(parking_logs_collection.find().sort("created_at", -1))
    result = []
    for log in logs:
        log_data = serialize_doc(log)
        vehicle = vehicles_collection.find_one({"_id": ObjectId(log["vehicle_id"])})
        location = parking_locations_collection.find_one({"_id": ObjectId(log["location_id"])})
        slot = parking_slots_collection.find_one({"_id": ObjectId(log["slot_id"])})
        
        log_data["vehicle_number"] = vehicle["registration_number"] if vehicle else "Unknown"
        log_data["location_name"] = location["name"] if location else "Unknown"
        log_data["slot_number"] = slot["slot_number"] if slot else "Unknown"
        
        result.append(log_data)
    
    return result

@router.get("/vehicle/{vehicle_id}")
async def get_vehicle_logs(vehicle_id: str):
    logs = list(parking_logs_collection.find({"vehicle_id": vehicle_id}).sort("created_at", -1))
    return serialize_doc(logs)
