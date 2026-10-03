const Volunteer = require('../models/Volunteer');
const Rescue = require('../models/Rescue');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');

const USER_FIELDS = 'name email phone location';
const toList = (v) => (Array.isArray(v) ? v : typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : undefined);

async function loadOwned(req) {
  const volunteer = await Volunteer.findById(req.params.id);
  if (!volunteer) throw new ApiError(404, 'Volunteer not found');
  if (req.user.role !== 'admin' && String(volunteer.user) !== String(req.user._id)) throw new ApiError(403, 'Not your volunteer profile');
  return volunteer;
}

exports.createVolunteer = asyncHandler(async (req, res) => {
  if (await Volunteer.exists({ user: req.user._id })) throw new ApiError(409, 'You are already registered as a volunteer');
  const { experience, serviceArea, emergencyContact, availability } = req.body;
  const volunteer = await Volunteer.create({
    user: req.user._id, experience, serviceArea, emergencyContact, availability, specialization: toList(req.body.specialization),
  });
  if (req.user.role === 'user') { req.user.role = 'volunteer'; await req.user.save(); }
  sendSuccess(res, { volunteer }, 'Volunteer registration submitted', 201);
});

exports.listVolunteers = asyncHandler(async (req, res) => {
  const { availability, verificationStatus, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (availability) filter.availability = availability;
  if (verificationStatus) filter.verificationStatus = verificationStatus;
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const [items, total] = await Promise.all([
    Volunteer.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * pageSize).limit(pageSize).populate('user', USER_FIELDS),
    Volunteer.countDocuments(filter),
  ]);
  sendSuccess(res, { items, total, page: pageNum, pages: Math.ceil(total / pageSize) });
});

// Own profile plus dashboard stats.
exports.getMyProfile = asyncHandler(async (req, res) => {
  const volunteer = await Volunteer.findOne({ user: req.user._id }).populate('user', USER_FIELDS);
  if (!volunteer) throw new ApiError(404, 'Volunteer profile not found');
  const [assigned, inProgress, completed] = await Promise.all([
    Rescue.countDocuments({ assignedVolunteer: volunteer._id, status: 'Assigned' }),
    Rescue.countDocuments({ assignedVolunteer: volunteer._id, status: { $in: ['In Progress', 'Rescued'] } }),
    Rescue.countDocuments({ assignedVolunteer: volunteer._id, status: 'Completed' }),
  ]);
  sendSuccess(res, { volunteer, stats: { assigned, inProgress, completed } });
});

exports.getVolunteer = asyncHandler(async (req, res) => {
  const volunteer = await loadOwned(req);
  await volunteer.populate('user', USER_FIELDS);
  sendSuccess(res, { volunteer });
});

exports.updateVolunteer = asyncHandler(async (req, res) => {
  const volunteer = await loadOwned(req);
  ['experience', 'serviceArea', 'emergencyContact', 'availability'].forEach((f) => { if (req.body[f] !== undefined) volunteer[f] = req.body[f]; });
  if (req.body.specialization !== undefined) volunteer.specialization = toList(req.body.specialization);
  if (req.user.role === 'admin' && req.body.verificationStatus) volunteer.verificationStatus = req.body.verificationStatus;
  await volunteer.save();
  sendSuccess(res, { volunteer }, 'Volunteer profile updated');
});

exports.updateAvailability = asyncHandler(async (req, res) => {
  const volunteer = await loadOwned(req);
  volunteer.availability = req.body.availability;
  await volunteer.save();
  sendSuccess(res, { volunteer }, 'Availability updated');
});
