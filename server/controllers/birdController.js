const Bird = require('../models/Bird');
const cvService = require('../services/cvService');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const escapeRegex = require('../utils/escapeRegex');
const { sendSuccess } = require('../utils/response');

exports.identify = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'Please upload an image (field name: image)');
  const result = await cvService.identifyBird(req.file);

  const confidence = Number(result.confidence) || 0;
  // Never present an uncertain prediction as an identification.
  const identified = result.status === 'success' && result.species;
  const bird = identified ? await Bird.findOne({ commonName: new RegExp(`^${escapeRegex(result.species)}$`, 'i') }) : null;

  sendSuccess(res, {
    species: identified ? result.species : null,
    confidence,
    status: identified ? 'success' : 'low_confidence',
    demo: result.demo === true,
    bird,
    imageUrl: `/uploads/${req.file.filename}`,
  }, identified ? 'Bird identified' : 'Could not identify this bird with confidence');
});

exports.listBirds = asyncHandler(async (req, res) => {
  const { q, conservationStatus, page = 1, limit = 12 } = req.query;
  const filter = {};
  if (q) filter.commonName = new RegExp(escapeRegex(q), 'i');
  if (conservationStatus) filter.conservationStatus = conservationStatus;
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 50);
  const [items, total] = await Promise.all([
    Bird.find(filter).sort({ commonName: 1 }).skip((pageNum - 1) * pageSize).limit(pageSize),
    Bird.countDocuments(filter),
  ]);
  sendSuccess(res, { items, total, page: pageNum, pages: Math.ceil(total / pageSize) });
});

exports.getBird = asyncHandler(async (req, res) => {
  const bird = await Bird.findById(req.params.id);
  if (!bird) throw new ApiError(404, 'Bird not found');
  sendSuccess(res, { bird });
});

exports.createBird = asyncHandler(async (req, res) => sendSuccess(res, { bird: await Bird.create(req.body) }, 'Bird added', 201));

exports.updateBird = asyncHandler(async (req, res) => {
  const bird = await Bird.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!bird) throw new ApiError(404, 'Bird not found');
  sendSuccess(res, { bird }, 'Bird updated');
});

exports.deleteBird = asyncHandler(async (req, res) => {
  const bird = await Bird.findByIdAndDelete(req.params.id);
  if (!bird) throw new ApiError(404, 'Bird not found');
  sendSuccess(res, {}, 'Bird deleted');
});
