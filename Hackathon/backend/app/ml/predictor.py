import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from datetime import datetime, timedelta
from app.database import parking_logs_collection, parking_slots_collection, predictions_collection
import warnings
warnings.filterwarnings('ignore')

def generate_sample_data(n_records=500):
    """Generate sample historical parking data when real data is insufficient."""
    np.random.seed(42)
    records = []
    
    for _ in range(n_records):
        day_offset = np.random.randint(0, 90)
        hour = np.random.choice(range(24), p=_hour_probability())
        
        base_date = datetime.utcnow() - timedelta(days=day_offset)
        entry_time = base_date.replace(hour=hour, minute=np.random.randint(0, 60))
        duration = max(0.5, np.random.exponential(2.5))
        exit_time = entry_time + timedelta(hours=duration)
        
        records.append({
            "entry_timestamp": entry_time,
            "exit_timestamp": exit_time,
            "duration_hours": round(duration, 2),
            "day_of_week": entry_time.weekday(),
            "hour_of_day": hour,
            "status": "completed"
        })
    
    return pd.DataFrame(records)

def _hour_probability():
    """Realistic hourly parking probability distribution."""
    probs = [
        0.01, 0.005, 0.005, 0.005, 0.005, 0.01,  # 0-5 AM (low)
        0.02, 0.04, 0.08, 0.09, 0.08, 0.07,       # 6-11 AM (morning rush)
        0.06, 0.05, 0.05, 0.06, 0.07, 0.08,        # 12-5 PM (afternoon)
        0.07, 0.06, 0.05, 0.04, 0.03, 0.02          # 6-11 PM (evening decline)
    ]
    # Normalize
    total = sum(probs)
    return [p / total for p in probs]

def train_occupancy_model():
    """Train a Random Forest model to predict parking occupancy."""
    # Try to use real data first
    logs = list(parking_logs_collection.find({"status": "completed", "entry_timestamp": {"$exists": True}}))
    
    use_sample_data = len(logs) < 50
    
    if use_sample_data:
        df = generate_sample_data(500)
        data_source = "sample"
    else:
        data = []
        for log in logs:
            if log.get("entry_timestamp"):
                entry = log["entry_timestamp"]
                data.append({
                    "entry_timestamp": entry,
                    "duration_hours": log.get("duration_hours", 1.0),
                    "day_of_week": entry.weekday(),
                    "hour_of_day": entry.hour,
                })
        df = pd.DataFrame(data)
        data_source = "historical"
    
    # Calculate occupancy by hour and day
    total_slots = parking_slots_collection.count_documents({})
    if total_slots == 0:
        total_slots = 50  # Default
    
    # Feature engineering
    occupancy_data = []
    for day in range(7):
        for hour in range(24):
            mask = (df["day_of_week"] == day) & (df["hour_of_day"] == hour)
            count = mask.sum()
            occupancy_pct = min((count / max(len(df) / (7 * 24), 1)) * 100 / total_slots * 50, 95)
            
            occupancy_data.append({
                "day_of_week": day,
                "hour_of_day": hour,
                "is_weekend": 1 if day >= 5 else 0,
                "is_peak_morning": 1 if 7 <= hour <= 10 else 0,
                "is_peak_evening": 1 if 16 <= hour <= 19 else 0,
                "occupancy_pct": occupancy_pct
            })
    
    occ_df = pd.DataFrame(occupancy_data)
    
    features = ["day_of_week", "hour_of_day", "is_weekend", "is_peak_morning", "is_peak_evening"]
    X = occ_df[features]
    y = occ_df["occupancy_pct"]
    
    model = RandomForestRegressor(n_estimators=100, random_state=42, max_depth=10)
    model.fit(X, y)
    
    return model, data_source, total_slots

def predict_next_24_hours():
    """Predict occupancy for the next 24 hours."""
    model, data_source, total_slots = train_occupancy_model()
    
    predictions = []
    now = datetime.utcnow()
    
    for i in range(24):
        future_time = now + timedelta(hours=i)
        day_of_week = future_time.weekday()
        hour = future_time.hour
        
        features = pd.DataFrame([{
            "day_of_week": day_of_week,
            "hour_of_day": hour,
            "is_weekend": 1 if day_of_week >= 5 else 0,
            "is_peak_morning": 1 if 7 <= hour <= 10 else 0,
            "is_peak_evening": 1 if 16 <= hour <= 19 else 0
        }])
        
        predicted_pct = float(model.predict(features)[0])
        predicted_pct = max(5, min(predicted_pct, 95))
        predicted_occupied = int(total_slots * predicted_pct / 100)
        
        predictions.append({
            "time": future_time.strftime("%H:%M"),
            "datetime": future_time.isoformat(),
            "hour": hour,
            "day_of_week": day_of_week,
            "day_name": future_time.strftime("%A"),
            "predicted_occupancy_pct": round(predicted_pct, 1),
            "predicted_occupied_slots": predicted_occupied,
            "total_slots": total_slots
        })
    
    # Store prediction
    prediction_record = {
        "predictions": predictions,
        "data_source": data_source,
        "model_type": "RandomForestRegressor",
        "total_slots": total_slots,
        "created_at": datetime.utcnow()
    }
    predictions_collection.insert_one(prediction_record)
    
    return {
        "predictions": predictions,
        "metadata": {
            "data_source": data_source,
            "model": "Random Forest Regressor",
            "total_slots": total_slots,
            "generated_at": datetime.utcnow().isoformat(),
            "note": "Predictions based on sample data for demonstration" if data_source == "sample" else "Predictions based on historical parking records"
        }
    }
