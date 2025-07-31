// File: ikootaapi/routes/membershipApplicationRoutes.js
// MEMBERSHIP APPLICATION ROUTES - CONSOLIDATED

import express from 'express';
import { authenticate, cacheMiddleware } from '../middlewares/auth.middleware.js';
import db from '../config/db.js'; 


// Import membership-specific middleware
import { 
  canApplyForMembership, 
  validateMembershipApplication,
  rateLimitApplications,
  logMembershipAction,
  requirePreMemberOrHigher
} from '../middlewares/membershipMiddleware.js';

// Import core utilities
import { 
  requireAdmin, 
  requireSuperAdmin,
  validateRequest 
} from '../controllers/membershipCore.js';

// Import pre-member application functions
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
} from '../controllers/preMemberApplicationController.js';

// Import user status functions
import {
  checkSurveyStatus,
  getBasicProfile,
  getLegacyMembershipStatus,
  getUserStatus
} from '../controllers/userStatusController.js';

// Import full membership functions
import {
  getFullMembershipStatusById,
  submitFullMembershipApplication,
  reapplyFullMembership,
  logFullMembershipAccess
} from '../controllers/fullMembershipController.js';

// Import existing controller functions for compatibility
import { getFullMembershipStatus } from '../controllers/membershipControllers_2.OLD.js';

const membershipApplicationRouter = express.Router();


// Debug middleware to log authentication issues
membershipApplicationRouter.use((req, res, next) => {
  console.log('🔍 Membership Route Debug:', {
    path: req.path,
    method: req.method,
    hasAuth: !!req.headers.authorization,
    userAgent: req.headers['user-agent']?.substring(0, 50),
    timestamp: new Date().toISOString()
  });
  next();
});

// ===============================================
// MIDDLEWARE CHAINS FOR REUSE
// ===============================================

// Basic protected route (authenticated + logging)
const basicProtected = [
  authenticate,
  logMembershipAction('access_membership_content')
];

// Status check route (authenticated + pre-member access + logging)
const statusCheck = [
  authenticate,
  requirePreMemberOrHigher,
  logMembershipAction('check_membership_status')
];

// Application submission (full protection)
const applicationSubmission = [
  authenticate,
  rateLimitApplications,           // Prevent spam
  canApplyForMembership,           // Check eligibility
  validateMembershipApplication,   // Validate input
  logMembershipAction('submit_membership_application')
];

// Reapplication (similar to submission but different logging)
const reapplication = [
  authenticate,
  rateLimitApplications,
  canApplyForMembership,
  validateMembershipApplication,
  logMembershipAction('reapply_membership_application')
];

// ===============================================
// USER DASHBOARD & STATUS ROUTES
// ===============================================

// Primary dashboard
membershipApplicationRouter.get('/dashboard', authenticate, getUserDashboard);

// Status checking routes - Multiple endpoints for compatibility
membershipApplicationRouter.get('/status', authenticate, getCurrentMembershipStatus);
membershipApplicationRouter.get('/application/status', authenticate, checkApplicationStatus);
membershipApplicationRouter.get('/survey/check-status', authenticate, checkSurveyStatus);

// Legacy compatibility endpoints
membershipApplicationRouter.get('/membership/status', authenticate, getLegacyMembershipStatus);
membershipApplicationRouter.get('/user/status', authenticate, getUserStatus);

// User profile and permissions
membershipApplicationRouter.get('/profile/basic', authenticate, getBasicProfile);
membershipApplicationRouter.get('/permissions', authenticate, getUserPermissions);
membershipApplicationRouter.get('/application-history', authenticate, getApplicationHistory);
membershipApplicationRouter.get('/history', authenticate, getApplicationHistory);

// ===============================================
// INITIAL APPLICATION ROUTES (PRE-MEMBER)
// ===============================================

// Submit initial application - Multiple endpoints for compatibility
membershipApplicationRouter.post('/application/submit', authenticate, submitInitialApplication);
membershipApplicationRouter.post('/application', authenticate, submitInitialApplication);
membershipApplicationRouter.post('/submit-initial-application', authenticate, submitInitialApplication);

// Application management
membershipApplicationRouter.put('/application/update', authenticate, updateInitialApplication);
membershipApplicationRouter.put('/application/update-answers', authenticate, updateApplicationAnswers);
membershipApplicationRouter.put('/application/answers', authenticate, updateApplicationAnswers);

// Application control
membershipApplicationRouter.post('/application/withdraw', authenticate, withdrawApplication);
membershipApplicationRouter.delete('/application', authenticate, withdrawApplication);

// Application information
membershipApplicationRouter.get('/application/requirements', authenticate, getApplicationRequirements);
membershipApplicationRouter.get('/application/info', authenticate, getApplicationRequirements);
membershipApplicationRouter.get('/application-requirements', authenticate, getApplicationRequirements);

// Validated application routes with input validation
membershipApplicationRouter.put('/application/answers/validated',
  authenticate,
  validateRequest(['answers']),
  updateApplicationAnswers
);

membershipApplicationRouter.post('/application/withdraw/validated',
  authenticate,
  validateRequest(['reason']),
  withdrawApplication
);

// ===============================================
// FULL MEMBERSHIP APPLICATION ROUTES
// ===============================================

// Get full membership status - Multiple endpoints for compatibility
membershipApplicationRouter.get('/full-membership/status/:userId', ...statusCheck, getFullMembershipStatusById);
membershipApplicationRouter.get('/full-membership/status', ...statusCheck, getFullMembershipStatus);
membershipApplicationRouter.get('/full-membership-status', ...statusCheck, getFullMembershipStatus);
membershipApplicationRouter.get('/full-membership-status/:userId', ...statusCheck, getFullMembershipStatusById);

// Submit full membership application - Primary endpoint with full protection
membershipApplicationRouter.post('/full-membership/submit', ...applicationSubmission, submitFullMembershipApplication);
membershipApplicationRouter.post('/full-membership/apply', ...applicationSubmission, submitFullMembershipApplication);
membershipApplicationRouter.post('/submit-full-membership', ...applicationSubmission, submitFullMembershipApplication);

// Reapplication for declined applications
membershipApplicationRouter.post('/full-membership/reapply', ...reapplication, reapplyFullMembership);

// Access logging routes
membershipApplicationRouter.post('/full-membership/access-log', ...basicProtected, logFullMembershipAccess);

// Enhanced status endpoints
membershipApplicationRouter.get('/full-membership/detailed-status', 
  authenticate,
  requirePreMemberOrHigher,
  logMembershipAction('check_detailed_membership_status'),
  getFullMembershipStatus
);

// Quick status check (minimal logging for frequent calls)
membershipApplicationRouter.get('/full-membership/quick-status', authenticate, getFullMembershipStatus);

// ===============================================
// APPLICATION SUPPORT ROUTES
// ===============================================

// Get available mentors and classes
membershipApplicationRouter.get('/mentors/available', authenticate, async (req, res) => {
  // This would call the mentor controller
  res.json({ message: 'Available mentors endpoint - implement with mentor controller' });
});

membershipApplicationRouter.get('/classes/available', authenticate, async (req, res) => {
  // This would call the classes controller
  res.json({ message: 'Available classes endpoint - implement with classes controller' });
});

// ===============================================
// DEBUG ROUTES (DEVELOPMENT ONLY)
// ===============================================

if (process.env.NODE_ENV === 'development') {
  membershipApplicationRouter.get('/debug/status-consistency', authenticate, verifyApplicationStatusConsistency);

}


// ===============================================
// DATABASE CONNECTION TEST (Development Only)
// ===============================================

if (process.env.NODE_ENV === 'development') {
  
  // Test database connectivity
  membershipApplicationRouter.get('/debug/db-test', authenticate, async (req, res) => {
    try {
      console.log('🧪 Testing database connection...');
      
      // Test 1: Basic connection
      const [connectionTest] = await db.query('SELECT 1 as test, NOW() as current_time');
      console.log('✅ Database connection test passed');
      
      // Test 2: User table access
      const [userTest] = await db.query('SELECT COUNT(*) as user_count FROM users');
      console.log('✅ User table access test passed');
      
      // Test 3: Full membership applications table
      const [appTest] = await db.query('SELECT COUNT(*) as app_count FROM full_membership_applications');
      console.log('✅ Full membership applications table access test passed');
      
      // Test 4: Survey log table
      const [surveyTest] = await db.query('SELECT COUNT(*) as survey_count FROM surveylog');
      console.log('✅ Survey log table access test passed');
      
      res.json({
        success: true,
        message: 'All database tests passed',
        tests: {
          connection: { passed: true, result: connectionTest[0] },
          users: { passed: true, count: userTest[0].user_count },
          applications: { passed: true, count: appTest[0].app_count },
          surveys: { passed: true, count: surveyTest[0].survey_count }
        },
        user: {
          id: req.user.id,
          username: req.user.username,
          role: req.user.role
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Database test failed:', error);
      res.status(500).json({
        success: false,
        error: 'Database test failed',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Test authentication middleware
  membershipApplicationRouter.get('/debug/auth-test', authenticate, (req, res) => {
    res.json({
      success: true,
      message: 'Authentication test passed',
      user: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role,
        email: req.user.email
      },
      timestamp: new Date().toISOString()
    });
  });
}

// ===============================================
// ERROR HANDLING
// ===============================================

// Enhanced 404 handler for membership application routes
membershipApplicationRouter.use('*', (req, res) => {
  console.warn(`❌ 404 - Membership application route not found: ${req.method} ${req.path}`);
  
  res.status(404).json({
    success: false,
    error: 'Membership application route not found',
    path: req.path,
    method: req.method,
    availableEndpoints: {
      dashboard: [
        'GET /dashboard - User dashboard with comprehensive status',
        'GET /status - Current membership status',
        'GET /application/status - Application status check',
        'GET /survey/check-status - Survey status check'
      ],
      initialApplication: [
        'POST /application/submit - Submit initial application',
        'PUT /application/update - Update application',
        'PUT /application/answers - Update application answers',
        'POST /application/withdraw - Withdraw application',
        'GET /application/requirements - Get requirements'
      ],
      fullMembership: [
        'GET /full-membership/status - Get full membership status',
        'POST /full-membership/submit - Submit full membership application',
        'POST /full-membership/reapply - Reapply for full membership',
        'POST /full-membership/access-log - Log access'
      ],
      support: [
        'GET /mentors/available - Get available mentors',
        'GET /classes/available - Get available classes'
      ]
    },
    timestamp: new Date().toISOString()
  });
});

// Enhanced global error handler
membershipApplicationRouter.use((error, req, res, next) => {
  const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  
  console.error('❌ Membership application route error:', {
    errorId,
    error: error.message,
    path: req.path,
    method: req.method,
    user: req.user?.id || 'not authenticated',
    timestamp: new Date().toISOString()
  });
  
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Internal server error',
    errorId,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

if (process.env.NODE_ENV === 'development') {
  console.log('📋 Membership application routes loaded with full workflow support');
}

export default membershipApplicationRouter;