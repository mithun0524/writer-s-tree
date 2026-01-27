import logger from '../config/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error('Error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.auth?.userId
  });

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let error = err.code || 'INTERNAL_ERROR';

  // Database errors
  if (err.code === '23505') { // Unique violation
    statusCode = 409;
    message = 'Resource already exists';
    error = 'DUPLICATE_RESOURCE';
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    error = 'VALIDATION_ERROR';
  }

  res.status(statusCode).json({
    success: false,
    error,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: 'Route not found'
  });
};
