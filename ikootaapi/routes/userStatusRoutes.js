// ikootaapi/routes/userStatusRoutes.js
// ===============================================
// USER STATUS ROUTES
// Handles basic user status, health checks, and test endpoints
// ===============================================

import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';

// ✅ UPDATED: Import functions from the correct controllers
import {
  checkSurveyStatus,           // ✅ NOW from userStatusController.js
  getCurrentMembershipStatus,  // ✅ NOW from userStatusController.js  
  healthCheck,
  testSimple,
  testAuth,
  testDashboard,
  getLegacyMembershipStatus,
  getUserStatus,
  debugApplicationStatus,
  getSystemStatus,
  getBasicProfile
} from '../controllers/userStatusController.js';

// ✅ UPDATED: Import dashboard and application functions from preMemberApplicationController.js
import {
  getUserDashboard,           // ✅ Dashboard function stays in preMemberApplicationController.js
  getApplicationHistory,      // ✅ Application history stays in preMemberApplicationController.js
  getUserPermissions,         // ✅ Permissions stay in preMemberApplicationController.js
  checkApplicationStatus      // ✅ Application status check stays in preMemberApplicationController.js
} from '../controllers/preMemberApplicationController.js';

const router = express.Router();

// ===============================================
// SYSTEM & HEALTH ROUTES
// ===============================================
router.get('/health', healthCheck);
router.get('/system/status', getSystemStatus);

// ===============================================
// DEVELOPMENT & TESTING ROUTES
// ===============================================
router.get('/test-simple', testSimple);
router.get('/test-auth', authenticate, testAuth);
router.get('/test-dashboard', authenticate, testDashboard);

// Debug routes (development only)
if (process.env.NODE_ENV === 'development') {
  router.get('/debug/application-status/:userId', authenticate, debugApplicationStatus);
}

// ===============================================
// USER STATUS ROUTES
// ===============================================

// Primary dashboard (from preMemberApplicationController.js)
router.get('/dashboard', authenticate, getUserDashboard);

// ✅ UPDATED: Status checking routes - now using improved functions
router.get('/status', authenticate, getCurrentMembershipStatus);  // ✅ From userStatusController.js
router.get('/application/status', authenticate, checkApplicationStatus);  // ✅ From preMemberApplicationController.js  
router.get('/survey/check-status', authenticate, checkSurveyStatus);  // ✅ NOW from userStatusController.js (improved version)

// User profile and permissions (from preMemberApplicationController.js)
router.get('/profile/basic', authenticate, getBasicProfile);  // ✅ From userStatusController.js
router.get('/permissions', authenticate, getUserPermissions);  // ✅ From preMemberApplicationController.js

// User history (from preMemberApplicationController.js)
router.get('/application-history', authenticate, getApplicationHistory);
router.get('/history', authenticate, getApplicationHistory);

// ===============================================
// COMPATIBILITY ALIASES
// ===============================================
router.get('/membership/status', authenticate, getLegacyMembershipStatus);  // ✅ From userStatusController.js
router.get('/user/status', authenticate, getUserStatus);  // ✅ From userStatusController.js

// ===============================================
// ENHANCED ERROR HANDLING
// ===============================================

// Enhanced 404 handler for user status routes
router.use('*', (req, res) => {
  console.warn(`❌ 404 - User status route not found: ${req.method} ${req.path}`);
  
  res.status(404).json({
    success: false,
    error: 'User status route not found',
    path: req.path,
    method: req.method,
    message: 'The requested user status endpoint does not exist',
    availableEndpoints: {
      user: [
        'GET /dashboard - User dashboard with comprehensive status',
        'GET /status - Current membership status',
        'GET /application/status - Application status check',
        'GET /survey/check-status - Enhanced survey status check',
        'GET /permissions - User permissions',
        'GET /application-history - Application history',
        'GET /profile/basic - Basic profile information'
      ],
      system: [
        'GET /health - System health check',
        'GET /system/status - System status overview',
        'GET /test-simple - Simple connectivity test',
        'GET /test-auth - Authentication test (requires login)',
        'GET /test-dashboard - Dashboard connectivity test (requires login)'
      ],
      compatibility: [
        'GET /membership/status - Legacy membership status',
        'GET /user/status - Alternative user status endpoint'
      ]
    },
    suggestion: 'Check the API documentation for correct endpoint paths',
    timestamp: new Date().toISOString()
  });
});

// Enhanced global error handler for user status routes
router.use((error, req, res, next) => {
  const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  
  console.error('❌ User status route error:', {
    errorId,
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    user: req.user?.id || 'not authenticated',
    timestamp: new Date().toISOString()
  });
  
  // Categorize errors for better handling
  let statusCode = error.statusCode || 500;
  let errorType = 'server_error';
  
  if (error.message.includes('validation') || error.message.includes('required')) {
    statusCode = 400;
    errorType = 'validation_error';
  } else if (error.message.includes('authentication') || error.message.includes('token')) {
    statusCode = 401;
    errorType = 'authentication_error';
  } else if (error.message.includes('permission') || error.message.includes('access denied')) {
    statusCode = 403;
    errorType = 'authorization_error';
  } else if (error.message.includes('not found')) {
    statusCode = 404;
    errorType = 'not_found_error';
  } else if (error.message.includes('database') || error.message.includes('connection') || error.message.includes('MySQL')) {
    statusCode = 503;
    errorType = 'database_error';
  } else if (error.message.includes('timeout')) {
    statusCode = 504;
    errorType = 'timeout_error';
  }
  
  const errorResponse = {
    success: false,
    error: error.message || 'Internal server error',
    errorType,
    errorId,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  };
  
  // Add debug info in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.debug = {
      stack: error.stack,
      user: req.user
    };
  }
  
  res.status(statusCode).json(errorResponse);
});

// ===============================================
// DEVELOPMENT LOGGING
// ===============================================

if (process.env.NODE_ENV === 'development') {
  console.log('\n🛣️ USER STATUS ROUTES LOADED:');
  console.log('================================================================================');
  console.log('✅ REORGANIZED: Functions properly distributed between controllers');
  console.log('✅ IMPROVED: checkSurveyStatus now in userStatusController.js with enhancements');
  console.log('✅ MAINTAINED: All existing functionality with better organization');
  console.log('✅ ENHANCED: Better error handling and route documentation');
  console.log('================================================================================');
  
  console.log('\n📁 FUNCTION DISTRIBUTION:');
  console.log('   userStatusController.js:');
  console.log('   • checkSurveyStatus (✅ ENHANCED - transferred from preMemberApplicationController)');
  console.log('   • getCurrentMembershipStatus');
  console.log('   • healthCheck, testSimple, testAuth, testDashboard');
  console.log('   • getLegacyMembershipStatus, getUserStatus');
  console.log('   • debugApplicationStatus, getSystemStatus');
  console.log('   • getBasicProfile');
  
  console.log('\n   preMemberApplicationController.js:');
  console.log('   • getUserDashboard (comprehensive dashboard)');
  console.log('   • checkApplicationStatus (application-specific status)');
  console.log('   • getApplicationHistory, getUserPermissions');
  console.log('   • verifyApplicationStatusConsistency (debug)');
  console.log('   • submitInitialApplication, updateApplicationAnswers');
  console.log('   • withdrawApplication, getApplicationRequirements');
  
  console.log('\n🔧 KEY IMPROVEMENTS:');
  console.log('   • Enhanced checkSurveyStatus with full membership application data');
  console.log('   • Proper database result format handling');
  console.log('   • Comprehensive error responses with categorization');
  console.log('   • Clear separation between status checks and application management');
  console.log('   • Maintained backward compatibility with all existing endpoints');
  
  console.log('\n📊 ROUTE ORGANIZATION:');
  console.log('   • System & Health: 2 endpoints');
  console.log('   • Development & Testing: 4 endpoints (including debug)');
  console.log('   • User Status: 7 core endpoints');
  console.log('   • Compatibility Aliases: 2 endpoints');
  console.log('   • Enhanced error handling and documentation');
  
  console.log('================================================================================\n');
}

export default router;

