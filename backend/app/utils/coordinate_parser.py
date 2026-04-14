"""
Coordinate parser utility.

Filenames use (x, y) = (longitude, latitude) ordering.
Example: ``-113.91782,50.896917.jpg``  → lon=-113.91782, lat=50.896917

The first value in the filename is longitude (x-axis),
the second is latitude (y-axis), matching standard GIS (lon, lat) ordering.
"""

import os
import re
from typing import Optional, Tuple

# Regex: two signed decimal numbers separated by a comma before the extension.
_COORD_PATTERN = re.compile(
    r"^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\.\w+$"
)


def parse_coordinates(filename: str) -> Optional[Tuple[float, float]]:
    """Parse latitude and longitude from an image filename.

    Filename format: ``lon,lat.ext``  (x, y ordering)
    Example: ``-113.91782,50.896917.jpg`` → (lat=50.896917, lon=-113.91782)

    Args:
        filename: The original filename (basename) of the uploaded image.

    Returns:
        A ``(latitude, longitude)`` tuple if the filename is valid,
        or ``None`` if the format cannot be parsed or values are out of range.
    """
    basename = os.path.basename(filename)
    match = _COORD_PATTERN.match(basename)
    if match is None:
        return None

    try:
        # First value  = longitude (x-axis)
        # Second value = latitude  (y-axis)
        lon = float(match.group(1))
        lat = float(match.group(2))
    except (ValueError, OverflowError):
        return None

    # Sanity bounds
    if not (-90.0 <= lat <= 90.0):
        return None
    if not (-180.0 <= lon <= 180.0):
        return None

    return lat, lon
