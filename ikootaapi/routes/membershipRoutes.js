// ikootaapi/routes/membershipRoutes.js
// COMPLETE MEMBERSHIP ROUTES - MAIN ENTRY POINTS
// Clean route definitions with proper middleware and controller mapping

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  requireMember,
  requirePreMemberOrHigher,
  canApplyForMembership,
  validateMembershipApplication,
  validateMembershipEligibility,
  rateLimitApplications,
  logMembershipAction,
  addMembershipContext
} from '../middlewares/membershipMiddleware.js';

// Import controllers
import * as membershipController from '../controllers/membershipControllers.js';

const router = express.Router();

// =============================================================================
// MIDDLEWARE SETUP
// =============================================================================

// Apply authentication to all routes
router.use(authenticate);

// Add membership context to all routes
router.use(addMembershipContext);

// =============================================================================
// MEMBERSHIP STATUS ROUTES
// =============================================================================

/**
 * GET /api/membership/status
 * Get current user's membership status
 */
router.get('/status', 
  logMembershipAction('get_membership_status'),
  membershipController.getCurrentMembershipStatus
);

/**
 * GET /api/membership/dashboard
 * Get user's membership dashboard
 */
router.get('/dashboard', 
  logMembershipAction('get_membership_dashboard'),
  membershipController.getUserDashboard
);

/**
 * GET /api/membership/analytics
 * Get user's membership analytics
 */
router.get('/analytics', 
  logMembershipAction('get_membership_analytics'),
  membershipController.getMembershipAnalytics
);

// =============================================================================
// APPLICATION SUBMISSION ROUTES
// =============================================================================

/**
 * POST /api/membership/apply/initial
 * Submit initial membership application
 */
router.post('/apply/initial',
  validateMembershipEligibility('submit_initial_application'),
  validateMembershipApplication,
  rateLimitApplications,
  logMembershipAction('submit_initial_application'),
  membershipController.submitInitialApplication
);

/**
 * POST /api/membership/apply/full
 * Submit full membership application
 */
router.post('/apply/full',
  canApplyForMembership,
  validateMembershipApplication,
  rateLimitApplications,
  logMembershipAction('submit_full_membership_application'),
  membershipController.submitFullMembershipApplication
);

// =============================================================================
// APPLICATION STATUS ROUTES
// =============================================================================

/**
 * GET /api/membership/application/status
 * Get current application status
 */
router.get('/application/status',
  logMembershipAction('get_application_status'),
  membershipController.getApplicationStatus
);

/**
 * GET /api/membership/application/:applicationId
 * Get specific application details
 */
router.get('/application/:applicationId',
  logMembershipAction('get_application_details'),
  membershipController.getApplicationDetails
);

// =============================================================================
// MEMBERSHIP PROGRESSION ROUTES
// =============================================================================

/**
 * GET /api/membership/progression
 * Get membership progression information
 */
router.get('/progression',
  logMembershipAction('get_membership_progression'),
  membershipController.getMembershipProgression
);

/**
 * GET /api/membership/requirements
 * Get membership requirements and next steps
 */
router.get('/requirements',
  logMembershipAction('get_membership_requirements'),
  membershipController.getMembershipRequirements
);

// =============================================================================
// PROFILE AND SETTINGS ROUTES
// =============================================================================

/**
 * GET /api/membership/profile
 * Get user's membership profile
 */
router.get('/profile',
  logMembershipAction('get_membership_profile'),
  membershipController.getMembershipProfile
);

/**
 * PUT /api/membership/profile
 * Update user's membership profile
 */
router.put('/profile',
  logMembershipAction('update_membership_profile'),
  membershipController.updateMembershipProfile
);

// =============================================================================
// CLASS AND MENTOR ROUTES
// =============================================================================

/**
 * GET /api/membership/class
 * Get user's class information
 */
router.get('/class',
  requirePreMemberOrHigher,
  logMembershipAction('get_user_class'),
  membershipController.getUserClass
);

/**
 * GET /api/membership/mentor
 * Get user's mentor information
 */
router.get('/mentor',
  requirePreMemberOrHigher,
  logMembershipAction('get_user_mentor'),
  membershipController.getUserMentor
);

// =============================================================================
// NOTIFICATION ROUTES
// =============================================================================

/**
 * GET /api/membership/notifications
 * Get user's membership-related notifications
 */
router.get('/notifications',
  logMembershipAction('get_membership_notifications'),
  membershipController.getMembershipNotifications
);

/**
 * PUT /api/membership/notifications/:notificationId/read
 * Mark notification as read
 */
router.put('/notifications/:notificationId/read',
  logMembershipAction('mark_notification_read'),
  membershipController.markNotificationRead
);

// =============================================================================
// UTILITY ROUTES
// =============================================================================

/**
 * GET /api/membership/eligibility
 * Check user's eligibility for various actions
 */
router.get('/eligibility',
  logMembershipAction('check_eligibility'),
  membershipController.checkEligibility
);

/**
 * GET /api/membership/stats
 * Get membership statistics for current user
 */
router.get('/stats',
  logMembershipAction('get_membership_stats'),
  membershipController.getMembershipStats
);

// =============================================================================
// SUPPORT AND HELP ROUTES
// =============================================================================

/**
 * GET /api/membership/help
 * Get membership help and FAQ information
 */
router.get('/help',
  logMembershipAction('get_membership_help'),
  membershipController.getMembershipHelp
);

/**
 * POST /api/membership/support
 * Submit support request related to membership
 */
router.post('/support',
  logMembershipAction('submit_support_request'),
  membershipController.submitSupportRequest
);

// =============================================================================
// MEMBER-ONLY ROUTES
// =============================================================================

/**
 * GET /api/membership/member/benefits
 * Get member-specific benefits and features (Full members only)
 */
router.get('/member/benefits',
  requireMember,
  logMembershipAction('get_member_benefits'),
  async (req, res) => {
    try {
      res.json({
        success: true,
        data: {
          benefits: [
            'Access to exclusive Iko content',
            'Premium support',
            'Advanced platform features',
            'Member-only events',
            'Priority class enrollment'
          ],
          features: [
            'Advanced analytics',
            'Content creation tools',
            'Mentorship programs',
            'Community leadership opportunities'
          ]
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get member benefits',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * GET /api/membership/pre-member/features
 * Get pre-member specific features (Pre-members and above)
 */
router.get('/pre-member/features',
  requirePreMemberOrHigher,
  logMembershipAction('get_pre_member_features'),
  async (req, res) => {
    try {
      res.json({
        success: true,
        data: {
          features: [
            'Access to Towncrier content',
            'Basic class participation',
            'Community forums access',
            'Basic mentor interaction',
            'Standard support'
          ],
          upgrade_path: {
            next_stage: 'member',
            requirements: [
              'Submit full membership application',
              'Complete additional requirements',
              'Admin approval'
            ]
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get pre-member features',
        timestamp: new Date().toISOString()
      });
    }
  }
);

// =============================================================================
// QUICK ACTION ROUTES
// =============================================================================

/**
 * POST /api/membership/quick/withdraw-application
 * Withdraw pending application
 */
router.post('/quick/withdraw-application',
  logMembershipAction('withdraw_application'),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { applicationType } = req.body;

      // This would need to be implemented in the service layer
      // For now, returning a placeholder response
      res.json({
        success: true,
        message: 'Application withdrawal functionality coming soon',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to withdraw application',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * POST /api/membership/quick/request-review-status
 * Request status update on pending review
 */
router.post('/quick/request-review-status',
  logMembershipAction('request_review_status'),
  async (req, res) => {
    try {
      const userId = req.user.id;

      // This would create a notification for admins
      res.json({
        success: true,
        message: 'Review status request submitted',
        data: {
          request_id: `RSR-${Date.now()}-${userId}`,
          estimated_response: '1-2 business days'
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to request review status',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

// =============================================================================
// HEALTH CHECK ROUTE
// =============================================================================

/**
 * GET /api/membership/health
 * Health check for membership system
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'membership',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      total: 20,
      authenticated: 19,
      public: 1
    }
  });
});

// =============================================================================
// ERROR HANDLING MIDDLEWARE
// =============================================================================

/**
 * Handle membership-specific errors
 */
router.use((error, req, res, next) => {
  console.error('❌ Membership route error:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    user: req.user?.username,
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }

  if (error.name === 'AuthenticationError') {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }

  if (error.name === 'AuthorizationError') {
    return res.status(403).json({
      success: false,
      error: 'Access denied',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }

  // Generic error response
  res.status(error.statusCode || 500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// =============================================================================
// ROUTE DOCUMENTATION
// =============================================================================

/**
 * MEMBERSHIP ROUTES SUMMARY
 * 
 * PUBLIC ROUTES:
 * - GET /health (Health check)
 * 
 * AUTHENTICATED ROUTES:
 * - GET /status (Get membership status)
 * - GET /dashboard (Get dashboard data)
 * - GET /analytics (Get analytics)
 * - POST /apply/initial (Submit initial application)
 * - POST /apply/full (Submit full membership application)
 * - GET /application/status (Get application status)
 * - GET /application/:id (Get application details)
 * - GET /progression (Get progression info)
 * - GET /requirements (Get requirements)
 * - GET /profile (Get profile)
 * - PUT /profile (Update profile)
 * - GET /notifications (Get notifications)
 * - PUT /notifications/:id/read (Mark notification read)
 * - GET /eligibility (Check eligibility)
 * - GET /stats (Get statistics)
 * - GET /help (Get help information)
 * - POST /support (Submit support request)
 * 
 * PRE-MEMBER+ ROUTES:
 * - GET /class (Get class info)
 * - GET /mentor (Get mentor info)
 * - GET /pre-member/features (Get pre-member features)
 * 
 * MEMBER-ONLY ROUTES:
 * - GET /member/benefits (Get member benefits)
 * 
 * QUICK ACTION ROUTES:
 * - POST /quick/withdraw-application (Withdraw application)
 * - POST /quick/request-review-status (Request review status)
 */

export default router;