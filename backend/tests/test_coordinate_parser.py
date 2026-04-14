"""
Unit tests for the coordinate parser utility.

Filename format is  lon,lat.ext  (x, y ordering).
e.g. ``-113.91782,50.896917.jpg``  → (lat=50.896917, lon=-113.91782)
"""

import pytest
from app.utils.coordinate_parser import parse_coordinates


class TestParseCoordinates:
    """Tests for ``parse_coordinates``."""

    def test_valid_positive_coords(self):
        """Positive lon then positive lat → correct (lat, lon) returned."""
        result = parse_coordinates("106.67,52.13.jpg")
        assert result == (52.13, 106.67)

    def test_valid_negative_longitude(self):
        """Typical Canadian coordinate: lon negative, lat positive."""
        result = parse_coordinates("-106.67,52.13.jpg")
        assert result == (52.13, -106.67)

    def test_valid_calgary_coords(self):
        """Real Calgary coordinates as they appear in filenames."""
        result = parse_coordinates("-113.91782,50.896917.jpg")
        assert result == (50.896917, -113.91782)

    def test_valid_negative_both(self):
        """Southern-hemisphere coordinate with negative lon."""
        result = parse_coordinates("-106.67,-52.13.png")
        assert result == (-52.13, -106.67)

    def test_valid_integer_coords(self):
        result = parse_coordinates("-106,52.jpg")
        assert result == (52.0, -106.0)

    def test_invalid_no_coords(self):
        result = parse_coordinates("image.jpg")
        assert result is None

    def test_invalid_empty_string(self):
        result = parse_coordinates("")
        assert result is None

    def test_invalid_partial_coords(self):
        result = parse_coordinates("52.13.jpg")
        assert result is None

    def test_invalid_latitude_out_of_range(self):
        """Second value (lat) = -106.67 is outside [-90, 90] → None."""
        result = parse_coordinates("95.00,-106.67.jpg")
        assert result is None

    def test_invalid_longitude_out_of_range(self):
        """First value (lon) = -200.00 is outside [-180, 180] → None."""
        result = parse_coordinates("-200.00,52.13.jpg")
        assert result is None

    def test_path_with_directories(self):
        result = parse_coordinates("/path/to/-106.67,52.13.jpg")
        assert result == (52.13, -106.67)

    def test_different_extension(self):
        result = parse_coordinates("-106.67,52.13.jpeg")
        assert result == (52.13, -106.67)
