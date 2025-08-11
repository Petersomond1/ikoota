// ikootaapi/controllers/classControllers.js
// CLASS MANAGEMENT CONTROLLERS - COMPLETE USER-FACING IMPLEMENTATION
// All user-facing class operations with comprehensive error handling

import {
  getAllClassesService,
  getAvailableClassesService,
  getUserClassesService,
  getClassByIdService,
  joinClassService,
  leaveClassService,
  assignUserToClassService,
  getClassContentService,
  getClassParticipantsService,
  getClassScheduleService,
  markClassAttendanceService,
  getClassProgressService,
  submitClassFeedbackService,
  getClassFeedbackService
} from '../services/classServices.js';

import CustomError from '../utils/CustomError.js';

// ===============================================
// ERROR HANDLING WRAPPER
// ===============================================

const asyncHandler = (fn) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      console.error(`❌ Controller error in ${fn.name}:`, error);
      
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
          code: error.code || 'CUSTOM_ERROR',
          timestamp: new Date().toISOString(),
          ...(process.env.NODE_ENV === 'development' && { 
            stack: error.stack,
            details: error.details 
          })
        });
      }
      
      // Database constraint errors
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          success: false,
          error: 'Duplicate entry detected',
          code: 'DUPLICATE_ENTRY',
          timestamp: new Date().toISOString()
        });
      }
      
      if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({
          success: false,
          error: 'Referenced record not found',
          code: 'INVALID_REFERENCE',
          timestamp: new Date().toISOString()
        });
      }

      if (error.code === 'ER_BAD_FIELD_ERROR') {
        return res.status(500).json({
          success: false,
          error: 'Database schema mismatch',
          code: 'SCHEMA_ERROR',
          timestamp: new Date().toISOString()
        });
      }
      
      // Generic server error
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        request_id: req.id || 'unknown',
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && { 
          details: error.message,
          stack: error.stack 
        })
      });
    }
  };
};

// ===============================================
// CLASS DISCOVERY & ACCESS
// ===============================================

/**
 * GET /classes - Get all available classes with comprehensive filtering
 * Query params: page, limit, class_type, is_public, search, difficulty_level, has_space, created_after, created_before
 */
export const getAllClasses = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    class_type,
    is_public,
    search,
    difficulty_level,
    has_space,
    created_after,
    created_before,
    sort_by = 'createdAt',
    sort_order = 'DESC'
  } = req.query;

  // Use pagination from middleware if available
  const paginationParams = req.pagination || { page: parseInt(page), limit: parseInt(limit) };
  const sortingParams = req.sorting || { sort_by, sort_order };

  const filters = {
    class_type,
    is_public: is_public === 'true' ? true : is_public === 'false' ? false : undefined,
    search,
    difficulty_level,
    has_space: has_space === 'true' ? true : has_space === 'false' ? false : null,
    created_after,
    created_before
  };

  const options = {
    ...paginationParams,
    ...sortingParams
  };

  const result = await getAllClassesService(filters, options);

  res.json({
    success: true,
    message: 'Classes retrieved successfully',
    ...result,
    filters_applied: Object.keys(filters).filter(key => filters[key] !== undefined).length,
    performance: {
      query_time: new Date().toISOString(),
      total_results: result.pagination.total_records
    }
  });
});

/**
 * GET /classes/available - Get classes available to user for joining
 * Requires authentication. Filters out classes user is already a member of.
 */
export const getAvailableClasses = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    page = 1,
    limit = 20,
    class_type,
    search,
    difficulty_level,
    exclude_full = 'true'
  } = req.query;

  const paginationParams = req.pagination || { page: parseInt(page), limit: parseInt(limit) };

  const options = {
    ...paginationParams,
    class_type,
    search,
    difficulty_level,
    membershipStage: req.user.membership_stage,
    fullMembershipStatus: req.user.full_membership_status,
    exclude_full: exclude_full === 'true'
  };

  const result = await getAvailableClassesService(userId, options);

  res.json({
    success: true,
    message: 'Available classes retrieved successfully',
    ...result,
    user_context: {
      user_id: userId,
      membership_stage: req.user.membership_stage,
      full_membership_status: req.user.full_membership_status
    }
  });
});

/**
 * GET /classes/my-classes - Get user's enrolled classes
 * Shows classes where user is a member with various roles and statuses
 */
export const getUserClasses = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    page = 1,
    limit = 20,
    role_in_class,
    membership_status = 'active',
    include_expired = 'false',
    sort_by = 'joinedAt',
    sort_order = 'DESC'
  } = req.query;

  const paginationParams = req.pagination || { page: parseInt(page), limit: parseInt(limit) };

  const options = {
    ...paginationParams,
    role_in_class,
    membership_status,
    include_expired: include_expired === 'true',
    sort_by,
    sort_order
  };

  const result = await getUserClassesService(userId, options);

  res.json({
    success: true,
    message: 'User classes retrieved successfully',
    ...result,
    user_id: userId,
    username: req.user.username
  });
});

/**
 * GET /classes/:id - Get specific class details
 * Shows different levels of detail based on user's membership status
 */
export const getClassById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const classData = await getClassByIdService(id, userId);

  // Determine response level based on access
  let responseLevel = 'basic';
  if (classData.user_context?.is_member) {
    responseLevel = 'member';
  }
  if (classData.user_context?.role === 'moderator' || classData.user_context?.role === 'instructor') {
    responseLevel = 'admin';
  }

  res.json({
    success: true,
    message: 'Class retrieved successfully',
    data: classData,
    access_level: responseLevel,
    user_permissions: classData.user_context
  });
});

// ===============================================
// CLASS ENROLLMENT
// ===============================================

/**
 * POST /classes/:id/join - Join a class
 * Body: { join_reason?, role_in_class?, receive_notifications? }
 */
export const joinClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const {
    join_reason,
    role_in_class = 'member',
    receive_notifications = true
  } = req.body;

  // Validate role if provided
  if (role_in_class && !['member', 'assistant'].includes(role_in_class)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid role. Users can only join as member or assistant',
      allowed_roles: ['member', 'assistant'],
      provided: role_in_class
    });
  }

  const options = {
    role_in_class,
    receive_notifications: Boolean(receive_notifications),
    join_reason
  };

  const result = await joinClassService(userId, id, options);

  const statusCode = result.membership_status === 'active' ? 201 : 202;

  res.status(statusCode).json({
    success: true,
    ...result,
    user_id: userId,
    username: req.user.username
  });
});

/**
 * POST /classes/:id/leave - Leave a class
 * Body: { reason? }
 */
export const leaveClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { reason } = req.body;

  const options = {
    reason,
    notify_moderators: true
  };

  const result = await leaveClassService(userId, id, options);

  res.json({
    success: true,
    ...result,
    user_id: userId,
    username: req.user.username
  });
});

/**
 * POST /classes/assign - Assign user to class (legacy compatibility & admin use)
 * Body: { userId, classId, role_in_class?, assigned_by? }
 */
export const assignUserToClass = asyncHandler(async (req, res) => {
  const {
    userId,
    user_id,
    classId,
    class_id,
    role_in_class = 'member',
    assignment_reason
  } = req.body;

  const targetUserId = userId || user_id;
  const targetClassId = classId || class_id;
  const assignedBy = req.user.id;

  if (!targetUserId || !targetClassId) {
    return res.status(400).json({
      success: false,
      error: 'userId and classId are required',
      required_fields: ['userId', 'classId'],
      provided: { userId: targetUserId, classId: targetClassId }
    });
  }

  // Check if user has permission to assign (must be admin or class moderator)
  const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
  let isModerator = false;

  if (!isAdmin) {
    // Check if user is moderator of the target class
    const membershipCheckSql = `
      SELECT role_in_class FROM user_class_memberships 
      WHERE user_id = ? AND class_id = ? AND membership_status = 'active' AND role_in_class IN ('moderator', 'instructor')
    `;
    try {
      const db = (await import('../config/db.js')).default;
      const [membership] = await db.query(membershipCheckSql, [assignedBy, targetClassId]);
      isModerator = Boolean(membership);
    } catch (error) {
      console.warn('Could not verify moderator status:', error.message);
    }
  }

  if (!isAdmin && !isModerator) {
    return res.status(403).json({
      success: false,
      error: 'You do not have permission to assign users to classes',
      required_permissions: ['admin', 'class_moderator']
    });
  }

  const options = {
    role_in_class,
    assigned_by: assignedBy,
    receive_notifications: true,
    assignment_reason
  };

  const result = await assignUserToClassService(targetUserId, targetClassId, options);

  res.status(201).json({
    success: true,
    message: 'User assigned to class successfully',
    ...result,
    assigned_by: assignedBy,
    assignment_type: isAdmin ? 'admin_assignment' : 'moderator_assignment'
  });
});

// ===============================================
// CLASS CONTENT ACCESS
// ===============================================

/**
 * GET /classes/:id/content - Get class content with user permissions
 * Query: content_type?, access_level?, page?, limit?, sort_by?, sort_order?
 */
export const getClassContent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const {
    content_type,
    access_level,
    page = 1,
    limit = 20,
    sort_by = 'createdAt',
    sort_order = 'DESC'
  } = req.query;

  const paginationParams = req.pagination || { page: parseInt(page), limit: parseInt(limit) };

  const options = {
    content_type,
    access_level,
    ...paginationParams,
    sort_by,
    sort_order
  };

  const result = await getClassContentService(id, userId, options);

  res.json({
    success: true,
    message: 'Class content retrieved successfully',
    ...result,
    class_id: id,
    user_id: userId
  });
});

/**
 * GET /classes/:id/participants - Get class participants (privacy-filtered)
 * Query: role_in_class?, membership_status?, page?, limit?, search?
 */
export const getClassParticipants = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const {
    role_in_class,
    membership_status = 'active',
    page = 1,
    limit = 50,
    search,
    sort_by = 'joinedAt',
    sort_order = 'DESC'
  } = req.query;

  const paginationParams = req.pagination || { page: parseInt(page), limit: parseInt(limit) };

  const options = {
    role_in_class,
    membership_status,
    search,
    ...paginationParams,
    sort_by,
    sort_order
  };

  const result = await getClassParticipantsService(id, userId, options);

  res.json({
    success: true,
    message: 'Class participants retrieved successfully',
    ...result,
    class_id: id,
    privacy_note: 'Participant information filtered based on your role and privacy settings'
  });
});

/**
 * GET /classes/:id/schedule - Get class schedule
 * Query: start_date?, end_date?, timezone?, include_past?
 */
export const getClassSchedule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const {
    start_date,
    end_date,
    timezone = 'UTC',
    include_past = 'false'
  } = req.query;

  const options = {
    start_date,
    end_date,
    timezone,
    include_past: include_past === 'true'
  };

  const result = await getClassScheduleService(id, userId, options);

  res.json({
    success: true,
    message: 'Class schedule retrieved successfully',
    ...result,
    user_id: userId
  });
});

// ===============================================
// CLASS INTERACTION
// ===============================================

/**
 * POST /classes/:id/attendance - Mark attendance for a class session
 * Body: { session_id?, status?, notes?, location? }
 */
export const markClassAttendance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const {
    session_id,
    status = 'present',
    notes,
    location
  } = req.body;

  // Validate status
  const validStatuses = ['present', 'absent', 'late', 'excused', 'partial'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid attendance status',
      provided: status,
      allowed_statuses: validStatuses
    });
  }

  const options = {
    session_id,
    status,
    notes,
    location,
    check_in_time: new Date()
  };

  const result = await markClassAttendanceService(userId, id, options);

  res.status(201).json({
    success: true,
    message: 'Attendance marked successfully',
    ...result,
    user_id: userId,
    username: req.user.username
  });
});

/**
 * GET /classes/:id/progress - Get user's progress in class
 * Shows completion rates, attendance, achievements, etc.
 */
export const getClassProgress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const result = await getClassProgressService(userId, id);

  res.json({
    success: true,
    message: 'Class progress retrieved successfully',
    ...result,
    user_id: userId,
    username: req.user.username,
    generated_at: new Date().toISOString()
  });
});

// ===============================================
// CLASS FEEDBACK
// ===============================================

/**
 * POST /classes/:id/feedback - Submit feedback about a class
 * Body: { rating?, comments?, feedback_type?, anonymous?, aspects?, suggestions? }
 */
export const submitClassFeedback = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const feedbackData = req.body;

  // Validate that at least rating or comments is provided
  if (!feedbackData.rating && !feedbackData.comments) {
    return res.status(400).json({
      success: false,
      error: 'Either rating or comments is required',
      required_fields: ['rating (1-5)', 'comments']
    });
  }

  // Validate rating if provided
  if (feedbackData.rating) {
    const rating = parseFloat(feedbackData.rating);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5',
        provided: feedbackData.rating,
        valid_range: '1-5'
      });
    }
    feedbackData.rating = rating;
  }

  const result = await submitClassFeedbackService(userId, id, feedbackData);

  res.status(201).json({
    success: true,
    message: 'Feedback submitted successfully',
    ...result,
    user_id: feedbackData.anonymous ? null : userId,
    username: feedbackData.anonymous ? null : req.user.username
  });
});

/**
 * GET /classes/:id/feedback - Get class feedback (for instructors/moderators)
 * Query: feedback_type?, include_anonymous?, page?, limit?, rating_filter?, date_from?, date_to?
 */
export const getClassFeedback = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const {
    feedback_type,
    include_anonymous = 'true',
    page = 1,
    limit = 20,
    rating_filter,
    date_from,
    date_to
  } = req.query;

  const paginationParams = req.pagination || { page: parseInt(page), limit: parseInt(limit) };

  const options = {
    feedback_type,
    include_anonymous: include_anonymous === 'true',
    ...paginationParams,
    rating_filter: rating_filter ? parseInt(rating_filter) : undefined,
    date_from,
    date_to
  };

  const result = await getClassFeedbackService(id, userId, options);

  res.json({
    success: true,
    message: 'Class feedback retrieved successfully',
    ...result,
    viewer_id: userId,
    viewer_role: result.user_permissions?.role
  });
});

// ===============================================
// UTILITY ENDPOINTS
// ===============================================

/**
 * GET /classes/search - Advanced class search with multiple criteria
 * Query: q (search term), filters (JSON), sort?, page?, limit?
 */
export const searchClasses = asyncHandler(async (req, res) => {
  const {
    q: search,
    filters: filtersParam,
    sort = 'relevance',
    page = 1,
    limit = 20
  } = req.query;

  let filters = {};
  if (filtersParam) {
    try {
      filters = JSON.parse(filtersParam);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filters JSON format',
        provided: filtersParam
      });
    }
  }

  // Enhanced search with relevance scoring
  const searchOptions = {
    search,
    ...filters,
    page: parseInt(page),
    limit: parseInt(limit),
    sort_by: sort === 'relevance' ? 'relevance_score' : sort
  };

  const result = await getAllClassesService(searchOptions);

  res.json({
    success: true,
    message: 'Class search completed',
    ...result,
    search_query: search,
    search_filters: filters,
    search_type: 'advanced'
  });
});

/**
 * GET /classes/:id/quick-info - Get essential class info for quick display
 * Lightweight endpoint for cards, previews, etc.
 */
export const getClassQuickInfo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const classData = await getClassByIdService(id, userId);

  // Return only essential information
  const quickInfo = {
    class_id: classData.class_id,
    display_id: classData.display_id,
    class_name: classData.class_name,
    public_name: classData.public_name,
    description: classData.description?.substring(0, 200) + (classData.description?.length > 200 ? '...' : ''),
    class_type: classData.class_type,
    difficulty_level: classData.difficulty_level,
    total_members: classData.total_members,
    max_members: classData.max_members,
    is_public: classData.is_public,
    is_full: classData.is_full,
    tags: classData.tags?.slice(0, 5), // Limit tags for quick display
    user_is_member: classData.user_context?.is_member || false,
    user_can_join: classData.user_context?.can_join || false
  };

  res.json({
    success: true,
    message: 'Quick class info retrieved',
    data: quickInfo,
    response_type: 'quick_info'
  });
});

// ===============================================
// TESTING & DEBUG ENDPOINTS
// ===============================================

/**
 * GET /classes/test - Test endpoint for class routes
 */
export const testClassRoutes = asyncHandler(async (req, res) => {
  const testResults = {
    route_status: 'operational',
    timestamp: new Date().toISOString(),
    user_context: req.user ? {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
      membership_stage: req.user.membership_stage
    } : null,
    available_operations: [
      'view classes',
      'join/leave classes',
      'access content',
      'track progress',
      'submit feedback'
    ],
    endpoint_info: {
      path: '/api/classes/test',
      method: 'GET',
      authenticated: Boolean(req.user)
    }
  };

  // Test database connectivity
  try {
    const db = (await import('../config/db.js')).default;
    const [result] = await db.query('SELECT COUNT(*) as class_count FROM classes WHERE class_id LIKE "OTU#%"');
    testResults.database_status = 'connected';
    testResults.total_classes = result.class_count;
  } catch (error) {
    testResults.database_status = 'error';
    testResults.database_error = error.message;
  }

  res.json({
    success: true,
    message: 'Class routes test completed',
    data: testResults
  });
});

// ===============================================
// LEGACY SUPPORT FUNCTIONS
// ===============================================

/**
 * Legacy function for backward compatibility
 * @deprecated Use getAllClasses instead
 */
export const getClasses = asyncHandler(async (req, res) => {
  console.log('⚠️ Legacy function getClasses called, redirecting to getAllClasses');
  
  // Add deprecation warning to response
  req.deprecation_warning = {
    message: 'This endpoint is deprecated. Use GET /classes instead.',
    deprecated_endpoint: '/classes (legacy)',
    recommended_endpoint: '/classes',
    deprecation_date: '2024-01-01',
    removal_date: '2024-06-01'
  };

  return getAllClasses(req, res);
});

/**
 * Legacy POST class creation - redirect to admin routes
 * @deprecated Use admin routes for class creation
 */
export const postClass = asyncHandler(async (req, res) => {
  console.log('⚠️ Legacy function postClass called - should use admin routes');
  
  res.status(400).json({
    success: false,
    error: 'Class creation should be handled through admin routes',
    deprecated_endpoint: 'POST /classes',
    recommended_endpoint: 'POST /admin/classes',
    redirect_url: '/api/admin/classes',
    deprecation_info: {
      reason: 'Class creation requires administrative privileges',
      migration_guide: 'Use admin authentication and POST to /api/admin/classes'
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Legacy PUT class update - redirect to admin routes
 * @deprecated Use admin routes for class updates
 */
export const putClass = asyncHandler(async (req, res) => {
  console.log('⚠️ Legacy function putClass called - should use admin routes');
  
  const classId = req.params.id;
  
  res.status(400).json({
    success: false,
    error: 'Class updates should be handled through admin routes',
    deprecated_endpoint: `PUT /classes/${classId}`,
    recommended_endpoint: `PUT /admin/classes/${classId}`,
    redirect_url: `/api/admin/classes/${classId}`,
    deprecation_info: {
      reason: 'Class modification requires administrative privileges',
      migration_guide: 'Use admin authentication and PUT to /api/admin/classes/:id'
    },
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// EXPORT ALL FUNCTIONS
// ===============================================

// export {
//   // Main functions
//   getAllClasses,
//   getAvailableClasses,
//   getUserClasses,
//   getClassById,
//   joinClass,
//   leaveClass,
//   assignUserToClass,
//   getClassContent,
//   getClassParticipants,
//   getClassSchedule,
//   markClassAttendance,
//   getClassProgress,
//   submitClassFeedback,
//   getClassFeedback,
  
//   // Utility functions
//   // searchClasses,
//   // getClassQuickInfo,
//   // testClassRoutes,
  
//   // Legacy functions (deprecated)
//   // getClasses,
//   // postClass,
//   // putClass
// };

// ===============================================
// MODULE METADATA
// ===============================================

export const moduleInfo = {
  name: 'Class Controllers',
  version: '2.0.0',
  description: 'Complete user-facing class management controllers with OTU# format support',
  supported_formats: ['OTU#XXXXXX'],
  deprecated_functions: ['getClasses', 'postClass', 'putClass'],
  last_updated: new Date().toISOString()
};