
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
