const Rescue = require('../models/Rescue');
const Volunteer = require('../models/Volunteer');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { STATUSES, canTransition, roleCanSet } = require('../utils/rescueWorkflow');

const appendNote = (existing, note) => [existing, note].filter(Boolean).join('\n').slice(-1500);

const POPULATE = [
  { path: 'reportedBy', select: 'name phone email' },
  { path: 'assignedVolunteer', populate: { path: 'user', select: 'name phone email' } },
];

const getVolunteerProfile = (userId) => Volunteer.findOne({ user: userId });

// Throws unless the requester may view/act on this rescue.
async function assertAccess(rescue, user, { write = false } = {}) {
  if (user.role === 'admin') return;
  if (user.role === 'user') {
    if (String(rescue.reportedBy._id || rescue.reportedBy) !== String(user._id)) throw new ApiError(403, 'Not your rescue request');
    return;
  }
  const profile = await getVolunteerProfile(user._id);
  const assignedId = rescue.assignedVolunteer && (rescue.assignedVolunteer._id || rescue.assignedVolunteer);
  const mine = profile && assignedId && String(assignedId) === String(profile._id);
  if (!mine && (write || rescue.status !== 'Pending')) throw new ApiError(403, 'This rescue is not assigned to you');
}

exports.createRescue = asyncHandler(async (req, res) => {
  const body = req.body;
  const rescue = await Rescue.create({
    reportedBy: req.user._id,
    birdSpecies: body.birdSpecies,
    birdIdentificationConfidence: body.birdIdentificationConfidence,
    description: body.description,
    injuryType: body.injuryType,
    severity: body.severity,
    latitude: body.latitude,
    longitude: body.longitude,
    locationName: body.locationName,
    contactNumber: body.contactNumber,
    imageUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
    statusHistory: [{ status: 'Pending', changedBy: req.user._id, note: 'Rescue reported' }],
  });
  sendSuccess(res, { rescue }, 'Rescue request submitted', 201);
});

exports.listRescues = asyncHandler(async (req, res) => {
  const { status, severity, page = 1, limit = 12 } = req.query;
  const filter = {};
  if (status) filter.status = { $in: String(status).split(',').filter((v) => STATUSES.includes(v)) }; // accepts "A,B"
  if (severity) filter.severity = severity;

  if (req.user.role === 'user') filter.reportedBy = req.user._id;
  if (req.user.role === 'volunteer') {
    const profile = await getVolunteerProfile(req.user._id);
    const mine = profile ? [{ assignedVolunteer: profile._id }] : [];
    filter.$or = [{ status: 'Pending' }, ...mine];
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 50);
  const [items, total] = await Promise.all([
    Rescue.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * pageSize).limit(pageSize).populate(POPULATE),
    Rescue.countDocuments(filter),
  ]);
  sendSuccess(res, { items, total, page: pageNum, pages: Math.ceil(total / pageSize) });
});

exports.getRescue = asyncHandler(async (req, res) => {
  const rescue = await Rescue.findById(req.params.id).populate(POPULATE).populate('statusHistory.changedBy', 'name role');
  if (!rescue) throw new ApiError(404, 'Rescue request not found');
  await assertAccess(rescue, req.user);
  sendSuccess(res, { rescue });
});

// Reporter can edit details only while Pending; admin any time.
exports.updateRescue = asyncHandler(async (req, res) => {
  const rescue = await Rescue.findById(req.params.id);
  if (!rescue) throw new ApiError(404, 'Rescue request not found');
  if (req.user.role === 'volunteer') throw new ApiError(403, 'Volunteers update rescues via the status endpoint');
  await assertAccess(rescue, req.user, { write: true });
  if (req.user.role === 'user' && rescue.status !== 'Pending') throw new ApiError(400, 'Only pending requests can be edited');

  const editable = ['birdSpecies', 'description', 'injuryType', 'severity', 'locationName', 'contactNumber', 'latitude', 'longitude'];
  if (req.user.role === 'admin') editable.push('adminNotes');
  editable.forEach((f) => { if (req.body[f] !== undefined) rescue[f] = req.body[f]; });
  await rescue.save();
  sendSuccess(res, { rescue }, 'Rescue request updated');
});

exports.deleteRescue = asyncHandler(async (req, res) => {
  const rescue = await Rescue.findById(req.params.id);
  if (!rescue) throw new ApiError(404, 'Rescue request not found');
  if (req.user.role === 'volunteer') throw new ApiError(403, 'Not allowed');
  await assertAccess(rescue, req.user, { write: true });
  if (req.user.role === 'user' && rescue.status !== 'Pending') throw new ApiError(400, 'Only pending requests can be deleted');
  await rescue.deleteOne();
  sendSuccess(res, {}, 'Rescue request deleted');
});

// Volunteer self-accepts (no body) or admin assigns a specific volunteer (body.volunteerId).
exports.assignRescue = asyncHandler(async (req, res) => {
  const rescue = await Rescue.findById(req.params.id);
  if (!rescue) throw new ApiError(404, 'Rescue request not found');
  if (!canTransition(rescue.status, 'Assigned')) throw new ApiError(400, `Cannot assign a request that is ${rescue.status}`);

  let volunteer;
  if (req.user.role === 'admin') {
    if (!req.body.volunteerId) throw new ApiError(400, 'volunteerId is required');
    volunteer = await Volunteer.findById(req.body.volunteerId);
  } else {
    volunteer = await getVolunteerProfile(req.user._id);
    if (!volunteer) throw new ApiError(403, 'Complete your volunteer profile first');
  }
  if (!volunteer) throw new ApiError(404, 'Volunteer not found');
  if (volunteer.verificationStatus === 'rejected') throw new ApiError(403, 'Volunteer is not verified');

  rescue.assignedVolunteer = volunteer._id;
  rescue.status = 'Assigned';
  rescue.statusHistory.push({ status: 'Assigned', changedBy: req.user._id, note: req.body.note });
  await rescue.save();
  await rescue.populate(POPULATE);
  sendSuccess(res, { rescue }, 'Volunteer assigned');
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const rescue = await Rescue.findById(req.params.id);
  if (!rescue) throw new ApiError(404, 'Rescue request not found');
  await assertAccess(rescue, req.user, { write: true });

  if (!roleCanSet(req.user.role, status)) throw new ApiError(403, `Your role cannot set status to ${status}`);
  if (!canTransition(rescue.status, status)) throw new ApiError(400, `Cannot move from ${rescue.status} to ${status}`);
  if (status === 'Assigned') throw new ApiError(400, 'Use the assign endpoint to assign a volunteer');

  rescue.status = status;
  rescue.statusHistory.push({ status, changedBy: req.user._id, note: status === 'Pending' && !note ? 'Released back to the pool' : note });
  if (status === 'Pending') rescue.assignedVolunteer = undefined; // volunteer released it
  if (note && req.user.role === 'volunteer') rescue.volunteerNotes = appendNote(rescue.volunteerNotes, `[${status}] ${note}`);
  if (note && req.user.role === 'admin') rescue.adminNotes = appendNote(rescue.adminNotes, `[${status}] ${note}`);
  if (status === 'Completed') {
    rescue.completedAt = new Date();
    if (rescue.assignedVolunteer) await Volunteer.updateOne({ _id: rescue.assignedVolunteer }, { $inc: { rescuesCompleted: 1 } });
  }
  await rescue.save();
  sendSuccess(res, { rescue }, `Status updated to ${status}`);
});

// Role-scoped counts by status, used by user/volunteer dashboards.
exports.getStats = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === 'user') filter.reportedBy = req.user._id;
  if (req.user.role === 'volunteer') {
    const profile = await getVolunteerProfile(req.user._id);
    filter.assignedVolunteer = profile ? profile._id : null;
  }
  const rows = await Rescue.aggregate([{ $match: filter }, { $group: { _id: '$status', count: { $sum: 1 } } }]);
  const byStatus = Object.fromEntries(rows.map((r) => [r._id, r.count]));
  const total = rows.reduce((sum, r) => sum + r.count, 0);
  sendSuccess(res, { total, byStatus });
});
