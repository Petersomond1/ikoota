// ikootaapi/routes/classAdminRoutes.js
// ADMIN CLASS MANAGEMENT ROUTES - COMPLETE IMPLEMENTATION
// All administrative class operations with comprehensive validation and security

import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import {
  validateClassId,
  validateUserId,
  validatePagination,
  validateSorting,
  validateClassData,
  validateMembershipAction,
  validateContentData,
  validateFeedback,
  validateBulkOperation,
  validateDateRange,
  validateRequestSize,
  validateAdminClassRoute,
  validateClassCreation,
  validateClassUpdate,
  validateParticipantManagement,
  validateContentManagement
} from '../middlewares/classValidation.js';

// Import class admin controllers
import {
  // Class management
  getClassManagement,
  createClass,
  getClassById,
  updateClass,
  deleteClass,
  restoreClass,
  duplicateClass,
  
  // Participant management
  manageClassParticipants,
  addParticipantToClass,
  updateParticipant,
  removeParticipantFromClass,
  manageParticipantMembership,
  getClassEnrollmentStats,
  
  // Content management
  manageClassContent,
  addClassContent,
  updateClassContent,
  deleteClassContent,
  
  // Instructor management
  getClassInstructors,
  addInstructorToClass,
  removeInstructorFromClass,
  
  // Analytics & reporting
  getClassAnalytics,
  getClassStats,
  getSpecificClassAnalytics,
  
  // Data export
  exportClassData,
  exportParticipantData,
  exportAnalyticsData,
  
  // Bulk operations
  bulkCreateClasses,
  bulkUpdateClasses,
  bulkDeleteClasses,
  
  // Configuration
  getClassConfiguration,
  updateClassConfiguration,
  
  // Testing & utilities
  testAdminClassRoutes,
  getClassSystemHealth,
  handleAdminClassNotFound
} from '../controllers/classAdminControllers.js';

const router = express.Router();

// ===============================================
// SECURITY & MIDDLEWARE SETUP
// ===============================================

// Apply admin authentication to all routes
router.use(authenticate);
router.use(authorize(['admin', 'super_admin', 'moderator']));

// Request size validation for all routes
router.use(validateRequestSize);

// Admin action logging middleware
router.use((req, res, next) => {
  const startTime = Date.now();
  
  // Log admin action initiation
  console.log(`🔐 Admin action initiated: ${req.method} ${req.path} by ${req.user?.username} (${req.user?.role})`);
  
  // Add response time logging
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const status = res.statusCode >= 400 ? '❌' : '✅';
    console.log(`${status} Admin action completed: ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
});

// Rate limiting for admin operations (if available)
if (process.env.ENABLE_ADMIN_RATE_LIMITING === 'true') {
  try {
    const rateLimit = (await import('express-rate-limit')).default;
    const adminRateLimit = rateLimit({
      windowMs: 5 * 60 * 1000, // 5 minutes
      max: 200, // limit each admin to 200 requests per windowMs
      message: {
        success: false,
        error: 'Too many admin requests, please slow down.',
        retry_after: '5 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => `admin-${req.user?.id || req.ip}`,
      skip: (req) => req.path === '/test' || req.path === '/health' // Skip rate limiting for monitoring
    });
    router.use(adminRateLimit);
  } catch (error) {
    console.warn('Admin rate limiting not available:', error.message);
  }
}

// ===============================================
// CLASS MANAGEMENT ROUTES
// ===============================================

/**
 * GET /admin/classes - Get all classes for management with comprehensive filtering
 * Query: page, limit, type, is_active, search, sort_by, sort_order, include_stats, date_from, date_to, created_by, min_members, max_members
 */
router.get('/', 
  validatePagination, 
  validateSorting, 
  validateDateRange,
  getClassManagement
);

/**
 * POST /admin/classes - Create new class with full administrative options
 * Body: Comprehensive class creation data with all configuration options
 */
router.post('/', 
  validateClassCreation,
  createClass
);

/**
 * GET /admin/classes/:id - Get specific class with administrative details
 * Returns full class information including sensitive admin data
 */
router.get('/:id', 
  validateClassId, 
  getClassById
);

/**
 * PUT /admin/classes/:id - Update class with comprehensive field support
 * Body: Any combination of updatable class fields
 */
router.put('/:id', 
  validateClassUpdate,
  updateClass
);

/**
 * DELETE /admin/classes/:id - Delete or archive class with safety checks
 * Body: { force?, transfer_members_to?, archive_instead?, deletion_reason? }
 */
router.delete('/:id', 
  validateClassId,
  deleteClass
);

/**
 * POST /admin/classes/:id/restore - Restore archived class
 * Body: { restore_members?, restoration_reason? }
 */
router.post('/:id/restore',
  validateClassId,
  authorize(['super_admin']), // Only super admins can restore
  restoreClass
);

/**
 * POST /admin/classes/:id/duplicate - Duplicate class with options
 * Body: { new_name?, copy_members?, copy_content?, copy_schedule? }
 */
router.post('/:id/duplicate',
  validateClassId,
  duplicateClass
);

// ===============================================
// PARTICIPANT MANAGEMENT ROUTES
// ===============================================

/**
 * GET /admin/classes/:id/participants - Get class participants (admin view)
 * Query: page, limit, role_in_class, membership_status, search, sort_by, sort_order, include_inactive, date_from, date_to
 */
router.get('/:id/participants', 
  validateClassId,
  validatePagination, 
  validateSorting, 
  validateDateRange,
  manageClassParticipants
);

/**
 * POST /admin/classes/:id/participants - Add participant to class
 * Body: { user_id, role_in_class?, receive_notifications?, expires_at?, can_see_class_name?, assignment_reason? }
 */
router.post('/:id/participants', 
  validateParticipantManagement,
  addParticipantToClass
);

/**
 * PUT /admin/classes/:id/participants/:userId - Update participant
 * Body: { role_in_class?, membership_status?, expires_at?, receive_notifications? }
 */
router.put('/:id/participants/:userId',
  validateClassId,
  validateUserId,
  updateParticipant
);

/**
 * DELETE /admin/classes/:id/participants/:userId - Remove participant
 * Body: { reason?, notify_user? }
 */
router.delete('/:id/participants/:userId', 
  validateClassId,
  validateUserId,
  removeParticipantFromClass
);

/**
 * POST /admin/classes/:id/participants/:userId/manage - Manage participant membership
 * Body: { action, new_role?, reason? }
 * Actions: approve, reject, remove, change_role, promote, demote
 */
router.post('/:id/participants/:userId/manage',
  validateClassId,
  validateUserId,
  validateMembershipAction,
  manageParticipantMembership
);

/**
 * GET /admin/classes/:id/enrollment-stats - Get enrollment statistics
 * Query: period?, breakdown?
 */
router.get('/:id/enrollment-stats', 
  validateClassId,
  validateDateRange,
  getClassEnrollmentStats
);

// ===============================================
// CONTENT MANAGEMENT ROUTES
// ===============================================

/**
 * GET /admin/classes/:id/content - Get class content (admin view)
 * Query: content_type?, access_level?, page?, limit?, search?
 */
router.get('/:id/content', 
  validateClassId,
  validatePagination,
  manageClassContent
);

/**
 * POST /admin/classes/:id/content - Add content to class
 * Body: { content_id, content_type, access_level? }
 */
router.post('/:id/content', 
  validateContentManagement,
  addClassContent
);

/**
 * PUT /admin/classes/:id/content/:contentId - Update class content access
 * Body: { access_level }
 */
router.put('/:id/content/:contentId', 
  validateClassId,
  validateContentData,
  updateClassContent
);

/**
 * DELETE /admin/classes/:id/content/:contentId - Remove content from class
 */
router.delete('/:id/content/:contentId', 
  validateClassId,
  deleteClassContent
);

// ===============================================
// INSTRUCTOR MANAGEMENT ROUTES
// ===============================================

/**
 * GET /admin/classes/:id/instructors - Get class instructors
 * Query: page?, limit?, search?, role?
 */
router.get('/:id/instructors', 
  validateClassId,
  validatePagination,
  getClassInstructors
);

/**
 * POST /admin/classes/:id/instructors - Add instructor to class
 * Body: { user_id, instructor_role?, permissions? }
 */
router.post('/:id/instructors', 
  validateClassId,
  validateUserId,
  addInstructorToClass
);

/**
 * DELETE /admin/classes/:id/instructors/:instructorId - Remove instructor
 * Body: { reason?, transfer_classes? }
 */
router.delete('/:id/instructors/:instructorId', 
  validateClassId,
  validateUserId,
  removeInstructorFromClass
);

// ===============================================
// ANALYTICS & REPORTING ROUTES
// ===============================================

/**
 * GET /admin/classes/analytics - Get comprehensive class analytics
 * Query: period?, class_type?, include_inactive?, breakdown?, class_id?
 */
router.get('/analytics', 
  validateDateRange,
  getClassAnalytics
);

/**
 * GET /admin/classes/stats - Get class statistics summary
 * Query: summary?, by_type?, by_status?, recent_activity?
 */
router.get('/stats', 
  getClassStats
);

/**
 * GET /admin/classes/:id/analytics - Get specific class analytics
 * Query: period?, breakdown?
 */
router.get('/:id/analytics', 
  validateClassId,
  validateDateRange,
  getSpecificClassAnalytics
);

// ===============================================
// DATA EXPORT ROUTES (SUPER ADMIN ONLY)
// ===============================================

/**
 * GET /admin/classes/export - Export class data
 * Query: format?, include_participants?, include_content?, date_from?, date_to?, class_type?
 */
router.get('/export', 
  authorize(['super_admin']),
  validateDateRange,
  exportClassData
);

/**
 * GET /admin/classes/export/participants - Export participant data
 * Query: format?, date_from?, date_to?, class_ids?
 */
router.get('/export/participants', 
  authorize(['super_admin']),
  validateDateRange,
  exportParticipantData
);

/**
 * GET /admin/classes/export/analytics - Export analytics data
 * Query: format?, period?, class_type?, breakdown?
 */
router.get('/export/analytics', 
  authorize(['super_admin']),
  validateDateRange,
  exportAnalyticsData
);

// ===============================================
// BULK OPERATIONS ROUTES
// ===============================================

/**
 * POST /admin/classes/bulk-create - Bulk create classes
 * Body: { classes: [{ class_name, ... }, ...] }
 * Limit: 20 classes per request
 */
router.post('/bulk-create', 
  validateBulkOperation,
  bulkCreateClasses
);

/**
 * PUT /admin/classes/bulk-update - Bulk update classes
 * Body: { class_ids: [...], updates: {...} }
 * Limit: 50 classes per request
 */
router.put('/bulk-update', 
  validateBulkOperation,
  bulkUpdateClasses
);

/**
 * DELETE /admin/classes/bulk-delete - Bulk delete classes
 * Body: { class_ids: [...], force?, transfer_members_to? }
 * Limit: 20 classes per request
 */
router.delete('/bulk-delete', 
  authorize(['super_admin']), // Only super admins can bulk delete
  validateBulkOperation,
  bulkDeleteClasses
);

// ===============================================
// SYSTEM CONFIGURATION ROUTES
// ===============================================

/**
 * GET /admin/classes/config - Get class system configuration
 */
router.get('/config', 
  authorize(['super_admin']),
  getClassConfiguration
);

/**
 * PUT /admin/classes/config - Update class system configuration
 * Body: { default_max_members?, default_privacy_level?, allowed_class_types?, auto_approve_joins?, notification_settings? }
 */
router.put('/config', 
  authorize(['super_admin']),
  updateClassConfiguration
);

// ===============================================
// MONITORING & MAINTENANCE ROUTES
// ===============================================

/**
 * GET /admin/classes/health - System health check for class management
 */
router.get('/health',
  getClassSystemHealth
);

/**
 * GET /admin/classes/test - Admin class routes test
 */
router.get('/test', 
  testAdminClassRoutes
);

/**
 * POST /admin/classes/maintenance/cleanup - Cleanup orphaned data (super admin only)
 * Body: { cleanup_type?, dry_run? }
 */
router.post('/maintenance/cleanup',
  authorize(['super_admin']),
  async (req, res) => {
    const { cleanup_type = 'all', dry_run = true } = req.body;
    
    // Placeholder for maintenance operations
    console.log(`🧹 Admin ${req.user.username} initiated cleanup: ${cleanup_type} (dry_run: ${dry_run})`);
    
    res.json({
      success: true,
      message: 'Maintenance cleanup - implement with maintenance service',
      operation: {
        type: cleanup_type,
        dry_run: Boolean(dry_run),
        initiated_by: req.user.username,
        admin_id: req.user.id
      },
      placeholder: true,
      timestamp: new Date().toISOString()
    });
  }
);

/**
 * POST /admin/classes/maintenance/recompute-stats - Recompute class statistics (super admin only)
 */
router.post('/maintenance/recompute-stats',
  authorize(['super_admin']),
  async (req, res) => {
    console.log(`📊 Admin ${req.user.username} initiated stats recomputation`);
    
    res.json({
      success: true,
      message: 'Statistics recomputation - implement with maintenance service',
      operation: {
        type: 'recompute_statistics',
        initiated_by: req.user.username,
        admin_id: req.user.id
      },
      placeholder: true,
      timestamp: new Date().toISOString()
    });
  }
);

// ===============================================
// WEBHOOK MANAGEMENT ROUTES (if webhooks enabled)
// ===============================================

if (process.env.ENABLE_ADMIN_WEBHOOKS === 'true') {
  /**
   * GET /admin/classes/webhooks - Get configured webhooks
   */
  /**
   * GET /admin/classes/webhooks - Get configured webhooks
   */
  router.get('/webhooks',
    authorize(['super_admin']),
    (req, res) => {
      res.json({
        success: true,
        message: 'Webhook management - implement with webhook service',
        data: {
          webhooks: [],
          total_webhooks: 0
        },
        admin_context: {
          admin_id: req.user.id,
          can_manage: true
        },
        placeholder: true,
        timestamp: new Date().toISOString()
      });
    }
  );

  /**
   * POST /admin/classes/webhooks - Configure new webhook
   * Body: { url, events, secret?, enabled? }
   */
  router.post('/webhooks',
    authorize(['super_admin']),
    (req, res) => {
      const { url, events, secret, enabled = true } = req.body;
      
      console.log(`🔗 Admin ${req.user.username} configuring webhook: ${url}`);
      
      res.json({
        success: true,
        message: 'Webhook configuration - implement with webhook service',
        webhook: { url, events, enabled },
        configured_by: req.user.username,
        placeholder: true,
        timestamp: new Date().toISOString()
      });
    }
  );
}

// ===============================================
// AUDIT LOG ROUTES
// ===============================================

/**
 * GET /admin/classes/audit-log - Get audit log for class operations
 * Query: page?, limit?, action_type?, admin_id?, date_from?, date_to?, class_id?
 */
router.get('/audit-log',
  authorize(['super_admin']),
  validatePagination,
  validateDateRange,
  async (req, res) => {
    const {
      page = 1,
      limit = 50,
      action_type,
      admin_id,
      date_from,
      date_to,
      class_id
    } = req.query;

    // Placeholder for audit log implementation
    res.json({
      success: true,
      message: 'Audit log - implement with audit service',
      data: {
        audit_entries: [],
        total_entries: 0
      },
      filters: {
        action_type,
        admin_id,
        date_from,
        date_to,
        class_id
      },
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total_pages: 0,
        total_records: 0
      },
      accessed_by: req.user.username,
      placeholder: true,
      timestamp: new Date().toISOString()
    });
  }
);

// ===============================================
// ADVANCED SEARCH & FILTERING ROUTES
// ===============================================

/**
 * POST /admin/classes/search - Advanced admin search with complex criteria
 * Body: { filters: {...}, sort: {...}, pagination: {...} }
 */
router.post('/search',
  validatePagination,
  async (req, res) => {
    const { filters = {}, sort = {}, pagination = {} } = req.body;
    
    console.log(`🔍 Admin ${req.user.username} performing advanced search`);
    
    res.json({
      success: true,
      message: 'Advanced search - implement with enhanced search service',
      search_criteria: { filters, sort, pagination },
      results: {
        classes: [],
        total_results: 0
      },
      searched_by: req.user.username,
      placeholder: true,
      timestamp: new Date().toISOString()
    });
  }
);

// ===============================================
// INTEGRATION ROUTES
// ===============================================

/**
 * POST /admin/classes/integration/sync - Sync with external systems
 * Body: { system_type, sync_direction?, force_sync? }
 */
router.post('/integration/sync',
  authorize(['super_admin']),
  async (req, res) => {
    const { system_type, sync_direction = 'bidirectional', force_sync = false } = req.body;
    
    if (!system_type) {
      return res.status(400).json({
        success: false,
        error: 'system_type is required',
        available_systems: ['lms', 'crm', 'external_api'],
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`🔄 Admin ${req.user.username} initiated sync with ${system_type}`);
    
    res.json({
      success: true,
      message: 'External system sync - implement with integration service',
      sync_operation: {
        system_type,
        sync_direction,
        force_sync: Boolean(force_sync),
        initiated_by: req.user.username,
        admin_id: req.user.id
      },
      placeholder: true,
      timestamp: new Date().toISOString()
    });
  }
);

// ===============================================
// DEVELOPMENT & DEBUGGING ROUTES
// ===============================================

if (process.env.NODE_ENV === 'development') {
  /**
   * GET /admin/classes/debug/routes - List all available admin routes
   */
  router.get('/debug/routes', (req, res) => {
    res.json({
      success: true,
      message: 'Admin class routes listing',
      routes: {
        class_management: {
          'GET /': 'Get all classes for management',
          'POST /': 'Create new class',
          'GET /:id': 'Get specific class (admin view)',
          'PUT /:id': 'Update class',
          'DELETE /:id': 'Delete class',
          'POST /:id/restore': 'Restore archived class (super admin)',
          'POST /:id/duplicate': 'Duplicate class'
        },
        participant_management: {
          'GET /:id/participants': 'Get class participants (admin view)',
          'POST /:id/participants': 'Add participant to class',
          'PUT /:id/participants/:userId': 'Update participant',
          'DELETE /:id/participants/:userId': 'Remove participant',
          'POST /:id/participants/:userId/manage': 'Manage participant membership',
          'GET /:id/enrollment-stats': 'Get enrollment statistics'
        },
        content_management: {
          'GET /:id/content': 'Get class content (admin view)',
          'POST /:id/content': 'Add content to class',
          'PUT /:id/content/:contentId': 'Update class content',
          'DELETE /:id/content/:contentId': 'Delete class content'
        },
        instructor_management: {
          'GET /:id/instructors': 'Get class instructors',
          'POST /:id/instructors': 'Add instructor',
          'DELETE /:id/instructors/:instructorId': 'Remove instructor'
        },
        analytics: {
          'GET /analytics': 'System-wide class analytics',
          'GET /stats': 'Class statistics summary',
          'GET /:id/analytics': 'Specific class analytics'
        },
        data_export: {
          'GET /export': 'Export class data (super admin)',
          'GET /export/participants': 'Export participants (super admin)',
          'GET /export/analytics': 'Export analytics (super admin)'
        },
        bulk_operations: {
          'POST /bulk-create': 'Bulk create classes',
          'PUT /bulk-update': 'Bulk update classes',
          'DELETE /bulk-delete': 'Bulk delete classes (super admin)'
        },
        configuration: {
          'GET /config': 'Get class configuration (super admin)',
          'PUT /config': 'Update class configuration (super admin)'
        },
        monitoring: {
          'GET /health': 'System health check',
          'GET /test': 'Admin routes test',
          'POST /maintenance/cleanup': 'Cleanup orphaned data (super admin)',
          'POST /maintenance/recompute-stats': 'Recompute statistics (super admin)'
        },
        audit: {
          'GET /audit-log': 'Get audit log (super admin)'
        },
        search: {
          'POST /search': 'Advanced admin search'
        },
        integration: {
          'POST /integration/sync': 'Sync with external systems (super admin)'
        }
      },
      permission_levels: {
        admin: 'Basic admin operations (most routes)',
        super_admin: 'Full system access (config, export, bulk delete, maintenance)',
        moderator: 'Limited admin access (class-specific operations)'
      },
      security_notes: {
        authentication: 'All routes require admin authentication',
        authorization: 'Routes are role-based with different access levels',
        rate_limiting: process.env.ENABLE_ADMIN_RATE_LIMITING === 'true' ? 'Enabled (200 req/5min)' : 'Disabled',
        audit_logging: 'All admin actions are logged'
      },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * GET /admin/classes/debug/permissions - Check admin permissions
   */
  router.get('/debug/permissions', (req, res) => {
    const permissions = {
      user_info: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role
      },
      access_levels: {
        basic_admin: ['admin', 'super_admin', 'moderator'].includes(req.user.role),
        super_admin: req.user.role === 'super_admin',
        can_export: req.user.role === 'super_admin',
        can_bulk_delete: req.user.role === 'super_admin',
        can_configure: req.user.role === 'super_admin',
        can_maintenance: req.user.role === 'super_admin'
      },
      available_operations: []
    };

    if (permissions.access_levels.basic_admin) {
      permissions.available_operations.push(
        'class_management', 'participant_management', 'content_management',
        'instructor_management', 'analytics', 'bulk_create', 'bulk_update'
      );
    }

    if (permissions.access_levels.super_admin) {
      permissions.available_operations.push(
        'system_configuration', 'data_export', 'bulk_delete',
        'maintenance_operations', 'audit_access', 'webhook_management'
      );
    }

    res.json({
      success: true,
      message: 'Admin permissions check',
      data: permissions,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * POST /admin/classes/debug/simulate-error - Simulate error for testing
   * Body: { error_type?, status_code? }
   */
  router.post('/debug/simulate-error', (req, res) => {
    const { error_type = 'generic', status_code = 500 } = req.body;
    
    console.log(`🧪 Admin ${req.user.username} simulating error: ${error_type}`);
    
    switch (error_type) {
      case 'validation':
        return res.status(400).json({
          success: false,
          error: 'Simulated validation error',
          code: 'VALIDATION_ERROR',
          simulated: true
        });
      case 'unauthorized':
        return res.status(401).json({
          success: false,
          error: 'Simulated unauthorized error',
          code: 'UNAUTHORIZED',
          simulated: true
        });
      case 'forbidden':
        return res.status(403).json({
          success: false,
          error: 'Simulated forbidden error',
          code: 'FORBIDDEN',
          simulated: true
        });
      case 'not_found':
        return res.status(404).json({
          success: false,
          error: 'Simulated not found error',
          code: 'NOT_FOUND',
          simulated: true
        });
      default:
        return res.status(parseInt(status_code)).json({
          success: false,
          error: 'Simulated generic error',
          code: 'SIMULATED_ERROR',
          error_type,
          simulated: true
        });
    }
  });
}

// ===============================================
// ERROR HANDLING
// ===============================================

/**
 * 404 handler for admin class routes (must be before general error handler)
 */
router.use('*', handleAdminClassNotFound);

/**
 * Error handler for admin class routes
 */
router.use((error, req, res, next) => {
  console.error('❌ Admin class route error:', {
    error: error.message,
    path: req.path,
    method: req.method,
    admin: req.user?.username || 'unknown',
    admin_role: req.user?.role,
    timestamp: new Date().toISOString(),
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
  
  // Determine error type and status code
  let statusCode = 500;
  let errorCode = 'ADMIN_ERROR';
  
  if (error.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    errorCode = 'UNAUTHORIZED';
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
    errorCode = 'FORBIDDEN';
  } else if (error.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    errorCode = 'DUPLICATE_ENTRY';
  } else if (error.statusCode) {
    statusCode = error.statusCode;
    errorCode = error.code || 'CUSTOM_ADMIN_ERROR';
  }
  
  res.status(statusCode).json({
    success: false,
    error: error.message || 'Admin class operation error',
    code: errorCode,
    admin_action: true,
    path: req.path,
    method: req.method,
    admin_context: {
      admin_id: req.user?.id,
      admin_username: req.user?.username,
      admin_role: req.user?.role
    },
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error.details
    })
  });
});

// ===============================================
// ROUTE INITIALIZATION LOGGING
// ===============================================

if (process.env.NODE_ENV === 'development') {
  console.log('🔐 Admin class routes loaded successfully:');
  console.log('   📋 Management: GET /, POST /, GET /:id, PUT /:id, DELETE /:id');
  console.log('   👥 Participants: GET /:id/participants, POST /:id/participants, manage operations');
  console.log('   📚 Content: GET /:id/content, POST /:id/content, PUT/DELETE operations');
  console.log('   👨‍🏫 Instructors: GET /:id/instructors, POST /:id/instructors, DELETE operations');
  console.log('   📊 Analytics: GET /analytics, GET /stats, GET /:id/analytics');
  console.log('   💾 Export: GET /export/* (super admin only)');
  console.log('   🔢 Bulk Ops: POST /bulk-create, PUT /bulk-update, DELETE /bulk-delete');
  console.log('   ⚙️  Config: GET /config, PUT /config (super admin only)');
  console.log('   🔧 Monitoring: GET /health, GET /test, POST /maintenance/*');
  console.log('   📝 Audit: GET /audit-log (super admin only)');
  console.log('   🔍 Search: POST /search');
  console.log('   🔗 Integration: POST /integration/sync (super admin only)');
  if (process.env.ENABLE_ADMIN_WEBHOOKS === 'true') {
    console.log('   🪝 Webhooks: GET /webhooks, POST /webhooks (super admin only)');
  }
}

// ===============================================
// EXPORT ROUTER
// ===============================================

export default router;