"""Seed the database with realistic demonstration data."""
from datetime import datetime, timedelta
from bson import ObjectId
from app.database import (
    users_collection, vehicles_collection, parking_locations_collection,
    parking_slots_collection, reservations_collection, parking_logs_collection
)
from app.utils.auth import hash_password
from app.utils.helpers import generate_reservation_id
import random

def seed_database():
    """Seed database with initial demo data if empty."""
    
    # Only seed if no users exist
    if users_collection.count_documents({}) > 0:
        print("Database already seeded. Skipping.")
        return
    
    print("Seeding database...")
    
    # Create admin user
    admin_id = users_collection.insert_one({
        "name": "Admin User",
        "email": "admin@smartparking.com",
        "password": hash_password("admin123"),
        "phone": "+91 9876543210",
        "role": "admin",
        "created_at": datetime.utcnow()
    }).inserted_id
    
    # Create demo users
    user_ids = []
    demo_users = [
        {"name": "Rahul Sharma", "email": "rahul@example.com", "phone": "+91 9876543211"},
        {"name": "Priya Patel", "email": "priya@example.com", "phone": "+91 9876543212"},
        {"name": "Amit Kumar", "email": "amit@example.com", "phone": "+91 9876543213"},
        {"name": "Sneha Reddy", "email": "sneha@example.com", "phone": "+91 9876543214"},
        {"name": "Vikram Singh", "email": "vikram@example.com", "phone": "+91 9876543215"},
    ]
    
    for user in demo_users:
        uid = users_collection.insert_one({
            **user,
            "password": hash_password("password123"),
            "role": "user",
            "created_at": datetime.utcnow() - timedelta(days=random.randint(1, 30))
        }).inserted_id
        user_ids.append(uid)
    
    # Create vehicles
    vehicle_data = [
        {"user_id": str(user_ids[0]), "registration_number": "KA01AB1234", "vehicle_type": "Car", "vehicle_model": "Hyundai Creta", "vehicle_color": "White"},
        {"user_id": str(user_ids[0]), "registration_number": "KA01CD5678", "vehicle_type": "Motorcycle", "vehicle_model": "Royal Enfield Classic", "vehicle_color": "Black"},
        {"user_id": str(user_ids[1]), "registration_number": "MH02EF9012", "vehicle_type": "Car", "vehicle_model": "Maruti Swift", "vehicle_color": "Red"},
        {"user_id": str(user_ids[2]), "registration_number": "DL03GH3456", "vehicle_type": "SUV", "vehicle_model": "Toyota Fortuner", "vehicle_color": "Silver"},
        {"user_id": str(user_ids[3]), "registration_number": "TN04IJ7890", "vehicle_type": "Car", "vehicle_model": "Honda City", "vehicle_color": "Blue"},
        {"user_id": str(user_ids[4]), "registration_number": "AP05KL2345", "vehicle_type": "Car", "vehicle_model": "Kia Seltos", "vehicle_color": "Grey"},
    ]
    
    vehicle_ids = []
    for v in vehicle_data:
        vid = vehicles_collection.insert_one({
            **v,
            "created_at": datetime.utcnow() - timedelta(days=random.randint(1, 20))
        }).inserted_id
        vehicle_ids.append(vid)
    
    # Create parking locations
    locations_data = [
        {
            "name": "City Center Mall Parking",
            "address": "123 MG Road, City Center",
            "city": "Bangalore",
            "description": "Premium multi-level parking at City Center Mall with 24/7 security and EV charging stations.",
            "total_slots": 30,
            "price_per_hour": 40.0,
            "operating_hours": "24/7",
            "parking_type": "Multi-level"
        },
        {
            "name": "Tech Park Plaza",
            "address": "456 Whitefield Road, ITPL",
            "city": "Bangalore",
            "description": "Modern underground parking facility near major IT parks with smart access control.",
            "total_slots": 25,
            "price_per_hour": 30.0,
            "operating_hours": "6:00 AM - 11:00 PM",
            "parking_type": "Underground"
        },
        {
            "name": "Railway Station Parking",
            "address": "789 Station Road",
            "city": "Hyderabad",
            "description": "Convenient open-air parking near the railway station with affordable rates.",
            "total_slots": 20,
            "price_per_hour": 20.0,
            "operating_hours": "24/7",
            "parking_type": "Outdoor"
        },
        {
            "name": "Phoenix Mall Parking",
            "address": "101 Hitech City Road",
            "city": "Hyderabad",
            "description": "State-of-the-art indoor parking with automated bay detection and digital signage.",
            "total_slots": 35,
            "price_per_hour": 50.0,
            "operating_hours": "8:00 AM - 12:00 AM",
            "parking_type": "Indoor"
        },
        {
            "name": "Connaught Place Parking",
            "address": "Block A, Connaught Place",
            "city": "Delhi",
            "description": "Central Delhi parking facility with covered spaces and wheelchair accessibility.",
            "total_slots": 15,
            "price_per_hour": 60.0,
            "operating_hours": "24/7",
            "parking_type": "Underground"
        },
    ]
    
    location_ids = []
    for loc in locations_data:
        total = loc["total_slots"]
        lid = parking_locations_collection.insert_one({
            **loc,
            "created_at": datetime.utcnow() - timedelta(days=random.randint(30, 90))
        }).inserted_id
        location_ids.append(lid)
        
        # Create slots for each location
        slots = []
        for i in range(1, total + 1):
            slot_type = "Regular"
            if i <= max(1, total // 10):
                slot_type = "Disabled"
            elif i <= max(2, total // 5):
                slot_type = "EV"
            
            slots.append({
                "location_id": str(lid),
                "slot_number": f"S{str(i).zfill(3)}",
                "slot_type": slot_type,
                "status": "Available",
                "created_at": datetime.utcnow()
            })
        
        parking_slots_collection.insert_many(slots)
    
    # Create some reservations and parking logs for history
    now = datetime.utcnow()
    
    for i in range(20):
        loc_idx = random.randint(0, len(location_ids) - 1)
        loc_id = location_ids[loc_idx]
        location = parking_locations_collection.find_one({"_id": loc_id})
        
        # Get a random available slot
        slot = parking_slots_collection.find_one({
            "location_id": str(loc_id),
            "status": "Available"
        })
        
        if not slot:
            continue
        
        user_idx = random.randint(0, len(user_ids) - 1)
        vehicle_idx = min(user_idx, len(vehicle_ids) - 1)
        
        days_ago = random.randint(1, 30)
        entry_hour = random.randint(6, 20)
        duration_hours = random.uniform(0.5, 6)
        
        entry_time = now - timedelta(days=days_ago, hours=random.randint(0, 12))
        entry_time = entry_time.replace(hour=entry_hour, minute=random.randint(0, 59))
        exit_time = entry_time + timedelta(hours=duration_hours)
        
        cost = round(duration_hours * location["price_per_hour"], 2)
        
        res_id = reservations_collection.insert_one({
            "reservation_id": generate_reservation_id(),
            "user_id": str(user_ids[user_idx]),
            "location_id": str(loc_id),
            "slot_id": str(slot["_id"]),
            "vehicle_id": str(vehicle_ids[vehicle_idx]),
            "entry_time": entry_time,
            "exit_time": exit_time,
            "status": "completed",
            "estimated_cost": cost,
            "actual_cost": cost,
            "actual_entry_time": entry_time,
            "actual_exit_time": exit_time,
            "created_at": entry_time - timedelta(hours=1)
        }).inserted_id
        
        # Create parking log
        parking_logs_collection.insert_one({
            "reservation_id": str(res_id),
            "vehicle_id": str(vehicle_ids[vehicle_idx]),
            "slot_id": str(slot["_id"]),
            "location_id": str(loc_id),
            "entry_timestamp": entry_time,
            "exit_timestamp": exit_time,
            "duration_hours": round(duration_hours, 2),
            "parking_fee": cost,
            "status": "completed",
            "created_at": entry_time
        })
    
    # Create a few active reservations
    for i in range(3):
        loc_idx = i % len(location_ids)
        loc_id = location_ids[loc_idx]
        location = parking_locations_collection.find_one({"_id": loc_id})
        
        slot = parking_slots_collection.find_one({
            "location_id": str(loc_id),
            "status": "Available"
        })
        
        if not slot:
            continue
        
        user_idx = i % len(user_ids)
        vehicle_idx = min(user_idx, len(vehicle_ids) - 1)
        
        entry_time = now + timedelta(hours=random.randint(1, 5))
        exit_time = entry_time + timedelta(hours=random.randint(2, 5))
        cost = round((exit_time - entry_time).total_seconds() / 3600 * location["price_per_hour"], 2)
        
        reservations_collection.insert_one({
            "reservation_id": generate_reservation_id(),
            "user_id": str(user_ids[user_idx]),
            "location_id": str(loc_id),
            "slot_id": str(slot["_id"]),
            "vehicle_id": str(vehicle_ids[vehicle_idx]),
            "entry_time": entry_time,
            "exit_time": exit_time,
            "status": "confirmed",
            "estimated_cost": cost,
            "actual_cost": None,
            "created_at": datetime.utcnow()
        })
        
        # Mark slot as reserved
        parking_slots_collection.update_one(
            {"_id": slot["_id"]},
            {"$set": {"status": "Reserved"}}
        )
    
    print("Database seeded successfully!")
    print(f"Admin login: admin@smartparking.com / admin123")
    print(f"User login: rahul@example.com / password123")
