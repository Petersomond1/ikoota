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
import { authorize } from '../middleware/auth.js';
import {
  getMembershipStatusByIdController,
  getFullMembershipStatusByIdController,
  withdrawApplicationController
} from '../controllers/membershipControllers.js';



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
// from membershipApi.js
router.get('/status', 
  logMembershipAction('get_membership_status'),
  membershipController.getCurrentMembershipStatus
);

/**
 * GET /api/membership/dashboard
 * Get user's membership dashboard
 */
// from membershipApi.js
router.get('/dashboard', 
  logMembershipAction('get_membership_dashboard'),
  membershipController.getUserDashboard
);

/**
 * GET /api/membership/analytics
 * Get user's membership analytics
 */
// Nil
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
// from membershipApi.js
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
// from membershipApi.js
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
// from membershipApi.js
router.get('/application/status',
  logMembershipAction('get_application_status'),
  membershipController.getApplicationStatus
);

/**
 * GET /api/membership/application/:applicationId
 * Get specific application details
 */
// Nil
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
// Nil
router.get('/progression',
  logMembershipAction('get_membership_progression'),
  membershipController.getMembershipProgression
);

/**
 * GET /api/membership/requirements
 * Get membership requirements and next steps
 */
// from membershipApi.js
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
// Nil
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
// Nil
router.get('/class',
  requirePreMemberOrHigher,
  logMembershipAction('get_user_class'),
  membershipController.getUserClass
);

/**
 * GET /api/membership/mentor
 * Get user's mentor information
 */
// Nil
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
// Nil here
router.get('/notifications',
  logMembershipAction('get_membership_notifications'),
  membershipController.getMembershipNotifications
);

/**
 * PUT /api/membership/notifications/:notificationId/read
 * Mark notification as read
 */
// Nill here
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
// Nil
router.get('/eligibility',
  logMembershipAction('check_eligibility'),
  membershipController.checkEligibility
);

/**
 * GET /api/membership/stats
 * Get membership statistics for current user
 */
// from membershipApi.js
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
// Nil
router.get('/help',
  logMembershipAction('get_membership_help'),
  membershipController.getMembershipHelp
);

/**
 * POST /api/membership/support
 * Submit support request related to membership
 */
// Nil
router.post('/support',
  logMembershipAction('submit_support_request'),
  membershipController.submitSupportRequest
);

// =============================================================================
// MEMBER-ONLY ROUTES
// =============================================================================

/**
 * GET /api/membership/member_benefits
 * Get member-specific benefits and features (Full members only)
 */
// Nil
router.get('/member_benefits',
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
 * GET /api/membership/pre-member_features
 * Get pre-member specific features (Pre-members and above)
 */
// Nil
router.get('/pre-member_features',
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
 * POST /api/membership/withdraw-application
 * Withdraw pending application
 */
// Nil
router.post('/withdraw-application',
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
 * POST /api/membership/request-review-status
 * Request status update on pending review
 */
// Nil
router.post('/request-review-status',
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



// ===============================================
//  ADD TO membershipRoutes.js - APPLICATION WITHDRAWAL FOR USERS
// ===============================================

// Add this route to your existing membershipRoutes.js file:

// Nil under admin @ membershipApi.js
// POST /api/membership/application/withdraw
router.post('/application/withdraw',
  logMembershipAction('withdraw_application'),
  async (req, res) => {
    try {
      const { reason, applicationType = 'initial_application' } = req.body;
      const userId = req.user.id;
      
      if (!reason || reason.trim().length < 10) {
        return res.status(400).json({
          success: false,
          error: 'Withdrawal reason is required (minimum 10 characters)',
          example: {
            reason: 'Personal circumstances have changed',
            applicationType: 'initial_application'
          }
        });
      }
      
      const validApplicationTypes = ['initial_application', 'full_membership'];
      if (!validApplicationTypes.includes(applicationType)) {
        return res.status(400).json({
          success: false,
          error: `Invalid application type: ${applicationType}`,
          validTypes: validApplicationTypes
        });
      }
      
      const result = await withdrawApplicationController(userId, reason, applicationType);
      
      res.json({
        success: true,
        message: 'Application withdrawn successfully',
        userId,
        withdrawnBy: req.user.username,
        reason,
        applicationType,
        withdrawalId: result.withdrawalId,
        canReapply: result.canReapply,
        reapplyAfter: result.reapplyAfter,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error withdrawing application:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to withdraw application',
        timestamp: new Date().toISOString()
      });
    }
  }
);

// ===============================================
//  ADD TO membershipRoutes.js - ADMIN USER STATUS ROUTES
// ===============================================

// Add these routes to your existing membershipRoutes.js file:

// from membershipApi.js
// GET /api/membership/status/:userId (Admin only - view other users' status)
router.get('/status/:userId',
  authorize(['admin', 'super_admin']), // Only admins can view other users' status
  logMembershipAction('get_user_status_by_id'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Validate userId parameter
      if (!userId || isNaN(parseInt(userId))) {
        return res.status(400).json({
          success: false,
          error: 'Valid user ID is required'
        });
      }
      
      const status = await getMembershipStatusByIdController(userId);
      
      if (!status) {
        return res.status(404).json({
          success: false,
          error: 'User not found or has no membership status'
        });
      }
      
      res.json({
        success: true,
        userId,
        status,
        requestedBy: req.user.username,
        requestedByUserId: req.user.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error getting user status by ID:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to get user status',
        timestamp: new Date().toISOString()
      });
    }
  }
);

// from membershipApi.js
// GET /api/membership/full-membership/status/:userId (Admin only)
router.get('/full-membership/status/:userId',
  authorize(['admin', 'super_admin']),
  logMembershipAction('get_full_membership_status_by_id'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Validate userId parameter
      if (!userId || isNaN(parseInt(userId))) {
        return res.status(400).json({
          success: false,
          error: 'Valid user ID is required'
        });
      }
      
      const status = await getFullMembershipStatusByIdController(userId);
      
      if (!status) {
        return res.status(404).json({
          success: false,
          error: 'User not found or has no full membership status'
        });
      }
      
      res.json({
        success: true,
        userId,
        fullMembershipStatus: status,
        requestedBy: req.user.username,
        requestedByUserId: req.user.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error getting full membership status by ID:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to get full membership status',
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
 * - GET /member_benefits (Get member benefits)
 * 
 * QUICK ACTION ROUTES:
 * - POST /quick/withdraw-application (Withdraw application)
 * - POST /quick/request-review-status (Request review status)
 */

export default router;