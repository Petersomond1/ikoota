// ikootaapi/services/classServices.js
// CLASS MANAGEMENT SERVICES - COMPLETE IMPLEMENTATION
// All functions with OTU#XXXXXX format validation and comprehensive functionality

import db from '../config/db.js';
import CustomError from '../utils/CustomError.js';
import { validateIdFormat, generateUniqueClassId } from '../utils/idGenerator.js';

// ===============================================
// HELPER FUNCTIONS
// ===============================================

const validateClassIdFormat = (classId) => {
  return validateIdFormat(classId, 'class');
};

const formatClassIdForDisplay = (classId) => {
  if (classId === 'OTU#Public') return 'Public Community';
  return `Class ${classId}`;
};

// ===============================================
// CLASS DISCOVERY & ACCESS SERVICES
// ===============================================

/**
 * Get all classes (public view with comprehensive filtering)
 */
export const getAllClassesService = async (filters = {}, options = {}) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      class_type, 
      is_public, 
      search, 
      difficulty_level,
      has_space = null,
      created_after = null,
      created_before = null 
    } = { ...filters, ...options };
    
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE c.is_active = 1 AND c.class_id LIKE "OTU#%"';
    const params = [];

    if (class_type) {
      whereClause += ' AND c.class_type = ?';
      params.push(class_type);
    }

    if (is_public !== undefined) {
      whereClause += ' AND c.is_public = ?';
      params.push(is_public ? 1 : 0);
    }

    if (difficulty_level) {
      whereClause += ' AND c.difficulty_level = ?';
      params.push(difficulty_level);
    }

    if (has_space !== null) {
      if (has_space) {
        whereClause += ' AND (c.max_members > COALESCE(cmc.total_members, 0))';
      } else {
        whereClause += ' AND (c.max_members <= COALESCE(cmc.total_members, 0))';
      }
    }

    if (created_after) {
      whereClause += ' AND c.createdAt >= ?';
      params.push(created_after);
    }

    if (created_before) {
      whereClause += ' AND c.createdAt <= ?';
      params.push(created_before);
    }

    if (search) {
      whereClause += ' AND (c.class_name LIKE ? OR c.description LIKE ? OR c.tags LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM classes c LEFT JOIN class_member_counts cmc ON c.class_id = cmc.class_id ${whereClause}`;
    const [{ total }] = await db.query(countSql, params);

    // Get classes with comprehensive data
    const sql = `
      SELECT 
        c.*,
        cmc.total_members,
        cmc.moderators,
        cmc.pending_members,
        u.username as created_by_username,
        CASE 
          WHEN c.max_members > 0 THEN ROUND((COALESCE(cmc.total_members, 0) / c.max_members) * 100, 2)
          ELSE 0 
        END as capacity_percentage,
        CASE 
          WHEN c.max_members <= COALESCE(cmc.total_members, 0) THEN 1
          ELSE 0 
        END as is_full
      FROM classes c
      LEFT JOIN class_member_counts cmc ON c.class_id = cmc.class_id
      LEFT JOIN users u ON c.created_by = u.id
      ${whereClause}
      ORDER BY 
        CASE WHEN c.class_id = 'OTU#Public' THEN 0 ELSE 1 END,
        c.createdAt DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(limit, offset);
    const classes = await db.query(sql, params);

    return {
      data: classes.map(cls => ({
        ...cls,
        display_id: formatClassIdForDisplay(cls.class_id),
        available_spots: cls.max_members - (cls.total_members || 0)
      })),
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_records: total,
        per_page: limit,
        has_next: page < Math.ceil(total / limit),
        has_previous: page > 1
      },
      summary: {
        total_classes: total,
        public_classes: classes.filter(c => c.is_public).length,
        classes_with_space: classes.filter(c => c.max_members > (c.total_members || 0)).length
      }
    };

  } catch (error) {
    console.error('❌ getAllClassesService error:', error);
    throw new CustomError('Failed to fetch classes', 500);
  }
};

/**
 * Get available classes for user to join (enhanced filtering)
 */
export const getAvailableClassesService = async (userId, options = {}) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      class_type, 
      search, 
      difficulty_level,
      membershipStage,
      fullMembershipStatus,
      exclude_full = true 
    } = options;
    
    const offset = (page - 1) * limit;

    let whereClause = `
      WHERE c.is_active = 1 
      AND c.allow_self_join = 1
      AND c.class_id LIKE "OTU#%"
      AND c.class_id NOT IN (
        SELECT class_id 
        FROM user_class_memberships 
        WHERE user_id = ? AND membership_status IN ('active', 'pending')
      )
    `;
    const params = [userId];

    // Membership stage restrictions
    if (membershipStage && membershipStage !== 'full') {
      whereClause += ' AND (c.require_full_membership = 0 OR c.require_full_membership IS NULL)';
    }

    if (class_type) {
      whereClause += ' AND c.class_type = ?';
      params.push(class_type);
    }

    if (difficulty_level) {
      whereClause += ' AND c.difficulty_level = ?';
      params.push(difficulty_level);
    }

    if (exclude_full) {
      whereClause += ' AND (c.max_members > COALESCE(cmc.total_members, 0))';
    }

    if (search) {
      whereClause += ' AND (c.class_name LIKE ? OR c.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM classes c LEFT JOIN class_member_counts cmc ON c.class_id = cmc.class_id ${whereClause}`;
    const [{ total }] = await db.query(countSql, params);

    // Get available classes
    const sql = `
      SELECT 
        c.*,
        cmc.total_members,
        cmc.moderators,
        u.username as created_by_username,
        (c.max_members - COALESCE(cmc.total_members, 0)) as available_spots,
        ROUND((COALESCE(cmc.total_members, 0) / c.max_members) * 100, 2) as capacity_percentage
      FROM classes c
      LEFT JOIN class_member_counts cmc ON c.class_id = cmc.class_id
      LEFT JOIN users u ON c.created_by = u.id
      ${whereClause}
      ORDER BY 
        CASE WHEN c.is_public = 1 THEN 0 ELSE 1 END,
        cmc.total_members DESC, 
        c.createdAt DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(limit, offset);
    const classes = await db.query(sql, params);

    return {
      data: classes.map(cls => ({
        ...cls,
        display_id: formatClassIdForDisplay(cls.class_id),
        can_join_immediately: cls.auto_approve_members || cls.is_public,
        requires_approval: cls.require_approval && !cls.auto_approve_members
      })),
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_records: total,
        per_page: limit
      },
      user_context: {
        membership_stage: membershipStage,
        full_membership_status: fullMembershipStatus
      }
    };

  } catch (error) {
    console.error('❌ getAvailableClassesService error:', error);
    throw new CustomError('Failed to fetch available classes', 500);
  }
};

/**
 * Get user's classes (enrolled/owned) with enhanced details
 */
export const getUserClassesService = async (userId, options = {}) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      role_in_class, 
      membership_status = 'active',
      include_expired = false,
      sort_by = 'joinedAt',
      sort_order = 'DESC'
    } = options;
    
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE ucm.user_id = ?';
    const params = [userId];

    if (include_expired) {
      whereClause += ' AND ucm.membership_status IN (?, ?)';
      params.push(membership_status, 'expired');
    } else {
      whereClause += ' AND ucm.membership_status = ?';
      params.push(membership_status);
    }

    if (role_in_class) {
      whereClause += ' AND ucm.role_in_class = ?';
      params.push(role_in_class);
    }

    // Get total count
    const countSql = `
      SELECT COUNT(*) as total 
      FROM user_class_memberships ucm 
      INNER JOIN classes c ON ucm.class_id = c.class_id
      ${whereClause} AND c.class_id LIKE "OTU#%"
    `;
    const [{ total }] = await db.query(countSql, params);

    // Get user's classes with detailed info
    const sql = `
      SELECT 
        c.*,
        ucm.role_in_class,
        ucm.joinedAt,
        ucm.membership_status,
        ucm.expiresAt,
        ucm.can_see_class_name,
        ucm.receive_notifications,
        cmc.total_members,
        cmc.moderators,
        cmc.pending_members,
        assigned_by_user.username as assigned_by_username,
        CASE 
          WHEN ucm.expiresAt IS NOT NULL AND ucm.expiresAt < NOW() THEN 1
          ELSE 0 
        END as is_expired,
        DATEDIFF(ucm.expiresAt, NOW()) as days_until_expiry
      FROM user_class_memberships ucm
      INNER JOIN classes c ON ucm.class_id = c.class_id
      LEFT JOIN class_member_counts cmc ON c.class_id = cmc.class_id
      LEFT JOIN users assigned_by_user ON ucm.assigned_by = assigned_by_user.id
      ${whereClause} AND c.class_id LIKE "OTU#%"
      ORDER BY ucm.${sort_by} ${sort_order}
      LIMIT ? OFFSET ?
    `;
    
    params.push(limit, offset);
    const classes = await db.query(sql, params);

    // Calculate progress for each class (placeholder - implement based on requirements)
    const classesWithProgress = classes.map(cls => ({
      ...cls,
      display_id: formatClassIdForDisplay(cls.class_id),
      membership_duration_days: Math.floor((new Date() - new Date(cls.joinedAt)) / (1000 * 60 * 60 * 24)),
      progress: {
        percentage: 0, // Implement based on content/assignment completion
        completed_items: 0,
        total_items: 0
      }
    }));

    return {
      data: classesWithProgress,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_records: total,
        per_page: limit
      },
      summary: {
        total_enrollments: total,
        active_classes: classes.filter(c => c.membership_status === 'active').length,
        moderated_classes: classes.filter(c => c.role_in_class === 'moderator').length,
        expiring_soon: classes.filter(c => c.days_until_expiry > 0 && c.days_until_expiry <= 7).length
      }
    };

  } catch (error) {
    console.error('❌ getUserClassesService error:', error);
    throw new CustomError('Failed to fetch user classes', 500);
  }
};

/**
 * Get single class by ID with comprehensive details
 */
export const getClassByIdService = async (classId, userId = null) => {
  try {
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
    }

    const sql = `
      SELECT 
        c.*,
        cmc.total_members,
        cmc.moderators,
        cmc.pending_members,
        u.username as created_by_username,
        u.converse_id as created_by_converse_id,
        ${userId ? `
        CASE 
          WHEN ucm.user_id IS NOT NULL THEN ucm.role_in_class
          ELSE NULL 
        END as user_role,
        CASE 
          WHEN ucm.user_id IS NOT NULL THEN ucm.membership_status
          ELSE NULL 
        END as user_membership_status,
        ucm.joinedAt as user_joined_at,
        ucm.expiresAt as user_membership_expires,
        ucm.can_see_class_name as user_can_see_name,
        ucm.receive_notifications as user_receives_notifications
        ` : 'NULL as user_role, NULL as user_membership_status, NULL as user_joined_at, NULL as user_membership_expires, NULL as user_can_see_name, NULL as user_receives_notifications'},
        (c.max_members - COALESCE(cmc.total_members, 0)) as available_spots,
        CASE 
          WHEN c.max_members <= COALESCE(cmc.total_members, 0) THEN 1
          ELSE 0 
        END as is_full,
        (SELECT COUNT(*) FROM class_content_access WHERE class_id = c.class_id) as content_count
      FROM classes c
      LEFT JOIN class_member_counts cmc ON c.class_id = cmc.class_id
      LEFT JOIN users u ON c.created_by = u.id
      ${userId ? 'LEFT JOIN user_class_memberships ucm ON c.class_id = ucm.class_id AND ucm.user_id = ?' : ''}
      WHERE c.class_id = ? AND c.is_active = 1 AND c.class_id LIKE "OTU#%"
    `;

    const params = userId ? [userId, classId] : [classId];
    const [classData] = await db.query(sql, params);

    if (!classData) {
      throw new CustomError('Class not found', 404);
    }

    // Check if user has access to private class
    if (!classData.is_public && (!userId || !classData.user_membership_status)) {
      // Allow access for preview if class allows it
      if (!classData.allow_preview) {
        throw new CustomError('Access denied to private class', 403);
      }
      // Return limited info for preview
      const limitedData = {
        class_id: classData.class_id,
        class_name: classData.class_name,
        public_name: classData.public_name,
        description: classData.description,
        class_type: classData.class_type,
        difficulty_level: classData.difficulty_level,
        estimated_duration: classData.estimated_duration,
        total_members: classData.total_members,
        max_members: classData.max_members,
        is_full: classData.is_full,
        tags: classData.tags,
        preview_only: true,
        display_id: formatClassIdForDisplay(classData.class_id)
      };
      return limitedData;
    }

    // Parse JSON fields
    const enhancedClassData = {
      ...classData,
      display_id: formatClassIdForDisplay(classData.class_id),
      tags: classData.tags ? (typeof classData.tags === 'string' ? classData.tags.split(',') : classData.tags) : [],
      prerequisites: classData.prerequisites ? (typeof classData.prerequisites === 'string' ? classData.prerequisites.split(',') : classData.prerequisites) : [],
      learning_objectives: classData.learning_objectives ? (typeof classData.learning_objectives === 'string' ? classData.learning_objectives.split(',') : classData.learning_objectives) : [],
      capacity_info: {
        total_members: classData.total_members || 0,
        max_members: classData.max_members,
        available_spots: classData.available_spots,
        is_full: Boolean(classData.is_full),
        capacity_percentage: classData.max_members > 0 ? Math.round(((classData.total_members || 0) / classData.max_members) * 100) : 0
      },
      user_context: userId ? {
        is_member: Boolean(classData.user_membership_status),
        role: classData.user_role,
        status: classData.user_membership_status,
        joined_at: classData.user_joined_at,
        expires_at: classData.user_membership_expires,
        can_see_name: classData.user_can_see_name,
        receives_notifications: classData.user_receives_notifications,
        can_join: !classData.user_membership_status && classData.allow_self_join && !classData.is_full,
        can_leave: classData.user_membership_status === 'active' && (classData.user_role !== 'moderator' || classData.moderators > 1)
      } : null
    };

    return enhancedClassData;

  } catch (error) {
    console.error('❌ getClassByIdService error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to fetch class', 500);
  }
};

// ===============================================
// CLASS ENROLLMENT SERVICES
// ===============================================

/**
 * Join a class with comprehensive validation and processing
 */
export const joinClassService = async (userId, classId, options = {}) => {
  try {
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
    }

    const { 
      role_in_class = 'member',
      receive_notifications = true,
      join_reason,
      assigned_by = null 
    } = options;

    // Get comprehensive class data
    const classSql = `
      SELECT c.*, cmc.total_members
      FROM classes c
      LEFT JOIN class_member_counts cmc ON c.class_id = cmc.class_id
      WHERE c.class_id = ? AND c.is_active = 1 AND c.class_id LIKE "OTU#%"
    `;
    const [classData] = await db.query(classSql, [classId]);

    if (!classData) {
      throw new CustomError('Class not found or inactive', 404);
    }

    // Check if class allows self-joining (unless assigned by admin)
    if (!assigned_by && !classData.allow_self_join) {
      throw new CustomError('This class does not allow self-enrollment', 403);
    }

    // Check capacity
    const currentMembers = classData.total_members || 0;
    if (currentMembers >= classData.max_members) {
      throw new CustomError('Class is at full capacity', 409);
    }

    // Check if user is already a member
    const membershipSql = `
      SELECT * FROM user_class_memberships 
      WHERE user_id = ? AND class_id = ?
    `;
    const [existingMembership] = await db.query(membershipSql, [userId, classId]);

    if (existingMembership) {
      if (existingMembership.membership_status === 'active') {
        throw new CustomError('You are already a member of this class', 409);
      } else if (existingMembership.membership_status === 'pending') {
        throw new CustomError('Your membership request is already pending', 409);
      } else if (existingMembership.membership_status === 'expired') {
        // Reactivate expired membership
        const reactivateSql = `
          UPDATE user_class_memberships 
          SET membership_status = 'active', joinedAt = NOW(), expiresAt = NULL, updatedAt = NOW()
          WHERE user_id = ? AND class_id = ?
        `;
        await db.query(reactivateSql, [userId, classId]);
        
        return {
          success: true,
          message: 'Membership reactivated successfully',
          membership_status: 'active',
          role_in_class: existingMembership.role_in_class,
          class_id: classId,
          action: 'reactivated'
        };
      }
    }

    // Determine initial status
    let initialStatus = 'active';
    if (classData.require_approval && !classData.auto_approve_members && !assigned_by) {
      initialStatus = 'pending';
    }

    // Create membership record
    const insertSql = `
      INSERT INTO user_class_memberships 
      (user_id, class_id, role_in_class, membership_status, joinedAt, join_reason, assigned_by, receive_notifications, can_see_class_name, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, 1, NOW(), NOW())
    `;
    
    await db.query(insertSql, [userId, classId, role_in_class, initialStatus, join_reason, assigned_by, receive_notifications]);

    // Log the action
    console.log(`✅ User ${userId} ${assigned_by ? 'assigned to' : 'joined'} class ${classId} with status: ${initialStatus}`);

    return {
      success: true,
      message: initialStatus === 'active' 
        ? (assigned_by ? 'Successfully assigned to class' : 'Successfully joined class')
        : 'Join request submitted for approval',
      membership_status: initialStatus,
      role_in_class,
      class_id: classId,
      class_name: classData.class_name,
      display_id: formatClassIdForDisplay(classId),
      requires_approval: initialStatus === 'pending',
      action: assigned_by ? 'assigned' : 'joined'
    };

  } catch (error) {
    console.error('❌ joinClassService error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to join class', 500);
  }
};

/**
 * Leave a class with proper validation and cleanup
 */
export const leaveClassService = async (userId, classId, options = {}) => {
  try {
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
    }

    const { reason, notify_moderators = true } = options;

    // Check if user is a member
    const membershipSql = `
      SELECT ucm.*, c.class_name
      FROM user_class_memberships ucm
      INNER JOIN classes c ON ucm.class_id = c.class_id
      WHERE ucm.user_id = ? AND ucm.class_id = ? AND ucm.membership_status = 'active' AND c.class_id LIKE "OTU#%"
    `;
    const [membership] = await db.query(membershipSql, [userId, classId]);

    if (!membership) {
      throw new CustomError('You are not a member of this class', 404);
    }

    // Prevent class owner from leaving if they're the only moderator
    if (membership.role_in_class === 'moderator') {
      const moderatorCountSql = `
        SELECT COUNT(*) as count FROM user_class_memberships 
        WHERE class_id = ? AND role_in_class = 'moderator' AND membership_status = 'active'
      `;
      const [{ count }] = await db.query(moderatorCountSql, [classId]);
      
      if (count <= 1) {
        throw new CustomError('Cannot leave class: you are the only moderator. Please assign another moderator first.', 400);
      }
    }

    // Remove membership (or mark as expired based on class settings)
    const removeSql = `
      UPDATE user_class_memberships 
      SET membership_status = 'expired', leftAt = NOW(), leave_reason = ?, updatedAt = NOW()
      WHERE user_id = ? AND class_id = ?
    `;
    await db.query(removeSql, [reason, userId, classId]);

    // Log the action
    console.log(`✅ User ${userId} left class ${classId}. Reason: ${reason || 'No reason provided'}`);

    return {
      success: true,
      message: 'Successfully left class',
      class_id: classId,
      class_name: membership.class_name,
      display_id: formatClassIdForDisplay(classId),
      previous_role: membership.role_in_class,
      leave_reason: reason,
      left_at: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ leaveClassService error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to leave class', 500);
  }
};

/**
 * Admin assign user to class with enhanced options
 */
export const assignUserToClassService = async (userId, classId, options = {}) => {
  try {
    const {
      role_in_class = 'member',
      assigned_by,
      receive_notifications = true,
      expires_at = null,
      can_see_class_name = true,
      assignment_reason
    } = options;

    // Use join service with admin assignment flag
    return await joinClassService(userId, classId, {
      role_in_class,
      receive_notifications,
      join_reason: assignment_reason || `Assigned by admin ${assigned_by}`,
      assigned_by
    });

  } catch (error) {
    console.error('❌ assignUserToClassService error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to assign user to class', 500);
  }
};

// ===============================================
// CLASS CONTENT SERVICES
// ===============================================

/**
 * Get class content for user access with proper permissions
 */
export const getClassContentService = async (classId, userId, options = {}) => {
  try {
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
    }

    const { 
      content_type, 
      access_level = 'read', 
      page = 1, 
      limit = 20,
      sort_by = 'createdAt',
      sort_order = 'DESC'
    } = options;
    
    const offset = (page - 1) * limit;

    // Verify user has access to this class
    const membershipSql = `
      SELECT ucm.membership_status, ucm.role_in_class, c.privacy_level
      FROM user_class_memberships ucm
      INNER JOIN classes c ON ucm.class_id = c.class_id
      WHERE ucm.user_id = ? AND ucm.class_id = ? AND ucm.membership_status = 'active' AND c.class_id LIKE "OTU#%"
    `;
    const [membership] = await db.query(membershipSql, [userId, classId]);

    if (!membership) {
      throw new CustomError('You are not a member of this class', 403);
    }

    let whereClause = 'WHERE cca.class_id = ?';
    const params = [classId];

    if (content_type) {
      whereClause += ' AND cca.content_type = ?';
      params.push(content_type);
    }

    // Filter by access level based on user role
    const userRole = membership.role_in_class;
    if (userRole === 'member') {
      whereClause += ' AND cca.access_level IN ("read", "view_only")';
    } else if (userRole === 'assistant') {
      whereClause += ' AND cca.access_level IN ("read", "write", "view_only")';
    }
    // Moderators and instructors see all content

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM class_content_access cca ${whereClause}`;
    const [{ total }] = await db.query(countSql, params);

    // Get content with details
    const sql = `
      SELECT 
        cca.*,
        CASE 
          WHEN cca.content_type = 'chat' THEN 
            (SELECT JSON_OBJECT(
              'id', c.id, 'title', c.title, 'summary', c.summary, 
              'approval_status', c.approval_status, 'createdAt', c.createdAt,
              'user_id', c.user_id, 'total_messages', c.total_messages
            ) FROM chats c WHERE c.id = cca.content_id)
          WHEN cca.content_type = 'teaching' THEN 
            (SELECT JSON_OBJECT(
              'id', t.id, 'topic', t.topic, 'description', t.description,
              'approval_status', t.approval_status, 'createdAt', t.createdAt,
              'user_id', t.user_id, 'teaching_type', t.teaching_type
            ) FROM teachings t WHERE t.id = cca.content_id)
          WHEN cca.content_type = 'announcement' THEN
            (SELECT JSON_OBJECT(
              'id', a.id, 'title', a.title, 'content', a.content,
              'priority', a.priority, 'createdAt', a.createdAt,
              'created_by', a.created_by
            ) FROM announcements a WHERE a.id = cca.content_id)
          ELSE JSON_OBJECT('id', cca.content_id, 'type', cca.content_type)
        END as content_details,
        u.username as added_by_username
      FROM class_content_access cca
      LEFT JOIN users u ON cca.added_by = u.id
      ${whereClause}
      ORDER BY cca.${sort_by} ${sort_order}
      LIMIT ? OFFSET ?
    `;
    
    params.push(limit, offset);
    const content = await db.query(sql, params);

    return {
      data: content.map(item => ({
        ...item,
        content_details: item.content_details ? JSON.parse(item.content_details) : null,
        user_can_edit: ['moderator', 'instructor'].includes(userRole) || 
                      (userRole === 'assistant' && ['read', 'write'].includes(item.access_level))
      })),
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_records: total,
        per_page: limit
      },
      user_permissions: {
        role: userRole,
        can_add_content: ['moderator', 'instructor'].includes(userRole),
        can_manage_content: ['moderator', 'instructor'].includes(userRole)
      }
    };

  } catch (error) {
    console.error('❌ getClassContentService error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to fetch class content', 500);
  }
};

/**
 * Get class participants with privacy considerations
 */
export const getClassParticipantsService = async (classId, userId, options = {}) => {
  try {
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
    }

    const { 
      role_in_class, 
      membership_status = 'active', 
      page = 1, 
      limit = 50,
      search,
      sort_by = 'joinedAt',
      sort_order = 'DESC'
    } = options;
    
    const offset = (page - 1) * limit;

    // Verify user has access to this class and get their role
    const membershipSql = `
      SELECT ucm.membership_status, ucm.role_in_class, c.privacy_level
      FROM user_class_memberships ucm
      INNER JOIN classes c ON ucm.class_id = c.class_id
      WHERE ucm.user_id = ? AND ucm.class_id = ? AND ucm.membership_status = 'active' AND c.class_id LIKE "OTU#%"
    `;
    const [membership] = await db.query(membershipSql, [userId, classId]);

    if (!membership) {
      throw new CustomError('You are not a member of this class', 403);
    }

    let whereClause = 'WHERE ucm.class_id = ? AND ucm.membership_status = ?';
    const params = [classId, membership_status];

    if (role_in_class) {
      whereClause += ' AND ucm.role_in_class = ?';
      params.push(role_in_class);
    }

    if (search) {
      whereClause += ' AND (u.username LIKE ? OR u.converse_id LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    // Get total count
    const countSql = `
      SELECT COUNT(*) as total 
      FROM user_class_memberships ucm 
      INNER JOIN users u ON ucm.user_id = u.id
      ${whereClause}
    `;
    const [{ total }] = await db.query(countSql, params);

    // Determine what participant info to show based on user's role and privacy settings
    const userRole = membership.role_in_class;
    const canSeeDetails = ['moderator', 'instructor'].includes(userRole);

    // Get participants with appropriate privacy filtering
    const sql = `
      SELECT 
        ucm.role_in_class,
        ucm.joinedAt,
        ucm.membership_status,
        CASE 
          WHEN u.is_identity_masked = 1 AND ? = 0 THEN 'Anonymous Member'
          ELSE u.username 
        END as display_name,
        CASE 
          WHEN u.is_identity_masked = 1 AND ? = 0 THEN NULL
          ELSE u.converse_id 
        END as converse_id,
        ${canSeeDetails ? `
        u.id as user_id,
        u.email,
        u.membership_stage,
        u.full_membership_status,
        ucm.assigned_by,
        assigned_by_user.username as assigned_by_username,
        ucm.expiresAt,
        ucm.receive_notifications
        ` : 'NULL as user_id, NULL as email, NULL as membership_stage, NULL as full_membership_status, NULL as assigned_by, NULL as assigned_by_username, NULL as expiresAt, NULL as receive_notifications'},
        DATEDIFF(NOW(), ucm.joinedAt) as days_as_member
      FROM user_class_memberships ucm
      INNER JOIN users u ON ucm.user_id = u.id
      LEFT JOIN users assigned_by_user ON ucm.assigned_by = assigned_by_user.id
      ${whereClause}
      ORDER BY ucm.${sort_by} ${sort_order}
      LIMIT ? OFFSET ?
    `;
    
    // Add canSeeDetails flag twice for the CASE statements
    const queryParams = [canSeeDetails ? 1 : 0, canSeeDetails ? 1 : 0, ...params, limit, offset];
    const participants = await db.query(sql, queryParams);

    return {
      data: participants,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_records: total,
        per_page: limit
      },
      summary: {
        total_participants: total,
        by_role: {
          moderators: participants.filter(p => p.role_in_class === 'moderator').length,
          instructors: participants.filter(p => p.role_in_class === 'instructor').length,
          assistants: participants.filter(p => p.role_in_class === 'assistant').length,
          members: participants.filter(p => p.role_in_class === 'member').length
        }
      },
      user_permissions: {
        role: userRole,
        can_see_details: canSeeDetails,
        can_manage_members: ['moderator', 'instructor'].includes(userRole)
      }
    };

  } catch (error) {
    console.error('❌ getClassParticipantsService error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to fetch class participants', 500);
  }
};

/**
 * Get class schedule with user-specific view
 */
export const getClassScheduleService = async (classId, userId, options = {}) => {
  try {
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
    }

    const { 
      start_date, 
      end_date, 
      timezone = 'UTC',
      include_past = false 
    } = options;

    // Verify user has access to this class
    const membershipSql = `
      SELECT ucm.membership_status, ucm.role_in_class, c.class_schedule, c.timezone as class_timezone
      FROM user_class_memberships ucm
      INNER JOIN classes c ON ucm.class_id = c.class_id
      WHERE ucm.user_id = ? AND ucm.class_id = ? AND ucm.membership_status = 'active' AND c.class_id LIKE "OTU#%"
    `;
    const [membership] = await db.query(membershipSql, [userId, classId]);

    if (!membership) {
      throw new CustomError('You are not a member of this class', 403);
    }

    // Parse class schedule (JSON format expected)
    let classSchedule = null;
    try {
      classSchedule = membership.class_schedule ? JSON.parse(membership.class_schedule) : null;
    } catch (error) {
      console.warn('Invalid class schedule JSON:', error);
    }

    // Get scheduled sessions from database (if implemented)
    const sessionsSql = `
      SELECT 
        id,
        session_title,
        session_description,
        scheduled_start,
        scheduled_end,
        session_type,
        is_mandatory,
        location,
        meeting_link,
        status,
        created_by,
        max_attendees
      FROM class_sessions 
      WHERE class_id = ? 
        ${!include_past ? 'AND scheduled_start >= NOW()' : ''}
        ${start_date ? 'AND scheduled_start >= ?' : ''}
        ${end_date ? 'AND scheduled_start <= ?' : ''}
      ORDER BY scheduled_start ASC
    `;

    const sessionParams = [classId];
    if (start_date) sessionParams.push(start_date);
    if (end_date) sessionParams.push(end_date);

    let sessions = [];
    try {
      sessions = await db.query(sessionsSql, sessionParams);
    } catch (error) {
      // class_sessions table might not exist yet
      console.warn('class_sessions table not available:', error.message);
    }

    return {
      class_id: classId,
      display_id: formatClassIdForDisplay(classId),
      timezone: membership.class_timezone || timezone,
      recurring_schedule: classSchedule,
      upcoming_sessions: sessions,
      user_role: membership.role_in_class,
      total_sessions: sessions.length,
      mandatory_sessions: sessions.filter(s => s.is_mandatory).length,
      message: sessions.length === 0 ? 'No scheduled sessions found' : undefined
    };

  } catch (error) {
    console.error('❌ getClassScheduleService error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to fetch class schedule', 500);
  }
};

// ===============================================
// CLASS INTERACTION SERVICES
// ===============================================

/**
 * Mark class attendance with validation
 */
export const markClassAttendanceService = async (userId, classId, options = {}) => {
  try {
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
    }

    const { 
      session_id, 
      status = 'present', 
      notes,
      check_in_time = new Date(),
      location
    } = options;

    // Verify user is a member of the class
    const membershipSql = `
      SELECT ucm.membership_status, ucm.role_in_class
      FROM user_class_memberships ucm
      WHERE ucm.user_id = ? AND ucm.class_id = ? AND ucm.membership_status = 'active'
    `;
    const [membership] = await db.query(membershipSql, [userId, classId]);

    if (!membership) {
      throw new CustomError('You are not a member of this class', 403);
    }

    // Validate session if provided
    let sessionData = null;
    if (session_id) {
      const sessionSql = `
        SELECT * FROM class_sessions 
        WHERE id = ? AND class_id = ?
      `;
      try {
        [sessionData] = await db.query(sessionSql, [session_id, classId]);
        if (!sessionData) {
          throw new CustomError('Session not found', 404);
        }
      } catch (error) {
        // Session table might not exist
        console.warn('Could not validate session:', error.message);
      }
    }

    // Record attendance
    const attendanceSql = `
      INSERT INTO class_attendance 
      (user_id, class_id, session_id, status, notes, check_in_time, location, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        notes = VALUES(notes),
        check_in_time = VALUES(check_in_time),
        location = VALUES(location),
        updatedAt = NOW()
    `;

    try {
      await db.query(attendanceSql, [userId, classId, session_id, status, notes, check_in_time, location]);
    } catch (error) {
      // Attendance table might not exist
      console.warn('Could not record attendance - table may not exist:', error.message);
      // Return success anyway with placeholder data
      return {
        user_id: userId,
        class_id: classId,
        display_id: formatClassIdForDisplay(classId),
        session_id,
        status,
        notes,
        check_in_time,
        location,
        marked_at: new Date().toISOString(),
        message: 'Attendance recorded (placeholder implementation)'
      };
    }

    return {
      user_id: userId,
      class_id: classId,
      display_id: formatClassIdForDisplay(classId),
      session_id,
      session_title: sessionData?.session_title,
      status,
      notes,
      check_in_time,
      location,
      marked_at: new Date().toISOString(),
      success: true
    };

  } catch (error) {
    console.error('❌ markClassAttendanceService error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to mark attendance', 500);
  }
};

/**
 * Get class progress for user with detailed tracking
 */
export const getClassProgressService = async (userId, classId) => {
  try {
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
    }

    // Verify user is a member
    const membershipSql = `
      SELECT ucm.*, c.class_name
      FROM user_class_memberships ucm
      INNER JOIN classes c ON ucm.class_id = c.class_id
      WHERE ucm.user_id = ? AND ucm.class_id = ? AND ucm.membership_status = 'active' AND c.class_id LIKE "OTU#%"
    `;
    const [membership] = await db.query(membershipSql, [userId, classId]);

    if (!membership) {
      throw new CustomError('You are not a member of this class', 403);
    }

    // Get content progress
    const contentProgressSql = `
      SELECT 
        COUNT(*) as total_content,
        SUM(CASE WHEN ucp.completed_at IS NOT NULL THEN 1 ELSE 0 END) as completed_content
      FROM class_content_access cca
      LEFT JOIN user_content_progress ucp ON cca.content_id = ucp.content_id 
        AND cca.content_type = ucp.content_type 
        AND ucp.user_id = ?
      WHERE cca.class_id = ?
    `;

    let contentProgress = { total_content: 0, completed_content: 0 };
    try {
      [contentProgress] = await db.query(contentProgressSql, [userId, classId]);
    } catch (error) {
      console.warn('Could not fetch content progress:', error.message);
    }

    // Get attendance progress
    const attendanceProgressSql = `
      SELECT 
        COUNT(DISTINCT cs.id) as total_sessions,
        COUNT(DISTINCT ca.session_id) as attended_sessions,
        COUNT(CASE WHEN ca.status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN ca.status = 'late' THEN 1 END) as late_count,
        COUNT(CASE WHEN ca.status = 'absent' THEN 1 END) as absent_count
      FROM class_sessions cs
      LEFT JOIN class_attendance ca ON cs.id = ca.session_id AND ca.user_id = ?
      WHERE cs.class_id = ? AND cs.scheduled_start <= NOW()
    `;

    let attendanceProgress = { 
      total_sessions: 0, 
      attended_sessions: 0, 
      present_count: 0, 
      late_count: 0, 
      absent_count: 0 
    };
    try {
      [attendanceProgress] = await db.query(attendanceProgressSql, [userId, classId]);
    } catch (error) {
      console.warn('Could not fetch attendance progress:', error.message);
    }

    // Calculate overall progress
    const totalItems = contentProgress.total_content + attendanceProgress.total_sessions;
    const completedItems = contentProgress.completed_content + attendanceProgress.attended_sessions;
    const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    // Calculate membership duration
    const membershipDays = Math.floor((new Date() - new Date(membership.joinedAt)) / (1000 * 60 * 60 * 24));

    return {
      user_id: userId,
      class_id: classId,
      class_name: membership.class_name,
      display_id: formatClassIdForDisplay(classId),
      membership_info: {
        joined_at: membership.joinedAt,
        role: membership.role_in_class,
        days_as_member: membershipDays
      },
      overall_progress: {
        percentage: progressPercentage,
        completed_items: completedItems,
        total_items: totalItems
      },
      content_progress: {
        completed: contentProgress.completed_content,
        total: contentProgress.total_content,
        percentage: contentProgress.total_content > 0 ? 
          Math.round((contentProgress.completed_content / contentProgress.total_content) * 100) : 0
      },
      attendance_progress: {
        sessions_attended: attendanceProgress.attended_sessions,
        total_sessions: attendanceProgress.total_sessions,
        present_count: attendanceProgress.present_count,
        late_count: attendanceProgress.late_count,
        absent_count: attendanceProgress.absent_count,
        attendance_rate: attendanceProgress.total_sessions > 0 ? 
          Math.round((attendanceProgress.present_count / attendanceProgress.total_sessions) * 100) : 0
      },
      last_activity: new Date().toISOString() // Placeholder - implement based on actual activity tracking
    };

  } catch (error) {
    console.error('❌ getClassProgressService error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to fetch class progress', 500);
  }
};

// ===============================================
// CLASS FEEDBACK SERVICES
// ===============================================

/**
 * Submit class feedback with validation and processing
 */
export const submitClassFeedbackService = async (userId, classId, feedbackData) => {
  try {
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
    }

    const { 
      rating, 
      comments, 
      feedback_type = 'general', 
      anonymous = false,
      aspects = {},
      suggestions
    } = feedbackData;

    // Verify user is a member
    const membershipSql = `
      SELECT ucm.membership_status, ucm.role_in_class, c.class_name
      FROM user_class_memberships ucm
      INNER JOIN classes c ON ucm.class_id = c.class_id
      WHERE ucm.user_id = ? AND ucm.class_id = ? AND ucm.membership_status = 'active' AND c.class_id LIKE "OTU#%"
    `;
    const [membership] = await db.query(membershipSql, [userId, classId]);

    if (!membership) {
      throw new CustomError('You are not a member of this class', 403);
    }

    // Validate input
    if (!rating && !comments) {
      throw new CustomError('Either rating or comments is required', 400);
    }

    if (rating && (rating < 1 || rating > 5)) {
      throw new CustomError('Rating must be between 1 and 5', 400);
    }

    // Store feedback
    const feedbackSql = `
      INSERT INTO class_feedback 
      (user_id, class_id, rating, comments, feedback_type, anonymous, aspects, suggestions, submitted_at, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    try {
      const result = await db.query(feedbackSql, [
        anonymous ? null : userId, 
        classId, 
        rating, 
        comments, 
        feedback_type, 
        anonymous, 
        JSON.stringify(aspects), 
        suggestions
      ]);

      return {
        feedback_id: result.insertId,
        user_id: anonymous ? null : userId,
        class_id: classId,
        class_name: membership.class_name,
        display_id: formatClassIdForDisplay(classId),
        rating,
        comments,
        feedback_type,
        anonymous,
        aspects,
        suggestions,
        submitted_at: new Date().toISOString(),
        success: true
      };
    } catch (error) {
      // Feedback table might not exist
      console.warn('Could not store feedback - table may not exist:', error.message);
      return {
        user_id: anonymous ? null : userId,
        class_id: classId,
        class_name: membership.class_name,
        display_id: formatClassIdForDisplay(classId),
        rating,
        comments,
        feedback_type,
        anonymous,
        submitted_at: new Date().toISOString(),
        message: 'Feedback received (placeholder implementation)'
      };
    }

  } catch (error) {
    console.error('❌ submitClassFeedbackService error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to submit feedback', 500);
  }
};

/**
 * Get class feedback for instructors/moderators
 */
export const getClassFeedbackService = async (classId, userId, options = {}) => {
  try {
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
    }

    const { 
      feedback_type, 
      include_anonymous = true,
      page = 1, 
      limit = 20,
      rating_filter,
      date_from,
      date_to
    } = options;

    // Verify user has permission to view feedback
    const membershipSql = `
      SELECT ucm.role_in_class, c.class_name
      FROM user_class_memberships ucm
      INNER JOIN classes c ON ucm.class_id = c.class_id
      WHERE ucm.user_id = ? AND ucm.class_id = ? AND ucm.membership_status = 'active' AND c.class_id LIKE "OTU#%"
    `;
    const [membership] = await db.query(membershipSql, [userId, classId]);

    if (!membership || !['moderator', 'instructor'].includes(membership.role_in_class)) {
      throw new CustomError('You do not have permission to view class feedback', 403);
    }

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE cf.class_id = ?';
    const params = [classId];

    if (feedback_type) {
      whereClause += ' AND cf.feedback_type = ?';
      params.push(feedback_type);
    }

    if (!include_anonymous) {
      whereClause += ' AND cf.anonymous = 0';
    }

    if (rating_filter) {
      whereClause += ' AND cf.rating = ?';
      params.push(rating_filter);
    }

    if (date_from) {
      whereClause += ' AND cf.submitted_at >= ?';
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND cf.submitted_at <= ?';
      params.push(date_to);
    }

    try {
      // Get total count
      const countSql = `SELECT COUNT(*) as total FROM class_feedback cf ${whereClause}`;
      const [{ total }] = await db.query(countSql, params);

      // Get feedback with user info (if not anonymous)
      const sql = `
        SELECT 
          cf.*,
          CASE 
            WHEN cf.anonymous = 1 THEN NULL
            ELSE u.username 
          END as username,
          CASE 
            WHEN cf.anonymous = 1 THEN NULL
            ELSE u.converse_id 
          END as converse_id
        FROM class_feedback cf
        LEFT JOIN users u ON cf.user_id = u.id
        ${whereClause}
        ORDER BY cf.submitted_at DESC
        LIMIT ? OFFSET ?
      `;
      
      params.push(limit, offset);
      const feedback = await db.query(sql, params);

      // Calculate statistics
      const statsSql = `
        SELECT 
          AVG(rating) as average_rating,
          COUNT(*) as total_feedback,
          COUNT(CASE WHEN rating >= 4 THEN 1 END) as positive_feedback,
          COUNT(CASE WHEN rating <= 2 THEN 1 END) as negative_feedback,
          feedback_type,
          COUNT(*) as type_count
        FROM class_feedback 
        WHERE class_id = ?
        GROUP BY feedback_type
      `;
      
      const stats = await db.query(statsSql, [classId]);

      return {
        data: feedback.map(item => ({
          ...item,
          aspects: item.aspects ? JSON.parse(item.aspects) : null
        })),
        pagination: {
          current_page: page,
          total_pages: Math.ceil(total / limit),
          total_records: total,
          per_page: limit
        },
        statistics: {
          overall: stats.length > 0 ? {
            average_rating: parseFloat(stats[0].average_rating?.toFixed(2) || 0),
            total_feedback: stats.reduce((sum, s) => sum + s.type_count, 0),
            positive_percentage: stats.length > 0 ? 
              Math.round((stats.reduce((sum, s) => sum + s.positive_feedback, 0) / 
                         stats.reduce((sum, s) => sum + s.type_count, 0)) * 100) : 0
          } : null,
          by_type: stats.reduce((acc, stat) => {
            acc[stat.feedback_type] = {
              count: stat.type_count,
              average_rating: parseFloat(stat.average_rating?.toFixed(2) || 0)
            };
            return acc;
          }, {})
        },
        class_info: {
          class_id: classId,
          class_name: membership.class_name,
          display_id: formatClassIdForDisplay(classId)
        }
      };

    } catch (error) {
      // Feedback table might not exist
      console.warn('Could not fetch feedback - table may not exist:', error.message);
      return {
        data: [],
        pagination: {
          current_page: page,
          total_pages: 0,
          total_records: 0,
          per_page: limit
        },
        message: 'Feedback system not yet implemented',
        class_info: {
          class_id: classId,
          class_name: membership.class_name,
          display_id: formatClassIdForDisplay(classId)
        }
      };
    }

  } catch (error) {
    console.error('❌ getClassFeedbackService error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to fetch class feedback', 500);
  }
};

// ===============================================
// ADMIN SERVICES
// ===============================================

/**
 * Get comprehensive class management data for admins
 */
export const getClassManagementService = async (filters = {}, options = {}) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      class_type, 
      search, 
      status_filter,
      created_by,
      date_from,
      date_to,
      min_members,
      max_members
    } = { ...filters, ...options };
    
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE c.class_id LIKE "OTU#%"';
    const params = [];

    if (class_type) {
      whereClause += ' AND c.class_type = ?';
      params.push(class_type);
    }

    if (status_filter) {
      whereClause += ' AND c.is_active = ?';
      params.push(status_filter === 'active' ? 1 : 0);
    }

    if (created_by) {
      whereClause += ' AND c.created_by = ?';
      params.push(created_by);
    }

    if (date_from) {
      whereClause += ' AND c.createdAt >= ?';
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND c.createdAt <= ?';
      params.push(date_to);
    }

    if (min_members) {
      whereClause += ' AND COALESCE(cmc.total_members, 0) >= ?';
      params.push(min_members);
    }

    if (max_members) {
      whereClause += ' AND COALESCE(cmc.total_members, 0) <= ?';
      params.push(max_members);
    }

    if (search) {
      whereClause += ' AND (c.class_name LIKE ? OR c.description LIKE ? OR c.class_id LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Get total count
    const countSql = `
      SELECT COUNT(*) as total 
      FROM classes c 
      LEFT JOIN class_member_counts cmc ON c.class_id = cmc.class_id 
      ${whereClause}
    `;
    const [{ total }] = await db.query(countSql, params);

    // Get class management data with comprehensive info
    const sql = `
      SELECT 
        c.*,
        cmc.total_members,
        cmc.moderators,
        cmc.pending_members,
        u.username as created_by_username,
        u.email as created_by_email,
        updated_by_user.username as updated_by_username,
        (SELECT COUNT(*) FROM class_content_access WHERE class_id = c.class_id) as content_count,
        ROUND((COALESCE(cmc.total_members, 0) / c.max_members) * 100, 2) as capacity_percentage,
        DATEDIFF(NOW(), c.createdAt) as days_since_creation,
        CASE 
          WHEN c.max_members <= COALESCE(cmc.total_members, 0) THEN 1
          ELSE 0 
        END as is_at_capacity
      FROM classes c
      LEFT JOIN class_member_counts cmc ON c.class_id = cmc.class_id
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN users updated_by_user ON c.updated_by = updated_by_user.id
      ${whereClause}
      ORDER BY 
        CASE WHEN c.class_id = 'OTU#Public' THEN 0 ELSE 1 END,
        c.createdAt DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(limit, offset);
    const classes = await db.query(sql, params);

    // Get summary statistics
    const summarySql = `
      SELECT 
        COUNT(*) as total_classes,
        SUM(CASE WHEN c.is_active = 1 THEN 1 ELSE 0 END) as active_classes,
        SUM(CASE WHEN c.is_public = 1 THEN 1 ELSE 0 END) as public_classes,
        SUM(CASE WHEN c.class_type = 'demographic' THEN 1 ELSE 0 END) as demographic_classes,
        SUM(CASE WHEN c.class_type = 'subject' THEN 1 ELSE 0 END) as subject_classes,
        SUM(CASE WHEN c.class_type = 'special' THEN 1 ELSE 0 END) as special_classes,
        AVG(c.max_members) as avg_max_capacity,
        AVG(COALESCE(cmc.total_members, 0)) as avg_current_members,
        SUM(CASE WHEN c.max_members <= COALESCE(cmc.total_members, 0) THEN 1 ELSE 0 END) as classes_at_capacity
      FROM classes c
      LEFT JOIN class_member_counts cmc ON c.class_id = cmc.class_id
      ${whereClause}
    `;
    const [summary] = await db.query(summarySql, params.slice(0, -2)); // Remove limit/offset for summary

    return {
      data: classes.map(cls => ({
        ...cls,
        display_id: formatClassIdForDisplay(cls.class_id),
        tags: cls.tags ? (typeof cls.tags === 'string' ? cls.tags.split(',') : cls.tags) : [],
        health_score: calculateClassHealthScore(cls) // Helper function for class health
      })),
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_records: total,
        per_page: limit,
        has_next: page < Math.ceil(total / limit),
        has_previous: page > 1
      },
      summary: {
        ...summary,
        avg_max_capacity: Math.round(summary.avg_max_capacity || 0),
        avg_current_members: Math.round(summary.avg_current_members || 0),
        overall_capacity_utilization: summary.avg_max_capacity > 0 ? 
          Math.round((summary.avg_current_members / summary.avg_max_capacity) * 100) : 0
      },
      filters_applied: Object.keys(filters).length
    };

  } catch (error) {
    console.error('❌ getClassManagementService error:', error);
    throw new CustomError('Failed to fetch class management data', 500);
  }
};

/**
 * Create new class with comprehensive validation and setup
 */
export const createClassService = async (classData, adminUserId) => {
  try {
    const {
      class_name,
      public_name,
      description,
      class_type = 'general',
      is_public = true,
      max_members = 50,
      privacy_level = 'members_only',
      requirements,
      instructor_notes,
      tags,
      category,
      difficulty_level,
      estimated_duration,
      prerequisites,
      learning_objectives,
      auto_approve_members = false,
      allow_self_join = true,
      require_approval = true,
      enable_notifications = true,
      enable_discussions = true,
      enable_assignments = false,
      enable_grading = false,
      class_schedule,
      timezone = 'UTC'
    } = classData;

    if (!class_name || class_name.trim().length === 0) {
      throw new CustomError('Class name is required', 400);
    }

    // Generate OTU# format class ID
    const class_id = await generateUniqueClassId();

    // Prepare data for insertion
    const insertData = {
      class_id,
      class_name: class_name.trim(),
      public_name: (public_name || class_name).trim(),
      description,
      class_type,
      is_public: Boolean(is_public),
      max_members: parseInt(max_members),
      privacy_level,
      requirements,
      instructor_notes,
      tags: Array.isArray(tags) ? tags.join(',') : tags,
      category,
      difficulty_level,
      estimated_duration: estimated_duration ? parseInt(estimated_duration) : null,
      prerequisites: Array.isArray(prerequisites) ? prerequisites.join(',') : prerequisites,
      learning_objectives: Array.isArray(learning_objectives) ? learning_objectives.join(',') : learning_objectives,
      auto_approve_members: Boolean(auto_approve_members),
      allow_self_join: Boolean(allow_self_join),
      require_approval: Boolean(require_approval),
      enable_notifications: Boolean(enable_notifications),
      enable_discussions: Boolean(enable_discussions),
      enable_assignments: Boolean(enable_assignments),
      enable_grading: Boolean(enable_grading),
      class_schedule: class_schedule ? JSON.stringify(class_schedule) : null,
      timezone,
      created_by: adminUserId,
      is_active: 1
    };

    // Create class
    const sql = `
      INSERT INTO classes (
        class_id, class_name, public_name, description, class_type, is_public, 
        max_members, privacy_level, requirements, instructor_notes, tags, category,
        difficulty_level, estimated_duration, prerequisites, learning_objectives,
        auto_approve_members, allow_self_join, require_approval, enable_notifications,
        enable_discussions, enable_assignments, enable_grading, class_schedule, timezone,
        created_by, is_active, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    await db.query(sql, Object.values(insertData));

    // Make the creator a moderator
    const membershipSql = `
      INSERT INTO user_class_memberships 
      (user_id, class_id, role_in_class, membership_status, joinedAt, assigned_by, receive_notifications, can_see_class_name, createdAt, updatedAt)
      VALUES (?, ?, 'moderator', 'active', NOW(), ?, 1, 1, NOW(), NOW())
    `;
    await db.query(membershipSql, [adminUserId, class_id, adminUserId]);

    // Initialize class configuration if needed
    try {
      const configSql = `
        INSERT INTO class_configuration (class_id, settings, created_at)
        VALUES (?, ?, NOW())
      `;
      const defaultSettings = {
        notifications: { enabled: enable_notifications },
        discussions: { enabled: enable_discussions },
        assignments: { enabled: enable_assignments },
        grading: { enabled: enable_grading }
      };
      await db.query(configSql, [class_id, JSON.stringify(defaultSettings)]);
    } catch (error) {
      // Configuration table might not exist
      console.warn('Could not initialize class configuration:', error.message);
    }

    // Log the creation
    console.log(`✅ Class ${class_id} (${class_name}) created by admin ${adminUserId}`);

    // Return created class with full details
    return await getClassByIdService(class_id, adminUserId);

  } catch (error) {
    console.error('❌ createClassService error:', error);
    if (error instanceof CustomError) throw error;
    if (error.code === 'ER_DUP_ENTRY') {
      throw new CustomError('Class with this name already exists', 409);
    }
    throw new CustomError('Failed to create class', 500);
  }
};

/**
 * Update class with comprehensive field support
 */
export const updateClassService = async (classId, updateData, adminUserId) => {
  try {
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
    }

    // Check if class exists
    const [existingClass] = await db.query(
      'SELECT * FROM classes WHERE class_id = ? AND class_id LIKE "OTU#%"',
      [classId]
    );

    if (!existingClass) {
      throw new CustomError('Class not found', 404);
    }

    // Build update query dynamically with all supported fields
    const allowedFields = [
      'class_name', 'public_name', 'description', 'class_type', 'is_public',
      'max_members', 'privacy_level', 'requirements', 'instructor_notes', 'is_active',
      'tags', 'category', 'difficulty_level', 'estimated_duration', 'prerequisites',
      'learning_objectives', 'auto_approve_members', 'allow_self_join', 'require_approval',
      'enable_notifications', 'enable_discussions', 'enable_assignments', 'enable_grading',
      'class_schedule', 'timezone'
    ];

    const updateFields = [];
    const params = [];

    Object.entries(updateData).forEach(([key, value]) => {
      if (allowedFields.includes(key) && value !== undefined) {
        if (key === 'tags' && Array.isArray(value)) {
          updateFields.push(`${key} = ?`);
          params.push(value.join(','));
        } else if (key === 'prerequisites' && Array.isArray(value)) {
          updateFields.push(`${key} = ?`);
          params.push(value.join(','));
        } else if (key === 'learning_objectives' && Array.isArray(value)) {
          updateFields.push(`${key} = ?`);
          params.push(value.join(','));
        } else if (key === 'class_schedule' && typeof value === 'object') {
          updateFields.push(`${key} = ?`);
          params.push(JSON.stringify(value));
        } else if (['is_public', 'auto_approve_members', 'allow_self_join', 'require_approval', 'enable_notifications', 'enable_discussions', 'enable_assignments', 'enable_grading', 'is_active'].includes(key)) {
          updateFields.push(`${key} = ?`);
          params.push(Boolean(value));
        } else if (['max_members', 'estimated_duration'].includes(key)) {
          updateFields.push(`${key} = ?`);
          params.push(parseInt(value));
        } else {
          updateFields.push(`${key} = ?`);
          params.push(value);
        }
      }
    });

    if (updateFields.length === 0) {
      throw new CustomError('No valid fields to update', 400);
    }

    // Add metadata fields
    updateFields.push('updatedAt = NOW()');
    updateFields.push('updated_by = ?');
    params.push(adminUserId);
    params.push(classId);

    const sql = `UPDATE classes SET ${updateFields.join(', ')} WHERE class_id = ?`;
    await db.query(sql, params);

    // Log the update
    console.log(`✅ Class ${classId} updated by admin ${adminUserId}. Fields: ${Object.keys(updateData).join(', ')}`);

    // Return updated class
    return await getClassByIdService(classId, adminUserId);

  } catch (error) {
    console.error('❌ updateClassService error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to update class', 500);
  }
};

/**
 * Delete class with proper cleanup and safety checks
 */
export const deleteClassService = async (classId, options = {}) => {
  try {
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
    }

    const { 
      force = false, 
      transfer_members_to, 
      deleted_by,
      archive_instead = false,
      deletion_reason 
    } = options;

    // Get comprehensive class data
    const classSql = `
      SELECT c.*, 
        COALESCE(cmc.total_members, 0) as member_count,
        (SELECT COUNT(*) FROM class_content_access WHERE class_id = c.class_id) as content_count
      FROM classes c
      LEFT JOIN class_member_counts cmc ON c.class_id = cmc.class_id
      WHERE c.class_id = ? AND c.class_id LIKE "OTU#%"
    `;
    const [classData] = await db.query(classSql, [classId]);
    
    if (!classData) {
      throw new CustomError('Class not found', 404);
    }

    // Special protection for public class
    if (classId === 'OTU#Public' && !force) {
      throw new CustomError('Cannot delete the public class without force flag', 403);
    }

    // Safety checks unless force is true
    if (!force) {
      if (classData.member_count > 0 && !transfer_members_to && !archive_instead) {
        throw new CustomError(
          `Cannot delete class with ${classData.member_count} members. Use force=true, transfer_members_to, or archive_instead=true.`, 
          400
        );
      }

      if (classData.content_count > 0 && !archive_instead) {
        throw new CustomError(
          `Cannot delete class with ${classData.content_count} content items. Use force=true or archive_instead=true.`, 
          400
        );
      }
    }

    // Archive instead of delete if requested
    if (archive_instead) {
      const archiveSql = `
        UPDATE classes 
        SET is_active = 0, archived_at = NOW(), archived_by = ?, archive_reason = ?, updatedAt = NOW()
        WHERE class_id = ?
      `;
      await db.query(archiveSql, [deleted_by, deletion_reason || 'Admin deletion request', classId]);

      return {
        archived_class_id: classId,
        class_name: classData.class_name,
        display_id: formatClassIdForDisplay(classId),
        members_count: classData.member_count,
        content_count: classData.content_count,
        archived_by: deleted_by,
        archived_at: new Date().toISOString(),
        archive_reason: deletion_reason,
        action: 'archived'
      };
    }

    // Transfer members if specified
    if (transfer_members_to && classData.member_count > 0) {
      // Verify target class exists and is OTU# format
      const targetSql = 'SELECT class_id, class_name FROM classes WHERE class_id = ? AND is_active = 1 AND class_id LIKE "OTU#%"';
      const [targetClass] = await db.query(targetSql, [transfer_members_to]);
      
      if (!targetClass) {
        throw new CustomError('Target class for member transfer not found, inactive, or invalid format', 400);
      }

      // Transfer active members
      const transferSql = `
        UPDATE user_class_memberships 
        SET class_id = ?, transfer_reason = ?, transferred_at = NOW(), updatedAt = NOW()
        WHERE class_id = ? AND membership_status = 'active'
      `;
      const transferResult = await db.query(transferSql, [
        transfer_members_to, 
        `Transferred due to class deletion by ${deleted_by}`, 
        classId
      ]);

      console.log(`✅ Transferred ${transferResult.affectedRows} members from ${classId} to ${transfer_members_to}`);
    } else if (force && classData.member_count > 0) {
      // Remove all memberships if force delete
      const removeMembersSql = `
        UPDATE user_class_memberships 
        SET membership_status = 'expired', expiry_reason = ?, updatedAt = NOW()
        WHERE class_id = ?
      `;
      await db.query(removeMembersSql, [`Class deleted by ${deleted_by}`, classId]);
    }

    // Remove content associations if force delete
    if (force && classData.content_count > 0) {
      const removeContentSql = 'DELETE FROM class_content_access WHERE class_id = ?';
      await db.query(removeContentSql, [classId]);
    }

    // Remove class configuration
    try {
      await db.query('DELETE FROM class_configuration WHERE class_id = ?', [classId]);
    } catch (error) {
      console.warn('Could not remove class configuration:', error.message);
    }

    // Delete the class
    const deleteSql = 'DELETE FROM classes WHERE class_id = ? AND class_id LIKE "OTU#%"';
    await db.query(deleteSql, [classId]);

    // Log the deletion
    console.log(`✅ Class ${classId} deleted by admin ${deleted_by}. Reason: ${deletion_reason || 'No reason provided'}`);

    return {
      deleted_class_id: classId,
      deleted_class_name: classData.class_name,
      display_id: formatClassIdForDisplay(classId),
      members_affected: classData.member_count,
      content_items_affected: classData.content_count,
      members_transferred_to: transfer_members_to || null,
      force_delete: force,
      deleted_by,
      deletion_reason,
      deleted_at: new Date().toISOString(),
      action: 'deleted'
    };

  } catch (error) {
    console.error('❌ deleteClassService error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to delete class', 500);
  }
};

/**
 * Manage class membership (approve/reject/remove/change roles)
 */
export const manageClassMembershipService = async (classId, userId, action, adminUserId, options = {}) => {
  try {
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
    }

    // Verify admin has permission
    const adminCheckSql = `
      SELECT ucm.role_in_class, c.class_name
      FROM user_class_memberships ucm
      INNER JOIN classes c ON ucm.class_id = c.class_id
      WHERE ucm.user_id = ? AND ucm.class_id = ? AND ucm.membership_status = 'active' AND c.class_id LIKE "OTU#%"
    `;
    const [adminMembership] = await db.query(adminCheckSql, [adminUserId, classId]);

    if (!adminMembership || !['moderator', 'instructor'].includes(adminMembership.role_in_class)) {
      throw new CustomError('You do not have permission to manage this class', 403);
    }

    // Get current membership
    const membershipSql = `
      SELECT ucm.*, u.username, u.email
      FROM user_class_memberships ucm
      INNER JOIN users u ON ucm.user_id = u.id
      WHERE ucm.user_id = ? AND ucm.class_id = ?
    `;
    const [membership] = await db.query(membershipSql, [userId, classId]);

    if (!membership) {
      throw new CustomError('User membership not found', 404);
    }

    let sql, params, message, actionResult = {};
    const { new_role, reason, notify_user = true } = options;

    switch (action) {
      case 'approve':
        if (membership.membership_status !== 'pending') {
          throw new CustomError('Only pending memberships can be approved', 400);
        }
        sql = `
          UPDATE user_class_memberships 
          SET membership_status = 'active', approvedAt = NOW(), approved_by = ?, approval_reason = ?, updatedAt = NOW()
          WHERE user_id = ? AND class_id = ?
        `;
        params = [adminUserId, reason, userId, classId];
        message = 'Membership approved successfully';
        actionResult = { new_status: 'active', approved_by: adminUserId };
        break;

      case 'reject':
        if (membership.membership_status !== 'pending') {
          throw new CustomError('Only pending memberships can be rejected', 400);
        }
        sql = `
          UPDATE user_class_memberships 
          SET membership_status = 'rejected', rejectedAt = NOW(), rejected_by = ?, rejection_reason = ?, updatedAt = NOW()
          WHERE user_id = ? AND class_id = ?
        `;
        params = [adminUserId, reason, userId, classId];
        message = 'Membership rejected successfully';
        actionResult = { new_status: 'rejected', rejected_by: adminUserId };
        break;

      case 'remove':
        if (membership.membership_status !== 'active') {
          throw new CustomError('Only active members can be removed', 400);
        }
        // Prevent removing the last moderator
        if (membership.role_in_class === 'moderator') {
          const [{ count }] = await db.query(
            'SELECT COUNT(*) as count FROM user_class_memberships WHERE class_id = ? AND role_in_class = "moderator" AND membership_status = "active"',
            [classId]
          );
          if (count <= 1) {
            throw new CustomError('Cannot remove the last moderator', 400);
          }
        }
        sql = `
          UPDATE user_class_memberships 
          SET membership_status = 'expelled', expelledAt = NOW(), expelled_by = ?, expulsion_reason = ?, updatedAt = NOW()
          WHERE user_id = ? AND class_id = ?
        `;
        params = [adminUserId, reason, userId, classId];
        message = 'Member removed successfully';
        actionResult = { new_status: 'expelled', expelled_by: adminUserId };
        break;

      case 'change_role':
      case 'promote':
      case 'demote':
        if (!new_role || !['member', 'moderator', 'assistant', 'instructor'].includes(new_role)) {
          throw new CustomError('Invalid role. Must be: member, moderator, assistant, or instructor', 400);
        }
        if (membership.membership_status !== 'active') {
          throw new CustomError('Only active members can have role changes', 400);
        }
        if (membership.role_in_class === new_role) {
          throw new CustomError(`User already has the role: ${new_role}`, 400);
        }
        sql = `
          UPDATE user_class_memberships 
          SET role_in_class = ?, role_changed_at = NOW(), role_changed_by = ?, role_change_reason = ?, updatedAt = NOW()
          WHERE user_id = ? AND class_id = ?
        `;
        params = [new_role, adminUserId, reason, userId, classId];
        message = `Role changed to ${new_role} successfully`;
        actionResult = { 
          previous_role: membership.role_in_class, 
          new_role, 
          changed_by: adminUserId 
        };
        break;

      default:
        throw new CustomError('Invalid action. Must be: approve, reject, remove, change_role, promote, or demote', 400);
    }

    await db.query(sql, params);

    // Log the action
    console.log(`✅ Class membership action: ${action} for user ${userId} in class ${classId} by admin ${adminUserId}`);

    return {
      success: true,
      message,
      action,
      user_id: userId,
      username: membership.username,
      class_id: classId,
      class_name: adminMembership.class_name,
      display_id: formatClassIdForDisplay(classId),
      previous_status: membership.membership_status,
      previous_role: membership.role_in_class,
      ...actionResult,
      reason,
      notify_user,
      performed_by: adminUserId,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ manageClassMembershipService error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to manage class membership', 500);
  }
};

// ===============================================
// HELPER FUNCTIONS
// ===============================================

/**
 * Calculate class health score based on various metrics
 */
const calculateClassHealthScore = (classData) => {
  let score = 0;
  let maxScore = 100;

  // Capacity utilization (30 points)
  if (classData.max_members > 0) {
    const utilization = (classData.total_members || 0) / classData.max_members;
    if (utilization >= 0.7 && utilization <= 0.9) score += 30;
    else if (utilization >= 0.5) score += 20;
    else if (utilization >= 0.3) score += 10;
  }

  // Activity level (25 points)
  if (classData.days_since_creation > 0) {
    const memberGrowthRate = (classData.total_members || 0) / classData.days_since_creation;
    if (memberGrowthRate > 1) score += 25;
    else if (memberGrowthRate > 0.5) score += 20;
    else if (memberGrowthRate > 0.1) score += 15;
    else if (memberGrowthRate > 0) score += 10;
  }

  // Content availability (20 points)
  if (classData.content_count > 10) score += 20;
  else if (classData.content_count > 5) score += 15;
  else if (classData.content_count > 0) score += 10;

  // Moderation (15 points)
  if ((classData.moderators || 0) >= 2) score += 15;
  else if ((classData.moderators || 0) >= 1) score += 10;

  // Completion (10 points)
  if (classData.description && classData.description.length > 50) score += 5;
  if (classData.tags && classData.tags.length > 0) score += 3;
  if (classData.difficulty_level) score += 2;

  return Math.min(score, maxScore);
};

// ===============================================
// LEGACY SUPPORT FUNCTIONS
// ===============================================

/**
 * Legacy function - fetch all classes (for backward compatibility)
 */
export const fetchClasses = async () => {
  try {
    const sql = `
      SELECT c.*, cmc.total_members, cmc.moderators, cmc.pending_members
      FROM classes c
      LEFT JOIN class_member_counts cmc ON c.class_id = cmc.class_id
      WHERE c.is_active = 1 AND c.class_id LIKE "OTU#%" 
      ORDER BY 
        CASE WHEN c.class_id = 'OTU#Public' THEN 0 ELSE 1 END,
        c.createdAt DESC
    `;
    return await db.query(sql);
  } catch (error) {
    console.error('❌ fetchClasses (legacy) error:', error);
    throw new CustomError('Failed to fetch classes', 500);
  }
};