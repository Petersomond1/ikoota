//ikootaapi\services\userServices.js
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




// Get all users for admin panel
export const getAllUsersForAdmin = async () => {
  try {
    const [users] = await db.query(`
      SELECT 
        id, username, email, phone, role, membership_stage, is_member,
        converse_id, mentor_id, primary_class_id as class_id, 
        isblocked, isbanned, createdAt, updatedAt,
        full_membership_status, is_identity_masked, total_classes
      FROM users 
      ORDER BY createdAt DESC
    `);
    
    return users;
  } catch (error) {
    console.error('❌ Database error in getAllUsersForAdmin:', error);
    throw new Error(`Failed to fetch users: ${error.message}`);
  }
};

// Get all mentors for admin panel
export const getAllMentorsForAdmin = async () => {
  try {
    const [mentors] = await db.query(`
      SELECT 
        id, username, email, converse_id, role, 
        primary_class_id as class_id, total_classes
      FROM users 
      WHERE role IN ('admin', 'super_admin') 
         OR converse_id IS NOT NULL
      ORDER BY role DESC, username ASC
    `);
    
    return mentors;
  } catch (error) {
    console.error('❌ Database error in getAllMentorsForAdmin:', error);
    throw new Error(`Failed to fetch mentors: ${error.message}`);
  }
};

// Update user by admin
export const updateUserByAdmin = async (userId, updateData) => {
  try {
    // Map frontend field names to database field names
    const fieldMapping = {
      'class_id': 'primary_class_id',
      'isblocked': 'isblocked',
      'isbanned': 'isbanned'
    };
    
    // Clean and map the data
    const cleanData = {};
    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined && value !== null && value !== '') {
        const dbField = fieldMapping[key] || key;
        cleanData[dbField] = value;
      }
    }
    
    if (Object.keys(cleanData).length === 0) {
      throw new Error('No valid update data provided');
    }
    
    // Special handling for isblocked (it's JSON in your schema)
    if (cleanData.isblocked !== undefined) {
      cleanData.isblocked = JSON.stringify(cleanData.isblocked);
    }
    
    // Build dynamic update query
    const setClause = Object.keys(cleanData)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = Object.values(cleanData);
    values.push(userId);
    
    const updateQuery = `UPDATE users SET ${setClause} WHERE id = ?`;
    
    await db.query(updateQuery, values);
    
    // Get updated user
    const [updatedUser] = await db.query(
      `SELECT id, username, email, role, membership_stage, is_member, 
              primary_class_id as class_id, isblocked, isbanned 
       FROM users WHERE id = ?`,
      [userId]
    );
    
    return updatedUser[0] || null;
  } catch (error) {
    console.error('❌ Database error in updateUserByAdmin:', error);
    throw new Error(`Failed to update user: ${error.message}`);
  }
};

// Get membership overview statistics
export const getMembershipOverviewStats = async () => {
  try {
    // Get user statistics
    const [userStats] = await db.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role IN ('admin', 'super_admin') THEN 1 END) as admin_users,
        COUNT(CASE WHEN membership_stage = 'member' THEN 1 END) as full_members,
        COUNT(CASE WHEN membership_stage = 'pre_member' THEN 1 END) as pre_members,
        COUNT(CASE WHEN membership_stage = 'applicant' THEN 1 END) as applicants,
        COUNT(CASE WHEN is_member = 'applied' THEN 1 END) as applied_members,
        COUNT(CASE WHEN is_member = 'pending' THEN 1 END) as pending_members,
        COUNT(CASE WHEN is_member = 'granted' THEN 1 END) as granted_members,
        COUNT(CASE WHEN is_member = 'declined' THEN 1 END) as declined_members,
        COUNT(CASE WHEN JSON_EXTRACT(isblocked, '$') = true OR isblocked = '1' THEN 1 END) as blocked_users,
        COUNT(CASE WHEN isbanned = 1 THEN 1 END) as banned_users,
        COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_users_30d,
        COUNT(CASE WHEN is_identity_masked = 1 THEN 1 END) as masked_identities
      FROM users
    `);
    
    // Get application stats from surveylog
    const [applicationStats] = await db.query(`
      SELECT 
        COUNT(*) as total_applications,
        COUNT(CASE WHEN approval_status = 'pending' THEN 1 END) as pending_initial,
        COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) as approved_applications,
        COUNT(CASE WHEN approval_status = 'rejected' THEN 1 END) as rejected_applications,
        COUNT(CASE WHEN application_type = 'initial_application' THEN 1 END) as initial_applications,
        COUNT(CASE WHEN application_type = 'full_membership' THEN 1 END) as full_membership_applications
      FROM surveylog
    `);
    
    // Get reports stats
    const [reportStats] = await db.query(`
      SELECT 
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_reports,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_reports
      FROM reports
    `);
    
    return {
      ...userStats[0],
      ...applicationStats[0],
      ...reportStats[0]
    };
  } catch (error) {
    console.error('❌ Database error in getMembershipOverviewStats:', error);
    throw new Error(`Failed to fetch membership overview: ${error.message}`);
  }
};

// Get all classes
export const getAllClasses = async () => {
  try {
    // Since there's no classes table in your schema, 
    // get unique class IDs from users table
    const [classes] = await db.query(`
      SELECT DISTINCT 
        primary_class_id as class_id,
        primary_class_id as class_name,
        COUNT(*) as member_count
      FROM users 
      WHERE primary_class_id IS NOT NULL
      GROUP BY primary_class_id
      ORDER BY primary_class_id
    `);
    
    return classes;
  } catch (error) {
    console.error('❌ Database error in getAllClasses:', error);
    throw new Error(`Failed to fetch classes: ${error.message}`);
  }
};
