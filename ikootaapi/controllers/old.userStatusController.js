// ikootaapi/controllers/userStatusController.js
// ===============================================
// USER STATUS & BASIC OPERATIONS CONTROLLER
// Handles user status checks, health endpoints, and basic operations
// ===============================================

import db from '../config/db.js';
import { 
  getUserById,
  getUserByIdFixed,
  successResponse, 
  errorResponse,
  testUserLookup 
} from './old.membershipCore.js';

// =============================================================================
// SYSTEM HEALTH & TESTING ENDPOINTS
// =============================================================================

/**
 * System health check
 * GET /health
 */
export const healthCheck = async (req, res) => {
  try {
    // Check database connectivity
    await db.query('SELECT 1 as health_check');
    
    // Get basic system stats
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as new_users_24h,
        (SELECT COUNT(*) FROM surveylog WHERE approval_status = 'pending') as pending_applications
      FROM users
    `);
    
    return res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      stats: stats[0],
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development'
    });
    
  } catch (error) {
    return res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Simple connectivity test
 * GET /test-simple
 */
export const testSimple = (req, res) => {
  res.json({
    success: true,
    message: 'Membership routes are working!',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
};

/**
 * Authentication test endpoint
 * GET /test-auth
 */
export const testAuth = (req, res) => {
  res.json({
    success: true,
    message: 'Authentication is working!',
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
      email: req.user.email
    },
    timestamp: new Date().toISOString(),
    tokenValid: true
  });
};

/**
 * Dashboard connectivity test
 * GET /test-dashboard
 */
export const testDashboard = async (req, res) => {
  try {
    console.log('🧪 Test dashboard route called');
    console.log('🧪 User:', req.user);
    
    // Test database connectivity
    const [testResult] = await db.query('SELECT NOW() as current_time, ? as user_id', [req.user.id]);
    
    res.json({
      success: true,
      message: 'Test dashboard route working',
      user: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role
      },
      database: {
        connected: true,
        current_time: testResult[0].current_time,
        test_query: 'passed'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('🧪 Test dashboard error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Test dashboard failed',
      details: error.message,
      user: req.user?.id || 'unknown'
    });
  }
};

// =============================================================================
// USER STATUS CHECKING FUNCTIONS
// =============================================================================

/**
 * ✅ MINIMAL FIX: Survey status check with only the actual database change
 * GET /survey/check-status
 * 
 * ONLY changed: s.reviewedAt → s.reviewedAt (matches database change)
 */
export const checkSurveyStatus = async (req, res) => {
  try {
    const userId = req.user?.user_id || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    console.log('🔍 Checking survey status for userId:', userId);

    // ✅ ONLY FIX: Change s.reviewedAt to s.reviewedAt (the one field that was changed in DB)
    const userResults = await db.query(`
      SELECT 
        u.*,
        sl.approval_status,
        sl.answers,
        sl.createdAt as survey_submittedAt,
        sl.reviewedAt as survey_reviewedAt,   -- ✅ ONLY CHANGE: was s.reviewedAt, now s.reviewedAt
        fma.status as membership_application_status,
        fma.membership_ticket as membership_ticket,
        fma.submittedAt as membership_appliedAt,
        fma.reviewedAt as membership_reviewedAt
      FROM users u
      LEFT JOIN surveylog sl ON u.id = sl.user_id
        AND sl.application_type = 'initial_application'
        AND sl.id = (
          SELECT MAX(id) FROM surveylog 
          WHERE user_id = u.id AND application_type = 'initial_application'
        )
      LEFT JOIN full_membership_applications fma ON u.id = fma.user_id
        AND fma.id = (
          SELECT MAX(id) FROM full_membership_applications 
          WHERE user_id = u.id
        )
      WHERE u.id = ?
      LIMIT 1
    `, [userId]);

    // Handle database result format properly
    let user = null;
    if (Array.isArray(userResults) && userResults.length > 0) {
      if (Array.isArray(userResults[0]) && userResults[0].length > 0) {
        user = userResults[0][0]; // MySQL2 format [rows, fields]
      } else if (userResults[0] && typeof userResults[0] === 'object') {
        user = userResults[0]; // Direct format
      }
    }

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    console.log('✅ User found, processing survey status...');
    
    const surveyCompleted = !!user.answers;
    const needsSurvey = !surveyCompleted && !['granted', 'member', 'pre_member'].includes(user.is_member);

    const responseData = {
      success: true,
      data: {
        survey_completed: surveyCompleted,
        needs_survey: needsSurvey,
        approval_status: user.approval_status || 'pending',
        survey_data: user.answers ? JSON.parse(user.answers) : null,
        survey_submittedAt: user.survey_submittedAt,
        survey_reviewedAt: user.survey_reviewedAt,
        membership_application_status: user.membership_application_status || 'not_applied',
        membership_ticket: user.membership_ticket,
        membership_appliedAt: user.membership_appliedAt,
        membership_reviewedAt: user.membership_reviewedAt,
        user_status: {
          membership_stage: user.membership_stage,
          is_member: user.is_member,
          role: user.role
        }
      }
    };

    console.log('✅ Survey status check completed successfully');
    res.json(responseData);

  } catch (error) {
    console.error('❌ Error checking survey status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get current membership status
 * GET /status
 * 
 * ✅ MINIMAL FIX: Only change s.reviewedAt → s.reviewedAt
 */
export const getCurrentMembershipStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('🔍 Checking membership status for user:', userId);
    
    // ✅ ONLY FIX: Change s.reviewedAt to s.reviewedAt (database field that was changed)
    const [userStatus] = await db.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.is_member,
        u.membership_stage,
        u.application_status,
        u.application_submittedAt,
        u.application_reviewedAt,
        u.converse_id,
        u.mentor_id,
        u.primary_class_id,
        u.decline_reason,
        s.approval_status,
        s.reviewedAt as survey_reviewedAt,  -- ✅ ONLY CHANGE: was s.reviewedAt
        s.createdAt as survey_submittedAt
      FROM users u
      LEFT JOIN surveylog s ON u.id = s.user_id 
        AND s.application_type = 'initial_application'
        AND s.id = (
          SELECT MAX(id) FROM surveylog 
          WHERE user_id = u.id AND application_type = 'initial_application'
        )
      WHERE u.id = ?
    `, [userId]);
    
    if (userStatus.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userStatus[0];
    
    // Determine if user needs to complete survey
    const needsSurvey = (
      user.is_member === 'applied' && 
      user.membership_stage === 'none' && 
      user.application_status === 'not_submitted'
    );
    
    const surveyCompleted = user.application_status !== 'not_submitted' || !!user.survey_submittedAt;
    
    // Determine redirect path based on status
    let redirectTo = '/dashboard';
    if (needsSurvey) {
      redirectTo = '/applicationsurvey';
    } else if (user.is_member === 'pre_member' || user.membership_stage === 'pre_member') {
      redirectTo = '/towncrier';
    } else if (user.is_member === 'member' && user.membership_stage === 'member') {
      redirectTo = '/iko';
    }
    
    res.json({
      success: true,
      user_status: user.is_member,
      membership_stage: user.membership_stage,
      application_status: user.application_status,
      needs_survey: needsSurvey,
      survey_completed: surveyCompleted,
      approval_status: user.approval_status,
      converse_id: user.converse_id,
      submittedAt: user.application_submittedAt || user.survey_submittedAt,
      reviewedAt: user.application_reviewedAt || user.survey_reviewedAt,
      decline_reason: user.decline_reason,
      redirect_to: redirectTo,
      permissions: {
        can_access_towncrier: ['pre_member', 'member'].includes(user.membership_stage),
        can_access_iko: user.membership_stage === 'member',
        can_apply_full_membership: user.membership_stage === 'pre_member'
      }
    });
    
  } catch (error) {
    console.error('❌ Status check error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// =============================================================================
// COMPATIBILITY & LEGACY SUPPORT
// =============================================================================

/**
 * Legacy membership status check (for backward compatibility)
 * GET /membership/status
 */
export const getLegacyMembershipStatus = async (req, res) => {
  try {
    // Just redirect to the new status endpoint
    return getCurrentMembershipStatus(req, res);
  } catch (error) {
    console.error('❌ Legacy status check error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * User status check (alternative endpoint)
 * GET /user/status
 */
export const getUserStatus = async (req, res) => {
  try {
    // Just redirect to the new status endpoint
    return getCurrentMembershipStatus(req, res);
  } catch (error) {
    console.error('❌ User status check error:', error);
    res.status(500).json({ error: error.message });
  }
};

// =============================================================================
// DEBUG & TESTING FUNCTIONS
// =============================================================================

/**
 * Test user lookup functionality (exported from membershipCore)
 * GET /test-user-lookup/:userId
 */
export { testUserLookup };

/**
 * Debug application status consistency
 * GET /debug/application-status/:userId
 * 
 * ✅ MINIMAL FIX: Only change s.reviewedAt → s.reviewedAt
 */
export const debugApplicationStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user.id;
    
    // Only allow users to debug their own status or admins to debug any
    if (parseInt(userId) !== requestingUserId && !['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        error: 'Can only debug your own status'
      });
    }
    
    // ✅ ONLY FIX: Change s.reviewedAt to s.reviewedAt
    const [userInfo] = await db.query(`
      SELECT 
        u.*,
        sl.id as survey_id,
        sl.approval_status as survey_status,
        sl.createdAt as survey_created,
        sl.reviewedAt as survey_reviewed,  -- ✅ ONLY CHANGE: was s.reviewedAt
        sl.answers as survey_answers
      FROM users u
      LEFT JOIN surveylog sl ON u.id = sl.user_id 
        AND sl.application_type = 'initial_application'
      WHERE u.id = ?
      ORDER BY sl.createdAt DESC
    `, [userId]);
    
    if (userInfo.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userInfo[0];
    
    // Analyze status consistency
    const analysis = {
      user_table: {
        membership_stage: user.membership_stage,
        is_member: user.is_member,
        application_status: user.application_status,
        application_submittedAt: user.application_submittedAt,
        application_reviewedAt: user.application_reviewedAt
      },
      survey_table: {
        has_survey: !!user.survey_id,
        survey_status: user.survey_status,
        survey_created: user.survey_created,
        survey_reviewed: user.survey_reviewed,
        has_answers: !!user.survey_answers
      },
      consistency_check: {
        tables_match: user.application_status === user.survey_status,
        dates_match: user.application_submittedAt === user.survey_created,
        status_progression_valid: true // TODO: Add validation logic
      }
    };
    
    res.json({
      success: true,
      debug: {
        userId: parseInt(userId),
        analysis,
        recommendations: analysis.consistency_check.tables_match ? 
          ['Status is consistent'] : 
          ['Check for data inconsistency', 'Consider data cleanup'],
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Debug application status error:', error);
    res.status(500).json({
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * System status overview (for monitoring)
 * GET /system/status
 */
export const getSystemStatus = async (req, res) => {
  try {
    // Get system statistics
    const [systemStats] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE membership_stage = 'pre_member') as pre_members,
        (SELECT COUNT(*) FROM users WHERE membership_stage = 'member') as full_members,
        (SELECT COUNT(*) FROM surveylog WHERE approval_status = 'pending') as pending_applications,
        (SELECT COUNT(*) FROM users WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as new_users_today,
        (SELECT COUNT(*) FROM surveylog WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as new_applications_today
    `);
    
    // Check database performance
    const startTime = Date.now();
    await db.query('SELECT 1');
    const dbResponseTime = Date.now() - startTime;
    
    const status = systemStats[0];
    
    res.json({
      success: true,
      system_status: 'operational',
      statistics: status,
      performance: {
        database_response_time_ms: dbResponseTime,
        uptime_seconds: process.uptime(),
        memory_usage: process.memoryUsage(),
        node_version: process.version
      },
      health_indicators: {
        database: dbResponseTime < 1000 ? 'healthy' : 'slow',
        application_processing: status.pending_applications < 100 ? 'normal' : 'backlog',
        user_growth: status.new_users_today > 0 ? 'active' : 'stable'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ System status error:', error);
    res.status(500).json({
      success: false,
      system_status: 'degraded',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get user's basic profile information
 * GET /profile/basic
 */
export const getBasicProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await getUserById(userId);
    
    // Return safe profile information
    const profile = {
      id: user.id,
      username: user.username,
      email: user.email,
      membership_stage: user.membership_stage,
      is_member: user.is_member,
      role: user.role,
      converse_id: user.converse_id,
      member_since: user.createdAt,
      last_updated: user.updatedAt
    };
    
    res.json({
      success: true,
      profile,
      permissions: {
        can_edit_profile: true,
        can_delete_account: user.role !== 'admin' && user.role !== 'super_admin',
        can_access_admin: ['admin', 'super_admin'].includes(user.role)
      }
    });
    
  } catch (error) {
    console.error('❌ Get basic profile error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};