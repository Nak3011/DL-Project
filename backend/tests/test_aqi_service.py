"""
Unit tests for the AQI estimation service.
"""

import pytest
from app.services.aqi_service import estimate_aqi


class TestEstimateAqi:
    """Tests for ``estimate_aqi``."""

    def test_zero_confidence_is_good(self):
        aqi, status = estimate_aqi(0.0)
        assert aqi <= 50
        assert status == "Good"

    def test_low_confidence_moderate_or_lower(self):
        aqi, status = estimate_aqi(0.1)
        assert aqi <= 160
        assert status in ("Good", "Moderate", "Unhealthy for Sensitive Groups")

    def test_mid_confidence_elevated(self):
        aqi, status = estimate_aqi(0.5)
        assert aqi > 50
        assert status not in ("Good",)

    def test_high_confidence_unhealthy(self):
        aqi, status = estimate_aqi(0.8)
        assert aqi > 150

    def test_full_confidence_hazardous(self):
        aqi, status = estimate_aqi(1.0)
        assert aqi >= 300
        assert status in ("Very Unhealthy", "Hazardous")

    def test_clamp_below_zero(self):
        """Confidence below 0 should be clamped to 0."""
        aqi, status = estimate_aqi(-0.5)
        assert aqi <= 50
        assert status == "Good"

    def test_clamp_above_one(self):
        """Confidence above 1 should be clamped to 1."""
        aqi, _ = estimate_aqi(1.5)
        assert aqi >= 300

    def test_returns_int_aqi(self):
        aqi, _ = estimate_aqi(0.5)
        assert isinstance(aqi, int)

    def test_monotonic_increase(self):
        """AQI should increase monotonically with confidence."""
        prev_aqi = 0
        for c in [0.0, 0.2, 0.4, 0.6, 0.8, 1.0]:
            aqi, _ = estimate_aqi(c)
            assert aqi >= prev_aqi
            prev_aqi = aqi
