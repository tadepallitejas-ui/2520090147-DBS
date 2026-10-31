from pymongo import MongoClient, ASCENDING, DESCENDING
from app.config import settings
import logging

logger = logging.getLogger("smart_parking.database")

def get_mongo_client():
    url = settings.MONGODB_URL
    try:
        c = MongoClient(url, serverSelectionTimeoutMS=4000)
        c.admin.command('ping')
        logger.info(f"Connected to MongoDB at {url}")
        return c
    except Exception as e:
        logger.warning(f"Could not connect to configured MONGODB_URL ({e}). Falling back to mongodb://localhost:27017")
        try:
            fallback = MongoClient("mongodb://localhost:27017", serverSelectionTimeoutMS=3000)
            fallback.admin.command('ping')
            logger.info("Successfully connected to fallback local MongoDB at mongodb://localhost:27017")
            return fallback
        except Exception as e2:
            logger.error(f"Fallback connection also failed: {e2}")
            # return client anyway to let pymongo handle reconnection
            return MongoClient(url)

client = get_mongo_client()
db = client[settings.DATABASE_NAME]

# Collections
users_collection = db["users"]
vehicles_collection = db["vehicles"]
parking_locations_collection = db["parking_locations"]
parking_slots_collection = db["parking_slots"]
reservations_collection = db["reservations"]
parking_logs_collection = db["parking_logs"]
predictions_collection = db["predictions"]

def create_indexes():
    """Create database indexes for performance."""
    try:
        users_collection.create_index([("email", ASCENDING)], unique=True)
        vehicles_collection.create_index([("registration_number", ASCENDING)], unique=True)
        vehicles_collection.create_index([("user_id", ASCENDING)])
        parking_locations_collection.create_index([("city", ASCENDING)])
        parking_slots_collection.create_index([("location_id", ASCENDING)])
        parking_slots_collection.create_index([("status", ASCENDING)])
        parking_slots_collection.create_index([("location_id", ASCENDING), ("slot_number", ASCENDING)], unique=True)
        reservations_collection.create_index([("user_id", ASCENDING)])
        reservations_collection.create_index([("slot_id", ASCENDING)])
        reservations_collection.create_index([("status", ASCENDING)])
        reservations_collection.create_index([("entry_time", ASCENDING), ("exit_time", ASCENDING)])
        parking_logs_collection.create_index([("reservation_id", ASCENDING)])
        parking_logs_collection.create_index([("vehicle_id", ASCENDING)])
        predictions_collection.create_index([("location_id", ASCENDING)])
        predictions_collection.create_index([("created_at", DESCENDING)])
    except Exception as e:
        logger.warning(f"Index creation warning: {e}")
