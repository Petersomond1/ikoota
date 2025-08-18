
// ikootaapi/utils/responseHelpers.js
// Standardized response helpers

export const successResponse = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

export const errorResponse = (res, error, statusCode = 500) => {
  const errorMessage = error.message || error || 'Internal server error';
  const errorData = {
    success: false,
    error: errorMessage,
    timestamp: new Date().toISOString()
  };
  
  // Add stack trace in development
  if (process.env.NODE_ENV === 'development' && error.stack) {
    errorData.stack = error.stack;
  }
  
  return res.status(statusCode).json(errorData);
};

export const validationErrorResponse = (res, errors) => {
  return res.status(400).json({
    success: false,
    error: 'Validation failed',
    validation_errors: errors,
    timestamp: new Date().toISOString()
  });
};




/**
 * Send success response
 */
export const success = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Send error response
 */
export const error = (res, error, statusCode = null) => {
  const code = statusCode || error.statusCode || error.status || 500;
  const message = error.message || 'An error occurred';
  
  console.error('❌ API Error:', {
    message,
    statusCode: code,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  
  return res.status(code).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  });
};

/**
 * Send paginated response
 */
export const paginated = (res, data = [], pagination = {}, message = 'Success') => {
  return res.json({
    success: true,
    message,
    data,
    pagination,
    timestamp: new Date().toISOString()
  });
};

/**
 * Send not found response
 */
export const notFound = (res, resource = 'Resource') => {
  return res.status(404).json({
    success: false,
    error: `${resource} not found`,
    timestamp: new Date().toISOString()
  });
};

/**
 * Send validation error response
 */
export const validationError = (res, errors = {}) => {
  return res.status(400).json({
    success: false,
    error: 'Validation failed',
    validation_errors: errors,
    timestamp: new Date().toISOString()
  });
};

/**
 * Send unauthorized response
 */
export const unauthorized = (res, message = 'Unauthorized access') => {
  return res.status(401).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  });
};

/**
 * Send forbidden response
 */
export const forbidden = (res, message = 'Access forbidden') => {
  return res.status(403).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  });
};

export const responseHelper = {
  success,
  error,
  paginated,
  notFound,
  validationError,
  unauthorized,
  forbidden
};

export default responseHelper;
