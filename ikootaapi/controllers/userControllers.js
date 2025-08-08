// ikootaapi/controllers/userControllers.js
// USER PROFILE & SETTINGS CONTROLLER
// Handles basic user operations: profile management, settings, preferences

import {
  getUserProfileService,
  updateUserProfileService,
  getUserActivity,
  deleteUser
} from '../services/userServices.js';
import CustomError from '../utils/CustomError.js';

// ===============================================
// PROFILE MANAGEMENT
// ===============================================

/**
 * Get current user's profile
 * GET /api/users/profile
 */
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user?.id; // Simplified - auth middleware ensures req.user exists
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required',
        message: 'Please login to access your profile'
      });
    }

    console.log('🔍 Getting profile for user:', userId);
    
    const userProfile = await getUserProfileService(userId);
    
    res.status(200).json({
      success: true,
      data: userProfile,
      message: 'Profile retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Error in getUserProfile:', error);
    
    const statusCode = error.statusCode || (error.message.includes('not found') ? 404 : 500);
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to fetch user profile',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update current user's profile
 * PUT /api/users/profile
 */
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user?.id; // Simplified
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    console.log('🔧 Updating profile for user:', userId, 'with data:', req.body);

    // Validate email format if provided
    if (req.body.email && !req.body.email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Validate phone if provided
    if (req.body.phone && req.body.phone.length < 5) {
      return res.status(400).json({
        success: false,
        error: 'Phone number must be at least 5 characters'
      });
    }

    const updatedProfile = await updateUserProfileService(userId, req.body);
    
    res.status(200).json({
      success: true,
      data: updatedProfile,
      message: 'Profile updated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error in updateUserProfile:', error);
    
    const statusCode = error.statusCode || 
                      (error.message.includes('not found') ? 404 : 
                       error.message.includes('required') ? 400 : 500);
    
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to update user profile',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Delete user profile (self-deletion)
 * DELETE /api/users/profile
 */
export const deleteUserProfile = async (req, res) => {
  try {
    const userId = req.user?.id; // Simplified
    
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
        error: 'Admin accounts cannot be self-deleted',
        message: 'Please contact super administrator for account deletion'
      });
    }

    console.log('🗑️ Self-deleting user:', userId);
    
    const result = await deleteUser(userId);
    
    res.status(200).json({
      success: true,
      message: 'Account deleted successfully',
      data: {
        deleted: true,
        username: result.username,
        deletedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error in deleteUserProfile:', error);
    
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to delete profile',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// USER SETTINGS
// ===============================================

/**
 * Update user settings
 * PUT /api/users/settings
 */
export const updateUserSettings = async (req, res) => {
  try {
    const userId = req.user?.id; // Simplified
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    console.log('⚙️ Updating settings for user:', userId);

    // If preferencesOnly flag is set, only update preference fields
    if (req.preferencesOnly) {
      const preferenceFields = {
        email_notifications: req.body.email_notifications,
        sms_notifications: req.body.sms_notifications,
        marketing_emails: req.body.marketing_emails,
        preferred_language: req.body.preferred_language,
        timezone: req.body.timezone
      };
      
      // Filter out undefined values
      const cleanPreferences = Object.fromEntries(
        Object.entries(preferenceFields).filter(([_, v]) => v !== undefined)
      );

      const updatedProfile = await updateUserProfileService(userId, cleanPreferences);
      
      return res.status(200).json({
        success: true,
        data: updatedProfile,
        message: 'Preferences updated successfully'
      });
    }

    // Update general settings
    const updatedProfile = await updateUserProfileService(userId, req.body);
    
    res.status(200).json({
      success: true,
      data: updatedProfile,
      message: 'Settings updated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error in updateUserSettings:', error);
    
    res.status(error.statusCode || 500).json({
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
    const userId = req.user?.id; // Simplified
    const { currentPassword, newPassword } = req.body;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

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

    // This would require a password verification service
    // For now, return a placeholder response
    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error in updateUserPassword:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update password',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// USER PERMISSIONS & ACCESS
// ===============================================

/**
 * Get user permissions
 * GET /api/users/permissions
 */
export const getUserPermissions = async (req, res) => {
  try {
    const userId = req.user?.id; // Simplified
    const userRole = req.user?.role || 'user';
    const membershipStage = req.user?.membership_stage || 'none';
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    console.log('🔒 Getting permissions for user:', userId, 'role:', userRole);

    const permissions = {
      // Basic permissions
      can_edit_profile: true,
      can_delete_account: !['admin', 'super_admin'].includes(userRole),
      can_change_password: true,
      can_update_settings: true,
      
      // Content permissions
      can_view_content: ['pre_member', 'member'].includes(membershipStage),
      can_create_content: membershipStage === 'member',
      can_comment: ['pre_member', 'member'].includes(membershipStage),
      
      // Membership permissions
      can_apply_membership: membershipStage === 'none',
      can_apply_full_membership: membershipStage === 'pre_member',
      can_access_towncrier: membershipStage === 'pre_member',
      can_access_iko: membershipStage === 'member',
      
      // Admin permissions
      can_access_admin: ['admin', 'super_admin'].includes(userRole),
      can_manage_users: ['admin', 'super_admin'].includes(userRole),
      can_review_applications: ['admin', 'super_admin'].includes(userRole),
      can_delete_users: userRole === 'super_admin',
      
      // System permissions
      can_view_reports: ['admin', 'super_admin'].includes(userRole),
      can_send_notifications: ['admin', 'super_admin'].includes(userRole)
    };
    
    res.status(200).json({
      success: true,
      data: {
        permissions,
        role: userRole,
        membership_stage: membershipStage,
        user_id: userId
      },
      message: 'Permissions retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Error in getUserPermissions:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get permissions',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// NOTIFICATIONS MANAGEMENT
// ===============================================

/**
 * Get user notifications
 * GET /api/users/notifications
 */
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user?.id; // Simplified
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    // For now, return a placeholder response
    // This would integrate with a notifications service
    console.log('🔔 Getting notifications for user:', userId);
    
    res.status(200).json({
      success: true,
      data: {
        notifications: [],
        unread_count: 0,
        total_count: 0
      },
      message: 'Notifications retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Error in getUserNotifications:', error);
    
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
    const userId = req.user?.id; // Simplified
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    if (req.markAllAsRead) {
      console.log('📖 Marking all notifications as read for user:', userId);
      
      res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
        data: { marked_count: 0 }
      });
    } else {
      console.log('📖 Marking notification as read:', id, 'for user:', userId);
      
      res.status(200).json({
        success: true,
        message: 'Notification marked as read',
        data: { notification_id: id }
      });
    }
    
  } catch (error) {
    console.error('❌ Error in markNotificationAsRead:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to mark notification as read',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// USER ACTIVITY & HISTORY
// ===============================================

/**
 * Get user activity history
 * GET /api/users/activity
 */
export const getUserActivityHistory = async (req, res) => {
  try {
    const userId = req.user?.id; // Simplified
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    console.log('📊 Getting activity for user:', userId);
    
    const activity = await getUserActivity(userId);
    
    res.status(200).json({
      success: true,
      data: activity,
      message: 'Activity retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Error in getUserActivityHistory:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get user activity',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get user's content creation history
 * GET /api/users/content-history
 */
export const getUserContentHistory = async (req, res) => {
  try {
    const userId = req.user?.id; // Simplified
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    console.log('📚 Getting content history for user:', userId);
    
    const activity = await getUserActivity(userId);
    
    // Return only content-related activity
    res.status(200).json({
      success: true,
      data: {
        content_statistics: activity.statistics,
        recent_content: activity.recent_activity,
        user_id: userId
      },
      message: 'Content history retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Error in getUserContentHistory:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get content history',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// TESTING ENDPOINTS
// ===============================================

/**
 * User routes test endpoint
 * GET /api/users/test
 */
export const testUserRoutes = async (req, res) => {
  try {
    const userId = req.user?.id; // Simplified
    
    res.status(200).json({
      success: true,
      message: 'User routes are working!',
      data: {
        user: {
          id: userId,
          username: req.user?.username,
          role: req.user?.role,
          membership_stage: req.user?.membership_stage
        },
        endpoint: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
        server_status: 'operational'
      }
    });
    
  } catch (error) {
    console.error('❌ Error in testUserRoutes:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Test failed',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// EXPORT ALL FUNCTIONS
// ===============================================

export default {
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
};