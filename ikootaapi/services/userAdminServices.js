// ikootaapi/services/userAdminServices.js
// ADMIN USER MANAGEMENT SERVICES
// Business logic for administrative user operations

import db from '../config/db.js';
import CustomError from '../utils/CustomError.js';
import { hashPassword } from '../utils/passwordUtils.js';
import { generateUniqueConverseId, generateUniqueClassId } from '../utils/idGenerator.js';

// ===============================================
// ADMIN USER MANAGEMENT SERVICES
// ===============================================

/**
 * Get all users with advanced filtering (Admin)
 * @param {Object} filters - Filter options
 * @returns {Object} Users list with pagination
 */
export const getAllUsersService = async (filters = {}) => {
  try {
    console.log('🔍 Admin getting all users with filters:', filters);
    
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
      whereClause += ' AND (username LIKE ? OR email LIKE ? OR converse_id LIKE ?)';
      queryParams.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }
    
    // Get total count
    const [countResult] = await db.query(`
      SELECT COUNT(*) as total FROM users ${whereClause}
    `, queryParams);
    
    const total = countResult[0].total;
    
    // Get users with pagination and extended info
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    
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
        u.createdAt, 
        u.updatedAt, 
        u.last_login,
        u.isblocked, 
        u.isbanned,
        u.ban_reason,
        u.is_identity_masked,
        mentor.username as mentor_name,
        class.class_name as primary_class_name,
        (SELECT COUNT(*) FROM surveylog WHERE user_id = u.id) as total_applications,
        (SELECT COUNT(*) FROM full_membership_applications WHERE user_id = u.id) as full_membership_applications
      FROM users u
      LEFT JOIN users mentor ON u.mentor_id = mentor.id
      LEFT JOIN classes class ON u.primary_class_id = class.id
      ${whereClause}
      ORDER BY u.createdAt DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, limit, offset]);
    
    return {
      users: users.map(user => ({
        ...user,
        is_identity_masked: !!user.is_identity_masked,
        isblocked: !!user.isblocked,
        isbanned: !!user.isbanned
      })),
      total,
      limit,
      offset
    };
    
  } catch (error) {
    console.error('❌ Error in getAllUsersService:', error);
    throw error;
  }
};

/**
 * Create new user (Admin)
 * @param {Object} userData - User data
 * @param {Object} adminUser - Admin user creating the account
 * @returns {Object} Created user data
 */
export const createUserService = async (userData, adminUser) => {
  try {
    console.log('👤 Admin creating new user:', userData.username);
    
    const {
      username,
      email,
      phone,
      password,
      role = 'user',
      is_member = 'applied',
      membership_stage = 'none',
      mentor_id,
      primary_class_id
    } = userData;

    // Validate required fields
    if (!username || !email || !password) {
      throw new CustomError('Username, email, and password are required', 400);
    }

    // Validate email format
    if (!email.includes('@')) {
      throw new CustomError('Invalid email format', 400);
    }

    // Validate role
    const validRoles = ['user', 'mentor', 'admin', 'super_admin'];
    if (!validRoles.includes(role)) {
      throw new CustomError(`Invalid role. Valid roles: ${validRoles.join(', ')}`, 400);
    }

    // Only super admins can create other admins
    if (['admin', 'super_admin'].includes(role) && adminUser.role !== 'super_admin') {
      throw new CustomError('Only super administrators can create admin accounts', 403);
    }

    // Check if username or email already exists
    const [existingUsers] = await db.query(`
      SELECT id, username, email FROM users 
      WHERE username = ? OR email = ?
    `, [username, email]);
    
    if (existingUsers.length > 0) {
      const existing = existingUsers[0];
      if (existing.username === username) {
        throw new CustomError('Username already exists', 409);
      }
      if (existing.email === email) {
        throw new CustomError('Email already exists', 409);
      }
    }

    // Hash password
    const password_hash = await hashPassword(password);
    
    // Generate converse ID
    const converse_id = await generateUniqueConverseId();

    // Begin transaction
    await db.query('START TRANSACTION');
    
    try {
      // Insert new user
      const query = `
        INSERT INTO users (
          username, email, phone, password_hash, role, 
          is_member, membership_stage, converse_id,
          mentor_id, primary_class_id, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      const [result] = await db.query(query, [
        username, email, phone, password_hash, 
        role, is_member, membership_stage, converse_id,
        mentor_id, primary_class_id
      ]);

      const newUserId = result.insertId;
      
      // Log the creation in audit trail
      await db.query(`
        INSERT INTO audit_logs (user_id, action, details, createdAt)
        VALUES (?, 'user_created', ?, NOW())
      `, [adminUser.id, JSON.stringify({
        targetUserId: newUserId,
        targetUsername: username,
        targetRole: role,
        createdBy: adminUser.username
      })]);
      
      await db.query('COMMIT');
      
      // Get the created user with full details
      const [newUser] = await db.query(`
        SELECT 
          id, username, email, phone, role, membership_stage, 
          is_member, converse_id, mentor_id, primary_class_id,
          createdAt, updatedAt
        FROM users 
        WHERE id = ?
      `, [newUserId]);
      
      return newUser[0];
      
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error in createUserService:', error);
    throw error;
  }
};

/**
 * Update user by admin
 * @param {number} userId - User ID
 * @param {Object} updateData - Data to update
 * @param {Object} adminUser - Admin user making the update
 * @returns {Object} Updated user data
 */
export const updateUserByAdminService = async (userId, updateData, adminUser) => {
  try {
    console.log('🔧 Admin updating user:', userId, 'with:', updateData);
    
    // Get current user to validate exists
    const [currentUsers] = await db.query(`
      SELECT id, username, role, membership_stage FROM users WHERE id = ?
    `, [userId]);
    
    if (currentUsers.length === 0) {
      throw new CustomError('User not found', 404);
    }
    
    const currentUser = currentUsers[0];
    
    // Admin can update these fields
    const allowedFields = [
      'username', 'email', 'phone', 'role', 'membership_stage', 
      'is_member', 'full_membership_status', 'converse_id', 
      'mentor_id', 'primary_class_id', 'isblocked', 'isbanned',
      'ban_reason', 'unban_reason', 'is_identity_masked', 'total_classes'
    ];
    
    const sanitizedData = Object.fromEntries(
      Object.entries(updateData).filter(([key]) => allowedFields.includes(key))
    );
    
    if (Object.keys(sanitizedData).length === 0) {
      throw new CustomError('No valid fields to update', 400);
    }

    // Authorization checks for role updates
    if (sanitizedData.role && ['admin', 'super_admin'].includes(sanitizedData.role)) {
      if (adminUser.role !== 'super_admin') {
        throw new CustomError('Only super administrators can assign admin roles', 403);
      }
    }
    
    // Prevent admin from demoting themselves
    if (parseInt(userId) === adminUser.id && sanitizedData.role && sanitizedData.role !== currentUser.role) {
      if (!['admin', 'super_admin'].includes(sanitizedData.role)) {
        throw new CustomError('Cannot demote your own account', 403);
      }
    }

    // Build dynamic update query
    const updateFields = Object.keys(sanitizedData).map(field => `${field} = ?`).join(', ');
    const updateValues = Object.values(sanitizedData);
    
    // Begin transaction
    await db.query('START TRANSACTION');
    
    try {
      // Update user
      const query = `
        UPDATE users 
        SET ${updateFields}, updatedAt = NOW()
        WHERE id = ?
      `;
      
      await db.query(query, [...updateValues, userId]);
      
      // Log the update in audit trail
      await db.query(`
        INSERT INTO audit_logs (user_id, action, details, createdAt)
        VALUES (?, 'user_updated', ?, NOW())
      `, [adminUser.id, JSON.stringify({
        targetUserId: userId,
        targetUsername: currentUser.username,
        updatedFields: Object.keys(sanitizedData),
        updatedBy: adminUser.username,
        changes: sanitizedData
      })]);
      
      await db.query('COMMIT');
      
      // Return updated user with full details
      const [updatedUser] = await db.query(`
        SELECT 
          u.id, u.username, u.email, u.phone, u.role, 
          u.membership_stage, u.is_member, u.full_membership_status,
          u.converse_id, u.mentor_id, u.primary_class_id,
          u.isblocked, u.isbanned, u.ban_reason, u.is_identity_masked,
          u.createdAt, u.updatedAt, u.last_login,
          mentor.username as mentor_name,
          class.class_name as primary_class_name
        FROM users u
        LEFT JOIN users mentor ON u.mentor_id = mentor.id
        LEFT JOIN classes class ON u.primary_class_id = class.id
        WHERE u.id = ?
      `, [userId]);
      
      return updatedUser[0];
      
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error in updateUserByAdminService:', error);
    throw error;
  }
};

/**
 * Delete user (Admin)
 * @param {number} userId - User ID to delete
 * @param {Object} adminUser - Admin user performing deletion
 * @param {string} reason - Reason for deletion
 * @returns {Object} Deletion result
 */
export const deleteUserService = async (userId, adminUser, reason = 'Admin deletion') => {
  try {
    console.log('🗑️ Admin deleting user:', userId, 'reason:', reason);
    
    // Only super admins can delete users
    if (adminUser.role !== 'super_admin') {
      throw new CustomError('Super administrator privileges required', 403);
    }

    // Prevent self-deletion
    if (parseInt(userId) === adminUser.id) {
      throw new CustomError('Cannot delete your own account', 400);
    }

    // Get user details before deletion
    const [users] = await db.query(`
      SELECT id, username, role, email FROM users WHERE id = ?
    `, [userId]);
    
    if (users.length === 0) {
      throw new CustomError('User not found', 404);
    }
    
    const user = users[0];

    // Begin transaction
    await db.query('START TRANSACTION');
    
    try {
      // Log the deletion before actually deleting
      await db.query(`
        INSERT INTO audit_logs (user_id, action, details, createdAt)
        VALUES (?, 'user_deleted', ?, NOW())
      `, [adminUser.id, JSON.stringify({
        targetUserId: userId,
        targetUsername: user.username,
        targetRole: user.role,
        targetEmail: user.email,
        deletedBy: adminUser.username,
        reason: reason
      })]);
      
      // Delete related records first (adjust based on your schema)
      await db.query('DELETE FROM surveylog WHERE user_id = ?', [userId]);
      await db.query('DELETE FROM full_membership_applications WHERE user_id = ?', [userId]);
      await db.query('DELETE FROM full_membership_access WHERE user_id = ?', [userId]);
      await db.query('DELETE FROM user_preferences WHERE user_id = ?', [userId]);
      await db.query('DELETE FROM identity_masking_audit WHERE user_id = ?', [userId]);
      
      // Delete main user record
      const [result] = await db.query('DELETE FROM users WHERE id = ?', [userId]);
      
      if (result.affectedRows === 0) {
        throw new CustomError('Failed to delete user', 500);
      }
      
      await db.query('COMMIT');
      
      return {
        username: user.username,
        email: user.email,
        role: user.role,
        deleted: true,
        deletedBy: adminUser.username,
        reason: reason,
        deletedAt: new Date().toISOString()
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
// USER PERMISSIONS & ROLES SERVICES
// ===============================================

/**
 * Ban user service
 * @param {number} userId - User ID to ban
 * @param {Object} banData - Ban details
 * @param {Object} adminUser - Admin user performing ban
 * @returns {Object} Ban result
 */
export const banUserService = async (userId, banData, adminUser) => {
  try {
    const { reason, duration, notifyUser = true } = banData;
    
    console.log('🚫 Admin banning user:', userId, 'reason:', reason);

    // Get user details
    const [users] = await db.query(`
      SELECT id, username, role, email FROM users WHERE id = ?
    `, [userId]);
    
    if (users.length === 0) {
      throw new CustomError('User not found', 404);
    }
    
    const user = users[0];
    
    // Prevent banning other admins (unless super admin)
    if (['admin', 'super_admin'].includes(user.role) && adminUser.role !== 'super_admin') {
      throw new CustomError('Cannot ban administrator accounts', 403);
    }

    // Prevent self-ban
    if (parseInt(userId) === adminUser.id) {
      throw new CustomError('Cannot ban your own account', 400);
    }

    // Begin transaction
    await db.query('START TRANSACTION');
    
    try {
      // Update user ban status
      const updateData = {
        isbanned: true,
        ban_reason: reason,
        banned_at: new Date(),
        banned_by: adminUser.id,
        ban_duration: duration
      };

      await db.query(`
        UPDATE users 
        SET isbanned = ?, ban_reason = ?, banned_at = NOW(), banned_by = ?, ban_duration = ?, updatedAt = NOW()
        WHERE id = ?
      `, [true, reason, adminUser.id, duration, userId]);
      
      // Log the ban action
      await db.query(`
        INSERT INTO audit_logs (user_id, action, details, createdAt)
        VALUES (?, 'user_banned', ?, NOW())
      `, [adminUser.id, JSON.stringify({
        targetUserId: userId,
        targetUsername: user.username,
        reason,
        duration,
        bannedBy: adminUser.username,
        notifyUser
      })]);
      
      await db.query('COMMIT');
      
      return {
        userId,
        username: user.username,
        email: user.email,
        reason,
        duration,
        banned_by: adminUser.username,
        banned_at: new Date().toISOString(),
        notify_user: notifyUser
      };
      
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error in banUserService:', error);
    throw error;
  }
};

/**
 * Unban user service
 * @param {number} userId - User ID to unban
 * @param {string} reason - Unban reason
 * @param {Object} adminUser - Admin user performing unban
 * @returns {Object} Unban result
 */
export const unbanUserService = async (userId, reason, adminUser) => {
  try {
    console.log('✅ Admin unbanning user:', userId, 'reason:', reason);

    // Get user details
    const [users] = await db.query(`
      SELECT id, username, email, isbanned FROM users WHERE id = ?
    `, [userId]);
    
    if (users.length === 0) {
      throw new CustomError('User not found', 404);
    }
    
    const user = users[0];
    
    if (!user.isbanned) {
      throw new CustomError('User is not banned', 400);
    }

    // Begin transaction
    await db.query('START TRANSACTION');
    
    try {
      // Update user ban status
      await db.query(`
        UPDATE users 
        SET isbanned = ?, unban_reason = ?, unbanned_at = NOW(), unbanned_by = ?, updatedAt = NOW()
        WHERE id = ?
      `, [false, reason, adminUser.id, userId]);
      
      // Log the unban action
      await db.query(`
        INSERT INTO audit_logs (user_id, action, details, createdAt)
        VALUES (?, 'user_unbanned', ?, NOW())
      `, [adminUser.id, JSON.stringify({
        targetUserId: userId,
        targetUsername: user.username,
        reason,
        unbannedBy: adminUser.username
      })]);
      
      await db.query('COMMIT');
      
      return {
        userId,
        username: user.username,
        email: user.email,
        reason,
        unbanned_by: adminUser.username,
        unbanned_at: new Date().toISOString()
      };
      
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error in unbanUserService:', error);
    throw error;
  }
};

// ===============================================
// ID GENERATION SERVICES
// ===============================================

/**
 * Generate bulk IDs service
 * @param {number} count - Number of IDs to generate
 * @param {string} type - Type of ID (user, class, etc.)
 * @param {Object} adminUser - Admin user requesting generation
 * @returns {Object} Generated IDs
 */
export const generateBulkIdsService = async (count, type, adminUser) => {
  try {
    console.log('🆔 Admin generating bulk IDs:', { count, type });
    
    if (count > 100) {
      throw new CustomError('Maximum 100 IDs can be generated at once', 400);
    }

    const generatedIds = [];
    
    for (let i = 0; i < count; i++) {
      let newId;
      if (type === 'user') {
        newId = await generateUniqueConverseId();
      } else if (type === 'class') {
        newId = await generateUniqueClassId();
      } else {
        // Fallback to simple generation
        newId = `${type.toUpperCase()}_${Date.now()}_${i}`;
      }
      
      generatedIds.push(newId);
      
      // Log the generation
      await db.query(`
        INSERT INTO id_generation_log (generated_id, id_type, generated_by, purpose, createdAt)
        VALUES (?, ?, ?, 'bulk_generation', NOW())
      `, [newId, type, adminUser.converse_id || adminUser.id]);
    }
    
    return {
      generated_ids: generatedIds,
      count,
      type,
      generated_by: adminUser.username,
      generated_at: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error in generateBulkIdsService:', error);
    throw error;
  }
};

export const generateClassIdService = async ()=>{};

/**
 * Generate converse ID for user
 * @param {number} userId - User ID
 * @param {Object} adminUser - Admin user requesting generation
 * @returns {Object} Generated converse ID result
 */
export const generateConverseIdService = async (userId, adminUser) => {
  try {
    console.log('🆔 Admin generating converse ID for user:', userId);

    // Check if user exists and current converse ID status
    const [users] = await db.query(`
      SELECT id, username, converse_id FROM users WHERE id = ?
    `, [userId]);
    
    if (users.length === 0) {
      throw new CustomError('User not found', 404);
    }
    
    const user = users[0];
    
    if (user.converse_id && user.converse_id !== '000000') {
      throw new CustomError('User already has a converse ID', 400);
    }

    // Generate new converse ID
    const converseId = await generateUniqueConverseId();
    
    // Begin transaction
    await db.query('START TRANSACTION');
    
    try {
      // Update user with new converse ID
      await db.query(`
        UPDATE users SET converse_id = ?, updatedAt = NOW() WHERE id = ?
      `, [converseId, userId]);
      
      // Log the generation
      await db.query(`
        INSERT INTO id_generation_log (generated_id, id_type, generated_by, purpose, createdAt)
        VALUES (?, 'user', ?, 'converse_id_generation', NOW())
      `, [converseId, adminUser.converse_id || adminUser.id]);
      
      await db.query('COMMIT');
      
      return {
        userId,
        username: user.username,
        converse_id: converseId,
        generated_by: adminUser.username,
        generated_at: new Date().toISOString()
      };
      
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error in generateConverseIdService:', error);
    throw error;
  }
};

// ===============================================
// IDENTITY MANAGEMENT SERVICES
// ===============================================

/**
 * Mask user identity service
 * @param {Object} maskingData - Identity masking data
 * @param {Object} adminUser - Admin user performing masking
 * @returns {Object} Masking result
 */
export const maskUserIdentityService = async (maskingData, adminUser) => {
  try {
    const { userId, adminConverseId, mentorConverseId, classId, reason } = maskingData;
    
    console.log('🎭 Admin masking user identity:', { userId, reason });

    // Get user details before masking
    const [users] = await db.query(`
      SELECT id, username, converse_id, is_identity_masked FROM users WHERE id = ?
    `, [userId]);
    
    if (users.length === 0) {
      throw new CustomError('User not found', 404);
    }
    
    const user = users[0];
    
    if (user.is_identity_masked) {
      throw new CustomError('User identity is already masked', 400);
    }

    // Begin transaction
    await db.query('START TRANSACTION');
    
    try {
      // Update user with masked identity
      await db.query(`
        UPDATE users 
        SET converse_id = ?, mentor_id = ?, primary_class_id = ?, is_identity_masked = ?, updatedAt = NOW()
        WHERE id = ?
      `, [adminConverseId, mentorConverseId, classId, true, userId]);
      
      // Log identity masking
      await db.query(`
        INSERT INTO identity_masking_audit (
          user_id, original_converse_id, new_converse_id, masked_by_admin_id, 
          original_username, reason, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())
      `, [userId, user.converse_id, adminConverseId, adminUser.converse_id || adminUser.id, user.username, reason]);
      
      await db.query('COMMIT');
      
      return {
        userId,
        original_username: user.username,
        original_converse_id: user.converse_id,
        new_converse_id: adminConverseId,
        mentor_id: mentorConverseId,
        class_id: classId,
        masked_by: adminUser.username,
        masked_at: new Date().toISOString(),
        reason
      };
      
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error in maskUserIdentityService:', error);
    throw error;
  }
};

// ===============================================
// DATA EXPORT SERVICES
// ===============================================

/**
 * Export users data service
 * @param {Object} exportOptions - Export options
 * @param {Object} adminUser - Admin user requesting export
 * @returns {Object} Export data
 */
export const exportUsersDataService = async (exportOptions = {}, adminUser) => {
  try {
    console.log('📊 Admin exporting user data:', exportOptions);
    
    const { format = 'json', includePersonalData = false } = exportOptions;
    
    // Only super admin can export personal data
    if (includePersonalData && adminUser.role !== 'super_admin') {
      throw new CustomError('Super administrator privileges required for personal data export', 403);
    }

    // Get all users for export
    const [users] = await db.query(`
      SELECT 
        u.id,
        u.username,
        ${includePersonalData ? 'u.email, u.phone,' : ''}
        u.role,
        u.membership_stage,
        u.is_member,
        u.full_membership_status,
        u.converse_id,
        u.createdAt,
        u.updatedAt,
        u.last_login,
        u.isblocked,
        u.isbanned,
        ${includePersonalData ? 'u.ban_reason,' : ''}
        u.is_identity_masked
      FROM users u
      ORDER BY u.createdAt DESC
    `);
    
    // Log the export action
    await db.query(`
      INSERT INTO audit_logs (user_id, action, details, createdAt)
      VALUES (?, 'data_export', ?, NOW())
    `, [adminUser.id, JSON.stringify({
      exportType: 'users',
      format,
      includePersonalData,
      recordCount: users.length,
      exportedBy: adminUser.username
    })]);
    
    return {
      users,
      metadata: {
        total_records: users.length,
        format,
        include_personal_data: includePersonalData,
        exported_at: new Date().toISOString(),
        exported_by: adminUser.username
      }
    };
    
  } catch (error) {
    console.error('❌ Error in exportUsersDataService:', error);
    throw error;
  }
};

// ===============================================
// EXPORT ALL SERVICES
// ===============================================

export default {
  // User management
  getAllUsersService,
  createUserService,
  updateUserByAdminService,
  deleteUserService,
  
  // Permissions & roles
  banUserService,
  unbanUserService,
  
  // ID generation
  generateBulkIdsService,
  generateConverseIdService,
  
  // Identity management
  maskUserIdentityService,
  
  // Data export
  exportUsersDataService
};