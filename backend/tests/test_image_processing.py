"""
Unit tests for image preprocessing utility.
"""

import io
import numpy as np
import pytest
from PIL import Image

from app.utils.image_processing import preprocess_image, TARGET_SIZE


def _create_test_image(width: int = 500, height: int = 400, mode: str = "RGB") -> bytes:
    """Create an in-memory test image and return its bytes."""
    img = Image.new(mode, (width, height), color="red")
    buf = io.BytesIO()
    # JPEG doesn't support RGBA/LA, so use PNG for modes with alpha
    fmt = "PNG" if "A" in mode else "JPEG"
    img.save(buf, format=fmt)
    return buf.getvalue()


class TestPreprocessImage:
    """Tests for ``preprocess_image``."""

    def test_output_shape(self):
        raw = _create_test_image()
        result = preprocess_image(raw)
        assert result.shape == (1, TARGET_SIZE[0], TARGET_SIZE[1], 3)

    def test_output_dtype(self):
        raw = _create_test_image()
        result = preprocess_image(raw)
        assert result.dtype == np.float32

    def test_output_range(self):
        raw = _create_test_image()
        result = preprocess_image(raw)
        assert result.min() >= 0.0
        assert result.max() <= 1.0

    def test_rgba_conversion(self):
        """RGBA images should be converted to RGB without error."""
        raw = _create_test_image(mode="RGBA")
        result = preprocess_image(raw)
        assert result.shape == (1, TARGET_SIZE[0], TARGET_SIZE[1], 3)

    def test_grayscale_conversion(self):
        """Grayscale images should be converted to RGB."""
        raw = _create_test_image(mode="L")
        result = preprocess_image(raw)
        assert result.shape == (1, TARGET_SIZE[0], TARGET_SIZE[1], 3)

    def test_invalid_bytes_raises(self):
        with pytest.raises(ValueError, match="Unable to decode"):
            preprocess_image(b"not-an-image")
