// Node -> Python computer-vision bridge. Requires Node 18+ (global fetch/FormData/Blob).
const fs = require('fs');
const ApiError = require('../utils/ApiError');

exports.identifyBird = async (file) => {
  const url = `${process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:8000'}/predict`;
  try {
    const buffer = await fs.promises.readFile(file.path);
    const form = new FormData();
    form.append('image', new Blob([buffer], { type: file.mimetype }), file.originalname || file.filename);

    const res = await fetch(url, { method: 'POST', body: form, signal: AbortSignal.timeout(15000) });
    const body = await res.json().catch(() => ({}));

    if (res.status === 400 || res.status === 422) throw new ApiError(400, body.message || 'Image could not be processed');
    if (!res.ok) throw new ApiError(502, 'Bird identification service returned an error');
    return body;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(503, 'Bird identification service is unavailable. You can still submit a report without it.');
  }
};
