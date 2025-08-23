// ikootaapi/controllers/classControllers.js
// COMPLETE REBUILD USING EXACT MEMBERSHIP CONTROLLER PATTERNS
// Simple try-catch, direct service calls, consistent response format

import * as classService from '../services/classServices.js';

// =============================================================================
// UTILITY FUNCTIONS (FOLLOWING MEMBERSHIP PATTERN)
// =============================================================================

/**
 * Standardized success response
 */
const successResponse = (res, data = {}, message = 'Operation successful', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Standardized error response
 */
const errorResponse = (res, error, statusCode = 500) => {
  console.error('Controller error:', error);
  return res.status(statusCode).json({
    success: false,
    error: error.message || 'An error occurred',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { 
      details: error.stack 
    })
  });
};

// =============================================================================
// CORE CLASS OPERATIONS (FOLLOWING MEMBERSHIP CONTROLLER PATTERNS)
// =============================================================================

/**
 * GET /api/classes - Get all classes
 */
export const getAllClasses = async (req, res) => {
  try {
    const userId = req.user?.id;
    const filters = {
      class_type: req.query.class_type,
      is_public: req.query.is_public === 'true' ? true : req.query.is_public === 'false' ? false : undefined,
      search: req.query.search
    };

    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      sort_by: req.query.sort_by || 'createdAt',
      sort_order: req.query.sort_order || 'DESC'
    };

    const result = await classService.getAllClasses(filters, options);
    
    return successResponse(res, result, 'Classes retrieved successfully');

  } catch (error) {
    console.error('❌ getAllClasses error:', error);
    return errorResponse(res, error);
  }
};

/**
 * GET /api/classes/:id - Get specific class
 */
export const getClassById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const result = await classService.getClassById(id, userId);
    
    return successResponse(res, { data: result }, 'Class retrieved successfully');

  } catch (error) {
    console.error('❌ getClassById error:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    return errorResponse(res, error, statusCode);
  }
};

/**
 * GET /api/classes/my-classes - Get user's classes
 */
export const getUserClasses = async (req, res) => {
  try {
    const userId = req.user.id;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      membership_status: req.query.membership_status || 'active',
      sort_by: req.query.sort_by || 'joinedAt',
      sort_order: req.query.sort_order || 'DESC'
    };

    const result = await classService.getUserClasses(userId, options);
    
    return successResponse(res, {
      ...result,
      user_id: userId,
      username: req.user.username
    }, 'User classes retrieved successfully');

  } catch (error) {
    console.error('❌ getUserClasses error:', error);
    return errorResponse(res, error);
  }
};

/**
 * POST /api/classes/:id/join - Join a class
 */
export const joinClass = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const options = {
      role_in_class: req.body.role_in_class || 'member',
      receive_notifications: req.body.receive_notifications !== false
    };

    const result = await classService.joinClass(userId, id, options);
    
    return successResponse(res, {
      ...result,
      user_id: userId,
      username: req.user.username
    }, result.message, 201);

  } catch (error) {
    console.error('❌ joinClass error:', error);
    const statusCode = error.message.includes('not found') ? 404 :
                      error.message.includes('full') ? 409 :
                      error.message.includes('already') ? 409 : 500;
    return errorResponse(res, error, statusCode);
  }
};

/**
 * POST /api/classes/:id/leave - Leave a class
 */
export const leaveClass = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await classService.leaveClass(userId, id);
    
    return successResponse(res, {
      ...result,
      user_id: userId,
      username: req.user.username
    }, result.message);

  } catch (error) {
    console.error('❌ leaveClass error:', error);
    const statusCode = error.message.includes('not found') ? 404 :
                      error.message.includes('Not a member') ? 403 : 500;
    return errorResponse(res, error, statusCode);
  }
};

/**
 * GET /api/classes/:id/members - Get class members
 */
export const getClassMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
      membership_status: req.query.membership_status || 'active',
      sort_by: req.query.sort_by || 'joinedAt',
      sort_order: req.query.sort_order || 'DESC'
    };

    const result = await classService.getClassMembers(id, userId, options);
    
    return successResponse(res, {
      ...result,
      class_id: id
    }, 'Class members retrieved successfully');

  } catch (error) {
    console.error('❌ getClassMembers error:', error);
    return errorResponse(res, error);
  }
};

/**
 * GET /api/classes/recommendations - Get class recommendations
 */
export const getClassRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const options = {
      limit: parseInt(req.query.limit) || 6
    };

    const result = await classService.getAvailableClasses(userId, options);
    
    return successResponse(res, {
      data: result.data,
      user_id: userId
    }, 'Class recommendations retrieved successfully');

  } catch (error) {
    console.error('❌ getClassRecommendations error:', error);
    return errorResponse(res, error);
  }
};

// =============================================================================
// USER PROGRESS AND ACTIVITY
// =============================================================================

/**
 * GET /api/classes/my-progress - Get user's progress across all classes
 */
export const getUserProgress = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await classService.getUserClasses(userId, { limit: 100 });

    const progressData = {
      total_classes: result.data.length,
      active_classes: result.data.filter(c => c.membership_status === 'active').length,
      moderator_classes: result.data.filter(c => c.role_in_class === 'moderator').length,
      member_since: result.data.length > 0 ? 
        Math.min(...result.data.map(c => new Date(c.joinedAt))) : null
    };

    return successResponse(res, {
      data: { progress: progressData },
      user_id: userId
    }, 'User progress retrieved successfully');

  } catch (error) {
    console.error('❌ getUserProgress error:', error);
    return errorResponse(res, error);
  }
};

/**
 * GET /api/classes/my-activity - Get user's recent class activity
 */
export const getUserActivity = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await classService.getUserClasses(userId, { limit: 5 });

    const activityData = {
      recent_joins: result.data.map(cls => ({
        class_name: cls.class_name,
        joinedAt: cls.joinedAt,
        type: 'join'
      })),
      total_activities: result.data.length
    };

    return successResponse(res, {
      data: { activity: activityData },
      user_id: userId
    }, 'User activity retrieved successfully');

  } catch (error) {
    console.error('❌ getUserActivity error:', error);
    return errorResponse(res, error);
  }
};

// =============================================================================
// CLASS CONTENT AND INTERACTION
// =============================================================================

/**
 * GET /api/classes/:id/content - Get class content
 */
export const getClassContent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      content_type: req.query.content_type,
      sort_by: req.query.sort_by || 'createdAt',
      sort_order: req.query.sort_order || 'DESC'
    };

    const result = await classService.getClassContent(id, userId, options);
    
    return successResponse(res, result, 'Class content retrieved successfully');

  } catch (error) {
    console.error('❌ getClassContent error:', error);
    const statusCode = error.message.includes('Access denied') ? 403 : 500;
    return errorResponse(res, error, statusCode);
  }
};

/**
 * GET /api/classes/:id/announcements - Get class announcements
 */
export const getClassAnnouncements = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      announcement_type: req.query.announcement_type || 'all',
      is_active: req.query.is_active !== 'false',
      sort_by: req.query.sort_by || 'createdAt',
      sort_order: req.query.sort_order || 'DESC'
    };

    const result = await classService.getClassAnnouncements(id, userId, options);
    
    return successResponse(res, result, 'Class announcements retrieved successfully');

  } catch (error) {
    console.error('❌ getClassAnnouncements error:', error);
    const statusCode = error.message.includes('Access denied') ? 403 : 500;
    return errorResponse(res, error, statusCode);
  }
};

/**
 * POST /api/classes/:id/feedback - Submit class feedback
 */
export const submitClassFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const feedbackData = {
      rating: req.body.rating,
      feedback_text: req.body.feedback_text,
      feedback_type: req.body.feedback_type || 'general',
      session_id: req.body.session_id,
      is_anonymous: req.body.is_anonymous || false
    };

    const result = await classService.submitClassFeedback(userId, id, feedbackData);
    
    return successResponse(res, { data: result }, result.message, 201);

  } catch (error) {
    console.error('❌ submitClassFeedback error:', error);
    const statusCode = error.message.includes('Access denied') ? 403 : 500;
    return errorResponse(res, error, statusCode);
  }
};

/**
 * POST /api/classes/:id/attendance - Mark attendance
 */
export const markAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const options = {
      session_id: req.body.session_id,
      status: req.body.status || 'present',
      notes: req.body.notes,
      check_in_time: req.body.check_in_time || new Date(),
      location: req.body.location
    };

    const result = await classService.markClassAttendance(userId, id, options);
    
    return successResponse(res, { data: result }, result.message, 201);

  } catch (error) {
    console.error('❌ markAttendance error:', error);
    const statusCode = error.message.includes('Access denied') ? 403 : 500;
    return errorResponse(res, error, statusCode);
  }
};

/**
 * GET /api/classes/:id/schedule - Get class schedule
 */
export const getClassSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const options = {
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      session_type: req.query.session_type
    };

    const result = await classService.getClassSchedule(id, userId, options);
    
    return successResponse(res, { data: result }, 'Class schedule retrieved successfully');

  } catch (error) {
    console.error('❌ getClassSchedule error:', error);
    const statusCode = error.message.includes('Access denied') ? 403 : 500;
    return errorResponse(res, error, statusCode);
  }
};

/**
 * GET /api/classes/:id/progress - Get user's progress in specific class
 */
export const getClassProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await classService.getClassProgress(userId, id);
    
    return successResponse(res, { data: result }, 'Class progress retrieved successfully');

  } catch (error) {
    console.error('❌ getClassProgress error:', error);
    const statusCode = error.message.includes('Access denied') ? 403 : 500;
    return errorResponse(res, error, statusCode);
  }
};

/**
 * GET /api/classes/test - Test endpoint
 */
export const testClassRoutes = async (req, res) => {
  try {
    return successResponse(res, {
      data: {
        route_status: 'operational',
        user_context: req.user ? {
          id: req.user.id,
          username: req.user.username,
          role: req.user.role
        } : 'no_authentication',
        available_operations: [
          'view classes',
          'join/leave classes', 
          'view members',
          'search classes',
          'track progress',
          'submit feedback',
          'mark attendance'
        ],
        service_layer: 'connected',
        database_layer: 'active'
      }
    }, 'Class routes test completed successfully');

  } catch (error) {
    console.error('❌ testClassRoutes error:', error);
    return errorResponse(res, error);
  }
};

// =============================================================================
// EXPORT ALL CONTROLLER FUNCTIONS
// =============================================================================

export default {
  // Core Operations
  getAllClasses,
  getClassById,
  getUserClasses,
  joinClass,
  leaveClass,
  getClassMembers,
  getClassRecommendations,
  
  // Progress & Activity
  getUserProgress,
  getUserActivity,
  
  // Content & Interaction
  getClassContent,
  getClassAnnouncements,
  submitClassFeedback,
  markAttendance,
  getClassSchedule,
  getClassProgress,
  
  // System
  testClassRoutes,
  
  // Utilities (for internal use)
  successResponse,
  errorResponse
};

