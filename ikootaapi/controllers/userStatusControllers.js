// ikootaapi/controllers/userStatusControllers.js
// USER STATUS & DASHBOARD CONTROLLERS
// Handles user status checking, dashboard data, and system health

import {
  getUserDashboardService,
  getCurrentMembershipStatusService,
  checkSurveyStatusService,
  getApplicationStatusService,
  getApplicationHistoryService,
  getSystemHealthService,
  getSystemStatusService,
  getUserPermissionsService,
  getUserPreferencesService,
  updateUserPreferencesService,
  getUserStatsService
} from '../services/userStatusServices.js';

import { getUserProfileService } from '../services/userServices.js';

// ===============================================
// SYSTEM HEALTH & TESTING ENDPOINTS
// ===============================================

/**
 * System health check
 * GET /api/users/health
 */
export const healthCheck = async (req, res) => {
  try {
    console.log('❤️ Health check requested');
    
    const healthData = await getSystemHealthService();
    
    console.log('✅ Health check completed:', healthData.status);
    res.status(200).json({
      success: true,
      ...healthData
    });
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
    
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  }
};

/**
 * Simple connectivity test
 * GET /api/users/test-simple
 */
export const testSimple = (req, res) => {
  const testData = {
    success: true,
    message: 'User routes are working!',
    timestamp: new Date().toISOString(),
    server_info: {
      path: req.path,
      method: req.method,
      environment: process.env.NODE_ENV || 'development',
      uptime_seconds: Math.floor(process.uptime()),
      node_version: process.version
    },
    endpoint_structure: {
      health: '/health - System health check',
      dashboard: '/dashboard - User dashboard',
      status: '/status - Current membership status',
      testing: '/test-* - Various test endpoints'
    }
  };
  
  console.log('🧪 Simple test completed successfully');
  res.status(200).json(testData);
};

/**
 * Authentication test endpoint
 * GET /api/users/test-auth
 */
export const testAuth = (req, res) => {
  try {
    const userId = req.user?.id;
    
    const authTestData = {
      success: true,
      message: 'Authentication is working!',
      timestamp: new Date().toISOString(),
      user_info: {
        id: userId,
        username: req.user?.username,
        role: req.user?.role,
        membership_stage: req.user?.membership_stage,
        is_member: req.user?.is_member,
        email: req.user?.email
      },
      token_info: {
        token_valid: true,
        authenticated: !!userId,
        authorization_header: req.headers.authorization ? 'Present' : 'Missing'
      },
      server_info: {
        endpoint: req.path,
        method: req.method,
        environment: process.env.NODE_ENV || 'development'
      }
    };
    
    console.log('🔐 Auth test completed for user:', req.user?.username || 'unknown');
    res.status(200).json(authTestData);
    
  } catch (error) {
    console.error('❌ Auth test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Dashboard connectivity test
 * GET /api/users/test-dashboard
 */
export const testDashboard = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    console.log('🧪 Dashboard test for user:', userId);
    
    const dashboardTestData = {
      success: true,
      message: 'Dashboard connectivity test passed',
      timestamp: new Date().toISOString(),
      user_context: {
        id: userId,
        username: req.user?.username,
        role: req.user?.role
      },
      dashboard_readiness: {
        authentication: !!userId,
        ready_for_dashboard: !!userId
      }
    };
    
    console.log('✅ Dashboard test completed successfully');
    res.status(200).json(dashboardTestData);
    
  } catch (error) {
    console.error('❌ Dashboard test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Dashboard connectivity test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * System status overview
 * GET /api/users/system/status
 */
export const getSystemStatus = async (req, res) => {
  try {
    console.log('🖥️ Getting system status overview');
    
    const systemStatusData = await getSystemStatusService();
    
    console.log('✅ System status overview generated');
    res.status(200).json({
      success: true,
      data: systemStatusData,
      message: 'System status retrieved successfully'
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

// ===============================================
// USER DASHBOARD
// ===============================================

/**
 * Primary user dashboard with comprehensive status
 * GET /api/users/dashboard
 */
export const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required',
        message: 'Please login to access your dashboard'
      });
    }

    console.log('📊 Getting dashboard for user:', userId);

    const dashboardData = await getUserDashboardService(userId);
    
    // ✅ SAFE RESPONSE CONSTRUCTION
    const safeResponse = {
      success: true,
      data: dashboardData,
      message: 'Dashboard loaded successfully'
    };

    console.log('✅ Dashboard generated for user:', req.user?.username);
    res.status(200).json(safeResponse);

  } catch (error) {
    console.error('❌ Error generating dashboard:', error);
    
    let statusCode = 500;
    if (error.message.includes('not found')) statusCode = 404;
    
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to load dashboard',
      message: 'Unable to generate dashboard data',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// STATUS CHECKING ENDPOINTS
// ===============================================

/**
 * Current membership status
 * GET /api/users/status OR /api/users/membership/status
 */
export const getCurrentMembershipStatus = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    console.log('🔍 Checking membership status for user:', userId);
    
    const statusData = await getCurrentMembershipStatusService(userId);

    console.log('✅ Status check completed for user:', req.user?.username, 'stage:', statusData.current_status.membership_stage);
    res.status(200).json({
      success: true,
      data: statusData,
      message: 'Status retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Status check error:', error);
    
    let statusCode = 500;
    if (error.message.includes('not found')) statusCode = 404;
    
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to check status',
      message: 'Unable to retrieve membership status',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Enhanced survey status check
 * GET /api/users/survey/status
 */
export const checkSurveyStatus = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    console.log('🔍 Checking survey status for user:', userId);

    const responseData = await checkSurveyStatusService(userId);

    console.log('✅ Survey status check completed successfully');
    res.status(200).json({
      success: true,
      ...responseData
    });

  } catch (error) {
    console.error('❌ Error checking survey status:', error);
    
    let statusCode = 500;
    if (error.message.includes('not found')) statusCode = 404;
    
    res.status(statusCode).json({ 
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Application status check
 * GET /api/users/application/status
 */
export const checkApplicationStatus = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    console.log('📋 Checking application status for user:', userId);

    const statusData = await getApplicationStatusService(userId);

    res.status(200).json({
      success: true,
      data: statusData,
      message: 'Application status retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error checking application status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check application status',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get application history
 * GET /api/users/application-history OR /api/users/history
 */
export const getApplicationHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    console.log('📚 Getting application history for user:', userId);

    const historyData = await getApplicationHistoryService(userId);

    console.log('✅ Application history retrieved:', historyData.data.application_history.length, 'records');
    res.status(200).json({
      success: true,
      data: historyData,
      message: 'Application history retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error getting application history:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get application history',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// USER PROFILE FUNCTIONS
// ===============================================

/**
 * Get basic user profile information
 * GET /api/users/profile/basic
 */
export const getBasicProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user.user_id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    console.log('👤 Getting basic profile for user:', userId);

    // ✅ Get the user profile data from service
    const userProfileResult = await getUserProfileService(userId);
    
    // ✅ Extract the user data from the service response
    const userData = userProfileResult.user || userProfileResult;
    
    // ✅ Build the proper response with actual data
    const response = {
      success: true,
      data: {
        profile: {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          phone: userData.phone,
          role: userData.role,
          converseId: userData.converse_id,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt,
          lastLogin: userData.lastLogin,
          isBlocked: userData.isblocked,
          isBanned: userData.isbanned
        },
        membership: {
          membershipStage: userData.membership_stage,
          isMember: userData.is_member,
          fullMembershipStatus: userData.full_membership_status,
          mentorId: userData.mentor_id,
          mentorName: userData.mentor?.name,
          mentorEmail: userData.mentor?.email,
          primaryClassId: userData.primary_class_id,
          primaryClassName: userData.class?.name,
          totalClasses: userData.total_classes,
          isIdentityMasked: userData.is_identity_masked
        }
      },
      message: 'Basic profile retrieved successfully'
    };

    console.log('✅ Basic profile retrieved for:', userData.username);
    res.json(response);

  } catch (error) {
    console.error('❌ Get basic profile error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      path: '/profile/basic',
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// USER PERMISSIONS & PREFERENCES
// ===============================================

/**
 * Get user permissions
 * GET /api/users/permissions
 */
export const getUserPermissions = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role || 'user';
    const membershipStage = req.user?.membership_stage || 'none';
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    console.log('🔒 Getting permissions for user:', userId, 'role:', userRole);

    const permissionsData = getUserPermissionsService(userId, userRole, membershipStage);
    
    res.status(200).json({
      success: true,
      data: permissionsData,
      message: 'Permissions retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Error getting permissions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get permissions',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get user preferences
 * GET /api/users/preferences
 */
export const getUserPreferences = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }
    
    console.log('⚙️ Getting preferences for user:', userId);
    
    const preferencesData = await getUserPreferencesService(userId);
    
    return res.json({
      success: true,
      data: preferencesData,
      message: 'Preferences retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Get user preferences error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get preferences',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update user preferences
 * PUT /api/users/preferences
 */
export const updateUserPreferences = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }
    
    console.log('🔧 Updating preferences for user:', userId);
    
    const result = await updateUserPreferencesService(userId, req.body);
    
    return res.json({
      success: true,
      data: result,
      message: 'Preferences updated successfully'
    });
    
  } catch (error) {
    console.error('❌ Update user preferences error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update preferences',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    console.log('📊 Getting user stats for user:', userId);

    const statsData = await getUserStatsService(userId);

    return res.json({
      success: true,
      data: statsData,
      message: 'User stats retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Get user stats error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get user stats',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// EXPORT ALL FUNCTIONS
// ===============================================

export default {
  // System health & testing
  healthCheck,
  testSimple,
  testAuth,
  testDashboard,
  getSystemStatus,
  
  // Dashboard
  getUserDashboard,
  
  // Status checking
  getCurrentMembershipStatus,
  checkSurveyStatus,
  checkApplicationStatus,
  getApplicationHistory,
  
  // Profile & preferences
  getBasicProfile,
  getUserPermissions,
  getUserPreferences,
  updateUserPreferences
};