// ikootaapi/controllers/userAdminControllers.js
// Controllers for user admin operations - routes → controllers → services
// Connects userAdminRoutes.js to userAdminServices.js

import CustomError from '../utils/CustomError.js';
import userAdminServices from '../services/userAdminServices.js';

// ===============================================
// DASHBOARD & ANALYTICS CONTROLLERS
// ===============================================

/**
 * GET /api/users/admin/stats/overview - Dashboard overview
 */
export const getOverviewStats = async (req, res) => {
  try {
    const stats = await userAdminServices.getOverviewStats();
    
    res.json({
      success: true,
      overview: stats.overview,
      applications: stats.applications,
      content: stats.content,
      activity: stats.activity,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Overview stats error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch overview statistics',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * GET /api/users/admin/stats/detailed - Detailed analytics
 */
export const getDetailedStats = async (req, res) => {
  try {
    const { period = '30d', metrics } = req.query;
    
    const stats = await userAdminServices.getDetailedStats(period, metrics);
    
    res.json({
      success: true,
      data: stats,
      period,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Detailed stats error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch detailed statistics',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * GET /api/users/admin/analytics - Comprehensive analytics
 */
export const getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    const analytics = await userAdminServices.getAnalytics(startDate, endDate, groupBy);
    
    res.json({
      success: true,
      analytics,
      period: { startDate, endDate },
      groupBy,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch analytics data',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * GET /api/users/admin/pending-count - Real-time pending counts
 */
export const getPendingCount = async (req, res) => {
  try {
    const counts = await userAdminServices.getPendingCount();
    
    res.json({
      success: true,
      counts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Pending count error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch pending counts',
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// USER MANAGEMENT CONTROLLERS
// ===============================================

/**
 * GET /api/users/admin - Get all users with filtering
 */
export const getAllUsers = async (req, res) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      search: req.query.search,
      role: req.query.role,
      membershipStage: req.query.membershipStage,
      isVerified: req.query.isVerified === 'true' ? true : req.query.isVerified === 'false' ? false : undefined,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

    const result = await userAdminServices.getAllUsers(filters);
    
    res.json(result);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch users',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * GET /api/users/admin/:id - Get specific user by ID
 */
export const getUserById = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      throw new CustomError('Valid user ID required', 400);
    }
    
    const result = await userAdminServices.getUserById(userId);
    
    res.json(result);
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch user details',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * POST /api/users/admin - Create new user
 */
export const createUser = async (req, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body;
    
    const result = await userAdminServices.createUser({
      username,
      email,
      password,
      role,
      createdBy: req.user.id
    });
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to create user',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * PUT /api/users/admin/:id - Update user
 */
export const updateUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      throw new CustomError('Valid user ID required', 400);
    }
    
    const updates = req.body;
    updates.updatedBy = req.user.id;
    
    const result = await userAdminServices.updateUser(userId, updates);
    
    res.json(result);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to update user',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * DELETE /api/users/admin/:id - Delete user
 */
export const deleteUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { reason } = req.body;
    
    if (isNaN(userId)) {
      throw new CustomError('Valid user ID required', 400);
    }
    
    if (!reason) {
      throw new CustomError('Deletion reason required', 400);
    }
    
    const result = await userAdminServices.deleteUser(userId, {
      reason,
      deletedBy: req.user.id
    });
    
    res.json(result);
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to delete user',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * PUT /api/users/admin/:id/role - Update user role
 */
export const updateUserRole = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { role, reason } = req.body;
    
    if (isNaN(userId)) {
      throw new CustomError('Valid user ID required', 400);
    }
    
    const result = await userAdminServices.updateUserRole(userId, {
      role,
      reason,
      updatedBy: req.user.id
    });
    
    res.json(result);
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to update user role',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * PUT /api/users/admin/:id/posting-rights - Grant/revoke posting rights
 */
export const grantPostingRights = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { canPost, reason } = req.body;
    
    if (isNaN(userId)) {
      throw new CustomError('Valid user ID required', 400);
    }
    
    const result = await userAdminServices.grantPostingRights(userId, {
      canPost,
      reason,
      updatedBy: req.user.id
    });
    
    res.json(result);
  } catch (error) {
    console.error('Grant posting rights error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to update posting rights',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * PUT /api/users/admin/:id/ban - Ban user
 */
export const banUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { reason, duration = 'permanent', daysToUnban } = req.body;
    
    if (isNaN(userId)) {
      throw new CustomError('Valid user ID required', 400);
    }
    
    const result = await userAdminServices.banUser(userId, {
      reason,
      duration,
      daysToUnban: duration === 'temporary' ? daysToUnban : null,
      bannedBy: req.user.id
    });
    
    res.json(result);
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to ban user',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * PUT /api/users/admin/:id/unban - Unban user
 */
export const unbanUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { reason } = req.body;
    
    if (isNaN(userId)) {
      throw new CustomError('Valid user ID required', 400);
    }
    
    const result = await userAdminServices.unbanUser(userId, {
      reason,
      unbannedBy: req.user.id
    });
    
    res.json(result);
  } catch (error) {
    console.error('Unban user error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to unban user',
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// APPLICATION MANAGEMENT CONTROLLERS
// ===============================================

/**
 * GET /api/users/admin/applications - Get applications with filtering
 */
export const getApplications = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      type: req.query.type,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      sortBy: req.query.sortBy || 'submittedAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

    const result = await userAdminServices.getApplications(filters);
    
    res.json(result);
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch applications',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * GET /api/users/admin/applications/pending - Get pending applications
 */
export const getPendingApplications = async (req, res) => {
  try {
    const filters = {
      priority: req.query.priority,
      assignedTo: req.query.assignedTo ? parseInt(req.query.assignedTo) : undefined
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

    const result = await userAdminServices.getPendingApplications(filters);
    
    res.json(result);
  } catch (error) {
    console.error('Get pending applications error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch pending applications',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * PUT /api/users/admin/applications/:id/review - Review application
 */
export const reviewApplication = async (req, res) => {
  try {
    const applicationId = parseInt(req.params.id);
    const { status, adminNotes, notifyUser = true } = req.body;
    
    if (isNaN(applicationId)) {
      throw new CustomError('Valid application ID required', 400);
    }
    
    const result = await userAdminServices.reviewApplication(applicationId, {
      status,
      adminNotes,
      notifyUser,
      reviewedBy: req.user.id
    });
    
    res.json(result);
  } catch (error) {
    console.error('Review application error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to review application',
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// CONTENT MODERATION CONTROLLERS
// ===============================================

/**
 * GET /api/users/admin/reports - Get content reports
 */
export const getContentReports = async (req, res) => {
  try {
    console.log('🎯 getContentReports controller called');
    console.log('📝 Query params:', req.query);
    
    const filters = {
      status: req.query.status,
      contentType: req.query.contentType,
      reason: req.query.reason,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);
    console.log('🔍 Applied filters:', filters);

    console.log('🚀 Calling userAdminServices.getContentReports...');
    const result = await userAdminServices.getContentReports(filters);
    console.log('✅ Service call successful, returning data');
    
    res.json(result);
  } catch (error) {
    console.error('❌ Get content reports error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch content reports',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * PUT /api/users/admin/reports/:id/resolve - Resolve content report
 */
export const resolveReport = async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const { status, resolutionNotes, actionTaken } = req.body;
    
    if (isNaN(reportId)) {
      throw new CustomError('Valid report ID required', 400);
    }
    
    const result = await userAdminServices.resolveReport(reportId, {
      status,
      resolutionNotes,
      actionTaken,
      resolvedBy: req.user.id
    });
    
    res.json(result);
  } catch (error) {
    console.error('Resolve report error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to resolve report',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * GET /api/users/admin/activity-logs - Get user activity logs
 */
export const getActivityLogs = async (req, res) => {
  try {
    const filters = {
      userId: req.query.userId ? parseInt(req.query.userId) : undefined,
      action: req.query.action,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

    const result = await userAdminServices.getActivityLogs(filters);
    
    res.json(result);
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch activity logs',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * GET /api/users/admin/audit-trail - Get system audit trail (Super Admin only)
 */
export const getAuditTrail = async (req, res) => {
  try {
    const filters = {
      adminId: req.query.adminId ? parseInt(req.query.adminId) : undefined,
      action: req.query.action,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

    const result = await userAdminServices.getAuditTrail(filters);
    
    res.json(result);
  } catch (error) {
    console.error('Get audit trail error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch audit trail',
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// BULK OPERATIONS CONTROLLERS
// ===============================================

/**
 * POST /api/users/admin/bulk/approve - Bulk approve users
 */
export const bulkApproveUsers = async (req, res) => {
  try {
    const { userIds, reason, notifyUsers = true } = req.body;
    
    const result = await userAdminServices.bulkApproveUsers({
      userIds,
      reason,
      notifyUsers,
      approvedBy: req.user.id
    });
    
    res.json(result);
  } catch (error) {
    console.error('Bulk approve users error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to bulk approve users',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * POST /api/users/admin/bulk/assign-mentors - Bulk assign mentors
 */
export const bulkAssignMentors = async (req, res) => {
  try {
    const { assignments, reason } = req.body;
    
    const result = await userAdminServices.bulkAssignMentors({
      assignments,
      reason,
      assignedBy: req.user.id
    });
    
    res.json(result);
  } catch (error) {
    console.error('Bulk assign mentors error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to bulk assign mentors',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * POST /api/users/admin/bulk/send-notifications - Bulk send notifications
 */
export const bulkSendNotifications = async (req, res) => {
  try {
    const { userIds, title, message, type } = req.body;
    
    const result = await userAdminServices.bulkSendNotifications({
      userIds,
      title,
      message,
      type,
      sentBy: req.user.id
    });
    
    res.json(result);
  } catch (error) {
    console.error('Bulk send notifications error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to send bulk notifications',
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// IDENTITY MANAGEMENT CONTROLLERS
// ===============================================

/**
 * POST /api/users/admin/mask-identity-advanced - Advanced identity masking
 */
export const maskUserIdentityAdvanced = async (req, res) => {
  try {
    const { userId, reason, maskingLevel, duration } = req.body;
    
    const result = await userAdminServices.maskUserIdentityAdvanced({
      userId,
      reason,
      maskingLevel,
      duration,
      maskedBy: req.user.id
    });
    
    res.json(result);
  } catch (error) {
    console.error('Mask user identity advanced error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to mask user identity',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * POST /api/users/admin/unmask-identity - Unmask identity (Super Admin only)
 */
export const unmaskUserIdentity = async (req, res) => {
  try {
    const { userId, reason } = req.body;
    
    const result = await userAdminServices.unmaskUserIdentity({
      userId,
      reason,
      unmaskedBy: req.user.id
    });
    
    res.json(result);
  } catch (error) {
    console.error('Unmask user identity error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to unmask user identity',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * GET /api/users/admin/identity-audit-trail - Identity audit trail (Super Admin only)
 */
export const getIdentityAuditTrail = async (req, res) => {
  try {
    const filters = {
      userId: req.query.userId ? parseInt(req.query.userId) : undefined,
      adminId: req.query.adminId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

    const result = await userAdminServices.getIdentityAuditTrail(filters);
    
    res.json(result);
  } catch (error) {
    console.error('Get identity audit trail error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch identity audit trail',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * GET /api/users/admin/identity-dashboard - Identity management dashboard
 */
export const getIdentityDashboard = async (req, res) => {
  try {
    const result = await userAdminServices.getIdentityDashboard();
    
    res.json(result);
  } catch (error) {
    console.error('Get identity dashboard error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch identity dashboard',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * GET /api/users/admin/mentor-analytics - Enhanced mentor analytics
 */
export const getMentorAnalytics = async (req, res) => {
  try {
    const { period = '30d', mentorId } = req.query;
    
    const result = await userAdminServices.getMentorAnalytics({ period, mentorId });
    
    res.json(result);
  } catch (error) {
    console.error('Get mentor analytics error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch mentor analytics',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * POST /api/users/admin/bulk-assign-mentors-advanced - Advanced bulk mentor assignment
 */
export const bulkAssignMentorsAdvanced = async (req, res) => {
  try {
    const { assignments, autoMatch = false, reason } = req.body;
    
    const result = await userAdminServices.bulkAssignMentorsAdvanced({
      assignments,
      autoMatch,
      reason,
      assignedBy: req.user.id
    });
    
    res.json(result);
  } catch (error) {
    console.error('Bulk assign mentors advanced error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to perform advanced mentor assignment',
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// SYSTEM MANAGEMENT CONTROLLERS
// ===============================================

/**
 * GET /api/users/admin/export/user-data - Export user data
 */
export const exportUserData = async (req, res) => {
  try {
    const options = {
      format: req.query.format || 'json',
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      includeFields: req.query.includeFields
    };
    
    const result = await userAdminServices.exportUserData(options);
    
    // Set appropriate headers for file download
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `user-export-${timestamp}.${options.format}`;
    
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    
    if (options.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.send(result.data);
    } else if (options.format === 'xlsx') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(result.data);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.json(result);
    }
  } catch (error) {
    console.error('Export user data error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to export user data',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * POST /api/users/admin/generate/bulk-ids - Generate bulk IDs
 */
export const generateBulkIds = async (req, res) => {
  try {
    const { count, type, purpose } = req.body;
    
    const result = await userAdminServices.generateBulkIds({
      count,
      type,
      purpose,
      generatedBy: req.user.id
    });
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Generate bulk IDs error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to generate bulk IDs',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * POST /api/users/admin/generate/converse-id - Generate converse ID
 */
export const generateConverseId = async (req, res) => {
  try {
    const { userId, purpose } = req.body;
    
    const result = await userAdminServices.generateConverseId({
      userId,
      purpose,
      generatedBy: req.user.id
    });
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Generate converse ID error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to generate converse ID',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * POST /api/users/admin/generate/class-id - Generate class ID
 */
export const generateClassId = async (req, res) => {
  try {
    const { className, createdBy } = req.body;
    
    const result = await userAdminServices.generateClassId({
      className,
      createdBy,
      generatedBy: req.user.id
    });
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Generate class ID error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to generate class ID',
      timestamp: new Date().toISOString()
    });
  }
};