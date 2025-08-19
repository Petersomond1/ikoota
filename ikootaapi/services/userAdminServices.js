// ikootaapi/services/userAdminServices.js
// ADMIN USER MANAGEMENT SERVICES - COMPLETE FILE
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
export const getAllUsersAdminService = async (filters = {}) => {
  try {
    console.log('🔍 Admin getting all users with filters:', filters);
    
    let whereClause = 'WHERE 1=1';
    const queryParams = [];
    
    // Build dynamic WHERE clause
    if (filters.role) {
      whereClause += ' AND u.role = ?';
      queryParams.push(filters.role);
    }
    
    if (filters.membership_stage) {
      whereClause += ' AND u.membership_stage = ?';
      queryParams.push(filters.membership_stage);
    }
    
    if (filters.is_member) {
      whereClause += ' AND u.is_member = ?';
      queryParams.push(filters.is_member);
    }
    
    if (filters.isblocked !== undefined) {
      whereClause += ' AND u.isblocked = ?';
      queryParams.push(filters.isblocked);
    }
    
    if (filters.isbanned !== undefined) {
      whereClause += ' AND u.isbanned = ?';
      queryParams.push(filters.isbanned);
    }
    
    if (filters.search) {
      whereClause += ' AND (u.username LIKE ? OR u.email LIKE ? OR u.converse_id LIKE ?)';
      queryParams.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }
    
    // Get total count
    const [countResult] = await db.query(`
      SELECT COUNT(*) as total FROM users u ${whereClause}
    `, queryParams);
    
    // ✅ Safe count access
    const total = (countResult && Array.isArray(countResult) && countResult[0]) ? countResult[0].total : 0;
    
    // Get users with pagination
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;
    
    const [users] = await db.query(`
      SELECT 
        u.id, u.username, u.email, u.phone, u.role, 
        u.membership_stage, u.is_member, u.full_membership_status,
        u.converse_id, u.mentor_id, u.primary_class_id,
        u.createdAt, u.updatedAt, u.lastLogin,
        u.isblocked, u.isbanned, u.ban_reason, u.is_identity_masked,
        m.username as mentor_name,
        c.class_name as primary_class_name,
        (SELECT COUNT(*) FROM surveylog WHERE user_id = u.id) as total_applications
      FROM users u
      LEFT JOIN users m ON u.mentor_id = m.id
      LEFT JOIN classes c ON u.primary_class_id = c.id
      ${whereClause}
      ORDER BY u.createdAt DESC
      LIMIT ${parseInt(limit)} OFFSET ${offset}
    `, queryParams);
    
    // ✅ Safe array access
    const safeUsers = Array.isArray(users) ? users : [];
    
    return {
      users: safeUsers.map(user => ({
        ...user,
        is_identity_masked: !!user.is_identity_masked,
        isblocked: !!user.isblocked,
        isbanned: !!user.isbanned
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      filters: {
        role: filters.role,
        membership_stage: filters.membership_stage,
        search: filters.search
      }
    };
    
  } catch (error) {
    console.error('❌ Error in getAllUsersAdminService:', error);
    throw error;
  }
};

/**
 * Get user by ID for admin
 * @param {number} userId - User ID
 * @returns {Object} User details
 */
export const getUserByIdAdminService = async (userId) => {
  try {
    console.log('🔍 Admin fetching user by ID:', userId);
    
    const [users] = await db.query(`
      SELECT 
        u.id, u.username, u.email, u.phone, u.role,
        u.membership_stage, u.is_member, u.full_membership_status,
        u.converse_id, u.mentor_id, u.primary_class_id,
        u.total_classes, u.is_identity_masked,
        u.createdAt, u.updatedAt, u.lastLogin,
        u.isblocked, u.isbanned, u.ban_reason, u.decline_reason,
        m.username as mentor_name, m.email as mentor_email,
        c.class_name as primary_class_name,
        (SELECT COUNT(*) FROM surveylog WHERE user_id = u.id) as total_applications,
        (SELECT COUNT(*) FROM full_membership_applications WHERE user_id = u.id) as full_membership_applications
      FROM users u
      LEFT JOIN users m ON u.mentor_id = m.id
      LEFT JOIN classes c ON u.primary_class_id = c.id
      WHERE u.id = ?
    `, [userId]);
    
    // ✅ Safe result access
    if (!users || (Array.isArray(users) && users.length === 0)) {
      throw new CustomError('User not found', 404);
    }
    
    const user = Array.isArray(users) ? users[0] : users;
    
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
        total_classes: user.total_classes || 0,
        total_applications: user.total_applications || 0,
        full_membership_applications: user.full_membership_applications || 0
      },
      status: {
        is_blocked: !!user.isblocked,
        is_banned: !!user.isbanned,
        ban_reason: user.ban_reason,
        decline_reason: user.decline_reason,
        is_identity_masked: !!user.is_identity_masked
      },
      timestamps: {
        created_at: user.createdAt,
        updated_at: user.updatedAt,
        last_login: user.lastLogin
      }
    };
    
  } catch (error) {
    console.error('❌ Error in getUserByIdAdminService:', error);
    throw error;
  }
};

/**
 * Create user (Admin)
 * @param {Object} userData - User data
 * @param {Object} adminUser - Admin user creating the account
 * @returns {Object} Created user data
 */
export const createUserAdminService = async (userData, adminUser) => {
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
    
    // ✅ Safe array access
    const safeExistingUsers = Array.isArray(existingUsers) ? existingUsers : [];
    if (safeExistingUsers.length > 0) {
      const existing = safeExistingUsers[0];
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
      
      // Log the creation in audit trail (if audit table exists)
      try {
        await db.query(`
          INSERT INTO audit_logs (user_id, action, details, createdAt)
          VALUES (?, 'user_created', ?, NOW())
        `, [adminUser.id, JSON.stringify({
          targetUserId: newUserId,
          targetUsername: username,
          targetRole: role,
          createdBy: adminUser.username
        })]);
      } catch (auditError) {
        console.warn('Could not log to audit table:', auditError.message);
      }
      
      await db.query('COMMIT');
      
      // Return created user details
      return await getUserByIdAdminService(newUserId);
      
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error in createUserAdminService:', error);
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
export const updateUserAdminService = async (userId, updateData, adminUser) => {
  try {
    console.log('🔧 Admin updating user:', userId, 'with:', updateData);
    
    // Get current user to validate exists
    const currentUser = await getUserByIdAdminService(userId);
    
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
      
      // Log the update in audit trail (if audit table exists)
      try {
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
      } catch (auditError) {
        console.warn('Could not log to audit table:', auditError.message);
      }
      
      await db.query('COMMIT');
      
      // Return updated user with full details
      return await getUserByIdAdminService(userId);
      
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error in updateUserAdminService:', error);
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
export const deleteUserAdminService = async (userId, adminUser, reason = 'Admin deletion') => {
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
    const user = await getUserByIdAdminService(userId);

    // Begin transaction
    await db.query('START TRANSACTION');
    
    try {
      // Log the deletion before actually deleting (if audit table exists)
      try {
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
      } catch (auditError) {
        console.warn('Could not log to audit table:', auditError.message);
      }
      
      // Delete related records first (adjust based on your schema)
      try {
        await db.query('DELETE FROM surveylog WHERE user_id = ?', [userId]);
        await db.query('DELETE FROM full_membership_applications WHERE user_id = ?', [userId]);
        await db.query('DELETE FROM user_preferences WHERE user_id = ?', [userId]);
        await db.query('DELETE FROM user_settings WHERE user_id = ?', [userId]);
        await db.query('DELETE FROM notifications WHERE user_id = ?', [userId]);
        await db.query('DELETE FROM user_activities WHERE user_id = ?', [userId]);
      } catch (relatedError) {
        console.warn('Some related records could not be deleted:', relatedError.message);
      }
      
      // Delete main user record
      const [result] = await db.query('DELETE FROM users WHERE id = ?', [userId]);
      
      if (!result || result.affectedRows === 0) {
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
    console.error('❌ Error in deleteUserAdminService:', error);
    throw error;
  }
};

/**
 * Search users for admin
 * @param {Object} searchFilters - Search criteria
 * @returns {Object} Search results
 */
export const searchUsersAdminService = async (searchFilters = {}) => {
  try {
    console.log('🔍 Admin searching users:', searchFilters);
    
    // Use the same logic as getAllUsersAdminService but with search focus
    return await getAllUsersAdminService(searchFilters);
    
  } catch (error) {
    console.error('❌ Error in searchUsersAdminService:', error);
    throw error;
  }
};

// ===============================================
// USER ACTION SERVICES
// ===============================================

/**
 * Ban user service
 * @param {number} userId - User ID to ban
 * @param {Object} banData - Ban details
 * @param {Object} adminUser - Admin user performing ban
 * @returns {Object} Ban result
 */
export const banUserAdminService = async (userId, banData, adminUser) => {
  try {
    const { reason, duration, notifyUser = true } = banData;
    
    console.log('🚫 Admin banning user:', userId, 'reason:', reason);

    // Get user details
    const user = await getUserByIdAdminService(userId);
    
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
      await db.query(`
        UPDATE users 
        SET isbanned = ?, ban_reason = ?, banned_at = NOW(), banned_by = ?, ban_duration = ?, updatedAt = NOW()
        WHERE id = ?
      `, [true, reason, adminUser.id, duration, userId]);
      
      // Log the ban action (if audit table exists)
      try {
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
      } catch (auditError) {
        console.warn('Could not log to audit table:', auditError.message);
      }
      
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
    console.error('❌ Error in banUserAdminService:', error);
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
export const unbanUserAdminService = async (userId, reason, adminUser) => {
  try {
    console.log('✅ Admin unbanning user:', userId, 'reason:', reason);

    // Get user details
    const user = await getUserByIdAdminService(userId);
    
    if (!user.status.is_banned) {
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
      
      // Log the unban action (if audit table exists)
      try {
        await db.query(`
          INSERT INTO audit_logs (user_id, action, details, createdAt)
          VALUES (?, 'user_unbanned', ?, NOW())
        `, [adminUser.id, JSON.stringify({
          targetUserId: userId,
          targetUsername: user.username,
          reason,
          unbannedBy: adminUser.username
        })]);
      } catch (auditError) {
        console.warn('Could not log to audit table:', auditError.message);
      }
      
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
    console.error('❌ Error in unbanUserAdminService:', error);
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
      
      // Log the generation (if audit table exists)
      try {
        await db.query(`
          INSERT INTO id_generation_log (generated_id, id_type, generated_by, purpose, createdAt)
          VALUES (?, ?, ?, 'bulk_generation', NOW())
        `, [newId, type, adminUser.converse_id || adminUser.id]);
      } catch (logError) {
        console.warn('Could not log ID generation:', logError.message);
      }
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
    const user = await getUserByIdAdminService(userId);
    
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
      
      // Log the generation (if audit table exists)
      try {
        await db.query(`
          INSERT INTO id_generation_log (generated_id, id_type, generated_by, purpose, createdAt)
          VALUES (?, 'user', ?, 'converse_id_generation', NOW())
        `, [converseId, adminUser.converse_id || adminUser.id]);
      } catch (logError) {
        console.warn('Could not log ID generation:', logError.message);
      }
      
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

/**
 * Generate class ID service
 * @param {Object} classData - Class creation data
 * @param {Object} adminUser - Admin user requesting generation
 * @returns {Object} Generated class ID result
 */
export const generateClassIdService = async (classData, adminUser) => {
  try {
    const { className, classType = 'demographic' } = classData;
    
    console.log('🆔 Admin generating class ID:', { className, classType });

    // Generate class ID using the utility function
    const newClassId = await generateUniqueClassId();
    
    // Begin transaction
    await db.query('START TRANSACTION');
    
    try {
      // Create the class
      await db.query(`
        INSERT INTO classes (class_id, class_name, class_type, created_by, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, NOW(), NOW())
      `, [newClassId, className, classType, adminUser.id]);
      
      // Log the generation (if audit table exists)
      try {
        await db.query(`
          INSERT INTO id_generation_log (generated_id, id_type, generated_by, purpose, createdAt)
          VALUES (?, 'class', ?, 'class_creation', NOW())
        `, [newClassId, adminUser.converse_id || adminUser.id]);
      } catch (logError) {
        console.warn('Could not log ID generation:', logError.message);
      }
      
      await db.query('COMMIT');
      
      return {
        class_id: newClassId,
        class_name: className,
        class_type: classType,
        created_by: adminUser.username,
        created_at: new Date().toISOString()
      };
      
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error in generateClassIdService:', error);
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
    const user = await getUserByIdAdminService(userId);
    
    if (user.status.is_identity_masked) {
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
      
      // Log identity masking (if audit table exists)
      try {
        await db.query(`
          INSERT INTO identity_masking_audit (
            user_id, original_converse_id, new_converse_id, masked_by_admin_id, 
            original_username, reason, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, NOW())
        `, [userId, user.converse_id, adminConverseId, adminUser.converse_id || adminUser.id, user.username, reason]);
      } catch (auditError) {
        console.warn('Could not log identity masking:', auditError.message);
      }
      
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
export const exportUserDataAdminService = async (exportOptions = {}, adminUser) => {
  try {
    console.log('📊 Admin exporting user data:', exportOptions);
    
    const { format = 'json', includePersonalData = false } = exportOptions;
    
    // Only super admin can export personal data
    if (includePersonalData && adminUser.role !== 'super_admin') {
      throw new CustomError('Super administrator privileges required for personal data export', 403);
    }

    // Get all users for export
    const selectFields = includePersonalData 
      ? 'u.id, u.username, u.email, u.phone, u.role, u.membership_stage, u.is_member, u.full_membership_status, u.converse_id, u.createdAt, u.updatedAt, u.lastLogin, u.isblocked, u.isbanned, u.ban_reason, u.is_identity_masked'
      : 'u.id, u.username, u.role, u.membership_stage, u.is_member, u.full_membership_status, u.converse_id, u.createdAt, u.updatedAt, u.lastLogin, u.isblocked, u.isbanned, u.is_identity_masked';

    const [users] = await db.query(`
      SELECT ${selectFields}
      FROM users u
      ORDER BY u.createdAt DESC
    `);
    
    // ✅ Safe array access
    const safeUsers = Array.isArray(users) ? users : [];
    
    // Log the export action (if audit table exists)
    try {
      await db.query(`
        INSERT INTO audit_logs (user_id, action, details, createdAt)
        VALUES (?, 'data_export', ?, NOW())
      `, [adminUser.id, JSON.stringify({
        exportType: 'users',
        format,
        includePersonalData,
        recordCount: safeUsers.length,
        exportedBy: adminUser.username
      })]);
    } catch (auditError) {
      console.warn('Could not log to audit table:', auditError.message);
    }
    
    return {
      users: safeUsers,
      metadata: {
        total_records: safeUsers.length,
        format,
        include_personal_data: includePersonalData,
        exported_at: new Date().toISOString(),
        exported_by: adminUser.username
      }
    };
    
  } catch (error) {
    console.error('❌ Error in exportUserDataAdminService:', error);
    throw error;
  }
};

// ===============================================
// STATISTICS SERVICES
// ===============================================

/**
 * Get user statistics for admin
 * @returns {Object} User statistics
 */
export const getUserStatsAdminService = async () => {
  try {
    console.log('📊 Admin fetching user statistics');
    
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as total_admins,
        COUNT(CASE WHEN role = 'super_admin' THEN 1 END) as total_super_admins,
        COUNT(CASE WHEN role = 'mentor' THEN 1 END) as total_mentors,
        COUNT(CASE WHEN membership_stage = 'pre_member' THEN 1 END) as pre_members,
        COUNT(CASE WHEN membership_stage = 'member' THEN 1 END) as full_members,
        COUNT(CASE WHEN membership_stage = 'applicant' THEN 1 END) as applicants,
        COUNT(CASE WHEN membership_stage = 'none' OR membership_stage IS NULL THEN 1 END) as unregistered,
        COUNT(CASE WHEN isblocked = 1 THEN 1 END) as blocked_users,
        COUNT(CASE WHEN isbanned = 1 THEN 1 END) as banned_users,
        COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_users_30_days,
        COUNT(CASE WHEN lastLogin >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as active_users_7_days
      FROM users
    `);
    
    // ✅ Safe result access
    const statsData = (Array.isArray(stats) && stats[0]) ? stats[0] : {
      total_users: 0,
      total_admins: 0,
      total_super_admins: 0,
      total_mentors: 0,
      pre_members: 0,
      full_members: 0,
      applicants: 0,
      unregistered: 0,
      blocked_users: 0,
      banned_users: 0,
      new_users_30_days: 0,
      active_users_7_days: 0
    };
    
    // Get pending applications (with error handling)
    let pendingApplications = 0;
    try {
      const [pendingResult] = await db.query(`
        SELECT COUNT(*) as pending_count 
        FROM surveylog 
        WHERE approval_status = 'pending'
      `);
      pendingApplications = (Array.isArray(pendingResult) && pendingResult[0]) ? pendingResult[0].pending_count : 0;
    } catch (pendingError) {
      console.warn('Could not fetch pending applications:', pendingError.message);
    }
    
    return {
      user_counts: {
        total: statsData.total_users,
        admins: statsData.total_admins,
        super_admins: statsData.total_super_admins,
        mentors: statsData.total_mentors,
        pre_members: statsData.pre_members,
        full_members: statsData.full_members,
        applicants: statsData.applicants,
        unregistered: statsData.unregistered
      },
      user_status: {
        blocked: statsData.blocked_users,
        banned: statsData.banned_users
      },
      activity_metrics: {
        new_users_30_days: statsData.new_users_30_days,
        active_users_7_days: statsData.active_users_7_days
      },
      application_metrics: {
        pending_applications: pendingApplications
      },
      generated_at: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error in getUserStatsAdminService:', error);
    throw error;
  }
};

// ===============================================
// EXPORT ALL SERVICES
// ===============================================

// export {
//   // User Management
//   getAllUsersAdminService,
//   getUserByIdAdminService,
//   createUserAdminService,
//   updateUserAdminService,
//   deleteUserAdminService,
//   searchUsersAdminService,
  
//   // User Actions
//   banUserAdminService,
//   unbanUserAdminService,
  
//   // ID Generation
//   generateBulkIdsService,
//   generateConverseIdService,
//   generateClassIdService,
  
//   // Identity Management
//   maskUserIdentityService,
  
//   // Data Export
//   exportUserDataAdminService,
  
//   // Statistics
//   getUserStatsAdminService
// };

// export default {
//   // User Management
//   getAllUsersAdminService,
//   getUserByIdAdminService,
//   createUserAdminService,
//   updateUserAdminService,
//   deleteUserAdminService,
//   searchUsersAdminService,
  
//   // User Actions
//   banUserAdminService,
//   unbanUserAdminService,
  
//   // ID Generation
//   generateBulkIdsService,
//   generateConverseIdService,
//   generateClassIdService,
  
//   // Identity Management
//   maskUserIdentityService,
  
//   // Data Export
//   exportUserDataAdminService,
  
//   // Statistics
//   getUserStatsAdminService
// };