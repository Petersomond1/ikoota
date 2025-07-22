// ikootaapi/routes/membershipRoutes.js - AUTH ENDPOINTS REMOVED
import express from 'express';
import { 
  // ✅ REMOVED: Authentication endpoints moved to authRoutes
  // sendVerificationCode,
  // registerWithVerification,
  // enhancedLogin,
  
  // ✅ KEEP: Membership-specific endpoints
  checkApplicationStatus,
  submitInitialApplication,
  submitFullMembershipApplication,
  getFullMembershipStatus,
  logFullMembershipAccess,
  getPendingApplications,
  updateApplicationStatus,
  updateFullMembershipStatus,
  sendNotification,
  getPendingFullMemberships,
  sendMembershipNotification,
  getMembershipOverview,
  getMembershipStats,
  getUserDashboard,
  getApplicationHistory,
  bulkApproveApplications,
  exportMembershipData,
  getMembershipAnalytics,
  getUserPermissions,
  healthCheck,
  getSystemConfig,
  requireAdmin,
  requireSuperAdmin,
  validateRequest,
  getAllReports,
  // ✅ NEW: Missing function imports
  updateApplicationAnswers,
  withdrawApplication,
  getApplicationRequirements,
  getUserByIdFixed,
  testUserLookup,
   getCurrentMembershipStatus,
  approvePreMemberApplication,
  declinePreMemberApplication,
  getAvailableMentors,
  getAvailableClasses
} from '../controllers/membershipControllers.js';



import { authenticate, cacheMiddleware } from '../middlewares/auth.middleware.js';
import db from '../config/db.js';

const router = express.Router();

// ==================================================
// DEVELOPMENT & TESTING ROUTES
// ==================================================

// Simple test route to verify routing works
router.get('/test-simple', (req, res) => {
  res.json({
    success: true,
    message: 'Membership routes are working!',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
});

// Test route with authentication
router.get('/test-auth', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Authentication is working!',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Test the getUserDashboard function directly
router.get('/test-dashboard', authenticate, async (req, res) => {
  try {
    console.log('🧪 Test dashboard route called');
    console.log('🧪 User:', req.user);
    
    res.json({
      success: true,
      message: 'Test dashboard route working',
      user: req.user,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('🧪 Test dashboard error:', error);
    res.status(500).json({ error: 'Test dashboard failed' });
  }
});

// ✅ NEW: Debug user lookup routes
router.get('/test-user-lookup/:userId', authenticate, requireAdmin, testUserLookup);
router.get('/test-user-lookup', authenticate, testUserLookup);

// Development admin setup (ONLY for development)
if (process.env.NODE_ENV === 'development') {
  router.post('/dev/setup-admin/:userId', authenticate, async (req, res) => {
    try {
      const { userId } = req.params;
      
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      console.log('🛠️ Setting up admin account for development...');
      
      await db.query(`
        UPDATE users 
        SET 
          membership_stage = 'member',
          is_member = 'active',
          updatedAt = NOW()
        WHERE id = ?
      `, [userId]);
      
      await db.query(`
        INSERT INTO surveylog (
          user_id, 
          answers, 
          application_type, 
          approval_status, 
          admin_notes,
          reviewed_by,
          reviewed_at,
          createdAt
        ) VALUES (?, ?, 'initial_application', 'approved', 'Dev setup', ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          approval_status = 'approved',
          admin_notes = 'Dev setup - updated'
      `, [userId.toString(), JSON.stringify({dev: 'setup'}), userId]);
      
      await db.query(`
        INSERT INTO full_membership_access (
          user_id, 
          first_accessed_at, 
          last_accessed_at, 
          access_count
        ) VALUES (?, NOW(), NOW(), 1)
        ON DUPLICATE KEY UPDATE
          last_accessed_at = NOW(),
          access_count = access_count + 1
      `, [userId]);
      
      res.json({
        success: true,
        message: 'Admin account setup completed for development',
        userId: userId,
        newStatus: {
          membership_stage: 'member',
          is_member: 'active'
        }
      });
      
    } catch (error) {
      console.error('❌ Dev setup error:', error);
      res.status(500).json({ error: 'Failed to setup admin account' });
    }
  });
}

// ==================================================
// ✅ REMOVED: AUTHENTICATION ENDPOINTS (Now in authRoutes.js)
// ==================================================
// These endpoints have been moved to /api/auth/
// - POST /auth/send-verification -> moved to authRoutes.js
// - POST /auth/register -> moved to authRoutes.js  
// - POST /auth/login -> moved to authRoutes.js

// ==================================================
// STAGE 1: INITIAL APPLICATION ENDPOINTS
// ==================================================

// User Dashboard and Status
router.get('/dashboard', authenticate, getUserDashboard);
router.get('/application-history', authenticate, getApplicationHistory);

// Initial Application Survey
router.get('/survey/check-status', authenticate, checkApplicationStatus);
router.post('/survey/submit-application', authenticate, submitInitialApplication);

// ✅ NEW: Application Management Routes
router.put('/application/update-answers', authenticate, updateApplicationAnswers);
router.post('/application/withdraw', authenticate, withdrawApplication);
router.get('/application/requirements', authenticate, getApplicationRequirements);

// Admin endpoints for initial applications
router.get('/admin/pending-applications', authenticate, requireAdmin, getPendingApplications);
router.put('/admin/update-user-status/:userId', authenticate, requireAdmin, updateApplicationStatus);
router.post('/admin/bulk-approve', authenticate, requireAdmin, bulkApproveApplications);

// ==================================================
// STAGE 2: FULL MEMBERSHIP ENDPOINTS
// ==================================================

// Full Membership Application
router.get('/membership/full-membership-status', authenticate, getFullMembershipStatus);
router.post('/membership/log-full-membership-access', authenticate, logFullMembershipAccess);
router.post('/membership/submit-full-membership', authenticate, submitFullMembershipApplication);

// Admin endpoints for full membership
router.get('/admin/pending-full-memberships', authenticate, requireAdmin, getPendingFullMemberships);
router.put('/admin/review-full-membership/:applicationId', authenticate, requireAdmin, updateFullMembershipStatus);

// ==================================================
// ENHANCED ADMIN ENDPOINTS
// ==================================================

// Analytics and Overview
router.get('/admin/membership-overview', authenticate, requireAdmin, cacheMiddleware(600), getMembershipOverview);
router.get('/admin/membership-stats', authenticate, requireAdmin, cacheMiddleware(600), getMembershipStats);
router.get('/admin/analytics', authenticate, requireAdmin, cacheMiddleware(600), getMembershipAnalytics);

// Communication
router.post('/admin/send-notification', authenticate, requireAdmin, sendNotification);
router.post('/admin/send-membership-notification', authenticate, requireAdmin, sendMembershipNotification);

// Data Export
router.get('/admin/export-membership-data', authenticate, requireAdmin, exportMembershipData);




// Add these routes:
router.get('/status', authenticate, getCurrentMembershipStatus);
router.post('/approve/:userId', authenticate, requireAdmin, approvePreMemberApplication);
router.post('/decline/:userId', authenticate, requireAdmin, declinePreMemberApplication);
router.get('/admin/mentors', authenticate, requireAdmin, getAvailableMentors);
router.get('/admin/classes', authenticate, requireAdmin, getAvailableClasses);
// ==================================================
// ALTERNATIVE ROUTES FOR COMPATIBILITY
// ==================================================

// User routes (require authentication) - MISSING ROUTES ADDED
router.get('/status', authenticate, checkApplicationStatus);
router.get('/history', authenticate, getApplicationHistory);
router.get('/permissions', authenticate, getUserPermissions);

// ✅ NEW: Additional application management routes
router.get('/application/status', authenticate, checkApplicationStatus);
router.put('/application/answers', authenticate, updateApplicationAnswers);
router.delete('/application', authenticate, withdrawApplication);
router.get('/application/info', authenticate, getApplicationRequirements);

// Application routes - MISSING ROUTES ADDED
router.post('/application', authenticate, submitInitialApplication);
router.get('/full-membership/status', authenticate, getFullMembershipStatus);
router.post('/full-membership/apply', authenticate, submitFullMembershipApplication);
router.post('/full-membership/access', authenticate, logFullMembershipAccess);

// Admin routes (require admin privileges) - MISSING ROUTES ADDED
router.get('/admin/applications', 
  authenticate, 
  requireAdmin, 
  getPendingApplications        
);

router.put('/admin/applications/:userId/status', 
  authenticate, 
  requireAdmin, 
  updateApplicationStatus
);

router.post('/admin/applications/bulk', 
  authenticate, 
  requireAdmin, 
  bulkApproveApplications
);

router.get('/admin/full-memberships', 
  authenticate, 
  requireAdmin, 
  getPendingFullMemberships
);

router.put('/admin/full-memberships/:applicationId/status', 
  authenticate, 
  requireAdmin, 
  updateFullMembershipStatus
);

// Analytics & Reporting (Admin only) - MISSING ROUTES ADDED
router.get('/admin/overview', 
  authenticate, 
  requireAdmin, 
  getMembershipOverview
);

router.get('/admin/stats', 
  authenticate, 
  requireAdmin, 
  getMembershipStats
);

router.get('/admin/export', 
  authenticate, 
  requireAdmin, 
  exportMembershipData
);

// Notifications (Admin only) - MISSING ROUTES ADDED
router.post('/admin/notifications/send', 
  authenticate, 
  requireAdmin, 
  sendNotification
);

router.post('/admin/notifications/membership', 
  authenticate, 
  requireAdmin, 
  sendMembershipNotification
);

// System routes - MISSING ROUTES ADDED
router.get('/health', healthCheck);
router.get('/admin/config', 
  authenticate, 
  requireAdmin, 
  getSystemConfig
);

// ==================================================
// VALIDATION MIDDLEWARE EXAMPLES
// ==================================================

// Example routes with validation middleware
router.post('/admin/notifications/validated-send', 
  authenticate, 
  requireAdmin,
  validateRequest(['recipients', 'subject', 'message']),
  sendNotification
);

router.post('/admin/applications/validated-bulk',
  authenticate,
  requireAdmin,
  validateRequest(['userIds', 'action']),
  bulkApproveApplications
);

// ✅ NEW: Application management with validation
router.put('/application/answers/validated',
  authenticate,
  validateRequest(['answers']),
  updateApplicationAnswers
);

router.post('/application/withdraw/validated',
  authenticate,
  validateRequest(['reason']),
  withdrawApplication
);

// ==================================================
// SUPER ADMIN ROUTES
// ==================================================

// Super admin only routes
router.get('/admin/super/config', 
  authenticate, 
  requireSuperAdmin, 
  getSystemConfig
);

router.post('/admin/super/emergency-reset/:userId',
  authenticate,
  requireSuperAdmin,
  (req, res) => {
    // Emergency user reset functionality
    res.json({
      success: true,
      message: 'Emergency user reset functionality - implement as needed'
    });
  }
);

// ✅ NEW: Super admin debug routes
router.get('/admin/super/debug/user/:userId',
  authenticate,
  requireSuperAdmin,
  testUserLookup
);

router.get('/admin/reports', 
  authenticate, 
  requireAdmin, 
  getAllReports
);

// ==================================================
// ERROR HANDLING & LOGGING
// ==================================================

// Log all routes in development
if (process.env.NODE_ENV === 'development') {
  console.log('🛣️ Membership routes loaded:');
  console.log('   ❌ REMOVED Auth: /auth/login, /auth/send-verification, /auth/register -> Now in authRoutes.js');
  console.log('   User: /dashboard, /application-history, /status, /history, /permissions');
  console.log('   Survey: /survey/check-status, /survey/submit-application');
  console.log('   ✅ NEW Applications: /application/*, /application/update-answers, /application/withdraw');
  console.log('   Applications: /application, /full-membership/*');
  console.log('   Full Membership: /membership/full-membership-status, /membership/log-full-membership-access');
  console.log('   Admin Applications: /admin/pending-applications, /admin/applications/*');
  console.log('   Admin Full Membership: /admin/pending-full-memberships, /admin/full-memberships/*');
  console.log('   Admin Analytics: /admin/membership-overview, /admin/analytics, /admin/overview');
  console.log('   Admin Communication: /admin/send-notification, /admin/notifications/*');
  console.log('   System: /health, /admin/config');
  console.log('   ✅ NEW Debug: /test-user-lookup, /test-user-lookup/:userId');
  console.log('   Test: /test-simple, /test-auth, /test-dashboard');
  console.log('   Dev: /dev/setup-admin/:userId');
}

// 404 handler for unmatched routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Membership route not found',
    path: req.path,
    method: req.method,
    note: 'Authentication endpoints have been moved to /api/auth/',
    availableRoutes: {
      authentication_moved: [
        'POST /api/auth/send-verification (MOVED from here)',
        'POST /api/auth/register (MOVED from here)', 
        'POST /api/auth/login (MOVED from here)'
      ],
      user: [
        'GET /dashboard',
        'GET /application-history',
        'GET /status',
        'GET /history',
        'GET /permissions'
      ],
      survey: [
        'GET /survey/check-status',
        'POST /survey/submit-application'
      ],
      applications: [
        'POST /application',
        'GET /application/status',
        'PUT /application/update-answers',
        'PUT /application/answers',
        'POST /application/withdraw',
        'DELETE /application',
        'GET /application/requirements',
        'GET /application/info',
        'GET /full-membership/status',
        'POST /full-membership/apply',
        'POST /full-membership/access'
      ],
      fullMembership: [
        'GET /membership/full-membership-status',
        'POST /membership/log-full-membership-access',
        'POST /membership/submit-full-membership'
      ],
      admin: [
        'GET /admin/pending-applications',
        'PUT /admin/update-user-status/:userId',
        'POST /admin/bulk-approve',
        'GET /admin/applications',
        'PUT /admin/applications/:userId/status',
        'POST /admin/applications/bulk',
        'GET /admin/pending-full-memberships',
        'PUT /admin/review-full-membership/:applicationId',
        'GET /admin/full-memberships',
        'PUT /admin/full-memberships/:applicationId/status'
      ],
      analytics: [
        'GET /admin/membership-overview',
        'GET /admin/membership-stats',
        'GET /admin/analytics',
        'GET /admin/overview',
        'GET /admin/stats',
        'GET /admin/export',
        'GET /admin/export-membership-data'
      ],
      notifications: [
        'POST /admin/send-notification',
        'POST /admin/send-membership-notification',
        'POST /admin/notifications/send',
        'POST /admin/notifications/membership'
      ],
      system: [
        'GET /health',
        'GET /admin/config'
      ],
      debug: [
        'GET /test-user-lookup',
        'GET /test-user-lookup/:userId',
        'GET /admin/super/debug/user/:userId'
      ],
      development: [
        'GET /test-simple',
        'GET /test-auth',
        'GET /test-dashboard',
        'POST /dev/setup-admin/:userId'
      ]
    }
  });
});

// Global error handler for this router
router.use((error, req, res, next) => {
  console.error('Membership route error:', error);
  
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Internal server error',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

export default router;

