// ikootaapi/middleware/classValidation.js
// MERGED AND CLEANED CLASS VALIDATION MIDDLEWARE
// Combines both validation files into one comprehensive middleware

/**
 * Validate class ID format (OTU#XXXXXX)
 */
const isValidClassId = (classId) => {
  if (!classId || typeof classId !== 'string') return false;
  if (classId === 'OTU#Public') return true; // Special case
  return /^OTU#[A-Za-z0-9]+$/.test(classId) && classId.length >= 5;
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
};

/**
 * Sanitize string input
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
};

/**
 * Validate date format
 */
const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

// ===============================================
// ID VALIDATION MIDDLEWARE
// ===============================================

/**
 * Validate class ID parameter
 */
export const validateClassId = (req, res, next) => {
  const classId = req.params.id || req.params.classId || req.body.class_id || req.body.classId;
  
  if (!classId) {
    return res.status(400).json({
      success: false,
      error: 'Class ID is required',
      code: 'MISSING_CLASS_ID',
      timestamp: new Date().toISOString()
    });
  }
  
  if (!isValidClassId(classId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid class ID format. Expected format: OTU#XXXXXX',
      code: 'INVALID_CLASS_ID',
      provided: classId,
      expected_format: 'OTU#XXXXXX',
      timestamp: new Date().toISOString()
    });
  }
  
  // Normalize the class ID in params
  if (req.params.id) req.params.id = classId;
  if (req.params.classId) req.params.classId = classId;
  
  next();
};

/**
 * Validate user ID parameter
 */
export const validateUserId = (req, res, next) => {
  const userId = req.params.userId || req.params.instructorId || req.body.user_id || req.body.userId;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'User ID is required',
      code: 'MISSING_USER_ID',
      timestamp: new Date().toISOString()
    });
  }
  
  // Check if it's a valid number or string ID
  if (!userId || userId.toString().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid user ID format',
      code: 'INVALID_USER_ID',
      provided: userId,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

// ===============================================
// PAGINATION & SORTING MIDDLEWARE
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
      error: 'Invalid page number',
      code: 'INVALID_PAGE',
      provided: page,
      expected: 'Positive integer',
      timestamp: new Date().toISOString()
    });
  }
  
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return res.status(400).json({
      success: false,
      error: 'Invalid limit value. Must be between 1 and 100',
      code: 'INVALID_LIMIT',
      provided: limit,
      expected: '1-100',
      timestamp: new Date().toISOString()
    });
  }
  
  // Set sanitized values
  req.pagination = {
    page: pageNum,
    limit: limitNum,
    offset: (pageNum - 1) * limitNum
  };
  
  next();
};

/**
 * Validate sorting parameters
 */
export const validateSorting = (req, res, next) => {
  const { sort_by, sort_order = 'DESC' } = req.query;
  
  const allowedSortFields = [
    'createdAt', 'updatedAt', 'class_name', 'class_type',
    'max_members', 'total_members', 'joinedAt', 'username',
    'role_in_class', 'membership_status', 'difficulty_level'
  ];
  
  const allowedSortOrders = ['ASC', 'DESC'];
  
  if (sort_by && !allowedSortFields.includes(sort_by)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid sort field',
      code: 'INVALID_SORT_FIELD',
      provided: sort_by,
      allowed: allowedSortFields,
      timestamp: new Date().toISOString()
    });
  }
  
  const normalizedOrder = sort_order.toUpperCase();
  if (!allowedSortOrders.includes(normalizedOrder)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid sort order',
      code: 'INVALID_SORT_ORDER',
      provided: sort_order,
      allowed: allowedSortOrders,
      timestamp: new Date().toISOString()
    });
  }
  
  req.sorting = {
    sort_by: sort_by || 'createdAt',
    sort_order: normalizedOrder
  };
  
  next();
};

// ===============================================
// CLASS DATA VALIDATION
// ===============================================

/**
 * Validate class creation data
 */
export const validateClassCreation = (req, res, next) => {
  const { class_name, max_members, class_type } = req.body;
  
  // Required fields
  if (!class_name || class_name.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Class name is required',
      code: 'MISSING_CLASS_NAME',
      timestamp: new Date().toISOString()
    });
  }
  
  // Validate class name length
  if (class_name.length < 3 || class_name.length > 255) {
    return res.status(400).json({
      success: false,
      error: 'Class name must be between 3 and 255 characters',
      code: 'INVALID_CLASS_NAME_LENGTH',
      provided_length: class_name.length,
      timestamp: new Date().toISOString()
    });
  }
  
  // Validate max_members if provided
  if (max_members !== undefined) {
    const maxMembersNum = parseInt(max_members);
    if (isNaN(maxMembersNum) || maxMembersNum < 1 || maxMembersNum > 10000) {
      return res.status(400).json({
        success: false,
        error: 'Max members must be between 1 and 10000',
        code: 'INVALID_MAX_MEMBERS',
        provided: max_members,
        timestamp: new Date().toISOString()
      });
    }
    req.body.max_members = maxMembersNum;
  }
  
  // Validate class type if provided
  if (class_type) {
    const allowedTypes = ['demographic', 'subject', 'public', 'special'];
    if (!allowedTypes.includes(class_type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid class type',
        code: 'INVALID_CLASS_TYPE',
        provided: class_type,
        allowed: allowedTypes,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  // Sanitize string fields
  req.body.class_name = sanitizeString(req.body.class_name);
  if (req.body.public_name) req.body.public_name = sanitizeString(req.body.public_name);
  if (req.body.description) req.body.description = sanitizeString(req.body.description);
  
  next();
};

/**
 * Validate class update data
 */
export const validateClassUpdate = (req, res, next) => {
  const updates = req.body;
  
  // Check if any updates provided
  if (!updates || Object.keys(updates).length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No update data provided',
      code: 'NO_UPDATE_DATA',
      timestamp: new Date().toISOString()
    });
  }
  
  // Validate specific fields if they're being updated
  if (updates.class_name !== undefined) {
    if (!updates.class_name || updates.class_name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Class name cannot be empty',
        code: 'EMPTY_CLASS_NAME',
        timestamp: new Date().toISOString()
      });
    }
    
    if (updates.class_name.length < 3 || updates.class_name.length > 255) {
      return res.status(400).json({
        success: false,
        error: 'Class name must be between 3 and 255 characters',
        code: 'INVALID_CLASS_NAME_LENGTH',
        timestamp: new Date().toISOString()
      });
    }
    
    req.body.class_name = sanitizeString(updates.class_name);
  }
  
  if (updates.max_members !== undefined) {
    const maxMembersNum = parseInt(updates.max_members);
    if (isNaN(maxMembersNum) || maxMembersNum < 1 || maxMembersNum > 10000) {
      return res.status(400).json({
        success: false,
        error: 'Max members must be between 1 and 10000',
        code: 'INVALID_MAX_MEMBERS',
        provided: updates.max_members,
        timestamp: new Date().toISOString()
      });
    }
    req.body.max_members = maxMembersNum;
  }
  
  // Sanitize string fields
  if (updates.public_name) req.body.public_name = sanitizeString(updates.public_name);
  if (updates.description) req.body.description = sanitizeString(updates.description);
  
  next();
};

/**
 * Validate membership action
 */
export const validateMembershipAction = (req, res, next) => {
  const { action } = req.body;
  
  const allowedActions = [
    'approve', 'reject', 'remove', 'change_role',
    'promote', 'demote', 'suspend', 'reactivate'
  ];
  
  if (!action) {
    return res.status(400).json({
      success: false,
      error: 'Action is required',
      code: 'MISSING_ACTION',
      timestamp: new Date().toISOString()
    });
  }
  
  if (!allowedActions.includes(action)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid action',
      code: 'INVALID_ACTION',
      provided: action,
      allowed: allowedActions,
      timestamp: new Date().toISOString()
    });
  }
  
  // Validate additional parameters based on action
  if (action === 'change_role' && !req.body.new_role) {
    return res.status(400).json({
      success: false,
      error: 'new_role is required for change_role action',
      code: 'MISSING_NEW_ROLE',
      timestamp: new Date().toISOString()
    });
  }
  
  if (req.body.new_role) {
    const allowedRoles = ['member', 'assistant', 'moderator'];
    if (!allowedRoles.includes(req.body.new_role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role',
        code: 'INVALID_ROLE',
        provided: req.body.new_role,
        allowed: allowedRoles,
        timestamp: new Date().toISOString()
      });
    }
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
  const { date_from, date_to, start_date, end_date } = req.query;
  
  const fromDate = date_from || start_date;
  const toDate = date_to || end_date;
  
  if (fromDate && !isValidDate(fromDate)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid start date format',
      code: 'INVALID_START_DATE',
      provided: fromDate,
      expected_format: 'YYYY-MM-DD or ISO 8601',
      timestamp: new Date().toISOString()
    });
  }
  
  if (toDate && !isValidDate(toDate)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid end date format',
      code: 'INVALID_END_DATE',
      provided: toDate,
      expected_format: 'YYYY-MM-DD or ISO 8601',
      timestamp: new Date().toISOString()
    });
  }
  
  if (fromDate && toDate) {
    const start = new Date(fromDate);
    const end = new Date(toDate);
    
    if (start > end) {
      return res.status(400).json({
        success: false,
        error: 'Start date cannot be after end date',
        code: 'INVALID_DATE_RANGE',
        start_date: fromDate,
        end_date: toDate,
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
 * Validate request size to prevent large payloads
 */
export const validateRequestSize = (req, res, next) => {
  const contentLength = req.headers['content-length'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (contentLength && parseInt(contentLength) > maxSize) {
    return res.status(413).json({
      success: false,
      error: 'Request payload too large',
      code: 'PAYLOAD_TOO_LARGE',
      max_size: '10MB',
      provided_size: contentLength,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

// ===============================================
// BULK OPERATIONS VALIDATION
// ===============================================

/**
 * Validate bulk operation data
 */
export const validateBulkOperation = (req, res, next) => {
  const { classes, class_ids } = req.body;
  
  // For bulk create
  if (classes) {
    if (!Array.isArray(classes)) {
      return res.status(400).json({
        success: false,
        error: 'classes must be an array',
        code: 'INVALID_CLASSES_FORMAT',
        timestamp: new Date().toISOString()
      });
    }
    
    if (classes.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'classes array cannot be empty',
        code: 'EMPTY_CLASSES_ARRAY',
        timestamp: new Date().toISOString()
      });
    }
    
    if (classes.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Cannot process more than 50 classes at once',
        code: 'TOO_MANY_CLASSES',
        provided: classes.length,
        max_allowed: 50,
        timestamp: new Date().toISOString()
      });
    }
    
    // Validate each class has required fields
    for (let i = 0; i < classes.length; i++) {
      const cls = classes[i];
      if (!cls.class_name || cls.class_name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: `Class at index ${i} is missing class_name`,
          code: 'MISSING_CLASS_NAME',
          index: i,
          timestamp: new Date().toISOString()
        });
      }
      
      // Sanitize class data
      classes[i].class_name = sanitizeString(cls.class_name);
      if (cls.description) classes[i].description = sanitizeString(cls.description);
    }
  }
  
  // For bulk update/delete
  if (class_ids) {
    if (!Array.isArray(class_ids)) {
      return res.status(400).json({
        success: false,
        error: 'class_ids must be an array',
        code: 'INVALID_CLASS_IDS_FORMAT',
        timestamp: new Date().toISOString()
      });
    }
    
    if (class_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'class_ids array cannot be empty',
        code: 'EMPTY_CLASS_IDS_ARRAY',
        timestamp: new Date().toISOString()
      });
    }
    
    if (class_ids.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Cannot process more than 50 classes at once',
        code: 'TOO_MANY_CLASS_IDS',
        provided: class_ids.length,
        max_allowed: 50,
        timestamp: new Date().toISOString()
      });
    }
    
    // Validate each class ID format
    for (const classId of class_ids) {
      if (!isValidClassId(classId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid class ID format in array',
          code: 'INVALID_CLASS_ID_IN_ARRAY',
          invalid_id: classId,
          expected_format: 'OTU#XXXXXX',
          timestamp: new Date().toISOString()
        });
      }
    }
  }
  
  next();
};

// ===============================================
// EXPORT ALL VALIDATORS
// ===============================================

export default {
  // ID Validators
  validateClassId,
  validateUserId,
  
  // Pagination & Sorting
  validatePagination,
  validateSorting,
  
  // Class Data
  validateClassCreation,
  validateClassUpdate,
  
  // Membership
  validateMembershipAction,
  
  // Bulk Operations
  validateBulkOperation,
  
  // Date Range
  validateDateRange,
  
  // Request Size
  validateRequestSize,
  
  // Helpers
  isValidClassId,
  isValidEmail,
  sanitizeString,
  isValidDate
};