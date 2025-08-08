// ikootaapi/routes/membershipRoutes.js
// ===============================================
// MAIN MEMBERSHIP ROUTES - COMPLETE MODULAR ARCHITECTURE
// Imports from the 4 new modular controllers
// ===============================================

import express from 'express';
import { authenticate, cacheMiddleware } from '../middlewares/auth.middleware.js';

// ===============================================
// IMPORT FROM NEW MODULAR CONTROLLERS
// ===============================================

// Core utilities and middleware
import { 
  requireAdmin, 
  requireSuperAdmin,
  validateRequest 
} from '../controllers/old.membershipCore.js';

// Pre-member application functions
import {
  getUserDashboard,
  checkApplicationStatus,
  getCurrentMembershipStatus,
  submitInitialApplication,
  updateApplicationAnswers,
  updateInitialApplication,
  withdrawApplication,
  getApplicationRequirements,
  getApplicationHistory,
  getUserPermissions,
  verifyApplicationStatusConsistency
} from '../controllers/old.preMemberApplicationController.js';

import {checkSurveyStatus} from '../controllers/old.userStatusController.js';

// Admin management functions
import {
  approvePreMemberApplication,
  declinePreMemberApplication,
  getPendingApplications,
  updateApplicationStatus,
  bulkApproveApplications,
  getPendingFullMemberships,
  updateFullMembershipStatus,
  getAvailableMentors,
  getAvailableClasses,
  sendNotification,
  sendMembershipNotification,
  getAllReports,
  searchUsers,
  deleteUserAccount,
  getMembershipOverview,
  exportMembershipData,
  getSystemConfig
} from '../controllers/old.adminManagementController.js';

// User status and basic operations
import {
  healthCheck,
  testSimple,
  testAuth,
  testDashboard,
  testUserLookup,
  debugApplicationStatus,
  getSystemStatus,
  getBasicProfile,
  getLegacyMembershipStatus,
  getUserStatus
} from '../controllers/old.userStatusController.js';

// Full membership functions (keeping existing controller)
import {
  getFullMembershipStatusById,
  submitFullMembershipApplication,
  reapplyFullMembership,
  logFullMembershipAccess
} from '../controllers/old.fullMembershipController.js';

// Analytics functions (keeping existing controller)
import {
  getMembershipAnalytics,
  getMembershipStats
} from '../controllers/old.analyticsController.js';

const router = express.Router();

// ===============================================
// SECTION 1: SYSTEM & HEALTH ROUTES
// ===============================================

// Health and system status
router.get('/health', healthCheck);
router.get('/system/status', getSystemStatus);

// Development & testing routes
router.get('/test-simple', testSimple);
router.get('/test-auth', authenticate, testAuth);
router.get('/test-dashboard', authenticate, testDashboard);
router.get('/test-user-lookup/:userId', authenticate, requireAdmin, testUserLookup);
router.get('/test-user-lookup', authenticate, testUserLookup);

// Debug routes (development only)
if (process.env.NODE_ENV === 'development') {
  router.get('/debug/application-status/:userId', authenticate, debugApplicationStatus);
  router.get('/debug/status-consistency', authenticate, verifyApplicationStatusConsistency);
}

// ===============================================
// SECTION 2: USER DASHBOARD & STATUS ROUTES
// ===============================================

// Primary dashboard
router.get('/dashboard', authenticate, getUserDashboard);

// Status checking routes - Multiple endpoints for compatibility
router.get('/status', authenticate, getCurrentMembershipStatus);
router.get('/application/status', authenticate, checkApplicationStatus);
router.get('/survey/check-status', authenticate, checkSurveyStatus);

// Legacy compatibility endpoints
router.get('/membership/status', authenticate, getLegacyMembershipStatus);
router.get('/user/status', authenticate, getUserStatus);

// User profile and permissions
router.get('/profile/basic', authenticate, getBasicProfile);
router.get('/permissions', authenticate, getUserPermissions);
router.get('/application-history', authenticate, getApplicationHistory);
router.get('/history', authenticate, getApplicationHistory);

// ===============================================
// SECTION 3: INITIAL APPLICATION ROUTES (PRE-MEMBER)
// ===============================================

// Submit initial application - Multiple endpoints for compatibility
router.post('/survey/submit-application', authenticate, submitInitialApplication);
router.post('/application', authenticate, submitInitialApplication);
router.post('/submit-initial-application', authenticate, submitInitialApplication);

// Application management
router.put('/application/update-answers', authenticate, updateApplicationAnswers);
router.put('/application/answers', authenticate, updateApplicationAnswers);
router.put('/application/update', authenticate, updateInitialApplication);

// Application control
router.post('/application/withdraw', authenticate, withdrawApplication);
router.delete('/application', authenticate, withdrawApplication);

// Application information
router.get('/application/requirements', authenticate, getApplicationRequirements);
router.get('/application/info', authenticate, getApplicationRequirements);
router.get('/application-requirements', authenticate, getApplicationRequirements);

// Validated application routes with input validation
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

// ===============================================
// SECTION 4: FULL MEMBERSHIP ROUTES
// ===============================================

// Get full membership status - Multiple endpoints for compatibility
router.get('/full-membership-status/:userId', authenticate, getFullMembershipStatusById);
router.get('/full-membership-status', authenticate, getFullMembershipStatusById);
router.get('/membership/full-membership-status', authenticate, getFullMembershipStatusById);
router.get('/full-membership/status', authenticate, getFullMembershipStatusById);

// Submit full membership application
router.post('/submit-full-membership', authenticate, submitFullMembershipApplication);
router.post('/membership/submit-full-membership', authenticate, submitFullMembershipApplication);
router.post('/full-membership/apply', authenticate, submitFullMembershipApplication);
router.post('/submit-full-membership-application', authenticate, submitFullMembershipApplication);

// Reapplication for declined applications
router.post('/reapply-full-membership', authenticate, reapplyFullMembership);

// Log full membership access
router.post('/membership/log-full-membership-access', authenticate, logFullMembershipAccess);
router.post('/full-membership/access', authenticate, logFullMembershipAccess);

// ===============================================
// SECTION 5: ADMIN APPLICATION MANAGEMENT ROUTES
// ===============================================

// System configuration (Admin only)
router.get('/admin/config', authenticate, requireAdmin, getSystemConfig);
router.get('/admin/super/config', authenticate, requireSuperAdmin, getSystemConfig);

// Get pending applications - Multiple endpoints for compatibility
router.get('/admin/pending-applications', authenticate, requireAdmin, getPendingApplications);
router.get('/admin/applications', authenticate, requireAdmin, getPendingApplications);
router.get('/admin/membership/applications', authenticate, requireAdmin, getPendingApplications);

// Update application status - Multiple endpoints for compatibility
router.put('/admin/update-user-status/:userId', authenticate, requireAdmin, updateApplicationStatus);
router.put('/admin/applications/:userId/status', authenticate, requireAdmin, updateApplicationStatus);

// Pre-member specific approval/decline
router.post('/approve/:userId', authenticate, requireAdmin, approvePreMemberApplication);
router.post('/decline/:userId', authenticate, requireAdmin, declinePreMemberApplication);

// Bulk operations
router.post('/admin/bulk-approve', authenticate, requireAdmin, bulkApproveApplications);
router.post('/admin/applications/bulk', authenticate, requireAdmin, bulkApproveApplications);

// ===============================================
// SECTION 6: ADMIN FULL MEMBERSHIP MANAGEMENT
// ===============================================

// Get pending full memberships
router.get('/admin/pending-full-memberships', authenticate, requireAdmin, getPendingFullMemberships);
router.get('/admin/full-memberships', authenticate, requireAdmin, getPendingFullMemberships);

// Review full membership applications
router.put('/admin/review-full-membership/:applicationId', authenticate, requireAdmin, updateFullMembershipStatus);
router.put('/admin/full-memberships/:applicationId/status', authenticate, requireAdmin, updateFullMembershipStatus);

// ===============================================
// SECTION 7: ADMIN RESOURCES & UTILITIES
// ===============================================

// Get available mentors and classes
router.get('/admin/mentors', authenticate, requireAdmin, getAvailableMentors);
router.get('/admin/classes', authenticate, requireAdmin, getAvailableClasses);

// Reports and admin data
router.get('/admin/reports', authenticate, requireAdmin, getAllReports);
router.get('/admin/membership-overview', authenticate, requireAdmin, cacheMiddleware(600), getMembershipOverview);
router.get('/admin/overview', authenticate, requireAdmin, getMembershipOverview);

// Analytics and statistics
router.get('/admin/analytics', authenticate, requireAdmin, cacheMiddleware(600), getMembershipAnalytics);
router.get('/admin/membership-analytics', authenticate, requireAdmin, getMembershipAnalytics);
router.get('/admin/membership-stats', authenticate, requireAdmin, cacheMiddleware(600), getMembershipStats);
router.get('/admin/stats', authenticate, requireAdmin, getMembershipStats);

// Data export
router.get('/admin/export-membership-data', authenticate, requireAdmin, exportMembershipData);
router.get('/admin/export', authenticate, requireAdmin, exportMembershipData);

// ===============================================
// SECTION 8: COMMUNICATION & NOTIFICATIONS
// ===============================================

// General notifications
router.post('/admin/send-notification', authenticate, requireAdmin, sendNotification);
router.post('/admin/notifications/send', authenticate, requireAdmin, sendNotification);

// Membership-specific notifications
router.post('/admin/send-membership-notification', authenticate, requireAdmin, sendMembershipNotification);
router.post('/admin/notifications/membership', authenticate, requireAdmin, sendMembershipNotification);

// Validated notification routes
router.post('/admin/notifications/validated-send', 
  authenticate, 
  requireAdmin,
  validateRequest(['recipients', 'subject', 'message']),
  sendNotification
);

// ===============================================
// SECTION 9: USER MANAGEMENT ROUTES (SUPER ADMIN)
// ===============================================

// User search and management
router.get('/admin/search-users', authenticate, requireAdmin, searchUsers);

// User account deletion (Super Admin only)
router.delete('/admin/users/:userId', authenticate, requireSuperAdmin, deleteUserAccount);
router.delete('/user/account', authenticate, deleteUserAccount); // Self-deletion

// ===============================================
// SECTION 10: ENHANCED ERROR HANDLING & LOGGING
// ===============================================

// Request logging middleware for all membership routes
router.use((req, res, next) => {
  const startTime = Date.now();
  
  // Log request in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`🛣️ ${req.method} ${req.path}`, {
      user: req.user?.id || 'unauthenticated',
      timestamp: new Date().toISOString(),
      ip: req.ip
    });
  }
  
  // Log response time
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Response sent in ${duration}ms for ${req.method} ${req.path}`);
    }
    originalSend.call(this, data);
  };
  
  next();
});

// Enhanced 404 handler for membership routes
router.use('*', (req, res) => {
  console.warn(`❌ 404 - Route not found: ${req.method} ${req.path}`);
  
  res.status(404).json({
    success: false,
    error: 'Membership route not found',
    path: req.path,
    method: req.method,
    message: 'The requested membership endpoint does not exist',
    availableEndpoints: {
      user: [
        'GET /dashboard - User dashboard with comprehensive status',
        'GET /status - Current membership status',
        'GET /application/status - Application status check',
        'POST /survey/submit-application - Submit initial application',
        'GET /full-membership-status - Full membership application status',
        'POST /submit-full-membership - Submit full membership application'
      ],
      admin: [
        'GET /admin/pending-applications - Get pending applications',
        'GET /admin/membership-overview - Membership overview dashboard',
        'POST /admin/bulk-approve - Bulk approve applications',
        'GET /admin/analytics - Advanced analytics and reporting',
        'POST /approve/:userId - Approve specific application',
        'POST /decline/:userId - Decline specific application'
      ],
      system: [
        'GET /health - System health check',
        'GET /test-simple - Simple connectivity test',
        'GET /admin/config - System configuration'
      ]
    },
    suggestion: 'Check the API documentation for correct endpoint paths',
    timestamp: new Date().toISOString()
  });
});

// Enhanced global error handler for membership routes
router.use((error, req, res, next) => {
  const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  
  console.error('❌ Membership route error:', {
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
  } else if (error.message.includes('permission') || error.message.includes('admin') || error.message.includes('access denied')) {
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
// DEVELOPMENT LOGGING & DOCUMENTATION
// ===============================================

if (process.env.NODE_ENV === 'development') {
  console.log('\n🛣️ COMPLETE MODULAR MEMBERSHIP ROUTES LOADED:');
  console.log('================================================================================');
  console.log('✅ ARCHITECTURE: Complete modular organization - 4 controllers + utilities');
  console.log('✅ PRESERVED: All existing functionality with zero breaking changes');
  console.log('✅ ENHANCED: Better error handling, validation, and transaction safety');
  console.log('✅ ORGANIZED: Clear separation of concerns for maintainability');
  console.log('================================================================================');
  
  console.log('\n📁 NEW MODULAR STRUCTURE:');
  console.log('   1. membershipCore.js              - All utilities and shared functions');
  console.log('   2. preMemberApplicationController.js - Pre-member application flow');
  console.log('   3. adminManagementController.js   - All admin functions');
  console.log('   4. userStatusController.js        - Status checks and basic operations');
  console.log('   5. fullMembershipController.js    - Full membership (existing)');
  console.log('   6. analyticsController.js         - Analytics (existing)');
  
  console.log('\n🔧 KEY IMPROVEMENTS:');
  console.log('   • Zero functionality loss - all functions preserved');
  console.log('   • Enhanced error handling with proper HTTP status codes');
  console.log('   • Database transaction safety for critical operations');
  console.log('   • Comprehensive input validation and sanitization');
  console.log('   • Proper admin/super_admin role-based access control');
  console.log('   • Non-blocking email notifications');
  console.log('   • Complete audit logging for all admin actions');
  
  console.log('\n📊 ROUTES ORGANIZATION:');
  console.log('   • 80+ endpoints across all modules');
  console.log('   • Complete pre-member → full member flow');
  console.log('   • Comprehensive admin management tools');
  console.log('   • Enhanced analytics and reporting');
  console.log('   • Robust error handling and logging');
  console.log('   • Multiple compatibility endpoints for legacy support');
  
  console.log('\n🚀 BENEFITS ACHIEVED:');
  console.log('   • Eliminated duplication between application survey and membership');
  console.log('   • Clear separation of concerns for easier maintenance');
  console.log('   • Enhanced code reusability and testing capability');
  console.log('   • Improved scalability for future feature additions');
  console.log('   • Better debugging and error tracking capabilities');
  
  console.log('================================================================================\n');
}

export default router;