const ApiError = require('../utils/ApiError');

exports.notFound = (req, _res, next) => next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));

// eslint-disable-next-line no-unused-vars
exports.errorMiddleware = (err, _req, res, _next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Something went wrong';

  if (err.name === 'CastError') { status = 400; message = `Invalid ${err.path}`; }
  else if (err.code === 11000) { status = 409; message = `${Object.keys(err.keyValue || {})[0] || 'Value'} already exists`; }
  else if (err.name === 'ValidationError') { status = 400; message = Object.values(err.errors).map((e) => e.message).join(', '); }
  else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') { status = 401; message = 'Invalid or expired token'; }
  else if (err.name === 'MulterError') { status = 400; message = err.code === 'LIMIT_FILE_SIZE' ? 'Image must be under 5 MB' : err.message; }

  if (status >= 500) {
    console.error(err);
    if (process.env.NODE_ENV === 'production') message = 'Internal server error';
  }
  res.status(status).json({ success: false, message });
};
