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






