"""FAKE model for UI demos only. Output is derived from the image bytes, not from the bird.
Enabled only with UDAANIKA_DEMO_MODE=1 and always flagged `demo: true` in API responses."""
import numpy as np


class DemoModel:
    name = "demo-placeholder"
    demo = True

    def __init__(self, num_classes):
        self.num_classes = num_classes

    def predict_proba(self, blob):
        seed = int(abs(float(blob.sum())) * 1000) % (2**32)
        rng = np.random.default_rng(seed)
        scores = rng.random(self.num_classes) ** 4
        scores[rng.integers(self.num_classes)] += 2.0
        return scores / scores.sum()
