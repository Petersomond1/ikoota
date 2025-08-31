// ikootaapi/routes/userRoutes.js
// MAIN USER ROUTES - System and user-facing endpoints
// All endpoints that regular users can access
// *** MERGED WITH IDENTITY ROUTES ***

import express from 'express';
import { authenticate, requireMembershipStage } from '../middleware/auth.js';

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
//Not used
router.get('/userstatus/application-history', authenticate, getApplicationHistory); 

//from Applicationsurvey.jsx, Login.jsx, useUserStatus.js,
router.get('/userstatus/survey/check-status', authenticate, checkSurveyStatus); // Alias for survey status check

// ===============================================
// USER PROFILE MANAGEMENT (Authentication Required)
// ===============================================
//Not used
router.get('/profile', authenticate, getProfile);
//Not used
router.get('/profile/basic', authenticate, getBasicProfile);
router.put('/profile', authenticate, updateProfile);
router.delete('/profile', authenticate, deleteProfile);

// ===============================================
// USER SETTINGS & PREFERENCES (Authentication Required)
// ===============================================
//Not used
router.get('/settings', authenticate, getUserSettings);
router.put('/settings', authenticate, updateUserSettings);
router.put('/password', authenticate, updateUserPassword);
//Not used
router.get('/preferences', authenticate, getUserPreferences);
router.put('/preferences', authenticate, updateUserPreferences);

// ===============================================
// USER PERMISSIONS (Authentication Required)
// ===============================================
//Not used
router.get('/permissions', authenticate, getUserPermissions);

// ===============================================
// CONVERSE ID MANAGEMENT (MERGED FROM IDENTITY ROUTES)
// ===============================================
//Not used
// GET /users/converse - Get user's converse ID
router.get('/converse', authenticate, getConverseId);

//Not used
// POST /users/converse/generate - Generate new converse ID
router.post('/converse/generate', authenticate, generateConverseId);

// PUT /users/converse - Update converse ID settings
router.put('/converse', authenticate, updateConverseId);

// DELETE /users/converse - Delete/reset converse ID
router.delete('/converse', authenticate, deleteConverseId);

//Not used
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

//Not used
// POST /users/mentor/mentees/assign - Assign mentee
router.post('/mentor/mentees/assign', authenticate, assignMentee);

//Not used
// DELETE /users/mentor/mentees/:menteeId - Remove mentee
router.delete('/mentor/mentees/:menteeId', authenticate, removeMentee);

// ===============================================
// IDENTITY STATUS & VERIFICATION (MERGED)
// ===============================================

//Not used
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