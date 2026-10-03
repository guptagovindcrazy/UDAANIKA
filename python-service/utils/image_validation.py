"""Validate and decode uploaded images. We trust the bytes, not the declared MIME type."""
import cv2
import numpy as np

MAX_BYTES = 5 * 1024 * 1024
MIN_SIDE = 64


class ImageValidationError(ValueError):
    """Raised when an upload is not a usable image."""


def decode_image(file_storage):
    data = file_storage.read()
    if not data:
        raise ImageValidationError("The uploaded file is empty")
    if len(data) > MAX_BYTES:
        raise ImageValidationError("Image must be under 5 MB")
    image = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise ImageValidationError("File is not a valid JPG, PNG or WEBP image")
    height, width = image.shape[:2]
    if min(height, width) < MIN_SIDE:
        raise ImageValidationError(f"Image is too small (minimum {MIN_SIDE}px on each side)")
    return image
