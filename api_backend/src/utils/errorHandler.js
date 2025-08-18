import { sendError, sendServerError } from './responseHelper.js';

/**
 * Global error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token', 401, null, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token expired', 401, null, 'TOKEN_EXPIRED');
  }

  // Handle Sequelize errors
  if (err.name?.startsWith('Sequelize')) {
    return handleSequelizeError(err, res);
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return sendError(res, 'Validation failed', 400, err.details, 'VALIDATION_ERROR');
  }

  // Handle rate limiting errors
  if (err.status === 429) {
    return sendError(res, 'Too many requests', 429, null, 'RATE_LIMIT_EXCEEDED');
  }

  // Handle multer/file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return sendError(res, 'File too large', 400, null, 'FILE_TOO_LARGE');
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return sendError(res, 'Unexpected file field', 400, null, 'UNEXPECTED_FILE');
  }

  // Handle MongoDB/database connection errors
  if (err.name === 'MongoNetworkError' || err.code === 'ECONNREFUSED') {
    return sendServerError(res, 'Database connection error');
  }

  // Handle Redis errors
  if (err.message?.includes('Redis') || err.code === 'NR_CLOSED') {
    console.error('Redis error:', err);
    // Don't fail the request for Redis errors, just log them
    return sendServerError(res, 'Cache service temporarily unavailable');
  }

  // Handle custom application errors
  if (err.statusCode) {
    return sendError(res, err.message, err.statusCode, err.details, err.errorCode);
  }

  // Default server error
  const isDevelopment = process.env.NODE_ENV === 'development';
  const message = isDevelopment ? err.message : 'Something went wrong';
  const details = isDevelopment ? { stack: err.stack } : null;

  return sendServerError(res, message);
};

/**
 * Handle Sequelize-specific errors
 */
const handleSequelizeError = (err, res) => {
  switch (err.name) {
    case 'SequelizeValidationError':
      const validationErrors = {};
      err.errors.forEach(error => {
        validationErrors[error.path] = error.message;
      });
      return sendError(res, 'Validation failed', 400, validationErrors, 'VALIDATION_ERROR');

    case 'SequelizeUniqueConstraintError':
      const field = err.errors[0]?.path || 'field';
      return sendError(res, `${field} already exists`, 409, null, 'DUPLICATE_ENTRY');

    case 'SequelizeForeignKeyConstraintError':
      return sendError(res, 'Invalid reference to related resource', 400, null, 'FOREIGN_KEY_ERROR');

    case 'SequelizeConnectionError':
    case 'SequelizeConnectionRefusedError':
    case 'SequelizeHostNotFoundError':
      return sendServerError(res, 'Database connection error');

    case 'SequelizeTimeoutError':
      return sendServerError(res, 'Database operation timed out');

    case 'SequelizeAccessDeniedError':
      return sendServerError(res, 'Database access denied');

    default:
      console.error('Unhandled Sequelize error:', err.name, err.message);
      return sendServerError(res, 'Database operation failed');
  }
};

/**
 * Handle unhandled promise rejections
 */
export const handleUnhandledRejections = () => {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Application specific logging, throwing an error, or other logic here
  });
};

/**
 * Handle uncaught exceptions
 */
export const handleUncaughtExceptions = () => {
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Gracefully shutdown the server
    process.exit(1);
  });
};

/**
 * 404 handler for undefined routes
 */
export const notFoundHandler = (req, res) => {
  sendError(res, `Route ${req.originalUrl} not found`, 404, null, 'ROUTE_NOT_FOUND');
};

/**
 * Custom error class for application-specific errors
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Helper to create specific error types
 */
export const createError = {
  badRequest: (message = 'Bad request', details = null) => 
    new AppError(message, 400, 'BAD_REQUEST', details),
  
  unauthorized: (message = 'Unauthorized') => 
    new AppError(message, 401, 'UNAUTHORIZED'),
  
  forbidden: (message = 'Forbidden') => 
    new AppError(message, 403, 'FORBIDDEN'),
  
  notFound: (message = 'Not found') => 
    new AppError(message, 404, 'NOT_FOUND'),
  
  conflict: (message = 'Conflict') => 
    new AppError(message, 409, 'CONFLICT'),
  
  rateLimited: (message = 'Rate limit exceeded') => 
    new AppError(message, 429, 'RATE_LIMITED'),
  
  internal: (message = 'Internal server error') => 
    new AppError(message, 500, 'INTERNAL_ERROR')
};
