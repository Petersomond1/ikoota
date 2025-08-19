// ikootaapi/services/userServices.js
// USER PROFILE & SETTINGS SERVICES
// Business logic for profile management, settings, notifications, and activity

import db from '../config/db.js';
import bcrypt from 'bcrypt';
import  CustomError  from '../utils/CustomError.js';
import { hashPassword } from '../utils/passwordUtils.js';

// ===============================================
// PROFILE SERVICES
// ===============================================

/**
 * Get user profile service
 * @param {number} userId - User ID
 * @param {Object} options - Options for profile retrieval
 * @returns {Object} User profile data
 */
export const getUserProfileService = async (userId, options = {}) => {
  try {
    console.log('🔍 Getting user profile for ID:', userId);
    
    // ✅ Safe SQL with string interpolation for LIMIT
    const limitClause = options.basic ? 'LIMIT 1' : '';
    
    const [users] = await db.query(`
      SELECT 
        u.id, u.username, u.email, u.phone, u.role,
        u.membership_stage, u.is_member, u.full_membership_status,
        u.converse_id, u.mentor_id, u.primary_class_id,
        u.total_classes, u.is_identity_masked,
        u.createdAt, u.updatedAt, u.lastLogin,
        u.isblocked, u.isbanned, u.ban_reason,
        m.username as mentor_name, m.email as mentor_email,
        c.class_name as primary_class_name
      FROM users u
      LEFT JOIN users m ON u.mentor_id = m.id
      LEFT JOIN classes c ON u.primary_class_id = c.id
      WHERE u.id = ?
      ${limitClause}
    `, [userId]);
    
    // ✅ Safe result access
    if (!users || (Array.isArray(users) && users.length === 0)) {
      throw new CustomError('User not found', 404);
    }
    
    const user = Array.isArray(users) ? users[0] : users;
    
    if (options.basic) {
      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role,
          membership_stage: user.membership_stage,
          is_member: user.is_member,
          full_membership_status: user.full_membership_status,
          converse_id: user.converse_id,
          mentor_id: user.mentor_id,
          mentor_name: user.mentor_name,
          mentor_email: user.mentor_email,
          primary_class_id: user.primary_class_id,
          primary_class_name: user.primary_class_name,
          total_classes: user.total_classes,
          is_identity_masked: user.is_identity_masked,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          lastLogin: user.lastLogin,
          isblocked: user.isblocked,
          isbanned: user.isbanned
        }
      };
    }
    
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      membership_stage: user.membership_stage,
      is_member: user.is_member,
      full_membership_status: user.full_membership_status,
      converse_id: user.converse_id,
      mentor: {
        id: user.mentor_id,
        name: user.mentor_name,
        email: user.mentor_email
      },
      class: {
        id: user.primary_class_id,
        name: user.primary_class_name
      },
      statistics: {
        total_classes: user.total_classes || 0
      },
      timestamps: {
        created_at: user.createdAt,
        updated_at: user.updatedAt,
        last_login: user.lastLogin
      },
      status: {
        is_blocked: !!user.isblocked,
        is_banned: !!user.isbanned,
        ban_reason: user.ban_reason,
        is_identity_masked: !!user.is_identity_masked
      }
    };
    
  } catch (error) {
    console.error('❌ Error in getUserProfileService:', error);
    throw error;
  }
};

/**
 * Update user profile service
 * @param {number} userId - User ID
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated user profile
 */
export const updateUserProfileService = async (userId, updateData) => {
  try {
    console.log('🔧 Updating user profile:', userId);
    
    // Validate user exists
    await getUserProfileService(userId);
    
    // Filter allowed fields
    const allowedFields = ['username', 'email', 'phone'];
    const filteredData = Object.fromEntries(
      Object.entries(updateData).filter(([key]) => allowedFields.includes(key))
    );
    
    if (Object.keys(filteredData).length === 0) {
      throw new CustomError('No valid fields to update', 400);
    }
    
    // Build update query
    const updateFields = Object.keys(filteredData).map(field => `${field} = ?`).join(', ');
    const updateValues = Object.values(filteredData);
    
    await db.query(`
      UPDATE users 
      SET ${updateFields}, updatedAt = NOW()
      WHERE id = ?
    `, [...updateValues, userId]);
    
    // Return updated profile
    return await getUserProfileService(userId);
    
  } catch (error) {
    console.error('❌ Error in updateUserProfileService:', error);
    throw error;
  }
};

/**
 * Delete user service
 * @param {number} userId - User ID
 * @returns {Object} Deletion result
 */
export const deleteUserService = async (userId) => {
  try {
    console.log('🗑️ Deleting user:', userId);
    
    // Get user details before deletion
    const user = await getUserProfileService(userId);
    
    // Begin transaction
    await db.query('START TRANSACTION');
    
    try {
      // Delete related records first (adjust based on your schema)
      await db.query('DELETE FROM surveylog WHERE user_id = ?', [userId]);
      await db.query('DELETE FROM full_membership_applications WHERE user_id = ?', [userId]);
      await db.query('DELETE FROM user_preferences WHERE user_id = ?', [userId]);
      await db.query('DELETE FROM user_settings WHERE user_id = ?', [userId]);
      await db.query('DELETE FROM notifications WHERE user_id = ?', [userId]);
      await db.query('DELETE FROM user_activities WHERE user_id = ?', [userId]);
      
      // Delete user
      const [result] = await db.query('DELETE FROM users WHERE id = ?', [userId]);
      
      // ✅ Safe result access
      if (!result || (result.affectedRows && result.affectedRows === 0)) {
        throw new CustomError('User not found or deletion failed', 404);
      }
      
      await db.query('COMMIT');
      
      return {
        username: user.username,
        deleted: true,
        deleted_at: new Date().toISOString()
      };
      
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error in deleteUserService:', error);
    throw error;
  }
};

// ===============================================
// SETTINGS SERVICES
// ===============================================

/**
 * Get user settings service
 * @param {number} userId - User ID
 * @returns {Object} User settings
 */
export const getUserSettingsService = async (userId) => {
  try {
    console.log('⚙️ Getting settings for user:', userId);
    
    const [settings] = await db.query(`
      SELECT 
        email_notifications,
        sms_notifications,
        newsletter_subscription,
        privacy_level,
        preferred_communication_method,
        timezone,
        language_preference,
        two_factor_enabled,
        profile_visibility
      FROM user_settings 
      WHERE user_id = ?
    `, [userId]);
    
    // Default settings if none exist
    const defaultSettings = {
      email_notifications: true,
      sms_notifications: false,
      newsletter_subscription: true,
      privacy_level: 'standard',
      preferred_communication_method: 'email',
      timezone: 'UTC',
      language_preference: 'en',
      two_factor_enabled: false,
      profile_visibility: 'members_only'
    };
    
    const userSettings = (Array.isArray(settings) && settings.length > 0) ? settings[0] : defaultSettings;
    
    return {
      user_id: userId,
      settings: userSettings
    };
    
  } catch (error) {
    console.error('❌ Error in getUserSettingsService:', error);
    // Return default settings instead of throwing
    return {
      user_id: userId,
      settings: {
        email_notifications: true,
        sms_notifications: false,
        newsletter_subscription: true,
        privacy_level: 'standard',
        preferred_communication_method: 'email',
        timezone: 'UTC',
        language_preference: 'en',
        two_factor_enabled: false,
        profile_visibility: 'members_only'
      }
    };
  }
};

/**
 * Update user settings service
 * @param {number} userId - User ID
 * @param {Object} settingsData - Settings data to update
 * @returns {Object} Updated settings
 */
export const updateUserSettingsService = async (userId, settingsData) => {
  try {
    console.log('🔧 Updating settings for user:', userId);
    
    const allowedSettings = [
      'email_notifications', 'sms_notifications', 'newsletter_subscription',
      'privacy_level', 'preferred_communication_method', 'timezone',
      'language_preference', 'two_factor_enabled', 'profile_visibility'
    ];
    
    const filteredSettings = Object.fromEntries(
      Object.entries(settingsData).filter(([key]) => allowedSettings.includes(key))
    );
    
    if (Object.keys(filteredSettings).length === 0) {
      throw new CustomError('No valid settings to update', 400);
    }
    
    // Build upsert query
    const fields = Object.keys(filteredSettings);
    const values = Object.values(filteredSettings);
    const placeholders = fields.map(() => '?').join(', ');
    const updateClause = fields.map(field => `${field} = VALUES(${field})`).join(', ');
    
    await db.query(`
      INSERT INTO user_settings (user_id, ${fields.join(', ')}, createdAt, updatedAt)
      VALUES (?, ${placeholders}, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        ${updateClause},
        updatedAt = NOW()
    `, [userId, ...values]);
    
    return await getUserSettingsService(userId);
    
  } catch (error) {
    console.error('❌ Error in updateUserSettingsService:', error);
    throw error;
  }
};

/**
 * Update user password service
 * @param {number} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Object} Update result
 */
export const updatePasswordService = async (userId, currentPassword, newPassword) => {
  try {
    console.log('🔐 Updating password for user:', userId);
    
    // Get current password hash
    const [users] = await db.query(`
      SELECT password_hash FROM users WHERE id = ?
    `, [userId]);
    
    if (!users || (Array.isArray(users) && users.length === 0)) {
      throw new CustomError('User not found', 404);
    }
    
    const user = Array.isArray(users) ? users[0] : users;
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      throw new CustomError('Current password is incorrect', 400);
    }
    
    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
    
    // Update password
    await db.query(`
      UPDATE users 
      SET password_hash = ?, password_updated_at = NOW(), updatedAt = NOW()
      WHERE id = ?
    `, [newPasswordHash, userId]);
    
    return {
      success: true,
      message: 'Password updated successfully',
      updated_at: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error in updatePasswordService:', error);
    throw error;
  }
};

// ===============================================
// NOTIFICATIONS SERVICES
// ===============================================

/**
 * Get user notifications service
 * @param {number} userId - User ID
 * @param {Object} options - Query options
 * @returns {Object} User notifications
 */
export const getUserNotificationsService = async (userId, options = {}) => {
  try {
    console.log('🔔 Getting notifications for user:', userId);
    
    const { page = 1, limit = 20, type, unread_only = false } = options;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let whereClause = 'WHERE user_id = ?';
    const queryParams = [userId];
    
    if (type) {
      whereClause += ' AND notification_type = ?';
      queryParams.push(type);
    }
    
    if (unread_only) {
      whereClause += ' AND is_read = false';
    }
    
    // Get total count
    const [countResult] = await db.query(`
      SELECT COUNT(*) as total FROM notifications ${whereClause}
    `, queryParams);
    
    const total = (countResult && Array.isArray(countResult) && countResult[0]) ? countResult[0].total : 0;
    
    // Get notifications with pagination
    const [notifications] = await db.query(`
      SELECT 
        id, notification_type, title, message, data,
        is_read, created_at, updated_at, expires_at
      FROM notifications 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${offset}
    `, queryParams);
    
    // ✅ Safe array access
    const safeNotifications = Array.isArray(notifications) ? notifications : [];
    
    // Get unread count
    const [unreadResult] = await db.query(`
      SELECT COUNT(*) as unread_count FROM notifications 
      WHERE user_id = ? AND is_read = false
    `, [userId]);
    
    const unreadCount = (unreadResult && Array.isArray(unreadResult) && unreadResult[0]) ? unreadResult[0].unread_count : 0;
    
    return {
      notifications: safeNotifications.map(notif => ({
        id: notif.id,
        type: notif.notification_type,
        title: notif.title,
        message: notif.message,
        data: notif.data ? JSON.parse(notif.data) : null,
        is_read: !!notif.is_read,
        created_at: notif.created_at,
        updated_at: notif.updated_at,
        expires_at: notif.expires_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / parseInt(limit))
      },
      summary: {
        total_notifications: total,
        unread_count: unreadCount
      }
    };
    
  } catch (error) {
    console.error('❌ Error in getUserNotificationsService:', error);
    // Return empty notifications instead of throwing
    return {
      notifications: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      summary: { total_notifications: 0, unread_count: 0 }
    };
  }
};

/**
 * Mark notification as read service
 * @param {number} userId - User ID
 * @param {number} notificationId - Notification ID (null for mark all)
 * @param {Object} options - Additional options
 * @returns {Object} Update result
 */
export const markNotificationReadService = async (userId, notificationId, options = {}) => {
  try {
    console.log('📖 Marking notification as read:', { userId, notificationId, options });
    
    if (options.markAll) {
      // Mark all notifications as read for user
      const [result] = await db.query(`
        UPDATE notifications 
        SET is_read = true, updated_at = NOW()
        WHERE user_id = ? AND is_read = false
      `, [userId]);
      
      const affectedRows = (result && result.affectedRows) ? result.affectedRows : 0;
      
      return {
        success: true,
        message: 'All notifications marked as read',
        marked_count: affectedRows
      };
    } else {
      // Mark specific notification as read
      const [result] = await db.query(`
        UPDATE notifications 
        SET is_read = true, updated_at = NOW()
        WHERE id = ? AND user_id = ?
      `, [notificationId, userId]);
      
      if (!result || result.affectedRows === 0) {
        throw new CustomError('Notification not found or already read', 404);
      }
      
      return {
        success: true,
        message: 'Notification marked as read',
        notification_id: notificationId
      };
    }
    
  } catch (error) {
    console.error('❌ Error in markNotificationReadService:', error);
    throw error;
  }
};

// ===============================================
// ACTIVITY SERVICES
// ===============================================

/**
 * Get user activity service
 * @param {number} userId - User ID
 * @param {Object} options - Query options
 * @returns {Object} User activity data
 */
export const getUserActivityService = async (userId, options = {}) => {
  try {
    console.log('📊 Getting activity for user:', userId);
    
    const { page = 1, limit = 20, type } = options;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Get activity statistics
    const [stats] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM user_activities WHERE user_id = ? AND activity_type = 'login') as login_count,
        (SELECT COUNT(*) FROM user_activities WHERE user_id = ? AND activity_type = 'content_created') as content_created_count,
        (SELECT COUNT(*) FROM user_activities WHERE user_id = ? AND activity_type = 'comment_posted') as comment_count,
        (SELECT MAX(created_at) FROM user_activities WHERE user_id = ?) as last_activity
    `, [userId, userId, userId, userId]);
    
    const activityStats = (Array.isArray(stats) && stats[0]) ? stats[0] : {
      login_count: 0,
      content_created_count: 0,
      comment_count: 0,
      last_activity: null
    };
    
    // Get recent activity with optional type filter
    let whereClause = 'WHERE user_id = ?';
    const queryParams = [userId];
    
    if (type) {
      whereClause += ' AND activity_type = ?';
      queryParams.push(type);
    }
    
    const [activities] = await db.query(`
      SELECT 
        id, activity_type, activity_data, created_at, ip_address
      FROM user_activities 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${offset}
    `, queryParams);
    
    // ✅ Safe array access
    const safeActivities = Array.isArray(activities) ? activities : [];
    
    return {
      user_id: userId,
      statistics: {
        total_logins: activityStats.login_count || 0,
        total_content_created: activityStats.content_created_count || 0,
        total_comments: activityStats.comment_count || 0,
        last_activity: activityStats.last_activity
      },
      recent_activity: safeActivities.map(activity => ({
        id: activity.id,
        type: activity.activity_type,
        data: activity.activity_data ? JSON.parse(activity.activity_data) : null,
        timestamp: activity.created_at,
        ip_address: activity.ip_address
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: safeActivities.length
      }
    };
    
  } catch (error) {
    console.error('❌ Error in getUserActivityService:', error);
    // Return empty activity instead of throwing
    return {
      user_id: userId,
      statistics: {
        total_logins: 0,
        total_content_created: 0,
        total_comments: 0,
        last_activity: null
      },
      recent_activity: [],
      pagination: { page: 1, limit: 20, total: 0 }
    };
  }
};

/**
 * Get user content history service
 * @param {number} userId - User ID
 * @param {Object} options - Query options
 * @returns {Object} User content history
 */
export const getUserContentHistoryService = async (userId, options = {}) => {
  try {
    console.log('📚 Getting content history for user:', userId);
    
    const { page = 1, limit = 20 } = options;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Get content from various tables (handle missing tables gracefully)
    let contentHistory = [];
    
    try {
      // Try to get teachings
      const [teachings] = await db.query(`
        SELECT 
          id, title as content_title, 'teaching' as content_type,
          status, created_at, updated_at, is_published
        FROM teachings 
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ${parseInt(limit)} OFFSET ${offset}
      `, [userId]);
      
      const safeTeachings = Array.isArray(teachings) ? teachings : [];
      contentHistory = contentHistory.concat(safeTeachings);
      
    } catch (teachingsError) {
      console.warn('Teachings table may not exist:', teachingsError.message);
    }
    
    try {
      // Try to get chats
      const [chats] = await db.query(`
        SELECT 
          id, title as content_title, 'chat' as content_type,
          status, created_at, updated_at, is_public
        FROM chats 
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ${parseInt(limit)} OFFSET ${offset}
      `, [userId]);
      
      const safeChats = Array.isArray(chats) ? chats : [];
      contentHistory = contentHistory.concat(safeChats);
      
    } catch (chatsError) {
      console.warn('Chats table may not exist:', chatsError.message);
    }
    
    try {
      // Try to get comments
      const [comments] = await db.query(`
        SELECT 
          id, SUBSTRING(content, 1, 50) as content_title, 'comment' as content_type,
          status, created_at, updated_at, is_approved
        FROM comments 
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ${parseInt(limit)} OFFSET ${offset}
      `, [userId]);
      
      const safeComments = Array.isArray(comments) ? comments : [];
      contentHistory = contentHistory.concat(safeComments);
      
    } catch (commentsError) {
      console.warn('Comments table may not exist:', commentsError.message);
    }
    
    // Sort all content by creation date
    contentHistory.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Apply pagination to combined results
    const paginatedContent = contentHistory.slice(0, parseInt(limit));
    
    return {
      user_id: userId,
      content_history: paginatedContent.map(content => ({
        id: content.id,
        title: content.content_title,
        type: content.content_type,
        status: content.status,
        is_published: content.is_published || content.is_public || content.is_approved || false,
        created_at: content.created_at,
        updated_at: content.updated_at
      })),
      summary: {
        total_content: contentHistory.length,
        by_type: {
          teachings: contentHistory.filter(c => c.content_type === 'teaching').length,
          chats: contentHistory.filter(c => c.content_type === 'chat').length,
          comments: contentHistory.filter(c => c.content_type === 'comment').length
        }
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: contentHistory.length
      }
    };
    
  } catch (error) {
    console.error('❌ Error in getUserContentHistoryService:', error);
    // Return empty content history instead of throwing
    return {
      user_id: userId,
      content_history: [],
      summary: {
        total_content: 0,
        by_type: { teachings: 0, chats: 0, comments: 0 }
      },
      pagination: { page: 1, limit: 20, total: 0 }
    };
  }
};

// ===============================================
// ADMIN HELPER SERVICES
// ===============================================

/**
 * Get all mentors for admin
 * @returns {Array} Mentors data
 */
export const getAllMentorsForAdmin = async () => {
  try {
    console.log('👨‍🏫 Getting all mentors for admin');
    
    const [mentors] = await db.query(`
      SELECT 
        id, username, email, phone, converse_id, 
        createdAt, updatedAt, lastLogin
      FROM users 
      WHERE role = 'mentor' OR role = 'admin' OR role = 'super_admin'
      ORDER BY role, username
    `);
    
    return Array.isArray(mentors) ? mentors : [];
    
  } catch (error) {
    console.error('❌ Error in getAllMentorsForAdmin:', error);
    return [];
  }
};


// ===============================================
// EXPORT ALL SERVICES
// ===============================================

export default {
  // Profile services
  getUserProfileService,
  updateUserProfileService,
  deleteUserService,
  
  // Settings services
  getUserSettingsService,
  updateUserSettingsService,
  updatePasswordService,
  
  // Notifications services
  getUserNotificationsService,
  markNotificationReadService,
  
  // Activity services
  getUserActivityService,
  getUserContentHistoryService,
  
  // Admin helper services
  getAllMentorsForAdmin
};