// ikootaapi/utils/CustomError.js
// Enhanced Custom Error class for comprehensive error handling

class CustomError extends Error {
  constructor(message, statusCode = 500, errorType = 'GeneralError', originalError = null) {
    super(message);
    
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorType = errorType;
    this.message = message;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  // Convert error to JSON format for API responses
  toJSON() {
    return {
      success: false,
      error: this.message,
      errorType: this.errorType,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      ...(process.env.NODE_ENV === 'development' && {
        stack: this.stack,
        originalError: this.originalError?.message
      })
    };
  }

  // Static methods for common error types
  static badRequest(message = 'Bad Request', originalError = null) {
    return new CustomError(message, 400, 'BadRequest', originalError);
  }

  static unauthorized(message = 'Unauthorized', originalError = null) {
    return new CustomError(message, 401, 'Unauthorized', originalError);
  }

  static forbidden(message = 'Forbidden', originalError = null) {
    return new CustomError(message, 403, 'Forbidden', originalError);
  }

  static notFound(message = 'Not Found', originalError = null) {
    return new CustomError(message, 404, 'NotFound', originalError);
  }

  static conflict(message = 'Conflict', originalError = null) {
    return new CustomError(message, 409, 'Conflict', originalError);
  }

  static unprocessableEntity(message = 'Unprocessable Entity', originalError = null) {
    return new CustomError(message, 422, 'UnprocessableEntity', originalError);
  }

  static tooManyRequests(message = 'Too Many Requests', originalError = null) {
    return new CustomError(message, 429, 'TooManyRequests', originalError);
  }

  static internalServer(message = 'Internal Server Error', originalError = null) {
    return new CustomError(message, 500, 'InternalServerError', originalError);
  }

  static serviceUnavailable(message = 'Service Unavailable', originalError = null) {
    return new CustomError(message, 503, 'ServiceUnavailable', originalError);
  }

  // Specific error types for survey system
  static surveyNotFound(message = 'Survey not found', originalError = null) {
    return new CustomError(message, 404, 'SurveyNotFound', originalError);
  }

  static surveyAlreadySubmitted(message = 'Survey already submitted', originalError = null) {
    return new CustomError(message, 409, 'SurveyAlreadySubmitted', originalError);
  }

  static invalidSurveyData(message = 'Invalid survey data', originalError = null) {
    return new CustomError(message, 400, 'InvalidSurveyData', originalError);
  }

  static surveyDraftNotFound(message = 'Survey draft not found', originalError = null) {
    return new CustomError(message, 404, 'SurveyDraftNotFound', originalError);
  }

  static questionNotFound(message = 'Question not found', originalError = null) {
    return new CustomError(message, 404, 'QuestionNotFound', originalError);
  }

  static labelValidationError(message = 'Label validation failed', originalError = null) {
    return new CustomError(message, 400, 'LabelValidationError', originalError);
  }

  // Specific error types for membership system
  static membershipNotEligible(message = 'Not eligible for membership action', originalError = null) {
    return new CustomError(message, 403, 'MembershipNotEligible', originalError);
  }

  static applicationNotFound(message = 'Application not found', originalError = null) {
    return new CustomError(message, 404, 'ApplicationNotFound', originalError);
  }

  static applicationAlreadyExists(message = 'Application already exists', originalError = null) {
    return new CustomError(message, 409, 'ApplicationAlreadyExists', originalError);
  }

  // Database-specific errors
  static databaseError(message = 'Database operation failed', originalError = null) {
    return new CustomError(message, 500, 'DatabaseError', originalError);
  }

  static connectionError(message = 'Database connection failed', originalError = null) {
    return new CustomError(message, 503, 'ConnectionError', originalError);
  }

  // Authentication and authorization errors
  static invalidToken(message = 'Invalid authentication token', originalError = null) {
    return new CustomError(message, 401, 'InvalidToken', originalError);
  }

  static tokenExpired(message = 'Authentication token expired', originalError = null) {
    return new CustomError(message, 401, 'TokenExpired', originalError);
  }

  static insufficientPermissions(message = 'Insufficient permissions', originalError = null) {
    return new CustomError(message, 403, 'InsufficientPermissions', originalError);
  }

  // Validation errors
  static validationError(message = 'Validation failed', errors = [], originalError = null) {
    const error = new CustomError(message, 400, 'ValidationError', originalError);
    error.validationErrors = errors;
    return error;
  }

  static requiredFieldMissing(field, originalError = null) {
    return new CustomError(`Required field missing: ${field}`, 400, 'RequiredFieldMissing', originalError);
  }

  static invalidFieldFormat(field, expectedFormat, originalError = null) {
    return new CustomError(
      `Invalid format for field '${field}'. Expected: ${expectedFormat}`, 
      400, 
      'InvalidFieldFormat', 
      originalError
    );
  }

  // File upload errors
  static fileTooLarge(maxSize, originalError = null) {
    return new CustomError(`File size exceeds maximum allowed: ${maxSize}`, 413, 'FileTooLarge', originalError);
  }

  static invalidFileType(allowedTypes, originalError = null) {
    return new CustomError(
      `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`, 
      400, 
      'InvalidFileType', 
      originalError
    );
  }

  // Rate limiting errors
  static rateLimitExceeded(message = 'Rate limit exceeded', originalError = null) {
    return new CustomError(message, 429, 'RateLimitExceeded', originalError);
  }

  // Content errors
  static contentNotFound(message = 'Content not found', originalError = null) {
    return new CustomError(message, 404, 'ContentNotFound', originalError);
  }

  static contentAlreadyExists(message = 'Content already exists', originalError = null) {
    return new CustomError(message, 409, 'ContentAlreadyExists', originalError);
  }

  static contentAccessDenied(message = 'Access to content denied', originalError = null) {
    return new CustomError(message, 403, 'ContentAccessDenied', originalError);
  }

  // Admin-specific errors
  static adminActionRequired(message = 'Admin action required', originalError = null) {
    return new CustomError(message, 403, 'AdminActionRequired', originalError);
  }

  static bulkOperationFailed(message = 'Bulk operation failed', originalError = null) {
    return new CustomError(message, 500, 'BulkOperationFailed', originalError);
  }

  // Email and notification errors
  static emailSendFailed(message = 'Email sending failed', originalError = null) {
    return new CustomError(message, 500, 'EmailSendFailed', originalError);
  }

  static notificationFailed(message = 'Notification sending failed', originalError = null) {
    return new CustomError(message, 500, 'NotificationFailed', originalError);
  }

  // Configuration errors
  static configurationError(message = 'Configuration error', originalError = null) {
    return new CustomError(message, 500, 'ConfigurationError', originalError);
  }

  static featureNotEnabled(feature, originalError = null) {
    return new CustomError(`Feature not enabled: ${feature}`, 501, 'FeatureNotEnabled', originalError);
  }

  // System maintenance errors
  static systemMaintenance(message = 'System under maintenance', originalError = null) {
    return new CustomError(message, 503, 'SystemMaintenance', originalError);
  }

  static serviceUnavailableError(service, originalError = null) {
    return new CustomError(`Service unavailable: ${service}`, 503, 'ServiceUnavailable', originalError);
  }
}

// Export both the class and common error creators
export default CustomError;

// Named exports for convenience
export {
  CustomError,
  // HTTP Status Code Errors
  CustomError as BadRequestError,
  CustomError as UnauthorizedError,
  CustomError as ForbiddenError,
  CustomError as NotFoundError,
  CustomError as ConflictError,
  CustomError as InternalServerError,
  
  // Application-Specific Errors
  CustomError as SurveyError,
  CustomError as MembershipError,
  CustomError as ContentError,
  CustomError as AuthError,
  CustomError as ValidationError,
  CustomError as DatabaseError
};

// Error handling utility functions
export const handleDatabaseError = (error, operation = 'database operation') => {
  console.error(`Database error during ${operation}:`, error);
  
  if (error.code === 'ER_DUP_ENTRY') {
    return CustomError.conflict('Duplicate entry detected');
  }
  
  if (error.code === 'ER_NO_SUCH_TABLE') {
    return CustomError.internalServer('Database table not found');
  }
  
  if (error.code === 'ECONNREFUSED') {
    return CustomError.serviceUnavailable('Database connection refused');
  }
  
  if (error.code === 'ER_ACCESS_DENIED_ERROR') {
    return CustomError.internalServer('Database access denied');
  }
  
  return CustomError.databaseError(`Database operation failed: ${operation}`, error);
};

export const handleValidationError = (errors) => {
  const messages = Array.isArray(errors) ? errors : [errors];
  return CustomError.validationError('Validation failed', messages);
};

export const handleAuthError = (error) => {
  if (error.name === 'JsonWebTokenError') {
    return CustomError.invalidToken('Invalid authentication token');
  }
  
  if (error.name === 'TokenExpiredError') {
    return CustomError.tokenExpired('Authentication token expired');
  }
  
  return CustomError.unauthorized('Authentication failed', error);
};

export const handleFileUploadError = (error) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return CustomError.fileTooLarge('10MB');
  }
  
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return CustomError.badRequest('Unexpected file upload');
  }
  
  return CustomError.badRequest('File upload failed', error);
};

// Console logging with proper error formatting
export const logError = (error, context = '') => {
  const timestamp = new Date().toISOString();
  const logContext = context ? ` [${context}]` : '';
  
  console.error(`❌ ${timestamp}${logContext} Error:`, {
    message: error.message,
    type: error.errorType || error.name,
    statusCode: error.statusCode,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
  
  if (error.originalError) {
    console.error(`   Original error:`, error.originalError.message);
  }
};

// Express error handler middleware
export const errorHandler = (error, req, res, next) => {
  // Log the error
  logError(error, `${req.method} ${req.originalUrl}`);
  
  // Handle different error types
  let customError;
  
  if (error instanceof CustomError) {
    customError = error;
  } else {
    // Convert common errors to CustomError
    if (error.name === 'ValidationError') {
      customError = handleValidationError
Error(error.errors);
    } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      customError = handleAuthError(error);
    }
    else {
      customError = CustomError.internalServer('An unexpected error occurred', error);
    }
  }   
};

