

// ikootaapi/routes/userStatusRoutes.js
// USER STATUS & DASHBOARD ROUTES
// User dashboard, status checks, and system health endpoints

import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';

// Fix the import in userStatusRoutes.js
import {
  healthCheck,
  testSimple,
  testAuth,
  testDashboard,
  checkSurveyStatus,
  getBasicProfile,
  getLegacyMembershipStatus,
  getUserStatus,
  debugApplicationStatus,
  getSystemStatus
} from '../controllers/userStatusControllers.js';

import {
  getUserDashboard,
  getCurrentMembershipStatus,
  checkApplicationStatus,
  getApplicationHistory,
  getUserPermissions
} from '../controllers/preMemberApplicationController.js';

const router = express.Router();

// ===============================================
// SYSTEM HEALTH & TESTING
// ===============================================

// System health check
router.get('/health', healthCheck);

// System status overview
router.get('/system/status', getSystemStatus);

// Simple connectivity test
router.get('/test-simple', testSimple);

// Authentication test
router.get('/test-auth', authenticate, testAuth);

// Dashboard connectivity test
router.get('/test-dashboard', authenticate, testDashboard);

// ===============================================
// USER DASHBOARD
// ===============================================

// Primary user dashboard with comprehensive status
router.get('/dashboard', authenticate, getUserDashboard);

// ===============================================
// STATUS CHECKING ENDPOINTS
// ===============================================

// Current membership status
router.get('/status', authenticate, getCurrentMembershipStatus);

// Application status check
router.get('/application/status', authenticate, checkApplicationStatus);

// Survey status check (enhanced)
router.get('/survey/check-status', authenticate, checkSurveyStatus);
//router.get('/survey/status', authenticate, checkSurveyStatus);
router.get('/survey/status', authenticate, (req, res) => {
  res.json({ success: true, message: 'Survey status route working!' });
});


// Legacy compatibility endpoints
router.get('/membership/status', authenticate, getLegacyMembershipStatus);
router.get('/user/status', authenticate, getUserStatus);

// ===============================================
// USER PROFILE & PERMISSIONS
// ===============================================

// Basic profile information
router.get('/profile/basic', authenticate, getBasicProfile);

// User permissions
router.get('/permissions', authenticate, getUserPermissions);

// ===============================================
// USER HISTORY & ACTIVITY
// ===============================================

// Application history
router.get('/application-history', authenticate, getApplicationHistory);
router.get('/history', authenticate, getApplicationHistory);

// ===============================================
// DEBUG ROUTES (DEVELOPMENT)
// ===============================================

if (process.env.NODE_ENV === 'development') {
  // Debug application status
  router.get('/debug/application-status/:userId', authenticate, debugApplicationStatus);
  
  // Debug user status consistency
  router.get('/debug/status-consistency', authenticate, async (req, res) => {
    res.json({
      success: true,
      message: 'Status consistency check endpoint - implement with status service',
      timestamp: new Date().toISOString()
    });
  });
}

// ===============================================
// ERROR HANDLING
// ===============================================

// 404 handler
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'User status route not found',
    path: req.path,
    method: req.method,
    availableRoutes: {
      system: [
        'GET /health - System health check',
        'GET /system/status - System status overview',
        'GET /test-simple - Simple connectivity test',
        'GET /test-auth - Authentication test',
        'GET /test-dashboard - Dashboard connectivity test'
      ],
      dashboard: [
        'GET /dashboard - User dashboard with comprehensive status'
      ],
      status: [
        'GET /status - Current membership status',
        'GET /application/status - Application status check',
        'GET /survey/check-status - Enhanced survey status check',
        'GET /membership/status - Legacy membership status',
        'GET /user/status - Alternative user status'
      ],
      profile: [
        'GET /profile/basic - Basic profile information',
        'GET /permissions - User permissions'
      ],
      history: [
        'GET /application-history - Application history',
        'GET /history - Application history (alias)'
      ],
      debug: process.env.NODE_ENV === 'development' ? [
        'GET /debug/application-status/:userId - Debug application status',
        'GET /debug/status-consistency - Status consistency check'
      ] : 'Available in development mode only'
    },
    timestamp: new Date().toISOString()
  });
});

// Error handler
router.use((error, req, res, next) => {
  console.error('❌ User status route error:', {
    error: error.message,
    path: req.path,
    method: req.method,
    user: req.user?.username || 'unauthenticated',
    timestamp: new Date().toISOString()
  });
  
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'User status operation error',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

if (process.env.NODE_ENV === 'development') {
  console.log('📊 User status routes loaded: dashboard, status checks, system health');
}

export default router;