// ikootaapi/routes/classAdminRoutes.js
// ADMIN CLASS MANAGEMENT ROUTES
// Clean route definitions with proper middleware

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
} from '../middlewares/classValidation.js';

// Import controllers
import * as classAdminController from '../controllers/classAdminControllers.js';

const router = express.Router();

// =============================================================================
// GLOBAL MIDDLEWARE FOR ALL ADMIN ROUTES
// =============================================================================

// Apply authentication and admin role requirement to all routes
router.use(authenticate);
router.use(requireRole(['admin', 'super_admin']));

// Apply request size validation
router.use(validateRequestSize);

// Add admin route logging
router.use((req, res, next) => {
  console.log(`🔐 Class Admin Route: ${req.method} ${req.originalUrl} - User: ${req.user?.username}`);
  next();
});

// =============================================================================
// HEALTH CHECK AND TEST ROUTES
// =============================================================================

/**
 * GET /api/admin/classes/test
 * Test endpoint for class admin system
 */
router.get('/test', classAdminController.testAdminSystem);

/**
 * GET /api/admin/classes/health  
 * Health check for class admin system
 */
router.get('/health', classAdminController.getSystemHealth);

// =============================================================================
// CLASS MANAGEMENT ENDPOINTS
// =============================================================================

/**
 * POST /api/admin/classes
 * Create a new class
 */
router.post('/', validateClassCreation, classAdminController.createClass);

/**
 * GET /api/admin/classes
 * Get all classes with admin details
 */
router.get('/', validatePagination, validateSorting, classAdminController.getAllClasses);

/**
 * GET /api/admin/classes/:id
 * Get specific class with admin details
 */
router.get('/:id', validateClassId, classAdminController.getClassById);

/**
 * PUT /api/admin/classes/:id
 * Update a specific class
 */
router.put('/:id', validateClassId, validateClassUpdate, classAdminController.updateClass);

/**
 * DELETE /api/admin/classes/:id
 * Delete a specific class
 */
router.delete('/:id', validateClassId, classAdminController.deleteClass);

// =============================================================================
// PARTICIPANT MANAGEMENT
// =============================================================================

/**
 * GET /api/admin/classes/:id/participants
 * Get all participants of a specific class
 */
router.get('/:id/participants', validateClassId, validatePagination, validateSorting, classAdminController.getClassParticipants);

/**
 * POST /api/admin/classes/:id/participants
 * Add participants to a class
 */
router.post('/:id/participants', validateClassId, classAdminController.addParticipant);

/**
 * PUT /api/admin/classes/:id/participants/:userId
 * Manage a specific class member (approve, reject, change role, etc.)
 */
router.put('/:id/participants/:userId', validateClassId, validateMembershipAction, classAdminController.manageParticipant);

/**
 * DELETE /api/admin/classes/:id/participants/:userId
 * Remove a participant from a class
 */
router.delete('/:id/participants/:userId', validateClassId, classAdminController.removeParticipant);

/**
 * POST /api/admin/classes/:id/participants/bulk
 * Bulk operations on class participants
 */
router.post('/:id/participants/bulk', validateClassId, validateBulkOperation, classAdminController.bulkParticipantActions);

// =============================================================================
// ANALYTICS AND REPORTING
// =============================================================================

/**
 * GET /api/admin/classes/analytics
 * Get comprehensive class analytics
 */
router.get('/analytics', validateDateRange, classAdminController.getAnalytics);

/**
 * GET /api/admin/classes/stats
 * Get system-wide class statistics
 */
router.get('/stats', classAdminController.getSystemStats);

/**
 * GET /api/admin/classes/:id/analytics
 * Get specific class analytics
 */
router.get('/:id/analytics', validateClassId, classAdminController.getClassAnalytics);

/**
 * GET /api/admin/classes/export
 * Export class data
 */
router.get('/export', validateDateRange, classAdminController.exportClassData);

/**
 * POST /api/admin/classes/reports
 * Generate custom reports
 */
router.post('/reports', validateDateRange, classAdminController.generateReports);

/**
 * GET /api/admin/classes/audit-logs
 * Get audit logs for class operations
 */
router.get('/audit-logs', validatePagination, validateDateRange, classAdminController.getAuditLogs);

// =============================================================================
// BULK OPERATIONS
// =============================================================================

/**
 * POST /api/admin/classes/bulk-create
 * Bulk create multiple classes
 */
router.post('/bulk-create', validateBulkOperation, classAdminController.bulkCreateClasses);

/**
 * PUT /api/admin/classes/bulk-update
 * Bulk update multiple classes
 */
router.put('/bulk-update', validateBulkOperation, classAdminController.bulkUpdateClasses);

/**
 * DELETE /api/admin/classes/bulk-delete
 * Bulk delete multiple classes
 */
router.delete('/bulk-delete', validateBulkOperation, classAdminController.bulkDeleteClasses);

/**
 * POST /api/admin/classes/bulk-import
 * Import classes from CSV/Excel file
 */
router.post('/bulk-import', classAdminController.bulkImportClasses);

// =============================================================================
// ADVANCED ADMIN FEATURES
// =============================================================================

/**
 * GET /api/admin/classes/dashboard
 * Get admin dashboard data
 */
router.get('/dashboard', classAdminController.getDashboard);

/**
 * GET /api/admin/classes/pending-approvals
 * Get classes or participants pending approval
 */
router.get('/pending-approvals', validatePagination, classAdminController.getPendingApprovals);

/**
 * POST /api/admin/classes/approve-batch
 * Batch approve multiple pending items
 */
router.post('/approve-batch', validateBulkOperation, classAdminController.batchApprove);

/**
 * PUT /api/admin/classes/settings
 * Update system-wide class settings
 */
router.put('/settings', classAdminController.updateSystemSettings);

// =============================================================================
// CLASS ARCHIVE/RESTORE
// =============================================================================

/**
 * POST /api/admin/classes/:id/archive
 * Archive a class instead of deleting
 */
router.post('/:id/archive', validateClassId, classAdminController.archiveClass);

/**
 * POST /api/admin/classes/:id/restore
 * Restore an archived class
 */
router.post('/:id/restore', validateClassId, classAdminController.restoreClass);

/**
 * POST /api/admin/classes/:id/duplicate
 * Duplicate a class with options
 */
router.post('/:id/duplicate', validateClassId, classAdminController.duplicateClass);

// =============================================================================
// ERROR HANDLING MIDDLEWARE
// =============================================================================

/**
 * Handle admin-specific errors
 */
router.use((error, req, res, next) => {
  console.error('🚨 Class Admin Route Error:', error.message);
  
  // Handle specific admin errors
  if (error.code === 'INSUFFICIENT_PERMISSIONS') {
    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions',
      message: 'Admin privileges required for this operation',
      required_role: 'admin',
      user_role: req.user?.role,
      timestamp: new Date().toISOString()
    });
  }
  
  if (error.code === 'BULK_OPERATION_FAILED') {
    return res.status(400).json({
      success: false,
      error: 'Bulk operation failed',
      message: error.message,
      failed_items: error.failedItems || [],
      timestamp: new Date().toISOString()
    });
  }
  
  // Pass to global error handler
  next(error);
});

// =============================================================================
// 404 HANDLER FOR CLASS ADMIN ROUTES
// =============================================================================

router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Class admin endpoint not found',
    path: req.originalUrl,
    method: req.method,
    available_endpoints: [
      'GET /api/admin/classes - Get all classes',
      'POST /api/admin/classes - Create class',
      'GET /api/admin/classes/:id - Get class details',
      'PUT /api/admin/classes/:id - Update class',
      'DELETE /api/admin/classes/:id - Delete class',
      'GET /api/admin/classes/:id/participants - Get participants',
      'POST /api/admin/classes/:id/participants - Add participant',
      'PUT /api/admin/classes/:id/participants/:userId - Manage participant',
      'DELETE /api/admin/classes/:id/participants/:userId - Remove participant',
      'GET /api/admin/classes/analytics - Get analytics',
      'GET /api/admin/classes/stats - Get statistics',
      'POST /api/admin/classes/bulk-create - Bulk create',
      'PUT /api/admin/classes/bulk-update - Bulk update',
      'DELETE /api/admin/classes/bulk-delete - Bulk delete'
    ],
    note: 'All admin endpoints require admin role',
    timestamp: new Date().toISOString()
  });
});

export default router;

// =============================================================================
// END OF ROUTES FILE
// =============================================================================



















// // ikootaapi/routes/classAdminRoutes.js
// // ADMIN CLASS MANAGEMENT ROUTES
// // Handles class administration, analytics, and bulk operations

// import express from 'express';
// import { authenticate, requireRole } from '../middleware/auth.js';
// import {
//   validateClassId,
//   validatePagination,
//   validateSorting,
//   validateClassCreation,
//   validateClassUpdate,
//   validateBulkOperation,
//   validateDateRange,
//   validateRequestSize,
//   validateMembershipAction
// } from '../middlewares/classValidation.js';
// import {
//   createClass,
//   updateClass,
//   deleteClass,
//   getAllClassesAdmin,
//   getClassByIdAdmin,
//   getClassParticipants,
//   manageClassMember,
//   getClassAnalytics,
//   exportClassData,
//   bulkCreateClasses,
//   bulkUpdateClasses,
//   bulkDeleteClasses,
//   getSystemStats,
//   getAuditLogs,
//   generateReports
// } from '../controllers/classAdminControllers.js';

// const router = express.Router();

// // ===============================================
// // GLOBAL MIDDLEWARE FOR ALL ADMIN ROUTES
// // ===============================================

// // Apply authentication and admin role requirement to all routes
// router.use(authenticate);
// router.use(requireRole(['admin', 'super_admin']));

// // Apply request size validation
// router.use(validateRequestSize);

// // Add admin route logging
// router.use((req, res, next) => {
//   console.log(`🔐 Class Admin Route: ${req.method} ${req.originalUrl} - User: ${req.user?.email}`);
//   next();
// });

// // ===============================================
// // ADMIN TEST AND HEALTH CHECK
// // ===============================================

// /**
//  * GET /api/admin/classes/test
//  * Test endpoint for class admin system
//  */
// router.get('/test', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Class admin system is working!',
//     system: 'Class Administration',
//     version: '1.0.0',
//     admin_user: {
//       id: req.user.id,
//       email: req.user.email,
//       role: req.user.role
//     },
//     endpoints: {
//       class_management: [
//         'POST /api/admin/classes - Create class',
//         'GET /api/admin/classes - Get all classes (admin view)',
//         'GET /api/admin/classes/:id - Get class (admin view)',
//         'PUT /api/admin/classes/:id - Update class',
//         'DELETE /api/admin/classes/:id - Delete class'
//       ],
//       participant_management: [
//         'GET /api/admin/classes/:id/participants - Get participants',
//         'PUT /api/admin/classes/:id/participants/:userId - Manage member',
//         'POST /api/admin/classes/:id/participants/bulk - Bulk member operations'
//       ],
//       analytics_and_reports: [
//         'GET /api/admin/classes/analytics - Class analytics',
//         'GET /api/admin/classes/stats - System statistics',
//         'GET /api/admin/classes/export - Export class data',
//         'POST /api/admin/classes/reports - Generate reports'
//       ],
//       bulk_operations: [
//         'POST /api/admin/classes/bulk-create - Bulk create classes',
//         'PUT /api/admin/classes/bulk-update - Bulk update classes',
//         'DELETE /api/admin/classes/bulk-delete - Bulk delete classes'
//       ]
//     },
//     permissions: {
//       can_create_classes: true,
//       can_update_classes: true,
//       can_delete_classes: true,
//       can_manage_participants: true,
//       can_view_analytics: true,
//       can_export_data: true,
//       can_bulk_operations: true
//     },
//     timestamp: new Date().toISOString()
//   });
// });

// /**
//  * GET /api/admin/classes/health
//  * Health check for class admin system
//  */
// router.get('/health', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Class admin system healthy',
//     database_status: 'connected',
//     admin_permissions: 'verified',
//     system_status: 'operational',
//     timestamp: new Date().toISOString()
//   });
// });

// // ===============================================
// // CLASS MANAGEMENT ENDPOINTS
// // ===============================================

// /**
//  * POST /api/admin/classes
//  * Create a new class
//  */
// router.post('/', validateClassCreation, createClass);

// /**
//  * GET /api/admin/classes
//  * Get all classes with admin details
//  */
// router.get('/', validatePagination, validateSorting, getAllClassesAdmin);

// /**
//  * GET /api/admin/classes/:id
//  * Get specific class with admin details
//  */
// router.get('/:id', validateClassId, getClassByIdAdmin);

// /**
//  * PUT /api/admin/classes/:id
//  * Update a specific class
//  */
// router.put('/:id', validateClassId, validateClassUpdate, updateClass);

// /**
//  * DELETE /api/admin/classes/:id
//  * Delete a specific class
//  */
// router.delete('/:id', validateClassId, deleteClass);

// // ===============================================
// // PARTICIPANT MANAGEMENT
// // ===============================================

// /**
//  * GET /api/admin/classes/:id/participants
//  * Get all participants of a specific class
//  */
// router.get('/:id/participants', validateClassId, validatePagination, validateSorting, getClassParticipants);

// /**
//  * PUT /api/admin/classes/:id/participants/:userId
//  * Manage a specific class member (approve, reject, change role, etc.)
//  */
// router.put('/:id/participants/:userId', validateClassId, validateMembershipAction, manageClassMember);

// /**
//  * POST /api/admin/classes/:id/participants/bulk
//  * Bulk operations on class participants
//  */
// router.post('/:id/participants/bulk', validateClassId, validateBulkOperation, (req, res) => {
//   // This would handle bulk participant operations
//   res.json({
//     success: true,
//     message: 'Bulk participant operation endpoint',
//     class_id: req.params.id,
//     operation: req.body.action,
//     participants: req.body.user_ids || [],
//     note: 'Implementation available through class admin controller',
//     timestamp: new Date().toISOString()
//   });
// });

// /**
//  * POST /api/admin/classes/:id/participants/add
//  * Add participants to a class
//  */
// router.post('/:id/participants/add', validateClassId, (req, res) => {
//   res.json({
//     success: true,
//     message: 'Add participants endpoint',
//     class_id: req.params.id,
//     participants_to_add: req.body.user_ids || [],
//     note: 'Implementation available through class admin controller',
//     timestamp: new Date().toISOString()
//   });
// });

// /**
//  * DELETE /api/admin/classes/:id/participants/:userId
//  * Remove a participant from a class
//  */
// router.delete('/:id/participants/:userId', validateClassId, (req, res) => {
//   res.json({
//     success: true,
//     message: 'Remove participant endpoint',
//     class_id: req.params.id,
//     user_id: req.params.userId,
//     note: 'Implementation available through class admin controller',
//     timestamp: new Date().toISOString()
//   });
// });

// // ===============================================
// // ANALYTICS AND REPORTING
// // ===============================================

// /**
//  * GET /api/admin/classes/analytics
//  * Get comprehensive class analytics
//  */
// router.get('/analytics', validateDateRange, getClassAnalytics);

// /**
//  * GET /api/admin/classes/stats
//  * Get system-wide class statistics
//  */
// router.get('/stats', getSystemStats);

// /**
//  * GET /api/admin/classes/export
//  * Export class data
//  */
// router.get('/export', validateDateRange, exportClassData);

// /**
//  * POST /api/admin/classes/reports
//  * Generate custom reports
//  */
// router.post('/reports', validateDateRange, generateReports);

// /**
//  * GET /api/admin/classes/audit-logs
//  * Get audit logs for class operations
//  */
// router.get('/audit-logs', validatePagination, validateDateRange, getAuditLogs);

// // ===============================================
// // BULK OPERATIONS
// // ===============================================

// /**
//  * POST /api/admin/classes/bulk-create
//  * Bulk create multiple classes
//  */
// router.post('/bulk-create', validateBulkOperation, bulkCreateClasses);

// /**
//  * PUT /api/admin/classes/bulk-update
//  * Bulk update multiple classes
//  */
// router.put('/bulk-update', validateBulkOperation, bulkUpdateClasses);

// /**
//  * DELETE /api/admin/classes/bulk-delete
//  * Bulk delete multiple classes
//  */
// router.delete('/bulk-delete', validateBulkOperation, bulkDeleteClasses);

// /**
//  * POST /api/admin/classes/bulk-import
//  * Import classes from CSV/Excel file
//  */
// router.post('/bulk-import', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Bulk import endpoint',
//     supported_formats: ['CSV', 'Excel'],
//     max_file_size: '10MB',
//     max_classes_per_import: 1000,
//     note: 'Implementation available through class admin controller',
//     timestamp: new Date().toISOString()
//   });
// });

// // ===============================================
// // ADVANCED ADMIN FEATURES
// // ===============================================

// /**
//  * GET /api/admin/classes/dashboard
//  * Get admin dashboard data
//  */
// router.get('/dashboard', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Class admin dashboard',
//     dashboard_data: {
//       total_classes: 'Available via controller',
//       active_classes: 'Available via controller',
//       total_participants: 'Available via controller',
//       recent_activity: 'Available via controller',
//       pending_approvals: 'Available via controller',
//       system_alerts: 'Available via controller'
//     },
//     quick_actions: [
//       'Create new class',
//       'Review pending applications',
//       'Generate monthly report',
//       'Export participant data'
//     ],
//     note: 'Full dashboard data available through class admin controller',
//     timestamp: new Date().toISOString()
//   });
// });

// /**
//  * GET /api/admin/classes/pending-approvals
//  * Get classes or participants pending approval
//  */
// router.get('/pending-approvals', validatePagination, (req, res) => {
//   res.json({
//     success: true,
//     message: 'Pending approvals',
//     pending_items: {
//       class_applications: 'Available via controller',
//       participant_requests: 'Available via controller',
//       content_submissions: 'Available via controller'
//     },
//     note: 'Full pending approvals data available through class admin controller',
//     timestamp: new Date().toISOString()
//   });
// });

// /**
//  * POST /api/admin/classes/approve-batch
//  * Batch approve multiple pending items
//  */
// router.post('/approve-batch', validateBulkOperation, (req, res) => {
//   res.json({
//     success: true,
//     message: 'Batch approval endpoint',
//     items_to_approve: req.body.items || [],
//     approval_type: req.body.type,
//     note: 'Implementation available through class admin controller',
//     timestamp: new Date().toISOString()
//   });
// });

// /**
//  * PUT /api/admin/classes/settings
//  * Update system-wide class settings
//  */
// router.put('/settings', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Class system settings',
//     settings: req.body,
//     note: 'Implementation available through class admin controller',
//     timestamp: new Date().toISOString()
//   });
// });

// // ===============================================
// // CONTENT MANAGEMENT
// // ===============================================

// /**
//  * GET /api/admin/classes/:id/content
//  * Get all content associated with a specific class
//  */
// router.get('/:id/content', validateClassId, validatePagination, (req, res) => {
//   res.json({
//     success: true,
//     message: 'Class content management',
//     class_id: req.params.id,
//     content_types: ['announcements', 'assignments', 'resources', 'discussions'],
//     note: 'Implementation available through class admin controller',
//     timestamp: new Date().toISOString()
//   });
// });

// /**
//  * POST /api/admin/classes/:id/content
//  * Add content to a specific class
//  */
// router.post('/:id/content', validateClassId, (req, res) => {
//   res.json({
//     success: true,
//     message: 'Add class content',
//     class_id: req.params.id,
//     content_data: req.body,
//     note: 'Implementation available through class admin controller',
//     timestamp: new Date().toISOString()
//   });
// });

// // ===============================================
// // ERROR HANDLING MIDDLEWARE
// // ===============================================

// /**
//  * Handle admin-specific errors
//  */
// router.use((error, req, res, next) => {
//   console.error('🚨 Class Admin Route Error:', error.message);
  
//   // Handle specific admin errors
//   if (error.code === 'INSUFFICIENT_PERMISSIONS') {
//     return res.status(403).json({
//       success: false,
//       error: 'Insufficient permissions',
//       message: 'Admin privileges required for this operation',
//       required_role: 'admin',
//       user_role: req.user?.role,
//       timestamp: new Date().toISOString()
//     });
//   }
  
//   if (error.code === 'BULK_OPERATION_FAILED') {
//     return res.status(400).json({
//       success: false,
//       error: 'Bulk operation failed',
//       message: error.message,
//       failed_items: error.failedItems || [],
//       timestamp: new Date().toISOString()
//     });
//   }
  
//   if (error.code === 'EXPORT_FAILED') {
//     return res.status(500).json({
//       success: false,
//       error: 'Data export failed',
//       message: error.message,
//       timestamp: new Date().toISOString()
//     });
//   }
  
//   // Pass to global error handler
//   next(error);
// });

// // ===============================================
// // 404 HANDLER FOR CLASS ADMIN ROUTES
// // ===============================================

// router.use('*', (req, res) => {
//   res.status(404).json({
//     success: false,
//     message: 'Class admin endpoint not found',
//     path: req.originalUrl,
//     method: req.method,
//     available_endpoints: {
//       class_management: [
//         'POST /api/admin/classes - Create class',
//         'GET /api/admin/classes - Get all classes (admin)',
//         'GET /api/admin/classes/:id - Get class details (admin)',
//         'PUT /api/admin/classes/:id - Update class',
//         'DELETE /api/admin/classes/:id - Delete class'
//       ],
//       participant_management: [
//         'GET /api/admin/classes/:id/participants - Get participants',
//         'PUT /api/admin/classes/:id/participants/:userId - Manage member',
//         'POST /api/admin/classes/:id/participants/bulk - Bulk operations'
//       ],
//       analytics: [
//         'GET /api/admin/classes/analytics - Analytics',
//         'GET /api/admin/classes/stats - Statistics',
//         'GET /api/admin/classes/export - Export data',
//         'POST /api/admin/classes/reports - Generate reports'
//       ],
//       bulk_operations: [
//         'POST /api/admin/classes/bulk-create - Bulk create',
//         'PUT /api/admin/classes/bulk-update - Bulk update',
//         'DELETE /api/admin/classes/bulk-delete - Bulk delete'
//       ],
//       system: [
//         'GET /api/admin/classes/test - Test endpoint',
//         'GET /api/admin/classes/health - Health check',
//         'GET /api/admin/classes/dashboard - Admin dashboard'
//       ]
//     },
//     note: 'All admin endpoints require admin role',
//     timestamp: new Date().toISOString()
//   });
// });

// // ===============================================
// // EXPORT ROUTER
// // ===============================================

// export default router;