from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from bson import ObjectId
from app.database import (
    reservations_collection, parking_slots_collection, 
    parking_locations_collection, vehicles_collection, parking_logs_collection
)
from app.schemas.reservation import ReservationCreate
from app.utils.auth import get_current_user, get_admin_user
from app.utils.helpers import serialize_doc, generate_reservation_id

router = APIRouter(prefix="/api/reservations", tags=["Reservations"])

def calculate_cost(entry_time: datetime, exit_time: datetime, price_per_hour: float) -> float:
    """Calculate parking cost based on duration and hourly rate."""
    duration = (exit_time - entry_time).total_seconds() / 3600
    duration = max(duration, 0.5)  # Minimum 30 minutes
    return round(duration * price_per_hour, 2)

@router.post("/")
async def create_reservation(reservation: ReservationCreate, current_user: dict = Depends(get_current_user)):
    # Parse times
    try:
        entry_time = datetime.fromisoformat(reservation.entry_time.replace('Z', '+00:00'))
        exit_time = datetime.fromisoformat(reservation.exit_time.replace('Z', '+00:00'))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use ISO format.")
    
    if exit_time <= entry_time:
        raise HTTPException(status_code=400, detail="Exit time must be after entry time")
    
    # Verify location
    location = parking_locations_collection.find_one({"_id": ObjectId(reservation.location_id)})
    if not location:
        raise HTTPException(status_code=404, detail="Parking location not found")
    
    # Verify slot exists and is available
    slot = parking_slots_collection.find_one({"_id": ObjectId(reservation.slot_id)})
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    
    # Verify vehicle belongs to user
    vehicle = vehicles_collection.find_one({
        "_id": ObjectId(reservation.vehicle_id),
        "user_id": current_user["_id"]
    })
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found or doesn't belong to you")
    
    # Check for overlapping reservations on this slot (concurrency protection)
    overlapping = reservations_collection.find_one({
        "slot_id": reservation.slot_id,
        "status": {"$in": ["confirmed", "checked_in"]},
        "$or": [
            {"entry_time": {"$lt": exit_time}, "exit_time": {"$gt": entry_time}}
        ]
    })
    
    if overlapping:
        raise HTTPException(status_code=409, detail="This slot is already reserved for the selected time period")
    
    # Calculate estimated cost
    estimated_cost = calculate_cost(entry_time, exit_time, location["price_per_hour"])
    
    reservation_doc = {
        "reservation_id": generate_reservation_id(),
        "user_id": current_user["_id"],
        "location_id": reservation.location_id,
        "slot_id": reservation.slot_id,
        "vehicle_id": reservation.vehicle_id,
        "entry_time": entry_time,
        "exit_time": exit_time,
        "status": "confirmed",
        "estimated_cost": estimated_cost,
        "actual_cost": None,
        "created_at": datetime.utcnow()
    }
    
    result = reservations_collection.insert_one(reservation_doc)
    
    # Update slot status
    parking_slots_collection.update_one(
        {"_id": ObjectId(reservation.slot_id)},
        {"$set": {"status": "Reserved"}}
    )
    
    reservation_doc["_id"] = result.inserted_id
    return {"message": "Reservation created successfully", "reservation": serialize_doc(reservation_doc)}

@router.get("/my")
async def get_my_reservations(current_user: dict = Depends(get_current_user)):
    reservations = list(reservations_collection.find({"user_id": current_user["_id"]}).sort("created_at", -1))
    result = []
    for res in reservations:
        res_data = serialize_doc(res)
        # Attach location and vehicle names
        location = parking_locations_collection.find_one({"_id": ObjectId(res["location_id"])})
        slot = parking_slots_collection.find_one({"_id": ObjectId(res["slot_id"])})
        vehicle = vehicles_collection.find_one({"_id": ObjectId(res["vehicle_id"])})
        
        res_data["location_name"] = location["name"] if location else "Unknown"
        res_data["slot_number"] = slot["slot_number"] if slot else "Unknown"
        res_data["vehicle_number"] = vehicle["registration_number"] if vehicle else "Unknown"
        res_data["price_per_hour"] = location["price_per_hour"] if location else 0
        
        result.append(res_data)
    
    return result

@router.get("/all")
async def get_all_reservations(admin: dict = Depends(get_admin_user)):
    reservations = list(reservations_collection.find().sort("created_at", -1))
    result = []
    for res in reservations:
        res_data = serialize_doc(res)
        location = parking_locations_collection.find_one({"_id": ObjectId(res["location_id"])})
        slot = parking_slots_collection.find_one({"_id": ObjectId(res["slot_id"])})
        vehicle = vehicles_collection.find_one({"_id": ObjectId(res["vehicle_id"])})
        from app.database import users_collection
        user = users_collection.find_one({"_id": ObjectId(res["user_id"]) if isinstance(res["user_id"], str) else res["user_id"]})
        
        res_data["location_name"] = location["name"] if location else "Unknown"
        res_data["slot_number"] = slot["slot_number"] if slot else "Unknown"
        res_data["vehicle_number"] = vehicle["registration_number"] if vehicle else "Unknown"
        res_data["user_name"] = user["name"] if user else "Unknown"
        res_data["user_email"] = user["email"] if user else "Unknown"
        res_data["price_per_hour"] = location["price_per_hour"] if location else 0
        
        result.append(res_data)
    
    return result

@router.get("/{reservation_id}")
async def get_reservation(reservation_id: str, current_user: dict = Depends(get_current_user)):
    # Try by ObjectId first, then by reservation_id string
    reservation = reservations_collection.find_one({"_id": ObjectId(reservation_id)})
    if not reservation:
        reservation = reservations_collection.find_one({"reservation_id": reservation_id})
    
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    # Check ownership unless admin
    user_id = current_user["_id"]
    res_user_id = str(reservation["user_id"]) if isinstance(reservation["user_id"], ObjectId) else reservation["user_id"]
    
    if current_user.get("role") != "admin" and res_user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this reservation")
    
    res_data = serialize_doc(reservation)
    location = parking_locations_collection.find_one({"_id": ObjectId(reservation["location_id"])})
    slot = parking_slots_collection.find_one({"_id": ObjectId(reservation["slot_id"])})
    vehicle = vehicles_collection.find_one({"_id": ObjectId(reservation["vehicle_id"])})
    
    res_data["location_name"] = location["name"] if location else "Unknown"
    res_data["location_address"] = location["address"] if location else "Unknown"
    res_data["slot_number"] = slot["slot_number"] if slot else "Unknown"
    res_data["slot_type"] = slot["slot_type"] if slot else "Unknown"
    res_data["vehicle_number"] = vehicle["registration_number"] if vehicle else "Unknown"
    res_data["vehicle_model"] = vehicle["vehicle_model"] if vehicle else "Unknown"
    res_data["price_per_hour"] = location["price_per_hour"] if location else 0
    
    return res_data

@router.put("/{reservation_id}/cancel")
async def cancel_reservation(reservation_id: str, current_user: dict = Depends(get_current_user)):
    reservation = reservations_collection.find_one({"_id": ObjectId(reservation_id)})
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    # Check ownership unless admin
    user_id = current_user["_id"]
    res_user_id = str(reservation["user_id"]) if isinstance(reservation["user_id"], ObjectId) else reservation["user_id"]
    
    if current_user.get("role") != "admin" and res_user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if reservation["status"] not in ["confirmed"]:
        raise HTTPException(status_code=400, detail="Only confirmed reservations can be cancelled")
    
    reservations_collection.update_one(
        {"_id": ObjectId(reservation_id)},
        {"$set": {"status": "cancelled", "cancelled_at": datetime.utcnow()}}
    )
    
    # Release the slot
    parking_slots_collection.update_one(
        {"_id": ObjectId(reservation["slot_id"])},
        {"$set": {"status": "Available"}}
    )
    
    return {"message": "Reservation cancelled successfully"}
