# Udaanika CV service

Flask + OpenCV microservice. The Node API sends it an image at `POST /predict` and gets back JSON.

```bash
python -m venv .venv && source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py                                          # http://127.0.0.1:8000/health
```

## Pipeline
`validate (decode bytes, size, min dimensions)` → `preprocess (resize 224, RGB, ImageNet normalise)` → `model` → `threshold` → JSON.

```json
{ "species": "Indian Peafowl", "confidence": 0.94, "status": "success", "model": "onnx", "metadata": {"width": 800, "height": 600, "sharpness": 212.4, "blurry": false} }
{ "species": null, "confidence": 0.21, "status": "low_confidence" }
```
Below `CONFIDENCE_THRESHOLD` (default 0.6) the service returns `species: null`; it never reports a guess as a match.

## Model modes
| Mode | When | Notes |
|---|---|---|
| **ONNX (real)** | `model/bird_classifier.onnx` exists | Used automatically |
| **Demo** | no model file and `UDAANIKA_DEMO_MODE=1` | FAKE output for UI demos; responses carry `"demo": true` |
| **None** | neither | Always `low_confidence` with `reason: no_model_loaded` |

## Replacing the placeholder with a trained model
1. Fine-tune an image classifier on a bird dataset (e.g. a pretrained ResNet/EfficientNet on CUB-200 or iNaturalist, filtered to the species you support).
2. Export to ONNX with a 224x224 input:
   ```python
   torch.onnx.export(model.eval(), torch.randn(1, 3, 224, 224), "bird_classifier.onnx",
                     input_names=["input"], output_names=["logits"], opset_version=12)
   ```
3. Copy it to `model/bird_classifier.onnx`.
4. Replace `model/labels.json` with your class names **in the same order as the model's output indices**.
5. If you trained with different normalisation or input size, edit `services/preprocess.py` to match.
6. Restart. `GET /health` should now report `"model": "onnx"`.

Tip: keep the species names in `labels.json` identical to `commonName` in the Bird collection so the app can attach full bird details to a prediction.
