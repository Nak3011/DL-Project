"""
Image processing utility.

Handles decoding, resizing, and normalising uploaded images
so they match the model's expected input shape (350 × 350 × 3, float32 [0-1]).
"""

import io
from typing import Tuple

import numpy as np
from PIL import Image

# Model-specific constants
TARGET_SIZE: Tuple[int, int] = (350, 350)
NUM_CHANNELS: int = 3


def preprocess_image(raw_bytes: bytes) -> np.ndarray:
    """Convert raw image bytes into a model-ready NumPy tensor.

    Steps:
        1. Decode bytes → PIL Image
        2. Convert to RGB (handles RGBA, grayscale, etc.)
        3. Resize to ``TARGET_SIZE``
        4. Cast to float32 and normalise to [0, 1]
        5. Add batch dimension → shape ``(1, 350, 350, 3)``

    Args:
        raw_bytes: Raw bytes read from the uploaded file.

    Returns:
        A NumPy array of shape ``(1, 350, 350, 3)`` with dtype ``float32``.

    Raises:
        ValueError: If the image cannot be decoded.
    """
    try:
        image = Image.open(io.BytesIO(raw_bytes))
    except Exception as exc:
        raise ValueError(f"Unable to decode the uploaded image: {exc}") from exc

    image = image.convert("RGB")
    image = image.resize(TARGET_SIZE, Image.LANCZOS)

    arr = np.asarray(image, dtype=np.float32) / 255.0
    arr = np.expand_dims(arr, axis=0)  # (1, 350, 350, 3)
    return arr
