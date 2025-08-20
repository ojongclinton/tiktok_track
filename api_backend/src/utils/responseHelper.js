/**
 * Standardized API response helpers
 */

export const sendSuccess = (res, data = null, message = 'Success', statusCode = 200, meta = null) => {
  const response = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };

  // Add metadata if provided (pagination, etc.)
  if (meta) {
    response.meta = meta;
  }

  res.status(statusCode).json(response);
};

export const sendError = (res, message = 'An error occurred', statusCode = 500, details = null, errorCode = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  // Add validation errors or additional details
  if (details) {
    response.errors = details;
  }

  // Add custom error code for frontend handling
  if (errorCode) {
    response.errorCode = errorCode;
  }

  res.status(statusCode).json(response);
};

export const sendPaginated = (res, data, pagination, message = 'Data retrieved successfully') => {
  sendSuccess(res, data, message, 200, {
    pagination: {
      page: pagination.page || 1,
      limit: pagination.limit || 10,
      total: pagination.total || 0,
      totalPages: Math.ceil((pagination.total || 0) / (pagination.limit || 10)),
      hasNextPage: (pagination.page || 1) < Math.ceil((pagination.total || 0) / (pagination.limit || 10)),
      hasPrevPage: (pagination.page || 1) > 1
    }
  });
};

export const sendCreated = (res, data, message = 'Resource created successfully') => {
  sendSuccess(res, data, message, 201);
};

export const sendUpdated = (res, data, message = 'Resource updated successfully') => {
  sendSuccess(res, data, message, 200);
};

export const sendDeleted = (res, message = 'Resource deleted successfully') => {
  sendSuccess(res, null, message, 200);
};

export const sendNotFound = (res, message = 'Resource not found') => {
  sendError(res, message, 404, null, 'RESOURCE_NOT_FOUND');
};

export const sendUnauthorized = (res, message = 'Unauthorized access') => {
  sendError(res, message, 401, null, 'UNAUTHORIZED');
};

export const sendForbidden = (res, message = 'Access forbidden') => {
  sendError(res, message, 403, null, 'FORBIDDEN');
};

export const sendValidationError = (res, errors, message = 'Validation failed') => {
  sendError(res, message, 400, errors, 'VALIDATION_ERROR');
};

export const sendConflict = (res, message = 'Resource already exists') => {
  sendError(res, message, 409, null, 'CONFLICT');
};

export const sendRateLimitError = (res, message = 'Rate limit exceeded') => {
  sendError(res, message, 429, null, 'RATE_LIMIT_EXCEEDED');
};

export const sendServerError = (res, message = 'Internal server error') => {
  sendError(res, message, 500, null, 'INTERNAL_SERVER_ERROR');
};

// Helper for handling async route errors
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Helper for handling database errors
export const handleDbError = (error, res) => {
  console.error('Database error:', error);

  // Handle specific Sequelize errors
  if (error.name === 'SequelizeValidationError') {
    const errors = {};
    error.errors.forEach(err => {
      errors[err.path] = err.message;
    });
    return sendValidationError(res, errors, 'Database validation failed');
  }

  if (error.name === 'SequelizeUniqueConstraintError') {
    return sendConflict(res, 'Resource with this information already exists');
  }

  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return sendError(res, 'Invalid reference to related resource', 400, null, 'FOREIGN_KEY_ERROR');
  }

  if (error.name === 'SequelizeConnectionError') {
    return sendServerError(res, 'Database connection error');
  }

  // Generic database error
  return sendServerError(res, 'Database operation failed');
};
