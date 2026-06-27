'use strict';

function notFound(req, res, _next) {
  res.status(404).json({
    error: { message: `Not Found - ${req.method} ${req.originalUrl}` },
  });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;

  if (status >= 500) {
    console.error(err);
  }

  // ponytail: never leak internal error details to client
  const message = status >= 500 ? 'Internal Server Error' : (err.message || 'Something went wrong');

  res.status(status).json({
    error: { message },
  });
}

module.exports = { notFound, errorHandler };
