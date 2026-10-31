from fastapi import APIRouter, Depends
from app.utils.auth import get_admin_user
from app.ml.predictor import predict_next_24_hours

router = APIRouter(prefix="/api/predictions", tags=["Predictions"])

@router.get("/occupancy")
async def get_occupancy_predictions(admin: dict = Depends(get_admin_user)):
    """Get predicted parking occupancy for the next 24 hours."""
    result = predict_next_24_hours()
    return result
