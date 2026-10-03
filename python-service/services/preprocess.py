"""Image preprocessing. Must match how the model was trained (ImageNet normalisation by default)."""
import cv2
import numpy as np

INPUT_SIZE = 224
MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)


def preprocess(image_bgr, size=INPUT_SIZE):
    """BGR uint8 image -> NCHW float32 blob."""
    resized = cv2.resize(image_bgr, (size, size), interpolation=cv2.INTER_AREA)
    rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
    normalised = (rgb - MEAN) / STD
    return np.transpose(normalised, (2, 0, 1))[np.newaxis, ...]


def image_metadata(image_bgr):
    height, width = image_bgr.shape[:2]
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    sharpness = float(cv2.Laplacian(gray, cv2.CV_64F).var())  # low value = blurry photo
    return {"width": int(width), "height": int(height), "sharpness": round(sharpness, 1), "blurry": sharpness < 60}
