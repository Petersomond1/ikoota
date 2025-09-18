// ikootaapi/routes/classAdminRoutes.js
// ADMIN CLASS ROUTES - TYPE 2 (Live Teaching) + Admin Management
// Following scheduleClassroomSession.md documentation strictly

import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  validateClassId,
  validatePagination,
  validateSorting,
  validateClassCreation,
  validateClassUpdate,
  validateBulkOperation,
  validateDateRange,
  validateRequestSize,
  validateMembershipAction
} from '../middleware/classValidation.js';
import * as classAdminController from '../controllers/classAdminController.js';

const router = express.Router();

// =============================================================================
// GLOBAL MIDDLEWARE FOR ALL ADMIN ROUTES
// =============================================================================

// Apply request size validation to all routes
router.use(validateRequestSize);

// Require admin authentication for all routes
router.use(authenticate);
router.use(requireRole('admin')); // Admin or super_admin required

// Add route logging middleware
router.use((req, res, next) => {
  console.log(`🔐 Admin Route: ${req.method} ${req.path} - Admin: ${req.user?.id} (${req.user?.role})`);
  next();
});

// =============================================================================
// ADMIN DASHBOARD & CLASS MANAGEMENT
// =============================================================================

/**
 * GET /api/classes/admin/test - Test admin access and functionality
 * Role: Admin
 * Features: Quick test for admin routes and permissions
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Class admin routes working correctly',
    timestamp: new Date().toISOString(),
    admin_user: {
      id: req.user?.id,
      role: req.user?.role,
      converse_id: req.user?.converse_id
    },
    endpoints_available: [
      'GET /api/classes/admin/test',
      'GET /api/classes/admin/dashboard',
      'GET /api/classes/admin',
      'POST /api/classes/admin',
      'GET /api/classes/admin/live/dashboard',
      'GET /api/classes/admin/live/pending'
    ]
  });
});

/**
 * GET /api/classes/admin/dashboard - Admin dashboard data
 * Role: Admin
 * Features: Complete class management, CRUD operations, analytics
 */
router.get('/dashboard',
  classAdminController.getAdminDashboard
);

/**
 * GET /api/classes/admin - Get all classes (Admin view)
 * Role: Admin
 * Features: System statistics, all classes with filters
 */
router.get('/',
  validatePagination,
  validateSorting,
  classAdminController.getAllClassesAdmin
);

/**
 * POST /api/classes/admin - Create new class
 * Role: Admin
 * Features: Create class with full configuration
 */
router.post('/',
  validateClassCreation,
  classAdminController.createClass
);

/**
 * PUT /api/classes/admin/:classId - Update class
 * Role: Admin
 * Features: Update any class property
 */
router.put('/:classId',
  validateClassId,
  validateClassUpdate,
  classAdminController.updateClass
);

/**
 * DELETE /api/classes/admin/:classId - Delete class
 * Role: Admin
 * Features: Soft delete class (set is_active = 0)
 */
router.delete('/:classId',
  validateClassId,
  classAdminController.deleteClass
);

/**
 * GET /api/classes/admin/analytics - System analytics
 * Role: Admin
 * Features: Comprehensive analytics, custom reports, data export
 */
router.get('/analytics',
  validateDateRange,
  classAdminController.getSystemAnalytics
);

// =============================================================================
// PARTICIPANT MANAGEMENT
// =============================================================================

/**
 * GET /api/classes/admin/:classId/participants - Get class participants
 * Role: Admin
 * Features: View all participants with detailed info
 */
router.get('/:classId/participants',
  validateClassId,
  classAdminController.getClassParticipants
);

/**
 * PUT /api/classes/admin/:classId/participants/:userId - Manage participant
 * Role: Admin
 * Features: Add/remove participants, role management
 */
router.put('/:classId/participants/:userId',
  validateClassId,
  validateMembershipAction,
  classAdminController.manageParticipant
);

/**
 * POST /api/classes/admin/:classId/participants/add - Add participants
 * Role: Admin
 * Features: Bulk add participants to class
 */
router.post('/:classId/participants/add',
  validateClassId,
  validateBulkOperation,
  classAdminController.addParticipants
);

// =============================================================================
// TYPE 3: RECORDED CONTENT APPROVAL ROUTES
// Following scheduleClassroomSession.md documentation
// =============================================================================

/**
 * STEP 2: VIEW PENDING CONTENT FOR APPROVAL
 * GET /api/classes/admin/pending-approvals?type=videos
 * Role: Admin
 * Features: Review all pending uploaded content
 */
router.get('/pending-approvals',
  classAdminController.getPendingContentApprovals
);

/**
 * STEP 2: REVIEW CONTENT DETAILS
 * GET /api/classes/admin/:classId/content/:contentId
 * Role: Admin
 * Features: Get detailed content info for review
 */
router.get('/:classId/content/:contentId',
  validateClassId,
  classAdminController.getContentDetails
);

/**
 * STEP 3: APPROVE OR REJECT CONTENT
 * PUT /api/classes/admin/content/:contentId/review
 * Role: Admin
 * Features: Approve/reject uploaded content with notes
 */
router.put('/content/:contentId/review',
  classAdminController.reviewContent
);

// =============================================================================
// TYPE 2: LIVE TEACHING SESSIONS ADMIN ROUTES
// Following scheduleClassroomSession.md documentation
// =============================================================================

/**
 * LIVE CLASS ADMIN DASHBOARD
 * GET /api/classes/admin/live/dashboard
 * Role: Admin
 * Features: Live class management, approvals, monitoring
 */
router.get('/live/dashboard',
  classAdminController.getLiveClassAdminDashboard
);

/**
 * STEP 2: VIEW PENDING LIVE CLASS APPROVALS
 * GET /api/classes/admin/live/pending
 * Role: Admin
 * Features: Get all pending live sessions for approval
 */
router.get('/live/pending',
  classAdminController.getPendingLiveClassApprovals
);

/**
 * STEP 2: ADMIN REVIEWS AND APPROVES
 * PUT /api/classes/admin/live/review/:scheduleId
 * Role: Admin
 * Features: Approve/reject live teaching sessions
 */
router.put('/live/review/:scheduleId',
  classAdminController.reviewLiveClassSchedule
);

/**
 * STEP 3: SEND LIVE CLASS NOTIFICATIONS (MANUAL TRIGGER)
 * POST /api/classes/admin/live/notify/:scheduleId
 * Role: Admin
 * Features: Manually trigger notifications if needed
 */
router.post('/live/notify/:scheduleId',
  classAdminController.triggerLiveClassNotifications
);

/**
 * ADMIN CONTROL LIVE SESSION (START/STOP)
 * POST /api/classes/admin/live/control/:sessionId
 * Role: Admin
 * Features: Force start/stop live sessions
 */
router.post('/live/control/:sessionId',
  classAdminController.adminControlLiveSession
);

// NOTE: Instructor live class routes (schedule, my-sessions, start) are now in classRoutes.js
// to follow the documentation endpoint structure properly

// =============================================================================
// BULK OPERATIONS
// =============================================================================

/**
 * BULK DELETE CLASSES
 * DELETE /api/classes/admin/bulk-delete
 * Role: Super Admin
 * Features: Mass delete multiple classes
 */
router.delete('/bulk-delete',
  requireRole('super_admin'),
  validateBulkOperation,
  (req, res) => {
    // TODO: Implement bulk delete functionality
    res.status(501).json({
      success: false,
      message: 'Bulk delete not yet implemented',
      timestamp: new Date().toISOString()
    });
  }
);

/**
 * BULK UPDATE CLASSES
 * PUT /api/classes/admin/bulk-update
 * Role: Super Admin
 * Features: Mass update multiple classes
 */
router.put('/bulk-update',
  requireRole('super_admin'),
  validateBulkOperation,
  (req, res) => {
    // TODO: Implement bulk update functionality
    res.status(501).json({
      success: false,
      message: 'Bulk update not yet implemented',
      timestamp: new Date().toISOString()
    });
  }
);

/**
 * BATCH APPROVE ITEMS
 * POST /api/classes/admin/approve-batch
 * Role: Admin
 * Features: Batch approve multiple items
 */
router.post('/approve-batch',
  validateBulkOperation,
  (req, res) => {
    // TODO: Implement batch approval functionality
    res.status(501).json({
      success: false,
      message: 'Batch approve not yet implemented',
      timestamp: new Date().toISOString()
    });
  }
);

// =============================================================================
// DATA EXPORT
// =============================================================================

/**
 * EXPORT CLASS DATA
 * GET /api/classes/admin/export
 * Role: Admin
 * Features: Export class data in various formats
 */
router.get('/export',
  validateDateRange,
  (req, res) => {
    // TODO: Implement data export functionality
    res.status(501).json({
      success: false,
      message: 'Data export not yet implemented',
      timestamp: new Date().toISOString()
    });
  }
);

/**
 * GENERATE CUSTOM REPORTS
 * POST /api/classes/admin/reports
 * Role: Admin
 * Features: Generate custom reports with filters
 */
router.post('/reports',
  (req, res) => {
    // TODO: Implement custom reports functionality
    res.status(501).json({
      success: false,
      message: 'Custom reports not yet implemented',
      timestamp: new Date().toISOString()
    });
  }
);

// =============================================================================
// AUDIT LOGS
// =============================================================================

/**
 * GET AUDIT LOGS
 * GET /api/classes/admin/audit-logs
 * Role: Super Admin
 * Features: View all administrative actions
 */
router.get('/audit-logs',
  requireRole('super_admin'),
  validateDateRange,
  validatePagination,
  (req, res) => {
    // TODO: Implement audit logs functionality
    res.status(501).json({
      success: false,
      message: 'Audit logs not yet implemented',
      timestamp: new Date().toISOString()
    });
  }
);

// =============================================================================
// ERROR HANDLING MIDDLEWARE
// =============================================================================

// General error handler
router.use((error, req, res, next) => {
  console.error('❌ Admin Routes Error:', error);
  return res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: error.message || 'An unexpected error occurred in admin routes',
    timestamp: new Date().toISOString()
  });
});

export default router;