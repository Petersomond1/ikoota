// ikootaapi/utils/contentValidation.js - UNIFIED VERSION
// Combines existing validation with enhanced features
// Preserves backward compatibility while adding comprehensive validation

import CustomError from './CustomError.js';

// ===============================================
// EXISTING VALIDATION FUNCTIONS (PRESERVED)
// ===============================================

/**
 * PRESERVE EXISTING: Validate chat data (throws CustomError)
 */
export const validateChatData = (data) => {
  const { title, text, user_id } = data;
     
  if (!title || title.trim().length === 0) {
    throw new CustomError('Title is required', 400);
  }
     
  if (title.length > 255) {
    throw new CustomError('Title must be less than 255 characters', 400);
  }
     
  if (!text || text.trim().length === 0) {
    throw new CustomError('Text content is required', 400);
  }
     
  if (!user_id) {
    throw new CustomError('User ID is required', 400);
  }
     
  return true;
};

/**
 * PRESERVE EXISTING: Validate teaching data (throws CustomError)
 */
export const validateTeachingData = (data) => {
  const { topic, description, user_id } = data;
     
  if (!topic || topic.trim().length === 0) {
    throw new CustomError('Topic is required', 400);
  }
     
  if (!description || description.trim().length === 0) {
    throw new CustomError('Description is required', 400);
  }
     
  if (!user_id) {
    throw new CustomError('User ID is required', 400);
  }
     
  return true;
};

/**
 * PRESERVE EXISTING: Validate comment data (throws CustomError)
 */
export const validateCommentData = (data) => {
  const { comment, user_id, chat_id, teaching_id } = data;
     
  if (!comment || comment.trim().length === 0) {
    throw new CustomError('Comment text is required', 400);
  }
     
  if (!user_id) {
    throw new CustomError('User ID is required', 400);
  }
     
  if (!chat_id && !teaching_id) {
    throw new CustomError('Either chat_id or teaching_id is required', 400);
  }
     
  return true;
};

/**
 * PRESERVE EXISTING: Validate user ID format (throws CustomError)
 */
export const validateUserId = (user_id, type = 'any') => {
  if (!user_id) {
    throw new CustomError('User ID is required', 400);
  }
     
  if (type === 'converse' && (typeof user_id !== 'string' || user_id.length !== 10)) {
    throw new CustomError('Converse ID must be a 10-character string', 400);
  }
     
  if (type === 'numeric' && isNaN(parseInt(user_id))) {
    throw new CustomError('User ID must be numeric', 400);
  }
     
  return true;
};

/**
 * PRESERVE EXISTING: Validate content approval status (throws CustomError)
 */
export const validateApprovalStatus = (status) => {
  const validStatuses = ['pending', 'approved', 'rejected'];
     
  if (!status || !validStatuses.includes(status)) {
    throw new CustomError(`Status must be one of: ${validStatuses.join(', ')}`, 400);
  }
     
  return true;
};

// ===============================================
// ENHANCED VALIDATION FUNCTIONS (NEW)
// ===============================================

/**
 * ENHANCED: Validate chat data (returns error array)
 */
export const validateChatDataEnhanced = (data) => {
  const errors = [];
  
  if (!data.title || data.title.trim().length === 0) {
    errors.push('Title is required');
  }
  
  if (data.title && data.title.length > 255) {
    errors.push('Title must be less than 255 characters');
  }
  
  if (!data.text || data.text.trim().length === 0) {
    errors.push('Text content is required');
  }
  
  if (!data.user_id) {
    errors.push('User ID is required');
  }
  
  // Validate user_id format for chats (char(10))
  if (data.user_id && (typeof data.user_id !== 'string' || data.user_id.length !== 10)) {
    errors.push('User ID must be a 10-character converse_id for chats');
  }
  
  // Validate audience if provided
  if (data.audience && data.audience.length > 255) {
    errors.push('Audience must be less than 255 characters');
  }
  
  // Validate summary if provided
  if (data.summary && data.summary.length > 1000) {
    errors.push('Summary must be less than 1000 characters');
  }
  
  return errors;
};

/**
 * ENHANCED: Validate teaching data (returns error array)
 */
export const validateTeachingDataEnhanced = (data) => {
  const errors = [];
  
  if (!data.topic || data.topic.trim().length === 0) {
    errors.push('Topic is required');
  }
  
  if (data.topic && data.topic.length > 255) {
    errors.push('Topic must be less than 255 characters');
  }
  
  if (!data.description || data.description.trim().length === 0) {
    errors.push('Description is required');
  }
  
  if (!data.user_id) {
    errors.push('User ID is required');
  }
  
  // Validate user_id format for teachings (numeric)
  if (data.user_id && isNaN(parseInt(data.user_id))) {
    errors.push('User ID must be numeric for teachings');
  }
  
  // Validate content OR media presence
  if (!data.content && (!data.media || data.media.length === 0)) {
    errors.push('Either content text or media files must be provided');
  }
  
  // Validate subject matter if provided
  if (data.subjectMatter && data.subjectMatter.length > 255) {
    errors.push('Subject matter must be less than 255 characters');
  }
  
  // Validate audience if provided
  if (data.audience && data.audience.length > 255) {
    errors.push('Audience must be less than 255 characters');
  }
  
  return errors;
};

/**
 * ENHANCED: Validate comment data (returns error array)
 */
export const validateCommentDataEnhanced = (data) => {
  const errors = [];
  
  if (!data.comment || data.comment.trim().length === 0) {
    errors.push('Comment text is required');
  }
  
  if (data.comment && data.comment.length > 2000) {
    errors.push('Comment must be less than 2000 characters');
  }
  
  if (!data.user_id) {
    errors.push('User ID is required');
  }
  
  // Validate user_id format for comments (char(10))
  if (data.user_id && (typeof data.user_id !== 'string' || data.user_id.length !== 10)) {
    errors.push('User ID must be a 10-character converse_id for comments');
  }
  
  if (!data.chat_id && !data.teaching_id) {
    errors.push('Either chat_id or teaching_id is required');
  }
  
  if (data.chat_id && data.teaching_id) {
    errors.push('Cannot comment on both chat and teaching simultaneously');
  }
  
  // Validate chat_id if provided
  if (data.chat_id && isNaN(parseInt(data.chat_id))) {
    errors.push('Chat ID must be numeric');
  }
  
  // Validate teaching_id if provided
  if (data.teaching_id && isNaN(parseInt(data.teaching_id))) {
    errors.push('Teaching ID must be numeric');
  }
  
  return errors;
};

/**
 * ENHANCED: Validate media files
 */
export const validateMediaFiles = (files) => {
  const errors = [];
  
  if (!Array.isArray(files)) {
    return ['Media files must be an array'];
  }
  
  if (files.length > 3) {
    errors.push('Maximum 3 media files allowed');
  }
  
  files.forEach((file, index) => {
    if (!file.url) {
      errors.push(`Media file ${index + 1} must have a URL`);
    }
    
    if (!file.type) {
      errors.push(`Media file ${index + 1} must have a type`);
    }
    
    // Validate file type
    const validTypes = ['image', 'video', 'audio', 'document', 'file'];
    if (file.type && !validTypes.includes(file.type)) {
      errors.push(`Media file ${index + 1} has invalid type: ${file.type}`);
    }
  });
  
  return errors;
};

/**
 * ENHANCED: Validate user ID format based on content type (returns error array)
 */
export const validateUserIdEnhanced = (user_id, contentType) => {
  const errors = [];
  
  if (!user_id) {
    errors.push('User ID is required');
    return errors;
  }
  
  switch (contentType) {
    case 'chat':
    case 'comment':
      // These use char(10) converse_id
      if (typeof user_id !== 'string' || user_id.length !== 10) {
        errors.push(`${contentType} requires a 10-character converse_id`);
      }
      break;
      
    case 'teaching':
      // These use numeric user.id
      if (isNaN(parseInt(user_id))) {
        errors.push('Teaching requires a numeric user ID');
      }
      break;
      
    default:
      errors.push('Invalid content type for user ID validation');
  }
  
  return errors;
};

/**
 * ENHANCED: Validate approval status (returns error array)
 */
export const validateApprovalStatusEnhanced = (status) => {
  const validStatuses = ['pending', 'approved', 'rejected', 'deleted'];
  
  if (!status) {
    return ['Approval status is required'];
  }
  
  if (!validStatuses.includes(status)) {
    return [`Status must be one of: ${validStatuses.join(', ')}`];
  }
  
  return [];
};

/**
 * ENHANCED: Validate pagination parameters
 */
export const validatePagination = (page, limit) => {
  const errors = [];
  
  if (page !== undefined) {
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1) {
      errors.push('Page must be a positive integer');
    }
    if (pageNum > 1000) {
      errors.push('Page number too large (max: 1000)');
    }
  }
  
  if (limit !== undefined) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1) {
      errors.push('Limit must be a positive integer');
    }
    if (limitNum > 100) {
      errors.push('Limit too large (max: 100)');
    }
  }
  
  return errors;
};

/**
 * ENHANCED: Validate search parameters
 */
export const validateSearchParams = (params) => {
  const errors = [];
  const { query, user_id, audience, subjectMatter } = params;
  
  if (query && query.length < 2) {
    errors.push('Search query must be at least 2 characters');
  }
  
  if (query && query.length > 100) {
    errors.push('Search query too long (max: 100 characters)');
  }
  
  if (user_id && isNaN(parseInt(user_id))) {
    errors.push('User ID must be numeric for search');
  }
  
  if (audience && audience.length > 50) {
    errors.push('Audience filter too long (max: 50 characters)');
  }
  
  if (subjectMatter && subjectMatter.length > 100) {
    errors.push('Subject matter filter too long (max: 100 characters)');
  }
  
  return errors;
};

/**
 * ENHANCED: Sanitize content text (remove potentially harmful content)
 */
export const sanitizeContent = (text) => {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  return text
    .trim()
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove potentially harmful HTML
    .replace(/<[^>]*>/g, '')
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * ENHANCED: Validate lesson number format
 */
export const validateLessonNumber = (lessonNumber) => {
  const errors = [];
  
  if (!lessonNumber) {
    return errors; // Optional field
  }
  
  if (typeof lessonNumber !== 'string') {
    errors.push('Lesson number must be a string');
    return errors;
  }
  
  if (lessonNumber.length > 50) {
    errors.push('Lesson number too long (max: 50 characters)');
  }
  
  // Allow alphanumeric, hyphens, underscores, and dots
  if (!/^[a-zA-Z0-9\-_.]+$/.test(lessonNumber)) {
    errors.push('Lesson number contains invalid characters (only letters, numbers, hyphens, underscores, and dots allowed)');
  }
  
  return errors;
};

/**
 * ENHANCED: Validate date range
 */
export const validateDateRange = (startDate, endDate) => {
  const errors = [];
  
  if (startDate && isNaN(Date.parse(startDate))) {
    errors.push('Invalid start date format');
  }
  
  if (endDate && isNaN(Date.parse(endDate))) {
    errors.push('Invalid end date format');
  }
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      errors.push('Start date cannot be after end date');
    }
    
    // Prevent excessive date ranges (more than 1 year)
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    if (end - start > oneYear) {
      errors.push('Date range cannot exceed 1 year');
    }
  }
  
  return errors;
};

/**
 * ENHANCED: Comprehensive validation for content creation
 */
export const validateContentCreation = (data, contentType) => {
  let errors = [];
  
  // Common validations
  errors = errors.concat(validateUserIdEnhanced(data.user_id, contentType));
  
  if (data.media) {
    errors = errors.concat(validateMediaFiles(data.media));
  }
  
  // Content-specific validations
  switch (contentType) {
    case 'chat':
      errors = errors.concat(validateChatDataEnhanced(data));
      break;
    case 'teaching':
      errors = errors.concat(validateTeachingDataEnhanced(data));
      break;
    case 'comment':
      errors = errors.concat(validateCommentDataEnhanced(data));
      break;
    default:
      errors.push('Invalid content type');
  }
  
  return errors;
};

// ===============================================
// UNIFIED VALIDATION WRAPPER FUNCTIONS
// ===============================================

/**
 * UNIFIED: Validate with choice of error handling
 * @param {Object} data - Data to validate
 * @param {string} contentType - Type of content (chat, teaching, comment)
 * @param {boolean} throwErrors - If true, throws CustomError; if false, returns error array
 */
export const validateContent = (data, contentType, throwErrors = true) => {
  if (throwErrors) {
    // Use existing validation (throws CustomError)
    switch (contentType) {
      case 'chat':
        return validateChatData(data);
      case 'teaching':
        return validateTeachingData(data);
      case 'comment':
        return validateCommentData(data);
      default:
        throw new CustomError('Invalid content type', 400);
    }
  } else {
    // Use enhanced validation (returns error array)
    return validateContentCreation(data, contentType);
  }
};

/**
 * UNIFIED: Validate user ID with choice of error handling
 */
export const validateUserIdUnified = (user_id, type = 'any', throwErrors = true) => {
  if (throwErrors) {
    return validateUserId(user_id, type);
  } else {
    return validateUserIdEnhanced(user_id, type);
  }
};

/**
 * UNIFIED: Validate approval status with choice of error handling
 */
export const validateApprovalStatusUnified = (status, throwErrors = true) => {
  if (throwErrors) {
    return validateApprovalStatus(status);
  } else {
    return validateApprovalStatusEnhanced(status);
  }
};

// ===============================================
// MIGRATION GUIDE & COMPATIBILITY
// ===============================================

/*
MIGRATION GUIDE:

1. EXISTING CODE CONTINUES TO WORK:
   - validateChatData() - throws CustomError (unchanged)
   - validateTeachingData() - throws CustomError (unchanged) 
   - validateCommentData() - throws CustomError (unchanged)
   - validateUserId() - throws CustomError (unchanged)
   - validateApprovalStatus() - throws CustomError (unchanged)

2. NEW ENHANCED FUNCTIONS AVAILABLE:
   - validateChatDataEnhanced() - returns error array
   - validateTeachingDataEnhanced() - returns error array
   - validateCommentDataEnhanced() - returns error array
   - validateUserIdEnhanced() - returns error array
   - validateApprovalStatusEnhanced() - returns error array
   - validateContentCreation() - comprehensive validation
   - validatePagination() - new functionality
   - validateSearchParams() - new functionality
   - sanitizeContent() - new functionality

3. UNIFIED FUNCTIONS:
   - validateContent(data, type, throwErrors) - choose error handling
   - validateUserIdUnified(id, type, throwErrors) - choose error handling
   - validateApprovalStatusUnified(status, throwErrors) - choose error handling

4. RECOMMENDED MIGRATION:
   - Keep existing code unchanged for now
   - Use enhanced functions for new features
   - Gradually migrate to unified functions when refactoring
   - Use enhanced functions in new controllers that need array-based error handling

5. EXAMPLES:
   
   // Existing code (unchanged):
   try {
     validateChatData(chatData); // throws CustomError
   } catch (error) {
     // handle error
   }
   
   // New enhanced code:
   const errors = validateChatDataEnhanced(chatData); // returns array
   if (errors.length > 0) {
     // handle errors
   }
   
   // Unified approach:
   const errors = validateContent(chatData, 'chat', false); // returns array
   // OR
   validateContent(chatData, 'chat', true); // throws CustomError
*/

console.log('✅ Unified Content Validation loaded');
console.log('   📋 BACKWARD COMPATIBLE: All existing functions preserved');
console.log('   🔧 ENHANCED FEATURES: New validation functions with array-based errors');
console.log('   🎯 UNIFIED APPROACH: Choose error handling method per use case');
console.log('   📚 COMPREHENSIVE: Validation for all content types and edge cases');