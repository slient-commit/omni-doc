'use strict';

// 404 handler — reached when no route matched.
function notFound(req, res, next) {
  res.status(404).json({
    error: {
      message: `Not Found - ${req.method} ${req.originalUrl}`,
    },
  });
}

// Centralized error handler. Express identifies it by its 4 arguments.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;

  if (status >= 500) {
    // Log server errors for diagnosis; client errors are expected noise.
    console.error(err);
  }

  res.status(status).json({
    error: {
      message: err.message || 'Internal Server Error',
    },
  });
}

module.exports = { notFound, errorHandler };
