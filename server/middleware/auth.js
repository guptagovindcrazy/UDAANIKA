const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

module.exports = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new ApiError(401, 'Authentication required');

  const decoded = jwt.verify(token, process.env.JWT_SECRET); // errors handled centrally
  const user = await User.findById(decoded.id);
  if (!user) throw new ApiError(401, 'User no longer exists');

  req.user = user;
  next();
});
