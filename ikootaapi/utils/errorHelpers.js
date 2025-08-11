// ikootaapi/utils/errorHelpers.js - NEW FILE

// Standardized error response format for all content controllers
export const formatErrorResponse = (error, req) => {
  const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  const isAdminRoute = req.originalUrl?.startsWith('/api/admin/') || req.originalUrl?.startsWith('/api/content/admin/');
  
  console.error(`🚨 Content Error [${errorId}]:`, {
    error: error.message,
    path: req.originalUrl,
    method: req.method,
    user: req.user?.username || req.user?.converse_id || 'unauthenticated',
    isAdminRoute,
    timestamp: new Date().toISOString()
  });
  
  let statusCode = error.statusCode || error.status || 500;
  let errorType = 'server_error';
  
  // Enhanced error categorization
  if (error.message.includes('validation') || error.message.includes('required')) {
    statusCode = 400;
    errorType = 'validation_error';
  } else if (error.message.includes('authentication') || error.message.includes('token')) {
    statusCode = 401;
    errorType = 'authentication_error';
  } else if (error.message.includes('permission') || error.message.includes('access denied')) {
    statusCode = 403;
    errorType = 'authorization_error';
  } else if (error.message.includes('not found')) {
    statusCode = 404;
    errorType = 'not_found_error';
  } else if (error.message.includes('duplicate') || error.message.includes('exists')) {
    statusCode = 409;
    errorType = 'conflict_error';
  }
  
  const errorResponse = {
    success: false,
    error: error.message || 'Internal server error',
    errorType,
    errorId,
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  };
  
  // Add contextual help
  if (statusCode === 400 && req.originalUrl?.includes('/content/')) {
    errorResponse.help = {
      message: 'Content validation failed',
      requiredFields: getRequiredFieldsForContentType(req.originalUrl),
      documentation: '/api/info'
    };
  } else if (statusCode === 403 && isAdminRoute) {
    errorResponse.help = {
      message: 'Admin access required',
      requiredRole: 'admin or super_admin',
      currentRole: req.user?.role || 'none'
    };
  }
  
  return { statusCode, errorResponse };
};

// Helper to get required fields by content type
const getRequiredFieldsForContentType = (url) => {
  if (url.includes('/chats')) {
    return ['title', 'text', 'user_id'];
  } else if (url.includes('/teachings')) {
    return ['topic', 'description', 'user_id'];
  } else if (url.includes('/comments')) {
    return ['comment', 'user_id', 'chat_id OR teaching_id'];
  }
  return [];
};


// Error handling utilities
import CustomError from './CustomError.js';

/**
 * Format error response
 */
// export const formatErrorResponse = (error, defaultMessage = 'An error occurred') => {
//   return {
//     success: false,
//     error: error.message || defaultMessage,
//     statusCode: error.statusCode || 500,
//     timestamp: new Date().toISOString()
//   };
// };

/**
 * Handle database errors
 */
export const handleDatabaseError = (error, operation = 'database operation') => {
  console.error(`Database error during ${operation}:`, error);
  
  if (error.code === 'ER_DUP_ENTRY') {
    throw new CustomError('Duplicate entry - record already exists', 409);
  }
  
  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    throw new CustomError('Referenced record does not exist', 400);
  }
  
  if (error.code === 'ER_ROW_IS_REFERENCED_2') {
    throw new CustomError('Cannot delete - record is referenced by other data', 400);
  }
  
  throw new CustomError(`Failed to perform ${operation}`, 500);
};

/**
 * Validate request parameters
 */
export const validateRequiredParams = (params, requiredFields) => {
  const missing = requiredFields.filter(field => !params[field]);
  
  if (missing.length > 0) {
    throw new CustomError(`Missing required parameters: ${missing.join(', ')}`, 400);
  }
  
  return true;
};

/**
 * Handle async errors
 */
export const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};