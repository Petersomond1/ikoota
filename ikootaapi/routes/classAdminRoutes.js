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
 * GET /api/classes/admin/test
 * Test endpoint for class admin system
 */
router.get('/test', classAdminController.testAdminSystem);

/**
 * GET /api/classes/admin/health  
 * Health check for class admin system
 */
router.get('/health', classAdminController.getSystemHealth);

// =============================================================================
// CLASS MANAGEMENT ENDPOINTS
// =============================================================================

/**
 * POST /api/classes/admin
 * Create a new class
 */
// Nil
router.post('/', validateClassCreation, classAdminController.createClass);

/**
 * GET /api/classes/admin
 * Get all classes with admin details
 */
// Nil
router.get('/', validatePagination, validateSorting, classAdminController.getAllClasses);

/**
 * GET /api/classes/admin/stats
 * Get system-wide class statistics
 */
// AudienceClassMger.jsx
router.get('/stats', classAdminController.getSystemStats);

/**
 * GET /api/classes/admin/dashboard
 * Get admin dashboard data
 */
// AudienceClassMger.jsx
router.get('/dashboard', classAdminController.getDashboard);

/**
 * GET /api/classes/admin/pending-approvals
 * Get classes or participants pending approval
 */
// AudienceClassMger.jsx
router.get('/pending-approvals', validatePagination, classAdminController.getPendingApprovals);

/**
 * GET /api/classes/admin/:id
 * Get specific class with admin details
 */
// Nil
router.get('/:id', validateClassId, classAdminController.getClassById);

/**
 * PUT /api/classes/admin/:id
 * Update a specific class
 */
// AudienceClassMger.jsx
router.put('/:id', validateClassId, validateClassUpdate, classAdminController.updateClass);

/**
 * DELETE /api/classes/admin/:id
 * Delete a specific class
 */
// AudienceClassMger.jsx
router.delete('/:id', validateClassId, classAdminController.deleteClass);

// =============================================================================
// PARTICIPANT MANAGEMENT
// =============================================================================

/**
 * GET /api/classes/admin/:id/participants
 * Get all participants of a specific class
 */
// Nil
router.get('/:id/participants', validateClassId, validatePagination, validateSorting, classAdminController.getClassParticipants);

/**
 * POST /api/classes/admin/:id/participants
 * Add participants to a class
 */
// Nil
router.post('/:id/participants', validateClassId, classAdminController.addParticipant);

/**
 * PUT /api/classes/admin/:id/participants/:userId
 * Manage a specific class member (approve, reject, change role, etc.)
 */
// Nil
router.put('/:id/participants/:userId', validateClassId, validateMembershipAction, classAdminController.manageParticipant);

/**
 * DELETE /api/classes/admin/:id/participants/:userId
 * Remove a participant from a class
 */
// Nil
router.delete('/:id/participants/:userId', validateClassId, classAdminController.removeParticipant);

/**
 * POST /api/classes/admin/:id/participants/bulk
 * Bulk operations on class participants
 */
// Nil
router.post('/:id/participants/bulk', validateClassId, validateBulkOperation, classAdminController.bulkParticipantActions);

// =============================================================================
// ANALYTICS AND REPORTING
// =============================================================================

/**
 * GET /api/classes/admin/analytics
 * Get comprehensive class analytics
 */
// AudienceClassMger.jsx
router.get('/analytics', validateDateRange, classAdminController.getAnalytics);

/**
 * GET /api/classes/admin/:id/analytics
 * Get specific class analytics
 */
// Nil
router.get('/:id/analytics', validateClassId, classAdminController.getClassAnalytics);

/**
 * GET /api/classes/admin/export
 * Export class data
 */
// AudienceClassMger.jsx with params
router.get('/export', validateDateRange, classAdminController.exportClassData);

/**
 * POST /api/classes/admin/reports
 * Generate custom reports
 */
// AudienceClassMger.jsx
router.post('/reports', validateDateRange, classAdminController.generateReports);

/**
 * GET /api/classes/admin/audit-logs
 * Get audit logs for class operations
 */
// AudienceClassMgr.jsx
router.get('/audit-logs', validatePagination, validateDateRange, classAdminController.getAuditLogs);

// Nil
// Create route to create additions of classes to make a an Audience (groupings of classes) for publication/notifications
/**
 *  POST /api/classes/admin/audience
 *  Create a new audience (grouping of classes)
 *  TODO: Implement createAudience controller function
 */
// router.post('/audience', validateClassCreation, classAdminController.createAudience);


// =============================================================================
// BULK OPERATIONS
// =============================================================================

/**
 * POST /api/classes/admin/bulk-create
 * Bulk create multiple classes
 */
// Nil
router.post('/bulk-create', validateBulkOperation, classAdminController.bulkCreateClasses);


/**
 * DELETE /api/classes/admin/bulk-delete
 * Bulk delete multiple classes
 */
// see AudienceClassMger.jsx
router.delete('/bulk-delete', validateBulkOperation, classAdminController.bulkDeleteClasses);


// =============================================================================
// ADVANCED ADMIN FEATURES
// =============================================================================

/**
 * POST /api/classes/admin/approve-batch
 * Batch approve multiple pending items
 */
// AudienceClassMger.jsx
router.post('/approve-batch', validateBulkOperation, classAdminController.batchApprove);

/**
 * PUT /api/classes/admin/settings
 * Update system-wide class settings
 */
// AudienceClassMger.jsx
router.put('/settings', classAdminController.updateSystemSettings);

// =============================================================================
// CLASS ARCHIVE/RESTORE
// =============================================================================

/**
 * POST /api/classes/admin/:id/archive
 * Archive a class instead of deleting
 */
// Nil
router.post('/:id/archive', validateClassId, classAdminController.archiveClass);

/**
 * POST /api/classes/admin/:id/restore
 * Restore an archived class
 */
// Nil
router.post('/:id/restore', validateClassId, classAdminController.restoreClass);

/**
 * POST /api/classes/admin/:id/duplicate
 * Duplicate a class with options
 */
// Nil
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
      'GET /api/classes/admin - Get all classes',
      'POST /api/classes/admin - Create class',
      'GET /api/classes/admin/:id - Get class details',
      'PUT /api/classes/admin/:id - Update class',
      'DELETE /api/classes/admin/:id - Delete class',
      'GET /api/classes/admin/:id/participants - Get participants',
      'POST /api/classes/admin/:id/participants - Add participant',
      'PUT /api/classes/admin/:id/participants/:userId - Manage participant',
      'DELETE /api/classes/admin/:id/participants/:userId - Remove participant',
      'GET /api/classes/admin/analytics - Get analytics',
      'GET /api/classes/admin/stats - Get statistics',
      'POST /api/classes/admin/bulk-create - Bulk create',
      'PUT /api/classes/admin/bulk-update - Bulk update',
      'DELETE /api/classes/admin/bulk-delete - Bulk delete'
    ],
    note: 'All admin endpoints require admin role',
    timestamp: new Date().toISOString()
  });
});

export default router;

// =============================================================================
// END OF ROUTES FILE
// =============================================================================
















