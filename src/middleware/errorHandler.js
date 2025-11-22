export function notFoundHandler(req, res) {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const status = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  const details = err.errors || undefined;

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({ message, details });
}
