"""Runs a trained image classifier exported to ONNX, using OpenCV's DNN module (no extra ML runtime needed)."""
import cv2
import numpy as np


class OnnxModel:
    name = "onnx"
    demo = False

    def __init__(self, path):
        self.net = cv2.dnn.readNetFromONNX(path)

    def predict_proba(self, blob):
        self.net.setInput(blob)
        scores = self.net.forward().flatten().astype(np.float64)
        if not np.isclose(scores.sum(), 1.0, atol=1e-3) or (scores < 0).any():  # logits -> softmax
            exp = np.exp(scores - scores.max())
            scores = exp / exp.sum()
        return scores
