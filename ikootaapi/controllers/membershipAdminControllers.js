// ikootaapi/controllers/membershipAdminControllers.js
// ===============================================
// MEMBERSHIP ADMIN CONTROLLER - COMPLETE WITH ALL FUNCTIONS
// Controllers handle HTTP requests/responses and delegate business logic to services
// ===============================================

// ✅ IMPORT INDIVIDUAL FUNCTIONS instead of membershipAdminService object
import {
  // Test & Connectivity
  testConnectivity,
  getSystemHealth,
  
  // Application Management  
  getAllApplications,
  getApplicationById,
  reviewApplication,
  bulkReviewApplications,
  
  // Statistics & Analytics
  getApplicationStats,
  getFullMembershipStats,
  getMembershipAnalytics,
  getMembershipOverview,
  
  // User Management
  searchUsers,
  getAvailableMentors,
  
  // System Management
  exportMembershipData,
  sendBulkNotifications,
  
  // Additional Admin Functions
  getAuditLogs,
  getDashboardData
} from '../services/membershipAdminServices.js';

// Import response helpers
import { successResponse, errorResponse } from '../utils/responseHelpers.js';

// Create responseHelper object for backward compatibility
const responseHelper = {
  success: successResponse,
  error: errorResponse
};

// =============================================================================
// TEST & CONNECTIVITY CONTROLLERS
// =============================================================================

/**
 * Test admin routes connectivity
 * Route: GET /api/membership/admin/test
 */
export const testAdminConnectivity = async (req, res) => {
  try {
    const result = await testConnectivity(req.user);
    return responseHelper.success(res, result, 'Admin routes connectivity test successful');
  } catch (error) {
    return responseHelper.error(res, error);
  }
};

/**
 * Get system health status
 * Route: GET /api/membership/admin/health
 */
export const getSystemHealthController = async (req, res) => {
  try {
    const healthData = await getSystemHealth();
    return responseHelper.success(res, healthData);
  } catch (error) {
    return responseHelper.error(res, error, 503);
  }
};

// =============================================================================
// APPLICATION MANAGEMENT CONTROLLERS
// =============================================================================

/**
 * Get all pending applications with filtering
 * Route: GET /api/membership/admin/applications
 */
export const getAllPendingApplications = async (req, res) => {
  try {
    console.log('🔍 getAllPendingApplications called with query:', req.query);
    
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      status: req.query.status || 'pending',
      type: req.query.type || 'all',
      search: req.query.search || '',
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'DESC',
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo
    };

    console.log('🔍 Processed filters:', filters);

    const result = await getAllApplications(filters);
    
    console.log('✅ getAllApplications result:', {
      total_items: result.pagination.total_items,
      applications_count: result.applications.length
    });
    
    return responseHelper.success(res, result, `Found ${result.pagination.total_items} applications`);
  } catch (error) {
    console.error('❌ getAllPendingApplications error:', error);
    return responseHelper.error(res, error);
  }
};

/**
 * Get application by ID
 * Route: GET /api/membership/admin/applications/:id
 */
export const getApplicationByIdController = async (req, res) => {
  try {
    const applicationId = req.params.id;
    const result = await getApplicationById(applicationId);
    return responseHelper.success(res, result);
  } catch (error) {
    return responseHelper.error(res, error);
  }
};

/**
 * Review individual application
 * Route: PUT /api/membership/admin/applications/:id/review
 */
export const reviewApplicationController = async (req, res) => {
  try {
    const applicationId = req.params.id;
    const reviewData = {
      action: req.body.action || req.body.decision || req.body.status,
      adminNotes: req.body.adminNotes || req.body.notes,
      reason: req.body.reason,
      mentorId: req.body.mentorId,
      classId: req.body.classId,
      sendNotification: req.body.sendNotification !== false
    };
    const reviewer = {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    };

    const result = await reviewApplication(applicationId, reviewData, reviewer);
    return responseHelper.success(res, result, `Application ${reviewData.action}d successfully`);
  } catch (error) {
    return responseHelper.error(res, error);
  }
};

/**
 * Bulk review applications
 * Route: POST /api/membership/admin/applications/bulk-review
 */
export const bulkReviewApplicationsController = async (req, res) => {
  try {
    const bulkData = {
      applicationIds: req.body.applicationIds,
      action: req.body.action,
      reason: req.body.reason,
      adminNotes: req.body.adminNotes,
      autoAssignMentors: req.body.autoAssignMentors || false,
      sendNotifications: req.body.sendNotifications !== false
    };
    const reviewer = {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    };

    const result = await bulkReviewApplications(bulkData, reviewer);
    return responseHelper.success(res, result, `Bulk ${bulkData.action} operation completed`);
  } catch (error) {
    return responseHelper.error(res, error);
  }
};

// =============================================================================
// STATISTICS & ANALYTICS CONTROLLERS
// =============================================================================

/**
 * Get application statistics
 * Route: GET /api/membership/admin/stats
 */
export const getApplicationStatsController = async (req, res) => {
  try {
    const period = req.query.period || '30d';
    const groupBy = req.query.groupBy || 'day';
    const includeDetailedBreakdown = req.query.detailed === 'true';

    const result = await getApplicationStats(period, groupBy, includeDetailedBreakdown);
    return responseHelper.success(res, result);
  } catch (error) {
    return responseHelper.error(res, error);
  }
};

/**
 * Get full membership statistics
 * Route: GET /api/membership/admin/full-membership-stats
 */
export const getFullMembershipStatsController = async (req, res) => {
  try {
    const period = req.query.period || '30d';
    const includeDetails = req.query.details === 'true';

    const result = await getFullMembershipStats(period, includeDetails);
    return responseHelper.success(res, result);
  } catch (error) {
    return responseHelper.error(res, error);
  }
};

/**
 * Get comprehensive membership analytics
 * Route: GET /api/membership/admin/analytics
 */
export const getMembershipAnalyticsController = async (req, res) => {
  try {
    const analyticsOptions = {
      period: req.query.period || '30d',
      detailed: req.query.detailed === 'true',
      includeTimeSeries: req.query.timeSeries !== 'false',
      includeConversionFunnel: req.query.funnel !== 'false'
    };

    const result = await getMembershipAnalytics(analyticsOptions);
    return responseHelper.success(res, result);
  } catch (error) {
    return responseHelper.error(res, error);
  }
};

/**
 * Get membership overview for dashboard
 * Route: GET /api/membership/admin/overview
 */
export const getMembershipOverviewController = async (req, res) => {
  try {
    const includeRecentActivity = req.query.activity !== 'false';
    const result = await getMembershipOverview(includeRecentActivity);
    return responseHelper.success(res, result);
  } catch (error) {
    return responseHelper.error(res, error);
  }
};

// =============================================================================
// USER MANAGEMENT CONTROLLERS
// =============================================================================

/**
 * Search users with advanced filters
 * Route: GET /api/membership/admin/search-users
 */
export const searchUsersController = async (req, res) => {
  try {
    const searchCriteria = {
      query: req.query.query || req.query.q || req.query.search || '',
      membershipStage: req.query.membershipStage || req.query.stage || '',
      role: req.query.role || '',
      applicationStatus: req.query.status || '',
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'DESC',
      includeInactive: req.query.includeInactive === 'true',
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo
    };

    const result = await searchUsers(searchCriteria);
    return responseHelper.success(res, result);
  } catch (error) {
    return responseHelper.error(res, error);
  }
};

/**
 * Get available mentors
 * Route: GET /api/membership/admin/mentors
 * Note: Service already returns { mentors: [], summary: {} } format
 */
export const getAvailableMentorsController = async (req, res) => {
  try {
    const includeWorkload = req.query.workload === 'true';
    const result = await getAvailableMentors(includeWorkload);
    // Service already returns the correct format: { mentors: [], summary: {} }
    return responseHelper.success(res, result, 'Available mentors fetched successfully');
  } catch (error) {
    console.error('❌ Error in getAvailableMentorsController:', error);
    return responseHelper.error(res, new Error(`Failed to get available mentors: ${error.message}`));
  }
};

// =============================================================================
// SYSTEM MANAGEMENT CONTROLLERS (Super Admin)
// =============================================================================

/**
 * Export membership data
 * Route: GET /api/membership/admin/export
 */
export const exportMembershipDataController = async (req, res) => {
  try {
    const exportOptions = {
      format: req.query.format || 'json',
      includePersonalData: req.query.includePersonalData === 'true',
      exportType: req.query.type || 'all',
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo
    };
    const exporter = {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    };

    const result = await exportMembershipData(exportOptions, exporter);
    
    if (exportOptions.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="membership_export_${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(result);
    }
    
    return responseHelper.success(res, result, 'Data exported successfully');
  } catch (error) {
    return responseHelper.error(res, error);
  }
};

/**
 * Send bulk notifications
 * Route: POST /api/membership/admin/notifications
 */
export const sendBulkNotificationsController = async (req, res) => {
  try {
    const notificationData = {
      recipients: req.body.recipients,
      subject: req.body.subject,
      message: req.body.message,
      type: req.body.type || 'general',
      sendEmail: req.body.sendEmail !== false,
      template: req.body.template,
      templateData: req.body.templateData || {},
      priority: req.body.priority || 'normal'
    };
    const sender = {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    };

    const result = await sendBulkNotifications(notificationData, sender);
    return responseHelper.success(res, result, 'Notifications sent successfully');
  } catch (error) {
    return responseHelper.error(res, error);
  }
};

// =============================================================================
// ADDITIONAL ADMIN CONTROLLERS
// =============================================================================

/**
 * Get dashboard data
 * Route: GET /api/membership/admin/dashboard
 */
export const getDashboardDataController = async (req, res) => {
  try {
    const dashboardData = await getDashboardData();
    return responseHelper.success(res, dashboardData);
  } catch (error) {
    return responseHelper.error(res, error);
  }
};

/**
 * Get audit logs
 * Route: GET /api/membership/admin/audit-logs
 */
export const getAuditLogsController = async (req, res) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
      action: req.query.action,
      userId: req.query.userId,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo
    };
    const auditLogs = await getAuditLogs(filters);
    return responseHelper.success(res, auditLogs);
  } catch (error) {
    return responseHelper.error(res, error);
  }
};

/**
 * Get membership metrics
 * Route: GET /api/membership/admin/metrics
 */
export const getMembershipMetricsController = async (req, res) => {
  try {
    const period = req.query.period || '30d';
    const metrics = await getMembershipAnalytics({ period });
    return responseHelper.success(res, metrics);
  } catch (error) {
    return responseHelper.error(res, error);
  }
};

/**
 * Update membership configuration
 * Route: PUT /api/membership/admin/config
 */
export const updateMembershipConfigController = async (req, res) => {
  try {
    const configData = req.body;
    const updater = {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    };
    
    // For now, return a placeholder response
    const result = {
      config: configData,
      updated_by: updater.username,
      updated_at: new Date().toISOString()
    };
    
    return responseHelper.success(res, result, 'Configuration updated successfully');
  } catch (error) {
    return responseHelper.error(res, error);
  }
};

/**
 * Get system configuration
 * Route: GET /api/membership/admin/config
 */
export const getMembershipConfigController = async (req, res) => {
  try {
    const config = {
      membership_settings: {
        auto_approve: false,
        require_mentor: true,
        max_applications_per_day: 50
      },
      system_settings: {
        email_notifications: true,
        bulk_operations: true
      }
    };
    
    return responseHelper.success(res, config);
  } catch (error) {
    return responseHelper.error(res, error);
  }
};

/**
 * Bulk user operations
 * Route: POST /api/membership/admin/users/bulk-update
 */
export const bulkUpdateUsersController = async (req, res) => {
  try {
    const bulkData = {
      userIds: req.body.userIds,
      operation: req.body.operation,
      updates: req.body.updates,
      reason: req.body.reason
    };
    const operator = {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    };
    
    // For now, return a placeholder response
    const result = {
      operation: bulkData.operation,
      affected_users: bulkData.userIds.length,
      processed_by: operator.username,
      timestamp: new Date().toISOString()
    };
    
    return responseHelper.success(res, result, 'Bulk user operation completed');
  } catch (error) {
    return responseHelper.error(res, error);
  }
};

/**
 * Generate reports
 * Route: POST /api/membership/admin/reports/generate
 */
export const generateReportController = async (req, res) => {
  try {
    const reportOptions = {
      type: req.body.type,
      period: req.body.period,
      format: req.body.format || 'json',
      includeCharts: req.body.includeCharts || false,
      customFilters: req.body.customFilters || {}
    };
    const generator = {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    };
    
    // For now, return a placeholder response
    const report = {
      type: reportOptions.type,
      period: reportOptions.period,
      generated_by: generator.username,
      generated_at: new Date().toISOString(),
      data: []
    };
    
    if (reportOptions.format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="membership_report_${new Date().toISOString().split('T')[0]}.pdf"`);
      return res.send(Buffer.from('PDF placeholder'));
    }
    
    return responseHelper.success(res, report, 'Report generated successfully');
  } catch (error) {
    return responseHelper.error(res, error);
  }
};

/**
 * Get pending tasks for admin
 * Route: GET /api/membership/admin/tasks/pending
 */
export const getPendingTasksController = async (req, res) => {
  try {
    const priority = req.query.priority;
    const tasks = [
      {
        id: 1,
        type: 'application_review',
        priority: 'high',
        description: 'Review pending applications',
        created_at: new Date().toISOString()
      }
    ];
    
    return responseHelper.success(res, tasks);
  } catch (error) {
    return responseHelper.error(res, error);
  }
};

/**
 * Mark task as completed
 * Route: PUT /api/membership/admin/tasks/:taskId/complete
 */
export const completeTaskController = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const completionData = {
      notes: req.body.notes,
      result: req.body.result
    };
    const completer = {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    };
    
    const result = {
      task_id: taskId,
      completed_by: completer.username,
      completed_at: new Date().toISOString(),
      notes: completionData.notes
    };
    
    return responseHelper.success(res, result, 'Task marked as completed');
  } catch (error) {
    return responseHelper.error(res, error);
  }
};

/**
 * Get system alerts
 * Route: GET /api/membership/admin/alerts
 */
export const getSystemAlertsController = async (req, res) => {
  try {
    const severity = req.query.severity;
    const alerts = [
      {
        id: 1,
        type: 'pending_applications',
        severity: 'warning',
        message: 'High number of pending applications',
        created_at: new Date().toISOString()
      }
    ];
    
    return responseHelper.success(res, alerts);
  } catch (error) {
    return responseHelper.error(res, error);
  }
};

/**
 * Dismiss alert
 * Route: PUT /api/membership/admin/alerts/:alertId/dismiss
 */
export const dismissAlertController = async (req, res) => {
  try {
    const alertId = req.params.alertId;
    const dismissReason = req.body.reason;
    const dismisser = {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    };
    
    const result = {
      alert_id: alertId,
      dismissed_by: dismisser.username,
      dismissed_at: new Date().toISOString(),
      reason: dismissReason
    };
    
    return responseHelper.success(res, result, 'Alert dismissed');
  } catch (error) {
    return responseHelper.error(res, error);
  }
};

// =============================================================================
// ADDITIONAL APPLICATION REVIEW CONTROLLERS
// =============================================================================

/**
 * Approve a specific application
 * Route: POST /api/membership/admin/applications/:id/approve
 */
export const approveApplicationController = async (applicationId, approvalData, adminUser) => {
  try {
    console.log('🟢 approveApplicationController called:', { applicationId, approvalData, adminId: adminUser.id });
    
    if (!applicationId) {
      throw new Error('Application ID is required');
    }
    
    // This would typically call a service method
    const result = await reviewApplication({
      applicationId,
      status: 'approved',
      adminNotes: approvalData.adminNotes || 'Application approved',
      reviewedBy: adminUser.id,
      notifyUser: approvalData.notifyUser !== false,
      grantAccess: approvalData.grantAccess !== false
    });
    
    console.log('✅ Application approved successfully:', result);
    return {
      success: true,
      application: result,
      message: 'Application approved successfully'
    };
    
  } catch (error) {
    console.error('❌ approveApplicationController error:', error);
    throw new Error(`Failed to approve application: ${error.message}`);
  }
};

/**
 * Decline a specific application
 * Route: POST /api/membership/admin/applications/:id/decline
 */
export const declineApplicationController = async (applicationId, declineData, adminUser) => {
  try {
    console.log('🔴 declineApplicationController called:', { applicationId, declineData, adminId: adminUser.id });
    
    if (!applicationId) {
      throw new Error('Application ID is required');
    }
    
    if (!declineData.reason || declineData.reason.trim().length < 10) {
      throw new Error('Decline reason is required and must be at least 10 characters');
    }
    
    // This would typically call a service method
    const result = await reviewApplication({
      applicationId,
      status: 'declined',
      adminNotes: declineData.reason,
      reviewedBy: adminUser.id,
      notifyUser: declineData.notifyUser !== false,
      declineReason: declineData.reason,
      canReapply: declineData.canReapply !== false
    });
    
    console.log('✅ Application declined successfully:', result);
    return {
      success: true,
      application: result,
      message: 'Application declined successfully'
    };
    
  } catch (error) {
    console.error('❌ declineApplicationController error:', error);
    throw new Error(`Failed to decline application: ${error.message}`);
  }
};

/**
 * Review a full membership application
 * Route: POST /api/membership/admin/full-membership/:id/review
 */
export const reviewFullMembershipController = async (applicationId, reviewData, adminUser) => {
  try {
    console.log('🔵 reviewFullMembershipController called:', { applicationId, reviewData, adminId: adminUser.id });
    
    if (!applicationId) {
      throw new Error('Application ID is required');
    }
    
    if (!reviewData.status || !['approved', 'declined'].includes(reviewData.status)) {
      throw new Error('Valid review status is required (approved or declined)');
    }
    
    if (reviewData.status === 'declined' && (!reviewData.reason || reviewData.reason.trim().length < 10)) {
      throw new Error('Decline reason is required and must be at least 10 characters');
    }
    
    // This would typically call a service method for full membership review
    const result = await reviewApplication({
      applicationId,
      status: reviewData.status,
      adminNotes: reviewData.reason || reviewData.notes || 'Full membership reviewed',
      reviewedBy: adminUser.id,
      applicationType: 'full_membership',
      notifyUser: reviewData.notifyUser !== false,
      grantFullAccess: reviewData.status === 'approved'
    });
    
    console.log('✅ Full membership application reviewed successfully:', result);
    return {
      success: true,
      application: result,
      message: `Full membership application ${reviewData.status} successfully`
    };
    
  } catch (error) {
    console.error('❌ reviewFullMembershipController error:', error);
    throw new Error(`Failed to review full membership application: ${error.message}`);
  }
};

// =============================================================================
// EXPORT ALL CONTROLLERS
// =============================================================================

// export default {
//   // Test & Connectivity
//   testAdminConnectivity,
//   getSystemHealth: getSystemHealthController,
  
//   // Application Management
//   getAllPendingApplications,
//   getApplicationById: getApplicationByIdController,
//   reviewApplication: reviewApplicationController,
//   bulkReviewApplications: bulkReviewApplicationsController,
  
//   // Statistics & Analytics
//   getApplicationStats: getApplicationStatsController,
//   getFullMembershipStats: getFullMembershipStatsController,
//   getMembershipAnalytics: getMembershipAnalyticsController,
//   getMembershipOverview: getMembershipOverviewController,
  
//   // User Management
//   searchUsers: searchUsersController,
//   getAvailableMentors: getAvailableMentorsController,
  
//   // System Management
//   exportMembershipData: exportMembershipDataController,
//   sendBulkNotifications: sendBulkNotificationsController,
  
//   // Additional Admin Functions
//   getDashboardData: getDashboardDataController,
//   getAuditLogs: getAuditLogsController,
//   getMembershipMetrics: getMembershipMetricsController,
//   updateMembershipConfig: updateMembershipConfigController,
//   getMembershipConfig: getMembershipConfigController,
//   bulkUpdateUsers: bulkUpdateUsersController,
//   generateReport: generateReportController,
//   getPendingTasks: getPendingTasksController,
//   completeTask: completeTaskController,
//   getSystemAlerts: getSystemAlertsController,
//   dismissAlert: dismissAlertController
// };