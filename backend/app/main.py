"""
FastAPI application entry point.

Registers CORS middleware and mounts all API routers.
Run with:
    uvicorn app.main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.predict import router as predict_router

app = FastAPI(
    title="Wildfire Prediction API",
    description="Deep-learning wildfire prediction with AQI estimation",
    version="1.0.0",
)

# --- CORS (allow Next.js dev server) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routes ---
app.include_router(predict_router, tags=["Prediction"])


@app.get("/health")
async def health():
    """Simple health-check endpoint."""
    return {"status": "ok"}
