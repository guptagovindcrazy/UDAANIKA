const User = require('../models/User');
const Volunteer = require('../models/Volunteer');
const Rescue = require('../models/Rescue');
const MigrationObservation = require('../models/MigrationObservation');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const escapeRegex = require('../utils/escapeRegex');
const { sendSuccess } = require('../utils/response');

exports.dashboard = asyncHandler(async (_req, res) => {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [totalUsers, totalVolunteers, activeRescues, completedRescues, birdsRescued, species,
    rescuesOverTime, statusDistribution, topSpecies, topLocations, migrationObservations] = await Promise.all([
    User.countDocuments(),
    Volunteer.countDocuments(),
    Rescue.countDocuments({ status: { $in: ['Pending', 'Assigned', 'In Progress'] } }),
    Rescue.countDocuments({ status: 'Completed' }),
    Rescue.countDocuments({ status: { $in: ['Rescued', 'Completed'] } }),
    Rescue.distinct('birdSpecies', { birdSpecies: { $nin: [null, ''] } }),
    Rescue.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Rescue.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Rescue.aggregate([
      { $match: { birdSpecies: { $nin: [null, ''] } } },
      { $group: { _id: '$birdSpecies', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 5 },
    ]),
    Rescue.aggregate([{ $group: { _id: '$locationName', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 5 }]),
    MigrationObservation.countDocuments(),
  ]);
  sendSuccess(res, {
    totals: { totalUsers, totalVolunteers, activeRescues, completedRescues, birdsRescued, speciesIdentified: species.length, migrationObservations },
    charts: { rescuesOverTime, statusDistribution, topSpecies, topLocations },
  });
});

exports.listUsers = asyncHandler(async (req, res) => {
  const { q, role, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (q) { const rx = new RegExp(escapeRegex(q), 'i'); filter.$or = [{ name: rx }, { email: rx }]; }
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * pageSize).limit(pageSize),
    User.countDocuments(filter),
  ]);
  sendSuccess(res, { items, total, page: pageNum, pages: Math.ceil(total / pageSize) });
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role === 'admin') throw new ApiError(400, 'Admin accounts cannot be deleted here');
  if (await Rescue.exists({ reportedBy: user._id })) throw new ApiError(409, 'User has rescue records and cannot be deleted');
  await Volunteer.deleteOne({ user: user._id });
  await user.deleteOne();
  sendSuccess(res, {}, 'User deleted');
});

exports.publicStats = asyncHandler(async (_req, res) => {
  const [birdsRescued, activeVolunteers, rescueRequests, species] = await Promise.all([
    Rescue.countDocuments({ status: { $in: ['Rescued', 'Completed'] } }),
    Volunteer.countDocuments({ verificationStatus: 'verified', availability: { $ne: 'offline' } }),
    Rescue.countDocuments(),
    Rescue.distinct('birdSpecies', { birdSpecies: { $nin: [null, ''] } }),
  ]);
  sendSuccess(res, { birdsRescued, activeVolunteers, rescueRequests, speciesIdentified: species.length });
});
