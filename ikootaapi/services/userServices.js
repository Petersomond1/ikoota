// ikootaapi/services/userServices.js
// USER SERVICES - Business Logic Layer
// Handles all user-related business operations and database interactions

import db from '../config/db.js';
import CustomError from '../utils/CustomError.js';
import { hashPassword } from '../utils/passwordUtils.js';

// ===============================================
// USER PROFILE SERVICES
// ===============================================

/**
 * Get user profile by ID
 * @param {number} userId - User ID
 * @returns {Object} User profile data
 */
export const getUserProfileService = async (userId) => {
  try {
    console.log('🔍 Getting user profile for ID:', userId);
    
    const [users] = await db.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.phone,
        u.role,
        u.membership_stage,
        u.is_member,
        u.full_membership_status,
        u.converse_id,
        u.mentor_id,
        u.primary_class_id,
        u.total_classes,
        u.is_identity_masked,
        u.createdAt,
        u.updatedAt,
        u.last_login,
        u.isblocked,
        u.isbanned,
        u.ban_reason,
        u.decline_reason,
        mentor.username as mentor_name,
        mentor.email as mentor_email,
        class.class_name as primary_class_name
      FROM users u
      LEFT JOIN users mentor ON u.mentor_id = mentor.id
      LEFT JOIN classes class ON u.primary_class_id = class.id
      WHERE u.id = ?
    `, [userId]);
    
    if (users.length === 0) {
      throw new CustomError('User not found', 404);
    }
    
    const user = users[0];
    
    // Format response
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
      is_identity_masked: !!user.is_identity_masked,
      member_since: user.createdAt,
      last_updated: user.updatedAt,
      last_login: user.last_login,
      mentor: {
        id: user.mentor_id,
        name: user.mentor_name,
        email: user.mentor_email
      },
      class: {
        id: user.primary_class_id,
        name: user.primary_class_name
      },
      status: {
        is_blocked: !!user.isblocked,
        is_banned: !!user.isbanned,
        ban_reason: user.ban_reason,
        decline_reason: user.decline_reason
      },
      permissions: {
        can_edit_profile: true,
        can_delete_account: !['admin', 'super_admin'].includes(user.role),
        can_access_admin: ['admin', 'super_admin'].includes(user.role)
      }
    };
    
  } catch (error) {
    console.error('❌ Error in getUserProfileService:', error);
    throw error;
  }
};

/**
 * Update user profile
 * @param {number} userId - User ID
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated user profile
 */
export const updateUserProfileService = async (userId, updateData) => {
  try {
    console.log('🔧 Updating user profile:', userId, 'with:', updateData);
    
    // Validate user exists
    const currentUser = await getUserProfileService(userId);
    
    // Filter allowed fields for regular users
    const allowedFields = [
      'username', 'email', 'phone', 'preferred_language', 'timezone',
      'email_notifications', 'sms_notifications', 'marketing_emails'
    ];
    
    const sanitizedData = Object.fromEntries(
      Object.entries(updateData).filter(([key]) => allowedFields.includes(key))
    );
    
    if (Object.keys(sanitizedData).length === 0) {
      throw new CustomError('No valid fields to update', 400);
    }
    
    // Build dynamic update query
    const updateFields = Object.keys(sanitizedData).map(field => `${field} = ?`).join(', ');
    const updateValues = Object.values(sanitizedData);
    
    const query = `
      UPDATE users 
      SET ${updateFields}, updatedAt = NOW()
      WHERE id = ?
    `;
    
    await db.query(query, [...updateValues, userId]);
    
    // Return updated profile
    return await getUserProfileService(userId);
    
  } catch (error) {
    console.error('❌ Error in updateUserProfileService:', error);
    throw error;
  }
};

/**
 * Delete user account
 * @param {number} userId - User ID
 * @returns {Object} Deletion result
 */
export const deleteUser = async (userId) => {
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
      
      // Delete main user record
      const [result] = await db.query('DELETE FROM users WHERE id = ?', [userId]);
      
      if (result.affectedRows === 0) {
        throw new CustomError('User not found', 404);
      }
      
      await db.query('COMMIT');
      
      return {
        username: user.username,
        deleted: true,
        deletedAt: new Date().toISOString()
      };
      
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error in deleteUser:', error);
    throw error;
  }
};

// ===============================================
// USER ACTIVITY SERVICES
// ===============================================

/**
 * Get user activity statistics
 * @param {number} userId - User ID
 * @returns {Object} Activity data
 */
export const getUserActivity = async (userId) => {
  try {
    console.log('📊 Getting activity for user:', userId);
    
    // Get content statistics (adjust table names as needed)
    const [stats] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM chats WHERE user_id = ? AND chats.id IS NOT NULL) as total_chats,
        (SELECT COUNT(*) FROM teachings WHERE user_id = ? AND teachings.id IS NOT NULL) as total_teachings,
        (SELECT COUNT(*) FROM comments WHERE user_id = ? AND comments.id IS NOT NULL) as total_comments,
        (SELECT COUNT(*) FROM surveylog WHERE user_id = ?) as total_applications
    `, [userId, userId, userId, userId]);
    
    // Get recent activity (adjust based on your actual activity tracking)
    const [recentActivity] = await db.query(`
      SELECT 
        'login' as activity_type,
        last_login as activity_date,
        'User logged in' as description
      FROM users 
      WHERE id = ? AND last_login IS NOT NULL
      
      UNION ALL
      
      SELECT 
        'application' as activity_type,
        createdAt as activity_date,
        CONCAT('Application submitted: ', approval_status) as description
      FROM surveylog 
      WHERE user_id = ?
      
      ORDER BY activity_date DESC
      LIMIT 10
    `, [userId, userId]);
    
    return {
      statistics: {
        total_chats: stats[0]?.total_chats || 0,
        total_teachings: stats[0]?.total_teachings || 0,
        total_comments: stats[0]?.total_comments || 0,
        total_applications: stats[0]?.total_applications || 0
      },
      recent_activity: recentActivity || []
    };
    
  } catch (error) {
    console.error('❌ Error in getUserActivity:', error);
    // Return empty data instead of throwing to prevent breaking the app
    return {
      statistics: {
        total_chats: 0,
        total_teachings: 0,
        total_comments: 0,
        total_applications: 0
      },
      recent_activity: []
    };
  }
};

// ===============================================
// ADMIN USER SERVICES
// ===============================================

/**
 * Get all users for admin (with filters)
 * @param {Object} filters - Filter options
 * @returns {Object} Users list with pagination
 */
export const getAllUsers = async (filters = {}) => {
  try {
    console.log('🔍 Getting all users with filters:', filters);
    
    let whereClause = 'WHERE 1=1';
    const queryParams = [];
    
    // Build dynamic WHERE clause
    if (filters.role) {
      whereClause += ' AND role = ?';
      queryParams.push(filters.role);
    }
    
    if (filters.membership_stage) {
      whereClause += ' AND membership_stage = ?';
      queryParams.push(filters.membership_stage);
    }
    
    if (filters.is_member) {
      whereClause += ' AND is_member = ?';
      queryParams.push(filters.is_member);
    }
    
    if (filters.isblocked !== undefined) {
      whereClause += ' AND isblocked = ?';
      queryParams.push(filters.isblocked);
    }
    
    if (filters.isbanned !== undefined) {
      whereClause += ' AND isbanned = ?';
      queryParams.push(filters.isbanned);
    }
    
    if (filters.search) {
      whereClause += ' AND (username LIKE ? OR email LIKE ?)';
      queryParams.push(`%${filters.search}%`, `%${filters.search}%`);
    }
    
    // Get total count
    const [countResult] = await db.query(`
      SELECT COUNT(*) as total FROM users ${whereClause}
    `, queryParams);
    
    const total = countResult[0].total;
    
    // Get users with pagination
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    
    const [users] = await db.query(`
      SELECT 
        id, username, email, phone, role, membership_stage, 
        is_member, converse_id, createdAt, updatedAt, 
        isblocked, isbanned, last_login
      FROM users 
      ${whereClause}
      ORDER BY createdAt DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, limit, offset]);
    
    return {
      users,
      total,
      limit,
      offset
    };
    
  } catch (error) {
    console.error('❌ Error in getAllUsers:', error);
    throw error;
  }
};

/**
 * Update user by admin
 * @param {number} userId - User ID
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated user profile
 */
export const updateUserByAdmin = async (userId, updateData) => {
  try {
    console.log('🔧 Admin updating user:', userId, 'with:', updateData);
    
    // Validate user exists
    const currentUser = await getUserProfileService(userId);
    
    // Admin can update more fields
    const allowedFields = [
      'username', 'email', 'phone', 'role', 'membership_stage', 
      'is_member', 'full_membership_status', 'converse_id', 
      'mentor_id', 'primary_class_id', 'isblocked', 'isbanned',
      'ban_reason', 'unban_reason', 'is_identity_masked'
    ];
    
    const sanitizedData = Object.fromEntries(
      Object.entries(updateData).filter(([key]) => allowedFields.includes(key))
    );
    
    if (Object.keys(sanitizedData).length === 0) {
      throw new CustomError('No valid fields to update', 400);
    }
    
    // Build dynamic update query
    const updateFields = Object.keys(sanitizedData).map(field => `${field} = ?`).join(', ');
    const updateValues = Object.values(sanitizedData);
    
    const query = `
      UPDATE users 
      SET ${updateFields}, updatedAt = NOW()
      WHERE id = ?
    `;
    
    await db.query(query, [...updateValues, userId]);
    
    // Return updated profile
    return await getUserProfileService(userId);
    
  } catch (error) {
    console.error('❌ Error in updateUserByAdmin:', error);
    throw error;
  }
};

/**
 * Get all users for admin export
 * @returns {Array} All users data
 */
export const getAllUsersForAdmin = async () => {
  try {
    console.log('📊 Getting all users for admin export');
    
    const [users] = await db.query(`
      SELECT 
        id, username, email, phone, role, membership_stage, 
        is_member, full_membership_status, converse_id, 
        createdAt, updatedAt, isblocked, isbanned, last_login
      FROM users 
      ORDER BY createdAt DESC
    `);
    
    return users;
    
  } catch (error) {
    console.error('❌ Error in getAllUsersForAdmin:', error);
    throw error;
  }
};

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
        createdAt, updatedAt, last_login
      FROM users 
      WHERE role = 'mentor' OR role = 'admin' OR role = 'super_admin'
      ORDER BY role, username
    `);
    
    return mentors;
    
  } catch (error) {
    console.error('❌ Error in getAllMentorsForAdmin:', error);
    throw error;
  }
};

/**
 * Get user statistics for admin dashboard
 * @returns {Object} User statistics
 */
export const getUserStats = async () => {
  try {
    console.log('📊 Getting user statistics');
    
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as total_admins,
        COUNT(CASE WHEN role = 'super_admin' THEN 1 END) as total_super_admins,
        COUNT(CASE WHEN role = 'mentor' THEN 1 END) as total_mentors,
        COUNT(CASE WHEN membership_stage = 'pre_member' THEN 1 END) as pre_members,
        COUNT(CASE WHEN membership_stage = 'member' THEN 1 END) as full_members,
        COUNT(CASE WHEN membership_stage = 'applicant' THEN 1 END) as applicants,
        COUNT(CASE WHEN isblocked = 1 THEN 1 END) as blocked_users,
        COUNT(CASE WHEN isbanned = 1 THEN 1 END) as banned_users,
        COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_users_30_days,
        COUNT(CASE WHEN last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as active_users_7_days
      FROM users
    `);
    
    return {
      user_counts: {
        total: stats[0].total_users,
        admins: stats[0].total_admins,
        super_admins: stats[0].total_super_admins,
        mentors: stats[0].total_mentors,
        pre_members: stats[0].pre_members,
        full_members: stats[0].full_members,
        applicants: stats[0].applicants
      },
      user_status: {
        blocked: stats[0].blocked_users,
        banned: stats[0].banned_users
      },
      activity_metrics: {
        new_users_30_days: stats[0].new_users_30_days,
        active_users_7_days: stats[0].active_users_7_days
      },
      generated_at: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error in getUserStats:', error);
    throw error;
  }
};

/**
 * Get membership overview statistics
 * @returns {Object} Membership statistics
 */
export const getMembershipOverviewStats = async () => {
  try {
    console.log('📊 Getting membership overview stats');
    
    const [membershipStats] = await db.query(`
      SELECT 
        COUNT(CASE WHEN sl.approval_status = 'pending' THEN 1 END) as pending_initial_applications,
        COUNT(CASE WHEN sl.approval_status = 'approved' THEN 1 END) as approved_initial_applications,
        COUNT(CASE WHEN sl.approval_status = 'declined' THEN 1 END) as declined_initial_applications,
        COUNT(CASE WHEN fma.status = 'pending' THEN 1 END) as pending_full_applications,
        COUNT(CASE WHEN fma.status = 'approved' THEN 1 END) as approved_full_applications,
        COUNT(CASE WHEN fma.status = 'declined' THEN 1 END) as declined_full_applications
      FROM users u
      LEFT JOIN surveylog sl ON u.id = sl.user_id 
        AND sl.application_type = 'initial_application'
      LEFT JOIN full_membership_applications fma ON u.id = fma.user_id
    `);
    
    return {
      initial_applications: {
        pending: membershipStats[0].pending_initial_applications,
        approved: membershipStats[0].approved_initial_applications,
        declined: membershipStats[0].declined_initial_applications
      },
      full_membership_applications: {
        pending: membershipStats[0].pending_full_applications,
        approved: membershipStats[0].approved_full_applications,
        declined: membershipStats[0].declined_full_applications
      },
      generated_at: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error in getMembershipOverviewStats:', error);
    throw error;
  }
};

/**
 * Get all classes for admin
 * @returns {Array} Classes data
 */
export const getAllClasses = async () => {
  try {
    console.log('🏫 Getting all classes');
    
    const [classes] = await db.query(`
      SELECT 
        id, class_id, class_name, class_type, 
        created_by, createdAt, updatedAt
      FROM classes 
      ORDER BY class_name
    `);
    
    return classes;
    
  } catch (error) {
    console.error('❌ Error in getAllClasses:', error);
    // Return empty array instead of throwing to prevent breaking the app
    return [];
  }
};

// ===============================================
// HELPER FUNCTIONS
// ===============================================

/**
 * Get user by ID (simple version)
 * @param {number} userId - User ID
 * @returns {Object} Basic user data
 */
export const getUserById = async (userId) => {
  try {
    const [users] = await db.query(`
      SELECT id, username, email, role, membership_stage, is_member, converse_id
      FROM users 
      WHERE id = ?
    `, [userId]);
    
    if (users.length === 0) {
      throw new CustomError('User not found', 404);
    }
    
    return users[0];
    
  } catch (error) {
    console.error('❌ Error in getUserById:', error);
    throw error;
  }
};

// ===============================================
// EXPORT ALL SERVICES
// ===============================================

export default {
  // Profile services
  getUserProfileService,
  updateUserProfileService,
  deleteUser,
  getUserActivity,
  
  // Admin services
  getAllUsers,
  updateUserByAdmin,
  getAllUsersForAdmin,
  getAllMentorsForAdmin,
  getUserStats,
  getMembershipOverviewStats,
  getAllClasses,
  
  // Helper functions
  getUserById
};