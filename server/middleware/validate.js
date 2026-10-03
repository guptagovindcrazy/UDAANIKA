const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

module.exports = (req, _res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const message = result.array().map((e) => e.msg).join(', ');
  next(new ApiError(400, message));
};
