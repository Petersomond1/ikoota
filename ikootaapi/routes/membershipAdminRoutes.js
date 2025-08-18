// ikootaapi/routes/membershipAdminRoutes.js
// ADMIN MEMBERSHIP ROUTES - COMPLETE WITH INDIVIDUAL FUNCTION IMPORTS
// Routes → Controllers → Services with clean separation of concerns

import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';

// ✅ IMPORT INDIVIDUAL CONTROLLER FUNCTIONS (NOT OBJECT)
import {
  // Test & Health
  testAdminConnectivity,
  getSystemHealthController,
  
  // Application Management
  getAllPendingApplications,
  getApplicationByIdController,
  reviewApplicationController,
  bulkReviewApplicationsController,
  
  // Statistics & Analytics  
  getApplicationStatsController,
  getFullMembershipStatsController,
  getMembershipAnalyticsController,
  getMembershipOverviewController,
  
  // User Management
  searchUsersController,
  getAvailableMentorsController,
  
  // System Management
  exportMembershipDataController,
  sendBulkNotificationsController,
  
  // Additional Admin Functions
  getDashboardDataController,
  getAuditLogsController,
  getMembershipMetricsController,
  updateMembershipConfigController,
  getMembershipConfigController,
  bulkUpdateUsersController,
  generateReportController,
  getPendingTasksController,
  completeTaskController,
  getSystemAlertsController,
  dismissAlertController
} from '../controllers/membershipAdminControllers.js';

const router = express.Router();

// ===============================================
// MIDDLEWARE - APPLY TO ALL ADMIN ROUTES
// ===============================================
router.use(authenticate);
router.use(authorize(['admin', 'super_admin']));

// ===============================================
// TEST & CONNECTIVITY ROUTES
// ===============================================

// Test admin routes connectivity
router.get('/test', testAdminConnectivity);

// System health check
router.get('/health', getSystemHealthController);

// ===============================================
// APPLICATION MANAGEMENT ROUTES
// ===============================================

// Get applications with filtering
router.get('/applications', getAllPendingApplications);

// Get specific application 
router.get('/applications/:id', getApplicationByIdController);

// Review individual application
router.put('/applications/:id/review', reviewApplicationController);

// Bulk review applications
router.post('/applications/bulk-review', bulkReviewApplicationsController);

// Legacy bulk endpoints for backward compatibility
router.post('/bulk-review-applications', bulkReviewApplicationsController);
router.post('/bulk-approve', bulkReviewApplicationsController);

// ===============================================
// STATISTICS & ANALYTICS ROUTES  
// ===============================================

// Application statistics
router.get('/stats', getApplicationStatsController);

// Full membership statistics  
router.get('/full-membership-stats', getFullMembershipStatsController);

// Comprehensive membership analytics
router.get('/analytics', getMembershipAnalyticsController);

// Membership overview dashboard
router.get('/overview', getMembershipOverviewController);

// Legacy endpoints for backward compatibility
router.get('/pending-applications', getAllPendingApplications);
router.get('/membership-stats', getFullMembershipStatsController);

// ===============================================
// USER MANAGEMENT ROUTES
// ===============================================

// Search users with advanced filters
router.get('/search-users', searchUsersController);

// Get available mentors
router.get('/mentors', getAvailableMentorsController);

// ===============================================
// SYSTEM MANAGEMENT ROUTES (Super Admin)
// ===============================================

// Export membership data (Super Admin only)
router.get('/export', authorize(['super_admin']), exportMembershipDataController);

// Send bulk notifications (Super Admin only)  
router.post('/notifications', authorize(['super_admin']), sendBulkNotificationsController);

// ===============================================
// ADDITIONAL ADMIN ROUTES
// ===============================================

// Get membership dashboard data
router.get('/dashboard', getDashboardDataController);

// Get audit logs
router.get('/audit-logs', getAuditLogsController);

// Get membership metrics
router.get('/metrics', getMembershipMetricsController);

// Update membership configuration
router.put('/config', authorize(['super_admin']), updateMembershipConfigController);

// Get system configuration
router.get('/config', getMembershipConfigController);

// Bulk user operations
router.post('/users/bulk-update', authorize(['super_admin']), bulkUpdateUsersController);

// Generate reports
router.post('/reports/generate', authorize(['super_admin']), generateReportController);

// Get pending tasks for admin
router.get('/tasks/pending', getPendingTasksController);

// Mark task as completed
router.put('/tasks/:taskId/complete', completeTaskController);

// Get system alerts
router.get('/alerts', getSystemAlertsController);

// Dismiss alert
router.put('/alerts/:alertId/dismiss', dismissAlertController);

// ===============================================
// ERROR HANDLING
// ===============================================

// 404 handler for admin routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Admin membership route not found',
    path: req.path,
    method: req.method,
    availableEndpoints: {
      test: 'GET /test - Test connectivity',
      health: 'GET /health - System health check',
      applications: 'GET /applications - Get applications with filtering',
      applicationById: 'GET /applications/:id - Get specific application',
      reviewApplication: 'PUT /applications/:id/review - Review application',
      bulkReview: 'POST /applications/bulk-review - Bulk review applications',
      stats: 'GET /stats - Application statistics',
      fullMembershipStats: 'GET /full-membership-stats - Full membership statistics',
      analytics: 'GET /analytics - Membership analytics',
      overview: 'GET /overview - Membership overview',
      searchUsers: 'GET /search-users - Search users',
      mentors: 'GET /mentors - Get available mentors',
      dashboard: 'GET /dashboard - Get dashboard data',
      auditLogs: 'GET /audit-logs - Get audit logs',
      metrics: 'GET /metrics - Get membership metrics',
      config: 'GET/PUT /config - Manage system configuration',
      bulkUserUpdate: 'POST /users/bulk-update - Bulk user operations',
      generateReport: 'POST /reports/generate - Generate reports',
      pendingTasks: 'GET /tasks/pending - Get pending tasks',
      completeTask: 'PUT /tasks/:taskId/complete - Complete task',
      alerts: 'GET /alerts - Get system alerts',
      dismissAlert: 'PUT /alerts/:alertId/dismiss - Dismiss alert',
      export: 'GET /export - Export data (super admin)',
      notifications: 'POST /notifications - Send notifications (super admin)'
    },
    note: 'All routes require admin or super_admin role',
    timestamp: new Date().toISOString()
  });
});

// Global error handler for admin routes
router.use((error, req, res, next) => {
  console.error('❌ Admin membership route error:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    user: req.user?.username || 'unauthenticated',
    userRole: req.user?.role,
    body: req.body,
    query: req.query,
    timestamp: new Date().toISOString()
  });
  
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Admin membership operation failed',
    path: req.path,
    method: req.method,
    userRole: req.user?.role,
    errorType: error.name || 'UnknownError',
    timestamp: new Date().toISOString()
  });
});

// Development logging
if (process.env.NODE_ENV === 'development') {
  console.log('🔐 Admin membership routes loaded with individual function imports');
  console.log('   📊 Routes → Controllers → Services architecture implemented');
  console.log('   🛡️ Authentication and authorization middleware applied');
  console.log('   📈 Full admin functionality available with surgical database fixes');
  console.log('   🎯 Available endpoints:');
  console.log('      - Test & Health: /test, /health');
  console.log('      - Applications: /applications, /applications/:id/review');
  console.log('      - Analytics: /stats, /analytics, /overview');
  console.log('      - User Management: /search-users, /mentors');
  console.log('      - Admin Tools: /dashboard, /audit-logs, /metrics');
  console.log('      - System Management: /config, /reports/generate, /alerts');
  console.log('      - Super Admin: /export, /notifications, /users/bulk-update');
  console.log('   🔧 FIXES APPLIED:');
  console.log('      - Removed CAST(sl.user_id AS UNSIGNED) from SQL queries');
  console.log('      - Fixed LIMIT/OFFSET parameter issues');
  console.log('      - Individual function imports instead of service object');
  console.log('      - All existing functionality preserved');
}

export default router;