const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');

exports.getProfile = asyncHandler(async (req, res) => sendSuccess(res, { user: req.user }));

exports.updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  ['name', 'phone', 'location'].forEach((f) => { if (req.body[f] !== undefined) user[f] = req.body[f]; });
  if (req.file) user.profileImage = `/uploads/${req.file.filename}`;

  if (req.body.newPassword) {
    if (!req.body.currentPassword || !(await user.comparePassword(req.body.currentPassword))) {
      throw new ApiError(400, 'Current password is incorrect');
    }
    user.password = req.body.newPassword;
  }
  await user.save();
  sendSuccess(res, { user }, 'Profile updated');
});
