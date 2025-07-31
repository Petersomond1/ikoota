
// File: ikootaapi/routes/userRoutes.js
// 2. USER ROUTES - CONSOLIDATED USER MANAGEMENT

import express from 'express';
import {
  // Existing user controller functions
  getUserProfile,
  updateUserProfile,
  updateUserRole,
  fetchAllUsers,
  fetchUserStats,
  fetchUserActivity,
  fetchUserById,
  removeUser,
  
  // Admin management functions
  getAllUsers,
  getAllMentors,
  updateUser,
  getMembershipOverview,
  getClasses
} from '../controllers/userControllers.js';

// Import from userStatusController for status-related functions
import {
  checkSurveyStatus,
  getCurrentMembershipStatus,
  getBasicProfile,
  getLegacyMembershipStatus,
  getUserStatus,
  debugApplicationStatus,
  getSystemStatus
} from '../controllers/userStatusController.js';

// Import from preMemberApplicationController for dashboard functions
import {
  getUserDashboard,
  getApplicationHistory,
  getUserPermissions,
  checkApplicationStatus
} from '../controllers/preMemberApplicationController.js';

import { 
  authenticate,  
  requireAdmin  
} from '../middlewares/auth.middleware.js';

const userRouter = express.Router();

// ===============================================
// USER PROFILE MANAGEMENT ROUTES
// ===============================================

// GET /users/profile - Get current user's profile
userRouter.get('/profile', authenticate, getUserProfile);

// PUT /users/profile - Update current user's profile
userRouter.put('/profile', authenticate, updateUserProfile);

// GET /users/profile/basic - Get basic profile info
userRouter.get('/profile/basic', authenticate, getBasicProfile);

// DELETE /users/profile - Delete user profile (self-deletion)
userRouter.delete('/profile', authenticate, removeUser);

// ===============================================
// USER STATUS & DASHBOARD ROUTES
// ===============================================

// GET /users/dashboard - Primary user dashboard
userRouter.get('/dashboard', authenticate, getUserDashboard);

// GET /users/status - Current membership status
userRouter.get('/status', authenticate, getCurrentMembershipStatus);

// GET /users/permissions - User permissions
userRouter.get('/permissions', authenticate, getUserPermissions);

// GET /users/application/status - Application status check
userRouter.get('/application/status', authenticate, checkApplicationStatus);

// GET /users/survey/check-status - Enhanced survey status check
userRouter.get('/survey/check-status', authenticate, checkSurveyStatus);

// ===============================================
// USER HISTORY & ACTIVITY ROUTES
// ===============================================

// GET /users/history - Application history
userRouter.get('/history', authenticate, getApplicationHistory);

// GET /users/application-history - Application history (alias)
userRouter.get('/application-history', authenticate, getApplicationHistory);

// GET /users/activity - User activity
userRouter.get('/activity', authenticate, fetchUserActivity);

// GET /users/:user_id/activity - Get specific user activity
userRouter.get('/:user_id/activity', authenticate, fetchUserActivity);

// ===============================================
// USER SETTINGS ROUTES
// ===============================================

// PUT /users/settings - Update user settings
userRouter.put('/settings', authenticate, updateUserProfile);

// GET /users/settings - Get user settings
userRouter.get('/settings', authenticate, getUserProfile);

// PUT /users/password - Update user password
userRouter.put('/password', authenticate, updateUserProfile);

// ===============================================
// USER LOOKUP & MANAGEMENT ROUTES
// ===============================================

// GET /users/stats - Get user statistics (admin only)
userRouter.get('/stats', authenticate, requireAdmin, fetchUserStats);

// GET /users - Get all users with filtering (admin only)
userRouter.get('/', authenticate, requireAdmin, fetchAllUsers);

// GET /users/:user_id - Get user by ID
userRouter.get('/:user_id', authenticate, fetchUserById);

// PUT /users/role - Update user role and properties (admin only)
userRouter.put('/role', authenticate, requireAdmin, updateUserRole);

// PUT /users/:user_id - Update specific user (admin only)
userRouter.put('/:user_id', authenticate, requireAdmin, updateUserRole);

// DELETE /users/:user_id - Soft delete user (super admin only)
userRouter.delete('/:user_id', authenticate, requireAdmin, removeUser);

// ===============================================
// ADMIN USER MANAGEMENT ROUTES (Legacy Support)
// ===============================================

// Admin Users Management Routes
userRouter.get('/admin/users', 
  authenticate, 
  requireAdmin, 
  getAllUsers
);

userRouter.get('/admin/mentors', 
  authenticate, 
  requireAdmin, 
  getAllMentors
);

userRouter.put('/admin/update-user/:id', 
  authenticate, 
  requireAdmin, 
  updateUser
);

userRouter.get('/admin/membership-overview', 
  authenticate, 
  requireAdmin, 
  getMembershipOverview
);

userRouter.get('/classes', 
  authenticate, 
  getClasses
);

// ===============================================
// COMPATIBILITY ALIASES
// ===============================================

// Legacy compatibility endpoints
userRouter.get('/membership/status', authenticate, getLegacyMembershipStatus);
userRouter.get('/user/status', authenticate, getUserStatus);

// ===============================================
// DEVELOPMENT & DEBUG ROUTES
// ===============================================

if (process.env.NODE_ENV === 'development') {
  userRouter.get('/debug/application-status/:userId', authenticate, debugApplicationStatus);
}

// ===============================================
// ERROR HANDLING
// ===============================================

// Enhanced 404 handler for user routes
userRouter.use('*', (req, res) => {
  console.warn(`❌ 404 - User route not found: ${req.method} ${req.path}`);
  
  res.status(404).json({
    success: false,
    error: 'User route not found',
    path: req.path,
    method: req.method,
    availableEndpoints: {
      profile: [
        'GET /profile - Get current user profile',
        'PUT /profile - Update user profile',
        'GET /profile/basic - Get basic profile info',
        'DELETE /profile - Delete user profile'
      ],
      status: [
        'GET /dashboard - User dashboard',
        'GET /status - Current membership status',
        'GET /permissions - User permissions',
        'GET /application/status - Application status',
        'GET /survey/check-status - Survey status'
      ],
      history: [
        'GET /history - Application history',
        'GET /activity - User activity'
      ],
      settings: [
        'PUT /settings - Update settings',
        'GET /settings - Get settings',
        'PUT /password - Update password'
      ],
      admin: [
        'GET / - Get all users (admin)',
        'GET /stats - User statistics (admin)',
        'PUT /:user_id - Update user (admin)'
      ]
    },
    timestamp: new Date().toISOString()
  });
});

// Enhanced global error handler for user routes
userRouter.use((error, req, res, next) => {
  const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  
  console.error('❌ User route error:', {
    errorId,
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    user: req.user?.id || 'not authenticated',
    timestamp: new Date().toISOString()
  });
  
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Internal server error',
    errorId,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

if (process.env.NODE_ENV === 'development') {
  console.log('👤 User routes loaded with profile, status, history, and admin management');
}

export default userRouter;

