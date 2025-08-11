// ikootaapi/middleware/classValidation.js
// COMPLETE CLASS VALIDATION MIDDLEWARE
// Comprehensive validation for class operations with OTU# format support

import { validateIdFormat } from '../utils/idGenerator.js';
import CustomError from '../utils/CustomError.js';

// ===============================================
// ID FORMAT VALIDATION
// ===============================================

/**
 * Validate class ID format (OTU#XXXXXX)
 */
export const validateClassId = (req, res, next) => {
  const { id, classId } = req.params;
  const targetId = id || classId;
  
  if (targetId && !validateIdFormat(targetId, 'class')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid class ID format. Expected OTU#XXXXXX format',
      provided: targetId,
      expected_format: 'OTU#XXXXXX',
      examples: ['OTU#001234', 'OTU#Public'],
      timestamp: new Date().toISOString()
    });
  }
  next();
};

/**
 * Validate user ID format (OTO#XXXXXX)
 */
export const validateUserId = (req, res, next) => {
  const { userId, user_id } = req.params;
  const targetId = userId || user_id || req.body.user_id;
  
  if (targetId && !validateIdFormat(targetId, 'user')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid user ID format. Expected OTO#XXXXXX format',
      provided: targetId,
      expected_format: 'OTO#XXXXXX',
      examples: ['OTO#001234', 'OTO#987654'],
      timestamp: new Date().toISOString()
    });
  }
  next();
};

/**
 * Validate content ID format
 */
export const validateContentId = (req, res, next) => {
  const { contentId, content_id } = req.params;
  const targetId = contentId || content_id || req.body.content_id;
  
  if (targetId && typeof targetId !== 'number' && isNaN(parseInt(targetId))) {
    return res.status(400).json({
      success: false,
      error: 'Invalid content ID format. Expected numeric ID',
      provided: targetId,
      expected_format: 'number',
      timestamp: new Date().toISOString()
    });
  }
  next();
};

// ===============================================
// PAGINATION VALIDATION
// ===============================================

/**
 * Validate pagination parameters
 */
export const validatePagination = (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  
  if (isNaN(pageNum) || pageNum < 1) {
    return res.status(400).json({
      success: false,
      error: 'Page must be a positive integer',
      provided: page,
      minimum: 1,
      timestamp: new Date().toISOString()
    });
  }
  
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return res.status(400).json({
      success: false,
      error: 'Limit must be between 1 and 100',
      provided: limit,
      range: '1-100',
      timestamp: new Date().toISOString()
    });
  }
  
  req.pagination = { page: pageNum, limit: limitNum };
  next();
};

/**
 * Validate sorting parameters
 */
export const validateSorting = (req, res, next) => {
  const { sort_by, sort_order = 'DESC' } = req.query;
  
  if (sort_by) {
    const allowedSortFields = [
      'createdAt', 'updatedAt', 'class_name', 'joinedAt', 
      'total_members', 'class_type', 'is_active', 'is_public'
    ];
    
    if (!allowedSortFields.includes(sort_by)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid sort field',
        provided: sort_by,
        allowed_fields: allowedSortFields,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  if (sort_order && !['ASC', 'DESC', 'asc', 'desc'].includes(sort_order)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid sort order. Must be ASC or DESC',
      provided: sort_order,
      allowed_values: ['ASC', 'DESC'],
      timestamp: new Date().toISOString()
    });
  }
  
  req.sorting = { 
    sort_by: sort_by || 'createdAt', 
    sort_order: (sort_order || 'DESC').toUpperCase() 
  };
  next();
};

// ===============================================
// CLASS DATA VALIDATION
// ===============================================

/**
 * Validate class creation/update data
 */
export const validateClassData = (req, res, next) => {
  const {
    class_name,
    class_type,
    is_public,
    max_members,
    privacy_level,
    difficulty_level,
    estimated_duration,
    tags,
    prerequisites,
    learning_objectives
  } = req.body;
  
  // Required fields for POST (creation)
  if (req.method === 'POST' && (!class_name || class_name.trim().length === 0)) {
    return res.status(400).json({
      success: false,
      error: 'Class name is required',
      field: 'class_name',
      timestamp: new Date().toISOString()
    });
  }
  
  // Class name validation
  if (class_name !== undefined) {
    if (typeof class_name !== 'string' || class_name.length > 255) {
      return res.status(400).json({
        success: false,
        error: 'Class name must be a string with maximum 255 characters',
        field: 'class_name',
        provided_length: class_name?.length,
        max_length: 255,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  // Class type validation
  if (class_type && !['demographic', 'subject', 'public', 'special', 'general', 'lecture', 'workshop', 'seminar', 'discussion'].includes(class_type)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid class type',
      field: 'class_type',
      provided: class_type,
      allowed_values: ['demographic', 'subject', 'public', 'special', 'general', 'lecture', 'workshop', 'seminar', 'discussion'],
      timestamp: new Date().toISOString()
    });
  }
  
  // Public flag validation
  if (is_public !== undefined && typeof is_public !== 'boolean') {
    return res.status(400).json({
      success: false,
      error: 'is_public must be a boolean value',
      field: 'is_public',
      provided: is_public,
      expected_type: 'boolean',
      timestamp: new Date().toISOString()
    });
  }
  
  // Max members validation
  if (max_members !== undefined && (isNaN(max_members) || max_members < 1 || max_members > 10000)) {
    return res.status(400).json({
      success: false,
      error: 'max_members must be a positive integer between 1 and 10000',
      field: 'max_members',
      provided: max_members,
      range: '1-10000',
      timestamp: new Date().toISOString()
    });
  }
  
  // Privacy level validation
  if (privacy_level && !['public', 'members_only', 'admin_only'].includes(privacy_level)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid privacy level',
      field: 'privacy_level',
      provided: privacy_level,
      allowed_values: ['public', 'members_only', 'admin_only'],
      timestamp: new Date().toISOString()
    });
  }
  
  // Difficulty level validation
  if (difficulty_level && !['beginner', 'intermediate', 'advanced', 'expert'].includes(difficulty_level)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid difficulty level',
      field: 'difficulty_level',
      provided: difficulty_level,
      allowed_values: ['beginner', 'intermediate', 'advanced', 'expert'],
      timestamp: new Date().toISOString()
    });
  }
  
  // Estimated duration validation
  if (estimated_duration !== undefined && (isNaN(estimated_duration) || estimated_duration < 1)) {
    return res.status(400).json({
      success: false,
      error: 'estimated_duration must be a positive integer (minutes)',
      field: 'estimated_duration',
      provided: estimated_duration,
      minimum: 1,
      timestamp: new Date().toISOString()
    });
  }
  
  // Tags validation
  if (tags !== undefined) {
    if (!Array.isArray(tags) && typeof tags !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Tags must be an array or comma-separated string',
        field: 'tags',
        provided_type: typeof tags,
        expected_types: ['array', 'string'],
        timestamp: new Date().toISOString()
      });
    }
    
    if (Array.isArray(tags) && tags.length > 20) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 20 tags allowed',
        field: 'tags',
        provided_count: tags.length,
        max_count: 20,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  // Prerequisites validation
  if (prerequisites !== undefined && !Array.isArray(prerequisites) && typeof prerequisites !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Prerequisites must be an array or comma-separated string',
      field: 'prerequisites',
      provided_type: typeof prerequisites,
      expected_types: ['array', 'string'],
      timestamp: new Date().toISOString()
    });
  }
  
  // Learning objectives validation
  if (learning_objectives !== undefined && !Array.isArray(learning_objectives) && typeof learning_objectives !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Learning objectives must be an array or comma-separated string',
      field: 'learning_objectives',
      provided_type: typeof learning_objectives,
      expected_types: ['array', 'string'],
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

// ===============================================
// MEMBERSHIP ACTION VALIDATION
// ===============================================

/**
 * Validate membership management actions
 */
export const validateMembershipAction = (req, res, next) => {
  const { action, new_role } = req.body;
  
  if (!action) {
    return res.status(400).json({
      success: false,
      error: 'Action is required',
      field: 'action',
      allowed_actions: ['approve', 'reject', 'remove', 'change_role', 'promote', 'demote'],
      timestamp: new Date().toISOString()
    });
  }
  
  const allowedActions = ['approve', 'reject', 'remove', 'change_role', 'promote', 'demote'];
  if (!allowedActions.includes(action)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid action',
      field: 'action',
      provided: action,
      allowed_actions: allowedActions,
      timestamp: new Date().toISOString()
    });
  }
  
  // Validate new_role if action is change_role or promote
  if (['change_role', 'promote'].includes(action)) {
    if (!new_role) {
      return res.status(400).json({
        success: false,
        error: 'new_role is required for this action',
        field: 'new_role',
        action: action,
        allowed_roles: ['member', 'moderator', 'assistant', 'instructor'],
        timestamp: new Date().toISOString()
      });
    }
    
    const allowedRoles = ['member', 'moderator', 'assistant', 'instructor'];
    if (!allowedRoles.includes(new_role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role',
        field: 'new_role',
        provided: new_role,
        allowed_roles: allowedRoles,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  next();
};

// ===============================================
// CONTENT VALIDATION
// ===============================================

/**
 * Validate content assignment to class
 */
export const validateContentData = (req, res, next) => {
  const { content_id, content_type, access_level } = req.body;
  
  // Required fields
  if (!content_id || !content_type) {
    return res.status(400).json({
      success: false,
      error: 'content_id and content_type are required',
      required_fields: ['content_id', 'content_type'],
      timestamp: new Date().toISOString()
    });
  }
  
  // Content ID validation
  if (isNaN(parseInt(content_id))) {
    return res.status(400).json({
      success: false,
      error: 'content_id must be a valid number',
      field: 'content_id',
      provided: content_id,
      timestamp: new Date().toISOString()
    });
  }
  
  // Content type validation
  const allowedContentTypes = ['chat', 'teaching', 'announcement', 'assignment', 'resource', 'discussion'];
  if (!allowedContentTypes.includes(content_type)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid content type',
      field: 'content_type',
      provided: content_type,
      allowed_types: allowedContentTypes,
      timestamp: new Date().toISOString()
    });
  }
  
  // Access level validation
  if (access_level) {
    const allowedAccessLevels = ['read', 'write', 'admin', 'view_only', 'full_access'];
    if (!allowedAccessLevels.includes(access_level)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid access level',
        field: 'access_level',
        provided: access_level,
        allowed_levels: allowedAccessLevels,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  next();
};

// ===============================================
// FEEDBACK VALIDATION
// ===============================================

/**
 * Validate feedback submission
 */
export const validateFeedback = (req, res, next) => {
  const { rating, comments, feedback_type, anonymous } = req.body;
  
  // At least rating or comments must be provided
  if (!rating && !comments) {
    return res.status(400).json({
      success: false,
      error: 'Either rating or comments is required',
      required_fields: ['rating (1-5)', 'comments'],
      timestamp: new Date().toISOString()
    });
  }
  
  // Rating validation
  if (rating !== undefined) {
    const ratingNum = parseFloat(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5',
        field: 'rating',
        provided: rating,
        range: '1-5',
        timestamp: new Date().toISOString()
      });
    }
  }
  
  // Comments validation
  if (comments !== undefined && (typeof comments !== 'string' || comments.length > 2000)) {
    return res.status(400).json({
      success: false,
      error: 'Comments must be a string with maximum 2000 characters',
      field: 'comments',
      provided_length: comments?.length,
      max_length: 2000,
      timestamp: new Date().toISOString()
    });
  }
  
  // Feedback type validation
  if (feedback_type) {
    const allowedFeedbackTypes = ['general', 'content', 'instructor', 'technical', 'suggestion', 'complaint'];
    if (!allowedFeedbackTypes.includes(feedback_type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid feedback type',
        field: 'feedback_type',
        provided: feedback_type,
        allowed_types: allowedFeedbackTypes,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  // Anonymous flag validation
  if (anonymous !== undefined && typeof anonymous !== 'boolean') {
    return res.status(400).json({
      success: false,
      error: 'anonymous must be a boolean value',
      field: 'anonymous',
      provided: anonymous,
      expected_type: 'boolean',
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

// ===============================================
// ATTENDANCE VALIDATION
// ===============================================

/**
 * Validate attendance data
 */
export const validateAttendance = (req, res, next) => {
  const { session_id, status, notes } = req.body;
  
  // Session ID validation (optional but if provided must be valid)
  if (session_id !== undefined && (typeof session_id !== 'string' || session_id.trim().length === 0)) {
    return res.status(400).json({
      success: false,
      error: 'session_id must be a non-empty string',
      field: 'session_id',
      provided: session_id,
      timestamp: new Date().toISOString()
    });
  }
  
  // Status validation
  if (status) {
    const allowedStatuses = ['present', 'absent', 'late', 'excused', 'partial'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid attendance status',
        field: 'status',
        provided: status,
        allowed_statuses: allowedStatuses,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  // Notes validation
  if (notes !== undefined && (typeof notes !== 'string' || notes.length > 500)) {
    return res.status(400).json({
      success: false,
      error: 'Notes must be a string with maximum 500 characters',
      field: 'notes',
      provided_length: notes?.length,
      max_length: 500,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

// ===============================================
// BULK OPERATIONS VALIDATION
// ===============================================

/**
 * Validate bulk operations data
 */
export const validateBulkOperation = (req, res, next) => {
  const { class_ids, classes, updates } = req.body;
  const operation = req.path.includes('bulk-create') ? 'create' : 
                   req.path.includes('bulk-update') ? 'update' : 
                   req.path.includes('bulk-delete') ? 'delete' : 'unknown';
  
  switch (operation) {
    case 'create':
      if (!classes || !Array.isArray(classes) || classes.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'classes array is required and must not be empty',
          field: 'classes',
          timestamp: new Date().toISOString()
        });
      }
      
      if (classes.length > 20) {
        return res.status(400).json({
          success: false,
          error: 'Cannot create more than 20 classes at once',
          field: 'classes',
          provided_count: classes.length,
          max_count: 20,
          timestamp: new Date().toISOString()
        });
      }
      
      // Validate each class has required fields
      for (let i = 0; i < classes.length; i++) {
        const cls = classes[i];
        if (!cls.class_name) {
          return res.status(400).json({
            success: false,
            error: `Class at index ${i} is missing class_name`,
            field: `classes[${i}].class_name`,
            timestamp: new Date().toISOString()
          });
        }
      }
      break;
      
    case 'update':
      if (!class_ids || !Array.isArray(class_ids) || class_ids.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'class_ids array is required and must not be empty',
          field: 'class_ids',
          timestamp: new Date().toISOString()
        });
      }
      
      if (!updates || Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'updates object is required and must not be empty',
          field: 'updates',
          timestamp: new Date().toISOString()
        });
      }
      
      if (class_ids.length > 50) {
        return res.status(400).json({
          success: false,
          error: 'Cannot update more than 50 classes at once',
          field: 'class_ids',
          provided_count: class_ids.length,
          max_count: 50,
          timestamp: new Date().toISOString()
        });
      }
      break;
      
    case 'delete':
      if (!class_ids || !Array.isArray(class_ids) || class_ids.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'class_ids array is required and must not be empty',
          field: 'class_ids',
          timestamp: new Date().toISOString()
        });
      }
      
      if (class_ids.length > 20) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete more than 20 classes at once',
          field: 'class_ids',
          provided_count: class_ids.length,
          max_count: 20,
          timestamp: new Date().toISOString()
        });
      }
      break;
  }
  
  next();
};

// ===============================================
// DATE RANGE VALIDATION
// ===============================================

/**
 * Validate date range parameters
 */
export const validateDateRange = (req, res, next) => {
  const { date_from, date_to, period } = req.query;
  
  if (date_from) {
    const fromDate = new Date(date_from);
    if (isNaN(fromDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date_from format. Use YYYY-MM-DD',
        field: 'date_from',
        provided: date_from,
        expected_format: 'YYYY-MM-DD',
        timestamp: new Date().toISOString()
      });
    }
  }
  
  if (date_to) {
    const toDate = new Date(date_to);
    if (isNaN(toDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date_to format. Use YYYY-MM-DD',
        field: 'date_to',
        provided: date_to,
        expected_format: 'YYYY-MM-DD',
        timestamp: new Date().toISOString()
      });
    }
  }
  
  if (date_from && date_to) {
    const fromDate = new Date(date_from);
    const toDate = new Date(date_to);
    
    if (fromDate > toDate) {
      return res.status(400).json({
        success: false,
        error: 'date_from cannot be later than date_to',
        fields: ['date_from', 'date_to'],
        provided: { date_from, date_to },
        timestamp: new Date().toISOString()
      });
    }
  }
  
  if (period) {
    const validPeriods = ['7d', '30d', '90d', '180d', '365d', '1m', '3m', '6m', '12m'];
    if (!validPeriods.includes(period)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid period format',
        field: 'period',
        provided: period,
        allowed_periods: validPeriods,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  next();
};

// ===============================================
// REQUEST SIZE VALIDATION
// ===============================================

/**
 * Validate request body size and structure
 */
export const validateRequestSize = (req, res, next) => {
  const contentLength = req.get('content-length');
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (contentLength && parseInt(contentLength) > maxSize) {
    return res.status(413).json({
      success: false,
      error: 'Request body too large',
      max_size: '10MB',
      provided_size: `${Math.round(parseInt(contentLength) / 1024 / 1024)}MB`,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

// ===============================================
// COMBINED VALIDATION CHAINS
// ===============================================

/**
 * Common validation chain for class routes
 */
export const validateClassRoute = [validateClassId, validatePagination];

/**
 * Common validation chain for admin class routes
 */
export const validateAdminClassRoute = [validateClassId, validatePagination, validateSorting];

/**
 * Validation chain for class creation
 */
export const validateClassCreation = [validateClassData, validateRequestSize];

/**
 * Validation chain for class updates
 */
export const validateClassUpdate = [validateClassId, validateClassData, validateRequestSize];

/**
 * Validation chain for participant management
 */
export const validateParticipantManagement = [validateClassId, validateUserId, validateMembershipAction];

/**
 * Validation chain for content management
 */
export const validateContentManagement = [validateClassId, validateContentId, validateContentData];

// ===============================================
// DEVELOPMENT HELPERS
// ===============================================


  /**
   * Development validation test endpoint
   */
export const validateTestEndpoint = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🧪 Validation test endpoint accessed');
    console.log('Request params:', req.params);
    console.log('Request query:', req.query);
    console.log('Request body:', req.body);
  }
  next();
};