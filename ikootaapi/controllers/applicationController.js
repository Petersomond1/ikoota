// ikootaapi/controllers/applicationController.js
// ===============================================
// APPLICATION CONTROLLER - CLEAN SEPARATION OF CONCERNS
// Handles HTTP requests/responses only - delegates to services
// Follows same pattern as other controllers
// ===============================================

import applicationService from '../services/applicationService.js';
import {
  successResponse,
  errorResponse,
  getUserById
} from './membershipCore.js';

// =============================================================================
// APPLICATION STATUS ENDPOINTS
// =============================================================================

/**
 * Get comprehensive application status for current user
 * GET /api/membership/application-status
 */
export const getApplicationStatus = async (req, res) => {
  try {
    const userId = req.user.id || req.user.user_id;
    
    console.log('🔍 Getting application status for user:', userId);
    
    const status = await applicationService.getApplicationStatus(userId);
    
    return successResponse(res, status, 'Application status retrieved successfully');
    
  } catch (error) {
    console.error('❌ Error getting application status:', error);
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * Get detailed application information
 * GET /api/membership/application-details/:applicationId/:type
 */
export const getApplicationDetails = async (req, res) => {
  try {
    const { applicationId, type = 'initial' } = req.params;
    const userId = req.user.id || req.user.user_id;
    
    if (!applicationId) {
      return errorResponse(res, new Error('Application ID is required'), 400);
    }
    
    console.log('🔍 Getting application details:', { applicationId, type, userId });
    
    const details = await applicationService.getApplicationDetails(
      parseInt(applicationId), 
      userId, 
      type
    );
    
    return successResponse(res, details, 'Application details retrieved successfully');
    
  } catch (error) {
    console.error('❌ Error getting application details:', error);
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * Get application history for current user
 * GET /api/membership/application-history
 */
export const getApplicationHistory = async (req, res) => {
  try {
    const userId = req.user.id || req.user.user_id;
    
    console.log('🔍 Getting application history for user:', userId);
    
    const history = await applicationService.getApplicationHistory(userId);
    
    return successResponse(res, history, 'Application history retrieved successfully');
    
  } catch (error) {
    console.error('❌ Error getting application history:', error);
    return errorResponse(res, error, error.statusCode || 500);
  }
};

// =============================================================================
// APPLICATION VALIDATION ENDPOINTS
// =============================================================================

/**
 * Validate application eligibility
 * GET /api/membership/validate-eligibility/:type
 */
export const validateEligibility = async (req, res) => {
  try {
    const { type } = req.params;
    const userId = req.user.id || req.user.user_id;
    
    if (!['initial', 'full'].includes(type)) {
      return errorResponse(res, new Error('Invalid application type. Must be "initial" or "full"'), 400);
    }
    
    console.log('🔍 Validating eligibility:', { userId, type });
    
    const eligibility = await applicationService.validateApplicationEligibility(userId, type);
    
    return successResponse(res, eligibility, 'Eligibility validation completed');
    
  } catch (error) {
    console.error('❌ Error validating eligibility:', error);
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * Get membership progression information
 * GET /api/membership/progression
 */
export const getMembershipProgression = async (req, res) => {
  try {
    const userId = req.user.id || req.user.user_id;
    
    console.log('🔍 Getting membership progression for user:', userId);
    
    const progression = await applicationService.getMembershipProgression(userId);
    
    return successResponse(res, progression, 'Membership progression retrieved successfully');
    
  } catch (error) {
    console.error('❌ Error getting membership progression:', error);
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * Check user eligibility for specific actions
 * GET /api/membership/check-eligibility/:action
 */
export const checkActionEligibility = async (req, res) => {
  try {
    const { action } = req.params;
    const userId = req.user.id || req.user.user_id;
    
    const validActions = [
      'submit_initial_application',
      'submit_full_membership',
      'access_towncrier',
      'access_iko',
      'join_classes'
    ];
    
    if (!validActions.includes(action)) {
      return errorResponse(res, new Error(`Invalid action. Must be one of: ${validActions.join(', ')}`), 400);
    }
    
    console.log('🔍 Checking action eligibility:', { userId, action });
    
    const eligibility = await applicationService.checkEligibility(userId, action);
    
    return successResponse(res, eligibility, 'Action eligibility checked successfully');
    
  } catch (error) {
    console.error('❌ Error checking action eligibility:', error);
    return errorResponse(res, error, error.statusCode || 500);
  }
};

// =============================================================================
// COMPATIBILITY ENDPOINTS (for existing frontend)
// =============================================================================

/**
 * Get initial application status (legacy endpoint)
 * GET /api/membership/initial-status
 */
export const getInitialStatus = async (req, res) => {
  try {
    const userId = req.user.id || req.user.user_id;
    
    console.log('🔍 Getting initial application status (legacy):', userId);
    
    const status = await applicationService.getApplicationStatus(userId);
    
    // Format response for legacy compatibility
    const initialApp = status.initial_application;
    
    return successResponse(res, {
      hasApplication: initialApp.exists,
      status: initialApp.status,
      applicationId: initialApp.id,
      ticket: initialApp.ticket,
      submittedAt: initialApp.submittedAt,
      reviewedAt: initialApp.reviewedAt,
      timeline: initialApp.timeline,
      canProgress: status.overall_status.can_progress
    }, 'Initial application status retrieved');
    
  } catch (error) {
    console.error('❌ Error getting initial status:', error);
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * Get full membership application status (legacy endpoint)
 * GET /api/membership/full-membership-status
 */
export const getFullMembershipStatus = async (req, res) => {
  try {
    const userId = req.user.id || req.user.user_id;
    
    console.log('🔍 Getting full membership status (legacy):', userId);
    
    const status = await applicationService.getApplicationStatus(userId);
    
    // Format response for legacy compatibility
    const fullApp = status.full_membership_application;
    
    return successResponse(res, {
      hasApplication: fullApp.exists,
      status: fullApp.status,
      applicationId: fullApp.id,
      ticket: fullApp.ticket,
      submittedAt: fullApp.submittedAt,
      reviewedAt: fullApp.reviewedAt,
      timeline: fullApp.timeline,
      eligibility: {
        canApply: status.overall_status.membership_stage === 'pre_member' && 
                 (!fullApp.status || ['not_applied', 'declined'].includes(fullApp.status)),
        currentStage: status.overall_status.membership_stage,
        currentStatus: status.overall_status.is_member
      }
    }, 'Full membership status retrieved');
    
  } catch (error) {
    console.error('❌ Error getting full membership status:', error);
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * Get all user applications (legacy endpoint)
 * GET /api/membership/all-applications
 */
export const getAllApplications = async (req, res) => {
  try {
    const userId = req.user.id || req.user.user_id;
    
    console.log('🔍 Getting all applications (legacy):', userId);
    
    const history = await applicationService.getApplicationHistory(userId);
    
    // Combine all applications for legacy compatibility
    const allApplications = [
      ...history.initial_applications,
      ...history.full_membership_applications
    ].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    
    return successResponse(res, {
      applications: allApplications,
      summary: history.summary,
      totalCount: allApplications.length
    }, 'All applications retrieved');
    
  } catch (error) {
    console.error('❌ Error getting all applications:', error);
    return errorResponse(res, error, error.statusCode || 500);
  }
};

// =============================================================================
// USER INFORMATION ENDPOINTS
// =============================================================================

/**
 * Get current user's membership summary
 * GET /api/membership/user-summary
 */
export const getUserSummary = async (req, res) => {
  try {
    const userId = req.user.id || req.user.user_id;
    
    console.log('🔍 Getting user summary:', userId);
    
    // Get user basic info
    const user = await getUserById(userId);
    if (!user) {
      return errorResponse(res, new Error('User not found'), 404);
    }
    
    // Get application status and progression
    const [status, progression] = await Promise.all([
      applicationService.getApplicationStatus(userId),
      applicationService.getMembershipProgression(userId)
    ]);
    
    return successResponse(res, {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      },
      membership: {
        current_stage: status.overall_status.membership_stage,
        is_member: status.overall_status.is_member,
        can_progress: status.overall_status.can_progress
      },
      applications: {
        initial: status.initial_application,
        full_membership: status.full_membership_application
      },
      progression: progression,
      next_steps: status.next_steps,
      requirements_met: status.requirements_met
    }, 'User summary retrieved successfully');
    
  } catch (error) {
    console.error('❌ Error getting user summary:', error);
    return errorResponse(res, error, error.statusCode || 500);
  }
};

// =============================================================================
// ANALYTICS & REPORTING ENDPOINTS (for admins)
// =============================================================================

/**
 * Get application analytics (admin only)
 * GET /api/membership/application-analytics
 */
export const getApplicationAnalytics = async (req, res) => {
  try {
    // Check admin permissions
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return errorResponse(res, new Error('Admin access required'), 403);
    }
    
    const { timeframe = '30d', groupBy = 'day' } = req.query;
    
    console.log('📊 Getting application analytics:', { timeframe, groupBy });
    
    // Get basic analytics from database
    const [analyticsData] = await db.query(`
      SELECT 
        DATE(sl.createdAt) as date,
        sl.application_type,
        COUNT(*) as total_submitted,
        COUNT(CASE WHEN sl.approval_status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN sl.approval_status = 'declined' THEN 1 END) as declined,
        COUNT(CASE WHEN sl.approval_status = 'pending' THEN 1 END) as pending,
        AVG(CASE WHEN sl.reviewedAt IS NOT NULL THEN DATEDIFF(sl.reviewedAt, sl.createdAt) END) as avg_processing_days
      FROM surveylog sl
      WHERE sl.createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(sl.createdAt), sl.application_type
      ORDER BY date DESC, sl.application_type
    `, [timeframe === '7d' ? 7 : timeframe === '90d' ? 90 : 30]);
    
    // Get summary statistics
    const [summaryStats] = await db.query(`
      SELECT 
        COUNT(*) as total_applications,
        COUNT(CASE WHEN approval_status = 'pending' THEN 1 END) as pending_total,
        COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) as approved_total,
        COUNT(CASE WHEN approval_status = 'declined' THEN 1 END) as declined_total,
        AVG(CASE WHEN reviewedAt IS NOT NULL THEN DATEDIFF(reviewedAt, createdAt) END) as overall_avg_processing
      FROM surveylog
      WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [timeframe === '7d' ? 7 : timeframe === '90d' ? 90 : 30]);
    
    return successResponse(res, {
      timeframe,
      summary: summaryStats[0],
      daily_breakdown: analyticsData,
      generatedAt: new Date().toISOString()
    }, 'Application analytics retrieved successfully');
    
  } catch (error) {
    console.error('❌ Error getting application analytics:', error);
    return errorResponse(res, error, error.statusCode || 500);
  }
};

// =============================================================================
// HELPER ENDPOINTS
// =============================================================================

/**
 * Health check endpoint
 * GET /api/membership/application-health
 */
export const healthCheck = async (req, res) => {
  try {
    // Simple database connectivity test
    const [result] = await db.query('SELECT 1 as health_check');
    
    return successResponse(res, {
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      service: 'application_controller'
    }, 'Application service is healthy');
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
    return res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
      service: 'application_controller'
    });
  }
};

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  // Main application status endpoints
  getApplicationStatus,
  getApplicationDetails,
  getApplicationHistory,
  
  // Validation endpoints
  validateEligibility,
  getMembershipProgression,
  checkActionEligibility,
  
  // Legacy compatibility endpoints
  getInitialStatus,
  getFullMembershipStatus,
  getAllApplications,
  
  // User information
  getUserSummary,
  
  // Analytics (admin only)
  getApplicationAnalytics,
  
  // Utility
  healthCheck
};