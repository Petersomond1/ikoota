import db from '../config/db.js';
import CustomError from '../utils/CustomError.js';

// Enhanced getUserProfileService with better error handling
export const getUserProfileService = async (user_id) => {
  try {
    if (!user_id) {
      throw new CustomError('User ID is required', 400);
    }

    const sql = `
      SELECT 
        id,
        username,
        email,
        phone,
        avatar,
        converse_id,
        mentor_id,
        class_id,
        is_member,
        role,
        isblocked,
        isbanned,
        createdAt,
        updatedAt
      FROM users 
      WHERE id = ?
    `;
    
    const rows = await db.query(sql, [user_id]);
    
    if (rows.length === 0) {
      throw new CustomError('User not found', 404);
    }

    // Remove sensitive data
    const userProfile = rows[0];
    delete userProfile.password_hash;
    delete userProfile.resetToken;
    delete userProfile.resetTokenExpiry;
    delete userProfile.verificationCode;
    delete userProfile.codeExpiry;

    return userProfile;
  } catch (error) {
    console.error('Error in getUserProfileService:', error);
    throw new CustomError(error.message || 'Failed to fetch user profile');
  }
};

// Enhanced updateUserProfileService with validation
export const updateUserProfileService = async (user_id, profileData) => {
  try {
    if (!user_id) {
      throw new CustomError('User ID is required', 400);
    }

    const { 
      username, 
      email, 
      phone, 
      avatar, 
      converse_id, 
      mentor_id, 
      class_id 
    } = profileData;

    // Validate required fields
    if (!username && !email && !phone && !avatar && !converse_id && !mentor_id && !class_id) {
      throw new CustomError('At least one field must be provided for update', 400);
    }

    // Check if user exists
    const existingUser = await db.query('SELECT id FROM users WHERE id = ?', [user_id]);
    if (existingUser.length === 0) {
      throw new CustomError('User not found', 404);
    }

    // Build dynamic update query
    const updateFields = [];
    const values = [];

    if (username !== undefined) {
      updateFields.push('username = ?');
      values.push(username);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      values.push(email);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      values.push(phone);
    }
    if (avatar !== undefined) {
      updateFields.push('avatar = ?');
      values.push(avatar);
    }
    if (converse_id !== undefined) {
      updateFields.push('converse_id = ?');
      values.push(converse_id);
    }
    if (mentor_id !== undefined) {
      updateFields.push('mentor_id = ?');
      values.push(mentor_id);
    }
    if (class_id !== undefined) {
      updateFields.push('class_id = ?');
      values.push(class_id);
    }

    updateFields.push('updatedAt = NOW()');
    values.push(user_id);

    const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    const result = await db.query(sql, values);

    if (result.affectedRows === 0) {
      throw new CustomError('User profile update failed', 500);
    }

    // Return updated profile
    return await getUserProfileService(user_id);
  } catch (error) {
    console.error('Error in updateUserProfileService:', error);
    throw new CustomError(error.message || 'Failed to update user profile');
  }
};

// Enhanced updateUser with role validation
export const updateUser = async (user_id, updateData) => {
  try {
    if (!user_id) {
      throw new CustomError('User ID is required', 400);
    }

    const { 
      role, 
      is_member, 
      isblocked, 
      isbanned, 
      mentor_id, 
      class_id 
    } = updateData;

    // Validate role if provided
    const validRoles = ['user', 'admin', 'super_admin', 'mentor', 'moderator'];
    if (role && !validRoles.includes(role)) {
      throw new CustomError(`Invalid role. Valid roles are: ${validRoles.join(', ')}`, 400);
    }

    // Validate is_member if provided
    const validMemberStatuses = ['applied', 'granted', 'denied', 'suspended'];
    if (is_member && !validMemberStatuses.includes(is_member)) {
      throw new CustomError(`Invalid membership status. Valid statuses are: ${validMemberStatuses.join(', ')}`, 400);
    }

    // Check if user exists
    const existingUser = await db.query('SELECT id, role FROM users WHERE id = ?', [user_id]);
    if (existingUser.length === 0) {
      throw new CustomError('User not found', 404);
    }

    // Build dynamic update query
    const updateFields = [];
    const values = [];

    if (role !== undefined) {
      updateFields.push('role = ?');
      values.push(role);
    }
    if (is_member !== undefined) {
      updateFields.push('is_member = ?');
      values.push(is_member);
    }
    if (isblocked !== undefined) {
      updateFields.push('isblocked = ?');
      values.push(isblocked ? 1 : 0);
    }
    if (isbanned !== undefined) {
      updateFields.push('isbanned = ?');
      values.push(isbanned ? 1 : 0);
    }
    if (mentor_id !== undefined) {
      updateFields.push('mentor_id = ?');
      values.push(mentor_id);
    }
    if (class_id !== undefined) {
      updateFields.push('class_id = ?');
      values.push(class_id);
    }

    if (updateFields.length === 0) {
      throw new CustomError('No valid fields provided for update', 400);
    }

    updateFields.push('updatedAt = NOW()');
    values.push(user_id);

    const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    const result = await db.query(sql, values);

    if (result.affectedRows === 0) {
      throw new CustomError('User update failed', 500);
    }

    console.log(`User ${user_id} updated successfully`);
    return await getUserProfileService(user_id);
  } catch (error) {
    console.error('Error in updateUser:', error);
    throw new CustomError(error.message || 'Failed to update user');
  }
};

// NEW: Get all users with filtering and pagination
export const getAllUsers = async (filters = {}) => {
  try {
    const { 
      role, 
      is_member, 
      isblocked, 
      isbanned, 
      search, 
      limit = 50, 
      offset = 0 
    } = filters;

    let whereConditions = [];
    let params = [];

    if (role) {
      whereConditions.push('role = ?');
      params.push(role);
    }

    if (is_member) {
      whereConditions.push('is_member = ?');
      params.push(is_member);
    }

    if (isblocked !== undefined) {
      whereConditions.push('isblocked = ?');
      params.push(isblocked ? 1 : 0);
    }

    if (isbanned !== undefined) {
      whereConditions.push('isbanned = ?');
      params.push(isbanned ? 1 : 0);
    }

    if (search) {
      whereConditions.push('(username LIKE ? OR email LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    const whereClause = whereConditions.length > 0 ? 
      `WHERE ${whereConditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        id,
        username,
        email,
        phone,
        avatar,
        converse_id,
        mentor_id,
        class_id,
        is_member,
        role,
        isblocked,
        isbanned,
        createdAt,
        updatedAt
      FROM users 
      ${whereClause}
      ORDER BY updatedAt DESC, createdAt DESC
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit), parseInt(offset));
    const rows = await db.query(sql, params);

    // Get total count for pagination
    const countSql = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const countResult = await db.query(countSql, params.slice(0, -2));

    return {
      users: rows,
      total: countResult[0].total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    throw new CustomError(error.message || 'Failed to fetch users');
  }
};

// NEW: Get user statistics
export const getUserStats = async () => {
  try {
    const sql = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'user' THEN 1 END) as regular_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
        COUNT(CASE WHEN role = 'super_admin' THEN 1 END) as super_admins,
        COUNT(CASE WHEN role = 'mentor' THEN 1 END) as mentors,
        COUNT(CASE WHEN is_member = 'granted' THEN 1 END) as granted_members,
        COUNT(CASE WHEN is_member = 'applied' THEN 1 END) as pending_applications,
        COUNT(CASE WHEN is_member = 'denied' THEN 1 END) as denied_applications,
        COUNT(CASE WHEN isblocked = 1 THEN 1 END) as blocked_users,
        COUNT(CASE WHEN isbanned = 1 THEN 1 END) as banned_users,
        MIN(createdAt) as first_user_created,
        MAX(updatedAt) as last_user_updated
      FROM users
    `;

    const rows = await db.query(sql);
    return rows[0];
  } catch (error) {
    console.error('Error in getUserStats:', error);
    throw new CustomError(error.message || 'Failed to get user statistics');
  }
};

// NEW: Get user activity (content created by user)
export const getUserActivity = async (user_id) => {
  try {
    if (!user_id) {
      throw new CustomError('User ID is required', 400);
    }

    // Get user's chats and teachings count
    const chatCount = await db.query(
      'SELECT COUNT(*) as chat_count FROM chats WHERE user_id = ?', 
      [user_id]
    );

    const teachingCount = await db.query(
      'SELECT COUNT(*) as teaching_count FROM teachings WHERE user_id = ?', 
      [user_id]
    );

    const commentCount = await db.query(
      'SELECT COUNT(*) as comment_count FROM comments WHERE user_id = ?', 
      [user_id]
    );

    // Get recent activity
    const recentChats = await db.query(`
      SELECT id, prefixed_id, title, createdAt, 'chat' as content_type 
      FROM chats 
      WHERE user_id = ? 
      ORDER BY createdAt DESC 
      LIMIT 5
    `, [user_id]);

    const recentTeachings = await db.query(`
      SELECT id, prefixed_id, topic as title, createdAt, 'teaching' as content_type 
      FROM teachings 
      WHERE user_id = ? 
      ORDER BY createdAt DESC 
      LIMIT 5
    `, [user_id]);

    return {
      statistics: {
        total_chats: chatCount[0].chat_count,
        total_teachings: teachingCount[0].teaching_count,
        total_comments: commentCount[0].comment_count,
        total_content: chatCount[0].chat_count + teachingCount[0].teaching_count
      },
      recent_activity: [
        ...recentChats,
        ...recentTeachings
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10)
    };
  } catch (error) {
    console.error('Error in getUserActivity:', error);
    throw new CustomError(error.message || 'Failed to get user activity');
  }
};

// NEW: Delete user (soft delete by blocking)
export const deleteUser = async (user_id) => {
  try {
    if (!user_id) {
      throw new CustomError('User ID is required', 400);
    }

    // Check if user exists
    const existingUser = await db.query('SELECT id, username FROM users WHERE id = ?', [user_id]);
    if (existingUser.length === 0) {
      throw new CustomError('User not found', 404);
    }

    // Soft delete by blocking and banning
    const sql = `
      UPDATE users 
      SET isblocked = 1, isbanned = 1, updatedAt = NOW() 
      WHERE id = ?
    `;
    
    const result = await db.query(sql, [user_id]);

    if (result.affectedRows === 0) {
      throw new CustomError('User deletion failed', 500);
    }

    console.log(`User ${existingUser[0].username} (ID: ${userId}) soft deleted`);
    return { deleted: true, username: existingUser[0].username };
  } catch (error) {
    console.error('Error in deleteUser:', error);
    throw new CustomError(error.message || 'Failed to delete user');
  }
};