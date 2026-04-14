"""
Integration tests for the ``POST /predict`` endpoint.

Filenames use lon,lat ordering: ``-106.67,52.13.jpg``
→ longitude=-106.67, latitude=52.13
"""

import io
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app

client = TestClient(app)


def _create_test_image_bytes() -> bytes:
    """Generate a minimal JPEG image in memory."""
    img = Image.new("RGB", (100, 100), color="green")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)
    return buf.getvalue()


class TestPredictEndpoint:
    """Integration tests for ``/predict``."""

    @patch("app.routes.predict.model_service.predict", return_value=0.78)
    def test_valid_prediction(self, mock_predict):
        image_bytes = _create_test_image_bytes()
        response = client.post(
            "/predict",
            # Filename: lon=-106.67, lat=52.13
            files={"file": ("-106.67,52.13.jpg", image_bytes, "image/jpeg")},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["confidence"] == 0.78
        assert data["latitude"] == 52.13
        assert data["longitude"] == -106.67
        assert data["predicted_class"] == 1
        assert isinstance(data["aqi"], int)
        assert isinstance(data["aqi_status"], str)

    @patch("app.routes.predict.model_service.predict", return_value=0.1)
    def test_low_confidence(self, mock_predict):
        image_bytes = _create_test_image_bytes()
        response = client.post(
            "/predict",
            files={"file": ("-106.67,52.13.jpg", image_bytes, "image/jpeg")},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["predicted_class"] == 0
        assert data["aqi"] <= 160

    def test_invalid_filename_format(self):
        image_bytes = _create_test_image_bytes()
        response = client.post(
            "/predict",
            files={"file": ("image.jpg", image_bytes, "image/jpeg")},
        )
        assert response.status_code == 422
        assert "coordinates" in response.json()["detail"].lower()

    def test_invalid_file_content(self):
        response = client.post(
            "/predict",
            files={"file": ("-106.67,52.13.jpg", b"not-an-image", "image/jpeg")},
        )
        assert response.status_code == 400

    def test_health_endpoint(self):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}
