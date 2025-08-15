// ikootaapi/utils/errorHelpers.js - COMPLETE RECREATION
// Enhanced error handling utilities for content management system
import CustomError from './CustomError.js';

/**
 * ✅ Database Error Handler
 * Converts database errors to user-friendly messages
 */
export const handleDatabaseError = (error, context = '') => {
  console.error(`Database error in ${context}:`, error);
  
  // Handle specific database errors
  if (error.code === 'ER_DUP_ENTRY') {
    throw new CustomError('Duplicate entry found', 409);
  }
  
  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    throw new CustomError('Referenced record not found', 400);
  }
  
  if (error.code === 'ER_DATA_TOO_LONG') {
    throw new CustomError('Data too long for field', 400);
  }
  
  if (error.code === 'ER_BAD_NULL_ERROR') {
    throw new CustomError('Required field cannot be null', 400);
  }
  
  // Generic database error
  throw new CustomError('Database operation failed', 500);
};

/**
 * ✅ Validation Error Handler
 * Formats validation errors consistently
 */
export const handleValidationError = (errors) => {
  if (Array.isArray(errors)) {
    const messages = errors.map(err => err.message || err).join(', ');
    throw new CustomError(`Validation failed: ${messages}`, 400);
  }
  
  if (typeof errors === 'string') {
    throw new CustomError(`Validation failed: ${errors}`, 400);
  }
  
  throw new CustomError('Validation failed', 400);
};

/**
 * ✅ File Upload Error Handler
 * Handles S3 and file upload errors
 */
export const handleFileUploadError = (error, filename = '') => {
  console.error(`File upload error for ${filename}:`, error);
  
  if (error.code === 'NoSuchBucket') {
    throw new CustomError('Storage bucket not found', 500);
  }
  
  if (error.code === 'AccessDenied') {
    throw new CustomError('Storage access denied', 500);
  }
  
  if (error.code === 'EntityTooLarge') {
    throw new CustomError('File size too large', 400);
  }
  
  if (error.name === 'MulterError') {
    if (error.code === 'LIMIT_FILE_SIZE') {
      throw new CustomError('File size exceeds limit', 400);
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      throw new CustomError('Unexpected file field', 400);
    }
  }
  
  throw new CustomError('File upload failed', 500);
};

/**
 * ✅ Authentication Error Handler
 * Handles auth-related errors
 */
export const handleAuthError = (error) => {
  if (error.name === 'TokenExpiredError') {
    throw new CustomError('Token has expired', 401);
  }
  
  if (error.name === 'JsonWebTokenError') {
    throw new CustomError('Invalid token', 401);
  }
  
  if (error.name === 'NotBeforeError') {
    throw new CustomError('Token not active yet', 401);
  }
  
  throw new CustomError('Authentication failed', 401);
};

/**
 * ✅ Content Specific Error Handler
 * Handles content-related business logic errors
 */
export const handleContentError = (error, contentType = '') => {
  console.error(`Content error for ${contentType}:`, error);
  
  // Handle specific content errors
  if (error.message?.includes('not found')) {
    throw new CustomError(`${contentType} not found`, 404);
  }
  
  if (error.message?.includes('unauthorized')) {
    throw new CustomError(`Unauthorized access to ${contentType}`, 403);
  }
  
  if (error.message?.includes('duplicate')) {
    throw new CustomError(`${contentType} already exists`, 409);
  }
  
  // Re-throw CustomErrors as-is
  if (error instanceof CustomError) {
    throw error;
  }
  
  throw new CustomError(`${contentType} operation failed`, 500);
};

/**
 * ✅ Async Error Wrapper
 * Wraps async functions to catch and handle errors
 */
export const asyncErrorWrapper = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * ✅ Format Error Response
 * Formats error responses consistently
 */
export const formatErrorResponse = (error, req) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const response = {
    success: false,
    message: error.message || 'Internal server error',
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };
  
  // Add stack trace in development
  if (isDevelopment && error.stack) {
    response.stack = error.stack;
  }
  
  // Add error code if available
  if (error.code) {
    response.code = error.code;
  }
  
  return response;
};

/**
 * ✅ Log Error
 * Logs errors with context
 */
export const logError = (error, context = {}) => {
  const errorLog = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context: context
  };
  
  console.error('Error logged:', JSON.stringify(errorLog, null, 2));
  
  // In production, you might want to send to error tracking service
  // if (process.env.NODE_ENV === 'production') {
  //   // Send to Sentry, LogRocket, etc.
  // }
};

/**
 * ✅ Parse Database Result
 * Safely parse database results with error handling
 */
export const parseDatabaseResult = (result, expectedType = 'array') => {
  try {
    if (!result) {
      return expectedType === 'array' ? [] : null;
    }
    
    if (expectedType === 'array' && !Array.isArray(result)) {
      return [result];
    }
    
    if (expectedType === 'object' && Array.isArray(result)) {
      return result[0] || null;
    }
    
    return result;
  } catch (error) {
    console.error('Error parsing database result:', error);
    return expectedType === 'array' ? [] : null;
  }
};

/**
 * ✅ Retry Operation
 * Retries operations with exponential backoff
 */
export const retryOperation = async (operation, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`Operation failed (attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};









// // ikootaapi/utils/errorHelpers.js - NEW FILE

// // Standardized error response format for all content controllers
// export const formatErrorResponse = (error, req) => {
//   const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2);
//   const isAdminRoute = req.originalUrl?.startsWith('/api/admin/') || req.originalUrl?.startsWith('/api/content/admin/');
  
//   console.error(`🚨 Content Error [${errorId}]:`, {
//     error: error.message,
//     path: req.originalUrl,
//     method: req.method,
//     user: req.user?.username || req.user?.converse_id || 'unauthenticated',
//     isAdminRoute,
//     timestamp: new Date().toISOString()
//   });
  
//   let statusCode = error.statusCode || error.status || 500;
//   let errorType = 'server_error';
  
//   // Enhanced error categorization
//   if (error.message.includes('validation') || error.message.includes('required')) {
//     statusCode = 400;
//     errorType = 'validation_error';
//   } else if (error.message.includes('authentication') || error.message.includes('token')) {
//     statusCode = 401;
//     errorType = 'authentication_error';
//   } else if (error.message.includes('permission') || error.message.includes('access denied')) {
//     statusCode = 403;
//     errorType = 'authorization_error';
//   } else if (error.message.includes('not found')) {
//     statusCode = 404;
//     errorType = 'not_found_error';
//   } else if (error.message.includes('duplicate') || error.message.includes('exists')) {
//     statusCode = 409;
//     errorType = 'conflict_error';
//   }
  
//   const errorResponse = {
//     success: false,
//     error: error.message || 'Internal server error',
//     errorType,
//     errorId,
//     path: req.originalUrl,
//     method: req.method,
//     timestamp: new Date().toISOString()
//   };
  
//   // Add contextual help
//   if (statusCode === 400 && req.originalUrl?.includes('/content/')) {
//     errorResponse.help = {
//       message: 'Content validation failed',
//       requiredFields: getRequiredFieldsForContentType(req.originalUrl),
//       documentation: '/api/info'
//     };
//   } else if (statusCode === 403 && isAdminRoute) {
//     errorResponse.help = {
//       message: 'Admin access required',
//       requiredRole: 'admin or super_admin',
//       currentRole: req.user?.role || 'none'
//     };
//   }
  
//   return { statusCode, errorResponse };
// };

// // Helper to get required fields by content type
// const getRequiredFieldsForContentType = (url) => {
//   if (url.includes('/chats')) {
//     return ['title', 'text', 'user_id'];
//   } else if (url.includes('/teachings')) {
//     return ['topic', 'description', 'user_id'];
//   } else if (url.includes('/comments')) {
//     return ['comment', 'user_id', 'chat_id OR teaching_id'];
//   }
//   return [];
// };


// // Error handling utilities
// import CustomError from './CustomError.js';

// /**
//  * Format error response
//  */
// // export const formatErrorResponse = (error, defaultMessage = 'An error occurred') => {
// //   return {
// //     success: false,
// //     error: error.message || defaultMessage,
// //     statusCode: error.statusCode || 500,
// //     timestamp: new Date().toISOString()
// //   };
// // };

// /**
//  * Handle database errors
//  */
// export const handleDatabaseError = (error, operation = 'database operation') => {
//   console.error(`Database error during ${operation}:`, error);
  
//   if (error.code === 'ER_DUP_ENTRY') {
//     throw new CustomError('Duplicate entry - record already exists', 409);
//   }
  
//   if (error.code === 'ER_NO_REFERENCED_ROW_2') {
//     throw new CustomError('Referenced record does not exist', 400);
//   }
  
//   if (error.code === 'ER_ROW_IS_REFERENCED_2') {
//     throw new CustomError('Cannot delete - record is referenced by other data', 400);
//   }
  
//   throw new CustomError(`Failed to perform ${operation}`, 500);
// };

// /**
//  * Validate request parameters
//  */
// export const validateRequiredParams = (params, requiredFields) => {
//   const missing = requiredFields.filter(field => !params[field]);
  
//   if (missing.length > 0) {
//     throw new CustomError(`Missing required parameters: ${missing.join(', ')}`, 400);
//   }
  
//   return true;
// };

// /**
//  * Handle async errors
//  */
// export const asyncErrorHandler = (fn) => {
//   return (req, res, next) => {
//     Promise.resolve(fn(req, res, next)).catch(next);
//   };
// };