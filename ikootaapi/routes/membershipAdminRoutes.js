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
  dismissAlertController,
   approveApplicationController,
  declineApplicationController,
  reviewFullMembershipController
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

// api.get('/membership/admin/applications?status=pending' @ Dashboard.jsx
// api.get('/membership/admin/applications?status=pending') @ FullMembershipReviewControls.jsx
// api.get(`/membership/admin/applications?status=${filterStatus}`) @ FullMembershipReviewControls.jsx
// api.put(`/membership/admin/applications/${applicationId}/review`, {status: decision, adminNotes: notes || ''}); @ both Fullmem...
// api.put(`/membership/admin/review-application/${applicationId}` @ FullMembershipReviewControls.jsx
// api.post('/membership/admin/applications/bulk-review', {applicationIds, decision, notes: notes || '' }); @ both Fullmem...
// api.get(`/membership/admin/applications?${params}`); @ UserManagement.jsx
// api.get(`/membership/admin/applications?${params}` @ FullMembershipService.js
// api.get(`/membership/admin/applications/export?${params}` @ FullMembershipService.js
// api.get('/admin/applications', { params }); @ membershipApi.js



//from membershipApi.js
router.post('/application/withdraw', authorize(['admin', 'super_admin']), (req, res, next) => {
  const { reason, applicationType } = req.body;
  withdrawApplication(reason, applicationType)
    .then((result) => res.json(result))
    .catch(next);
});
// ===============================================
// STATISTICS & ANALYTICS ROUTES  
// ===============================================

//from membershipApi.js, fullMembershipService.js, Sidebar.jsx, MembershipReviewControls.jsx, Dashboard.jsx,
// Application statistics
router.get('/stats', getApplicationStatsController);

//from membershipApi.js, FullMembershipReviewControls.jsx, Sidebar.jsx, MembershipReviewControls.jsx, Dashboard.jsx,
// Full membership statistics  
router.get('/full-membership-stats', getFullMembershipStatsController);

//from membershipApi.js,  Dashboard.jsx,
// Comprehensive membership analytics
router.get('/analytics', getMembershipAnalyticsController);

//from membershipApi.js,  UserManagement.jsx,
// Membership overview dashboard
router.get('/overview', getMembershipOverviewController);

// Legacy endpoints for backward compatibility
//from membershipApi.js,  UserManagement.jsx,
router.get('/pending-applications', getAllPendingApplications);
//Nil
router.get('/membership-stats', getFullMembershipStatsController);

// ===============================================
// USER MANAGEMENT ROUTES
// ===============================================

//from membershipApi.js,
// Search users with advanced filters
router.get('/search-users', searchUsersController);

// under classes and users routes @ UserManagement.jsx
// Get available mentors
router.get('/mentors', getAvailableMentorsController);

// ===============================================
// SYSTEM MANAGEMENT ROUTES (Super Admin)
// ===============================================

//from membershipApi.js,
// Export membership data (Super Admin only)
router.get('/export', authorize(['super_admin']), exportMembershipDataController);

// under communication @ UserDashboard.jsx
// Send bulk notifications (Super Admin only)  
router.post('/notifications', authorize(['super_admin']), sendBulkNotificationsController);

// ===============================================
// ADDITIONAL ADMIN ROUTES
// ===============================================

//from membershipApi.js,
// Get membership dashboard data
router.get('/dashboard', getDashboardDataController);

//Nil
// Get audit logs
router.get('/audit-logs', getAuditLogsController);

//Nil
// Get membership metrics
router.get('/metrics', getMembershipMetricsController);

//Nil
// Update membership configuration
router.put('/config', authorize(['super_admin']), updateMembershipConfigController);

//Nil
// Get system configuration
router.get('/config', getMembershipConfigController);

//Nil
// Bulk user operations
router.post('/users/bulk-update', authorize(['super_admin']), bulkUpdateUsersController);

//Nil
// Generate reports
router.post('/reports/generate', authorize(['super_admin']), generateReportController);

//Nil
// Get pending tasks for admin
router.get('/tasks/pending', getPendingTasksController);

//Nil
// Mark task as completed
router.put('/tasks/:taskId/complete', completeTaskController);

//Nil
// Get system alerts
router.get('/alerts', getSystemAlertsController);

//Nil
// Dismiss alert
router.put('/alerts/:alertId/dismiss', dismissAlertController);

// ===============================================
// ADD TO membershipAdminRoutes.js - INDIVIDUAL APPLICATION ACTIONS
// ===============================================

// Add these routes to your existing membershipAdminRoutes.js file:

//from membershipApi.js,
// POST /api/membership/admin/approve-application/:applicationId
router.post('/approve-application/:applicationId', async (req, res) => {
  try {
    const { applicationId } = req.params;
    const approvalData = req.body;
    
    // Validate applicationId parameter
    if (!applicationId || isNaN(parseInt(applicationId))) {
      return res.status(400).json({
        success: false,
        error: 'Valid application ID is required'
      });
    }
    
    // Validate approval data
    if (!approvalData.mentorConverseId && !approvalData.classId) {
      return res.status(400).json({
        success: false,
        error: 'Mentor assignment or class assignment is required for approval',
        required: ['mentorConverseId', 'classId']
      });
    }
    
    const result = await approveApplicationController(applicationId, approvalData, req.user);
    
    res.status(200).json({
      success: true,
      message: 'Application approved successfully',
      applicationId: parseInt(applicationId),
      approvalData,
      approvedBy: req.user.username,
      approvedByUserId: req.user.id,
      timestamp: new Date().toISOString(),
      result
    });
  } catch (error) {
    console.error('❌ Error approving application:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to approve application',
      applicationId: req.params.applicationId,
      timestamp: new Date().toISOString()
    });
  }
});

//from membershipApi.js,
// POST /api/membership/admin/decline-application/:applicationId
router.post('/decline-application/:applicationId', async (req, res) => {
  try {
    const { applicationId } = req.params;
    const declineData = req.body;
    
    // Validate applicationId parameter
    if (!applicationId || isNaN(parseInt(applicationId))) {
      return res.status(400).json({
        success: false,
        error: 'Valid application ID is required'
      });
    }
    
    // Validate decline data
    if (!declineData.reason || declineData.reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Decline reason is required (minimum 10 characters)'
      });
    }
    
    const result = await declineApplicationController(applicationId, declineData, req.user);
    
    res.status(200).json({
      success: true,
      message: 'Application declined successfully',
      applicationId: parseInt(applicationId),
      declinedBy: req.user.username,
      declinedByUserId: req.user.id,
      reason: declineData.reason,
      adminNotes: declineData.adminNotes,
      timestamp: new Date().toISOString(),
      result
    });
  } catch (error) {
    console.error('❌ Error declining application:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to decline application',
      applicationId: req.params.applicationId,
      timestamp: new Date().toISOString()
    });
  }
});

//from membershipApi.js,
// POST /api/membership/admin/review-full-membership/:applicationId
router.post('/review-full-membership/:applicationId', async (req, res) => {
  try {
    const { applicationId } = req.params;
    const reviewData = req.body;
    
    // Validate applicationId parameter
    if (!applicationId || isNaN(parseInt(applicationId))) {
      return res.status(400).json({
        success: false,
        error: 'Valid application ID is required'
      });
    }
    
    // Validate review data
    const validActions = ['approve', 'decline', 'pending', 'request_info'];
    if (!reviewData.action || !validActions.includes(reviewData.action)) {
      return res.status(400).json({
        success: false,
        error: `Invalid action. Must be one of: ${validActions.join(', ')}`,
        validActions
      });
    }
    
    if (reviewData.action === 'decline' && (!reviewData.reason || reviewData.reason.trim().length < 10)) {
      return res.status(400).json({
        success: false,
        error: 'Decline reason is required (minimum 10 characters)'
      });
    }
    
    const result = await reviewFullMembershipController(applicationId, reviewData, req.user);
    
    res.status(200).json({
      success: true,
      message: `Full membership application ${reviewData.action}d successfully`,
      applicationId: parseInt(applicationId),
      action: reviewData.action,
      reviewedBy: req.user.username,
      reviewedByUserId: req.user.id,
      reason: reviewData.reason,
      adminNotes: reviewData.adminNotes,
      timestamp: new Date().toISOString(),
      result
    });
  } catch (error) {
    console.error('❌ Error reviewing full membership application:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to review full membership application',
      applicationId: req.params.applicationId,
      timestamp: new Date().toISOString()
    });
  }
});

// ===============================================
// ADD TO membershipAdminRoutes.js - COMPATIBILITY ROUTE FOR REVIEW
// ===============================================

// Add this route to your existing membershipAdminRoutes.js file for frontend compatibility:

//from membershipApi.js,
// PUT /api/membership/admin/review-application/:applicationId (Frontend compatibility)
router.put('/review-application/:applicationId', async (req, res) => {
  try {
    const { applicationId } = req.params;
    const reviewData = req.body;
    
    // Validate applicationId parameter
    if (!applicationId || isNaN(parseInt(applicationId))) {
      return res.status(400).json({
        success: false,
        error: 'Valid application ID is required'
      });
    }
    
    // This maps to your existing reviewApplicationController but with the path the frontend expects
    const result = await reviewApplicationController(req, res);
    
    // If the controller doesn't handle the response, do it here
    if (!res.headersSent) {
      res.status(200).json({
        success: true,
        message: 'Application reviewed successfully',
        applicationId: parseInt(applicationId),
        reviewData,
        reviewedBy: req.user.username,
        reviewedByUserId: req.user.id,
        timestamp: new Date().toISOString(),
        result
      });
    }
  } catch (error) {
    console.error('❌ Error reviewing application:', error);
    if (!res.headersSent) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to review application',
        applicationId: req.params.applicationId,
        timestamp: new Date().toISOString()
      });
    }
  }
});


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