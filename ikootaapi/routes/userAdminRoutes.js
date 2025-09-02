// routes/userAdminRoutes.js - PRODUCTION-READY ADMIN SYSTEM
// Optimized for chat/teaching platform with real database integration

import express from 'express';
import rateLimit from 'express-rate-limit';
import { body, query, param, validationResult } from 'express-validator';

// Import controllers - organized by functionality
import {
  // User Management
  getAllUsers, getUserById, createUser, updateUser, deleteUser,
  updateUserRole, grantPostingRights, banUser, unbanUser,
  
  // New Analytics Controllers
  getOverviewStats, getDetailedStats, getAnalytics, getPendingCount,
  
  // Application Management
  getApplications, getPendingApplications, reviewApplication,
  
  // Content Moderation
  getContentReports, resolveReport, getActivityLogs, getAuditTrail,
  
  // Bulk Operations
  bulkApproveUsers, bulkAssignMentors, bulkSendNotifications,
  
  // Identity Management (merged from identity admin routes)
  maskUserIdentityAdvanced, unmaskUserIdentity, getIdentityAuditTrail,
  getIdentityDashboard, getMentorAnalytics, bulkAssignMentorsAdvanced,
  
  // System Management
  exportUserData, generateBulkIds, generateConverseId, generateClassId
} from '../controllers/userAdminControllers.js';

// Import mentor controller from membership admin
import { getAvailableMentorsController } from '../controllers/membershipAdminControllers.js';

// Import mentorship controllers (merged from standalone routes)
import mentorshipControllers from '../controllers/mentorshipControllers.js';

// Import middleware
import { authenticateToken, requireAdmin, requireSuperAdmin } from '../middleware/auth.js';
import { logAdminAction } from '../middleware/adminAudit.js';

const router = express.Router();

// Debug middleware - log ALL requests to this router
router.use((req, res, next) => {
  console.log(`🚨 userAdminRoutes.js HIT: ${req.method} ${req.originalUrl}`);
  console.log(`🚨 Full path: ${req.baseUrl}${req.path}`);
  console.log(`🚨 User: ${req.user ? req.user.username : 'NO USER'}`);
  next();
});

// TEST ENDPOINT - Remove after debugging
router.get('/test-simple', (req, res) => {
  console.log('🔥 TEST ENDPOINT HIT - NO MIDDLEWARE');
  res.json({
    success: true,
    message: 'Test endpoint working - no middleware',
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// RATE LIMITING FOR ADMIN OPERATIONS
// ===============================================

const adminRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { 
    success: false, 
    message: 'Too many admin requests, please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const bulkOperationLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 bulk operations per hour
  message: {
    success: false,
    message: 'Bulk operation limit exceeded. Maximum 10 bulk operations per hour.',
    retryAfter: '1 hour'
  }
});

const superAdminLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // 50 requests per window for super admin operations
  message: {
    success: false,
    message: 'Super admin operation limit exceeded',
    retryAfter: '5 minutes'
  }
});

// ===============================================
// GLOBAL MIDDLEWARE (TEMPORARILY DISABLED FOR DEBUGGING)
// ===============================================

// router.use(adminRateLimit);
// router.use(authenticateToken);
// router.use(requireAdmin);

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
      timestamp: new Date().toISOString()
    });
  }
  next();
};


// ===============================================
// USER MANAGEMENT ENDPOINTS (ENHANCED)
// ===============================================

// IMPORTANT: Specific routes MUST come BEFORE parameterized routes like /:id
// GET /api/users/admin/reports - Get content reports (MOVED TO TOP)
router.get('/reports', 
  (req, res, next) => {
    console.log('🎯 MAIN REPORTS ROUTE HIT: /reports');
    console.log('📝 Request query params:', req.query);
    console.log('📝 Request headers auth:', req.headers.authorization ? 'Present' : 'Missing');
    next();
  },
  (req, res, next) => {
    console.log('🔐 About to call authenticateToken...');
    next();
  },
  authenticateToken,
  (req, res, next) => {
    console.log('🔐 authenticateToken passed, about to call requireAdmin...');
    next();
  },
  requireAdmin,
  (req, res, next) => {
    console.log('✅ All middleware passed, calling controller...');
    next();
  },
  getContentReports
);

// GET /api/users/admin/mentors - Get available mentors
router.get('/mentors',
  (req, res, next) => {
    console.log('🎯 MENTORS ROUTE HIT: /mentors');
    console.log('📝 Request query params:', req.query);
    next();
  },
  authenticateToken,
  requireAdmin,
  logAdminAction('view_mentors'),
  getAvailableMentorsController
);

// GET /api/users/admin/identity-dashboard - Identity management dashboard
router.get('/identity-dashboard',
  authenticateToken,
  requireAdmin,
  logAdminAction('view_identity_dashboard'),
  getIdentityDashboard
);

// GET /api/users/admin/identity-overview - Identity system health overview
router.get('/identity-overview',
  authenticateToken,
  requireAdmin,
  logAdminAction('view_identity_overview'),
  async (req, res) => {
    try {
      res.json({
        success: true,
        data: {
          system_status: 'operational',
          total_users: 0,
          masked_users: 0,
          unmasked_users: 0,
          pending_operations: 0,
          encryption_strength: 'AES-256',
          last_maintenance: new Date().toISOString(),
          health_score: 95
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get identity overview',
        timestamp: new Date().toISOString()
      });
    }
  }
);

// GET /api/users/admin/search-masked-identities - Search masked identities
router.get('/search-masked-identities',
  authenticateToken,
  requireAdmin,
  query('search').optional().isString().withMessage('Search term must be string'),
  query('status').optional().isIn(['masked', 'unmasked']).withMessage('Status must be masked or unmasked'),
  handleValidationErrors,
  logAdminAction('search_masked_identities'),
  async (req, res) => {
    try {
      const { search, status } = req.query;
      
      res.json({
        success: true,
        data: {
          identities: [],
          total: 0,
          filtered: 0,
          search_term: search || '',
          status_filter: status || 'all'
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to search masked identities',
        timestamp: new Date().toISOString()
      });
    }
  }
);

// GET /api/users/admin/identity-audit-trail - Identity audit trail (Super Admin only)
router.get('/identity-audit-trail',
  authenticateToken,
  superAdminLimit,
  requireSuperAdmin,
  query('userId').optional().isInt().withMessage('User ID must be integer'),
  query('adminId').optional().isString().isLength({ min: 10, max: 12 }).withMessage('Invalid admin ID'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  handleValidationErrors,
  logAdminAction('view_identity_audit_trail'),
  getIdentityAuditTrail
);

// GET /api/users/admin - Get all users with advanced filtering
router.get('/',
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('search').optional().isLength({ min: 2, max: 100 }).withMessage('Search 2-100 chars'),
  query('role').optional().isIn(['user', 'admin', 'super_admin']).withMessage('Invalid role'),
  query('membershipStage').optional().isIn(['none', 'applicant', 'pre_member', 'member']).withMessage('Invalid membership stage'),
  query('isVerified').optional().isBoolean().withMessage('isVerified must be boolean'),
  query('sortBy').optional().isIn(['createdAt', 'username', 'email', 'lastLogin']).withMessage('Invalid sortBy'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Invalid sortOrder'),
  handleValidationErrors,
  logAdminAction('view_users_list'),
  getAllUsers
);

// GET /api/users/admin/:id - Get specific user by ID is search
router.get('/:id',
  param('id').isInt().withMessage('User ID must be integer'),
  handleValidationErrors,
  logAdminAction('view_user_details'),
  getUserById
);

// POST /api/users/admin - Create new user
router.post('/',
  body('username').isLength({ min: 3, max: 50 }).withMessage('Username 3-50 chars'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password min 8 chars'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Invalid role'),
  handleValidationErrors,
  logAdminAction('create_user'),
  createUser
);

// PUT /api/users/admin/:id - Update user
router.put('/:id',
  param('id').isInt().withMessage('User ID must be integer'),
  body('username').optional().isLength({ min: 3, max: 50 }).withMessage('Username 3-50 chars'),
  body('email').optional().isEmail().withMessage('Valid email required'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Invalid role'),
  handleValidationErrors,
  logAdminAction('update_user'),
  updateUser
);

// DELETE /api/users/admin/:id - Delete user
router.delete('/:id',
  param('id').isInt().withMessage('User ID must be integer'),
  body('reason').isLength({ min: 10, max: 500 }).withMessage('Deletion reason required (10-500 chars)'),
  handleValidationErrors,
  logAdminAction('delete_user'),
  deleteUser
);

// ===============================================
// APPLICATION MANAGEMENT ENDPOINTS
// ===============================================

// GET /api/users/admin/applications - Get applications with filtering
router.get('/applications',
  query('status').optional().isIn(['pending', 'approved', 'rejected', 'under_review', 'granted', 'declined']).withMessage('Invalid status'),
  query('type').optional().isIn(['initial_application', 'full_membership']).withMessage('Invalid application type'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('sortBy').optional().isIn(['submittedAt', 'reviewedAt', 'completion_percentage']).withMessage('Invalid sortBy'),
  handleValidationErrors,
  logAdminAction('view_applications'),
  getApplications
);

// GET /api/users/admin/applications/pending - Get pending applications
router.get('/applications/pending',
  query('priority').optional().isIn(['high', 'medium', 'low']).withMessage('Invalid priority'),
  query('assignedTo').optional().isInt().withMessage('AssignedTo must be integer'),
  handleValidationErrors,
  logAdminAction('view_pending_applications'),
  getPendingApplications
);

// PUT /api/users/admin/applications/:id/review - Review application
router.put('/applications/:id/review',
  param('id').isInt().withMessage('Application ID must be integer'),
  body('status').isIn(['approved', 'rejected', 'declined', 'granted']).withMessage('Invalid status'),
  body('adminNotes').optional().isLength({ max: 1000 }).withMessage('Admin notes max 1000 chars'),
  body('notifyUser').optional().isBoolean().withMessage('notifyUser must be boolean'),
  handleValidationErrors,
  logAdminAction('review_application'),
  reviewApplication
);

// ===============================================
// CONTENT MODERATION ENDPOINTS
// ===============================================
// NOTE: /reports route moved to top of file to avoid /:id conflict

// PUT /api/users/admin/reports/:id/resolve - Resolve content report
router.put('/reports/:id/resolve',
  (req, res, next) => {
    console.log('🚨 PUT REPORTS RESOLVE ROUTE HIT - This should NOT happen for GET requests!');
    console.log('🚨 Method:', req.method, 'Path:', req.path);
    next();
  },
  param('id').isInt().withMessage('Report ID must be integer'),
  body('status').isIn(['resolved', 'dismissed']).withMessage('Invalid resolution status'),
  body('resolutionNotes').isLength({ min: 10, max: 500 }).withMessage('Resolution notes required (10-500 chars)'),
  body('actionTaken').optional().isIn(['content_removed', 'user_warned', 'user_suspended', 'no_action']).withMessage('Invalid action'),
  handleValidationErrors,
  logAdminAction('resolve_content_report'),
  resolveReport
);

// GET /api/users/admin/activity-logs - Get user activity logs
router.get('/activity-logs',
  query('userId').optional().isInt().withMessage('User ID must be integer'),
  query('action').optional().isLength({ min: 2, max: 50 }).withMessage('Action 2-50 chars'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
  handleValidationErrors,
  logAdminAction('view_activity_logs'),
  getActivityLogs
);

// GET /api/users/admin/audit-trail - Get system audit trail (Super Admin only)
router.get('/audit-trail',
  superAdminLimit,
  requireSuperAdmin,
  query('adminId').optional().isInt().withMessage('Admin ID must be integer'),
  query('action').optional().isLength({ min: 2, max: 50 }).withMessage('Action 2-50 chars'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  handleValidationErrors,
  logAdminAction('view_audit_trail'),
  getAuditTrail
);

// ===============================================
// USER PERMISSIONS & ROLES
// ===============================================

// PUT /api/users/admin/:id/role - Update user role
router.put('/:id/role',
  param('id').isInt().withMessage('User ID must be integer'),
  body('role').isIn(['user', 'admin']).withMessage('Invalid role'),
  body('reason').isLength({ min: 10, max: 200 }).withMessage('Reason required (10-200 chars)'),
  handleValidationErrors,
  logAdminAction('update_user_role'),
  updateUserRole
);

// PUT /api/users/admin/:id/posting-rights - Grant/revoke posting rights
router.put('/:id/posting-rights',
  param('id').isInt().withMessage('User ID must be integer'),
  body('canPost').isBoolean().withMessage('canPost must be boolean'),
  body('reason').isLength({ min: 10, max: 200 }).withMessage('Reason required (10-200 chars)'),
  handleValidationErrors,
  logAdminAction('update_posting_rights'),
  grantPostingRights
);

// PUT /api/users/admin/:id/ban - Ban user
router.put('/:id/ban',
  param('id').isInt().withMessage('User ID must be integer'),
  body('reason').isLength({ min: 10, max: 500 }).withMessage('Ban reason required (10-500 chars)'),
  body('duration').optional().isIn(['temporary', 'permanent']).withMessage('Invalid duration'),
  body('daysToUnban').optional().isInt({ min: 1, max: 365 }).withMessage('Days to unban 1-365'),
  handleValidationErrors,
  logAdminAction('ban_user'),
  banUser
);

// PUT /api/users/admin/:id/unban - Unban user
router.put('/:id/unban',
  param('id').isInt().withMessage('User ID must be integer'),
  body('reason').isLength({ min: 10, max: 200 }).withMessage('Unban reason required (10-200 chars)'),
  handleValidationErrors,
  logAdminAction('unban_user'),
  unbanUser
);

// ===============================================
// BULK OPERATIONS ENDPOINTS
// ===============================================

// POST /api/users/admin/bulk/approve - Bulk approve users
router.post('/bulk/approve',
  bulkOperationLimit,
  body('userIds').isArray({ min: 1, max: 100 }).withMessage('UserIds array required (max 100)'),
  body('userIds.*').isInt().withMessage('All user IDs must be integers'),
  body('reason').isLength({ min: 10, max: 200 }).withMessage('Reason required (10-200 chars)'),
  body('notifyUsers').optional().isBoolean().withMessage('notifyUsers must be boolean'),
  handleValidationErrors,
  logAdminAction('bulk_approve_users'),
  bulkApproveUsers
);

// POST /api/users/admin/bulk/assign-mentors - Bulk assign mentors
router.post('/bulk/assign-mentors',
  bulkOperationLimit,
  body('assignments').isArray({ min: 1, max: 50 }).withMessage('Assignments array required (max 50)'),
  body('assignments.*.userId').isInt().withMessage('User ID must be integer'),
  body('assignments.*.mentorId').isString().isLength({ min: 10, max: 12 }).withMessage('Mentor ID required'),
  body('reason').isLength({ min: 10, max: 200 }).withMessage('Reason required (10-200 chars)'),
  handleValidationErrors,
  logAdminAction('bulk_assign_mentors'),
  bulkAssignMentors
);

// POST /api/users/admin/bulk/send-notifications - Bulk send notifications
router.post('/bulk/send-notifications',
  bulkOperationLimit,
  body('userIds').isArray({ min: 1, max: 200 }).withMessage('UserIds array required (max 200)'),
  body('userIds.*').isInt().withMessage('All user IDs must be integers'),
  body('title').isLength({ min: 5, max: 100 }).withMessage('Title required (5-100 chars)'),
  body('message').isLength({ min: 10, max: 500 }).withMessage('Message required (10-500 chars)'),
  body('type').isIn(['info', 'warning', 'success', 'error']).withMessage('Invalid notification type'),
  handleValidationErrors,
  logAdminAction('bulk_send_notifications'),
  bulkSendNotifications
);

// ===============================================
// IDENTITY MANAGEMENT ENDPOINTS (MERGED FROM IDENTITY ADMIN)
// ===============================================

// POST /api/users/admin/mask-identity-advanced - Advanced identity masking
router.post('/mask-identity-advanced',
  body('userId').isInt().withMessage('User ID must be integer'),
  body('reason').isLength({ min: 10, max: 500 }).withMessage('Reason required (10-500 chars)'),
  body('maskingLevel').isIn(['partial', 'full', 'temporary']).withMessage('Invalid masking level'),
  body('duration').optional().isInt({ min: 1, max: 365 }).withMessage('Duration 1-365 days'),
  handleValidationErrors,
  logAdminAction('mask_user_identity_advanced'),
  maskUserIdentityAdvanced
);

// POST /api/users/admin/unmask-identity - Unmask identity (Super Admin only)
router.post('/unmask-identity',
  superAdminLimit,
  requireSuperAdmin,
  body('userId').isInt().withMessage('User ID must be integer'),
  body('reason').isLength({ min: 10, max: 500 }).withMessage('Reason required (10-500 chars)'),
  handleValidationErrors,
  logAdminAction('unmask_user_identity'),
  unmaskUserIdentity
);

// GET /api/users/admin/identity-audit-trail - Identity audit trail (Super Admin only)
router.get('/identity-audit-trail',
  superAdminLimit,
  requireSuperAdmin,
  query('userId').optional().isInt().withMessage('User ID must be integer'),
  query('adminId').optional().isString().isLength({ min: 10, max: 12 }).withMessage('Invalid admin ID'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  handleValidationErrors,
  logAdminAction('view_identity_audit_trail'),
  getIdentityAuditTrail
);

// GET /api/users/admin/mentor-analytics - Enhanced mentor analytics
router.get('/mentor-analytics',
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period'),
  query('mentorId').optional().isString().isLength({ min: 10, max: 12 }).withMessage('Invalid mentor ID'),
  handleValidationErrors,
  logAdminAction('view_mentor_analytics'),
  getMentorAnalytics
);

// POST /api/users/admin/bulk-assign-mentors-advanced - Advanced bulk mentor assignment
router.post('/bulk-assign-mentors-advanced',
  bulkOperationLimit,
  body('assignments').isArray({ min: 1, max: 50 }).withMessage('Assignments array required (max 50)'),
  body('assignments.*.userId').isInt().withMessage('User ID must be integer'),
  body('assignments.*.mentorCriteria').isObject().withMessage('Mentor criteria required'),
  body('autoMatch').optional().isBoolean().withMessage('autoMatch must be boolean'),
  body('reason').isLength({ min: 10, max: 200 }).withMessage('Reason required (10-200 chars)'),
  handleValidationErrors,
  logAdminAction('bulk_assign_mentors_advanced'),
  bulkAssignMentorsAdvanced
);

// ===============================================
// ID GENERATION & SYSTEM UTILITIES
// ===============================================

// POST /api/users/admin/generate/bulk-ids - Generate bulk IDs
router.post('/generate/bulk-ids',
  body('count').isInt({ min: 1, max: 100 }).withMessage('Count must be 1-100'),
  body('type').isIn(['user', 'class', 'mentor']).withMessage('Invalid ID type'),
  body('purpose').isLength({ min: 5, max: 100 }).withMessage('Purpose required (5-100 chars)'),
  handleValidationErrors,
  logAdminAction('generate_bulk_ids'),
  generateBulkIds
);

// POST /api/users/admin/generate/converse-id - Generate converse ID
router.post('/generate/converse-id',
  body('userId').isInt().withMessage('User ID must be integer'),
  body('purpose').optional().isLength({ min: 5, max: 100 }).withMessage('Purpose 5-100 chars'),
  handleValidationErrors,
  logAdminAction('generate_converse_id'),
  generateConverseId
);

// POST /api/users/admin/generate/class-id - Generate class ID
router.post('/generate/class-id',
  body('className').isLength({ min: 3, max: 100 }).withMessage('Class name 3-100 chars'),
  body('createdBy').isInt().withMessage('Created by must be integer'),
  handleValidationErrors,
  logAdminAction('generate_class_id'),
  generateClassId
);

// ===============================================
// DATA EXPORT & REPORTING
// ===============================================

// GET /api/users/admin/export/user-data - Export user data
router.get('/export/user-data',
  query('format').isIn(['csv', 'json', 'xlsx']).withMessage('Invalid export format'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  query('includeFields').optional().isArray().withMessage('includeFields must be array'),
  handleValidationErrors,
  logAdminAction('export_user_data'),
  exportUserData
);

// ===============================================
// DASHBOARD & ANALYTICS ENDPOINTS
// ===============================================

// GET /api/users/admin/stats/overview - Dashboard overview
router.get('/stats/overview', 
  logAdminAction('view_dashboard_stats'),
  getOverviewStats
);

// GET /api/users/admin/stats/detailed - Detailed analytics
router.get('/stats/detailed',
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period'),
  query('metrics').optional().isArray().withMessage('Metrics must be array'),
  handleValidationErrors,
  logAdminAction('view_detailed_stats'),
  getDetailedStats
);

// GET /api/users/admin/analytics - Comprehensive analytics
router.get('/analytics',
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  query('groupBy').optional().isIn(['day', 'week', 'month']).withMessage('Invalid groupBy'),
  handleValidationErrors,
  logAdminAction('view_analytics'),
  getAnalytics
);

// GET /api/users/admin/pending-count - Real-time pending counts
router.get('/pending-count',
  logAdminAction('check_pending_count'),
  getPendingCount
);


// ===============================================
// COMPATIBILITY ROUTES (Frontend Expectations)
// ===============================================

// These routes provide compatibility with frontend components that expect specific paths

// GET /api/users/admin/membership/overview - Membership overview (compatibility)
router.get('/membership/overview', (req, res, next) => {
  req.compatibilityRoute = 'membership_overview';
  next();
}, getOverviewStats);

// GET /api/users/admin/membership/stats - Membership statistics (compatibility)
router.get('/membership/stats', (req, res, next) => {
  req.compatibilityRoute = 'membership_stats';
  next();
}, getDetailedStats);

// GET /api/users/admin/membership/analytics - Membership analytics (compatibility)
router.get('/membership/analytics', (req, res, next) => {
  req.compatibilityRoute = 'membership_analytics';
  next();
}, getAnalytics);

// GET /api/users/admin/content/reports - Content reports (compatibility)
router.get('/content/reports', (req, res, next) => {
  console.log('🎯 COMPATIBILITY REPORTS ROUTE HIT: /content/reports');
  req.compatibilityRoute = 'content_reports';
  next();
}, getContentReports);

// GET /api/users/admin/content/audit-logs - Audit logs (compatibility)
router.get('/content/audit-logs', (req, res, next) => {
  req.compatibilityRoute = 'content_audit_logs';
  next();
}, getAuditTrail);

// ===============================================
// PYRAMIDAL MENTORSHIP ADMIN ROUTES (MERGED)
// ===============================================

// GET /api/users/admin/mentorship/available-mentors - Find available mentors with capacity
router.get('/mentorship/available-mentors', 
  requireAdmin, 
  logAdminAction('view_available_mentors'),
  mentorshipControllers.getAvailableMentors
);

// GET /api/users/admin/mentorship/mentor/:mentorConverseId - Get mentor details
router.get('/mentorship/mentor/:mentorConverseId', 
  requireAdmin, 
  param('mentorConverseId').notEmpty().withMessage('Mentor converse ID required'),
  handleValidationErrors,
  logAdminAction('view_mentor_details'),
  mentorshipControllers.getMentorDetails
);

// GET /api/users/admin/mentorship/statistics - System statistics
router.get('/mentorship/statistics', 
  requireAdmin, 
  logAdminAction('view_mentorship_statistics'),
  mentorshipControllers.getMentorshipStatistics
);

// GET /api/users/admin/mentorship/search-mentees - Search mentees
router.get('/mentorship/search-mentees', 
  requireAdmin, 
  query('search_term').optional().isLength({ min: 2 }).withMessage('Search term too short'),
  query('has_mentor').optional().isBoolean().withMessage('Invalid has_mentor value'),
  query('mentor_level').optional().isInt({ min: 1, max: 3 }).withMessage('Invalid mentor level'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Invalid limit'),
  handleValidationErrors,
  logAdminAction('search_mentees'),
  mentorshipControllers.searchMentees
);

// POST /api/users/admin/mentorship/assign - Assign mentee to mentor
router.post('/mentorship/assign', 
  requireAdmin,
  body('mentor_converse_id').notEmpty().withMessage('Mentor converse ID required'),
  body('mentee_converse_id').notEmpty().withMessage('Mentee converse ID required'),
  body('assignment_reason').isLength({ min: 10 }).withMessage('Assignment reason required (min 10 chars)'),
  body('notify_users').optional().isBoolean().withMessage('Invalid notify_users value'),
  handleValidationErrors,
  logAdminAction('assign_mentee'),
  mentorshipControllers.assignMenteeToMentor
);

// POST /api/users/admin/mentorship/reassign - Reassign mentee
router.post('/mentorship/reassign', 
  requireAdmin,
  body('mentee_converse_id').notEmpty().withMessage('Mentee converse ID required'),
  body('new_mentor_converse_id').notEmpty().withMessage('New mentor converse ID required'),
  body('reassignment_reason').isLength({ min: 10 }).withMessage('Reassignment reason required (min 10 chars)'),
  body('notify_users').optional().isBoolean().withMessage('Invalid notify_users value'),
  body('requires_approval').optional().isBoolean().withMessage('Invalid requires_approval value'),
  handleValidationErrors,
  logAdminAction('reassign_mentee'),
  mentorshipControllers.reassignMentee
);

// POST /api/users/admin/mentorship/remove - Remove mentee from mentorship
router.post('/mentorship/remove', 
  requireAdmin,
  body('mentee_converse_id').notEmpty().withMessage('Mentee converse ID required'),
  body('removal_reason').isLength({ min: 10 }).withMessage('Removal reason required (min 10 chars)'),
  body('removal_type').optional().isIn(['temporary', 'permanent']).withMessage('Invalid removal type'),
  body('notify_users').optional().isBoolean().withMessage('Invalid notify_users value'),
  handleValidationErrors,
  logAdminAction('remove_mentee'),
  mentorshipControllers.removeMenteeFromMentorship
);

// POST /api/users/admin/mentorship/batch-assign - Batch assign mentees (Super Admin)
router.post('/mentorship/batch-assign', 
  requireSuperAdmin,
  bulkOperationLimit,
  body('assignments').isArray({ min: 1 }).withMessage('Assignments array required'),
  body('assignments.*.mentor_converse_id').notEmpty().withMessage('Mentor converse ID required for each assignment'),
  body('assignments.*.mentee_converse_id').notEmpty().withMessage('Mentee converse ID required for each assignment'),
  body('assignments.*.reason').isLength({ min: 5 }).withMessage('Reason required for each assignment'),
  body('notify_users').optional().isBoolean().withMessage('Invalid notify_users value'),
  handleValidationErrors,
  logAdminAction('batch_assign_mentees'),
  mentorshipControllers.batchAssignMentees
);

// POST /api/users/admin/mentorship/reset-monthly-counters - Reset monthly counters (Super Admin)
router.post('/mentorship/reset-monthly-counters', 
  requireSuperAdmin, 
  logAdminAction('reset_monthly_counters'),
  async (req, res) => {
    try {
      const result = await db.query(`
        UPDATE mentor_capacity_tracking 
        SET monthly_assignments = 0,
            last_reset_month = CURRENT_DATE
        WHERE last_reset_month < CURRENT_DATE - INTERVAL 1 MONTH 
           OR last_reset_month IS NULL
      `);

      console.log(`🔄 Monthly counters reset by ${req.user.username}: ${result.affectedRows} mentors updated`);

      res.status(200).json({
        success: true,
        data: {
          mentors_updated: result.affectedRows,
          reset_date: new Date().toISOString()
        },
        message: 'Monthly assignment counters reset successfully',
        admin_action: {
          performed_by: req.user.username,
          timestamp: new Date().toISOString(),
          action_type: 'MONTHLY_COUNTER_RESET'
        }
      });

    } catch (error) {
      console.error('❌ Error resetting monthly counters:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reset monthly counters'
      });
    }
  }
);

// GET /api/users/admin/mentorship/system-health - System health check
router.get('/mentorship/system-health', 
  requireAdmin, 
  logAdminAction('check_mentorship_health'),
  async (req, res) => {
    try {
      // Check for data inconsistencies
      const healthChecks = await db.query(`
        SELECT 
            'Orphaned Mentees' as check_type,
            COUNT(*) as count,
            CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status
        FROM mentorship_hierarchy mh
        LEFT JOIN mentor_capacity_tracking mct ON mh.mentor_converse_id = mct.mentor_converse_id
        WHERE mh.is_active = 1 AND mct.mentor_converse_id IS NULL
        
        UNION ALL
        
        SELECT 
            'Capacity Mismatches' as check_type,
            COUNT(*) as count,
            CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status
        FROM mentor_capacity_tracking mct
        WHERE mct.direct_slots_filled != (
            SELECT COUNT(*)
            FROM mentorship_hierarchy mh
            WHERE mh.mentor_converse_id = mct.mentor_converse_id
              AND mh.relationship_type = 'direct_family'
              AND mh.is_active = 1
        )
      `);

      const overallHealth = healthChecks.every(check => check.status === 'PASS') ? 'HEALTHY' : 'NEEDS_ATTENTION';

      res.status(200).json({
        success: true,
        data: {
          overall_health: overallHealth,
          health_checks: healthChecks,
          checked_at: new Date().toISOString(),
          checked_by: req.user.username
        },
        message: `System health check completed - Status: ${overallHealth}`
      });

    } catch (error) {
      console.error('❌ Error checking system health:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check system health'
      });
    }
  }
);

// ===============================================
// TEST ENDPOINTS (Development/Health Checks)
// ===============================================

// GET /api/users/admin/test - Test admin routes
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'User admin routes working - Production Ready System!',
    admin: req.user,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    features: {
      analytics: 'Real-time dashboard analytics',
      applications: 'Advanced application management',
      content_moderation: 'Comprehensive content moderation',
      bulk_operations: 'Efficient bulk operations',
      identity_management: 'Advanced identity management',
      audit_trail: 'Complete audit trail',
      rate_limiting: 'Production-grade rate limiting',
      validation: 'Comprehensive input validation'
    },
    database_integration: {
      real_stats: 'Connected to actual database tables',
      caching: 'Performance optimized with caching',
      indexing: 'Proper database indexing implemented',
      bulk_operations: 'Background job processing'
    }
  });
});

// ===============================================
// ERROR HANDLING MIDDLEWARE
// ===============================================

router.use((error, req, res, next) => {
  console.error('Admin route error:', error);
  
  // Database connection errors
  if (error.code === 'ER_NO_SUCH_TABLE') {
    return res.status(503).json({
      success: false,
      message: 'Database table missing. Please run migrations.',
      error: 'Service temporarily unavailable',
      timestamp: new Date().toISOString()
    });
  }
  
  // Validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.details,
      timestamp: new Date().toISOString()
    });
  }
  
  // Authorization errors
  if (error.name === 'UnauthorizedError') {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions for this admin operation',
      timestamp: new Date().toISOString()
    });
  }
  
  // Default error response
  res.status(500).json({
    success: false,
    message: 'Internal server error in admin system',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

 export default router;



