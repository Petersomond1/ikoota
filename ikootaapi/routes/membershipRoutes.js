// ikootaapi/routes/membershipRoutes.js
// GENERAL MEMBERSHIP OPERATIONS
// User-facing membership application and status endpoints

import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';

// Import membership middleware
import { 
  canApplyForMembership,
  validateMembershipApplication,
  rateLimitApplications,
  logMembershipAction,
  requirePreMemberOrHigher
} from '../middlewares/membershipMiddleware.js';

// Import controllers
import {
  // Pre-member application functions
  getUserDashboard,
  checkApplicationStatus,
  getCurrentMembershipStatus,
  submitInitialApplication,
  updateApplicationAnswers,
  updateInitialApplication,
  withdrawApplication,
  getApplicationRequirements,
  getApplicationHistory,
  getUserPermissions
} from '../controllers/preMemberApplicationController.js';

import {
  // Full membership functions
  getFullMembershipStatusById,
  submitFullMembershipApplication,
  reapplyFullMembership,
  logFullMembershipAccess
} from '../controllers/fullMemberApplicationController.js';

import {
  // User status functions
  checkSurveyStatus,
  getBasicProfile,
  getLegacyMembershipStatus,
  getUserStatus
} from '../controllers/userStatusControllers.js';

import {
  // General membership functions
  getMembershipAnalytics,
  getMembershipStats
} from '../controllers/membershipControllers.js';

const router = express.Router();

// ===============================================
// MIDDLEWARE CHAINS FOR REUSE
// ===============================================

// Basic protected route
const basicProtected = [
  authenticate,
  logMembershipAction('access_membership_content')
];

// Status check route
const statusCheck = [
  authenticate,
  requirePreMemberOrHigher,
  logMembershipAction('check_membership_status')
];

// Application submission
const applicationSubmission = [
  authenticate,
  rateLimitApplications,
  canApplyForMembership,
  validateMembershipApplication,
  logMembershipAction('submit_membership_application')
];

// ===============================================
// USER DASHBOARD & STATUS
// ===============================================

// Primary dashboard
router.get('/dashboard', authenticate, getUserDashboard);

// Status checking routes
router.get('/status', authenticate, getCurrentMembershipStatus);
router.get('/application/status', authenticate, checkApplicationStatus);
router.get('/survey/check-status', authenticate, checkSurveyStatus);

// Legacy compatibility
router.get('/membership/status', authenticate, getLegacyMembershipStatus);
router.get('/user/status', authenticate, getUserStatus);

// User profile and permissions
router.get('/profile/basic', authenticate, getBasicProfile);
router.get('/permissions', authenticate, getUserPermissions);
router.get('/application-history', authenticate, getApplicationHistory);

// ===============================================
// INITIAL APPLICATION (PRE-MEMBER TO MEMBER)
// ===============================================

// Submit initial application
router.post('/application/submit', ...applicationSubmission, submitInitialApplication);
router.post('/survey/submit-application', ...applicationSubmission, submitInitialApplication);

// Application management
router.put('/application/update', authenticate, updateInitialApplication);
router.put('/application/update-answers', authenticate, updateApplicationAnswers);
router.post('/application/withdraw', authenticate, withdrawApplication);

// Application information
router.get('/application/requirements', authenticate, getApplicationRequirements);

// ===============================================
// FULL MEMBERSHIP APPLICATION (MEMBER TO FULL_MEMBER)
// ===============================================

// Get full membership status
router.get('/full-membership-status/:userId', ...statusCheck, getFullMembershipStatusById);
router.get('/full-membership-status', ...statusCheck, getFullMembershipStatusById);
router.get('/full-membership/status', ...statusCheck, getFullMembershipStatusById);

// Submit full membership application
router.post('/full-membership/submit', ...applicationSubmission, submitFullMembershipApplication);
router.post('/submit-full-membership', ...applicationSubmission, submitFullMembershipApplication);

// Reapplication for declined applications
router.post('/full-membership/reapply', ...applicationSubmission, reapplyFullMembership);

// Access logging
router.post('/full-membership/access-log', ...basicProtected, logFullMembershipAccess);

// ===============================================
// MEMBERSHIP ANALYTICS (USER VIEW)
// ===============================================

// Public membership statistics
router.get('/analytics', authenticate, getMembershipAnalytics);
router.get('/stats', authenticate, getMembershipStats);

// ===============================================
// SUPPORT ROUTES
// ===============================================

// Available resources
router.get('/mentors/available', authenticate, async (req, res) => {
  res.json({ 
    success: true,
    message: 'Available mentors endpoint - implement with mentor service',
    timestamp: new Date().toISOString()
  });
});

router.get('/classes/available', authenticate, async (req, res) => {
  res.json({ 
    success: true,
    message: 'Available classes endpoint - implement with class service',
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// ERROR HANDLING
// ===============================================

// 404 handler
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Membership route not found',
    path: req.path,
    method: req.method,
    availableRoutes: {
      dashboard: [
        'GET /dashboard - User dashboard',
        'GET /status - Current membership status',
        'GET /application/status - Application status',
        'GET /survey/check-status - Survey status',
        'GET /permissions - User permissions'
      ],
      initialApplication: [
        'POST /application/submit - Submit initial application',
        'PUT /application/update - Update application',
        'PUT /application/update-answers - Update answers',
        'POST /application/withdraw - Withdraw application',
        'GET /application/requirements - Get requirements'
      ],
      fullMembership: [
        'GET /full-membership-status - Get full membership status',
        'POST /full-membership/submit - Submit full membership application',
        'POST /full-membership/reapply - Reapply for full membership',
        'POST /full-membership/access-log - Log access'
      ],
      analytics: [
        'GET /analytics - Membership analytics',
        'GET /stats - Membership statistics'
      ],
      support: [
        'GET /mentors/available - Available mentors',
        'GET /classes/available - Available classes'
      ]
    },
    timestamp: new Date().toISOString()
  });
});

// Error handler
router.use((error, req, res, next) => {
  console.error('❌ Membership route error:', {
    error: error.message,
    path: req.path,
    method: req.method,
    user: req.user?.username || 'unauthenticated',
    timestamp: new Date().toISOString()
  });
  
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Membership operation error',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

if (process.env.NODE_ENV === 'development') {
  console.log('📋 Membership routes loaded: applications, status, full membership workflow');
}

export default router;