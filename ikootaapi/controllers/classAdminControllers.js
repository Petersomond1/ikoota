// ikootaapi/controllers/classAdminControllers.js
// ADMIN CLASS MANAGEMENT CONTROLLERS
// Administrative control over class creation, management, and analytics

import {
  getClassManagementService,
  createClassService,
  updateClassService,
  deleteClassService,
  manageClassParticipantsService,
  addParticipantToClassService,
  removeParticipantFromClassService,
  getClassEnrollmentStatsService,
  manageClassContentService,
  addClassContentService,
  updateClassContentService,
  deleteClassContentService,
  getClassAnalyticsService,
  getClassStatsService,
  exportClassDataService,
  bulkCreateClassesService,
  bulkUpdateClassesService,
  bulkDeleteClassesService,
  getClassConfigurationService,
  updateClassConfigurationService
} from '../services/classAdminServices.js';

import { generateUniqueClassId } from '../utils/idGenerator.js';

// ===============================================
// CLASS MANAGEMENT
// ===============================================

/**
 * GET /admin/classes - Get all classes for management
 * Frontend: UserManagement.jsx -> GET /classes (admin context)
 */
export const getClassManagement = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      is_active,
      search,
      sort_by = 'createdAt',
      sort_order = 'DESC',
      include_stats = true
    } = req.query;

    const filters = {
      type,
      is_active: is_active !== undefined ? Boolean(is_active) : undefined,
      search
    };

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort_by,
      sort_order,
      include_stats: Boolean(include_stats)
    };

    const result = await getClassManagementService(filters, options);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      summary: result.summary,
      filters,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Get class management error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to fetch class management data',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * POST /admin/classes - Create new class
 * Frontend: AudienceClassMgr.jsx -> POST /classes
 */
export const createClass = async (req, res) => {
  try {
    const {
      class_name,
      public_name,
      description,
      class_type = 'demographic',
      is_public = false,
      max_members = 50,
      privacy_level = 'members_only'
    } = req.body;

    // Validate required fields
    if (!class_name) {
      return res.status(400).json({
        success: false,
        error: 'class_name is required',
        timestamp: new Date().toISOString()
      });
    }

    // Generate unique class ID
    const class_id = await generateUniqueClassId();

    const classData = {
      class_id,
      class_name,
      public_name: public_name || class_name,
      description,
      class_type,
      is_public: Boolean(is_public),
      max_members: parseInt(max_members),
      privacy_level,
      created_by: req.user.id
    };

    const result = await createClassService(classData);

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: result,
      class_id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Create class error:', error);
    res.status(error.statusCode || 400).json({
      success: false,
      error: error.message || 'Failed to create class',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * PUT /admin/classes/:id - Update class
 * Frontend: AudienceClassMgr.jsx -> PUT /classes/{id}
 */
export const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      class_name,
      public_name,
      description,
      class_type,
      is_public,
      max_members,
      privacy_level,
      is_active
    } = req.body;

    const updateData = {};
    
    // Only include fields that are provided
    if (class_name !== undefined) updateData.class_name = class_name;
    if (public_name !== undefined) updateData.public_name = public_name;
    if (description !== undefined) updateData.description = description;
    if (class_type !== undefined) updateData.class_type = class_type;
    if (is_public !== undefined) updateData.is_public = Boolean(is_public);
    if (max_members !== undefined) updateData.max_members = parseInt(max_members);
    if (privacy_level !== undefined) updateData.privacy_level = privacy_level;
    if (is_active !== undefined) updateData.is_active = Boolean(is_active);

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields provided for update',
        timestamp: new Date().toISOString()
      });
    }

    const result = await updateClassService(id, updateData, req.user.id);

    res.json({
      success: true,
      message: 'Class updated successfully',
      data: result,
      classId: id,
      updated_fields: Object.keys(updateData),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Update class error:', error);
    res.status(error.statusCode || 400).json({
      success: false,
      error: error.message || 'Failed to update class',
      classId: req.params.id,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * DELETE /admin/classes/:id - Delete class
 */
export const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { force = false, transfer_members_to } = req.body;

    const result = await deleteClassService(id, {
      force: Boolean(force),
      transfer_members_to,
      deleted_by: req.user.id
    });

    res.json({
      success: true,
      message: 'Class deleted successfully',
      data: result,
      classId: id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Delete class error:', error);
    res.status(error.statusCode || 400).json({
      success: false,
      error: error.message || 'Failed to delete class',
      classId: req.params.id,
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// PARTICIPANT MANAGEMENT
// ===============================================

/**
 * GET /admin/classes/:id/participants - Get class participants (admin view)
 */
export const manageClassParticipants = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      page = 1,
      limit = 50,
      role_in_class,
      membership_status,
      search,
      sort_by = 'joinedAt',
      sort_order = 'DESC'
    } = req.query;

    const filters = {
      role_in_class,
      membership_status,
      search
    };

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort_by,
      sort_order
    };

    const result = await manageClassParticipantsService(id, filters, options);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      summary: result.summary,
      classId: id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Manage class participants error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to fetch class participants',
      classId: req.params.id,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * POST /admin/classes/:id/participants - Add participant to class
 */
export const addParticipantToClass = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      user_id,
      role_in_class = 'member',
      receive_notifications = true,
      expires_at,
      can_see_class_name = true
    } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'user_id is required',
        timestamp: new Date().toISOString()
      });
    }

    const participantData = {
      user_id,
      role_in_class,
      receive_notifications: Boolean(receive_notifications),
      expires_at,
      can_see_class_name: Boolean(can_see_class_name),
      assigned_by: req.user.id
    };

    const result = await addParticipantToClassService(id, participantData);

    res.status(201).json({
      success: true,
      message: 'Participant added successfully',
      data: result,
      classId: id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Add participant error:', error);
    res.status(error.statusCode || 400).json({
      success: false,
      error: error.message || 'Failed to add participant to class',
      classId: req.params.id,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * DELETE /admin/classes/:id/participants/:userId - Remove participant
 */
export const removeParticipantFromClass = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { reason, notify_user = true } = req.body;

    const result = await removeParticipantFromClassService(id, userId, {
      reason,
      notify_user: Boolean(notify_user),
      removed_by: req.user.id
    });

    res.json({
      success: true,
      message: 'Participant removed successfully',
      data: result,
      classId: id,
      userId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Remove participant error:', error);
    res.status(error.statusCode || 400).json({
      success: false,
      error: error.message || 'Failed to remove participant from class',
      classId: req.params.id,
      userId: req.params.userId,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * GET /admin/classes/:id/enrollment-stats - Get enrollment statistics
 */
export const getClassEnrollmentStats = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      period = '30d',
      breakdown = 'daily'
    } = req.query;

    const stats = await getClassEnrollmentStatsService(id, {
      period,
      breakdown
    });

    res.json({
      success: true,
      data: stats,
      classId: id,
      period,
      breakdown,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Get enrollment stats error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to fetch enrollment statistics',
      classId: req.params.id,
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// CLASS CONTENT MANAGEMENT
// ===============================================

/**
 * GET /admin/classes/:id/content - Get class content (admin view)
 */
export const manageClassContent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      content_type,
      access_level,
      page = 1,
      limit = 20,
      search
    } = req.query;

    const filters = {
      content_type,
      access_level,
      search
    };

    const options = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await manageClassContentService(id, filters, options);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      summary: result.summary,
      classId: id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Manage class content error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to fetch class content',
      classId: req.params.id,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * POST /admin/classes/:id/content - Add content to class
 */
export const addClassContent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      content_id,
      content_type,
      access_level = 'read'
    } = req.body;

    if (!content_id || !content_type) {
      return res.status(400).json({
        success: false,
        error: 'content_id and content_type are required',
        timestamp: new Date().toISOString()
      });
    }

    const contentData = {
      content_id: parseInt(content_id),
      content_type,
      access_level
    };

    const result = await addClassContentService(id, contentData);

    res.status(201).json({
      success: true,
      message: 'Content added to class successfully',
      data: result,
      classId: id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Add class content error:', error);
    res.status(error.statusCode || 400).json({
      success: false,
      error: error.message || 'Failed to add content to class',
      classId: req.params.id,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * PUT /admin/classes/:id/content/:contentId - Update class content
 */
export const updateClassContent = async (req, res) => {
  try {
    const { id, contentId } = req.params;
    const { access_level } = req.body;

    if (!access_level) {
      return res.status(400).json({
        success: false,
        error: 'access_level is required',
        timestamp: new Date().toISOString()
      });
    }

    const result = await updateClassContentService(id, contentId, {
      access_level
    });

    res.json({
      success: true,
      message: 'Class content updated successfully',
      data: result,
      classId: id,
      contentId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Update class content error:', error);
    res.status(error.statusCode || 400).json({
      success: false,
      error: error.message || 'Failed to update class content',
      classId: req.params.id,
      contentId: req.params.contentId,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * DELETE /admin/classes/:id/content/:contentId - Delete class content
 */
export const deleteClassContent = async (req, res) => {
  try {
    const { id, contentId } = req.params;

    const result = await deleteClassContentService(id, contentId);

    res.json({
      success: true,
      message: 'Content removed from class successfully',
      data: result,
      classId: id,
      contentId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Delete class content error:', error);
    res.status(error.statusCode || 400).json({
      success: false,
      error: error.message || 'Failed to remove content from class',
      classId: req.params.id,
      contentId: req.params.contentId,
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// ANALYTICS & REPORTING
// ===============================================

/**
 * GET /admin/classes/analytics - Get class analytics
 */
export const getClassAnalytics = async (req, res) => {
  try {
    const {
      period = '30d',
      class_type,
      include_inactive = false,
      breakdown = 'daily'
    } = req.query;

    // If classId is set from route parameter (/:id/analytics), use it
    const classId = req.classId || req.query.class_id;

    const analytics = await getClassAnalyticsService({
      period,
      class_type,
      include_inactive: Boolean(include_inactive),
      breakdown,
      class_id: classId
    });

    res.json({
      success: true,
      data: analytics,
      parameters: {
        period,
        class_type,
        include_inactive,
        breakdown,
        class_id: classId
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Get class analytics error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to fetch class analytics',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * GET /admin/classes/stats - Get class statistics
 */
export const getClassStats = async (req, res) => {
  try {
    const {
      summary = true,
      by_type = true,
      by_status = true,
      recent_activity = true
    } = req.query;

    const options = {
      summary: Boolean(summary),
      by_type: Boolean(by_type),
      by_status: Boolean(by_status),
      recent_activity: Boolean(recent_activity)
    };

    const stats = await getClassStatsService(options);

    res.json({
      success: true,
      data: stats,
      options,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Get class stats error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to fetch class statistics',
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// DATA EXPORT
// ===============================================

/**
 * GET /admin/classes/export - Export class data (super admin only)
 */
export const exportClassData = async (req, res) => {
  try {
    const {
      format = 'csv',
      include_participants = true,
      include_content = false,
      date_from,
      date_to,
      class_type
    } = req.query;

    const exportType = req.exportType || 'classes';

    const options = {
      format,
      include_participants: Boolean(include_participants),
      include_content: Boolean(include_content),
      date_from,
      date_to,
      class_type,
      export_type: exportType
    };

    const result = await exportClassDataService(options);

    // Set appropriate headers for file download
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `class_${exportType}_export_${timestamp}.${format}`;
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');

    if (format === 'csv') {
      res.send(result.data);
    } else {
      res.json({
        success: true,
        data: result.data,
        export_info: {
          type: exportType,
          timestamp: new Date().toISOString(),
          record_count: result.count,
          options
        }
      });
    }

  } catch (error) {
    console.error('❌ Export class data error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to export class data',
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// CLASS CONFIGURATION
// ===============================================

/**
 * GET /admin/classes/config - Get class system configuration
 */
export const getClassConfiguration = async (req, res) => {
  try {
    const config = await getClassConfigurationService();

    res.json({
      success: true,
      data: config,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Get class configuration error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to fetch class configuration',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * PUT /admin/classes/config - Update class system configuration
 */
export const updateClassConfiguration = async (req, res) => {
  try {
    const {
      default_max_members,
      default_privacy_level,
      allowed_class_types,
      auto_approve_joins,
      notification_settings
    } = req.body;

    const configData = {};
    if (default_max_members !== undefined) configData.default_max_members = parseInt(default_max_members);
    if (default_privacy_level !== undefined) configData.default_privacy_level = default_privacy_level;
    if (allowed_class_types !== undefined) configData.allowed_class_types = allowed_class_types;
    if (auto_approve_joins !== undefined) configData.auto_approve_joins = Boolean(auto_approve_joins);
    if (notification_settings !== undefined) configData.notification_settings = notification_settings;

    if (Object.keys(configData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid configuration fields provided',
        timestamp: new Date().toISOString()
      });
    }

    const result = await updateClassConfigurationService(configData, req.user.id);

    res.json({
      success: true,
      message: 'Class configuration updated successfully',
      data: result,
      updated_by: req.user.id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Update class configuration error:', error);
    res.status(error.statusCode || 400).json({
      success: false,
      error: error.message || 'Failed to update class configuration',
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// BULK OPERATIONS
// ===============================================

/**
 * POST /admin/classes/bulk-create - Bulk create classes
 */
export const bulkCreateClasses = async (req, res) => {
  try {
    const { classes } = req.body;

    if (!classes || !Array.isArray(classes) || classes.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'classes array is required and must not be empty',
        timestamp: new Date().toISOString()
      });
    }

    if (classes.length > 20) {
      return res.status(400).json({
        success: false,
        error: 'Cannot create more than 20 classes at once',
        timestamp: new Date().toISOString()
      });
    }

    // Validate each class has required fields
    for (const cls of classes) {
      if (!cls.class_name) {
        return res.status(400).json({
          success: false,
          error: 'Each class must have a class_name',
          timestamp: new Date().toISOString()
        });
      }
    }

    const result = await bulkCreateClassesService(classes, req.user.id);

    res.status(201).json({
      success: true,
      message: `Successfully created ${result.successful.length} classes`,
      data: {
        successful: result.successful,
        failed: result.failed,
        summary: {
          total_requested: classes.length,
          successful_count: result.successful.length,
          failed_count: result.failed.length
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Bulk create classes error:', error);
    res.status(error.statusCode || 400).json({
      success: false,
      error: error.message || 'Failed to bulk create classes',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * PUT /admin/classes/bulk-update - Bulk update classes
 */
export const bulkUpdateClasses = async (req, res) => {
  try {
    const { class_ids, updates } = req.body;

    if (!class_ids || !Array.isArray(class_ids) || class_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'class_ids array is required and must not be empty',
        timestamp: new Date().toISOString()
      });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'updates object is required and must not be empty',
        timestamp: new Date().toISOString()
      });
    }

    if (class_ids.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Cannot update more than 50 classes at once',
        timestamp: new Date().toISOString()
      });
    }

    const result = await bulkUpdateClassesService(class_ids, updates, req.user.id);

    res.json({
      success: true,
      message: `Successfully updated ${result.successful.length} classes`,
      data: {
        successful: result.successful,
        failed: result.failed,
        summary: {
          total_requested: class_ids.length,
          successful_count: result.successful.length,
          failed_count: result.failed.length
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Bulk update classes error:', error);
    res.status(error.statusCode || 400).json({
      success: false,
      error: error.message || 'Failed to bulk update classes',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * DELETE /admin/classes/bulk-delete - Bulk delete classes
 */
export const bulkDeleteClasses = async (req, res) => {
  try {
    const { class_ids, force = false, transfer_members_to } = req.body;

    if (!class_ids || !Array.isArray(class_ids) || class_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'class_ids array is required and must not be empty',
        timestamp: new Date().toISOString()
      });
    }

    if (class_ids.length > 20) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete more than 20 classes at once',
        timestamp: new Date().toISOString()
      });
    }

    const options = {
      force: Boolean(force),
      transfer_members_to,
      deleted_by: req.user.id
    };

    const result = await bulkDeleteClassesService(class_ids, options);

    res.json({
      success: true,
      message: `Successfully deleted ${result.successful.length} classes`,
      data: {
        successful: result.successful,
        failed: result.failed,
        summary: {
          total_requested: class_ids.length,
          successful_count: result.successful.length,
          failed_count: result.failed.length
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Bulk delete classes error:', error);
    res.status(error.statusCode || 400).json({
      success: false,
      error: error.message || 'Failed to bulk delete classes',
      timestamp: new Date().toISOString()
    });
  }
};