// ikootaapi/services/classAdminService.js
// ADMIN CLASS MANAGEMENT SERVICE
// Following scheduleClassroomSession.md documentation for admin operations

import db from '../config/db.js';
import CustomError from '../utils/CustomError.js';

// ===============================================
// ADMIN CLASS MANAGEMENT
// Database Tables: classes, user_class_memberships, class_member_counts, admin_action_logs
// ===============================================

/**
 * Get admin dashboard data
 * Endpoint: GET /api/classes/admin/dashboard
 */
export const getAdminDashboard = async () => {
  try {
    console.log('📊 Service: Getting admin dashboard data');

    // Get system statistics (following exact schema)
    const systemStats = await db.query(`
      SELECT
        COUNT(*) as total_classes,
        SUM(CASE WHEN cls.is_public = 1 THEN 1 ELSE 0 END) as public_classes,
        SUM(CASE WHEN cls.is_active = 1 THEN 1 ELSE 0 END) as active_classes,
        SUM(CASE WHEN cls.createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as classes_this_week
      FROM classes cls
    `);

    // Get membership statistics
    const membershipStats = await db.query(`
      SELECT
        COUNT(*) as total_memberships,
        SUM(CASE WHEN ucm.membership_status = 'active' THEN 1 ELSE 0 END) as active_memberships,
        SUM(CASE WHEN ucm.membership_status = 'pending' THEN 1 ELSE 0 END) as pending_memberships,
        COUNT(DISTINCT ucm.user_id) as unique_members
      FROM user_class_memberships ucm
    `);

    // Get recent activity
    const recentClasses = await db.query(`
      SELECT
        cls.class_id, cls.class_name, cls.class_type,
        cls.is_public, cls.createdAt,
        (SELECT COUNT(*) FROM user_class_memberships ucm
         WHERE ucm.class_id = cls.class_id AND ucm.membership_status = 'active') as total_members
      FROM classes cls
      ORDER BY cls.createdAt DESC
      LIMIT 5
    `);

    return {
      success: true,
      data: {
        system_stats: systemStats[0] || {},
        membership_stats: membershipStats[0] || {},
        recent_classes: recentClasses || []
      }
    };

  } catch (error) {
    console.error('❌ getAdminDashboard error:', error);
    throw new CustomError(error.message, 500);
  }
};

/**
 * Get all classes (Admin view)
 * Endpoint: GET /api/classes/admin
 */
export const getAllClassesAdmin = async (options = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      class_type,
      is_active,
      search,
      sort_by = 'createdAt',
      sort_order = 'DESC'
    } = options;

    const offset = (page - 1) * limit;

    // Build WHERE clause (using consistent aliases)
    let whereClause = '';
    const queryParams = [];

    const conditions = [];

    if (class_type) {
      conditions.push('cls.class_type = ?');
      queryParams.push(class_type);
    }

    if (is_active !== undefined) {
      conditions.push('cls.is_active = ?');
      queryParams.push(is_active ? 1 : 0);
    }

    if (search) {
      conditions.push('(cls.class_name LIKE ? OR cls.description LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }

    // Main query with comprehensive class data
    const query = `
      SELECT
        cls.id,
        cls.class_id,
        cls.class_name,
        cls.public_name,
        cls.description,
        cls.class_type,
        cls.category,
        cls.difficulty_level,
        cls.is_public,
        cls.max_members,
        cls.estimated_duration,
        cls.prerequisites,
        cls.learning_objectives,
        cls.tags,
        cls.privacy_level,
        cls.created_by,
        cls.is_active,
        cls.createdAt,
        cls.updatedAt,
        cls.allow_self_join,
        cls.require_full_membership,
        cls.auto_approve_members,
        cls.require_approval,
        cls.allow_preview,
        (SELECT COUNT(*) FROM user_class_memberships ucm
         WHERE ucm.class_id = cls.class_id AND ucm.membership_status = 'active') as total_members,
        (SELECT COUNT(*) FROM user_class_memberships ucm
         WHERE ucm.class_id = cls.class_id AND ucm.role_in_class = 'moderator') as moderators,
        (SELECT COUNT(*) FROM user_class_memberships ucm
         WHERE ucm.class_id = cls.class_id AND ucm.membership_status = 'pending') as pending_members,
        u.username as created_by_username,
        u.email as created_by_email
      FROM classes cls
      LEFT JOIN users u ON cls.created_by = u.id
      ${whereClause}
      ORDER BY cls.${sort_by} ${sort_order}
      LIMIT ? OFFSET ?
    `;

    queryParams.push(limit, offset);
    const classes = await db.query(query, queryParams);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM classes cls
      ${whereClause}
    `;

    const countResult = await db.query(countQuery, queryParams.slice(0, -2));
    const total = countResult[0]?.total || 0;

    return {
      success: true,
      data: classes || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total),
        pages: Math.ceil(total / limit)
      }
    };

  } catch (error) {
    console.error('❌ getAllClassesAdmin error:', error);
    throw new CustomError(error.message, 500);
  }
};

/**
 * Create new class (Admin)
 * Endpoint: POST /api/classes/admin
 */
export const createClass = async (adminUserId, classData) => {
  try {
    console.log(`🏗️ Service: Admin ${adminUserId} creating new class`);

    const {
      class_name,
      public_name,
      description,
      class_type = 'demographic',
      category,
      difficulty_level = 'beginner',
      is_public = false,
      max_members = 50,
      estimated_duration,
      prerequisites,
      learning_objectives,
      tags,
      privacy_level = 'members_only',
      allow_self_join = true,
      require_full_membership = false,
      auto_approve_members = true,
      require_approval = false,
      allow_preview = true
    } = classData;

    // Generate unique class_id (following OTU# format from documentation)
    const classId = `OTU#${Date.now().toString().slice(-6)}`;

    // Insert new class (following classes schema exactly)
    const result = await db.query(`
      INSERT INTO classes (
        class_id, class_name, public_name, description, class_type,
        category, difficulty_level, is_public, max_members,
        estimated_duration, prerequisites, learning_objectives,
        tags, privacy_level, created_by, is_active,
        allow_self_join, require_full_membership, auto_approve_members,
        require_approval, allow_preview, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      classId, class_name, public_name, description, class_type,
      category, difficulty_level, is_public ? 1 : 0, max_members,
      estimated_duration, prerequisites, learning_objectives,
      tags, privacy_level, adminUserId,
      allow_self_join ? 1 : 0, require_full_membership ? 1 : 0,
      auto_approve_members ? 1 : 0, require_approval ? 1 : 0,
      allow_preview ? 1 : 0
    ]);

    console.log(`✅ Class created with ID: ${classId}`);

    return {
      success: true,
      message: 'Class created successfully',
      data: {
        id: result.insertId,
        class_id: classId,
        class_name,
        class_type,
        is_public,
        max_members,
        created_by: adminUserId,
        created_at: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('❌ createClass error:', error);
    throw error;
  }
};

/**
 * Update class (Admin)
 * Endpoint: PUT /api/classes/admin/:classId
 */
export const updateClass = async (adminUserId, classId, updateData) => {
  try {
    console.log(`✏️ Service: Admin ${adminUserId} updating class ${classId}`);

    // Check if class exists
    const classCheck = await db.query(`
      SELECT id, class_name FROM classes WHERE class_id = ?
    `, [classId]);

    if (!classCheck.length) {
      throw new CustomError('Class not found', 404);
    }

    // Build update query dynamically
    const allowedFields = [
      'class_name', 'public_name', 'description', 'class_type', 'category',
      'difficulty_level', 'is_public', 'max_members', 'estimated_duration',
      'prerequisites', 'learning_objectives', 'tags', 'privacy_level',
      'allow_self_join', 'require_full_membership', 'auto_approve_members',
      'require_approval', 'allow_preview', 'is_active'
    ];

    const updateFields = [];
    const updateValues = [];

    Object.keys(updateData).forEach(field => {
      if (allowedFields.includes(field) && updateData[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(updateData[field]);
      }
    });

    if (updateFields.length === 0) {
      throw new CustomError('No valid fields to update', 400);
    }

    updateFields.push('updatedAt = NOW()');
    updateValues.push(classId);

    const updateQuery = `
      UPDATE classes
      SET ${updateFields.join(', ')}
      WHERE class_id = ?
    `;

    await db.query(updateQuery, updateValues);

    console.log(`✅ Class ${classId} updated successfully`);

    return {
      success: true,
      message: 'Class updated successfully',
      data: {
        class_id: classId,
        updated_fields: Object.keys(updateData),
        updated_at: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('❌ updateClass error:', error);
    throw error;
  }
};

/**
 * Delete class (Admin)
 * Endpoint: DELETE /api/classes/admin/:classId
 */
export const deleteClass = async (adminUserId, classId) => {
  try {
    console.log(`🗑️ Service: Admin ${adminUserId} deleting class ${classId}`);

    // Check if class exists and get member count
    const classCheck = await db.query(`
      SELECT
        cls.id, cls.class_name,
        (SELECT COUNT(*) FROM user_class_memberships ucm
         WHERE ucm.class_id = cls.class_id AND ucm.membership_status = 'active') as total_members
      FROM classes cls
      WHERE cls.class_id = ?
    `, [classId]);

    if (!classCheck.length) {
      throw new CustomError('Class not found', 404);
    }

    const classData = classCheck[0];

    if (classData.total_members > 0) {
      throw new CustomError(`Cannot delete class with ${classData.total_members} members. Remove all members first.`, 400);
    }

    // Soft delete by setting is_active = 0
    await db.query(`
      UPDATE classes
      SET is_active = 0, updatedAt = NOW()
      WHERE class_id = ?
    `, [classId]);

    console.log(`✅ Class ${classId} deleted successfully`);

    return {
      success: true,
      message: 'Class deleted successfully',
      data: {
        class_id: classId,
        class_name: classData.class_name,
        deleted_at: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('❌ deleteClass error:', error);
    throw error;
  }
};

/**
 * Get class participants (Admin)
 * Endpoint: GET /api/classes/admin/:classId/participants
 */
export const getClassParticipants = async (classId) => {
  try {
    console.log(`👥 Service: Getting participants for class ${classId}`);

    const query = `
      SELECT
        ucm.id,
        ucm.user_id,
        ucm.membership_status,
        ucm.role_in_class,
        ucm.joinedAt,
        ucm.assigned_by,
        ucm.expiresAt,
        ucm.can_see_class_name,
        ucm.receive_notifications,
        ucm.total_sessions_attended,
        ucm.last_attendance,
        ucm.createdAt,
        ucm.updatedAt,
        u.username,
        u.email,
        u.converse_id,
        u.membership_stage,
        u.role as user_role,
        assigner.username as assigned_by_username
      FROM user_class_memberships ucm
      JOIN users u ON ucm.user_id = u.id
      LEFT JOIN users assigner ON ucm.assigned_by = assigner.id
      WHERE ucm.class_id = ?
      ORDER BY ucm.role_in_class DESC, ucm.joinedAt ASC
    `;

    const participants = await db.query(query, [classId]);

    // Get summary statistics
    const stats = {
      total: participants.length,
      active: participants.filter(p => p.membership_status === 'active').length,
      pending: participants.filter(p => p.membership_status === 'pending').length,
      suspended: participants.filter(p => p.membership_status === 'suspended').length,
      moderators: participants.filter(p => p.role_in_class === 'moderator').length,
      assistants: participants.filter(p => p.role_in_class === 'assistant').length,
      members: participants.filter(p => p.role_in_class === 'member').length
    };

    return {
      success: true,
      data: {
        participants: participants || [],
        stats
      }
    };

  } catch (error) {
    console.error('❌ getClassParticipants error:', error);
    throw new CustomError(error.message, 500);
  }
};

/**
 * Manage participant (Admin)
 * Endpoint: PUT /api/classes/admin/:classId/participants/:userId
 */
export const manageParticipant = async (adminUserId, classId, userId, actionData) => {
  try {
    console.log(`👨‍💼 Service: Admin ${adminUserId} managing participant ${userId} in class ${classId}`);

    const { action, role_in_class, membership_status, notes } = actionData;

    // Check if participant exists
    const participantCheck = await db.query(`
      SELECT id, membership_status, role_in_class
      FROM user_class_memberships
      WHERE user_id = ? AND class_id = ?
    `, [userId, classId]);

    if (!participantCheck.length) {
      throw new CustomError('Participant not found in this class', 404);
    }

    const participant = participantCheck[0];

    // Handle different actions
    switch (action) {
      case 'update_role':
        if (!role_in_class) {
          throw new CustomError('role_in_class is required for update_role action', 400);
        }
        await db.query(`
          UPDATE user_class_memberships
          SET role_in_class = ?, updatedAt = NOW()
          WHERE user_id = ? AND class_id = ?
        `, [role_in_class, userId, classId]);
        break;

      case 'update_status':
        if (!membership_status) {
          throw new CustomError('membership_status is required for update_status action', 400);
        }
        await db.query(`
          UPDATE user_class_memberships
          SET membership_status = ?, updatedAt = NOW()
          WHERE user_id = ? AND class_id = ?
        `, [membership_status, userId, classId]);
        break;

      case 'remove':
        await db.query(`
          DELETE FROM user_class_memberships
          WHERE user_id = ? AND class_id = ?
        `, [userId, classId]);
        break;

      default:
        throw new CustomError('Invalid action. Must be: update_role, update_status, or remove', 400);
    }

    console.log(`✅ Participant ${userId} ${action} completed`);

    return {
      success: true,
      message: `Participant ${action} completed successfully`,
      data: {
        user_id: userId,
        class_id: classId,
        action,
        previous_status: participant.membership_status,
        previous_role: participant.role_in_class,
        updated_at: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('❌ manageParticipant error:', error);
    throw error;
  }
};

/**
 * Add participants to class (Admin)
 * Endpoint: POST /api/classes/admin/:classId/participants/add
 */
export const addParticipants = async (adminUserId, classId, participantData) => {
  try {
    console.log(`➕ Service: Admin ${adminUserId} adding participants to class ${classId}`);

    const { user_ids, role_in_class = 'member', membership_status = 'active' } = participantData;

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      throw new CustomError('user_ids array is required', 400);
    }

    // Check class exists and capacity
    const classCheck = await db.query(`
      SELECT max_members FROM classes WHERE class_id = ? AND is_active = 1
    `, [classId]);

    if (!classCheck.length) {
      throw new CustomError('Class not found', 404);
    }

    const maxMembers = classCheck[0].max_members;

    // Check current member count
    const currentCount = await db.query(`
      SELECT COUNT(*) as count
      FROM user_class_memberships
      WHERE class_id = ? AND membership_status = 'active'
    `, [classId]);

    const currentMembers = currentCount[0].count;

    if (currentMembers + user_ids.length > maxMembers) {
      throw new CustomError(`Adding ${user_ids.length} members would exceed capacity (${maxMembers})`, 400);
    }

    // Add participants
    const results = [];
    for (const userId of user_ids) {
      try {
        // Check if user exists
        const userCheck = await db.query(`
          SELECT id, username FROM users WHERE id = ?
        `, [userId]);

        if (!userCheck.length) {
          results.push({ user_id: userId, status: 'failed', reason: 'User not found' });
          continue;
        }

        // Check if already a member
        const existingMembership = await db.query(`
          SELECT id FROM user_class_memberships
          WHERE user_id = ? AND class_id = ?
        `, [userId, classId]);

        if (existingMembership.length) {
          results.push({ user_id: userId, status: 'failed', reason: 'Already a member' });
          continue;
        }

        // Add membership
        await db.query(`
          INSERT INTO user_class_memberships (
            user_id, class_id, membership_status, role_in_class,
            assigned_by, joinedAt, createdAt
          ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        `, [userId, classId, membership_status, role_in_class, adminUserId]);

        results.push({ user_id: userId, status: 'success', username: userCheck[0].username });

      } catch (error) {
        results.push({ user_id: userId, status: 'failed', reason: error.message });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;

    return {
      success: true,
      message: `Added ${successCount} of ${user_ids.length} participants`,
      data: {
        class_id: classId,
        results,
        summary: {
          total_requested: user_ids.length,
          successful: successCount,
          failed: user_ids.length - successCount
        }
      }
    };

  } catch (error) {
    console.error('❌ addParticipants error:', error);
    throw error;
  }
};

/**
 * Get system analytics (Admin)
 * Endpoint: GET /api/classes/admin/analytics
 */
export const getSystemAnalytics = async (options = {}) => {
  try {
    const { date_range = '30' } = options; // days

    // Class creation trends
    const classTrends = await db.query(`
      SELECT
        DATE(createdAt) as date,
        COUNT(*) as classes_created
      FROM classes
      WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `, [parseInt(date_range)]);

    // Membership trends
    const membershipTrends = await db.query(`
      SELECT
        DATE(joinedAt) as date,
        COUNT(*) as new_memberships
      FROM user_class_memberships
      WHERE joinedAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(joinedAt)
      ORDER BY date ASC
    `, [parseInt(date_range)]);

    // Class type distribution
    const classTypes = await db.query(`
      SELECT
        class_type,
        COUNT(*) as count
      FROM classes
      WHERE is_active = 1
      GROUP BY class_type
    `);

    return {
      success: true,
      data: {
        class_trends: classTrends || [],
        membership_trends: membershipTrends || [],
        class_type_distribution: classTypes || [],
        date_range: `${date_range} days`
      }
    };

  } catch (error) {
    console.error('❌ getSystemAnalytics error:', error);
    throw new CustomError(error.message, 500);
  }
};