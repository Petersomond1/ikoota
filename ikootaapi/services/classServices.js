// ikootaapi/services/classServices.js
// CLASS MANAGEMENT SERVICES - NEW OTU# FORMAT ONLY
// Strictly uses OTU#XXXXXX format for all class IDs

import db from '../config/db.js';
import CustomError from '../utils/CustomError.js';
import { validateIdFormat } from '../utils/idGenerator.js';

// ===============================================
// ID FORMAT VALIDATION (NEW FORMAT ONLY)
// ===============================================

/**
 * Validates class ID format - NEW FORMAT ONLY: OTU#XXXXXX
 * @param {string} classId - The class ID to validate
 * @returns {boolean} True if valid OTU# format
 */
const validateClassIdFormat = (classId) => {
  if (!classId || typeof classId !== 'string') return false;
  
  // Special case for public class
  if (classId === 'OTU#Public') return true;
  
  // Standard new format: OTU#XXXXXX (10 characters total)
  return validateIdFormat(classId, 'class');
};

/**
 * Formats class ID for display
 * @param {string} classId - The class ID (OTU# format)
 * @returns {string} Formatted display string
 */
const formatClassIdForDisplay = (classId) => {
  if (classId === 'OTU#Public') return 'Public Community';
  return `Class ${classId}`;
};

// ===============================================
// CLASS DISCOVERY & ACCESS SERVICES
// ===============================================

/**
 * Get all classes with filters and pagination
 * NEW FORMAT ONLY: Expects all classes to have OTU# prefix
 */
export const getAllClassesService = async (filters = {}, options = {}) => {
  try {
    const { type, is_public, is_active, search } = filters;
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE c.class_id LIKE "OTU#%"'; // Only OTU# format classes
    const params = [];

    if (type) {
      whereClause += ' AND c.class_type = ?';
      params.push(type);
    }

    if (is_public !== undefined) {
      whereClause += ' AND c.is_public = ?';
      params.push(is_public);
    }

    if (is_active !== undefined) {
      whereClause += ' AND c.is_active = ?';
      params.push(is_active);
    }

    if (search) {
      whereClause += ' AND (c.class_name LIKE ? OR c.public_name LIKE ? OR c.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Get total count
    const countSql = `
      SELECT COUNT(*) as total 
      FROM classes c
      ${whereClause}
    `;
    const [{ total }] = await db.query(countSql, params);

    // Get classes with member counts
    const sql = `
      SELECT 
        c.*,
        COALESCE(cm.total_members, 0) as current_members,
        COALESCE(cm.moderators, 0) as moderator_count,
        COALESCE(cm.pending_members, 0) as pending_count
      FROM classes c
      LEFT JOIN class_member_counts cm ON c.class_id = cm.class_id
      ${whereClause}
      ORDER BY 
        CASE WHEN c.class_id = 'OTU#Public' THEN 0 ELSE 1 END,
        c.createdAt DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(limit, offset);
    const classes = await db.query(sql, params);

    // Add display formatting to each class
    const formattedClasses = classes.map(cls => ({
      ...cls,
      display_id: formatClassIdForDisplay(cls.class_id),
      id_format: 'new_standard' // All classes use new format
    }));

    return {
      data: formattedClasses,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_records: total,
        per_page: limit,
        has_next: page < Math.ceil(total / limit),
        has_previous: page > 1
      }
    };

  } catch (error) {
    console.error('❌ getAllClassesService error:', error);
    throw new CustomError('Failed to fetch classes', 500);
  }
};

/**
 * Get class details by ID (OTU# format only)
 */
export const getClassByIdService = async (classId, userId = null) => {
  try {
    // Validate the class ID format (must be OTU# format)
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
    }

    const sql = `
      SELECT 
        c.*,
        COALESCE(cm.total_members, 0) as current_members,
        COALESCE(cm.moderators, 0) as moderator_count,
        COALESCE(cm.pending_members, 0) as pending_count,
        ${userId ? `
        ucm.membership_status as user_membership_status,
        ucm.role_in_class as user_role,
        ucm.joinedAt as user_joined_at
        ` : 'NULL as user_membership_status, NULL as user_role, NULL as user_joined_at'}
      FROM classes c
      LEFT JOIN class_member_counts cm ON c.class_id = cm.class_id
      ${userId ? `
      LEFT JOIN user_class_memberships ucm ON c.class_id = ucm.class_id AND ucm.user_id = ?
      ` : ''}
      WHERE c.class_id = ? AND c.class_id LIKE "OTU#%"
    `;

    const params = userId ? [userId, classId] : [classId];
    const [classData] = await db.query(sql, params);

    if (classData) {
      classData.display_id = formatClassIdForDisplay(classData.class_id);
      classData.id_format = 'new_standard';
    }

    return classData || null;

  } catch (error) {
    console.error('❌ getClassByIdService error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to fetch class details', 500);
  }
};

/**
 * Get available classes for user (OTU# format only)
 */
export const getAvailableClassesService = async (userId, options = {}) => {
  try {
    const { membershipStage, fullMembershipStatus, type, search, limit = 10 } = options;

    let whereClause = 'WHERE c.is_active = 1 AND c.class_id LIKE "OTU#%"';
    const params = [];

    // Filter by membership requirements
    if (membershipStage === 'pre_member') {
      whereClause += ' AND (c.class_type = "public" OR c.is_public = 1)';
    } else if (membershipStage === 'member' || fullMembershipStatus === 'approved') {
      // Full members can see all active classes
      whereClause += ' AND c.is_active = 1';
    } else {
      // Non-members can only see public classes
      whereClause += ' AND c.is_public = 1';
    }

    if (type) {
      whereClause += ' AND c.class_type = ?';
      params.push(type);
    }

    if (search) {
      whereClause += ' AND (c.class_name LIKE ? OR c.public_name LIKE ? OR c.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Exclude classes user is already a member of
    whereClause += `
      AND c.class_id NOT IN (
        SELECT DISTINCT class_id 
        FROM user_class_memberships 
        WHERE user_id = ? AND membership_status IN ('active', 'pending')
      )
    `;
    params.push(userId);

    const sql = `
      SELECT 
        c.*,
        COALESCE(cm.total_members, 0) as current_members,
        COALESCE(cm.moderators, 0) as moderator_count,
        (c.max_members - COALESCE(cm.total_members, 0)) as available_spots
      FROM classes c
      LEFT JOIN class_member_counts cm ON c.class_id = cm.class_id
      ${whereClause}
      ORDER BY 
        CASE WHEN c.class_id = 'OTU#Public' THEN 0 ELSE 1 END,
        c.createdAt DESC
      LIMIT ?
    `;
    
    params.push(limit);
    const classes = await db.query(sql, params);

    return classes.map(cls => ({
      ...cls,
      display_id: formatClassIdForDisplay(cls.class_id),
      id_format: 'new_standard'
    }));

  } catch (error) {
    console.error('❌ getAvailableClassesService error:', error);
    throw new CustomError('Failed to fetch available classes', 500);
  }
};

/**
 * Get user's enrolled classes (OTU# format only)
 */
export const getUserClassesService = async (userId, options = {}) => {
  try {
    const { status = 'active', include_expired = false } = options;

    let whereClause = 'WHERE ucm.user_id = ? AND c.class_id LIKE "OTU#%"';
    const params = [userId];

    if (status !== 'all') {
      whereClause += ' AND ucm.membership_status = ?';
      params.push(status);
    }

    if (!include_expired) {
      whereClause += ' AND (ucm.expiresAt IS NULL OR ucm.expiresAt > NOW())';
    }

    const sql = `
      SELECT 
        c.*,
        ucm.membership_status,
        ucm.role_in_class,
        ucm.joinedAt,
        ucm.expiresAt,
        ucm.can_see_class_name,
        ucm.receive_notifications,
        COALESCE(cm.total_members, 0) as total_members
      FROM user_class_memberships ucm
      INNER JOIN classes c ON ucm.class_id = c.class_id
      LEFT JOIN class_member_counts cm ON c.class_id = cm.class_id
      ${whereClause}
      ORDER BY 
        CASE WHEN c.class_id = 'OTU#Public' THEN 0 ELSE 1 END,
        ucm.joinedAt DESC
    `;

    const classes = await db.query(sql, params);
    
    return classes.map(cls => ({
      ...cls,
      display_id: formatClassIdForDisplay(cls.class_id),
      id_format: 'new_standard'
    }));

  } catch (error) {
    console.error('❌ getUserClassesService error:', error);
    throw new CustomError('Failed to fetch user classes', 500);
  }
};

/**
 * Join a class (OTU# format validation)
 */
export const joinClassService = async (userId, classId, options = {}) => {
  try {
    const { role_in_class = 'member', receive_notifications = true } = options;

    // Validate class ID format
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
    }

    // Check if class exists and is active (OTU# format only)
    const classSql = `
      SELECT class_id, class_name, is_public, max_members, is_active
      FROM classes 
      WHERE class_id = ? AND is_active = 1 AND class_id LIKE "OTU#%"
    `;
    const [classData] = await db.query(classSql, [classId]);

    if (!classData) {
      throw new CustomError('Class not found, inactive, or invalid format', 404);
    }

    // Check if user is already a member
    const existingSql = `
      SELECT membership_status 
      FROM user_class_memberships 
      WHERE user_id = ? AND class_id = ?
    `;
    const [existing] = await db.query(existingSql, [userId, classId]);

    if (existing) {
      if (existing.membership_status === 'active') {
        throw new CustomError('You are already a member of this class', 400);
      } else if (existing.membership_status === 'pending') {
        throw new CustomError('Your membership request is pending approval', 400);
      }
    }

    // Check capacity
    const capacitySql = `
      SELECT COALESCE(total_members, 0) as current_members
      FROM class_member_counts 
      WHERE class_id = ?
    `;
    const [capacity] = await db.query(capacitySql, [classId]);

    if (capacity && capacity.current_members >= classData.max_members) {
      throw new CustomError('Class is at maximum capacity', 400);
    }

    // Check user's membership status for access permissions
    const userSql = `
      SELECT membership_stage, full_membership_status 
      FROM users 
      WHERE id = ?
    `;
    const [userData] = await db.query(userSql, [userId]);

    if (!classData.is_public && userData.membership_stage !== 'member') {
      throw new CustomError('Full membership required to join this class', 403);
    }

    // Join the class
    const joinSql = `
      INSERT INTO user_class_memberships (
        user_id, class_id, membership_status, role_in_class, 
        receive_notifications, joinedAt
      ) VALUES (?, ?, 'active', ?, ?, NOW())
      ON DUPLICATE KEY UPDATE 
        membership_status = 'active',
        role_in_class = VALUES(role_in_class),
        receive_notifications = VALUES(receive_notifications),
        joinedAt = NOW()
    `;

    await db.query(joinSql, [userId, classId, role_in_class, receive_notifications]);

    return {
      class_id: classId,
      class_name: classData.class_name,
      display_id: formatClassIdForDisplay(classId),
      membership_status: 'active',
      role_in_class,
      joined_at: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ joinClassService error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to join class', 500);
  }
};

/**
 * Leave a class (OTU# format validation)
 */
export const leaveClassService = async (userId, classId, options = {}) => {
  try {
    const { reason } = options;

    // Validate class ID format
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
    }

    // Check if user is a member
    const membershipSql = `
      SELECT membership_status, role_in_class 
      FROM user_class_memberships 
      WHERE user_id = ? AND class_id = ?
    `;
    const [membership] = await db.query(membershipSql, [userId, classId]);

    if (!membership || membership.membership_status !== 'active') {
      throw new CustomError('You are not an active member of this class', 400);
    }

    // Update membership status to indicate leaving
    const leaveSql = `
      UPDATE user_class_memberships 
      SET membership_status = 'expired', updatedAt = NOW()
      WHERE user_id = ? AND class_id = ?
    `;

    await db.query(leaveSql, [userId, classId]);

    // Log the leave action if reason provided
    if (reason) {
      console.log(`User ${userId} left class ${classId}. Reason: ${reason}`);
    }

    return {
      class_id: classId,
      display_id: formatClassIdForDisplay(classId),
      user_id: userId,
      previous_status: membership.membership_status,
      new_status: 'expired',
      left_at: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ leaveClassService error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to leave class', 500);
  }
};

/**
 * Assign user to class (OTU# format validation)
 */
export const assignUserToClassService = async (userId, classId, options = {}) => {
  try {
    const { 
      role_in_class = 'member', 
      assigned_by, 
      receive_notifications = true,
      expires_at 
    } = options;

    // Validate class ID format
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
    }

    // Check if class exists (OTU# format only)
    const classSql = `
      SELECT class_id, class_name, max_members, is_active
      FROM classes 
      WHERE class_id = ? AND is_active = 1 AND class_id LIKE "OTU#%"
    `;
    const [classData] = await db.query(classSql, [classId]);

    if (!classData) {
      throw new CustomError('Class not found, inactive, or invalid format', 404);
    }

    // Check if user exists
    const userSql = `
      SELECT id, username 
      FROM users 
      WHERE id = ?
    `;
    const [userData] = await db.query(userSql, [userId]);

    if (!userData) {
      throw new CustomError('User not found', 404);
    }

    // Check capacity
    const capacitySql = `
      SELECT COALESCE(total_members, 0) as current_members
      FROM class_member_counts 
      WHERE class_id = ?
    `;
    const [capacity] = await db.query(capacitySql, [classId]);

    if (capacity && capacity.current_members >= classData.max_members) {
      throw new CustomError('Class is at maximum capacity', 400);
    }

    // Assign user to class
    const assignSql = `
      INSERT INTO user_class_memberships (
        user_id, class_id, membership_status, role_in_class, 
        assigned_by, receive_notifications, expiresAt, joinedAt
      ) VALUES (?, ?, 'active', ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE 
        membership_status = 'active',
        role_in_class = VALUES(role_in_class),
        assigned_by = VALUES(assigned_by),
        receive_notifications = VALUES(receive_notifications),
        expiresAt = VALUES(expiresAt),
        updatedAt = NOW()
    `;

    await db.query(assignSql, [
      userId, classId, role_in_class, assigned_by, 
      receive_notifications, expires_at
    ]);

    return {
      user_id: userId,
      username: userData.username,
      class_id: classId,
      class_name: classData.class_name,
      display_id: formatClassIdForDisplay(classId),
      membership_status: 'active',
      role_in_class,
      assigned_by,
      assigned_at: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ assignUserToClassService error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to assign user to class', 500);
  }
};

// ===============================================
// REMAINING SERVICES WITH OTU# FORMAT VALIDATION
// ===============================================

// All other service functions (getClassContentService, getClassParticipantsService, 
// markClassAttendanceService, etc.) should be updated similarly to validate OTU# format
// and only work with classes that have the proper OTU#XXXXXX format

/**
 * Legacy function - fetch all classes (OTU# format only)
 */
export const fetchClasses = async () => {
  try {
    const sql = `
      SELECT * FROM classes 
      WHERE is_active = 1 AND class_id LIKE "OTU#%" 
      ORDER BY 
        CASE WHEN class_id = 'OTU#Public' THEN 0 ELSE 1 END,
        createdAt DESC
    `;
    return await db.query(sql);
  } catch (error) {
    console.error('❌ fetchClasses (legacy) error:', error);
    throw new CustomError('Failed to fetch classes', 500);
  }
};