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





