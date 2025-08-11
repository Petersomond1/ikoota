// ikootaapi/routes/identityAdminRoutes.js
// IDENTITY ADMIN ROUTES - Super Admin Identity Management
// Handles identity masking, unmasking, and comprehensive identity administration

import express from 'express';
import { authenticate, requireAdmin, requireSuperAdmin } from '../middlewares/auth.middleware.js';

// Import identity admin controllers
import {
  maskUserIdentity,
  unmaskUserIdentity,
  getIdentityAuditTrail,
  getIdentityOverview,
  searchMaskedIdentities,
  generateBulkConverseIds,
  verifyIdentityIntegrity,
  getMentorAnalytics,
  bulkAssignMentors,
  getIdentityDashboard,
  exportIdentityData,
  manageMentorAssignment,
  generateUniqueConverseId,
  getCompleteUserIdentity,
  updateMaskingSettings
} from '../controllers/identityAdminControllers.js';

const router = express.Router();

// ===============================================
// CORE IDENTITY MASKING OPERATIONS (Admin Only)
// ===============================================

// POST /admin/identity/mask-identity - Mask user identity when granting membership
router.post('/mask-identity', authenticate, requireAdmin, maskUserIdentity);

// POST /admin/identity/unmask - Unmask user identity (Super Admin only)
router.post('/unmask', authenticate, requireSuperAdmin, unmaskUserIdentity);

// ===============================================
// IDENTITY AUDIT & MONITORING (Super Admin Only)
// ===============================================

// GET /admin/identity/audit-trail - Get identity masking audit trail
router.get('/audit-trail', authenticate, requireSuperAdmin, getIdentityAuditTrail);

// GET /admin/identity/overview - Get identity system overview
router.get('/overview', authenticate, requireSuperAdmin, getIdentityOverview);

// GET /admin/identity/verify-integrity - Verify identity system integrity
router.get('/verify-integrity', authenticate, requireSuperAdmin, verifyIdentityIntegrity);

// GET /admin/identity/dashboard - Get identity management dashboard
router.get('/dashboard', authenticate, requireAdmin, getIdentityDashboard);

// ===============================================
// IDENTITY SEARCH & LOOKUP (Super Admin Only)
// ===============================================

// GET /admin/identity/search - Search masked identities
router.get('/search', authenticate, requireSuperAdmin, searchMaskedIdentities);

// GET /admin/identity/user/:userId/complete - Get complete user identity
router.get('/user/:userId/complete', authenticate, requireSuperAdmin, getCompleteUserIdentity);

// ===============================================
// CONVERSE ID GENERATION (Admin Only)
// ===============================================

// POST /admin/identity/generate-converse-id - Generate unique converse ID
router.post('/generate-converse-id', authenticate, requireAdmin, generateUniqueConverseId);

// POST /admin/identity/generate-bulk-ids - Generate bulk converse IDs
router.post('/generate-bulk-ids', authenticate, requireAdmin, generateBulkConverseIds);

// ===============================================
// MENTOR ASSIGNMENT MANAGEMENT (Admin Only)
// ===============================================

// GET /admin/identity/mentor-analytics - Get mentor assignment analytics
router.get('/mentor-analytics', authenticate, requireAdmin, getMentorAnalytics);

// POST /admin/identity/bulk-assign-mentors - Bulk assign mentors to mentees
router.post('/bulk-assign-mentors', authenticate, requireAdmin, bulkAssignMentors);

// PUT /admin/identity/mentor-assignments/:menteeConverseId - Manage mentor assignments
router.put('/mentor-assignments/:menteeConverseId', authenticate, requireAdmin, manageMentorAssignment);

// ===============================================
// SYSTEM CONFIGURATION (Super Admin Only)
// ===============================================

// PUT /admin/identity/masking-settings - Update identity masking settings
router.put('/masking-settings', authenticate, requireSuperAdmin, updateMaskingSettings);

// GET /admin/identity/export - Export identity data
router.get('/export', authenticate, requireSuperAdmin, exportIdentityData);

// ===============================================
// LEGACY COMPATIBILITY ROUTES
// ===============================================

// POST /admin/mask-identity - Legacy route (maps to new structure)
router.post('/mask-identity-legacy', authenticate, requireAdmin, (req, res, next) => {
  console.log('🔄 Legacy identity masking route accessed - redirecting to new structure');
  maskUserIdentity(req, res, next);
});

// ===============================================
// UTILITY & TESTING ENDPOINTS
// ===============================================

// GET /admin/identity/health - Identity system health check
router.get('/health', authenticate, requireAdmin, async (req, res) => {
  try {
    const healthMetrics = {
      encryptionStatus: process.env.IDENTITY_ENCRYPTION_KEY ? 'active' : 'missing',
      databaseConnection: 'checking...',
      timestamp: new Date().toISOString()
    };
    
    // Test database connection
    try {
      await db.query('SELECT 1');
      healthMetrics.databaseConnection = 'healthy';
    } catch (dbError) {
      healthMetrics.databaseConnection = 'error';
      healthMetrics.dbError = dbError.message;
    }
    
    res.status(200).json({
      success: true,
      message: 'Identity system health check',
      health: healthMetrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      details: error.message
    });
  }
});

// GET /admin/identity/stats - Quick identity statistics
router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const maskedCount = await db.query('SELECT COUNT(*) as count FROM users WHERE is_identity_masked = 1');
    const mentorCount = await db.query('SELECT COUNT(DISTINCT mentor_converse_id) as count FROM mentors WHERE is_active = 1');
    const unassignedCount = await db.query('SELECT COUNT(*) as count FROM users WHERE is_member = "granted" AND mentor_id IS NULL');
    
    res.status(200).json({
      success: true,
      stats: {
        totalMaskedUsers: maskedCount[0]?.count || 0,
        totalMentors: mentorCount[0]?.count || 0,
        unassignedMembers: unassignedCount[0]?.count || 0,
        lastUpdated: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get identity stats',
      details: error.message
    });
  }
});

// ===============================================
// TESTING ENDPOINTS (Development Only)
// ===============================================

if (process.env.NODE_ENV === 'development') {
  // Test identity admin functionality
  router.get('/test', authenticate, requireAdmin, (req, res) => {
    res.json({
      success: true,
      message: 'Identity admin routes are working!',
      timestamp: new Date().toISOString(),
      admin: {
        id: req.user?.id,
        username: req.user?.username,
        role: req.user?.role,
        converseId: req.user?.converse_id
      },
      availableOperations: [
        'POST /mask-identity - Mask user identity',
        'POST /unmask - Unmask user identity (Super Admin)',
        'GET /audit-trail - View audit trail (Super Admin)',
        'GET /overview - System overview (Super Admin)',
        'GET /search - Search identities (Super Admin)',
        'POST /generate-converse-id - Generate converse ID',
        'POST /bulk-assign-mentors - Bulk mentor assignment',
        'GET /mentor-analytics - Mentor analytics',
        'GET /dashboard - Identity dashboard',
        'GET /export - Export identity data (Super Admin)'
      ],
      endpoint: '/api/admin/identity/test'
    });
  });
}

// ===============================================
// ERROR HANDLING
// ===============================================

// 404 handler for identity admin routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Identity admin route not found',
    path: req.path,
    method: req.method,
    availableRoutes: {
      coreOperations: [
        'POST /mask-identity - Mask user identity (Admin)',
        'POST /unmask - Unmask user identity (Super Admin)',
        'GET /overview - System overview (Super Admin)',
        'GET /dashboard - Management dashboard (Admin)'
      ],
      auditAndMonitoring: [
        'GET /audit-trail - Identity audit trail (Super Admin)',
        'GET /verify-integrity - System integrity check (Super Admin)',
        'GET /health - System health check (Admin)',
        'GET /stats - Quick statistics (Admin)'
      ],
      searchAndLookup: [
        'GET /search - Search masked identities (Super Admin)',
        'GET /user/:userId/complete - Complete user identity (Super Admin)'
      ],
      idGeneration: [
        'POST /generate-converse-id - Generate converse ID (Admin)',
        'POST /generate-bulk-ids - Generate bulk IDs (Admin)'
      ],
      mentorManagement: [
        'GET /mentor-analytics - Mentor analytics (Admin)',
        'POST /bulk-assign-mentors - Bulk mentor assignment (Admin)',
        'PUT /mentor-assignments/:menteeConverseId - Manage assignments (Admin)'
      ],
      systemConfig: [
        'PUT /masking-settings - Update masking settings (Super Admin)',
        'GET /export - Export identity data (Super Admin)'
      ]
    },
    accessLevels: {
      admin: 'Can mask identities, generate IDs, manage mentors',
      super_admin: 'Can unmask identities, view audit trails, export data'
    },
    timestamp: new Date().toISOString()
  });
});

// Error handler for identity admin routes
router.use((error, req, res, next) => {
  console.error('❌ Identity admin route error:', {
    error: error.message,
    path: req.path,
    method: req.method,
    admin: req.user?.username || 'unknown',
    role: req.user?.role || 'unknown',
    timestamp: new Date().toISOString()
  });
  
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Identity admin operation error',
    path: req.path,
    method: req.method,
    errorType: 'identity_admin_error',
    timestamp: new Date().toISOString(),
    help: {
      documentation: '/api/info',
      adminRoutes: '/api/admin/identity/',
      support: 'Contact system administrator'
    }
  });
});

if (process.env.NODE_ENV === 'development') {
  console.log('🔐 Identity admin routes loaded: masking, unmasking, mentor management, audit trails');
}

export default router;