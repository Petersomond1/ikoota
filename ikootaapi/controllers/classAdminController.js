// ikootaapi/controllers/classAdminController.js
// ADMIN CLASS MANAGEMENT & LIVE TEACHING CONTROLLER
// Following scheduleClassroomSession.md documentation

// Service imports with proper named exports
import * as classAdminService from '../services/classAdminService.js';
import * as liveClassService from '../services/liveClassService.js';
import * as classContentService from '../services/classContentService.js';

// =============================================================================
// UTILITY FUNCTIONS
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
  console.error('❌ Admin Controller error:', error);
  return res.status(statusCode).json({
    success: false,
    error: error.name || 'Error',
    message: error.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
};

// =============================================================================
// ADMIN DASHBOARD & CLASS MANAGEMENT
// =============================================================================

/**
 * GET /api/classes/admin/dashboard - Admin dashboard data
 */
export const getAdminDashboard = async (req, res) => {
  try {
    const result = await classAdminService.getAdminDashboard();
    return successResponse(res, result, 'Admin dashboard data retrieved successfully');

  } catch (error) {
    return errorResponse(res, error, 500);
  }
};

/**
 * GET /api/classes/admin - Get all classes (Admin view)
 */
export const getAllClassesAdmin = async (req, res) => {
  try {
    const options = {
      page: req.query.page,
      limit: req.query.limit,
      class_type: req.query.class_type,
      is_active: req.query.is_active,
      search: req.query.search,
      sort_by: req.query.sort_by,
      sort_order: req.query.sort_order
    };

    const result = await classAdminService.getAllClassesAdmin(options);
    return successResponse(res, result, 'Classes retrieved successfully');

  } catch (error) {
    return errorResponse(res, error, 500);
  }
};

/**
 * POST /api/classes/admin - Create new class
 */
export const createClass = async (req, res) => {
  try {
    const adminUserId = req.user.id;
    const classData = req.body;

    const result = await classAdminService.createClass(adminUserId, classData);
    return successResponse(res, result, result.message, 201);

  } catch (error) {
    const statusCode = error.message.includes('required') ? 400 : 500;
    return errorResponse(res, error, statusCode);
  }
};

/**
 * PUT /api/classes/admin/:classId - Update class
 */
export const updateClass = async (req, res) => {
  try {
    const adminUserId = req.user.id;
    const { classId } = req.params;
    const updateData = req.body;

    const result = await classAdminService.updateClass(adminUserId, classId, updateData);
    return successResponse(res, result, result.message);

  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 :
                     error.message.includes('No valid fields') ? 400 : 500;
    return errorResponse(res, error, statusCode);
  }
};

/**
 * DELETE /api/classes/admin/:classId - Delete class
 */
export const deleteClass = async (req, res) => {
  try {
    const adminUserId = req.user.id;
    const { classId } = req.params;

    const result = await classAdminService.deleteClass(adminUserId, classId);
    return successResponse(res, result, result.message);

  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 :
                     error.message.includes('Cannot delete') ? 400 : 500;
    return errorResponse(res, error, statusCode);
  }
};

/**
 * GET /api/classes/admin/:classId/participants - Get class participants
 */
export const getClassParticipants = async (req, res) => {
  try {
    const { classId } = req.params;

    const result = await classAdminService.getClassParticipants(classId);
    return successResponse(res, result, 'Participants retrieved successfully');

  } catch (error) {
    return errorResponse(res, error, 500);
  }
};

/**
 * PUT /api/classes/admin/:classId/participants/:userId - Manage participant
 */
export const manageParticipant = async (req, res) => {
  try {
    const adminUserId = req.user.id;
    const { classId, userId } = req.params;
    const actionData = req.body;

    const result = await classAdminService.manageParticipant(adminUserId, classId, userId, actionData);
    return successResponse(res, result, result.message);

  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 :
                     error.message.includes('required') ? 400 : 500;
    return errorResponse(res, error, statusCode);
  }
};

/**
 * POST /api/classes/admin/:classId/participants/add - Add participants
 */
export const addParticipants = async (req, res) => {
  try {
    const adminUserId = req.user.id;
    const { classId } = req.params;
    const participantData = req.body;

    const result = await classAdminService.addParticipants(adminUserId, classId, participantData);
    return successResponse(res, result, result.message, 201);

  } catch (error) {
    const statusCode = error.message.includes('required') ? 400 :
                     error.message.includes('exceed capacity') ? 400 : 500;
    return errorResponse(res, error, statusCode);
  }
};

/**
 * GET /api/classes/admin/analytics - System analytics
 */
export const getSystemAnalytics = async (req, res) => {
  try {
    const options = {
      date_range: req.query.date_range
    };

    const result = await classAdminService.getSystemAnalytics(options);
    return successResponse(res, result, 'Analytics retrieved successfully');

  } catch (error) {
    return errorResponse(res, error, 500);
  }
};

// =============================================================================
// TYPE 2: LIVE TEACHING SESSIONS ADMIN CONTROLLERS
// =============================================================================

/**
 * GET /api/classes/live/admin/dashboard - Live class admin dashboard
 */
export const getLiveClassAdminDashboard = async (req, res) => {
  try {
    const result = await liveClassService.getLiveClassAdminDashboard();
    return successResponse(res, result, 'Live class dashboard retrieved successfully');

  } catch (error) {
    return errorResponse(res, error, 500);
  }
};

/**
 * GET /api/classes/live/admin/pending - Get pending live class approvals
 */
export const getPendingLiveClassApprovals = async (req, res) => {
  try {
    const options = {
      limit: req.query.limit,
      classId: req.query.classId
    };

    const result = await liveClassService.getPendingLiveClassApprovals(options);
    return successResponse(res, result, 'Pending approvals retrieved successfully');

  } catch (error) {
    return errorResponse(res, error, 500);
  }
};

/**
 * PUT /api/classes/live/admin/review/:scheduleId - Review live class schedule
 */
export const reviewLiveClassSchedule = async (req, res) => {
  try {
    const adminUserId = req.user.id;
    const { scheduleId } = req.params;
    const reviewData = req.body;

    const result = await liveClassService.reviewLiveClassSchedule(adminUserId, scheduleId, reviewData);
    return successResponse(res, result, result.message);

  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 :
                     error.message.includes('Invalid action') ? 400 :
                     error.message.includes('already') ? 400 : 500;
    return errorResponse(res, error, statusCode);
  }
};

/**
 * POST /api/classes/live/admin/notify/:scheduleId - Send live class notifications
 */
export const triggerLiveClassNotifications = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const result = await liveClassService.sendLiveClassNotifications(scheduleId);
    return successResponse(res, result, result.message);

  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    return errorResponse(res, error, statusCode);
  }
};

/**
 * POST /api/classes/live/start/:sessionId - Start live class session (Admin override)
 */
export const adminControlLiveSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { action } = req.body;

    if (action === 'start') {
      const result = await liveClassService.startLiveClassSession(sessionId);
      return successResponse(res, result, result.message);
    } else {
      return errorResponse(res, new Error('Invalid action'), 400);
    }

  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    return errorResponse(res, error, statusCode);
  }
};

// =============================================================================
// TYPE 3: RECORDED CONTENT ADMIN CONTROLLERS
// =============================================================================

/**
 * GET /api/classes/admin/pending-approvals - Get pending content approvals
 */
export const getPendingContentApprovals = async (req, res) => {
  try {
    const options = {
      type: req.query.type || 'videos',
      limit: req.query.limit,
      classId: req.query.classId
    };

    const result = await classContentService.getPendingContentApprovals(options);
    return successResponse(res, result, 'Pending content approvals retrieved successfully');

  } catch (error) {
    return errorResponse(res, error, 500);
  }
};

/**
 * GET /api/classes/admin/:classId/content/:contentId - Review content details
 */
export const getContentDetails = async (req, res) => {
  try {
    const { classId, contentId } = req.params;

    // Get content details from database
    const query = `
      SELECT
        cc.*,
        cls.class_name, cls.public_name,
        u.username as creator_username, u.email as creator_email
      FROM class_content cc
      LEFT JOIN classes cls ON cc.class_id = cls.class_id
      LEFT JOIN users u ON cc.created_by = u.id
      WHERE cc.id = ? AND cc.class_id = ?
    `;

    const result = await db.query(query, [contentId, classId]);

    if (!result.length) {
      return errorResponse(res, new Error('Content not found'), 404);
    }

    return successResponse(res, { data: result[0] }, 'Content details retrieved successfully');

  } catch (error) {
    return errorResponse(res, error, 500);
  }
};

/**
 * PUT /api/classes/admin/content/:contentId/review - Review and approve/reject content
 */
export const reviewContent = async (req, res) => {
  try {
    const adminUserId = req.user.id;
    const { contentId } = req.params;
    const reviewData = req.body;

    const result = await classContentService.reviewContent(adminUserId, contentId, reviewData);
    return successResponse(res, result, result.message);

  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 :
                     error.message.includes('Invalid action') ? 400 :
                     error.message.includes('already been reviewed') ? 400 : 500;
    return errorResponse(res, error, statusCode);
  }
};

// =============================================================================
// TYPE 2: INSTRUCTOR LIVE CLASS CONTROLLERS (Non-Admin)
// =============================================================================

/**
 * POST /api/classes/live/schedule - Schedule live teaching session (Instructor)
 */
export const scheduleLiveClass = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📅 Controller: Scheduling live class by user ${userId}`);

    const sessionData = {
      title: req.body.title,
      description: req.body.description,
      class_type: req.body.class_type || 'video',
      scheduled_start_time: req.body.scheduled_start_time,
      estimated_duration: req.body.estimated_duration || 60,
      target_audience: req.body.target_audience || 'members',
      target_class_id: req.body.target_class_id, // Following documentation - this is correct
      notification_preferences: req.body.notification_preferences || {},
      streaming_settings: req.body.streaming_settings || {},
      special_instructions: req.body.special_instructions
    };

    const result = await liveClassService.scheduleLiveClass(userId, sessionData);
    return successResponse(res, result, result.message, 201);

  } catch (error) {
    console.error('❌ scheduleLiveClass controller error:', error);
    const statusCode = error.message.includes('Access denied') ? 403 :
                      error.message.includes('not found') ? 404 :
                      error.message.includes('required') ? 400 : 500;
    return errorResponse(res, error, statusCode);
  }
};

/**
 * GET /api/classes/live/my-sessions - Get user's live class sessions
 */
export const getUserLiveClasses = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await liveClassService.getUserLiveClasses(userId);
    return successResponse(res, result, 'Live sessions retrieved successfully');

  } catch (error) {
    return errorResponse(res, error, 500);
  }
};

/**
 * POST /api/classes/live/start/:sessionId - Start live class session (Instructor)
 */
export const startLiveClassSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const result = await liveClassService.startLiveClassSession(sessionId);
    return successResponse(res, result, result.message);

  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 :
                     error.message.includes('not approved') ? 403 : 500;
    return errorResponse(res, error, statusCode);
  }
};