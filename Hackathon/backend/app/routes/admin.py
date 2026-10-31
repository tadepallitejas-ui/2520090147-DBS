from fastapi import APIRouter, Depends
from datetime import datetime, timedelta
from bson import ObjectId
from app.database import (
    users_collection, vehicles_collection, parking_locations_collection,
    parking_slots_collection, reservations_collection, parking_logs_collection
)
from app.utils.auth import get_admin_user
from app.utils.helpers import serialize_doc

router = APIRouter(prefix="/api/admin", tags=["Admin"])

@router.get("/stats")
async def get_dashboard_stats(admin: dict = Depends(get_admin_user)):
    total_locations = parking_locations_collection.count_documents({})
    total_slots = parking_slots_collection.count_documents({})
    available_slots = parking_slots_collection.count_documents({"status": "Available"})
    occupied_slots = parking_slots_collection.count_documents({"status": "Occupied"})
    reserved_slots = parking_slots_collection.count_documents({"status": "Reserved"})
    maintenance_slots = parking_slots_collection.count_documents({"status": "Maintenance"})
    total_users = users_collection.count_documents({"role": "user"})
    total_vehicles = vehicles_collection.count_documents({})
    active_reservations = reservations_collection.count_documents({"status": {"$in": ["confirmed", "checked_in"]}})
    
    # Today's revenue
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_logs = list(parking_logs_collection.find({
        "status": "completed",
        "exit_timestamp": {"$gte": today_start}
    }))
    today_revenue = sum(log.get("parking_fee", 0) or 0 for log in today_logs)
    
    # Total revenue
    all_completed_logs = list(parking_logs_collection.find({"status": "completed"}))
    total_revenue = sum(log.get("parking_fee", 0) or 0 for log in all_completed_logs)
    
    utilization = round((occupied_slots + reserved_slots) / total_slots * 100, 1) if total_slots > 0 else 0
    
    return {
        "total_locations": total_locations,
        "total_slots": total_slots,
        "available_slots": available_slots,
        "occupied_slots": occupied_slots,
        "reserved_slots": reserved_slots,
        "maintenance_slots": maintenance_slots,
        "total_users": total_users,
        "total_vehicles": total_vehicles,
        "active_reservations": active_reservations,
        "today_revenue": round(today_revenue, 2),
        "total_revenue": round(total_revenue, 2),
        "utilization_percentage": utilization
    }

@router.get("/charts/daily-reservations")
async def get_daily_reservations(admin: dict = Depends(get_admin_user)):
    """Get reservation counts for the last 7 days."""
    result = []
    for i in range(6, -1, -1):
        day = datetime.utcnow() - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        
        count = reservations_collection.count_documents({
            "created_at": {"$gte": day_start, "$lt": day_end}
        })
        
        result.append({
            "date": day_start.strftime("%b %d"),
            "reservations": count
        })
    
    return result

@router.get("/charts/revenue-trend")
async def get_revenue_trend(admin: dict = Depends(get_admin_user)):
    """Get revenue for the last 7 days."""
    result = []
    for i in range(6, -1, -1):
        day = datetime.utcnow() - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        
        logs = list(parking_logs_collection.find({
            "status": "completed",
            "exit_timestamp": {"$gte": day_start, "$lt": day_end}
        }))
        
        revenue = sum(log.get("parking_fee", 0) or 0 for log in logs)
        
        result.append({
            "date": day_start.strftime("%b %d"),
            "revenue": round(revenue, 2)
        })
    
    return result

@router.get("/charts/slot-distribution")
async def get_slot_distribution(admin: dict = Depends(get_admin_user)):
    """Get slot status distribution."""
    return [
        {"name": "Available", "value": parking_slots_collection.count_documents({"status": "Available"})},
        {"name": "Occupied", "value": parking_slots_collection.count_documents({"status": "Occupied"})},
        {"name": "Reserved", "value": parking_slots_collection.count_documents({"status": "Reserved"})},
        {"name": "Maintenance", "value": parking_slots_collection.count_documents({"status": "Maintenance"})}
    ]

@router.get("/charts/peak-hours")
async def get_peak_hours(admin: dict = Depends(get_admin_user)):
    """Get parking usage by hour of the day."""
    result = []
    for hour in range(24):
        count = parking_logs_collection.count_documents({
            "entry_timestamp": {"$exists": True}
        })
        # Count entries for this hour from all logs
        logs = list(parking_logs_collection.find({"entry_timestamp": {"$exists": True}}))
        hour_count = sum(1 for log in logs if log.get("entry_timestamp") and log["entry_timestamp"].hour == hour)
        
        result.append({
            "hour": f"{hour:02d}:00",
            "entries": hour_count
        })
    
    return result

@router.get("/users")
async def get_all_users(admin: dict = Depends(get_admin_user)):
    users = list(users_collection.find({}, {"password": 0}))
    result = []
    for user in users:
        user_data = serialize_doc(user)
        vehicle_count = vehicles_collection.count_documents({"user_id": str(user["_id"])})
        # Also check with ObjectId
        vehicle_count += vehicles_collection.count_documents({"user_id": user["_id"]})
        user_data["vehicle_count"] = vehicle_count
        result.append(user_data)
    return result

@router.get("/vehicles")
async def get_all_vehicles(admin: dict = Depends(get_admin_user)):
    vehicles = list(vehicles_collection.find())
    result = []
    for v in vehicles:
        v_data = serialize_doc(v)
        user = users_collection.find_one({"_id": ObjectId(v["user_id"]) if isinstance(v["user_id"], str) else v["user_id"]})
        v_data["owner_name"] = user["name"] if user else "Unknown"
        v_data["owner_email"] = user["email"] if user else "Unknown"
        result.append(v_data)
    return result
