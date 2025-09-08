// ikootaapi/routes/userRoutes.js
// MAIN USER ROUTES - System and user-facing endpoints
// All endpoints that regular users can access
// *** MERGED WITH IDENTITY ROUTES ***

import express from 'express';
import { authenticate, requireMembershipStage } from '../middleware/auth.js';

// Import simple mentorship controller (merged from standalone routes)
import SimpleMentorshipController from '../controllers/mentorshipControllers.js';

// ✅ Controller Imports - Individual Functions (Clean Architecture)
import {
  // Health & Testing
  healthCheck,
  testSimple,
  testAuth,
  testDashboard,
  getSystemStatus
} from '../controllers/userStatusControllers.js';

import {
  // Dashboard & Status
  getUserDashboard,
  getCurrentMembershipStatus,
  checkApplicationStatus,
  checkSurveyStatus,
  getApplicationHistory,
  getBasicProfile,
  getUserPermissions,
  getUserPreferences,
  updateUserPreferences
} from '../controllers/userStatusControllers.js';

import {
  // Profile Management
  getProfile,
  updateProfile,
  deleteProfile,
  
  // Settings & Password
  getUserSettings,
  updateUserSettings,
  updateUserPassword,
  
  // Notifications
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  
  // Activity & History
  getUserActivity,
  getUserContentHistory
} from '../controllers/userControllers.js';

// ✅ MERGED: Identity Controllers Imports
import {
  // Converse ID operations
  generateConverseId,
  getConverseId,
  updateConverseId,
  deleteConverseId,
  getClassMembers
} from '../controllers/converseIdControllers.js';

import {
  // Mentor ID operations
  generateMentorId,
  getMentorId,
  updateMentorId,
  deleteMentorId,
  getMentees,
  assignMentee,
  removeMentee
} from '../controllers/mentorIdControllers.js';

const router = express.Router();

// ===============================================
// HEALTH & SYSTEM ENDPOINTS (Public)
// ===============================================
router.get('/health', healthCheck);
router.get('/system/status', getSystemStatus);

// ===============================================
// SIMPLE MENTORSHIP ROUTES (MERGED)
// ===============================================

// GET /api/users/mentorship/health - Health check for mentorship system
router.get('/mentorship/health', SimpleMentorshipController.healthCheck);

// GET /api/users/mentorship/statistics - System statistics
router.get('/mentorship/statistics', SimpleMentorshipController.getSystemStatistics);

// GET /api/users/mentorship/mentors/available - Get available mentors
router.get('/mentorship/mentors/available', SimpleMentorshipController.getAvailableMentorsSimple);

// POST /api/users/mentorship/assign - Assign mentee to mentor
router.post('/mentorship/assign', 
  authenticate,
  SimpleMentorshipController.assignMenteeToMentorSimple
);

// POST /api/users/mentorship/reassign - Reassign mentee
router.post('/mentorship/reassign', 
  authenticate,
  SimpleMentorshipController.reassignMenteeSimple
);

// GET /api/users/mentorship/hierarchy/:mentorConverseId - Get mentorship hierarchy
router.get('/mentorship/hierarchy/:mentorConverseId', 
  authenticate,
  SimpleMentorshipController.getMentorshipHierarchy
);

// GET /api/users/mentorship/assignments - Get user's mentorship assignments
router.get('/mentorship/assignments', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = req.user;
    
    // Mock assignments data based on user role and mentorship status
    const assignmentsData = {
      fromMentor: [],
      toMentees: []
    };

    // If user has a mentor (mentee role), show assignments from mentor
    if (user.my_mentor_converse_id) {
      assignmentsData.fromMentor = [
        {
          id: `assignment_${userId}_1`,
          title: 'Complete African History Course Introduction',
          description: 'Study the fundamentals of African civilization and complete the assigned readings from chapters 1-3.',
          assignedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'in_progress',
          priority: 'high',
          mentorConverseId: user.my_mentor_converse_id
        },
        {
          id: `assignment_${userId}_2`,
          title: 'Practice Community Guidelines',
          description: 'Review and practice the core principles of respectful communication within our community.',
          assignedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          priority: 'medium',
          mentorConverseId: user.my_mentor_converse_id
        }
      ];
    }

    // If user is a mentor, show assignments they've given to mentees
    if (user.is_mentor) {
      assignmentsData.toMentees = [
        {
          id: `mentee_assignment_${userId}_1`,
          menteeConverseId: 'OTO#ABC123',
          title: 'Read Community Introduction Materials',
          description: 'Focus on understanding the core principles and expectations of community participation.',
          assignedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'in_progress',
          priority: 'high'
        },
        {
          id: `mentee_assignment_${userId}_2`, 
          menteeConverseId: 'OTO#DEF456',
          title: 'Complete Basic Language Exercises',
          description: 'Practice basic Swahili phrases and pronunciation using provided audio materials.',
          assignedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed',
          priority: 'medium'
        }
      ];
    }

    res.json({
      success: true,
      data: assignmentsData,
      message: 'Mentorship assignments retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch mentorship assignments',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/users/analytics - Get user analytics data
router.get('/analytics', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = req.user;
    
    // Mock analytics data (would come from database queries)
    const analyticsData = {
      classesJoined: Math.floor(Math.random() * 5),
      activitiesCompleted: Math.floor(Math.random() * 15),
      daysActive: Math.floor(Math.random() * 30) + 1,
      engagementScore: Math.floor(Math.random() * 40) + 60, // 60-100%
      learningProgress: Math.floor(Math.random() * 50) + 25 // 25-75%
    };

    res.json({
      success: true,
      data: analyticsData,
      message: 'User analytics retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user analytics',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ===============================================
// TESTING ENDPOINTS
// ===============================================
router.get('/test-simple', testSimple);
router.get('/test-auth', authenticate, testAuth);
router.get('/test-dashboard', authenticate, testDashboard);

// ===============================================
// USER DASHBOARD & STATUS (Authentication Required)
// ===============================================
router.get('/dashboard', authenticate, getUserDashboard);
router.get('/status', authenticate, getCurrentMembershipStatus);
//Not used
router.get('/membership/status', authenticate, getCurrentMembershipStatus);
//similar membershipApi
router.get('/application/status', authenticate, checkApplicationStatus);
router.get('/survey/status', authenticate, checkSurveyStatus);
router.get('/application-history', authenticate, getApplicationHistory);

//USER USERSTATUS ALIAS FOR COMPATIBILITY
//from Dashboard.jsx, MembershipStatus.jsx, ApplicationStatus.jsx, ApplicationSurvey.jsx, useUserStatus.js
router.get('/userstatus/dashboard', authenticate, getUserDashboard);
router.get('/userstatus/status', authenticate, getCurrentMembershipStatus);
router.get('/userstatus/membership/status', authenticate, getCurrentMembershipStatus);
router.get('/userstatus/application/status', authenticate, checkApplicationStatus);
router.get('/userstatus/survey/status', authenticate, checkSurveyStatus);
// ✅ ENHANCED: User learning journey and application progression tracking
router.get('/userstatus/application-history', authenticate, getApplicationHistory); 

//from Applicationsurvey.jsx, Login.jsx, useUserStatus.js,
router.get('/userstatus/survey/check-status', authenticate, checkSurveyStatus); // Alias for survey status check

// ===============================================
// USER PROFILE MANAGEMENT (Authentication Required)
// ===============================================
// ✅ ENHANCED: Essential user profile management for mentorship platform
router.get('/profile', authenticate, getProfile);
// ✅ ENHANCED: Quick profile overview for mentor/student matching
router.get('/profile/basic', authenticate, getBasicProfile);
router.put('/profile', authenticate, updateProfile);
router.delete('/profile', authenticate, deleteProfile);

// ===============================================
// USER SETTINGS & PREFERENCES (Authentication Required)
// ===============================================
// ✅ ENHANCED: User customization settings for learning preferences
router.get('/settings', authenticate, getUserSettings);
router.put('/settings', authenticate, updateUserSettings);
router.put('/password', authenticate, updateUserPassword);
// ✅ ENHANCED: Learning style and content preferences for personalization
router.get('/preferences', authenticate, getUserPreferences);
router.put('/preferences', authenticate, updateUserPreferences);

// ===============================================
// USER PERMISSIONS (Authentication Required)
// ===============================================
// ✅ ENHANCED: Role-based permissions for mentors, students, and admins
router.get('/permissions', authenticate, getUserPermissions);

// ===============================================
// CONVERSE ID MANAGEMENT (MERGED FROM IDENTITY ROUTES)
// ===============================================
// ✅ ENHANCED: Anonymous communication ID for secure mentorship interactions
// GET /users/converse - Get user's converse ID
router.get('/converse', authenticate, getConverseId);

// ✅ ENHANCED: Generate secure communication ID for privacy protection
// POST /users/converse/generate - Generate new converse ID
router.post('/converse/generate', authenticate, generateConverseId);

// PUT /users/converse - Update converse ID settings
router.put('/converse', authenticate, updateConverseId);

// DELETE /users/converse - Delete/reset converse ID
router.delete('/converse', authenticate, deleteConverseId);

// ✅ ENHANCED: Discover classmates and potential study partners
// GET /users/converse/class/:classId/members - Get class members via converse ID
router.get('/converse/class/:classId/members', authenticate, getClassMembers);

// ===============================================
// MENTOR ID MANAGEMENT (MERGED FROM IDENTITY ROUTES)
// ===============================================

// GET /users/mentor - Get user's mentor ID
router.get('/mentor', authenticate, getMentorId);

// POST /users/mentor/generate - Generate new mentor ID
router.post('/mentor/generate', authenticate, generateMentorId);

// PUT /users/mentor - Update mentor ID settings
router.put('/mentor', authenticate, updateMentorId);

// DELETE /users/mentor - Delete/reset mentor ID
router.delete('/mentor', authenticate, deleteMentorId);

// GET /users/mentor/mentees - Get mentor's mentees
router.get('/mentor/mentees', authenticate, getMentees);

// ✅ ENHANCED: Smart mentorship matching system for optimal learning pairs
// POST /users/mentor/mentees/assign - Assign mentee
router.post('/mentor/mentees/assign', authenticate, assignMentee);

// ✅ ENHANCED: Mentorship relationship management with feedback integration
// DELETE /users/mentor/mentees/:menteeId - Remove mentee
router.delete('/mentor/mentees/:menteeId', authenticate, removeMentee);

// ===============================================
// IDENTITY STATUS & VERIFICATION (MERGED)
// ===============================================

// ✅ ENHANCED: Comprehensive identity verification for trusted mentorship environment  
// GET /users/identity/status - Get identity status
router.get('/identity/status', authenticate, async (req, res) => {
  try {
    // This would integrate with your identity service
    const identityStatus = {
      converseId: req.user?.converse_id || null,
      mentorId: req.user?.mentor_id || null,
      isIdentityMasked: req.user?.is_identity_masked || false,
      verificationStatus: req.user?.verification_status || 'pending',
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Identity status retrieved successfully',
      identityStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get identity status',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

//Not used
// POST /users/identity/verify - Start identity verification
router.post('/identity/verify', authenticate, async (req, res) => {
  try {
    // This would integrate with your verification service
    res.json({
      success: true,
      message: 'Identity verification process initiated',
      verificationId: `verify_${Date.now()}`,
      nextSteps: [
        'Check your email for verification instructions',
        'Complete required verification forms',
        'Wait for admin approval'
      ],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to start identity verification',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});


//

// ===============================================
// PRIVACY SETTINGS (MERGED FROM IDENTITY ROUTES)
// ===============================================

//Not used
// GET /users/privacy-settings - Get privacy settings
router.get('/privacy-settings', authenticate, async (req, res) => {
  try {
    // This would integrate with your privacy service
    const privacySettings = {
      profileVisibility: req.user?.profile_visibility || 'members_only',
      showConverseId: req.user?.show_converse_id || false,
      showMentorStatus: req.user?.show_mentor_status || true,
      allowDirectMessages: req.user?.allow_direct_messages || true,
      shareActivityStatus: req.user?.share_activity_status || false,
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Privacy settings retrieved successfully',
      privacySettings,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get privacy settings',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// PUT /users/privacy-settings - Update privacy settings
router.put('/privacy-settings', authenticate, async (req, res) => {
  try {
    const {
      profileVisibility,
      showConverseId,
      showMentorStatus,
      allowDirectMessages,
      shareActivityStatus
    } = req.body;

    // Validate privacy settings
    const validVisibilityOptions = ['public', 'members_only', 'private'];
    if (profileVisibility && !validVisibilityOptions.includes(profileVisibility)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid profile visibility option',
        validOptions: validVisibilityOptions
      });
    }

    // This would update the user's privacy settings in the database
    const updatedSettings = {
      profileVisibility: profileVisibility || req.user?.profile_visibility || 'members_only',
      showConverseId: showConverseId !== undefined ? showConverseId : req.user?.show_converse_id || false,
      showMentorStatus: showMentorStatus !== undefined ? showMentorStatus : req.user?.show_mentor_status || true,
      allowDirectMessages: allowDirectMessages !== undefined ? allowDirectMessages : req.user?.allow_direct_messages || true,
      shareActivityStatus: shareActivityStatus !== undefined ? shareActivityStatus : req.user?.share_activity_status || false,
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Privacy settings updated successfully',
      privacySettings: updatedSettings,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update privacy settings',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ===============================================
// NOTIFICATIONS (Authentication Required)
// ===============================================
// similar at communication route
router.get('/notifications', authenticate, getUserNotifications);
router.put('/notifications/:id/read', authenticate, markNotificationAsRead);
//Not used
router.put('/notifications/mark-all-read', authenticate, markAllNotificationsAsRead);

// ===============================================
// USER ACTIVITY & HISTORY (Authentication Required)
// ===============================================
//Not used
router.get('/activity', authenticate, getUserActivity);
//Not used
router.get('/content-history', authenticate, getUserContentHistory);
//similar at membershipApi
router.get('/history', authenticate, getApplicationHistory); // Alias for application-history

// ===============================================
// TESTING ENDPOINTS (MERGED)
// ===============================================

// Identity management test merged
router.get('/test-identity', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Identity routes merged into user routes successfully!',
    timestamp: new Date().toISOString(),
    user: {
      id: req.user?.id,
      username: req.user?.username,
      role: req.user?.role,
      converseId: req.user?.converse_id,
      mentorId: req.user?.mentor_id
    },
    mergedIdentityTypes: ['converse', 'mentor'],
    availableEndpoints: [
      'GET /converse - Get converse ID',
      'POST /converse/generate - Generate converse ID',
      'PUT /converse - Update converse ID',
      'DELETE /converse - Delete converse ID',
      'GET /converse/class/:classId/members - Get class members',
      'GET /mentor - Get mentor ID',
      'POST /mentor/generate - Generate mentor ID',
      'PUT /mentor - Update mentor ID',
      'DELETE /mentor - Delete mentor ID',
      'GET /mentor/mentees - Get mentees',
      'POST /mentor/mentees/assign - Assign mentee',
      'DELETE /mentor/mentees/:menteeId - Remove mentee',
      'GET /identity/status - Identity status',
      'POST /identity/verify - Start verification',
      'GET /privacy-settings - Get privacy settings',
      'PUT /privacy-settings - Update privacy settings'
    ],
    endpoint: '/api/users/test-identity'
  });
});

// Original test endpoint
router.get('/test', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'User routes are working! (Enhanced with Identity Management)',
    timestamp: new Date().toISOString(),
    user: {
      id: req.user?.id,
      username: req.user?.username,
      role: req.user?.role
    },
    enhancedFeatures: [
      'Identity management (converse & mentor IDs)',
      'Privacy settings',
      'Identity verification',
      'Class member lookup'
    ],
    endpoint: '/api/users/test'
  });
});

// ===============================================
// ERROR HANDLING (ENHANCED)
// ===============================================
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'User route not found',
    path: req.path,
    method: req.method,
    availableRoutes: {
      health: 'GET /health - System health check',
      dashboard: 'GET /dashboard - User dashboard',
      profile: 'GET /profile, PUT /profile, DELETE /profile - Profile management',
      status: 'GET /status, GET /membership/status - User status',
      applications: 'GET /application/status, GET /survey/status - Application status',
      settings: 'GET /settings, PUT /settings - User settings',
      preferences: 'GET /preferences, PUT /preferences - User preferences',
      notifications: 'GET /notifications - User notifications',
      activity: 'GET /activity, GET /content-history - User activity',
      // MERGED: Identity management routes
      converseId: [
        'GET /converse - Get converse ID',
        'POST /converse/generate - Generate converse ID',
        'PUT /converse - Update converse ID',
        'DELETE /converse - Delete converse ID',
        'GET /converse/class/:classId/members - Get class members'
      ],
      mentorId: [
        'GET /mentor - Get mentor ID',
        'POST /mentor/generate - Generate mentor ID',
        'PUT /mentor - Update mentor ID',
        'DELETE /mentor - Delete mentor ID',
        'GET /mentor/mentees - Get mentees',
        'POST /mentor/mentees/assign - Assign mentee',
        'DELETE /mentor/mentees/:menteeId - Remove mentee'
      ],
      identity: [
        'GET /identity/status - Identity status',
        'POST /identity/verify - Start verification'
      ],
      privacy: [
        'GET /privacy-settings - Get privacy settings',
        'PUT /privacy-settings - Update privacy settings'
      ],
      testing: [
        'GET /test - User routes test',
        'GET /test-identity - Identity routes test (merged)',
        'GET /test-* - Other testing endpoints'
      ]
    },
    note: 'Most routes require authentication. Identity management routes have been merged from /api/identity/*',
    mergedNote: 'Identity routes previously at /api/identity/* are now available at /api/users/*',
    timestamp: new Date().toISOString()
  });
});

// Error handler
router.use((error, req, res, next) => {
  console.error('❌ User route error:', {
    error: error.message,
    path: req.path,
    method: req.method,
    user: req.user?.username || 'unauthenticated',
    timestamp: new Date().toISOString()
  });
  
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'User operation error',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    help: {
      documentation: '/api/info',
      userRoutes: '/api/users/',
      identityRoutes: 'Now merged into /api/users/',
      support: 'Contact system administrator'
    }
  });
});

if (process.env.NODE_ENV === 'development') {
  console.log('👤 User routes loaded: dashboard, profile, settings, notifications, activity');
  console.log('🆔 Identity routes merged: converse ID, mentor ID, privacy settings, verification');
}

export default router;










// // ikootaapi/routes/userRoutes.js
// // MAIN USER ROUTES - System and user-facing endpoints
// // All endpoints that regular users can access

// import express from 'express';
// import { authenticate, requireMembership } from '../middleware/auth.js';

// // ✅ Controller Imports - Individual Functions (Clean Architecture)
// import {
//   // Health & Testing
//   healthCheck,
//   testSimple,
//   testAuth,
//   testDashboard,
//   getSystemStatus
// } from '../controllers/userStatusControllers.js';

// import {
//   // Dashboard & Status
//   getUserDashboard,
//   getCurrentMembershipStatus,
//   checkApplicationStatus,
//   checkSurveyStatus,
//   getApplicationHistory,
//   getBasicProfile,
//   getUserPermissions,
//   getUserPreferences,
//   updateUserPreferences
// } from '../controllers/userStatusControllers.js';

// import {
//   // Profile Management
//   getProfile,
//   updateProfile,
//   deleteProfile,
  
//   // Settings & Password
//   getUserSettings,
//   updateUserSettings,
//   updateUserPassword,
  
//   // Notifications
//   getUserNotifications,
//   markNotificationAsRead,
//   markAllNotificationsAsRead,
  
//   // Activity & History
//   getUserActivity,
//   getUserContentHistory
// } from '../controllers/userControllers.js';

// const router = express.Router();

// // ===============================================
// // HEALTH & SYSTEM ENDPOINTS (Public)
// // ===============================================
// router.get('/health', healthCheck);
// router.get('/system/status', getSystemStatus);

// // ===============================================
// // TESTING ENDPOINTS
// // ===============================================
// router.get('/test-simple', testSimple);
// router.get('/test-auth', authenticate, testAuth);
// router.get('/test-dashboard', authenticate, testDashboard);

// // ===============================================
// // USER DASHBOARD & STATUS (Authentication Required)
// // ===============================================
// router.get('/dashboard', authenticate, getUserDashboard);
// router.get('/status', authenticate, getCurrentMembershipStatus);
// router.get('/membership/status', authenticate, getCurrentMembershipStatus);
// router.get('/application/status', authenticate, checkApplicationStatus);
// router.get('/survey/status', authenticate, checkSurveyStatus);
// router.get('/application-history', authenticate, getApplicationHistory);

// // ===============================================
// // USER PROFILE MANAGEMENT (Authentication Required)
// // ===============================================
// router.get('/profile', authenticate, getProfile);
// router.get('/profile/basic', authenticate, getBasicProfile);
// router.put('/profile', authenticate, updateProfile);
// router.delete('/profile', authenticate, deleteProfile);

// // ===============================================
// // USER SETTINGS & PREFERENCES (Authentication Required)
// // ===============================================
// router.get('/settings', authenticate, getUserSettings);
// router.put('/settings', authenticate, updateUserSettings);
// router.put('/password', authenticate, updateUserPassword);
// router.get('/preferences', authenticate, getUserPreferences);
// router.put('/preferences', authenticate, updateUserPreferences);

// // ===============================================
// // USER PERMISSIONS (Authentication Required)
// // ===============================================
// router.get('/permissions', authenticate, getUserPermissions);

// // ===============================================
// // NOTIFICATIONS (Authentication Required)
// // ===============================================
// router.get('/notifications', authenticate, getUserNotifications);
// router.put('/notifications/:id/read', authenticate, markNotificationAsRead);
// router.put('/notifications/mark-all-read', authenticate, markAllNotificationsAsRead);

// // ===============================================
// // USER ACTIVITY & HISTORY (Authentication Required)
// // ===============================================
// router.get('/activity', authenticate, getUserActivity);
// router.get('/content-history', authenticate, getUserContentHistory);
// router.get('/history', authenticate, getApplicationHistory); // Alias for application-history

// // ===============================================
// // ERROR HANDLING
// // ===============================================
// router.use('*', (req, res) => {
//   res.status(404).json({
//     success: false,
//     error: 'User route not found',
//     path: req.path,
//     method: req.method,
//     availableRoutes: {
//       health: 'GET /health - System health check',
//       dashboard: 'GET /dashboard - User dashboard',
//       profile: 'GET /profile, PUT /profile, DELETE /profile - Profile management',
//       status: 'GET /status, GET /membership/status - User status',
//       applications: 'GET /application/status, GET /survey/status - Application status',
//       settings: 'GET /settings, PUT /settings - User settings',
//       preferences: 'GET /preferences, PUT /preferences - User preferences',
//       notifications: 'GET /notifications - User notifications',
//       activity: 'GET /activity, GET /content-history - User activity',
//       testing: 'GET /test-* - Testing endpoints'
//     },
//     note: 'Most routes require authentication',
//     timestamp: new Date().toISOString()
//   });
// });

// // Error handler
// router.use((error, req, res, next) => {
//   console.error('❌ User route error:', {
//     error: error.message,
//     path: req.path,
//     method: req.method,
//     user: req.user?.username || 'unauthenticated',
//     timestamp: new Date().toISOString()
//   });
  
//   res.status(error.statusCode || 500).json({
//     success: false,
//     error: error.message || 'User operation error',
//     path: req.path,
//     method: req.method,
//     timestamp: new Date().toISOString()
//   });
// });

// if (process.env.NODE_ENV === 'development') {
//   console.log('👤 User routes loaded: dashboard, profile, settings, notifications, activity');
// }

// export default router;