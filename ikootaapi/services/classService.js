// ikootaapi/services/classService.js
// TYPE 1: TRADITIONAL CLASS SESSIONS SERVICE
// Core class operations following scheduleClassroomSession.md documentation

import db from '../config/db.js';
import CustomError from '../utils/CustomError.js';

// ===============================================
// TYPE 1: TRADITIONAL CLASS SESSIONS
// Database Tables: classes, user_class_memberships, class_member_counts, class_attendance, class_feedback
// ===============================================

/**
 * Get all classes with filtering
 * Endpoint: GET /api/classes
 * @param {Object} filters - Filter options
 * @param {Object} options - Query options
 */
export const getAllClasses = async (filters = {}, options = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      class_type,
      is_public,
      search,
      sort_by = 'createdAt',
      sort_order = 'DESC'
    } = { ...filters, ...options };

    const offset = (page - 1) * limit;

    // Build WHERE clause (using 'cls' alias consistently)
    let whereClause = 'WHERE cls.is_active = 1';
    const queryParams = [];

    if (class_type) {
      whereClause += ' AND cls.class_type = ?';
      queryParams.push(class_type);
    }

    if (is_public !== undefined) {
      whereClause += ' AND cls.is_public = ?';
      queryParams.push(is_public ? 1 : 0);
    }

    if (search) {
      whereClause += ' AND (cls.class_name LIKE ? OR cls.description LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    // Main query with direct member count calculation (avoiding VIEW conflicts)
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
        u.username as created_by_username
      FROM classes cls
      LEFT JOIN users u ON cls.created_by = u.id
      ${whereClause}
      ORDER BY cls.${sort_by} ${sort_order}
      LIMIT ? OFFSET ?
    `;

    queryParams.push(limit, offset);
    const classes = await db.query(query, queryParams);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM classes cls
      ${whereClause}
    `;

    const countResult = await db.query(countQuery, queryParams.slice(0, -2)); // Remove limit/offset
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
    console.error('❌ getAllClasses error:', error);
    throw new CustomError(error.message, 500);
  }
};

/**
 * Get class by ID
 * Endpoint: GET /api/classes/:classId
 * @param {string} classId - Class ID
 * @param {number} userId - Current user ID
 */
export const getClassById = async (classId, userId) => {
  try {
    console.log(`🔍 Service: Getting class ${classId} for user ${userId}`);

    // Get class details with direct member count calculation
    const classQuery = `
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
      WHERE cls.class_id = ? AND cls.is_active = 1
    `;

    const classResult = await db.query(classQuery, [classId]);

    if (!classResult.length) {
      throw new CustomError('Class not found', 404);
    }

    const classData = classResult[0];

    // Check user's membership status (following user_class_memberships schema)
    let userMembership = null;
    if (userId) {
      const membershipQuery = `
        SELECT
          ucm.id,
          ucm.membership_status,
          ucm.role_in_class,
          ucm.joinedAt,
          ucm.can_see_class_name,
          ucm.receive_notifications,
          ucm.total_sessions_attended,
          ucm.last_attendance
        FROM user_class_memberships ucm
        WHERE ucm.user_id = ? AND ucm.class_id = ?
      `;

      const membershipResult = await db.query(membershipQuery, [userId, classId]);
      userMembership = membershipResult[0] || null;
    }

    return {
      success: true,
      data: {
        ...classData,
        user_membership: userMembership,
        is_member: !!userMembership && userMembership.membership_status === 'active'
      }
    };

  } catch (error) {
    console.error('❌ getClassById error:', error);
    throw new CustomError(error.message, 500);
  }
};

/**
 * Join a class
 * Endpoint: POST /api/classes/:classId/join
 * @param {number} userId - User ID
 * @param {string} classId - Class ID
 */
export const joinClass = async (userId, classId) => {
  try {
    console.log(`👥 Service: User ${userId} joining class ${classId}`);

    // Verify class exists and is active
    const classCheck = await db.query(`
      SELECT class_id, class_name, max_members, allow_self_join, auto_approve_members
      FROM classes
      WHERE class_id = ? AND is_active = 1
    `, [classId]);

    if (!classCheck.length) {
      throw new CustomError('Class not found or inactive', 404);
    }

    const classData = classCheck[0];

    if (!classData.allow_self_join) {
      throw new CustomError('This class does not allow self-joining', 403);
    }

    // Check if already a member
    const existingMembership = await db.query(`
      SELECT id, membership_status
      FROM user_class_memberships
      WHERE user_id = ? AND class_id = ?
    `, [userId, classId]);

    if (existingMembership.length) {
      const status = existingMembership[0].membership_status;
      if (status === 'active') {
        throw new CustomError('You are already a member of this class', 400);
      } else if (status === 'pending') {
        throw new CustomError('Your membership is pending approval', 400);
      }
    }

    // Check class capacity
    const memberCount = await db.query(`
      SELECT COUNT(*) as count
      FROM user_class_memberships
      WHERE class_id = ? AND membership_status = 'active'
    `, [classId]);

    if (memberCount[0].count >= classData.max_members) {
      throw new CustomError('Class is at maximum capacity', 400);
    }

    // Determine membership status based on auto_approve_members
    const membershipStatus = classData.auto_approve_members ? 'active' : 'pending';

    // Insert or update membership (following user_class_memberships schema)
    if (existingMembership.length) {
      // Update existing membership
      await db.query(`
        UPDATE user_class_memberships
        SET membership_status = ?, role_in_class = 'member', joinedAt = NOW(), updatedAt = NOW()
        WHERE user_id = ? AND class_id = ?
      `, [membershipStatus, userId, classId]);
    } else {
      // Create new membership
      await db.query(`
        INSERT INTO user_class_memberships (
          user_id, class_id, membership_status, role_in_class, joinedAt, createdAt
        ) VALUES (?, ?, ?, 'member', NOW(), NOW())
      `, [userId, classId, membershipStatus]);
    }

    console.log(`✅ User ${userId} joined class ${classId} with status: ${membershipStatus}`);

    return {
      success: true,
      message: membershipStatus === 'active'
        ? 'Successfully joined the class'
        : 'Join request submitted for approval',
      data: {
        class_id: classId,
        class_name: classData.class_name,
        membership_status: membershipStatus,
        joined_at: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('❌ joinClass error:', error);
    throw error;
  }
};

/**
 * Leave a class
 * Endpoint: POST /api/classes/:classId/leave
 * @param {number} userId - User ID
 * @param {string} classId - Class ID
 */
export const leaveClass = async (userId, classId) => {
  try {
    console.log(`👋 Service: User ${userId} leaving class ${classId}`);

    // Check membership exists
    const membershipCheck = await db.query(`
      SELECT id, membership_status
      FROM user_class_memberships
      WHERE user_id = ? AND class_id = ?
    `, [userId, classId]);

    if (!membershipCheck.length) {
      throw new CustomError('You are not a member of this class', 400);
    }

    // Remove membership
    await db.query(`
      DELETE FROM user_class_memberships
      WHERE user_id = ? AND class_id = ?
    `, [userId, classId]);

    console.log(`✅ User ${userId} left class ${classId}`);

    return {
      success: true,
      message: 'Successfully left the class',
      data: {
        class_id: classId,
        left_at: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('❌ leaveClass error:', error);
    throw error;
  }
};

/**
 * Get class members
 * Endpoint: GET /api/classes/:classId/members
 * @param {string} classId - Class ID
 * @param {number} userId - Current user ID (for access check)
 */
export const getClassMembers = async (classId, userId) => {
  try {
    console.log(`👥 Service: Getting members for class ${classId}`);

    // Verify user is a member of the class
    const membershipCheck = await db.query(`
      SELECT membership_status
      FROM user_class_memberships
      WHERE user_id = ? AND class_id = ? AND membership_status = 'active'
    `, [userId, classId]);

    if (!membershipCheck.length) {
      throw new CustomError('Access denied: You must be a class member to view members', 403);
    }

    // Get class members (following user_class_memberships schema)
    const membersQuery = `
      SELECT
        ucm.id,
        ucm.user_id,
        ucm.membership_status,
        ucm.role_in_class,
        ucm.joinedAt,
        ucm.total_sessions_attended,
        ucm.last_attendance,
        u.username,
        u.email,
        u.converse_id,
        u.membership_stage
      FROM user_class_memberships ucm
      JOIN users u ON ucm.user_id = u.id
      WHERE ucm.class_id = ? AND ucm.membership_status = 'active'
      ORDER BY ucm.role_in_class DESC, ucm.joinedAt ASC
    `;

    const members = await db.query(membersQuery, [classId]);

    return {
      success: true,
      data: members || [],
      total_members: members?.length || 0
    };

  } catch (error) {
    console.error('❌ getClassMembers error:', error);
    throw error;
  }
};

/**
 * Get user's classes
 * Endpoint: GET /api/classes/my-classes
 * @param {number} userId - User ID
 */
export const getUserClasses = async (userId) => {
  try {
    console.log(`📚 Service: Getting classes for user ${userId}`);

    // Simple query without any JOINs that might trigger VIEWs
    const membershipQuery = `
      SELECT
        ucm.class_id,
        ucm.membership_status,
        ucm.role_in_class,
        ucm.joinedAt,
        ucm.total_sessions_attended,
        ucm.last_attendance
      FROM user_class_memberships ucm
      WHERE ucm.user_id = ?
    `;

    const memberships = await db.query(membershipQuery, [userId]);

    if (!memberships.length) {
      return {
        success: true,
        data: []
      };
    }

    // Get class details separately
    const classIds = memberships.map(m => m.class_id);
    const classDetailsQuery = `
      SELECT
        class_id,
        class_name,
        public_name,
        description,
        class_type,
        category,
        difficulty_level,
        is_public,
        max_members,
        estimated_duration,
        tags,
        createdAt
      FROM classes
      WHERE class_id IN (${classIds.map(() => '?').join(',')}) AND is_active = 1
    `;

    const classDetails = await db.query(classDetailsQuery, classIds);

    // Combine the data
    const classes = memberships.map(membership => {
      const classData = classDetails.find(c => c.class_id === membership.class_id);
      return {
        ...classData,
        membership_status: membership.membership_status,
        role_in_class: membership.role_in_class,
        joinedAt: membership.joinedAt,
        total_sessions_attended: membership.total_sessions_attended,
        last_attendance: membership.last_attendance,
        total_members: 0 // Will calculate separately if needed
      };
    }).filter(Boolean); // Remove any null entries

    return {
      success: true,
      data: classes
    };

  } catch (error) {
    console.error('❌ getUserClasses error:', error);
    throw new CustomError(`Failed to get user classes: ${error.message}`, 500);
  }
};

/**
 * Mark class attendance
 * Endpoint: POST /api/classes/:classId/attendance
 * @param {number} userId - User ID
 * @param {string} classId - Class ID
 * @param {Object} attendanceData - Attendance details
 */
export const markClassAttendance = async (userId, classId, attendanceData = {}) => {
  try {
    console.log(`✅ Service: Marking attendance for user ${userId} in class ${classId}`);

    const { session_id, status = 'present', notes, location } = attendanceData;

    // Verify user is a member
    const membershipCheck = await db.query(`
      SELECT id FROM user_class_memberships
      WHERE user_id = ? AND class_id = ? AND membership_status = 'active'
    `, [userId, classId]);

    if (!membershipCheck.length) {
      throw new CustomError('Access denied: You must be a class member', 403);
    }

    // Insert attendance record (following actual class_attendance schema)
    const result = await db.query(`
      INSERT INTO class_attendance (
        user_id, class_id, session_id, status, notes, location, check_in_time, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [userId, classId, session_id, status, notes, location]);

    // Update user's attendance count in membership
    await db.query(`
      UPDATE user_class_memberships
      SET total_sessions_attended = total_sessions_attended + 1,
          last_attendance = NOW()
      WHERE user_id = ? AND class_id = ?
    `, [userId, classId]);

    console.log(`✅ Attendance marked for user ${userId} in class ${classId}`);

    return {
      success: true,
      message: 'Attendance marked successfully',
      data: {
        attendance_id: result.insertId,
        class_id: classId,
        status,
        check_in_time: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('❌ markClassAttendance error:', error);
    throw error;
  }
};

/**
 * Submit class feedback
 * Endpoint: POST /api/classes/:classId/feedback
 * @param {number} userId - User ID
 * @param {string} classId - Class ID
 * @param {Object} feedbackData - Feedback details
 */
export const submitClassFeedback = async (userId, classId, feedbackData) => {
  try {
    console.log(`📝 Service: Submitting feedback for class ${classId} by user ${userId}`);

    const {
      session_id,
      rating,
      feedback_text,
      feedback_type = 'general',
      is_anonymous = false
    } = feedbackData;

    // Verify user is a member
    const membershipCheck = await db.query(`
      SELECT id FROM user_class_memberships
      WHERE user_id = ? AND class_id = ? AND membership_status = 'active'
    `, [userId, classId]);

    if (!membershipCheck.length) {
      throw new CustomError('Access denied: You must be a class member to submit feedback', 403);
    }

    // Insert feedback (following class_feedback schema)
    const result = await db.query(`
      INSERT INTO class_feedback (
        class_id, user_id, session_id, rating, feedback_text,
        feedback_type, is_anonymous, created_by, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [classId, userId, session_id, rating, feedback_text, feedback_type, is_anonymous, userId]);

    console.log(`✅ Feedback submitted for class ${classId}`);

    return {
      success: true,
      message: 'Feedback submitted successfully',
      data: {
        feedback_id: result.insertId,
        class_id: classId,
        rating,
        feedback_type,
        submitted_at: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('❌ submitClassFeedback error:', error);
    throw error;
  }
};

/**
 * Get class statistics
 * @param {string} classId - Class ID
 */
export const getClassStats = async (classId) => {
  try {
    // Get basic stats with direct calculation (no VIEW)
    const statsQuery = `
      SELECT
        (SELECT COUNT(*) FROM user_class_memberships ucm
         WHERE ucm.class_id = cls.class_id AND ucm.membership_status = 'active') as total_members,
        (SELECT COUNT(*) FROM user_class_memberships ucm
         WHERE ucm.class_id = cls.class_id AND ucm.role_in_class = 'moderator') as moderators,
        (SELECT COUNT(*) FROM user_class_memberships ucm
         WHERE ucm.class_id = cls.class_id AND ucm.membership_status = 'pending') as pending_members,
        cls.max_members,
        cls.created_by,
        cls.createdAt
      FROM classes cls
      WHERE cls.class_id = ? AND cls.is_active = 1
    `;

    const stats = await db.query(statsQuery, [classId]);

    if (!stats.length) {
      throw new CustomError('Class not found', 404);
    }

    return {
      success: true,
      data: stats[0]
    };

  } catch (error) {
    console.error('❌ getClassStats error:', error);
    throw new CustomError(error.message, 500);
  }
};

/**
 * Get user progress in classes
 * Endpoint: GET /api/classes/my-progress
 * @param {number} userId - User ID
 */
export const getUserProgress = async (userId) => {
  try {
    console.log(`📊 Service: Getting progress for user ${userId}`);

    const query = `
      SELECT
        cls.class_id,
        cls.class_name,
        ucm.total_sessions_attended,
        ucm.last_attendance,
        ucm.joinedAt,
        COUNT(ca.id) as total_attendance_records
      FROM user_class_memberships ucm
      JOIN classes cls ON ucm.class_id = cls.class_id
      LEFT JOIN class_attendance ca ON ucm.user_id = ca.user_id AND ucm.class_id = ca.class_id
      WHERE ucm.user_id = ? AND ucm.membership_status = 'active' AND cls.is_active = 1
      GROUP BY cls.class_id, cls.class_name, ucm.total_sessions_attended, ucm.last_attendance, ucm.joinedAt
      ORDER BY ucm.last_attendance DESC
    `;

    const progress = await db.query(query, [userId]);

    return {
      success: true,
      data: progress || []
    };

  } catch (error) {
    console.error('❌ getUserProgress error:', error);
    throw new CustomError(error.message, 500);
  }
};

/**
 * Get class content with filtering
 * Endpoint: GET /api/classes/:classId/content
 * @param {string} classId - Class ID
 * @param {number} userId - User ID for access check
 * @param {Object} options - Filter options
 */
export const getClassContent = async (classId, userId, options = {}) => {
  try {
    console.log(`📚 Service: Getting content for class ${classId}`);

    const { limit, type, published_only = true } = options;

    // Verify user is a member
    const membershipCheck = await db.query(`
      SELECT id FROM user_class_memberships
      WHERE user_id = ? AND class_id = ? AND membership_status = 'active'
    `, [userId, classId]);

    if (!membershipCheck.length) {
      throw new CustomError('Access denied: You must be a class member', 403);
    }

    // Build query
    let whereClause = 'WHERE cc.class_id = ? AND cc.is_active = 1';
    const queryParams = [classId];

    if (published_only) {
      whereClause += ' AND cc.is_published = 1';
    }

    if (type) {
      whereClause += ' AND cc.content_type = ?';
      queryParams.push(type);
    }

    let limitClause = '';
    if (limit) {
      limitClause = 'LIMIT ?';
      queryParams.push(parseInt(limit));
    }

    const query = `
      SELECT
        cc.id, cc.title, cc.content_type, cc.content_text,
        cc.media_url, cc.media_type, cc.file_size_bytes,
        cc.estimated_duration, cc.is_published, cc.publish_date,
        cc.createdAt, u.username as created_by_username
      FROM class_content cc
      LEFT JOIN users u ON cc.created_by = u.id
      ${whereClause}
      ORDER BY cc.createdAt DESC
      ${limitClause}
    `;

    const content = await db.query(query, queryParams);

    return {
      success: true,
      data: content || []
    };

  } catch (error) {
    console.error('❌ getClassContent error:', error);
    throw error;
  }
};

/**
 * Get attendance reports for instructors
 * Endpoint: GET /api/classes/:classId/attendance/reports
 * @param {string} classId - Class ID
 * @param {number} userId - Instructor user ID
 */
export const getAttendanceReports = async (classId, userId) => {
  try {
    console.log(`📊 Service: Getting attendance reports for class ${classId} by instructor ${userId}`);

    // First verify instructor has access to this class
    const instructorCheck = await db.query(`
      SELECT ucm.role_in_class, cls.created_by, u.role as user_role
      FROM user_class_memberships ucm
      JOIN classes cls ON ucm.class_id = cls.class_id
      JOIN users u ON ucm.user_id = u.id
      WHERE ucm.user_id = ? AND ucm.class_id = ? AND ucm.membership_status = 'active'
    `, [userId, classId]);

    if (!instructorCheck.length) {
      throw new CustomError('Access denied: You are not a member of this class', 403);
    }

    const { role_in_class, created_by, user_role } = instructorCheck[0];
    // Allow access for instructors, moderators, class creators, or admins
    if (role_in_class !== 'instructor' && role_in_class !== 'moderator' && created_by !== userId &&
        user_role !== 'admin' && user_role !== 'super_admin') {
      throw new CustomError('Access denied: Instructor privileges required', 403);
    }

    // Get attendance statistics
    const attendanceStats = await db.query(`
      SELECT
        COUNT(DISTINCT ca.user_id) as total_students_attended,
        COUNT(ca.id) as total_attendance_records,
        DATE(ca.check_in_time) as attendance_date,
        COUNT(ca.id) as daily_attendance
      FROM class_attendance ca
      WHERE ca.class_id = ?
      GROUP BY DATE(ca.check_in_time)
      ORDER BY attendance_date DESC
    `, [classId]);

    // Get individual student attendance records
    const studentAttendance = await db.query(`
      SELECT
        u.id as student_id,
        u.username,
        u.converse_id,
        COUNT(ca.id) as sessions_attended,
        MAX(ca.check_in_time) as last_attendance,
        MIN(ca.check_in_time) as first_attendance
      FROM users u
      JOIN user_class_memberships ucm ON u.id = ucm.user_id
      LEFT JOIN class_attendance ca ON u.id = ca.user_id AND ca.class_id = ?
      WHERE ucm.class_id = ? AND ucm.membership_status = 'active'
      GROUP BY u.id, u.username, u.converse_id
      ORDER BY sessions_attended DESC, u.username
    `, [classId, classId]);

    // Get recent attendance records
    const recentAttendance = await db.query(`
      SELECT
        ca.id,
        ca.user_id,
        u.username,
        ca.check_in_time,
        ca.status,
        ca.notes,
        ca.location
      FROM class_attendance ca
      JOIN users u ON ca.user_id = u.id
      WHERE ca.class_id = ?
      ORDER BY ca.check_in_time DESC
      LIMIT 50
    `, [classId]);

    return {
      success: true,
      data: {
        class_id: classId,
        summary: {
          total_students: studentAttendance.length,
          total_attendance_records: attendanceStats.reduce((sum, day) => sum + day.total_attendance_records, 0),
          days_with_attendance: attendanceStats.length
        },
        daily_stats: attendanceStats,
        student_attendance: studentAttendance,
        recent_records: recentAttendance
      }
    };

  } catch (error) {
    console.error('❌ getAttendanceReports error:', error);
    throw error;
  }
};

/**
 * Get feedback summary for instructors
 * Endpoint: GET /api/classes/:classId/feedback/summary
 * @param {string} classId - Class ID
 * @param {number} userId - Instructor user ID
 */
export const getFeedbackSummary = async (classId, userId) => {
  try {
    console.log(`💬 Service: Getting feedback summary for class ${classId} by instructor ${userId}`);

    // First verify instructor has access to this class
    const instructorCheck = await db.query(`
      SELECT ucm.role_in_class, cls.created_by, u.role as user_role
      FROM user_class_memberships ucm
      JOIN classes cls ON ucm.class_id = cls.class_id
      JOIN users u ON ucm.user_id = u.id
      WHERE ucm.user_id = ? AND ucm.class_id = ? AND ucm.membership_status = 'active'
    `, [userId, classId]);

    if (!instructorCheck.length) {
      throw new CustomError('Access denied: You are not a member of this class', 403);
    }

    const { role_in_class, created_by, user_role } = instructorCheck[0];
    // Allow access for instructors, moderators, class creators, or admins
    if (role_in_class !== 'instructor' && role_in_class !== 'moderator' && created_by !== userId &&
        user_role !== 'admin' && user_role !== 'super_admin') {
      throw new CustomError('Access denied: Instructor privileges required', 403);
    }

    // Get feedback statistics
    const feedbackStats = await db.query(`
      SELECT
        COUNT(cf.id) as total_feedback_count,
        ROUND(AVG(cf.rating), 2) as average_rating,
        COUNT(CASE WHEN cf.rating >= 4 THEN 1 END) as positive_feedback,
        COUNT(CASE WHEN cf.rating <= 2 THEN 1 END) as negative_feedback,
        cf.feedback_type
      FROM class_feedback cf
      WHERE cf.class_id = ?
      GROUP BY cf.feedback_type
    `, [classId]);

    // Get detailed feedback records
    const detailedFeedback = await db.query(`
      SELECT
        cf.id,
        cf.user_id,
        u.username,
        cf.rating,
        cf.feedback_text,
        cf.feedback_type,
        cf.createdAt
      FROM class_feedback cf
      JOIN users u ON cf.user_id = u.id
      WHERE cf.class_id = ?
      ORDER BY cf.createdAt DESC
    `, [classId]);

    // Get rating distribution
    const ratingDistribution = await db.query(`
      SELECT
        rating,
        COUNT(*) as count
      FROM class_feedback
      WHERE class_id = ?
      GROUP BY rating
      ORDER BY rating DESC
    `, [classId]);

    return {
      success: true,
      data: {
        class_id: classId,
        summary: {
          total_feedback: detailedFeedback.length,
          average_rating: feedbackStats.length > 0 ? feedbackStats[0].average_rating : 0,
          positive_feedback: feedbackStats.reduce((sum, stat) => sum + (stat.positive_feedback || 0), 0),
          negative_feedback: feedbackStats.reduce((sum, stat) => sum + (stat.negative_feedback || 0), 0)
        },
        feedback_by_type: feedbackStats,
        rating_distribution: ratingDistribution,
        detailed_feedback: detailedFeedback
      }
    };

  } catch (error) {
    console.error('❌ getFeedbackSummary error:', error);
    throw error;
  }
};