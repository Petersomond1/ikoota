// ikootaapi/routes/userRoutes.js
// MAIN USER ROUTES - System and user-facing endpoints
// All endpoints that regular users can access

import express from 'express';
import { authenticate, requireMembership } from '../middleware/auth.js';

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
router.get('/membership/status', authenticate, getCurrentMembershipStatus);
router.get('/application/status', authenticate, checkApplicationStatus);
router.get('/survey/status', authenticate, checkSurveyStatus);
router.get('/application-history', authenticate, getApplicationHistory);

// ===============================================
// USER PROFILE MANAGEMENT (Authentication Required)
// ===============================================
router.get('/profile', authenticate, getProfile);
router.get('/profile/basic', authenticate, getBasicProfile);
router.put('/profile', authenticate, updateProfile);
router.delete('/profile', authenticate, deleteProfile);

// ===============================================
// USER SETTINGS & PREFERENCES (Authentication Required)
// ===============================================
router.get('/settings', authenticate, getUserSettings);
router.put('/settings', authenticate, updateUserSettings);
router.put('/password', authenticate, updateUserPassword);
router.get('/preferences', authenticate, getUserPreferences);
router.put('/preferences', authenticate, updateUserPreferences);

// ===============================================
// USER PERMISSIONS (Authentication Required)
// ===============================================
router.get('/permissions', authenticate, getUserPermissions);

// ===============================================
// NOTIFICATIONS (Authentication Required)
// ===============================================
router.get('/notifications', authenticate, getUserNotifications);
router.put('/notifications/:id/read', authenticate, markNotificationAsRead);
router.put('/notifications/mark-all-read', authenticate, markAllNotificationsAsRead);

// ===============================================
// USER ACTIVITY & HISTORY (Authentication Required)
// ===============================================
router.get('/activity', authenticate, getUserActivity);
router.get('/content-history', authenticate, getUserContentHistory);
router.get('/history', authenticate, getApplicationHistory); // Alias for application-history

// ===============================================
// ERROR HANDLING
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
      testing: 'GET /test-* - Testing endpoints'
    },
    note: 'Most routes require authentication',
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
    timestamp: new Date().toISOString()
  });
});

if (process.env.NODE_ENV === 'development') {
  console.log('👤 User routes loaded: dashboard, profile, settings, notifications, activity');
}

export default router;