import logging
import os

from flask import Flask, jsonify, request

from services.classifier import BirdClassifier
from utils.image_validation import ImageValidationError, decode_image

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 6 * 1024 * 1024
logging.basicConfig(level=logging.INFO)

classifier = BirdClassifier()


@app.get("/health")
def health():
    return jsonify(status="ok", model=classifier.model_name)


@app.post("/predict")
def predict():
    upload = request.files.get("image")
    if upload is None:
        return jsonify(status="error", message="No image provided (multipart field: image)"), 400
    try:
        image = decode_image(upload)
    except ImageValidationError as exc:
        return jsonify(status="error", message=str(exc)), 400
    return jsonify(classifier.classify(image))


@app.errorhandler(413)
def too_large(_err):
    return jsonify(status="error", message="Image must be under 5 MB"), 400


@app.errorhandler(Exception)
def unexpected(err):
    app.logger.exception(err)
    return jsonify(status="error", message="Prediction failed"), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
