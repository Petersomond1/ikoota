// ikootaapi/controllers/userStatusControllers.js
// USER STATUS & DASHBOARD CONTROLLERS - UPDATED TO USE SERVICES
// Handles user status checking, profile management, and legacy compatibility

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
  debugApplicationStatusService,
  getLegacyMembershipStatusService,
  getUserStatusService
} from '../services/userStatusServices.js';

import { getUserProfileService } from '../services/userServices.js';

// ===============================================
// SYSTEM HEALTH & TESTING ENDPOINTS
// ===============================================

/**
 * System health check
 * GET /api/user-status/health
 */
// export const healthCheck = async (req, res) => {
//   try {
//     console.log('❤️ Health check requested');
    
//     const healthData = await getSystemHealthService();
    
//     console.log('✅ Health check completed:', healthData.status);
//     res.status(200).json({
//       success: true,
//       ...healthData
//     });
    
//   } catch (error) {
//     console.error('❌ Health check failed:', error);
    
//     res.status(503).json({
//       success: false,
//       status: 'unhealthy',
//       error: error.message,
//       timestamp: new Date().toISOString(),
//       environment: process.env.NODE_ENV || 'development'
//     });
//   }
// };

/**
 * Simple connectivity test
 * GET /api/user-status/test-simple
 */
// export const testSimple = (req, res) => {
//   const testData = {
//     success: true,
//     message: 'User status routes are working!',
//     timestamp: new Date().toISOString(),
//     server_info: {
//       path: req.path,
//       method: req.method,
//       environment: process.env.NODE_ENV || 'development',
//       uptime_seconds: Math.floor(process.uptime()),
//       node_version: process.version
//     },
//     endpoint_structure: {
//       health: '/health - System health check',
//       dashboard: '/dashboard - User dashboard',
//       status: '/status - Current membership status',
//       testing: '/test-* - Various test endpoints'
//     }
//   };
  
//   console.log('🧪 Simple test completed successfully');
//   res.status(200).json(testData);
// };

/**
 * Authentication test endpoint
 * GET /api/user-status/test-auth
 */
// export const testAuth = (req, res) => {
//   try {
//     const userId = req.user?.id;
    
//     const authTestData = {
//       success: true,
//       message: 'Authentication is working!',
//       timestamp: new Date().toISOString(),
//       user_info: {
//         id: userId,
//         username: req.user?.username,
//         role: req.user?.role,
//         membership_stage: req.user?.membership_stage,
//         is_member: req.user?.is_member,
//         email: req.user?.email
//       },
//       token_info: {
//         token_valid: true,
//         authenticated: !!userId,
//         authorization_header: req.headers.authorization ? 'Present' : 'Missing'
//       },
//       server_info: {
//         endpoint: req.path,
//         method: req.method,
//         environment: process.env.NODE_ENV || 'development'
//       }
//     };
    
//     console.log('🔐 Auth test completed for user:', req.user?.username || 'unknown');
//     res.status(200).json(authTestData);
    
//   } catch (error) {
//     console.error('❌ Auth test failed:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Authentication test failed',
//       error: error.message,
//       timestamp: new Date().toISOString()
//     });
//   }
// };

/**
 * Dashboard connectivity test
 * GET /api/user-status/test-dashboard
 */
// export const testDashboard = async (req, res) => {
//   try {
//     const userId = req.user?.id;
    
//     console.log('🧪 Dashboard test for user:', userId);
    
//     // Test database connectivity with user-specific query
//     const db = (await import('../config/db.js')).default;
//     const [testResult] = await db.query(`
//       SELECT 
//         NOW() as current_time, 
//         ? as user_id,
//         'dashboard_test' as test_type
//     `, [userId]);
    
//     // Get basic user info for dashboard test
//     let userInfo = null;
//     if (userId) {
//       try {
//         userInfo = await getUserProfileService(userId);
//       } catch (userError) {
//         console.warn('Could not fetch user info for dashboard test:', userError.message);
//       }
//     }
    
//     const dashboardTestData = {
//       success: true,
//       message: 'Dashboard connectivity test passed',
//       timestamp: new Date().toISOString(),
//       user_context: {
//         id: userId,
//         username: req.user?.username,
//         role: req.user?.role,
//         user_data_accessible: !!userInfo
//       },
//       database_test: {
//         connected: true,
//         current_time: testResult[0].current_time,
//         query_execution: 'successful',
//         response_time: 'normal'
//       },
//       dashboard_readiness: {
//         authentication: !!userId,
//         database_access: true,
//         user_profile_access: !!userInfo,
//         ready_for_dashboard: !!(userId && userInfo)
//       }
//     };
    
//     console.log('✅ Dashboard test completed successfully');
//     res.status(200).json(dashboardTestData);
    
//   } catch (error) {
//     console.error('❌ Dashboard test failed:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Dashboard connectivity test failed',
//       error: error.message,
//       user_id: req.user?.id || 'unknown',
//       timestamp: new Date().toISOString()
//     });
//   }
// };

// ===============================================
// USER DASHBOARD
// ===============================================

/**
 * Primary user dashboard with comprehensive status
 * GET /api/user-status/dashboard
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

    // ✅ DEBUG: Check final response
    console.log('📊 Final response size:', JSON.stringify(safeResponse).length, 'characters');
    
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



// export const getUserDashboard = async (req, res) => {
//   try {
//     const userId = req.user?.id;
    
//     if (!userId) {
//       return res.status(401).json({
//         success: false,
//         error: 'User authentication required',
//         message: 'Please login to access your dashboard'
//       });
//     }

//     console.log('📊 Getting dashboard for user:', userId);

//     const dashboardData = await getUserDashboardService(userId);
    
//     console.log('✅ Dashboard generated for user:', req.user?.username);
//     res.status(200).json({
//       success: true,
//       data: dashboardData,
//       message: 'Dashboard loaded successfully'
//     });

//   } catch (error) {
//     console.error('❌ Error generating dashboard:', error);
    
//     let statusCode = 500;
//     if (error.message.includes('not found')) statusCode = 404;
    
//     res.status(statusCode).json({
//       success: false,
//       error: error.message || 'Failed to load dashboard',
//       message: 'Unable to generate dashboard data',
//       path: req.path,
//       timestamp: new Date().toISOString()
//     });
//   }
// };

// ===============================================
// STATUS CHECKING ENDPOINTS
// ===============================================

/**
 * Current membership status
 * GET /api/user-status/status
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
 * GET /api/user-status/survey/check-status
 */
// export const checkSurveyStatus = async (req, res) => {
//   try {
//     const userId = req.user?.id;
    
//     if (!userId) {
//       return res.status(401).json({
//         success: false,
//         error: 'User not authenticated'
//       });
//     }

//     console.log('🔍 Checking survey status for user:', userId);

//     const responseData = await checkSurveyStatusService(userId);

//     console.log('✅ Survey status check completed successfully');
//     res.status(200).json({
//       success: true,
//       ...responseData
//     });

//   } catch (error) {
//     console.error('❌ Error checking survey status:', error);
    
//     let statusCode = 500;
//     if (error.message.includes('not found')) statusCode = 404;
    
//     res.status(statusCode).json({ 
//       success: false,
//       message: 'Internal server error',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined,
//       path: req.path,
//       timestamp: new Date().toISOString()
//     });
//   }
// };

/**
 * Application status check
 * GET /api/user-status/application/status
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
 * GET /api/user-status/application-history
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
 * GET /api/user-status/profile/basic
 */
// export const getBasicProfile = async (req, res) => {
//   try {
//     const userId = req.user?.id;
    
//     if (!userId) {
//       return res.status(401).json({
//         success: false,
//         error: 'User authentication required'
//       });
//     }

//     console.log('👤 Getting basic profile for user:', userId);
    
//     const profileData = await getUserProfileService(userId);
    
//     // Calculate membership journey progress
//     const journeyStages = [
//       { stage: 'registration', completed: true, date: profileData.member_since },
//       { stage: 'application', completed: false, date: null }, // Would need to check applications
//       { stage: 'pre_member', completed: ['pre_member', 'member'].includes(profileData.membership_stage), date: null },
//       { stage: 'full_member', completed: profileData.membership_stage === 'member', date: null }
//     ];
    
//     const currentStageIndex = journeyStages.filter(s => s.completed).length - 1;
//     const progressPercentage = Math.round(((currentStageIndex + 1) / journeyStages.length) * 100);
    
//     res.status(200).json({
//       success: true,
//       data: {
//         profile: {
//           id: profileData.id,
//           username: profileData.username,
//           email: profileData.email,
//           phone: profileData.phone,
//           memberSince: profileData.member_since,
//           lastLogin: profileData.lastLogin,
//           converseId: profileData.converse_id
//         },
//         membership: {
//           stage: profileData.membership_stage,
//           status: profileData.is_member,
//           role: profileData.role,
//           mentorName: profileData.mentor?.name,
//           primaryClassName: profileData.class?.name
//         },
//         journey: {
//           stages: journeyStages,
//           currentStage: journeyStages[currentStageIndex]?.stage || 'registration',
//           progressPercentage: progressPercentage
//         },
//         permissions: profileData.permissions
//       },
//       message: 'Basic profile retrieved successfully'
//     });
    
//   } catch (error) {
//     console.error('❌ Get basic profile error:', error);
    
//     let statusCode = 500;
//     if (error.message.includes('not found')) statusCode = 404;
    
//     res.status(statusCode).json({
//       success: false,
//       error: error.message || 'Failed to get basic profile',
//       path: req.path,
//       timestamp: new Date().toISOString()
//     });
//   }
// };

/**
 * Get user permissions
 * GET /api/user-status/permissions
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

// ===============================================
// LEGACY COMPATIBILITY FUNCTIONS
// ===============================================

/**
 * Get legacy membership status format
 * GET /api/user-status/membership/status
 */
// export const getLegacyMembershipStatus = async (req, res) => {
//   try {
//     const userId = req.user?.id;
    
//     if (!userId) {
//       return res.status(401).json({
//         success: false,
//         error: 'User authentication required'
//       });
//     }

//     console.log('🔄 Getting legacy membership status for user:', userId);
    
//     const legacyData = await getLegacyMembershipStatusService(userId);
    
//     return res.json({
//       success: true,
//       data: legacyData
//     });
    
//   } catch (error) {
//     console.error('❌ getLegacyMembershipStatus error:', error);
//     return res.status(500).json({
//       success: false,
//       error: 'Failed to get membership status',
//       details: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };

/**
 * Get user status (simplified format)
 * GET /api/user-status/user/status
 */
// export const getUserStatus = async (req, res) => {
//   try {
//     const userId = req.user?.id;
    
//     if (!userId) {
//       return res.status(401).json({
//         success: false,
//         error: 'User authentication required'
//       });
//     }

//     console.log('👤 Getting simplified user status for:', userId);
    
//     const userStatusData = await getUserStatusService(userId);
    
//     return res.json({
//       success: true,
//       ...userStatusData
//     });
    
//   } catch (error) {
//     console.error('❌ getUserStatus error:', error);
//     return res.status(500).json({
//       success: false,
//       error: 'Failed to get user status'
//     });
//   }
// };

// ===============================================
// USER PREFERENCES & SETTINGS
// ===============================================

/**
 * Get user preferences
 * GET /api/user-status/user/preferences
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
 * PUT /api/user-status/user/preferences
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

//===============================================
//DEBUG & TESTING FUNCTIONS
//===============================================

/**
 * Debug application status consistency
 * GET /api/user-status/debug/application-status/:userId
 */
// export const debugApplicationStatus = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const requestingUserId = req.user?.id;
    
//     // Only allow users to debug their own status or admins to debug any
//     if (parseInt(userId) !== requestingUserId && !['admin', 'super_admin'].includes(req.user.role)) {
//       return res.status(403).json({
//         success: false,
//         error: 'Can only debug your own status'
//       });
//     }
    
//     console.log('🐛 Debug application status for user:', userId);
    
//     const debugInfo = await debugApplicationStatusService(userId);
    
//     res.status(200).json({
//       success: true,
//       debug_info: debugInfo,
//       message: 'Debug analysis completed'
//     });
    
//   } catch (error) {
//     console.error('❌ Debug application status error:', error);
    
//     let statusCode = 500;
//     if (error.message.includes('not found')) statusCode = 404;
    
//     res.status(statusCode).json({
//       success: false,
//       error: error.message || 'Debug analysis failed',
//       path: req.path,
//       timestamp: new Date().toISOString()
//     });
//   }
// };

/**
 * System status overview (for monitoring)
 * GET /api/user-status/system/status
 */
// export const getSystemStatus = async (req, res) => {
//   try {
//     console.log('🖥️ Getting system status overview');
    
//     const systemStatusData = await getSystemStatusService();
    
//     console.log('✅ System status overview generated');
//     res.status(200).json({
//       success: true,
//       data: systemStatusData,
//       message: 'System status retrieved successfully'
//     });
    
//   } catch (error) {
//     console.error('❌ System status error:', error);
//     res.status(500).json({
//       success: false,
//       system_status: 'degraded',
//       error: error.message,
//       timestamp: new Date().toISOString()
//     });
//   }
// };
















// Add these functions to userStatusControllers.js:







/**
 * Check survey status
 * GET /api/user-status/survey/check-status
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
 * Get basic profile
 * GET /api/user-status/profile/basic
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
    const userData = userProfileResult.user;
    
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
          converseId: userData.converseId,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt,
          lastLogin: userData.lastLogin,
          isBlocked: userData.isBlocked,
          isBanned: userData.isBanned
        },
        membership: {
          membershipStage: userData.membershipStage,
          isMember: userData.isMember,
          fullMembershipStatus: userData.fullMembershipStatus,
          mentorId: userData.mentorId,
          mentorName: userData.mentorName,
          mentorEmail: userData.mentorEmail,
          primaryClassId: userData.primaryClassId,
          primaryClassName: userData.primaryClassName,
          totalClasses: userData.totalClasses,
          isIdentityMasked: userData.isIdentityMasked
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
      path: '/profile',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get legacy membership status
 * GET /api/user-status/membership/status
 */
export const getLegacyMembershipStatus = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    console.log('🔄 Getting legacy membership status for user:', userId);
    
    const legacyData = await getLegacyMembershipStatusService(userId);
    
    return res.json({
      success: true,
      data: legacyData
    });
    
  } catch (error) {
    console.error('❌ getLegacyMembershipStatus error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get membership status',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get user status (simplified)
 * GET /api/user-status/user/status
 */
export const getUserStatus = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    console.log('👤 Getting simplified user status for:', userId);
    
    const userStatusData = await getUserStatusService(userId);
    
    return res.json({
      success: true,
      ...userStatusData
    });
    
  } catch (error) {
    console.error('❌ getUserStatus error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get user status'
    });
  }
};

/**
 * System health check
 * GET /api/user-status/health
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
 * Simple test
 * GET /api/user-status/test-simple
 */
export const testSimple = (req, res) => {
  const testData = {
    success: true,
    message: 'User status routes are working!',
    timestamp: new Date().toISOString(),
    server_info: {
      path: req.path,
      method: req.method,
      environment: process.env.NODE_ENV || 'development',
      uptime_seconds: Math.floor(process.uptime()),
      node_version: process.version
    }
  };
  
  console.log('🧪 Simple test completed successfully');
  res.status(200).json(testData);
};

/**
 * Authentication test
 * GET /api/user-status/test-auth
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
 * Dashboard test
 * GET /api/user-status/test-dashboard
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
 * Debug application status
 * GET /api/user-status/debug/application-status/:userId
 */
export const debugApplicationStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user?.id;
    
    if (parseInt(userId) !== requestingUserId && !['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Can only debug your own status'
      });
    }
    
    console.log('🐛 Debug application status for user:', userId);
    
    const debugInfo = await debugApplicationStatusService(userId);
    
    res.status(200).json({
      success: true,
      debug_info: debugInfo,
      message: 'Debug analysis completed'
    });
    
  } catch (error) {
    console.error('❌ Debug application status error:', error);
    
    let statusCode = 500;
    if (error.message.includes('not found')) statusCode = 404;
    
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Debug analysis failed',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * System status
 * GET /api/user-status/system/status
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
// EXPORT ALL FUNCTIONS
// ===============================================

export default {
  // System health & testing
  healthCheck,
  testSimple,
  testAuth,
  testDashboard,
  
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
  updateUserPreferences,
  
  // Legacy compatibility
  getLegacyMembershipStatus,
  getUserStatus,
  
  // Debug & monitoring
  debugApplicationStatus,
  getSystemStatus
};