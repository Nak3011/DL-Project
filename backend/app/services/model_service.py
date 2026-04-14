"""
Model service — singleton loader and inference runner.

Loads ``saved_model.keras`` exactly once and exposes a thin
``predict`` function that returns a wildfire confidence score.

Model details (from user):
    - Input shape : (batch, 350, 350, 3), float32, [0-1]
    - Output      : softmax over 2 classes (categorical)
    - Class index 1 is assumed to be "wildfire"
    - Prediction  : np.argmax(prediction, axis=1) for label

Compatibility:
    The saved model was trained with a newer Keras version that adds
    ``quantization_config`` to Dense layer configs.  If the installed
    Keras version does not recognise that key, the loader falls back to
    patching the config JSON inside the ``.keras`` zip archive before
    loading.
"""

import json
import os
import shutil
import tempfile
import threading
import zipfile
from typing import Optional

import numpy as np

_model = None
_lock = threading.Lock()

# Path to the saved model (resolved relative to project root)
_MODEL_PATH = os.environ.get(
    "MODEL_PATH",
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "saved_model.keras"),
)


# ------------------------------------------------------------------ #
#  Compatibility helpers                                              #
# ------------------------------------------------------------------ #

def _strip_unsupported_keys(obj):
    """Recursively remove keys that may cause deserialization errors
    in older Keras versions (e.g. ``quantization_config``)."""
    if isinstance(obj, dict):
        obj.pop("quantization_config", None)
        for value in obj.values():
            _strip_unsupported_keys(value)
    elif isinstance(obj, list):
        for item in obj:
            _strip_unsupported_keys(item)


def _load_with_patch(path: str):
    """Patch the ``.keras`` zip config and load the model.

    1. Extract the ``.keras`` archive (which is a zip file).
    2. Parse ``config.json`` and strip unsupported keys.
    3. Re-pack into a temporary ``.keras`` file.
    4. Load from the patched archive with ``compile=False``.
    """
    from keras.models import load_model as keras_load_model

    tmpdir = tempfile.mkdtemp(prefix="keras_patch_")
    try:
        patched_path = os.path.join(tmpdir, "patched_model.keras")
        with zipfile.ZipFile(path, "r") as zin, \
             zipfile.ZipFile(patched_path, "w") as zout:
            for item in zin.infolist():
                data = zin.read(item.filename)
                if item.filename == "config.json":
                    config = json.loads(data)
                    _strip_unsupported_keys(config)
                    data = json.dumps(config).encode("utf-8")
                zout.writestr(item, data)

        return keras_load_model(patched_path, compile=False)
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


# ------------------------------------------------------------------ #
#  Singleton loader                                                   #
# ------------------------------------------------------------------ #

def _load_model():
    """Lazily load the Keras model (thread-safe singleton)."""
    global _model
    if _model is not None:
        return

    with _lock:
        if _model is not None:
            return  # double-checked locking

        from keras.models import load_model as keras_load_model

        resolved = os.path.abspath(_MODEL_PATH)
        if not os.path.isfile(resolved):
            raise FileNotFoundError(
                f"Model file not found at {resolved}. "
                "Set the MODEL_PATH env variable or place saved_model.keras "
                "in the project root."
            )

        # Try standard load first; fall back to patched load on error.
        try:
            _model = keras_load_model(resolved, compile=False)
        except Exception as exc:
            print(
                f"[model_service] Standard load failed ({exc}), "
                "retrying with config patch…"
            )
            _model = _load_with_patch(resolved)

        print(f"[model_service] Model loaded from {resolved}")


def predict(image_array: np.ndarray) -> float:
    """Run inference on a preprocessed image tensor.

    Args:
        image_array: NumPy array of shape ``(1, 350, 350, 3)``.

    Returns:
        Wildfire confidence score in ``[0, 1]``
        (softmax probability for the wildfire class).
    """
    _load_model()
    assert _model is not None

    predictions = _model.predict(image_array, verbose=0)
    # predictions shape: (1, 2)  →  [not-wildfire, wildfire]
    confidence = float(predictions[0][1])
    return confidence
