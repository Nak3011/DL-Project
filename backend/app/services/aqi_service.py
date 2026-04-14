"""
AQI estimation service.

Computes an *estimated* AQI value based on wildfire prediction confidence.

Methodology:
    During a wildfire the dominant pollutant is **PM2.5**.
    We map model confidence (0-1) to an estimated PM2.5 concentration
    and then convert that concentration to an AQI sub-index using the
    US EPA breakpoint table for PM2.5 (24-hour average).

    This is a simulation; a real-world system would ingest sensor data.
"""

from typing import Tuple

# ---------------------------------------------------------------
# EPA AQI breakpoints for PM2.5 (24-hour, µg/m³)
# Each tuple: (C_lo, C_hi, I_lo, I_hi, category)
# ---------------------------------------------------------------
_PM25_BREAKPOINTS = [
    (0.0,   12.0,   0,  50,  "Good"),
    (12.1,  35.4,  51, 100,  "Moderate"),
    (35.5,  55.4, 101, 150,  "Unhealthy for Sensitive Groups"),
    (55.5, 150.4, 151, 200,  "Unhealthy"),
    (150.5, 250.4, 201, 300,  "Very Unhealthy"),
    (250.5, 500.4, 301, 500,  "Hazardous"),
]

# Confidence → estimated PM2.5 mapping
# 0.0 confidence → ~5 µg/m³  (clean air)
# 1.0 confidence → ~400 µg/m³ (severe wildfire smoke)
_PM25_MIN = 5.0
_PM25_MAX = 400.0


def _confidence_to_pm25(confidence: float) -> float:
    """Map a wildfire confidence score to an estimated PM2.5 concentration."""
    return _PM25_MIN + confidence * (_PM25_MAX - _PM25_MIN)


def _pm25_to_aqi(concentration: float) -> Tuple[int, str]:
    """Convert a PM2.5 concentration (µg/m³) to an AQI value and category.

    Uses the standard EPA piecewise-linear interpolation formula:
        AQI = ((I_hi - I_lo) / (C_hi - C_lo)) * (C - C_lo) + I_lo
    """
    for c_lo, c_hi, i_lo, i_hi, category in _PM25_BREAKPOINTS:
        if c_lo <= concentration <= c_hi:
            aqi = ((i_hi - i_lo) / (c_hi - c_lo)) * (concentration - c_lo) + i_lo
            return round(aqi), category

    # Concentration exceeds the table → cap at Hazardous
    return 500, "Hazardous"


def estimate_aqi(confidence: float) -> Tuple[int, str]:
    """Estimate AQI from wildfire prediction confidence.

    Args:
        confidence: Model confidence score in ``[0, 1]``.

    Returns:
        A tuple of ``(aqi_value, aqi_category)``.
        Example: ``(165, "Unhealthy")``.
    """
    confidence = max(0.0, min(1.0, confidence))
    pm25 = _confidence_to_pm25(confidence)
    return _pm25_to_aqi(pm25)
