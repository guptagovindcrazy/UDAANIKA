exports.sendSuccess = (res, data = {}, message = 'Operation completed successfully', status = 200) =>
  res.status(status).json({ success: true, message, data });
