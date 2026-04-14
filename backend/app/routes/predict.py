"""
Prediction route — ``POST /predict``.

Receives an uploaded image, runs inference, extracts coordinates from the
filename, computes estimated AQI, and returns a unified JSON response.
"""

from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel

from app.services import model_service
from app.services.aqi_service import estimate_aqi
from app.utils.coordinate_parser import parse_coordinates
from app.utils.image_processing import preprocess_image

router = APIRouter()


class PredictionResponse(BaseModel):
    """Schema returned by ``POST /predict``."""
    confidence: float
    predicted_class: int
    latitude: float
    longitude: float
    aqi: int
    aqi_status: str


@router.post("/predict", response_model=PredictionResponse)
async def predict(file: UploadFile = File(...)):
    """Handle image upload, run model inference, and return results."""

    # --- 1. Validate file type ---
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is not a valid image.",
        )

    # --- 2. Extract coordinates from filename ---
    coords = parse_coordinates(file.filename or "")
    if coords is None:
        raise HTTPException(
            status_code=422,
            detail=(
                "Could not extract coordinates from filename. "
                "Expected format: latitude,longitude.jpg  (e.g. 52.13,-106.67.jpg)"
            ),
        )
    latitude, longitude = coords

    # --- 3. Read and preprocess image ---
    try:
        raw_bytes = await file.read()
        image_array = preprocess_image(raw_bytes)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    # --- 4. Run model inference ---
    try:
        confidence = model_service.predict(image_array)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Model inference failed: {exc}",
        )

    # Determine the predicted class (argmax over 2 classes)
    predicted_class = 1 if confidence >= 0.5 else 0

    # --- 5. Compute estimated AQI ---
    aqi_value, aqi_category = estimate_aqi(confidence)

    return PredictionResponse(
        confidence=round(confidence, 4),
        predicted_class=predicted_class,
        latitude=latitude,
        longitude=longitude,
        aqi=aqi_value,
        aqi_status=aqi_category,
    )
