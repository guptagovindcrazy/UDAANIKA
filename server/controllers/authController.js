const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// Public registration always creates a normal user. Volunteers upgrade via /api/volunteers; admins come from the seed script.
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, location } = req.body;
  const user = await User.create({ name, email, password, phone, location });
  sendSuccess(res, { user, token: signToken(user) }, 'Registration successful', 201);
});

exports.login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+password');
  if (!user || !(await user.comparePassword(req.body.password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  sendSuccess(res, { user, token: signToken(user) }, 'Login successful');
});

exports.me = asyncHandler(async (req, res) => sendSuccess(res, { user: req.user }));
