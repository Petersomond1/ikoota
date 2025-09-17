// ikootaapi/controllers/classController.js
// USER CLASS OPERATIONS CONTROLLER
// Following scheduleClassroomSession.md documentation

// Service imports with proper named exports
import * as classService from '../services/classService.js';
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
  console.error('❌ Controller error:', error);
  return res.status(statusCode).json({
    success: false,
    error: error.name || 'Error',
    message: error.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
};

// =============================================================================
// TYPE 1: TRADITIONAL CLASS SESSIONS CONTROLLERS
// =============================================================================

/**
 * GET /api/classes - Browse available classes
 */
export const getAllClasses = async (req, res) => {
  try {
    const filters = {
      page: req.query.page,
      limit: req.query.limit,
      class_type: req.query.class_type,
      is_public: req.query.is_public,
      search: req.query.search,
      sort_by: req.query.sort_by,
      sort_order: req.query.sort_order
    };

    const result = await classService.getAllClasses(filters);
    return successResponse(res, result, 'Classes retrieved successfully');

  } catch (error) {
    const statusCode = error.message.includes('Invalid') ? 400 : 500;
    return errorResponse(res, error, statusCode);
  }
};

/**
 * GET /api/classes/:classId - Get class details
 */
export const getClassById = async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user?.id;

    const result = await classService.getClassById(classId, userId);
    return successResponse(res, result, 'Class details retrieved successfully');

  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    return errorResponse(res, error, statusCode);
  }
};

/**
 * GET /api/classes/my-classes - Get user's enrolled classes
 */
export const getUserClasses = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await classService.getUserClasses(userId);
    return successResponse(res, result, 'User classes retrieved successfully');

  } catch (error) {
    return errorResponse(res, error, 500);
  }
};

/**
 * POST /api/classes/:classId/join - Join a class
 */
export const joinClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user.id;

    const result = await classService.joinClass(userId, classId);

    const statusCode = result.data.membership_status === 'active' ? 200 : 202;
    return successResponse(res, result, result.message, statusCode);

  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 :
                     error.message.includes('Access denied') ? 403 :
                     error.message.includes('already') ? 400 : 500;
    return errorResponse(res, error, statusCode);
  }
};

/**
 * POST /api/classes/:classId/leave - Leave a class
 */
export const leaveClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user.id;

    const result = await classService.leaveClass(userId, classId);
    return successResponse(res, result, 'Successfully left the class');

  } catch (error) {
    const statusCode = error.message.includes('not a member') ? 400 : 500;
    return errorResponse(res, error, statusCode);
  }
};

/**
 * GET /api/classes/:classId/members - Get class members
 */
export const getClassMembers = async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user.id;

    const result = await classService.getClassMembers(classId, userId);
    return successResponse(res, result, 'Class members retrieved successfully');

  } catch (error) {
    const statusCode = error.message.includes('Access denied') ? 403 : 500;
    return errorResponse(res, error, statusCode);
  }
};

/**
 * POST /api/classes/:classId/attendance - Mark class attendance
 */
export const markClassAttendance = async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user.id;
    const attendanceData = req.body;

    const result = await classService.markClassAttendance(userId, classId, attendanceData);
    return successResponse(res, result, 'Attendance marked successfully');

  } catch (error) {
    const statusCode = error.message.includes('Access denied') ? 403 : 500;
    return errorResponse(res, error, statusCode);
  }
};

/**
 * POST /api/classes/:classId/feedback - Submit class feedback
 */
export const submitClassFeedback = async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user.id;
    const feedbackData = req.body;

    const result = await classService.submitClassFeedback(userId, classId, feedbackData);
    return successResponse(res, result, 'Feedback submitted successfully');

  } catch (error) {
    const statusCode = error.message.includes('Access denied') ? 403 : 500;
    return errorResponse(res, error, statusCode);
  }
};

/**
 * GET /api/classes/:classId/stats - Get class statistics
 */
export const getClassStats = async (req, res) => {
  try {
    const { classId } = req.params;

    const result = await classService.getClassStats(classId);
    return successResponse(res, result, 'Class statistics retrieved successfully');

  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    return errorResponse(res, error, statusCode);
  }
};

/**
 * GET /api/classes/my-progress - Get user progress
 */
export const getUserProgress = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await classService.getUserProgress(userId);
    return successResponse(res, result, 'User progress retrieved successfully');

  } catch (error) {
    return errorResponse(res, error, 500);
  }
};

/**
 * GET /api/classes/:classId/attendance/reports - Get attendance reports (Instructor)
 */
export const getAttendanceReports = async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user.id;

    const result = await classService.getAttendanceReports(classId, userId);
    return successResponse(res, result, 'Attendance reports retrieved successfully');

  } catch (error) {
    const statusCode = error.message.includes('Access denied') ? 403 :
                     error.message.includes('not found') ? 404 : 500;
    return errorResponse(res, error, statusCode);
  }
};

/**
 * GET /api/classes/:classId/feedback/summary - Get feedback summary (Instructor)
 */
export const getFeedbackSummary = async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user.id;

    const result = await classService.getFeedbackSummary(classId, userId);
    return successResponse(res, result, 'Feedback summary retrieved successfully');

  } catch (error) {
    const statusCode = error.message.includes('Access denied') ? 403 :
                     error.message.includes('not found') ? 404 : 500;
    return errorResponse(res, error, statusCode);
  }
};

/**
 * GET /api/classes/:classId/content - Get class content
 */
export const getClassContent = async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user.id;
    const options = {
      limit: req.query.limit,
      type: req.query.type,
      published_only: req.query.published_only !== 'false'
    };

    const result = await classService.getClassContent(classId, userId, options);
    return successResponse(res, result, 'Class content retrieved successfully');

  } catch (error) {
    const statusCode = error.message.includes('Access denied') ? 403 : 500;
    return errorResponse(res, error, statusCode);
  }
};

// =============================================================================
// TYPE 3: RECORDED TEACHING SESSIONS CONTROLLERS
// =============================================================================

/**
 * POST /api/classes/:id/videos - Upload video/audio content
 */
export const uploadClassVideo = async (req, res) => {
  try {
    const { id: classId } = req.params;
    const userId = req.user.id;

    const contentData = {
      ...req.body,
      files: req.files
    };

    const result = await classContentService.uploadClassVideo(userId, classId, contentData);
    return successResponse(res, result, result.message, 201);

  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 :
                     error.message.includes('required') ? 403 : 500;
    return errorResponse(res, error, statusCode);
  }
};

/**
 * GET /api/classes/:id/videos - Get class videos (approved content only)
 */
export const getClassVideos = async (req, res) => {
  try {
    const { id: classId } = req.params;
    const userId = req.user.id;
    const options = {
      status: req.query.status || 'approved'
    };

    const result = await classContentService.getClassVideos(classId, userId, options);
    return successResponse(res, result, 'Class videos retrieved successfully');

  } catch (error) {
    const statusCode = error.message.includes('Access denied') ? 403 : 500;
    return errorResponse(res, error, statusCode);
  }
};

/**
 * DELETE /api/classes/:classId/videos/:videoId - Delete video content
 */
export const deleteClassVideo = async (req, res) => {
  try {
    const { classId, videoId } = req.params;
    const userId = req.user.id;

    const result = await classContentService.deleteClassVideo(userId, classId, videoId);
    return successResponse(res, result, 'Video deleted successfully');

  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 :
                     error.message.includes('Access denied') ? 403 : 500;
    return errorResponse(res, error, statusCode);
  }
};

/**
 * POST /api/classes/:id/classroom/sessions - Create classroom session
 */
export const createClassroomSession = async (req, res) => {
  try {
    const { id: classId } = req.params;
    const userId = req.user.id;
    const sessionData = req.body;

    const result = await classContentService.createClassroomSession(classId, userId, sessionData);
    return successResponse(res, result, 'Classroom session created successfully', 201);

  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 :
                     error.message.includes('required') ? 403 : 500;
    return errorResponse(res, error, statusCode);
  }
};

/**
 * GET /api/classes/:classId/classroom/session - Get classroom session info
 */
export const getClassroomSession = async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user.id;

    const result = await classContentService.getClassroomSession(classId, userId);
    return successResponse(res, result, 'Classroom session retrieved successfully');

  } catch (error) {
    const statusCode = error.message.includes('Access denied') ? 403 : 500;
    return errorResponse(res, error, statusCode);
  }
};

/**
 * POST /api/classes/:classId/classroom/sessions/:sessionId/join - Join classroom session
 */
export const joinClassroomSession = async (req, res) => {
  try {
    const { classId, sessionId } = req.params;
    const userId = req.user.id;

    const result = await classContentService.joinClassroomSession(classId, sessionId, userId);
    return successResponse(res, result, 'Successfully joined classroom session');

  } catch (error) {
    const statusCode = error.message.includes('Must be a class member') ? 403 : 500;
    return errorResponse(res, error, statusCode);
  }
};

// =============================================================================
// TYPE 2: LIVE TEACHING SESSIONS CHAT CONTROLLERS
// Following scheduleClassroomSession.md documentation
// =============================================================================

/**
 * GET /api/classes/:id/classroom/chat - Get classroom chat messages
 * STEP 6: INTERACTION DURING SESSION - Chat functionality
 */
export const getClassroomChat = async (req, res) => {
  try {
    const { id: classId } = req.params;
    const userId = req.user.id;

    console.log(`💬 Getting classroom chat for class ${classId} by user ${userId}`);

    const result = await classContentService.getClassroomChat(classId, userId);
    return successResponse(res, result, 'Classroom chat retrieved successfully');

  } catch (error) {
    const statusCode = error.message.includes('Must be a class member') ? 403 : 500;
    return errorResponse(res, error, statusCode);
  }
};

/**
 * POST /api/classes/:id/classroom/chat - Send chat message
 * STEP 6: INTERACTION DURING SESSION - Chat functionality
 */
export const sendClassroomChatMessage = async (req, res) => {
  try {
    const { id: classId } = req.params;
    const userId = req.user.id;
    const { message, message_type = 'chat' } = req.body;

    console.log(`💬 Sending chat message to class ${classId} by user ${userId}`);

    if (!message || message.trim().length === 0) {
      return errorResponse(res, new Error('Message cannot be empty'), 400);
    }

    const result = await classContentService.sendClassroomChatMessage(classId, userId, message, message_type);
    return successResponse(res, result, 'Message sent successfully', 201);

  } catch (error) {
    const statusCode = error.message.includes('Must be a class member') ? 403 : 500;
    return errorResponse(res, error, statusCode);
  }
};

/**
 * GET /api/classes/:id/classroom/participants - Get classroom participants
 * STEP 6: INTERACTION DURING SESSION - View participants functionality
 */
export const getClassroomParticipants = async (req, res) => {
  try {
    const { id: classId } = req.params;
    const userId = req.user.id;

    console.log(`👥 Getting classroom participants for class ${classId}`);

    const result = await classContentService.getClassroomParticipants(classId, userId);
    return successResponse(res, result, 'Classroom participants retrieved successfully');

  } catch (error) {
    const statusCode = error.message.includes('Must be a class member') ? 403 : 500;
    return errorResponse(res, error, statusCode);
  }
};

// =============================================================================
// USER ACTIVITY AND RECOMMENDATIONS
// =============================================================================

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

/**
 * GET /api/classes/recommendations - Get class recommendations
 */
export const getClassRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const options = {
      limit: parseInt(req.query.limit) || 6,
      page: 1
    };
    const result = await classService.getAllClasses({}, options);

    return successResponse(res, {
      data: result.data,
      user_id: userId,
      total: result.total
    }, 'Class recommendations retrieved successfully');
  } catch (error) {
    console.error('❌ getClassRecommendations error:', error);
    return errorResponse(res, error);
  }
};