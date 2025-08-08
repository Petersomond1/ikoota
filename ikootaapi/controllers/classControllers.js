// ikootaapi/controllers/classControllers.js
// CLASS MANAGEMENT CONTROLLERS
// User-facing class operations: enrollment, content access, participation

import {
  getAllClassesService,
  getClassByIdService,
  getAvailableClassesService,
  getUserClassesService,
  getClassContentService,
  getClassParticipantsService,
  getClassScheduleService,
  joinClassService,
  leaveClassService,
  assignUserToClassService,
  markClassAttendanceService,
  getClassProgressService,
  submitClassFeedbackService,
  getClassFeedbackService
} from '../services/classServices.js';

// ===============================================
// CLASS DISCOVERY & ACCESS
// ===============================================

/**
 * GET /classes - Get all available classes
 * Frontend: UserManagement.jsx -> GET /classes
 */
export const getAllClasses = async (req, res) => {
  try {
    const { 
      type, 
      is_public, 
      is_active = true,
      page = 1, 
      limit = 20,
      search 
    } = req.query;

    const filters = {
      type,
      is_public: is_public !== undefined ? Boolean(is_public) : undefined,
      is_active: Boolean(is_active),
      search
    };

    const classes = await getAllClassesService(filters, { page, limit });

    res.json({
      success: true,
      data: classes.data,
      pagination: classes.pagination,
      filters: filters,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Get all classes error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to fetch classes',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * GET /classes/available - Get classes available to user
 */
export const getAvailableClasses = async (req, res) => {
  try {
    const userId = req.user.id;
    const membershipStage = req.user.membership_stage;
    const fullMembershipStatus = req.user.full_membership_status;

    const { type, search, limit = 10 } = req.query;

    const classes = await getAvailableClassesService(userId, {
      membershipStage,
      fullMembershipStatus,
      type,
      search,
      limit
    });

    res.json({
      success: true,
      data: classes,
      user: {
        membershipStage,
        fullMembershipStatus
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Get available classes error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to fetch available classes',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * GET /classes/my-classes - Get user's enrolled classes
 */
export const getUserClasses = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status = 'active', include_expired = false } = req.query;

    const classes = await getUserClassesService(userId, {
      status,
      include_expired: Boolean(include_expired)
    });

    res.json({
      success: true,
      data: classes,
      userId,
      filters: { status, include_expired },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Get user classes error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to fetch user classes',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * GET /classes/:id - Get specific class details
 * Frontend: AudienceClassMgr.jsx -> GET /classes/{id}
 */
export const getClassById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const classData = await getClassByIdService(id, userId);

    if (!classData) {
      return res.status(404).json({
        success: false,
        error: 'Class not found',
        classId: id,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: classData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Get class by ID error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to fetch class details',
      classId: req.params.id,
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// CLASS CONTENT ACCESS
// ===============================================

/**
 * GET /classes/:id/content - Get class content
 */
export const getClassContent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { 
      content_type, 
      access_level = 'read',
      page = 1, 
      limit = 20 
    } = req.query;

    const content = await getClassContentService(id, userId, {
      content_type,
      access_level,
      page,
      limit
    });

    res.json({
      success: true,
      data: content.data,
      pagination: content.pagination,
      classId: id,
      accessLevel: access_level,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Get class content error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to fetch class content',
      classId: req.params.id,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * GET /classes/:id/participants - Get class participants
 */
export const getClassParticipants = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { 
      role_in_class, 
      membership_status = 'active',
      page = 1, 
      limit = 50 
    } = req.query;

    const participants = await getClassParticipantsService(id, userId, {
      role_in_class,
      membership_status,
      page,
      limit
    });

    res.json({
      success: true,
      data: participants.data,
      pagination: participants.pagination,
      classId: id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Get class participants error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to fetch class participants',
      classId: req.params.id,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * GET /classes/:id/schedule - Get class schedule
 */
export const getClassSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { start_date, end_date, timezone = 'UTC' } = req.query;

    const schedule = await getClassScheduleService(id, userId, {
      start_date,
      end_date,
      timezone
    });

    res.json({
      success: true,
      data: schedule,
      classId: id,
      timezone,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Get class schedule error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to fetch class schedule',
      classId: req.params.id,
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// CLASS ENROLLMENT
// ===============================================

/**
 * POST /classes/:id/join - Join a class
 */
export const joinClass = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { role_in_class = 'member', notifications = true } = req.body;

    const result = await joinClassService(userId, id, {
      role_in_class,
      receive_notifications: notifications
    });

    res.status(201).json({
      success: true,
      message: 'Successfully joined class',
      data: result,
      classId: id,
      userId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Join class error:', error);
    res.status(error.statusCode || 400).json({
      success: false,
      error: error.message || 'Failed to join class',
      classId: req.params.id,
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * POST /classes/:id/leave - Leave a class
 */
export const leaveClass = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { reason } = req.body;

    const result = await leaveClassService(userId, id, { reason });

    res.json({
      success: true,
      message: 'Successfully left class',
      data: result,
      classId: id,
      userId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Leave class error:', error);
    res.status(error.statusCode || 400).json({
      success: false,
      error: error.message || 'Failed to leave class',
      classId: req.params.id,
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * POST /classes/assign - Assign user to class (legacy compatibility)
 * Frontend: AudienceClassMgr.jsx -> POST /classes
 */
export const assignUserToClass = async (req, res) => {
  try {
    const { userId, classId, role_in_class = 'member', assigned_by } = req.body;
    const assignedBy = assigned_by || req.user.id;

    if (!userId || !classId) {
      return res.status(400).json({
        success: false,
        error: 'userId and classId are required',
        timestamp: new Date().toISOString()
      });
    }

    const result = await assignUserToClassService(userId, classId, {
      role_in_class,
      assigned_by: assignedBy,
      receive_notifications: true
    });

    res.status(201).json({
      success: true,
      message: 'User assigned to class successfully',
      data: result,
      assignment: { userId, classId, role_in_class, assigned_by: assignedBy },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Assign user to class error:', error);
    res.status(error.statusCode || 400).json({
      success: false,
      error: error.message || 'Failed to assign user to class',
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// CLASS INTERACTION
// ===============================================

/**
 * POST /classes/:id/attendance - Mark attendance
 */
export const markAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { session_id, status = 'present', notes } = req.body;

    const result = await markClassAttendanceService(userId, id, {
      session_id,
      status,
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: result,
      classId: id,
      userId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Mark attendance error:', error);
    res.status(error.statusCode || 400).json({
      success: false,
      error: error.message || 'Failed to mark attendance',
      classId: req.params.id,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * GET /classes/:id/progress - Get user's progress in class
 */
export const getClassProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const progress = await getClassProgressService(userId, id);

    res.json({
      success: true,
      data: progress,
      classId: id,
      userId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Get class progress error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to fetch class progress',
      classId: req.params.id,
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// CLASS FEEDBACK
// ===============================================

/**
 * POST /classes/:id/feedback - Submit class feedback
 */
export const submitClassFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { rating, comments, feedback_type = 'general', anonymous = false } = req.body;

    if (!rating && !comments) {
      return res.status(400).json({
        success: false,
        error: 'Either rating or comments is required',
        timestamp: new Date().toISOString()
      });
    }

    const result = await submitClassFeedbackService(userId, id, {
      rating,
      comments,
      feedback_type,
      anonymous
    });

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: result,
      classId: id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Submit class feedback error:', error);
    res.status(error.statusCode || 400).json({
      success: false,
      error: error.message || 'Failed to submit feedback',
      classId: req.params.id,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * GET /classes/:id/feedback - Get class feedback (for instructors)
 */
export const getClassFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { 
      feedback_type, 
      include_anonymous = true,
      page = 1, 
      limit = 20 
    } = req.query;

    const feedback = await getClassFeedbackService(id, userId, {
      feedback_type,
      include_anonymous: Boolean(include_anonymous),
      page,
      limit
    });

    res.json({
      success: true,
      data: feedback.data,
      pagination: feedback.pagination,
      classId: id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Get class feedback error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to fetch class feedback',
      classId: req.params.id,
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// LEGACY SUPPORT FUNCTIONS
// ===============================================

/**
 * Legacy function - maintained for backward compatibility
 * Maps to getAllClasses with default parameters
 */
export const getClasses = async (req, res) => {
  console.log('⚠️ Legacy function getClasses called, redirecting to getAllClasses');
  return getAllClasses(req, res);
};

/**
 * Legacy function - maintained for backward compatibility
 * This was used in the old controller structure
 */
export const putClass = async (req, res) => {
  console.log('⚠️ Legacy function putClass called - should be handled by admin routes');
  res.status(400).json({
    success: false,
    error: 'Class updates should be handled through admin routes: /api/admin/classes/:id',
    redirect: `/api/admin/classes/${req.params.id}`,
    timestamp: new Date().toISOString()
  });
};

/**
 * Legacy function - maintained for backward compatibility  
 * Class creation should be handled by admin routes
 */
export const postClass = async (req, res) => {
  console.log('⚠️ Legacy function postClass called - should be handled by admin routes');
  res.status(400).json({
    success: false,
    error: 'Class creation should be handled through admin routes: /api/admin/classes',
    redirect: '/api/admin/classes',
    timestamp: new Date().toISOString()
  });
};