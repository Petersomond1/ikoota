// ikootaapi/controllers/userControllers.js
// USER PROFILE & SETTINGS CONTROLLERS
// Handles profile management, settings, notifications, and user activity

import {
  // Profile services
  getUserProfileService,
  updateUserProfileService,
  deleteUserService,
  
  // Settings services
  getUserSettingsService,
  updateUserSettingsService,
  updatePasswordService,
  
  // Notification services
  getUserNotificationsService,
  markNotificationReadService,
  
  // Activity services
  getUserActivityService,
  getUserContentHistoryService
} from '../services/userServices.js';

// ===============================================
// PROFILE CONTROLLERS
// ===============================================

/**
 * Get user profile
 * GET /api/users/profile
 */
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    console.log('👤 Getting profile for user:', userId);
    
    const profile = await getUserProfileService(userId);
    
    res.status(200).json({
      success: true,
      data: profile,
      message: 'Profile retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ getProfile error:', error);
    
    let statusCode = 500;
    if (error.message.includes('not found')) statusCode = 404;
    
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to get profile',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update user profile
 * PUT /api/users/profile
 */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }
    
    // Validation
    if (updateData.email && !updateData.email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    console.log('🔧 Updating profile for user:', userId);
    
    const updatedProfile = await updateUserProfileService(userId, updateData);
    
    res.status(200).json({
      success: true,
      data: updatedProfile,
      message: 'Profile updated successfully'
    });
    
  } catch (error) {
    console.error('❌ updateProfile error:', error);
    
    let statusCode = 500;
    if (error.message.includes('not found')) statusCode = 404;
    if (error.message.includes('Invalid')) statusCode = 400;
    
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to update profile',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Delete user profile
 * DELETE /api/users/profile
 */
export const deleteProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }
    
    // Prevent admin self-deletion
    if (['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Admin accounts cannot be self-deleted'
      });
    }

    console.log('🗑️ Deleting profile for user:', userId);
    
    const result = await deleteUserService(userId);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Profile deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ deleteProfile error:', error);
    
    let statusCode = 500;
    if (error.message.includes('not found')) statusCode = 404;
    
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to delete profile',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// SETTINGS & PREFERENCES CONTROLLERS
// ===============================================

/**
 * Get user settings
 * GET /api/users/settings
 */
export const getUserSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    console.log('⚙️ Getting settings for user:', userId);
    
    const settings = await getUserSettingsService(userId);
    
    res.status(200).json({
      success: true,
      data: settings,
      message: 'Settings retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ getUserSettings error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get settings',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update user settings
 * PUT /api/users/settings
 */
export const updateUserSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const settingsData = req.body;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    console.log('🔧 Updating settings for user:', userId);
    
    const updatedSettings = await updateUserSettingsService(userId, settingsData);
    
    res.status(200).json({
      success: true,
      data: updatedSettings,
      message: 'Settings updated successfully'
    });
    
  } catch (error) {
    console.error('❌ updateUserSettings error:', error);
    
    let statusCode = 500;
    if (error.message.includes('No valid')) statusCode = 400;
    
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to update settings',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update user password
 * PUT /api/users/password
 */
export const updateUserPassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }
    
    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long'
      });
    }

    console.log('🔐 Updating password for user:', userId);
    
    await updatePasswordService(userId, currentPassword, newPassword);
    
    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
    
  } catch (error) {
    console.error('❌ updateUserPassword error:', error);
    
    let statusCode = 500;
    if (error.message.includes('Current password')) statusCode = 400;
    if (error.message.includes('not found')) statusCode = 404;
    
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to update password',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// NOTIFICATIONS CONTROLLERS
// ===============================================

/**
 * Get user notifications
 * GET /api/users/notifications
 */
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type, unread_only } = req.query;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    console.log('🔔 Getting notifications for user:', userId);
    
    const notifications = await getUserNotificationsService(userId, { 
      page: parseInt(page), 
      limit: parseInt(limit), 
      type,
      unread_only: unread_only === 'true'
    });
    
    res.status(200).json({
      success: true,
      data: notifications,
      message: 'Notifications retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ getUserNotifications error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get notifications',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Mark notification as read
 * PUT /api/users/notifications/:id/read
 */
export const markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    console.log('📖 Marking notification as read:', { userId, notificationId: id });
    
    const result = await markNotificationReadService(userId, id);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Notification marked as read'
    });
    
  } catch (error) {
    console.error('❌ markNotificationAsRead error:', error);
    
    let statusCode = 500;
    if (error.message.includes('not found')) statusCode = 404;
    
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to mark notification as read',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Mark all notifications as read
 * PUT /api/users/notifications/mark-all-read
 */
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    console.log('📖 Marking all notifications as read for user:', userId);
    
    const result = await markNotificationReadService(userId, null, { markAll: true });
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'All notifications marked as read'
    });
    
  } catch (error) {
    console.error('❌ markAllNotificationsAsRead error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to mark all notifications as read',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// ACTIVITY & HISTORY CONTROLLERS
// ===============================================

/**
 * Get user activity
 * GET /api/users/activity
 */
export const getUserActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type } = req.query;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    console.log('📊 Getting activity for user:', userId);
    
    const activity = await getUserActivityService(userId, { 
      page: parseInt(page), 
      limit: parseInt(limit), 
      type 
    });
    
    res.status(200).json({
      success: true,
      data: activity,
      message: 'User activity retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ getUserActivity error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get user activity',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get user content history
 * GET /api/users/content-history
 */
export const getUserContentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    console.log('📚 Getting content history for user:', userId);
    
    const contentHistory = await getUserContentHistoryService(userId, { 
      page: parseInt(page), 
      limit: parseInt(limit) 
    });
    
    res.status(200).json({
      success: true,
      data: contentHistory,
      message: 'Content history retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ getUserContentHistory error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get content history',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// EXPORT ALL FUNCTIONS
// ===============================================

export default {
  // Profile management
  getProfile,
  updateProfile,
  deleteProfile,
  
  // Settings & password
  getUserSettings,
  updateUserSettings,
  updateUserPassword,
  
  // Notifications
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  
  // Activity & history
  getUserActivity,
  getUserContentHistory
};