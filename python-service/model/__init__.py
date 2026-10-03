"""Model loading. The rest of the service only depends on `load_model()`."""
import json
import os

from .demo_model import DemoModel
from .onnx_model import OnnxModel

HERE = os.path.dirname(os.path.abspath(__file__))
ONNX_PATH = os.path.join(HERE, "bird_classifier.onnx")
LABELS_PATH = os.path.join(HERE, "labels.json")


def load_labels():
    with open(LABELS_PATH, encoding="utf-8") as fh:
        return json.load(fh)


def load_model():
    """Return (model_or_None, labels). Order: trained ONNX model > explicit demo mode > nothing."""
    labels = load_labels()
    if os.path.exists(ONNX_PATH):
        return OnnxModel(ONNX_PATH), labels
    if os.getenv("UDAANIKA_DEMO_MODE") == "1":
        return DemoModel(len(labels)), labels
    return None, labels
