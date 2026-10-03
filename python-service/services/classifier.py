import os

import numpy as np

from model import load_model
from services.preprocess import image_metadata, preprocess

THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.6"))


class BirdClassifier:
    def __init__(self):
        self.model, self.labels = load_model()

    @property
    def model_name(self):
        return self.model.name if self.model else "none"

    def classify(self, image_bgr):
        metadata = image_metadata(image_bgr)
        if self.model is None:
            return {"species": None, "confidence": 0.0, "status": "low_confidence",
                    "reason": "no_model_loaded", "model": "none", "metadata": metadata}

        probs = self.model.predict_proba(preprocess(image_bgr))
        if len(probs) != len(self.labels):
            raise RuntimeError(f"Model outputs {len(probs)} classes but labels.json has {len(self.labels)}")

        order = np.argsort(probs)[::-1]
        confidence = float(probs[order[0]])
        result = {"confidence": round(confidence, 4), "model": self.model.name, "metadata": metadata}
        if self.model.demo:
            result["demo"] = True

        if confidence >= THRESHOLD:
            result.update(species=self.labels[order[0]], status="success",
                          alternatives=[{"species": self.labels[i], "confidence": round(float(probs[i]), 4)} for i in order[1:3]])
        else:
            result.update(species=None, status="low_confidence")
        return result
