// ikootaapi/routes/userRoutes.js
// USER PROFILE & SETTINGS ROUTES
// Basic user operations: profile management, settings, preferences

import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';

// Import user controllers
import {
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
  updateUserSettings,
  updateUserPassword,
  getUserPermissions,
  getUserNotifications,
  markNotificationAsRead,
  getUserActivityHistory,
  getUserContentHistory,
  testUserRoutes
} from '../controllers/userControllers.js';

const router = express.Router();

// ===============================================
// PROFILE MANAGEMENT
// ===============================================

// GET /users/profile - Get current user's profile
router.get('/profile', authenticate, getUserProfile);

// PUT /users/profile - Update current user's profile
router.put('/profile', authenticate, updateUserProfile);

// DELETE /users/profile - Delete user profile (self-deletion)
router.delete('/profile', authenticate, deleteUserProfile);

// ===============================================
// USER SETTINGS
// ===============================================

// GET /users/settings - Get user settings
router.get('/settings', authenticate, (req, res, next) => {
  req.settingsOnly = true;
  getUserProfile(req, res, next);
});

// PUT /users/settings - Update user settings
router.put('/settings', authenticate, updateUserSettings);

// PUT /users/password - Update user password
router.put('/password', authenticate, updateUserPassword);

// ===============================================
// USER PERMISSIONS & ACCESS
// ===============================================

// GET /users/permissions - Get user permissions
router.get('/permissions', authenticate, getUserPermissions);

// ===============================================
// NOTIFICATIONS MANAGEMENT
// ===============================================

// GET /users/notifications - Get user notifications
router.get('/notifications', authenticate, getUserNotifications);

// PUT /users/notifications/:id/read - Mark notification as read
router.put('/notifications/:id/read', authenticate, markNotificationAsRead);

// PUT /users/notifications/mark-all-read - Mark all notifications as read
router.put('/notifications/mark-all-read', authenticate, (req, res, next) => {
  req.markAllAsRead = true;
  markNotificationAsRead(req, res, next);
});

// ===============================================
// USER PREFERENCES
// ===============================================

// GET /users/preferences - Get user preferences
router.get('/preferences', authenticate, (req, res, next) => {
  req.preferencesOnly = true;
  getUserProfile(req, res, next);
});

// PUT /users/preferences - Update user preferences
router.put('/preferences', authenticate, (req, res, next) => {
  req.preferencesOnly = true;
  updateUserSettings(req, res, next);
});

// ===============================================
// USER ACTIVITY & HISTORY
// ===============================================

// GET /users/activity - Get user activity history
router.get('/activity', authenticate, async (req, res) => {
  res.json({
    success: true,
    message: 'User activity endpoint - implement with user activity service',
    timestamp: new Date().toISOString()
  });
});

// GET /users/content-history - Get user's content creation history
router.get('/content-history', authenticate, async (req, res) => {
  res.json({
    success: true,
    message: 'User content history endpoint - implement with content service',
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// TESTING ENDPOINTS
// ===============================================

// User profile test
router.get('/test', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'User routes are working!',
    user: {
      id: req.user?.id,
      username: req.user?.username,
      role: req.user?.role
    },
    timestamp: new Date().toISOString(),
    endpoint: '/api/users/test'
  });
});

// ===============================================
// ERROR HANDLING
// ===============================================

// 404 handler
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'User route not found',
    path: req.path,
    method: req.method,
    availableRoutes: {
      profile: [
        'GET /profile - Get user profile',
        'PUT /profile - Update user profile',
        'DELETE /profile - Delete user profile'
      ],
      settings: [
        'GET /settings - Get user settings',
        'PUT /settings - Update user settings',
        'PUT /password - Update password'
      ],
      permissions: [
        'GET /permissions - Get user permissions'
      ],
      notifications: [
        'GET /notifications - Get notifications',
        'PUT /notifications/:id/read - Mark notification as read',
        'PUT /notifications/mark-all-read - Mark all as read'
      ],
      preferences: [
        'GET /preferences - Get user preferences',
        'PUT /preferences - Update user preferences'
      ],
      activity: [
        'GET /activity - Get user activity',
        'GET /content-history - Get content history'
      ],
      testing: [
        'GET /test - User routes test'
      ]
    },
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
  console.log('👤 User routes loaded: profile, settings, notifications, preferences');
}

export default router;
