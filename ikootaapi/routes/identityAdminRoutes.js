// ikootaapi/routes/identityAdminRoutes.js
// ADMIN IDENTITY CONTROL ROUTES
// Administrative control over converse IDs and mentor IDs

import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

// Import identity admin controllers
import {
  // General identity administration
  getAllIdentities,
  getIdentityById,
  resetUserIdentity,
  maskUserIdentity,
  unmaskUserIdentity,
  
  // Converse ID administration
  getAllConverseIds,
  resetConverseId,
  manageConverseId,
  
  // Mentor ID administration
  getAllMentorIds,
  resetMentorId,
  manageMentorId,
  
  // Identity verification
  verifyIdentity,
  approveIdentityVerification,
  rejectIdentityVerification,
  
  // Analytics and reporting
  getIdentityAnalytics,
  getIdentityStats,
  exportIdentityData
} from '../controllers/identityAdminControllers.js';

const router = express.Router();

// ===============================================
// APPLY ADMIN AUTHENTICATION TO ALL ROUTES
// ===============================================
router.use(authenticate);
router.use(authorize(['admin', 'super_admin']));

// ===============================================
// GENERAL IDENTITY ADMINISTRATION
// ===============================================

// GET /admin/identity - Get all user identities
router.get('/', getAllIdentities);

// GET /admin/identity/:userId - Get specific user's identity
router.get('/:userId', getIdentityById);

// POST /admin/identity/mask-identity - Mask user identity
router.post('/mask-identity', maskUserIdentity);

// POST /admin/identity/unmask-identity - Unmask user identity (super admin only)
router.post('/unmask-identity', authorize(['super_admin']), unmaskUserIdentity);

// POST /admin/identity/:userId/reset - Reset user identity (super admin only)
router.post('/:userId/reset', authorize(['super_admin']), resetUserIdentity);

// ===============================================
// CONVERSE ID ADMINISTRATION
// ===============================================

// GET /admin/identity/converse - Get all converse IDs
router.get('/converse', getAllConverseIds);

// GET /admin/identity/converse/:userId - Get user's converse ID
router.get('/converse/:userId', (req, res, next) => {
  req.identityType = 'converse';
  req.userId = req.params.userId;
  getIdentityById(req, res, next);
});

// PUT /admin/identity/converse/:userId - Manage user's converse ID
router.put('/converse/:userId', manageConverseId);

// POST /admin/identity/converse/:userId/reset - Reset converse ID
router.post('/converse/:userId/reset', resetConverseId);

// ===============================================
// MENTOR ID ADMINISTRATION
// ===============================================

// GET /admin/identity/mentor - Get all mentor IDs
router.get('/mentor', getAllMentorIds);

// GET /admin/identity/mentor/:userId - Get user's mentor ID
router.get('/mentor/:userId', (req, res, next) => {
  req.identityType = 'mentor';
  req.userId = req.params.userId;
  getIdentityById(req, res, next);
});

// PUT /admin/identity/mentor/:userId - Manage user's mentor ID
router.put('/mentor/:userId', manageMentorId);

// POST /admin/identity/mentor/:userId/reset - Reset mentor ID
router.post('/mentor/:userId/reset', resetMentorId);

// ===============================================
// IDENTITY VERIFICATION MANAGEMENT
// ===============================================

// GET /admin/identity/verification/pending - Get pending verifications
router.get('/verification/pending', async (req, res) => {
  res.json({
    success: true,
    message: 'Pending identity verifications endpoint - implement with identity admin service',
    timestamp: new Date().toISOString()
  });
});

// PUT /admin/identity/verification/:id/approve - Approve identity verification
router.put('/verification/:id/approve', approveIdentityVerification);

// PUT /admin/identity/verification/:id/reject - Reject identity verification
router.put('/verification/:id/reject', rejectIdentityVerification);

// POST /admin/identity/verification/:userId/verify - Manually verify identity
router.post('/verification/:userId/verify', verifyIdentity);

// ===============================================
// ANALYTICS & REPORTING
// ===============================================

// GET /admin/identity/analytics - Get identity analytics
router.get('/analytics', getIdentityAnalytics);

// GET /admin/identity/stats - Get identity statistics
router.get('/stats', getIdentityStats);

// GET /admin/identity/usage-stats - Get identity usage statistics
router.get('/usage-stats', async (req, res) => {
  res.json({
    success: true,
    message: 'Identity usage statistics endpoint - implement with identity admin service',
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// DATA EXPORT
// ===============================================

// GET /admin/identity/export - Export identity data (super admin only)
router.get('/export', authorize(['super_admin']), exportIdentityData);

// GET /admin/identity/export/converse - Export converse ID data
router.get('/export/converse', authorize(['super_admin']), (req, res, next) => {
  req.exportType = 'converse';
  exportIdentityData(req, res, next);
});

// GET /admin/identity/export/mentor - Export mentor ID data
router.get('/export/mentor', authorize(['super_admin']), (req, res, next) => {
  req.exportType = 'mentor';
  exportIdentityData(req, res, next);
});

// ===============================================
// BULK OPERATIONS
// ===============================================

// POST /admin/identity/bulk-reset - Bulk reset identities (super admin only)
router.post('/bulk-reset', authorize(['super_admin']), async (req, res) => {
  res.json({
    success: true,
    message: 'Bulk reset identities endpoint - implement with identity admin service',
    timestamp: new Date().toISOString()
  });
});

// POST /admin/identity/bulk-verify - Bulk verify identities
router.post('/bulk-verify', async (req, res) => {
  res.json({
    success: true,
    message: 'Bulk verify identities endpoint - implement with identity admin service',
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// TESTING ENDPOINTS
// ===============================================

// Identity admin test
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Admin identity routes are working!',
    timestamp: new Date().toISOString(),
    user: {
      id: req.user?.id,
      username: req.user?.username,
      role: req.user?.role
    },
    availableOperations: [
      'identity administration',
      'converse ID management',
      'mentor ID management',
      'verification control'
    ],
    endpoint: '/api/admin/identity/test'
  });
});

// ===============================================
// ERROR HANDLING
// ===============================================

// 404 handler
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Admin identity route not found',
    path: req.path,
    method: req.method,
    availableRoutes: {
      generalAdministration: [
        'GET / - Get all user identities',
        'GET /:userId - Get specific user identity',
        'POST /mask-identity - Mask user identity',
        'POST /unmask-identity - Unmask user identity (super admin)',
        'POST /:userId/reset - Reset user identity (super admin)'
      ],
      converseIdAdmin: [
        'GET /converse - Get all converse IDs',
        'GET /converse/:userId - Get user converse ID',
        'PUT /converse/:userId - Manage converse ID',
        'POST /converse/:userId/reset - Reset converse ID'
      ],
      mentorIdAdmin: [
        'GET /mentor - Get all mentor IDs',
        'GET /mentor/:userId - Get user mentor ID',
        'PUT /mentor/:userId - Manage mentor ID',
        'POST /mentor/:userId/reset - Reset mentor ID'
      ],
      verification: [
        'GET /verification/pending - Pending verifications',
        'PUT /verification/:id/approve - Approve verification',
        'PUT /verification/:id/reject - Reject verification',
        'POST /verification/:userId/verify - Manually verify'
      ],
      analytics: [
        'GET /analytics - Identity analytics',
        'GET /stats - Identity statistics',
        'GET /usage-stats - Usage statistics'
      ],
      dataExport: [
        'GET /export - Export identity data (super admin)',
        'GET /export/converse - Export converse data (super admin)',
        'GET /export/mentor - Export mentor data (super admin)'
      ],
      bulkOperations: [
        'POST /bulk-reset - Bulk reset identities (super admin)',
        'POST /bulk-verify - Bulk verify identities'
      ],
      testing: [
        'GET /test - Admin identity routes test'
      ]
    },
    adminNote: 'All routes require admin or super_admin role',
    timestamp: new Date().toISOString()
  });
});

// Error handler
router.use((error, req, res, next) => {
  console.error('❌ Admin identity route error:', {
    error: error.message,
    path: req.path,
    method: req.method,
    user: req.user?.username || 'unauthenticated',
    userRole: req.user?.role,
    timestamp: new Date().toISOString()
  });
  
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Admin identity operation error',
    path: req.path,
    method: req.method,
    userRole: req.user?.role,
    timestamp: new Date().toISOString()
  });
});

if (process.env.NODE_ENV === 'development') {
  console.log('🔐 Admin identity routes loaded: converse/mentor ID control, verification, analytics');
}

export default router;