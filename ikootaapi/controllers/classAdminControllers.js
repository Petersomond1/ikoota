// ikootaapi/controllers/classAdminControllers.js
// ADMIN CLASS MANAGEMENT CONTROLLERS
// Request/response handling only - all business logic in services

import * as classAdminService from '../services/classAdminServices.js';
import CustomError from '../utils/CustomError.js';

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Standardized success response
 */
export const successResponse = (res, data = {}, message = 'Operation successful', statusCode = 200) => {
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
export const errorResponse = (res, error, statusCode = 500) => {
  console.error('❌ Controller Error:', error);
  return res.status(statusCode).json({
    success: false,
    error: error.message || 'An error occurred',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

// =============================================================================
// HEALTH CHECK AND TEST ENDPOINTS
// =============================================================================

/**
 * GET /api/classes/admin/test - Test admin system
 */
export const testAdminSystem = async (req, res) => {
  try {
    const testResult = await classAdminService.testSystemConnectivity();
    
    return successResponse(res, {
      test_result: testResult,
      admin_context: {
        admin_id: req.user.id,
        admin_username: req.user.username,
        admin_role: req.user.role
      }
    }, 'Admin system test completed');
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * GET /api/classes/admin/health - System health check
 */
export const getSystemHealth = async (req, res) => {
  try {
    const healthStatus = await classAdminService.getSystemHealthStatus();
    
    return successResponse(res, {
      health_status: healthStatus,
      checked_by: req.user.username
    }, 'System health check completed');
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

// =============================================================================
// CLASS MANAGEMENT ENDPOINTS
// =============================================================================

/**
 * POST /api/classes/admin - Create new class
 */
export const createClass = async (req, res) => {
  try {
    const adminUserId = req.user.id;
    const classData = req.body;
    
    const newClass = await classAdminService.createNewClass(classData, adminUserId);
    
    return successResponse(res, {
      data: newClass,
      admin_action: {
        type: 'class_creation',
        performed_by: req.user.username,
        class_id: newClass.class_id
      }
    }, 'Class created successfully', 201);
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * GET /api/classes/admin - Get all classes with admin details
 */
export const getAllClasses = async (req, res) => {
  try {
    const filters = {
      class_type: req.query.type,
      is_active: req.query.is_active,
      search: req.query.search,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      created_by: req.query.created_by,
      min_members: req.query.min_members,
      max_members: req.query.max_members
    };
    
    const options = {
      page: parseInt(req.query.page || 1),
      limit: parseInt(req.query.limit || 20),
      sort_by: req.query.sort_by || 'createdAt',
      sort_order: req.query.sort_order || 'DESC',
      include_stats: req.query.include_stats !== 'false'
    };
    
    const result = await classAdminService.getAllClassesForAdmin(filters, options);
    
    return successResponse(res, {
      ...result,
      admin_context: {
        admin_id: req.user.id,
        admin_username: req.user.username,
        query_permissions: 'full_access'
      }
    }, 'Classes retrieved successfully');
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * GET /api/classes/admin/:id - Get specific class with admin details
 */
export const getClassById = async (req, res) => {
  try {
    const classId = req.params.id;
    const adminUserId = req.user.id;
    
    const classData = await classAdminService.getClassByIdForAdmin(classId, adminUserId);
    
    return successResponse(res, {
      data: classData,
      admin_view: true,
      admin_context: {
        admin_id: adminUserId,
        admin_role: req.user.role,
        full_access: true
      }
    }, 'Class retrieved successfully');
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 404);
  }
};

/**
 * PUT /api/classes/admin/:id - Update class
 */
export const updateClass = async (req, res) => {
  try {
    const classId = req.params.id;
    const updateData = req.body;
    const adminUserId = req.user.id;
    
    const updatedClass = await classAdminService.updateClassData(classId, updateData, adminUserId);
    
    return successResponse(res, {
      data: updatedClass,
      admin_action: {
        type: 'class_update',
        performed_by: req.user.username,
        class_id: classId,
        updated_fields: Object.keys(updateData)
      }
    }, 'Class updated successfully');
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * DELETE /api/classes/admin/:id - Delete class
 */
export const deleteClass = async (req, res) => {
  try {
    const classId = req.params.id;
    const options = {
      force: req.body.force || false,
      transfer_members_to: req.body.transfer_members_to,
      archive_instead: req.body.archive_instead || false,
      deletion_reason: req.body.deletion_reason
    };
    const adminUserId = req.user.id;
    
    const result = await classAdminService.deleteClassById(classId, options, adminUserId);
    
    return successResponse(res, {
      data: result,
      admin_action: {
        type: 'class_deletion',
        performed_by: req.user.username,
        class_id: classId,
        options: options
      }
    }, `Class ${result.action} successfully`);
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

// =============================================================================
// PARTICIPANT MANAGEMENT ENDPOINTS
// =============================================================================

/**
 * GET /api/classes/admin/:id/participants - Get class participants
 */
export const getClassParticipants = async (req, res) => {
  try {
    const classId = req.params.id;
    const options = {
      page: parseInt(req.query.page || 1),
      limit: parseInt(req.query.limit || 50),
      role_in_class: req.query.role_in_class,
      membership_status: req.query.membership_status,
      search: req.query.search,
      sort_by: req.query.sort_by || 'joinedAt',
      sort_order: req.query.sort_order || 'DESC',
      include_inactive: req.query.include_inactive === 'true',
      date_from: req.query.date_from,
      date_to: req.query.date_to
    };
    
    const result = await classAdminService.getClassParticipantsForAdmin(classId, options);
    
    return successResponse(res, {
      ...result,
      admin_context: {
        admin_id: req.user.id,
        admin_role: req.user.role,
        full_participant_details: true
      },
      class_id: classId
    }, 'Class participants retrieved successfully');
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * POST /api/classes/admin/:id/participants - Add participant to class
 */
export const addParticipant = async (req, res) => {
  try {
    const classId = req.params.id;
    const participantData = req.body;
    const adminUserId = req.user.id;
    
    const result = await classAdminService.addParticipantToClass(classId, participantData, adminUserId);
    
    return successResponse(res, {
      data: result,
      admin_action: {
        type: 'participant_addition',
        performed_by: req.user.username,
        class_id: classId,
        target_user: participantData.user_id || participantData.user_ids
      }
    }, 'Participant(s) added successfully', 201);
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * PUT /api/classes/admin/:id/participants/:userId - Manage participant
 */
export const manageParticipant = async (req, res) => {
  try {
    const classId = req.params.id;
    const userId = req.params.userId;
    const actionData = req.body;
    const adminUserId = req.user.id;
    
    const result = await classAdminService.manageParticipantMembership(classId, userId, actionData, adminUserId);
    
    return successResponse(res, {
      data: result,
      admin_action: {
        type: 'participant_management',
        action: actionData.action,
        performed_by: req.user.username,
        class_id: classId,
        target_user: userId
      }
    }, result.message);
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * DELETE /api/classes/admin/:id/participants/:userId - Remove participant
 */
export const removeParticipant = async (req, res) => {
  try {
    const classId = req.params.id;
    const userId = req.params.userId;
    const options = {
      reason: req.body.reason,
      notify_user: req.body.notify_user !== false
    };
    const adminUserId = req.user.id;
    
    const result = await classAdminService.removeParticipantFromClass(classId, userId, options, adminUserId);
    
    return successResponse(res, {
      data: result,
      admin_action: {
        type: 'participant_removal',
        performed_by: req.user.username,
        class_id: classId,
        target_user: userId,
        reason: options.reason
      }
    }, 'Participant removed successfully');
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * POST /api/classes/admin/:id/participants/bulk - Bulk participant actions
 */
export const bulkParticipantActions = async (req, res) => {
  try {
    const classId = req.params.id;
    const actionData = req.body;
    const adminUserId = req.user.id;
    
    const result = await classAdminService.performBulkParticipantActions(classId, actionData, adminUserId);
    
    return successResponse(res, {
      data: result,
      admin_action: {
        type: 'bulk_participant_action',
        action: actionData.action,
        performed_by: req.user.username,
        class_id: classId,
        affected_count: result.successful?.length || 0
      }
    }, `Bulk ${actionData.action} completed`);
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

// =============================================================================
// ANALYTICS AND REPORTING ENDPOINTS
// =============================================================================

/**
 * GET /api/classes/admin/analytics - Get comprehensive analytics
 */
export const getAnalytics = async (req, res) => {
  try {
    const options = {
      period: req.query.period || '30d',
      class_type: req.query.class_type,
      include_inactive: req.query.include_inactive === 'true',
      breakdown: req.query.breakdown || 'daily',
      date_from: req.query.date_from,
      date_to: req.query.date_to
    };
    
    const analytics = await classAdminService.getComprehensiveAnalytics(options);
    
    return successResponse(res, {
      data: analytics,
      admin_context: {
        admin_id: req.user.id,
        admin_username: req.user.username,
        analytics_scope: 'system_wide'
      }
    }, 'Analytics retrieved successfully');
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * GET /api/classes/admin/stats - Get system statistics
 */
export const getSystemStats = async (req, res) => {
  try {
    const options = {
      summary: req.query.summary !== 'false',
      by_type: req.query.by_type !== 'false',
      by_status: req.query.by_status !== 'false',
      recent_activity: req.query.recent_activity !== 'false'
    };
    
    const stats = await classAdminService.getSystemStatistics(options);
    
    return successResponse(res, {
      data: stats,
      admin_context: {
        admin_id: req.user.id,
        generated_for: req.user.username
      }
    }, 'System statistics retrieved successfully');
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * GET /api/classes/admin/:id/analytics - Get specific class analytics
 */
export const getClassAnalytics = async (req, res) => {
  try {
    const classId = req.params.id;
    const options = {
      period: req.query.period || '30d',
      breakdown: req.query.breakdown || 'daily'
    };
    
    const analytics = await classAdminService.getClassSpecificAnalytics(classId, options);
    
    return successResponse(res, {
      data: analytics,
      class_id: classId,
      admin_context: {
        admin_id: req.user.id,
        admin_username: req.user.username
      }
    }, 'Class analytics retrieved successfully');
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * GET /api/classes/admin/export - Export class data
 */
export const exportClassData = async (req, res) => {
  try {
    const options = {
      format: req.query.format || 'csv',
      include_participants: req.query.include_participants !== 'false',
      include_analytics: req.query.include_analytics === 'true',
      class_ids: req.query.class_ids ? req.query.class_ids.split(',') : null,
      date_from: req.query.date_from,
      date_to: req.query.date_to
    };
    
    const exportResult = await classAdminService.exportClassDataToFile(options, req.user.id);
    
    // Set appropriate headers for file download
    if (options.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="class_export_${Date.now()}.csv"`);
    } else if (options.format === 'excel') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="class_export_${Date.now()}.xlsx"`);
    }
    
    return res.send(exportResult.fileData);
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * POST /api/classes/admin/reports - Generate custom reports
 */
export const generateReports = async (req, res) => {
  try {
    const reportOptions = req.body;
    const adminUserId = req.user.id;
    
    const report = await classAdminService.generateCustomReport(reportOptions, adminUserId);
    
    return successResponse(res, {
      report: report,
      admin_action: {
        type: 'report_generation',
        performed_by: req.user.username,
        report_type: reportOptions.report_type
      }
    }, 'Report generated successfully');
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * GET /api/classes/admin/audit-logs - Get audit logs
 */
export const getAuditLogs = async (req, res) => {
  try {
    const options = {
      page: parseInt(req.query.page || 1),
      limit: parseInt(req.query.limit || 50),
      class_id: req.query.class_id,
      user_id: req.query.user_id,
      action_type: req.query.action_type,
      date_from: req.query.date_from,
      date_to: req.query.date_to
    };
    
    const auditLogs = await classAdminService.getAuditLogEntries(options);
    
    return successResponse(res, {
      ...auditLogs,
      admin_context: {
        admin_id: req.user.id,
        admin_username: req.user.username
      }
    }, 'Audit logs retrieved successfully');
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

// =============================================================================
// BULK OPERATIONS ENDPOINTS
// =============================================================================

/**
 * POST /api/classes/admin/bulk-create - Bulk create classes
 */
export const bulkCreateClasses = async (req, res) => {
  try {
    const classesData = req.body.classes;
    const adminUserId = req.user.id;
    
    const result = await classAdminService.createMultipleClasses(classesData, adminUserId);
    
    return successResponse(res, {
      data: result,
      admin_action: {
        type: 'bulk_class_creation',
        performed_by: req.user.username,
        total_requested: classesData.length,
        successful_count: result.successful.length,
        failed_count: result.failed.length
      }
    }, `Successfully created ${result.successful.length} classes`, 201);
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * PUT /api/classes/admin/bulk-update - Bulk update classes
 */
export const bulkUpdateClasses = async (req, res) => {
  try {
    const { class_ids, updates } = req.body;
    const adminUserId = req.user.id;
    
    const result = await classAdminService.updateMultipleClasses(class_ids, updates, adminUserId);
    
    return successResponse(res, {
      data: result,
      admin_action: {
        type: 'bulk_class_update',
        performed_by: req.user.username,
        total_requested: class_ids.length,
        successful_count: result.successful.length,
        failed_count: result.failed.length,
        updates_applied: Object.keys(updates)
      }
    }, `Successfully updated ${result.successful.length} classes`);
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * DELETE /api/classes/admin/bulk-delete - Bulk delete classes
 */
export const bulkDeleteClasses = async (req, res) => {
  try {
    const { class_ids, ...options } = req.body;
    const adminUserId = req.user.id;
    
    const result = await classAdminService.deleteMultipleClasses(class_ids, options, adminUserId);
    
    return successResponse(res, {
      data: result,
      admin_action: {
        type: 'bulk_class_deletion',
        performed_by: req.user.username,
        total_requested: class_ids.length,
        successful_count: result.successful.length,
        failed_count: result.failed.length,
        force_delete: options.force
      }
    }, `Successfully deleted ${result.successful.length} classes`);
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * POST /api/classes/admin/bulk-import - Import classes from file
 */
export const bulkImportClasses = async (req, res) => {
  try {
    const importData = req.body;
    const adminUserId = req.user.id;
    
    const result = await classAdminService.importClassesFromData(importData, adminUserId);
    
    return successResponse(res, {
      data: result,
      admin_action: {
        type: 'bulk_class_import',
        performed_by: req.user.username,
        import_source: importData.source || 'manual',
        successful_count: result.successful.length,
        failed_count: result.failed.length
      }
    }, `Successfully imported ${result.successful.length} classes`, 201);
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

// =============================================================================
// ADVANCED ADMIN FEATURES
// =============================================================================

/**
 * GET /api/classes/admin/dashboard - Get admin dashboard
 */
export const getDashboard = async (req, res) => {
  try {
    const dashboardData = await classAdminService.getAdminDashboardData(req.user.id);
    
    return successResponse(res, {
      data: dashboardData,
      admin_context: {
        admin_id: req.user.id,
        admin_username: req.user.username,
        admin_role: req.user.role
      }
    }, 'Dashboard data retrieved successfully');
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * GET /api/classes/admin/pending-approvals - Get pending approvals
 */
export const getPendingApprovals = async (req, res) => {
  try {
    const options = {
      page: parseInt(req.query.page || 1),
      limit: parseInt(req.query.limit || 20),
      type: req.query.type // 'classes', 'participants', 'all'
    };
    
    const pendingItems = await classAdminService.getPendingApprovalItems(options);
    
    return successResponse(res, {
      ...pendingItems,
      admin_context: {
        admin_id: req.user.id,
        admin_username: req.user.username
      }
    }, 'Pending approvals retrieved successfully');
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * POST /api/classes/admin/approve-batch - Batch approve items
 */
export const batchApprove = async (req, res) => {
  try {
    const { items, approval_type, reason } = req.body;
    const adminUserId = req.user.id;
    
    const result = await classAdminService.performBatchApproval(items, approval_type, reason, adminUserId);
    
    return successResponse(res, {
      data: result,
      admin_action: {
        type: 'batch_approval',
        performed_by: req.user.username,
        approval_type: approval_type,
        items_approved: result.successful.length
      }
    }, `Successfully approved ${result.successful.length} items`);
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * PUT /api/classes/admin/settings - Update system settings
 */
export const updateSystemSettings = async (req, res) => {
  try {
    const settings = req.body;
    const adminUserId = req.user.id;
    
    const updatedSettings = await classAdminService.updateSystemSettings(settings, adminUserId);
    
    return successResponse(res, {
      data: updatedSettings,
      admin_action: {
        type: 'system_settings_update',
        performed_by: req.user.username,
        updated_settings: Object.keys(settings)
      }
    }, 'System settings updated successfully');
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

// =============================================================================
// CLASS ARCHIVE/RESTORE ENDPOINTS
// =============================================================================

/**
 * POST /api/classes/admin/:id/archive - Archive class
 */
export const archiveClass = async (req, res) => {
  try {
    const classId = req.params.id;
    const options = {
      archive_reason: req.body.archive_reason,
      preserve_data: req.body.preserve_data !== false
    };
    const adminUserId = req.user.id;
    
    const result = await classAdminService.archiveClassById(classId, options, adminUserId);
    
    return successResponse(res, {
      data: result,
      admin_action: {
        type: 'class_archive',
        performed_by: req.user.username,
        class_id: classId,
        reason: options.archive_reason
      }
    }, 'Class archived successfully');
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * POST /api/classes/admin/:id/restore - Restore archived class
 */
export const restoreClass = async (req, res) => {
  try {
    const classId = req.params.id;
    const options = {
      restore_members: req.body.restore_members !== false,
      restoration_reason: req.body.restoration_reason
    };
    const adminUserId = req.user.id;
    
    const result = await classAdminService.restoreClassById(classId, options, adminUserId);
    
    return successResponse(res, {
      data: result,
      admin_action: {
        type: 'class_restoration',
        performed_by: req.user.username,
        class_id: classId,
        reason: options.restoration_reason
      }
    }, 'Class restored successfully');
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * POST /api/classes/admin/:id/duplicate - Duplicate class
 */
export const duplicateClass = async (req, res) => {
  try {
    const classId = req.params.id;
    const options = {
      new_name: req.body.new_name,
      copy_members: req.body.copy_members === true,
      copy_settings: req.body.copy_settings !== false,
      copy_content: req.body.copy_content === true
    };
    const adminUserId = req.user.id;
    
    const result = await classAdminService.duplicateClassById(classId, options, adminUserId);
    
    return successResponse(res, {
      data: result,
      admin_action: {
        type: 'class_duplication',
        performed_by: req.user.username,
        original_class_id: classId,
        new_class_id: result.new_class_id
      }
    }, 'Class duplicated successfully', 201);
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

// =============================================================================
// EXPORT ALL FUNCTIONS
// =============================================================================

export default {
  // Health & Test
  testAdminSystem,
  getSystemHealth,
  
  // Class Management
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
  
  // Participant Management
  getClassParticipants,
  addParticipant,
  manageParticipant,
  removeParticipant,
  bulkParticipantActions,
  
  // Analytics & Reporting
  getAnalytics,
  getSystemStats,
  getClassAnalytics,
  exportClassData,
  generateReports,
  getAuditLogs,
  
  // Bulk Operations
  bulkCreateClasses,
  bulkUpdateClasses,
  bulkDeleteClasses,
  bulkImportClasses,
  
  // Advanced Features
  getDashboard,
  getPendingApprovals,
  batchApprove,
  updateSystemSettings,
  
  // Archive/Restore
  archiveClass,
  restoreClass,
  duplicateClass,
  
  // Utilities
  successResponse,
  errorResponse
};













// // ikootaapi/controllers/classAdminControllers.js
// // ADMIN CLASS MANAGEMENT CONTROLLERS
// // All controllers use services for business logic - no direct DB queries

// import {
//   getClassManagementService,
//   createClassService,
//   updateClassService,
//   deleteClassService,
//   manageClassMembershipService,
//   archiveClassService,
//   restoreClassService,
//   duplicateClassService,
//   getClassEnrollmentStatsService,
//   getClassAnalyticsService,
//   bulkCreateClassesService,
//   bulkUpdateClassesService,
//   bulkDeleteClassesService,
 
//   //getClassByIdService,
 
//   //joinClassService,
  
//  // getClassParticipantsService
// } from '../services/classAdminServices.js';

// import {
//   leaveClassService,
//    getUserClassesService,
//    getAllClassesService,
//   getClassByIdService,
//   getClassParticipantsService,
//   joinClassService
// } from '../services/classServices.js';

// import CustomError from '../utils/CustomError.js';
// import db from '../config/db.js';

// // ===============================================
// // ERROR HANDLING WRAPPER
// // ===============================================

// const asyncHandler = (fn) => {
//   return async (req, res, next) => {
//     try {
//       await fn(req, res, next);
//     } catch (error) {
//       console.error(`❌ Controller error in ${fn.name}:`, error);
      
//       if (error instanceof CustomError) {
//         return res.status(error.statusCode).json({
//           success: false,
//           error: error.message,
//           code: error.code || 'CUSTOM_ERROR',
//           timestamp: new Date().toISOString(),
//           ...(process.env.NODE_ENV === 'development' && { 
//             stack: error.stack,
//             details: error.details 
//           })
//         });
//       }
      
//       // Database constraint errors
//       if (error.code === 'ER_DUP_ENTRY') {
//         return res.status(409).json({
//           success: false,
//           error: 'Duplicate entry detected',
//           code: 'DUPLICATE_ENTRY',
//           timestamp: new Date().toISOString()
//         });
//       }
      
//       if (error.code === 'ER_NO_REFERENCED_ROW_2') {
//         return res.status(400).json({
//           success: false,
//           error: 'Referenced record not found',
//           code: 'INVALID_REFERENCE',
//           timestamp: new Date().toISOString()
//         });
//       }

//       if (error.code === 'ER_BAD_FIELD_ERROR') {
//         return res.status(500).json({
//           success: false,
//           error: 'Database schema mismatch',
//           code: 'SCHEMA_ERROR',
//           timestamp: new Date().toISOString()
//         });
//       }
      
//       // Generic server error
//       res.status(500).json({
//         success: false,
//         error: 'Internal server error',
//         code: 'INTERNAL_ERROR',
//         request_id: req.id || 'unknown',
//         timestamp: new Date().toISOString(),
//         ...(process.env.NODE_ENV === 'development' && { 
//           details: error.message,
//           stack: error.stack 
//         })
//       });
//     }
//   };
// };

// // const asyncHandler = (fn) => {
// //   return async (req, res, next) => {
// //     try {
// //       await fn(req, res, next);
// //     } catch (error) {
// //       console.error(`❌ Admin Controller error in ${fn.name}:`, error);

// //       if (error instanceof CustomError) {
// //         return res.status(error.statusCode).json({
// //           success: false,
// //           error: error.message,
// //           code: error.code || 'ADMIN_ERROR',
// //           admin_action: true,
// //           performed_by: req.user?.id,
// //           timestamp: new Date().toISOString(),
// //           ...(process.env.NODE_ENV === 'development' && { 
// //             stack: error.stack,
// //             details: error.details 
// //           })
// //         });
// //       }

// //       // Database constraint errors
// //       if (error.code === 'ER_DUP_ENTRY') {
// //         return res.status(409).json({
// //           success: false,
// //           error: 'Duplicate entry detected',
// //           code: 'DUPLICATE_ENTRY',
// //           admin_action: true,
// //           timestamp: new Date().toISOString()
// //         });
// //       }

// //       if (error.code === 'ER_NO_REFERENCED_ROW_2') {
// //         return res.status(400).json({
// //           success: false,
// //           error: 'Referenced record not found',
// //           code: 'INVALID_REFERENCE',
// //           admin_action: true,
// //           timestamp: new Date().toISOString()
// //         });
// //       }

// //       if (error.code === 'ER_BAD_FIELD_ERROR') {
// //         return res.status(500).json({
// //           success: false,
// //           error: 'Database schema mismatch - contact system administrator',
// //           code: 'SCHEMA_ERROR',
// //           admin_action: true,
// //           timestamp: new Date().toISOString()
// //         });
// //       }

// //       // Generic server error
// //       res.status(500).json({
// //         success: false,
// //         error: 'Internal server error',
// //         code: 'INTERNAL_ERROR',
// //         admin_action: true,
// //         request_id: req.id || 'unknown',
// //         performed_by: req.user?.id,
// //         timestamp: new Date().toISOString(),
// //         ...(process.env.NODE_ENV === 'development' && { 
// //           details: error.message,
// //           stack: error.stack 
// //         })
// //       });
// //     }
// //   };
// // };


// // ===============================================
// // CLASS MANAGEMENT
// // ===============================================

// /**
//  * GET /classes/admin - Get all classes for management with comprehensive filtering
//  */
// export const getClassManagement = asyncHandler(async (req, res) => {
//   const {
//     page = 1,
//     limit = 20,
//     type,
//     is_active,
//     search,
//     sort_by = 'createdAt',
//     sort_order = 'DESC',
//     include_stats = 'true',
//     date_from,
//     date_to,
//     created_by,
//     min_members,
//     max_members
//   } = req.query;

//   const filters = {
//     class_type: type,
//     is_active: is_active !== undefined ? is_active === 'true' : undefined,
//     search,
//     date_from,
//     date_to,
//     created_by,
//     min_members: min_members ? parseInt(min_members) : undefined,
//     max_members: max_members ? parseInt(max_members) : undefined
//   };

//   const options = {
//     page: parseInt(page),
//     limit: parseInt(limit),
//     sort_by,
//     sort_order: sort_order.toUpperCase(),
//     include_stats: include_stats === 'true'
//   };

//   // Use existing service but add admin context
//   const result = await getAllClassesService(filters, options);

//   res.json({
//     success: true,
//     message: 'Class management data retrieved successfully',
//     ...result,
//     admin_context: {
//       admin_id: req.user.id,
//       admin_username: req.user.username,
//       admin_role: req.user.role,
//       query_permissions: 'full_access'
//     },
//     filters_applied: Object.keys(filters).filter(key => filters[key] !== undefined).length,
//     timestamp: new Date().toISOString()
//   });
// });

// /**
//  * POST /classes/admin - Create new class with comprehensive configuration
//  */
// export const createClass = asyncHandler(async (req, res) => {
//   const adminUserId = req.user.id;
//   const {
//     class_name,
//     public_name,
//     description,
//     class_type = 'general',
//     is_public = false,
//     max_members = 50,
//     privacy_level = 'members_only',
//     requirements,
//     instructor_notes,
//     tags,
//     category,
//     difficulty_level,
//     estimated_duration,
//     prerequisites,
//     learning_objectives,
//     auto_approve_members = false,
//     allow_self_join = true,
//     require_approval = true,
//     enable_notifications = true,
//     enable_discussions = true,
//     enable_assignments = false,
//     enable_grading = false,
//     class_schedule,
//     timezone = 'UTC'
//   } = req.body;

//   // Validate required fields
//   if (!class_name) {
//     return res.status(400).json({
//       success: false,
//       error: 'class_name is required',
//       required_fields: ['class_name'],
//       provided_fields: Object.keys(req.body),
//       timestamp: new Date().toISOString()
//     });
//   }

//   // Generate unique class ID in OTU# format
//   const class_id = await generateUniqueClassId();

//   // Process array fields
//   const processedTags = tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [];
//   const processedPrerequisites = prerequisites ? (Array.isArray(prerequisites) ? prerequisites : prerequisites.split(',').map(p => p.trim())) : [];
//   const processedLearningObjectives = learning_objectives ? (Array.isArray(learning_objectives) ? learning_objectives : learning_objectives.split(',').map(l => l.trim())) : [];

//   // Prepare class data for database insertion
//   const classData = {
//     class_id,
//     display_id: class_id, // For display purposes
//     class_name: class_name.trim(),
//     public_name: public_name || class_name,
//     description,
//     class_type,
//     is_public: Boolean(is_public),
//     is_active: true,
//     max_members: parseInt(max_members),
//     privacy_level,
//     requirements,
//     instructor_notes,
//     tags: JSON.stringify(processedTags),
//     category,
//     difficulty_level,
//     estimated_duration: estimated_duration ? parseInt(estimated_duration) : null,
//     prerequisites: JSON.stringify(processedPrerequisites),
//     learning_objectives: JSON.stringify(processedLearningObjectives),
//     auto_approve_members: Boolean(auto_approve_members),
//     allow_self_join: Boolean(allow_self_join),
//     require_approval: Boolean(require_approval),
//     enable_notifications: Boolean(enable_notifications),
//     enable_discussions: Boolean(enable_discussions),
//     enable_assignments: Boolean(enable_assignments),
//     enable_grading: Boolean(enable_grading),
//     class_schedule: class_schedule ? JSON.stringify(class_schedule) : null,
//     timezone,
//     created_by: adminUserId,
//     createdAt: new Date(),
//     updatedAt: new Date()
//   };

//   // Insert into database
//   const insertSql = `
//     INSERT INTO classes (
//       class_id, display_id, class_name, public_name, description, class_type, 
//       is_public, is_active, max_members, privacy_level, requirements, 
//       instructor_notes, tags, category, difficulty_level, estimated_duration,
//       prerequisites, learning_objectives, auto_approve_members, allow_self_join,
//       require_approval, enable_notifications, enable_discussions, enable_assignments,
//       enable_grading, class_schedule, timezone, created_by, createdAt, updatedAt
//     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//   `;

//   const insertValues = [
//     classData.class_id,
//     classData.display_id,
//     classData.class_name,
//     classData.public_name,
//     classData.description,
//     classData.class_type,
//     classData.is_public,
//     classData.is_active,
//     classData.max_members,
//     classData.privacy_level,
//     classData.requirements,
//     classData.instructor_notes,
//     classData.tags,
//     classData.category,
//     classData.difficulty_level,
//     classData.estimated_duration,
//     classData.prerequisites,
//     classData.learning_objectives,
//     classData.auto_approve_members,
//     classData.allow_self_join,
//     classData.require_approval,
//     classData.enable_notifications,
//     classData.enable_discussions,
//     classData.enable_assignments,
//     classData.enable_grading,
//     classData.class_schedule,
//     classData.timezone,
//     classData.created_by,
//     classData.createdAt,
//     classData.updatedAt
//   ];

//   try {
//     const [insertResult] = await db.query(insertSql, insertValues);

//     // Create return object
//     const result = {
//       id: insertResult.insertId,
//       class_id: classData.class_id,
//       display_id: classData.display_id,
//       class_name: classData.class_name,
//       public_name: classData.public_name,
//       description: classData.description,
//       class_type: classData.class_type,
//       is_public: classData.is_public,
//       is_active: classData.is_active,
//       max_members: classData.max_members,
//       total_members: 0,
//       available_spots: classData.max_members,
//       tags: processedTags,
//       category: classData.category,
//       difficulty_level: classData.difficulty_level,
//       created_by: adminUserId,
//       createdAt: classData.createdAt,
//       updatedAt: classData.updatedAt
//     };

//     // Log admin action
//     console.log(`✅ Admin ${req.user.username} (${adminUserId}) created class ${class_id}: ${class_name}`);

//     res.status(201).json({
//       success: true,
//       message: 'Class created successfully',
//       data: result,
//       admin_action: {
//         type: 'class_creation',
//         performed_by: adminUserId,
//         admin_username: req.user.username,
//         class_id,
//         class_name: result.class_name
//       },
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('Error creating class:', error);
//     throw error;
//   }
// });

// /**
//  * GET /classes/admin/:id - Get specific class with administrative details
//  */
// export const getClassById = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const adminUserId = req.user.id;

//   const classData = await getClassByIdService(id, adminUserId);

//   res.json({
//     success: true,
//     message: 'Class retrieved successfully',
//     data: classData,
//     admin_view: true,
//     admin_context: {
//       admin_id: adminUserId,
//       admin_role: req.user.role,
//       full_access: true
//     },
//     timestamp: new Date().toISOString()
//   });
// });

// /**
//  * PUT /classes/admin/:id - Update class with comprehensive field support
//  */
// export const updateClass = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const adminUserId = req.user.id;
//   const updateData = req.body;

//   // Validate that some data is provided
//   if (!updateData || Object.keys(updateData).length === 0) {
//     return res.status(400).json({
//       success: false,
//       error: 'No update data provided',
//       required: 'At least one field to update',
//       timestamp: new Date().toISOString()
//     });
//   }

//   // Process array fields if they're strings
//   if (updateData.tags && typeof updateData.tags === 'string') {
//     updateData.tags = updateData.tags.split(',').map(t => t.trim());
//   }
//   if (updateData.prerequisites && typeof updateData.prerequisites === 'string') {
//     updateData.prerequisites = updateData.prerequisites.split(',').map(p => p.trim());
//   }
//   if (updateData.learning_objectives && typeof updateData.learning_objectives === 'string') {
//     updateData.learning_objectives = updateData.learning_objectives.split(',').map(l => l.trim());
//   }

//   // Prepare update fields and values
//   const updateFields = [];
//   const updateValues = [];

//   // List of updatable fields
//   const updatableFields = [
//     'class_name', 'public_name', 'description', 'class_type', 'is_public', 
//     'is_active', 'max_members', 'privacy_level', 'requirements', 'instructor_notes', 
//     'category', 'difficulty_level', 'estimated_duration', 'auto_approve_members', 
//     'allow_self_join', 'require_approval', 'enable_notifications', 'enable_discussions', 
//     'enable_assignments', 'enable_grading', 'timezone'
//   ];

//   // Process each field
//   for (const field of updatableFields) {
//     if (updateData.hasOwnProperty(field)) {
//       updateFields.push(`${field} = ?`);
      
//       // Special handling for boolean fields
//       if (['is_public', 'is_active', 'auto_approve_members', 'allow_self_join', 
//            'require_approval', 'enable_notifications', 'enable_discussions', 
//            'enable_assignments', 'enable_grading'].includes(field)) {
//         updateValues.push(Boolean(updateData[field]));
//       } else if (['max_members', 'estimated_duration'].includes(field)) {
//         updateValues.push(updateData[field] ? parseInt(updateData[field]) : null);
//       } else {
//         updateValues.push(updateData[field]);
//       }
//     }
//   }

//   // Handle JSON fields
//   if (updateData.tags) {
//     updateFields.push('tags = ?');
//     updateValues.push(JSON.stringify(updateData.tags));
//   }
//   if (updateData.prerequisites) {
//     updateFields.push('prerequisites = ?');
//     updateValues.push(JSON.stringify(updateData.prerequisites));
//   }
//   if (updateData.learning_objectives) {
//     updateFields.push('learning_objectives = ?');
//     updateValues.push(JSON.stringify(updateData.learning_objectives));
//   }
//   if (updateData.class_schedule) {
//     updateFields.push('class_schedule = ?');
//     updateValues.push(JSON.stringify(updateData.class_schedule));
//   }

//   // Add updatedAt
//   updateFields.push('updatedAt = ?');
//   updateValues.push(new Date());

//   // Add WHERE condition
//   updateValues.push(id);

//   if (updateFields.length === 0) {
//     return res.status(400).json({
//       success: false,
//       error: 'No valid fields to update',
//       timestamp: new Date().toISOString()
//     });
//   }

//   const updateSql = `UPDATE classes SET ${updateFields.join(', ')} WHERE class_id = ?`;

//   try {
//     const [updateResult] = await db.query(updateSql, updateValues);

//     if (updateResult.affectedRows === 0) {
//       return res.status(404).json({
//         success: false,
//         error: 'Class not found',
//         class_id: id,
//         timestamp: new Date().toISOString()
//       });
//     }

//     // Get updated class data
//     const [updatedClass] = await db.query(
//       'SELECT * FROM classes WHERE class_id = ?',
//       [id]
//     );

//     if (updatedClass.length === 0) {
//       throw new Error('Failed to retrieve updated class');
//     }

//     const result = updatedClass[0];

//     // Parse JSON fields
//     if (result.tags) {
//       try { result.tags = JSON.parse(result.tags); } catch (e) { result.tags = []; }
//     }
//     if (result.prerequisites) {
//       try { result.prerequisites = JSON.parse(result.prerequisites); } catch (e) { result.prerequisites = []; }
//     }
//     if (result.learning_objectives) {
//       try { result.learning_objectives = JSON.parse(result.learning_objectives); } catch (e) { result.learning_objectives = []; }
//     }
//     if (result.class_schedule) {
//       try { result.class_schedule = JSON.parse(result.class_schedule); } catch (e) { result.class_schedule = null; }
//     }

//     // Log admin action
//     console.log(`✅ Admin ${req.user.username} (${adminUserId}) updated class ${id}. Fields: ${Object.keys(updateData).join(', ')}`);

//     res.json({
//       success: true,
//       message: 'Class updated successfully',
//       data: result,
//       admin_action: {
//         type: 'class_update',
//         performed_by: adminUserId,
//         admin_username: req.user.username,
//         class_id: id,
//         updated_fields: Object.keys(updateData),
//         field_count: Object.keys(updateData).length
//       },
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('Error updating class:', error);
//     throw error;
//   }
// });

// /**
//  * DELETE /classes/admin/:id - Delete or archive class with safety checks
//  */
// export const deleteClass = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const {
//     force = false,
//     transfer_members_to,
//     archive_instead = false,
//     deletion_reason
//   } = req.body;

//   try {
//     // Check if class exists
//     const [existingClass] = await db.query(
//       'SELECT class_id, class_name, (SELECT COUNT(*) FROM user_class_memberships WHERE class_id = ? AND membership_status = "active") as member_count FROM classes WHERE class_id = ?',
//       [id, id]
//     );

//     if (existingClass.length === 0) {
//       return res.status(404).json({
//         success: false,
//         error: 'Class not found',
//         class_id: id,
//         timestamp: new Date().toISOString()
//       });
//     }

//     const classInfo = existingClass[0];
//     const memberCount = classInfo.member_count;

//     // Safety check - prevent deletion of classes with members unless forced
//     if (memberCount > 0 && !force && !archive_instead && !transfer_members_to) {
//       return res.status(400).json({
//         success: false,
//         error: 'Cannot delete class with active members',
//         class_id: id,
//         class_name: classInfo.class_name,
//         member_count: memberCount,
//         options: {
//           force: 'Set force=true to delete anyway',
//           archive_instead: 'Set archive_instead=true to archive',
//           transfer_members_to: 'Provide another class_id to transfer members'
//         },
//         timestamp: new Date().toISOString()
//       });
//     }

//     let result = {};

//     if (archive_instead) {
//       // Archive the class instead of deleting
//       const [archiveResult] = await db.query(
//         'UPDATE classes SET is_active = false, archived_at = ?, archived_by = ?, archive_reason = ? WHERE class_id = ?',
//         [new Date(), req.user.id, deletion_reason || 'Admin archived', id]
//       );

//       result = {
//         action: 'archived',
//         class_id: id,
//         class_name: classInfo.class_name,
//         member_count: memberCount,
//         archived_by: req.user.username,
//         archive_reason: deletion_reason || 'Admin archived'
//       };

//     } else {
//       // Handle member transfer if specified
//       if (transfer_members_to && memberCount > 0) {
//         // Verify target class exists
//         const [targetClass] = await db.query(
//           'SELECT class_id, class_name FROM classes WHERE class_id = ? AND is_active = true',
//           [transfer_members_to]
//         );

//         if (targetClass.length === 0) {
//           return res.status(400).json({
//             success: false,
//             error: 'Target class for member transfer not found or inactive',
//             transfer_target: transfer_members_to,
//             timestamp: new Date().toISOString()
//           });
//         }

//         // Transfer members
//         const [transferResult] = await db.query(
//           'UPDATE user_class_memberships SET class_id = ?, transfer_reason = ?, transferred_at = ? WHERE class_id = ? AND membership_status = "active"',
//           [transfer_members_to, `Original class ${id} deleted`, new Date(), id]
//         );

//         result.members_transferred = {
//           count: transferResult.affectedRows,
//           target_class: transfer_members_to,
//           target_class_name: targetClass[0].class_name
//         };
//       }

//       // Delete the class
//       const [deleteResult] = await db.query(
//         'DELETE FROM classes WHERE class_id = ?',
//         [id]
//       );

//       result = {
//         ...result,
//         action: 'deleted',
//         class_id: id,
//         class_name: classInfo.class_name,
//         member_count: memberCount,
//         deleted_by: req.user.username,
//         deletion_reason: deletion_reason || 'Admin deletion'
//       };
//     }

//     // Log admin action
//     const action = archive_instead ? 'archived' : 'deleted';
//     console.log(`✅ Admin ${req.user.username} (${req.user.id}) ${action} class ${id}. Reason: ${deletion_reason || 'No reason provided'}`);

//     res.json({
//       success: true,
//       message: `Class ${action} successfully`,
//       data: result,
//       admin_action: {
//         type: archive_instead ? 'class_archive' : 'class_deletion',
//         performed_by: req.user.id,
//         admin_username: req.user.username,
//         class_id: id,
//         reason: deletion_reason,
//         safety_options: { force, transfer_members_to, archive_instead }
//       },
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('Error deleting/archiving class:', error);
//     throw error;
//   }
// });

// /**
//  * GET /classes/admin/:id/participants - Get class participants (admin view)
//  */
// export const manageClassParticipants = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const {
//     page = 1,
//     limit = 50,
//     role_in_class,
//     membership_status,
//     search,
//     sort_by = 'joinedAt',
//     sort_order = 'DESC',
//     include_inactive = 'false',
//     date_from,
//     date_to
//   } = req.query;

//   try {
//     // Try service first, fallback to direct implementation
//     let result;
//     try {
//       result = await getClassParticipantsService(id, req.user.id, {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         role_in_class,
//         membership_status,
//         search,
//         sort_by,
//         sort_order,
//         include_inactive: include_inactive === 'true',
//         date_from,
//         date_to,
//         admin_view: true // Flag for enhanced details
//       });
//     } catch (serviceError) {
//       console.log('Service not available, using direct admin participant query');
      
//       // Direct admin query for participants
//       let whereConditions = ['ucm.class_id = ?'];
//       let queryParams = [id];

//       if (role_in_class) {
//         whereConditions.push('ucm.role_in_class = ?');
//         queryParams.push(role_in_class);
//       }

//       if (membership_status) {
//         whereConditions.push('ucm.membership_status = ?');
//         queryParams.push(membership_status);
//       } else {
//         whereConditions.push('ucm.membership_status = "active"');
//       }

//       if (search) {
//         whereConditions.push('(u.username LIKE ? OR u.name LIKE ? OR u.email LIKE ?)');
//         queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
//       }

//       if (date_from) {
//         whereConditions.push('ucm.joinedAt >= ?');
//         queryParams.push(date_from);
//       }

//       if (date_to) {
//         whereConditions.push('ucm.joinedAt <= ?');
//         queryParams.push(date_to);
//       }

//       if (include_inactive === 'false') {
//         whereConditions.push('(ucm.expires_at IS NULL OR ucm.expires_at > NOW())');
//       }

//       const adminParticipantQuery = `
//         SELECT 
//           u.id,
//           u.username,
//           u.name,
//           u.email,
//           u.avatar_url,
//           ucm.role_in_class,
//           ucm.membership_status,
//           ucm.receive_notifications,
//           ucm.joinedAt,
//           ucm.expires_at,
//           ucm.assigned_by,
//           ucm.assignment_reason,
//           ucm.createdAt,
//           ucm.updatedAt,
//           CASE WHEN ucm.expires_at IS NULL OR ucm.expires_at > NOW() THEN true ELSE false END as is_active,
//           assigner.username as assigned_by_username
//         FROM user_class_memberships ucm
//         JOIN users u ON ucm.user_id = u.id
//         LEFT JOIN users assigner ON ucm.assigned_by = assigner.id
//         WHERE ${whereConditions.join(' AND ')}
//         ORDER BY ucm.${sort_by} ${sort_order.toUpperCase()}
//         LIMIT ? OFFSET ?
//       `;

//       queryParams.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

//       const [participants] = await db.query(adminParticipantQuery, queryParams);

//       // Count query
//       const countQuery = `
//         SELECT COUNT(*) as total
//         FROM user_class_memberships ucm
//         JOIN users u ON ucm.user_id = u.id
//         WHERE ${whereConditions.join(' AND ')}
//       `;

//       const [countResult] = await db.query(countQuery, queryParams.slice(0, -2));

//       const totalRecords = countResult[0].total;
//       const totalPages = Math.ceil(totalRecords / parseInt(limit));

//       result = {
//         data: participants,
//         pagination: {
//           page: parseInt(page),
//           limit: parseInt(limit),
//           total_pages: totalPages,
//           total_records: totalRecords,
//           has_next: parseInt(page) < totalPages,
//           has_prev: parseInt(page) > 1
//         },
//         summary: {
//           total_participants: totalRecords,
//           active_participants: participants.filter(p => p.is_active).length,
//           roles: [...new Set(participants.map(p => p.role_in_class))]
//         }
//       };
//     }

//     res.json({
//       success: true,
//       message: 'Class participants retrieved successfully',
//       ...result,
//       admin_context: {
//         admin_id: req.user.id,
//         admin_role: req.user.role,
//         full_participant_details: true
//       },
//       class_id: id,
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('Error in manageClassParticipants:', error);
//     throw error;
//   }
// });

// /**
//  * POST /classes/admin/:id/participants - Add participant to class
//  */
// export const addParticipantToClass = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const {
//     user_id,
//     role_in_class = 'member',
//     receive_notifications = true,
//     expires_at,
//     can_see_class_name = true,
//     assignment_reason
//   } = req.body;

//   if (!user_id) {
//     return res.status(400).json({
//       success: false,
//       error: 'user_id is required',
//       required_fields: ['user_id'],
//       timestamp: new Date().toISOString()
//     });
//   }

//   try {
//     // Check if class exists
//     const [classCheck] = await db.query(
//       'SELECT class_id, class_name, max_members FROM classes WHERE class_id = ? AND is_active = true',
//       [id]
//     );

//     if (classCheck.length === 0) {
//       return res.status(404).json({
//         success: false,
//         error: 'Active class not found',
//         class_id: id,
//         timestamp: new Date().toISOString()
//       });
//     }

//     // Check if user exists
//     const [userCheck] = await db.query(
//       'SELECT id, username FROM users WHERE id = ?',
//       [user_id]
//     );

//     if (userCheck.length === 0) {
//       return res.status(404).json({
//         success: false,
//         error: 'User not found',
//         user_id: user_id,
//         timestamp: new Date().toISOString()
//       });
//     }

//     // Check if user is already a member
//     const [existingMembership] = await db.query(
//       'SELECT membership_status FROM user_class_memberships WHERE user_id = ? AND class_id = ?',
//       [user_id, id]
//     );

//     if (existingMembership.length > 0) {
//       return res.status(409).json({
//         success: false,
//         error: 'User is already a member of this class',
//         current_status: existingMembership[0].membership_status,
//         user_id: user_id,
//         class_id: id,
//         timestamp: new Date().toISOString()
//       });
//     }

//     // Add participant
//     const membershipData = {
//       user_id,
//       class_id: id,
//       role_in_class,
//       membership_status: 'active',
//       receive_notifications: Boolean(receive_notifications),
//       can_see_class_name: Boolean(can_see_class_name),
//       expires_at: expires_at || null,
//       assignment_reason: assignment_reason || null,
//       assigned_by: req.user.id,
//       joinedAt: new Date(),
//       createdAt: new Date(),
//       updatedAt: new Date()
//     };

//     const [insertResult] = await db.query(`
//       INSERT INTO user_class_memberships 
//       (user_id, class_id, role_in_class, membership_status, receive_notifications, 
//        can_see_class_name, expires_at, assignment_reason, assigned_by, joinedAt, createdAt, updatedAt)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `, [
//       membershipData.user_id,
//       membershipData.class_id,
//       membershipData.role_in_class,
//       membershipData.membership_status,
//       membershipData.receive_notifications,
//       membershipData.can_see_class_name,
//       membershipData.expires_at,
//       membershipData.assignment_reason,
//       membershipData.assigned_by,
//       membershipData.joinedAt,
//       membershipData.createdAt,
//       membershipData.updatedAt
//     ]);

//     const result = {
//       id: insertResult.insertId,
//       user_id: membershipData.user_id,
//       username: userCheck[0].username,
//       class_id: id,
//       class_name: classCheck[0].class_name,
//       role_in_class: membershipData.role_in_class,
//       membership_status: membershipData.membership_status,
//       assigned_by: req.user.username,
//       joinedAt: membershipData.joinedAt
//     };

//     // Log admin action
//     console.log(`✅ Admin ${req.user.username} added user ${user_id} to class ${id} as ${role_in_class}`);

//     res.status(201).json({
//       success: true,
//       message: 'Participant added successfully',
//       data: result,
//       admin_action: {
//         type: 'participant_addition',
//         performed_by: req.user.id,
//         admin_username: req.user.username,
//         target_user: user_id,
//         class_id: id,
//         assigned_role: role_in_class
//       },
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('Error adding participant:', error);
//     throw error;
//   }
// });

// /**
//  * POST /classes/admin/:id/participants - Add participant to class
//  */
// // export const addParticipantToClass = asyncHandler(async (req, res) => {
// //   const { id } = req.params;
// //   const {
// //     user_id,
// //     role_in_class = 'member',
// //     receive_notifications = true,
// //     expires_at,
// //     can_see_class_name = true,
// //     assignment_reason
// //   } = req.body;

// //   if (!user_id) {
// //     return res.status(400).json({
// //       success: false,
// //       error: 'user_id is required',
// //       required_fields: ['user_id'],
// //       timestamp: new Date().toISOString()
// //     });
// //   }

// //   try {
// //     // Check if class exists
// //     const [classCheck] = await db.query(
// //       'SELECT class_id, class_name, max_members FROM classes WHERE class_id = ? AND is_active = true',
// //       [id]
// //     );

// //     if (classCheck.length === 0) {
// //       return res.status(404).json({
// //         success: false,
// //         error: 'Active class not found',
// //         class_id: id,
// //         timestamp: new Date().toISOString()
// //       });
// //     }

// //     // Check if user exists
// //     const [userCheck] = await db.query(
// //       'SELECT id, username FROM users WHERE id = ?',
// //       [user_id]
// //     );

// //     if (userCheck.length === 0) {
// //       return res.status(404).json({
// //         success: false,
// //         error: 'User not found',
// //         user_id: user_id,
// //         timestamp: new Date().toISOString()
// //       });
// //     }

// //     // Check if user is already a member
// //     const [existingMembership] = await db.query(
// //       'SELECT membership_status FROM user_class_memberships WHERE user_id = ? AND class_id = ?',
// //       [user_id, id]
// //     );

// //     if (existingMembership.length > 0) {
// //       return res.status(409).json({
// //         success: false,
// //         error: 'User is already a member of this class',
// //         current_status: existingMembership[0].membership_status,
// //         user_id: user_id,
// //         class_id: id,
// //         timestamp: new Date().toISOString()
// //       });
// //     }

// //     // Add participant
// //     const membershipData = {
// //       user_id,
// //       class_id: id,
// //       role_in_class,
// //       membership_status: 'active',
// //       receive_notifications: Boolean(receive_notifications),
// //       can_see_class_name: Boolean(can_see_class_name),
// //       expires_at: expires_at || null,
// //       assignment_reason: assignment_reason || null,
// //       assigned_by: req.user.id,
// //       joinedAt: new Date(),
// //       createdAt: new Date(),
// //       updatedAt: new Date()
// //     };

// //     const [insertResult] = await db.query(`
// //       INSERT INTO user_class_memberships 
// //       (user_id, class_id, role_in_class, membership_status, receive_notifications, 
// //        can_see_class_name, expires_at, assignment_reason, assigned_by, joinedAt, createdAt, updatedAt)
// //       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
// //     `, [
// //       membershipData.user_id,
// //       membershipData.class_id,
// //       membershipData.role_in_class,
// //       membershipData.membership_status,
// //       membershipData.receive_notifications,
// //       membershipData.can_see_class_name,
// //       membershipData.expires_at,
// //       membershipData.assignment_reason,
// //       membershipData.assigned_by,
// //       membershipData.joinedAt,
// //       membershipData.createdAt,
// //       membershipData.updatedAt
// //     ]);

// //     const result = {
// //       id: insertResult.insertId,
// //       user_id: membershipData.user_id,
// //       username: userCheck[0].username,
// //       class_id: id,
// //       class_name: classCheck[0].class_name,
// //       role_in_class: membershipData.role_in_class,
// //       membership_status: membershipData.membership_status,
// //       assigned_by: req.user.username,
// //       joinedAt: membershipData.joinedAt
// //     };

// //     // Log admin action
// //     console.log(`✅ Admin ${req.user.username} added user ${user_id} to class ${id} as ${role_in_class}`);

// //     res.status(201).json({
// //       success: true,
// //       message: 'Participant added successfully',
// //       data: result,
// //       admin_action: {
// //         type: 'participant_addition',
// //         performed_by: req.user.id,
// //         admin_username: req.user.username,
// //         target_user: user_id,
// //         class_id: id,
// //         assigned_role: role_in_class
// //       },
// //       timestamp: new Date().toISOString()
// //     });

// //   } catch (error) {
// //     console.error('Error adding participant:', error);
// //     throw error;
// //   }
// // });

// /**
//  * DELETE /classes/admin/:id/participants/:userId - Remove participant
//  */
// export const removeParticipantFromClass = asyncHandler(async (req, res) => {
//   const { id, userId } = req.params;
//   const { reason, notify_user = true } = req.body;

//   try {
//     // Check if membership exists
//     const [membershipCheck] = await db.query(`
//       SELECT ucm.*, u.username, c.class_name 
//       FROM user_class_memberships ucm
//       JOIN users u ON ucm.user_id = u.id
//       JOIN classes c ON ucm.class_id = c.class_id
//       WHERE ucm.user_id = ? AND ucm.class_id = ?
//     `, [userId, id]);

//     if (membershipCheck.length === 0) {
//       return res.status(404).json({
//         success: false,
//         error: 'Membership not found',
//         user_id: userId,
//         class_id: id,
//         timestamp: new Date().toISOString()
//       });
//     }

//     const membership = membershipCheck[0];

//     // Remove the membership
//     const [deleteResult] = await db.query(
//       'DELETE FROM user_class_memberships WHERE user_id = ? AND class_id = ?',
//       [userId, id]
//     );

//     if (deleteResult.affectedRows === 0) {
//       return res.status(500).json({
//         success: false,
//         error: 'Failed to remove participant',
//         user_id: userId,
//         class_id: id,
//         timestamp: new Date().toISOString()
//       });
//     }

//     const result = {
//       user_id: userId,
//       username: membership.username,
//       class_id: id,
//       class_name: membership.class_name,
//       previous_role: membership.role_in_class,
//       removal_reason: reason || 'Admin removal',
//       removed_by: req.user.username,
//       removed_at: new Date()
//     };

//     // Log admin action
//     console.log(`✅ Admin ${req.user.username} removed user ${userId} from class ${id}. Reason: ${reason || 'No reason provided'}`);

//     res.json({
//       success: true,
//       message: 'Participant removed successfully',
//       data: result,
//       admin_action: {
//         type: 'participant_removal',
//         performed_by: req.user.id,
//         admin_username: req.user.username,
//         target_user: userId,
//         class_id: id,
//         reason: reason
//       },
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('Error removing participant:', error);
//     throw error;
//   }
// });

// /**
//  * DELETE /classes/admin/:id/participants/:userId - Remove participant
//  */
// // export const removeParticipantFromClass = asyncHandler(async (req, res) => {
// //   const { id, userId } = req.params;
// //   const { reason, notify_user = true } = req.body;

// //   try {
// //     // Check if membership exists
// //     const [membershipCheck] = await db.query(`
// //       SELECT ucm.*, u.username, c.class_name 
// //       FROM user_class_memberships ucm
// //       JOIN users u ON ucm.user_id = u.id
// //       JOIN classes c ON ucm.class_id = c.class_id
// //       WHERE ucm.user_id = ? AND ucm.class_id = ?
// //     `, [userId, id]);

// //     if (membershipCheck.length === 0) {
// //       return res.status(404).json({
// //         success: false,
// //         error: 'Membership not found',
// //         user_id: userId,
// //         class_id: id,
// //         timestamp: new Date().toISOString()
// //       });
// //     }

// //     const membership = membershipCheck[0];

// //     // Remove the membership
// //     const [deleteResult] = await db.query(
// //       'DELETE FROM user_class_memberships WHERE user_id = ? AND class_id = ?',
// //       [userId, id]
// //     );

// //     if (deleteResult.affectedRows === 0) {
// //       return res.status(500).json({
// //         success: false,
// //         error: 'Failed to remove participant',
// //         user_id: userId,
// //         class_id: id,
// //         timestamp: new Date().toISOString()
// //       });
// //     }

// //     const result = {
// //       user_id: userId,
// //       username: membership.username,
// //       class_id: id,
// //       class_name: membership.class_name,
// //       previous_role: membership.role_in_class,
// //       removal_reason: reason || 'Admin removal',
// //       removed_by: req.user.username,
// //       removed_at: new Date()
// //     };

// //     // Log admin action
// //     console.log(`✅ Admin ${req.user.username} removed user ${userId} from class ${id}. Reason: ${reason || 'No reason provided'}`);

// //     res.json({
// //       success: true,
// //       message: 'Participant removed successfully',
// //       data: result,
// //       admin_action: {
// //         type: 'participant_removal',
// //         performed_by: req.user.id,
// //         admin_username: req.user.username,
// //         target_user: userId,
// //         class_id: id,
// //         reason: reason
// //       },
// //       timestamp: new Date().toISOString()
// //     });

// //   } catch (error) {
// //     console.error('Error removing participant:', error);
// //     throw error;
// //   }
// // });


// /**
//  * POST /classes/admin/:id/participants/:userId/manage - Manage participant membership
//  */
// export const manageParticipantMembership = asyncHandler(async (req, res) => {
//   const { id, userId } = req.params;
//   const { action, new_role, reason } = req.body;

//   if (!action) {
//     return res.status(400).json({
//       success: false,
//       error: 'Action is required',
//       allowed_actions: ['approve', 'reject', 'remove', 'change_role', 'promote', 'demote'],
//       timestamp: new Date().toISOString()
//     });
//   }

//   try {
//     // Check if membership exists
//     const [membershipCheck] = await db.query(`
//       SELECT ucm.*, u.username, c.class_name 
//       FROM user_class_memberships ucm
//       JOIN users u ON ucm.user_id = u.id
//       JOIN classes c ON ucm.class_id = c.class_id
//       WHERE ucm.user_id = ? AND ucm.class_id = ?
//     `, [userId, id]);

//     if (membershipCheck.length === 0) {
//       return res.status(404).json({
//         success: false,
//         error: 'Membership not found',
//         user_id: userId,
//         class_id: id,
//         timestamp: new Date().toISOString()
//       });
//     }

//     const membership = membershipCheck[0];
//     let updateResult = {};
//     let message = '';

//     switch (action) {
//       case 'approve':
//         if (membership.membership_status === 'active') {
//           return res.status(400).json({
//             success: false,
//             error: 'User is already approved',
//             current_status: membership.membership_status
//           });
//         }

//         await db.query(
//           'UPDATE user_class_memberships SET membership_status = "active", approved_by = ?, approved_at = ?, updatedAt = ? WHERE user_id = ? AND class_id = ?',
//           [req.user.id, new Date(), new Date(), userId, id]
//         );

//         updateResult = { membership_status: 'active', approved_by: req.user.username };
//         message = 'Participant approved successfully';
//         break;

//       case 'reject':
//         await db.query(
//           'UPDATE user_class_memberships SET membership_status = "rejected", rejected_by = ?, rejected_at = ?, rejection_reason = ?, updatedAt = ? WHERE user_id = ? AND class_id = ?',
//           [req.user.id, new Date(), reason || 'Admin rejection', new Date(), userId, id]
//         );

//         updateResult = { membership_status: 'rejected', rejected_by: req.user.username };
//         message = 'Participant rejected successfully';
//         break;

//       case 'change_role':
//         if (!new_role) {
//           return res.status(400).json({
//             success: false,
//             error: 'new_role is required for change_role action',
//             allowed_roles: ['member', 'moderator', 'assistant', 'instructor']
//           });
//         }

//         await db.query(
//           'UPDATE user_class_memberships SET role_in_class = ?, role_changed_by = ?, role_change_reason = ?, updatedAt = ? WHERE user_id = ? AND class_id = ?',
//           [new_role, req.user.id, reason || 'Admin role change', new Date(), userId, id]
//         );

//         updateResult = { 
//           role_in_class: new_role, 
//           previous_role: membership.role_in_class,
//           changed_by: req.user.username 
//         };
//         message = `Participant role changed to ${new_role}`;
//         break;

//       case 'promote':
//         const roleHierarchy = ['member', 'assistant', 'moderator', 'instructor'];
//         const currentRoleIndex = roleHierarchy.indexOf(membership.role_in_class);
        
//         if (currentRoleIndex === -1 || currentRoleIndex >= roleHierarchy.length - 1) {
//           return res.status(400).json({
//             success: false,
//             error: 'Cannot promote user further',
//             current_role: membership.role_in_class
//           });
//         }

//         const promotedRole = roleHierarchy[currentRoleIndex + 1];
        
//         await db.query(
//           'UPDATE user_class_memberships SET role_in_class = ?, promoted_by = ?, promotion_reason = ?, updatedAt = ? WHERE user_id = ? AND class_id = ?',
//           [promotedRole, req.user.id, reason || 'Admin promotion', new Date(), userId, id]
//         );

//         updateResult = { 
//           role_in_class: promotedRole, 
//           previous_role: membership.role_in_class,
//           promoted_by: req.user.username 
//         };
//         message = `Participant promoted to ${promotedRole}`;
//         break;

//       case 'demote':
//         const demoteHierarchy = ['member', 'assistant', 'moderator', 'instructor'];
//         const currentDemoteIndex = demoteHierarchy.indexOf(membership.role_in_class);
        
//         if (currentDemoteIndex === -1 || currentDemoteIndex <= 0) {
//           return res.status(400).json({
//             success: false,
//             error: 'Cannot demote user further',
//             current_role: membership.role_in_class
//           });
//         }

//         const demotedRole = demoteHierarchy[currentDemoteIndex - 1];
        
//         await db.query(
//           'UPDATE user_class_memberships SET role_in_class = ?, demoted_by = ?, demotion_reason = ?, updatedAt = ? WHERE user_id = ? AND class_id = ?',
//           [demotedRole, req.user.id, reason || 'Admin demotion', new Date(), userId, id]
//         );

//         updateResult = { 
//           role_in_class: demotedRole, 
//           previous_role: membership.role_in_class,
//           demoted_by: req.user.username 
//         };
//         message = `Participant demoted to ${demotedRole}`;
//         break;

//       case 'remove':
//         // Delegate to remove function
//         req.body = { reason, notify_user: true };
//         return removeParticipantFromClass(req, res);

//       default:
//         return res.status(400).json({
//           success: false,
//           error: 'Invalid action',
//           provided: action,
//           allowed_actions: ['approve', 'reject', 'remove', 'change_role', 'promote', 'demote']
//         });
//     }

//     const result = {
//       user_id: userId,
//       username: membership.username,
//       class_id: id,
//       class_name: membership.class_name,
//       action: action,
//       reason: reason,
//       ...updateResult,
//       performed_by: req.user.username,
//       performed_at: new Date()
//     };

//     // Log admin action
//     console.log(`✅ Admin ${req.user.username} performed action '${action}' on user ${userId} in class ${id}`);

//     res.json({
//       success: true,
//       message: message,
//       data: result,
//       admin_action: {
//         type: 'participant_management',
//         action: action,
//         performed_by: req.user.id,
//         admin_username: req.user.username,
//         target_user: userId,
//         class_id: id,
//         reason: reason
//       },
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('Error managing participant membership:', error);
//     throw error;
//   }
// });

// /**
//  * POST /classes/admin/:id/participants/:userId/manage - Manage participant membership
//  */
// // export const manageParticipantMembership = asyncHandler(async (req, res) => {
// //   const { id, userId } = req.params;
// //   const { action, new_role, reason } = req.body;

// //   if (!action) {
// //     return res.status(400).json({
// //       success: false,
// //       error: 'Action is required',
// //       allowed_actions: ['approve', 'reject', 'remove', 'change_role', 'promote', 'demote'],
// //       timestamp: new Date().toISOString()
// //     });
// //   }

// //   try {
// //     // Check if membership exists
// //     const [membershipCheck] = await db.query(`
// //       SELECT ucm.*, u.username, c.class_name 
// //       FROM user_class_memberships ucm
// //       JOIN users u ON ucm.user_id = u.id
// //       JOIN classes c ON ucm.class_id = c.class_id
// //       WHERE ucm.user_id = ? AND ucm.class_id = ?
// //     `, [userId, id]);

// //     if (membershipCheck.length === 0) {
// //       return res.status(404).json({
// //         success: false,
// //         error: 'Membership not found',
// //         user_id: userId,
// //         class_id: id,
// //         timestamp: new Date().toISOString()
// //       });
// //     }

// //     const membership = membershipCheck[0];
// //     let updateResult = {};
// //     let message = '';

// //     switch (action) {
// //       case 'approve':
// //         if (membership.membership_status === 'active') {
// //           return res.status(400).json({
// //             success: false,
// //             error: 'User is already approved',
// //             current_status: membership.membership_status
// //           });
// //         }

// //         const [approveResult] = await db.query(
// //           'UPDATE user_class_memberships SET membership_status = "active", approved_by = ?, approved_at = ?, updatedAt = ? WHERE user_id = ? AND class_id = ?',
// //           [req.user.id, new Date(), new Date(), userId, id]
// //         );

// //         updateResult = { membership_status: 'active', approved_by: req.user.username };
// //         message = 'Participant approved successfully';
// //         break;

// //       case 'reject':
// //         const [rejectResult] = await db.query(
// //           'UPDATE user_class_memberships SET membership_status = "rejected", rejected_by = ?, rejected_at = ?, rejection_reason = ?, updatedAt = ? WHERE user_id = ? AND class_id = ?',
// //           [req.user.id, new Date(), reason || 'Admin rejection', new Date(), userId, id]
// //         );

// //         updateResult = { membership_status: 'rejected', rejected_by: req.user.username };
// //         message = 'Participant rejected successfully';
// //         break;

// //       case 'change_role':
// //         if (!new_role) {
// //           return res.status(400).json({
// //             success: false,
// //             error: 'new_role is required for change_role action',
// //             allowed_roles: ['member', 'moderator', 'assistant', 'instructor']
// //           });
// //         }

// //         const [roleChangeResult] = await db.query(
// //           'UPDATE user_class_memberships SET role_in_class = ?, role_changed_by = ?, role_change_reason = ?, updatedAt = ? WHERE user_id = ? AND class_id = ?',
// //           [new_role, req.user.id, reason || 'Admin role change', new Date(), userId, id]
// //         );

// //         updateResult = { 
// //           role_in_class: new_role, 
// //           previous_role: membership.role_in_class,
// //           changed_by: req.user.username 
// //         };
// //         message = `Participant role changed to ${new_role}`;
// //         break;

// //       case 'promote':
// //         const roleHierarchy = ['member', 'assistant', 'moderator', 'instructor'];
// //         const currentRoleIndex = roleHierarchy.indexOf(membership.role_in_class);
        
// //         if (currentRoleIndex === -1 || currentRoleIndex >= roleHierarchy.length - 1) {
// //           return res.status(400).json({
// //             success: false,
// //             error: 'Cannot promote user further',
// //             current_role: membership.role_in_class
// //           });
// //         }

// //         const promotedRole = roleHierarchy[currentRoleIndex + 1];
        
// //         const [promoteResult] = await db.query(
// //           'UPDATE user_class_memberships SET role_in_class = ?, promoted_by = ?, promotion_reason = ?, updatedAt = ? WHERE user_id = ? AND class_id = ?',
// //           [promotedRole, req.user.id, reason || 'Admin promotion', new Date(), userId, id]
// //         );

// //         updateResult = { 
// //           role_in_class: promotedRole, 
// //           previous_role: membership.role_in_class,
// //           promoted_by: req.user.username 
// //         };
// //         message = `Participant promoted to ${promotedRole}`;
// //         break;

// //       case 'demote':
// //         const demoteHierarchy = ['member', 'assistant', 'moderator', 'instructor'];
// //         const currentDemoteIndex = demoteHierarchy.indexOf(membership.role_in_class);
        
// //         if (currentDemoteIndex === -1 || currentDemoteIndex <= 0) {
// //           return res.status(400).json({
// //             success: false,
// //             error: 'Cannot demote user further',
// //             current_role: membership.role_in_class
// //           });
// //         }

// //         const demotedRole = demoteHierarchy[currentDemoteIndex - 1];
        
// //         const [demoteResult] = await db.query(
// //           'UPDATE user_class_memberships SET role_in_class = ?, demoted_by = ?, demotion_reason = ?, updatedAt = ? WHERE user_id = ? AND class_id = ?',
// //           [demotedRole, req.user.id, reason || 'Admin demotion', new Date(), userId, id]
// //         );

// //         updateResult = { 
// //           role_in_class: demotedRole, 
// //           previous_role: membership.role_in_class,
// //           demoted_by: req.user.username 
// //         };
// //         message = `Participant demoted to ${demotedRole}`;
// //         break;

// //       case 'remove':
// //         // Delegate to remove function
// //         req.body = { reason, notify_user: true };
// //         return removeParticipantFromClass(req, res);

// //       default:
// //         return res.status(400).json({
// //           success: false,
// //           error: 'Invalid action',
// //           provided: action,
// //           allowed_actions: ['approve', 'reject', 'remove', 'change_role', 'promote', 'demote']
// //         });
// //     }

// //     const result = {
// //       user_id: userId,
// //       username: membership.username,
// //       class_id: id,
// //       class_name: membership.class_name,
// //       action: action,
// //       reason: reason,
// //       ...updateResult,
// //       performed_by: req.user.username,
// //       performed_at: new Date()
// //     };

// //     // Log admin action
// //     console.log(`✅ Admin ${req.user.username} performed action '${action}' on user ${userId} in class ${id}`);

// //     res.json({
// //       success: true,
// //       message: message,
// //       data: result,
// //       admin_action: {
// //         type: 'participant_management',
// //         action: action,
// //         performed_by: req.user.id,
// //         admin_username: req.user.username,
// //         target_user: userId,
// //         class_id: id,
// //         reason: reason
// //       },
// //       timestamp: new Date().toISOString()
// //     });

// //   } catch (error) {
// //     console.error('Error managing participant membership:', error);
// //     throw error;
// //   }
// // });

// // ===============================================
// // ALL REMAINING FUNCTIONS FROM PROVIDED FILE
// // ===============================================

// // Copy all the remaining functions exactly as provided:
// // - getClassAnalytics
// // - getClassStats  
// // - getSpecificClassAnalytics
// // - bulkCreateClasses
// // - bulkUpdateClasses
// // - bulkDeleteClasses
// // - testAdminClassRoutes
// // - getClassSystemHealth
// // - All placeholder functions
// // - moduleInfo

// // [Rest of the file content from the provided classAdminControllers.js...]






// // ===============================================
// // ANALYTICS & REPORTING (Simplified)
// // ===============================================

// /**
//  * GET /classes/admin/analytics - Get comprehensive class analytics
//  */
// export const getClassAnalytics = asyncHandler(async (req, res) => {
//   const {
//     period = '30d',
//     class_type,
//     include_inactive = 'false',
//     breakdown = 'daily',
//     class_id
//   } = req.query;

//   try {
//     // Basic analytics query
//     const [basicStats] = await db.query(`
//       SELECT 
//         COUNT(*) as total_classes,
//         SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_classes,
//         SUM(CASE WHEN is_public = 1 THEN 1 ELSE 0 END) as public_classes,
//         AVG(max_members) as avg_max_members,
//         SUM((SELECT COUNT(*) FROM user_class_memberships ucm WHERE ucm.class_id = c.class_id AND ucm.membership_status = 'active')) as total_members
//       FROM classes c
//       WHERE (? IS NULL OR class_type = ?)
//       ${include_inactive === 'false' ? 'AND is_active = 1' : ''}
//       ${class_id ? 'AND class_id = ?' : ''}
//     `, [class_type, class_type, ...(class_id ? [class_id] : [])]);

//     // Recent activity
//     const [recentActivity] = await db.query(`
//       SELECT 
//         DATE(createdAt) as date,
//         COUNT(*) as classes_created
//       FROM classes 
//       WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
//       ${class_type ? 'AND class_type = ?' : ''}
//       GROUP BY DATE(createdAt)
//       ORDER BY date DESC
//       LIMIT 30
//     `, class_type ? [class_type] : []);

//     // Class type distribution
//     const [typeDistribution] = await db.query(`
//       SELECT 
//         class_type,
//         COUNT(*) as count,
//         SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_count
//       FROM classes
//       WHERE 1=1
//       ${include_inactive === 'false' ? 'AND is_active = 1' : ''}
//       GROUP BY class_type
//       ORDER BY count DESC
//     `);

//     const analytics = {
//       summary: basicStats[0],
//       recent_activity: recentActivity,
//       type_distribution: typeDistribution,
//       period: period,
//       breakdown: breakdown,
//       filters: {
//         class_type,
//         include_inactive: include_inactive === 'true',
//         class_id
//       }
//     };

//     res.json({
//       success: true,
//       message: 'Class analytics retrieved successfully',
//       data: analytics,
//       admin_context: {
//         admin_id: req.user.id,
//         admin_username: req.user.username,
//         analytics_scope: class_id ? 'single_class' : 'system_wide'
//       },
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('Error getting analytics:', error);
//     throw error;
//   }
// });

// /**
//  * GET /classes/admin/stats - Get class statistics summary
//  */
// export const getClassStats = asyncHandler(async (req, res) => {
//   const {
//     summary = 'true',
//     by_type = 'true',
//     by_status = 'true',
//     recent_activity = 'true'
//   } = req.query;

//   try {
//     const stats = {};

//     if (summary === 'true') {
//       const [summaryStats] = await db.query(`
//         SELECT 
//           COUNT(*) as total_classes,
//           SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_classes,
//           SUM(CASE WHEN is_public = 1 THEN 1 ELSE 0 END) as public_classes,
//           SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_classes,
//           AVG(max_members) as avg_capacity,
//           SUM((SELECT COUNT(*) FROM user_class_memberships ucm WHERE ucm.class_id = c.class_id AND ucm.membership_status = 'active')) as total_enrollments
//         FROM classes c
//       `);
//       stats.summary = summaryStats[0];
//     }

//     if (by_type === 'true') {
//       const [typeStats] = await db.query(`
//         SELECT 
//           class_type,
//           COUNT(*) as total,
//           SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
//           AVG(max_members) as avg_capacity
//         FROM classes
//         GROUP BY class_type
//         ORDER BY total DESC
//       `);
//       stats.by_type = typeStats;
//     }

//     if (by_status === 'true') {
//       const [statusStats] = await db.query(`
//         SELECT 
//           CASE 
//             WHEN is_active = 1 AND is_public = 1 THEN 'active_public'
//             WHEN is_active = 1 AND is_public = 0 THEN 'active_private'
//             WHEN is_active = 0 THEN 'inactive'
//             ELSE 'unknown'
//           END as status,
//           COUNT(*) as count
//         FROM classes
//         GROUP BY status
//       `);
//       stats.by_status = statusStats;
//     }

//     if (recent_activity === 'true') {
//       const [activityStats] = await db.query(`
//         SELECT 
//           'classes_created_today' as metric,
//           COUNT(*) as value
//         FROM classes 
//         WHERE DATE(createdAt) = CURDATE()
//         UNION ALL
//         SELECT 
//           'classes_created_this_week' as metric,
//           COUNT(*) as value
//         FROM classes 
//         WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
//         UNION ALL
//         SELECT 
//           'memberships_today' as metric,
//           COUNT(*) as value
//         FROM user_class_memberships 
//         WHERE DATE(createdAt) = CURDATE()
//       `);
//       stats.recent_activity = activityStats;
//     }

//     res.json({
//       success: true,
//       message: 'Class statistics retrieved successfully',
//       data: stats,
//       admin_context: {
//         admin_id: req.user.id,
//         generated_for: req.user.username
//       },
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('Error getting stats:', error);
//     throw error;
//   }
// });

// /**
//  * GET /classes/admin/:id/analytics - Get specific class analytics
//  */
// export const getSpecificClassAnalytics = asyncHandler(async (req, res) => {
//   const { id } = req.params;

//   try {
//     // Get class info
//     const [classInfo] = await db.query(`
//       SELECT class_id, class_name, class_type, is_active, max_members, createdAt
//       FROM classes 
//       WHERE class_id = ?
//     `, [id]);

//     if (classInfo.length === 0) {
//       return res.status(404).json({
//         success: false,
//         error: 'Class not found',
//         class_id: id,
//         timestamp: new Date().toISOString()
//       });
//     }

//     // Get membership stats
//     const [membershipStats] = await db.query(`
//       SELECT 
//         COUNT(*) as total_members,
//         SUM(CASE WHEN membership_status = 'active' THEN 1 ELSE 0 END) as active_members,
//         SUM(CASE WHEN membership_status = 'pending' THEN 1 ELSE 0 END) as pending_members,
//         COUNT(DISTINCT role_in_class) as unique_roles
//       FROM user_class_memberships 
//       WHERE class_id = ?
//     `, [id]);

//     // Get enrollment over time
//     const [enrollmentHistory] = await db.query(`
//       SELECT 
//         DATE(createdAt) as date,
//         COUNT(*) as enrollments
//       FROM user_class_memberships 
//       WHERE class_id = ? AND createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
//       GROUP BY DATE(createdAt)
//       ORDER BY date ASC
//     `, [id]);

//     // Get role distribution
//     const [roleDistribution] = await db.query(`
//       SELECT 
//         role_in_class,
//         COUNT(*) as count
//       FROM user_class_memberships 
//       WHERE class_id = ? AND membership_status = 'active'
//       GROUP BY role_in_class
//     `, [id]);

//     const analytics = {
//       class_info: classInfo[0],
//       membership_stats: membershipStats[0],
//       enrollment_history: enrollmentHistory,
//       role_distribution: roleDistribution,
//       capacity_utilization: membershipStats[0].active_members / classInfo[0].max_members * 100
//     };

//     res.json({
//       success: true,
//       message: 'Class analytics retrieved successfully',
//       data: analytics,
//       class_id: id,
//       admin_context: {
//         admin_id: req.user.id,
//         admin_username: req.user.username
//       },
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('Error getting class analytics:', error);
//     throw error;
//   }
// });

// // ===============================================
// // BULK OPERATIONS (Simplified)
// // ===============================================

// /**
//  * POST /classes/admin/bulk-create - Bulk create classes
//  */
// export const bulkCreateClasses = asyncHandler(async (req, res) => {
//   const { classes } = req.body;

//   if (!classes || !Array.isArray(classes) || classes.length === 0) {
//     return res.status(400).json({
//       success: false,
//       error: 'classes array is required and must not be empty',
//       required_format: 'Array of class objects',
//       example: [{ class_name: 'Example Class', class_type: 'general' }],
//       timestamp: new Date().toISOString()
//     });
//   }

//   if (classes.length > 20) {
//     return res.status(400).json({
//       success: false,
//       error: 'Cannot create more than 20 classes at once',
//       provided_count: classes.length,
//       max_allowed: 20,
//       timestamp: new Date().toISOString()
//     });
//   }

//   // Validate each class has required fields
//   for (let i = 0; i < classes.length; i++) {
//     const cls = classes[i];
//     if (!cls.class_name) {
//       return res.status(400).json({
//         success: false,
//         error: `Class at index ${i} is missing class_name`,
//         invalid_class_index: i,
//         required_fields: ['class_name'],
//         timestamp: new Date().toISOString()
//       });
//     }
//   }

//   const successful = [];
//   const failed = [];

//   try {
//     for (let i = 0; i < classes.length; i++) {
//       try {
//         const cls = classes[i];
//         const class_id = await generateUniqueClassId();
        
//         // Prepare class data with defaults
//         const classData = {
//           class_id,
//           display_id: class_id,
//           class_name: cls.class_name.trim(),
//           public_name: cls.public_name || cls.class_name,
//           description: cls.description || null,
//           class_type: cls.class_type || 'general',
//           is_public: Boolean(cls.is_public || false),
//           is_active: true,
//           max_members: parseInt(cls.max_members || 50),
//           privacy_level: cls.privacy_level || 'members_only',
//           created_by: req.user.id,
//           createdAt: new Date(),
//           updatedAt: new Date()
//         };

//         // Insert class
//         const [insertResult] = await db.query(`
//           INSERT INTO classes 
//           (class_id, display_id, class_name, public_name, description, class_type, 
//            is_public, is_active, max_members, privacy_level, created_by, createdAt, updatedAt)
//           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//         `, [
//           classData.class_id, classData.display_id, classData.class_name,
//           classData.public_name, classData.description, classData.class_type,
//           classData.is_public, classData.is_active, classData.max_members,
//           classData.privacy_level, classData.created_by, classData.createdAt,
//           classData.updatedAt
//         ]);

//         successful.push({
//           index: i,
//           class_id: classData.class_id,
//           class_name: classData.class_name,
//           database_id: insertResult.insertId
//         });

//       } catch (error) {
//         failed.push({
//           index: i,
//           class_name: classes[i].class_name,
//           error: error.message
//         });
//       }
//     }

//     // Log admin action
//     console.log(`✅ Admin ${req.user.username} bulk created ${successful.length} classes. Failed: ${failed.length}`);

//     res.status(201).json({
//       success: true,
//       message: `Successfully created ${successful.length} classes`,
//       data: {
//         successful,
//         failed,
//         summary: {
//           total_requested: classes.length,
//           successful_count: successful.length,
//           failed_count: failed.length
//         }
//       },
//       admin_action: {
//         type: 'bulk_class_creation',
//         performed_by: req.user.id,
//         admin_username: req.user.username,
//         total_requested: classes.length,
//         successful_count: successful.length,
//         failed_count: failed.length
//       },
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('Error in bulk create:', error);
//     throw error;
//   }
// });

// /**
//  * PUT /classes/admin/bulk-update - Bulk update classes
//  */
// export const bulkUpdateClasses = asyncHandler(async (req, res) => {
//   const { class_ids, updates } = req.body;

//   if (!class_ids || !Array.isArray(class_ids) || class_ids.length === 0) {
//     return res.status(400).json({
//       success: false,
//       error: 'class_ids array is required and must not be empty',
//       required_format: 'Array of class IDs in OTU#XXXXXX format',
//       timestamp: new Date().toISOString()
//     });
//   }

//   if (!updates || Object.keys(updates).length === 0) {
//     return res.status(400).json({
//       success: false,
//       error: 'updates object is required and must not be empty',
//       example_updates: { is_active: true, max_members: 100 },
//       timestamp: new Date().toISOString()
//     });
//   }

//   if (class_ids.length > 50) {
//     return res.status(400).json({
//       success: false,
//       error: 'Cannot update more than 50 classes at once',
//       provided_count: class_ids.length,
//       max_allowed: 50,
//       timestamp: new Date().toISOString()
//     });
//   }

//   const successful = [];
//   const failed = [];

//   try {
//     // Prepare update fields
//     const updateFields = [];
//     const updateValues = [];

//     const updatableFields = [
//       'class_name', 'public_name', 'description', 'class_type', 'is_public', 
//       'is_active', 'max_members', 'privacy_level'
//     ];

//     for (const field of updatableFields) {
//       if (updates.hasOwnProperty(field)) {
//         updateFields.push(`${field} = ?`);
        
//         if (['is_public', 'is_active'].includes(field)) {
//           updateValues.push(Boolean(updates[field]));
//         } else if (field === 'max_members') {
//           updateValues.push(parseInt(updates[field]));
//         } else {
//           updateValues.push(updates[field]);
//         }
//       }
//     }

//     updateFields.push('updatedAt = ?');
//     updateValues.push(new Date());

//     const updateSql = `UPDATE classes SET ${updateFields.join(', ')} WHERE class_id = ?`;

//     for (const class_id of class_ids) {
//       try {
//         const [updateResult] = await db.query(updateSql, [...updateValues, class_id]);
        
//         if (updateResult.affectedRows > 0) {
//           successful.push({
//             class_id,
//             updated_fields: Object.keys(updates),
//             affected_rows: updateResult.affectedRows
//           });
//         } else {
//           failed.push({
//             class_id,
//             error: 'Class not found or no changes made'
//           });
//         }
//       } catch (error) {
//         failed.push({
//           class_id,
//           error: error.message
//         });
//       }
//     }

//     // Log admin action
//     console.log(`✅ Admin ${req.user.username} bulk updated ${successful.length} classes. Failed: ${failed.length}`);

//     res.json({
//       success: true,
//       message: `Successfully updated ${successful.length} classes`,
//       data: {
//         successful,
//         failed,
//         summary: {
//           total_requested: class_ids.length,
//           successful_count: successful.length,
//           failed_count: failed.length
//         },
//         updates_applied: Object.keys(updates)
//       },
//       admin_action: {
//         type: 'bulk_class_update',
//         performed_by: req.user.id,
//         admin_username: req.user.username,
//         total_requested: class_ids.length,
//         successful_count: successful.length,
//         failed_count: failed.length,
//         updates_applied: Object.keys(updates)
//       },
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('Error in bulk update:', error);
//     throw error;
//   }
// });

// /**
//  * DELETE /classes/admin/bulk-delete - Bulk delete classes
//  */
// export const bulkDeleteClasses = asyncHandler(async (req, res) => {
//   const { class_ids, force = false, transfer_members_to } = req.body;

//   if (!class_ids || !Array.isArray(class_ids) || class_ids.length === 0) {
//     return res.status(400).json({
//       success: false,
//       error: 'class_ids array is required and must not be empty',
//       required_format: 'Array of class IDs in OTU#XXXXXX format',
//       timestamp: new Date().toISOString()
//     });
//   }

//   if (class_ids.length > 20) {
//     return res.status(400).json({
//       success: false,
//       error: 'Cannot delete more than 20 classes at once',
//       provided_count: class_ids.length,
//       max_allowed: 20,
//       safety_note: 'This limit exists to prevent accidental mass deletions',
//       timestamp: new Date().toISOString()
//     });
//   }

//   const successful = [];
//   const failed = [];

//   try {
//     for (const class_id of class_ids) {
//       try {
//         // Check if class exists and get member count
//         const [classCheck] = await db.query(`
//           SELECT 
//             class_id, 
//             class_name,
//             (SELECT COUNT(*) FROM user_class_memberships WHERE class_id = ? AND membership_status = 'active') as member_count
//           FROM classes 
//           WHERE class_id = ?
//         `, [class_id, class_id]);

//         if (classCheck.length === 0) {
//           failed.push({
//             class_id,
//             error: 'Class not found'
//           });
//           continue;
//         }

//         const classInfo = classCheck[0];
//         const memberCount = classInfo.member_count;

//         // Safety check for members
//         if (memberCount > 0 && !force && !transfer_members_to) {
//           failed.push({
//             class_id,
//             class_name: classInfo.class_name,
//             error: `Class has ${memberCount} active members. Use force=true or transfer_members_to to proceed.`
//           });
//           continue;
//         }

//         // Handle member transfer if specified
//         if (transfer_members_to && memberCount > 0) {
//           const [transferResult] = await db.query(
//             'UPDATE user_class_memberships SET class_id = ?, transfer_reason = ?, transferred_at = ? WHERE class_id = ? AND membership_status = "active"',
//             [transfer_members_to, `Original class ${class_id} deleted`, new Date(), class_id]
//           );
//         }

//         // Delete the class
//         const [deleteResult] = await db.query(
//           'DELETE FROM classes WHERE class_id = ?',
//           [class_id]
//         );

//         if (deleteResult.affectedRows > 0) {
//           successful.push({
//             class_id,
//             class_name: classInfo.class_name,
//             member_count: memberCount,
//             members_transferred: transfer_members_to ? memberCount : 0,
//             transfer_target: transfer_members_to || null
//           });
//         } else {
//           failed.push({
//             class_id,
//             error: 'Failed to delete class'
//           });
//         }

//       } catch (error) {
//         failed.push({
//           class_id,
//           error: error.message
//         });
//       }
//     }

//     // Log admin action
//     console.log(`✅ Admin ${req.user.username} bulk deleted ${successful.length} classes. Failed: ${failed.length}. Force: ${force}`);

//     res.json({
//       success: true,
//       message: `Successfully deleted ${successful.length} classes`,
//       data: {
//         successful,
//         failed,
//         summary: {
//           total_requested: class_ids.length,
//           successful_count: successful.length,
//           failed_count: failed.length
//         }
//       },
//       admin_action: {
//         type: 'bulk_class_deletion',
//         performed_by: req.user.id,
//         admin_username: req.user.username,
//         total_requested: class_ids.length,
//         successful_count: successful.length,
//         failed_count: failed.length,
//         force_delete: force,
//         transfer_target: transfer_members_to
//       },
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('Error in bulk delete:', error);
//     throw error;
//   }
// });

// // ===============================================
// // TESTING & UTILITY ENDPOINTS
// // ===============================================

// /**
//  * GET /classes/admin/test - Admin class routes test
//  */
// export const testAdminClassRoutes = asyncHandler(async (req, res) => {
//   const testResults = {
//     route_status: 'operational',
//     admin_access: 'verified',
//     timestamp: new Date().toISOString(),
//     admin_context: {
//       admin_id: req.user.id,
//       admin_username: req.user.username,
//       admin_role: req.user.role,
//       permissions: ['class_management', 'participant_management', 'analytics_access']
//     },
//     available_operations: [
//       'class creation/update/deletion',
//       'participant management',
//       'analytics and reporting',
//       'bulk operations'
//     ],
//     endpoint_info: {
//       path: '/api/classes/admin/test',
//       method: 'GET',
//       requires_auth: true,
//       requires_admin: true
//     }
//   };

//   // Test database connectivity and admin permissions
//   try {
//     const [result] = await db.query('SELECT COUNT(*) as class_count FROM classes WHERE class_id LIKE "OTU#%"');
//     testResults.database_status = 'connected';
//     testResults.total_classes = result[0].class_count;
//     testResults.admin_permissions = 'verified';
//   } catch (error) {
//     testResults.database_status = 'error';
//     testResults.database_error = error.message;
//   }

//   res.json({
//     success: true,
//     message: 'Admin class routes test completed',
//     data: testResults
//   });
// });

// /**
//  * GET /classes/admin/health - System health check for class management
//  */
// export const getClassSystemHealth = asyncHandler(async (req, res) => {
//   const healthCheck = {
//     timestamp: new Date().toISOString(),
//     overall_status: 'healthy',
//     checks: {
//       database_connection: 'unknown',
//       class_count: 0,
//       active_classes: 0,
//       recent_activity: 'unknown'
//     },
//     admin_info: {
//       checked_by: req.user.username,
//       admin_id: req.user.id
//     }
//   };

//   try {
//     // Test database connection
//     await db.query('SELECT 1');
//     healthCheck.checks.database_connection = 'healthy';
    
//     // Get basic statistics
//     const [classStats] = await db.query(`
//       SELECT 
//         COUNT(*) as total_classes,
//         SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_classes
//       FROM classes 
//       WHERE class_id LIKE "OTU#%"
//     `);
    
//     healthCheck.checks.class_count = classStats[0].total_classes;
//     healthCheck.checks.active_classes = classStats[0].active_classes;
    
//     // Check recent activity
//     const [recentActivity] = await db.query(`
//       SELECT COUNT(*) as recent_count 
//       FROM classes 
//       WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR) AND class_id LIKE "OTU#%"
//     `);
    
//     healthCheck.checks.recent_activity = `${recentActivity[0].recent_count} classes created in last 24h`;
    
//   } catch (error) {
//     healthCheck.overall_status = 'unhealthy';
//     healthCheck.checks.database_connection = 'error';
//     healthCheck.error = error.message;
//   }

//   res.json({
//     success: true,
//     message: 'Class system health check completed',
//     data: healthCheck
//   });
// });



// // Add these missing functions to classAdminControllers.js

// /**
//  * GET /classes/admin/:id/participants - Get class participants (matches route expectation)
//  * This should be the primary export name to match the route
//  */
// export const getClassParticipants = asyncHandler(async (req, res) => {
//   // Delegate to existing function with admin context
//   return manageClassParticipants(req, res);
// });

// /**
//  * PUT /classes/admin/:id/participants/:userId - Manage class member (matches route)
//  */
// export const manageClassMember = asyncHandler(async (req, res) => {
//   // Delegate to existing function
//   return manageParticipantMembership(req, res);
// });

// /**
//  * GET /classes/admin/stats - Get system statistics (matches import in route)
//  */
// export const getSystemStats = asyncHandler(async (req, res) => {
//   // Delegate to existing getClassStats or implement comprehensive stats
//   return getClassStats(req, res);
// });

// /**
//  * GET /classes/admin/audit-logs - Get audit logs for class operations
//  */
// export const getAuditLogs = asyncHandler(async (req, res) => {
//   const {
//     page = 1,
//     limit = 50,
//     class_id,
//     user_id,
//     action_type,
//     date_from,
//     date_to
//   } = req.query;

//   try {
//     // Build query for audit logs
//     let whereConditions = ['1=1'];
//     let queryParams = [];

//     if (class_id) {
//       whereConditions.push('al.class_id = ?');
//       queryParams.push(class_id);
//     }

//     if (user_id) {
//       whereConditions.push('al.performed_by = ?');
//       queryParams.push(user_id);
//     }

//     if (action_type) {
//       whereConditions.push('al.action_type = ?');
//       queryParams.push(action_type);
//     }

//     if (date_from) {
//       whereConditions.push('al.createdAt >= ?');
//       queryParams.push(date_from);
//     }

//     if (date_to) {
//       whereConditions.push('al.createdAt <= ?');
//       queryParams.push(date_to);
//     }

//     // For now, return structured placeholder since audit_logs table may not exist
//     const auditLogs = [];
//     const totalRecords = 0;

//     const totalPages = Math.ceil(totalRecords / parseInt(limit));

//     res.json({
//       success: true,
//       message: 'Audit logs retrieved',
//       data: auditLogs,
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         total_pages: totalPages,
//         total_records: totalRecords
//       },
//       filters: {
//         class_id,
//         user_id,
//         action_type,
//         date_from,
//         date_to
//       },
//       implementation_note: 'Audit logging system to be fully implemented',
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('Error in getAuditLogs:', error);
//     throw error;
//   }
// });

// /**
//  * POST /classes/admin/reports - Generate custom reports
//  */
// export const generateReports = asyncHandler(async (req, res) => {
//   const {
//     report_type = 'summary',
//     class_ids,
//     date_from,
//     date_to,
//     include_participants = true,
//     include_analytics = true,
//     format = 'json'
//   } = req.body;

//   try {
//     // Build report based on type
//     const reportData = {
//       report_type,
//       generated_by: req.user.username,
//       generated_at: new Date(),
//       parameters: {
//         class_ids,
//         date_range: { from: date_from, to: date_to },
//         includes: { participants: include_participants, analytics: include_analytics }
//       },
//       data: {}
//     };

//     // Get basic statistics for the report
//     if (report_type === 'summary' || report_type === 'comprehensive') {
//       const [summaryStats] = await db.query(`
//         SELECT 
//           COUNT(*) as total_classes,
//           SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_classes,
//           AVG(max_members) as avg_capacity
//         FROM classes
//         WHERE 1=1
//         ${class_ids ? 'AND class_id IN (?)' : ''}
//         ${date_from ? 'AND createdAt >= ?' : ''}
//         ${date_to ? 'AND createdAt <= ?' : ''}
//       `, [
//         ...(class_ids ? [class_ids] : []),
//         ...(date_from ? [date_from] : []),
//         ...(date_to ? [date_to] : [])
//       ]);

//       reportData.data.summary = summaryStats[0];
//     }

//     // Format response based on requested format
//     if (format === 'csv') {
//       // Would convert to CSV format
//       res.setHeader('Content-Type', 'text/csv');
//       res.setHeader('Content-Disposition', `attachment; filename="class_report_${Date.now()}.csv"`);
//       // CSV conversion logic would go here
//     }

//     res.json({
//       success: true,
//       message: 'Report generated successfully',
//       report: reportData,
//       admin_action: {
//         type: 'report_generation',
//         performed_by: req.user.id,
//         admin_username: req.user.username,
//         report_type
//       },
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('Error in generateReports:', error);
//     throw error;
//   }
// });

// // ===============================================
// // PROPERLY CONNECT SERVICE FUNCTIONS
// // ===============================================

// /**
//  * GET /classes/admin - Enhanced version using service
//  */
// export const getAllClassesAdmin = asyncHandler(async (req, res) => {
//   // Import service at top of file
//   const { getClassManagementService } = await import('../services/classAdminServices.js');
  
//   const filters = {
//     type: req.query.type,
//     is_active: req.query.is_active,
//     search: req.query.search,
//     date_from: req.query.date_from,
//     date_to: req.query.date_to,
//     created_by: req.query.created_by,
//     min_members: req.query.min_members,
//     max_members: req.query.max_members
//   };

//   const options = {
//     page: parseInt(req.query.page || 1),
//     limit: parseInt(req.query.limit || 20),
//     sort_by: req.query.sort_by || 'createdAt',
//     sort_order: req.query.sort_order || 'DESC',
//     include_stats: req.query.include_stats !== 'false'
//   };

//   try {
//     const result = await getClassManagementService(filters, options);

//     res.json({
//       success: true,
//       message: 'Classes retrieved successfully',
//       ...result,
//       admin_context: {
//         admin_id: req.user.id,
//         admin_username: req.user.username,
//         admin_role: req.user.role
//       },
//       timestamp: new Date().toISOString()
//     });
//   } catch (error) {
//     console.error('Error in getAllClassesAdmin:', error);
//     throw error;
//   }
// });

// /**
//  * GET /classes/admin/:id - Get class using service
//  */
// export const getClassByIdAdmin = asyncHandler(async (req, res) => {
//   // Delegate to existing getClassById with admin flag
//   req.admin_view = true;
//   return getClassById(req, res);
// });

// // ===============================================
// // PLACEHOLDER FUNCTIONS FOR FUTURE IMPLEMENTATION
// // ===============================================

// /**
//  * Placeholder functions that return structured responses for routes that expect them
//  * These can be implemented later with full functionality
//  */

// export const restoreClass = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const { restore_members = true, restoration_reason } = req.body;

//   res.json({
//     success: true,
//     message: 'Class restoration feature - to be implemented',
//     class_id: id,
//     admin_action: {
//       type: 'class_restoration',
//       performed_by: req.user.id,
//       admin_username: req.user.username,
//       reason: restoration_reason
//     },
//     options: { restore_members },
//     implementation_status: 'pending',
//     timestamp: new Date().toISOString()
//   });
// });

// export const duplicateClass = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const { new_name, copy_members = false, copy_content = true, copy_schedule = false } = req.body;

//   res.json({
//     success: true,
//     message: 'Class duplication feature - to be implemented',
//     original_class_id: id,
//     admin_action: {
//       type: 'class_duplication',
//       performed_by: req.user.id,
//       admin_username: req.user.username
//     },
//     duplication_options: { new_name, copy_members, copy_content, copy_schedule },
//     implementation_status: 'pending',
//     timestamp: new Date().toISOString()
//   });
// });

// export const getClassEnrollmentStats = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const { period = '30d', breakdown = 'daily' } = req.query;

//   res.json({
//     success: true,
//     message: 'Enrollment statistics feature - to be implemented',
//     class_id: id,
//     data: {
//       enrollments: [],
//       summary: { total: 0, active: 0, pending: 0 }
//     },
//     parameters: { period, breakdown },
//     implementation_status: 'pending',
//     timestamp: new Date().toISOString()
//   });
// });

// export const manageClassContent = asyncHandler(async (req, res) => {
//   const { id } = req.params;
  
//   res.json({
//     success: true,
//     message: 'Content management feature - to be implemented',
//     class_id: id,
//     data: { content: [], total: 0 },
//     implementation_status: 'pending',
//     timestamp: new Date().toISOString()
//   });
// });

// export const addClassContent = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const { content_id, content_type, access_level = 'read' } = req.body;

//   res.json({
//     success: true,
//     message: 'Add content feature - to be implemented',
//     class_id: id,
//     content: { content_id, content_type, access_level },
//     implementation_status: 'pending',
//     timestamp: new Date().toISOString()
//   });
// });

// export const updateClassContent = asyncHandler(async (req, res) => {
//   const { id, contentId } = req.params;
//   const { access_level } = req.body;

//   res.json({
//     success: true,
//     message: 'Update content feature - to be implemented',
//     class_id: id,
//     content_id: contentId,
//     access_level,
//     implementation_status: 'pending',
//     timestamp: new Date().toISOString()
//   });
// });

// export const deleteClassContent = asyncHandler(async (req, res) => {
//   const { id, contentId } = req.params;

//   res.json({
//     success: true,
//     message: 'Delete content feature - to be implemented',
//     class_id: id,
//     content_id: contentId,
//     implementation_status: 'pending',
//     timestamp: new Date().toISOString()
//   });
// });

// export const getClassInstructors = asyncHandler(async (req, res) => {
//   const { id } = req.params;

//   res.json({
//     success: true,
//     message: 'Instructor management feature - to be implemented',
//     class_id: id,
//     data: { instructors: [], total_instructors: 0 },
//     implementation_status: 'pending',
//     timestamp: new Date().toISOString()
//   });
// });

// export const addInstructorToClass = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const { user_id, instructor_role = 'instructor', permissions } = req.body;

//   res.json({
//     success: true,
//     message: 'Add instructor feature - to be implemented',
//     class_id: id,
//     instructor: { user_id, instructor_role, permissions },
//     implementation_status: 'pending',
//     timestamp: new Date().toISOString()
//   });
// });

// export const removeInstructorFromClass = asyncHandler(async (req, res) => {
//   const { id, instructorId } = req.params;

//   res.json({
//     success: true,
//     message: 'Remove instructor feature - to be implemented',
//     class_id: id,
//     instructor_id: instructorId,
//     implementation_status: 'pending',
//     timestamp: new Date().toISOString()
//   });
// });

// export const exportClassData = asyncHandler(async (req, res) => {
//   const { format = 'csv', include_participants = 'true', include_content = 'false' } = req.query;

//   res.json({
//     success: true,
//     message: 'Data export feature - to be implemented',
//     export_info: {
//       format,
//       include_participants,
//       include_content,
//       timestamp: new Date().toISOString(),
//       exported_by: req.user.username
//     },
//     implementation_status: 'pending',
//     data: []
//   });
// });

// export const exportParticipantData = asyncHandler(async (req, res) => {
//   res.json({
//     success: true,
//     message: 'Participant export feature - to be implemented',
//     implementation_status: 'pending',
//     timestamp: new Date().toISOString()
//   });
// });

// export const exportAnalyticsData = asyncHandler(async (req, res) => {
//   res.json({
//     success: true,
//     message: 'Analytics export feature - to be implemented',
//     implementation_status: 'pending',
//     timestamp: new Date().toISOString()
//   });
// });

// export const getClassConfiguration = asyncHandler(async (req, res) => {
//   res.json({
//     success: true,
//     message: 'Configuration management feature - to be implemented',
//     data: {
//       default_max_members: 50,
//       default_privacy_level: 'members_only',
//       allowed_class_types: ['general', 'demographic', 'subject', 'public', 'special'],
//       id_format: 'OTU#XXXXXX'
//     },
//     implementation_status: 'pending',
//     timestamp: new Date().toISOString()
//   });
// });

// export const updateClassConfiguration = asyncHandler(async (req, res) => {
//   const updates = req.body;

//   res.json({
//     success: true,
//     message: 'Configuration update feature - to be implemented',
//     updates: updates,
//     updated_by: req.user.username,
//     implementation_status: 'pending',
//     timestamp: new Date().toISOString()
//   });
// });

// export const updateParticipant = asyncHandler(async (req, res) => {
//   const { id, userId } = req.params;
//   const updateData = req.body;

//   res.json({
//     success: true,
//     message: 'Update participant feature - to be implemented',
//     class_id: id,
//     user_id: userId,
//     updates: updateData,
//     implementation_status: 'pending',
//     timestamp: new Date().toISOString()
//   });
// });

// export const handleAdminClassNotFound = asyncHandler(async (req, res) => {
//   res.status(404).json({
//     success: false,
//     error: 'Admin class route not found',
//     path: req.path,
//     method: req.method,
//     admin_context: {
//       admin_id: req.user?.id,
//       admin_role: req.user?.role
//     },
//     available_routes: {
//       class_management: [
//         'GET / - Get all classes for management',
//         'POST / - Create new class',
//         'GET /:id - Get specific class (admin view)',
//         'PUT /:id - Update class',
//         'DELETE /:id - Delete class'
//       ],
//       participant_management: [
//         'GET /:id/participants - Get class participants (admin view)',
//         'POST /:id/participants - Add participant to class',
//         'DELETE /:id/participants/:userId - Remove participant',
//         'POST /:id/participants/:userId/manage - Manage participant membership'
//       ],
//       analytics: [
//         'GET /analytics - System-wide class analytics',
//         'GET /stats - Class statistics summary',
//         'GET /:id/analytics - Specific class analytics'
//       ],
//       bulk_operations: [
//         'POST /bulk-create - Bulk create classes',
//         'PUT /bulk-update - Bulk update classes',
//         'DELETE /bulk-delete - Bulk delete classes'
//       ],
//       testing: [
//         'GET /test - Admin class routes test',
//         'GET /health - System health check'
//       ]
//     },
//     admin_note: 'All routes require admin or super_admin role',
//     timestamp: new Date().toISOString()
//   });
// });

// // ===============================================
// // MODULE METADATA & EXPORTS
// // ===============================================

// export const moduleInfo = {
//   name: 'Class Admin Controllers',
//   version: '2.0.0',
//   description: 'Integration-ready administrative class management controllers with OTU# format support',
//   supported_formats: ['OTU#XXXXXX'],
//   required_permissions: ['admin', 'super_admin'],
//   features: [
//     'class_management',
//     'participant_administration', 
//     'bulk_operations',
//     'analytics_reporting',
//     'health_monitoring'
//   ],
//   implementation_status: {
//     core_functions: 'complete',
//     advanced_features: 'placeholder',
//     database_operations: 'tested'
//   },
//   last_updated: new Date().toISOString()
// };


// // Add this complete export list at the end of classAdminControllers.js

// // ===============================================
// // COMPLETE MODULE EXPORTS
// // ===============================================

// // export {
// //   // Class Management
// //   createClass,
// //   getAllClassesAdmin,
// //   getClassManagement, // Alternative name for getAllClassesAdmin
// //   getClassById,
// //   getClassByIdAdmin,
// //   updateClass,
// //   deleteClass,
  
// //   // Participant Management
// //   getClassParticipants,
// //   manageClassParticipants, // Alternative function name
// //   addParticipantToClass,
// //   removeParticipantFromClass,
// //   manageParticipantMembership,
// //   manageClassMember, // Route-expected name
// //   updateParticipant,
  
// //   // Analytics & Reporting
// //   getClassAnalytics,
// //   getClassStats,
// //   getSystemStats, // Alias for getClassStats
// //   getSpecificClassAnalytics,
// //   exportClassData,
// //   exportParticipantData,
// //   exportAnalyticsData,
// //   getAuditLogs,
// //   generateReports,
  
// //   // Bulk Operations
// //   bulkCreateClasses,
// //   bulkUpdateClasses,
// //   bulkDeleteClasses,
  
// //   // Class Features
// //   restoreClass,
// //   duplicateClass,
// //   getClassEnrollmentStats,
// //   manageClassContent,
// //   addClassContent,
// //   updateClassContent,
// //   deleteClassContent,
// //   getClassInstructors,
// //   addInstructorToClass,
// //   removeInstructorFromClass,
  
// //   // Configuration
// //   getClassConfiguration,
// //   updateClassConfiguration,
  
// //   // Testing & Health
// //   testAdminClassRoutes,
// //   getClassSystemHealth,
  
// //   // 404 Handler
// // //  handleAdminClassNotFound
// // };

// // Default export
// export default {
//   name: 'Class Admin Controllers',
//   version: '2.0.0',
//   description: 'Administrative class management controllers',
//   required_roles: ['admin', 'super_admin'],
//   total_endpoints: Object.keys(module.exports || {}).length,
//   categories: {
//     class_management: 7,
//     participant_management: 8,
//     analytics: 9,
//     bulk_operations: 3,
//     features: 10,
//     configuration: 2,
//     testing: 2
//   },
//   timestamp: new Date().toISOString()
// };

