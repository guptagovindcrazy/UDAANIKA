const MigrationObservation = require('../models/MigrationObservation');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const escapeRegex = require('../utils/escapeRegex');
const { sendSuccess } = require('../utils/response');

exports.createObservation = asyncHandler(async (req, res) => {
  const { species, location, latitude, longitude, observationDate, count, direction, weather, notes } = req.body;
  const observation = await MigrationObservation.create({
    species, location, latitude, longitude, observationDate, count, direction, weather, notes,
    observer: req.user._id,
    image: req.file ? `/uploads/${req.file.filename}` : undefined,
  });
  sendSuccess(res, { observation }, 'Observation submitted', 201);
});

exports.listObservations = asyncHandler(async (req, res) => {
  const { species, from, to, page = 1, limit = 12 } = req.query;
  const filter = {};
  if (species) filter.species = new RegExp(escapeRegex(species), 'i');
  if (from || to) {
    filter.observationDate = {};
    if (from) filter.observationDate.$gte = new Date(from);
    if (to) filter.observationDate.$lte = new Date(to);
  }
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 100);
  const [items, total] = await Promise.all([
    MigrationObservation.find(filter).sort({ observationDate: -1 }).skip((pageNum - 1) * pageSize).limit(pageSize).populate('observer', 'name'),
    MigrationObservation.countDocuments(filter),
  ]);
  sendSuccess(res, { items, total, page: pageNum, pages: Math.ceil(total / pageSize) });
});

exports.getObservation = asyncHandler(async (req, res) => {
  const observation = await MigrationObservation.findById(req.params.id).populate('observer', 'name');
  if (!observation) throw new ApiError(404, 'Observation not found');
  sendSuccess(res, { observation });
});

exports.deleteObservation = asyncHandler(async (req, res) => {
  const observation = await MigrationObservation.findById(req.params.id);
  if (!observation) throw new ApiError(404, 'Observation not found');
  if (req.user.role !== 'admin' && String(observation.observer) !== String(req.user._id)) throw new ApiError(403, 'Not your observation');
  await observation.deleteOne();
  sendSuccess(res, {}, 'Observation deleted');
});

exports.analytics = asyncHandler(async (_req, res) => {
  const [topSpecies, byMonth, topLocations, totals] = await Promise.all([
    MigrationObservation.aggregate([
      { $group: { _id: '$species', observations: { $sum: 1 }, birds: { $sum: '$count' } } },
      { $sort: { observations: -1 } }, { $limit: 8 },
    ]),
    MigrationObservation.aggregate([
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$observationDate' } }, observations: { $sum: 1 }, birds: { $sum: '$count' } } },
      { $sort: { _id: 1 } },
    ]),
    MigrationObservation.aggregate([
      { $group: { _id: '$location', observations: { $sum: 1 }, latitude: { $first: '$latitude' }, longitude: { $first: '$longitude' } } },
      { $sort: { observations: -1 } }, { $limit: 8 },
    ]),
    MigrationObservation.aggregate([{ $group: { _id: null, observations: { $sum: 1 }, birds: { $sum: '$count' } } }]),
  ]);
  sendSuccess(res, {
    totalObservations: totals[0]?.observations || 0,
    totalBirds: totals[0]?.birds || 0,
    topSpecies, byMonth, topLocations,
  });
});
