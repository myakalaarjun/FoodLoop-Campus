export function notFound(req, _res, next) {
  next(Object.assign(new Error(`Route not found: ${req.method} ${req.originalUrl}`), { status: 404 }));
}

export function errorHandler(error, _req, res, _next) {
  let status = error.status || 500;
  let message = error.message || 'Internal server error.';
  if (error.name === 'ValidationError') {
    status = 400;
    message = Object.values(error.errors).map(item => item.message).join(', ');
  }
  if (error.name === 'CastError') {
    status = 400;
    message = 'Invalid resource identifier.';
  }
  if (error.code === 11000) {
    status = 409;
    message = 'A record with that value already exists.';
  }
  if (status >= 500) console.error(error);
  res.status(status).json({ success: false, message });
}
