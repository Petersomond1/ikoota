// ikootaapi/services/classServices.js
// REBUILT USING EXACT MEMBERSHIP SYSTEM PATTERNS
// Direct db.query() calls, simple result handling, no complex string building

import db from '../config/db.js';
import CustomError from '../utils/CustomError.js';

// ===============================================
// BASIC CLASS OPERATIONS
// ===============================================

/**
 * Get all classes with simple filtering
 * @param {Object} filters - Filter options
 * @param {Object} options - Query options
 * @returns {Object} Classes with pagination
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
    
    // Build simple WHERE conditions
    let whereClause = 'WHERE c.is_active = 1';
    const queryParams = [];
    
    if (class_type) {
      whereClause += ' AND c.class_type = ?';
      queryParams.push(class_type);
    }
    
    if (is_public !== undefined) {
      whereClause += ' AND c.is_public = ?';
      queryParams.push(is_public ? 1 : 0);
    }
    
    if (search) {
      whereClause += ' AND (c.class_name LIKE ? OR c.description LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`);
    }
    
    // Get total count
    const countResult = await db.query(`
      SELECT COUNT(*) as total 
      FROM classes c 
      ${whereClause}
    `, queryParams);
    
    const total = countResult[0].total;
    
    // Get classes
    const classes = await db.query(`
      SELECT 
        c.*,
        COALESCE(cmc.total_members, 0) as total_members,
        COALESCE(cmc.moderators, 0) as moderators,
        u.username as created_by_username
      FROM classes c
      LEFT JOIN class_member_counts cmc ON c.class_id = cmc.class_id
      LEFT JOIN users u ON c.created_by = u.id
      ${whereClause}
      ORDER BY c.${sort_by} ${sort_order}
      LIMIT ? OFFSET ?
    `, [...queryParams, limit, offset]);

    return {
      data: classes,
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
    console.error('❌ getAllClasses error:', error);
    throw new Error(`Failed to get classes: ${error.message}`);
  }
};

/**
 * Get class by ID
 * @param {string} classId - Class ID
 * @param {number} userId - User ID (optional)
 * @returns {Object} Class details
 */
export const getClassById = async (classId, userId = null) => {
  try {
    const classResult = await db.query(`
      SELECT 
        c.*,
        COALESCE(cmc.total_members, 0) as total_members,
        u.username as created_by_username
      FROM classes c
      LEFT JOIN class_member_counts cmc ON c.class_id = cmc.class_id
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.class_id = ? AND c.is_active = 1
    `, [classId]);

    if (!classResult.length) {
      throw new Error('Class not found');
    }

    const classData = classResult[0];
    
    // Get user membership if userId provided
    let userMembership = null;
    if (userId) {
      const membershipResult = await db.query(`
        SELECT role_in_class, membership_status, joinedAt
        FROM user_class_memberships
        WHERE user_id = ? AND class_id = ?
      `, [userId, classId]);
      
      userMembership = membershipResult[0] || null;
    }

    return {
      ...classData,
      available_spots: classData.max_members - classData.total_members,
      is_full: classData.total_members >= classData.max_members,
      user_membership: userMembership
    };

  } catch (error) {
    console.error('❌ getClassById error:', error);
    throw new Error(`Failed to get class: ${error.message}`);
  }
};

/**
 * Get user's classes
 * @param {number} userId - User ID
 * @param {Object} options - Query options
 * @returns {Object} User's classes
 */
export const getUserClasses = async (userId, options = {}) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      membership_status = 'active',
      sort_by = 'joinedAt',
      sort_order = 'DESC'
    } = options;
    
    const offset = (page - 1) * limit;
    
    // Get total count
    const countResult = await db.query(`
      SELECT COUNT(*) as total
      FROM user_class_memberships ucm
      INNER JOIN classes c ON ucm.class_id = c.class_id
      WHERE ucm.user_id = ? AND ucm.membership_status = ?
    `, [userId, membership_status]);
    
    const total = countResult[0].total;
    
    // Get classes
    const classes = await db.query(`
      SELECT 
        c.*,
        ucm.role_in_class,
        ucm.joinedAt,
        ucm.membership_status,
        COALESCE(cmc.total_members, 0) as total_members
      FROM user_class_memberships ucm
      INNER JOIN classes c ON ucm.class_id = c.class_id
      LEFT JOIN class_member_counts cmc ON c.class_id = cmc.class_id
      WHERE ucm.user_id = ? AND ucm.membership_status = ?
      ORDER BY ucm.${sort_by} ${sort_order}
      LIMIT ? OFFSET ?
    `, [userId, membership_status, limit, offset]);

    return {
      data: classes,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_records: total,
        per_page: limit
      }
    };

  } catch (error) {
    console.error('❌ getUserClasses error:', error);
    throw new Error(`Failed to get user classes: ${error.message}`);
  }
};

/**
 * Join a class
 * @param {number} userId - User ID
 * @param {string} classId - Class ID
 * @param {Object} options - Join options
 * @returns {Object} Join result
 */
export const joinClass = async (userId, classId, options = {}) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { role_in_class = 'member', receive_notifications = true } = options;

    // Check if class exists and has space
    const classResult = await connection.query(`
      SELECT c.*, COALESCE(cmc.total_members, 0) as total_members
      FROM classes c
      LEFT JOIN class_member_counts cmc ON c.class_id = cmc.class_id
      WHERE c.class_id = ? AND c.is_active = 1
    `, [classId]);

    if (!classResult.length) {
      throw new Error('Class not found');
    }

    const classData = classResult[0];
    
    if (classData.total_members >= classData.max_members) {
      throw new Error('Class is full');
    }

    // Check existing membership
    const existingResult = await connection.query(`
      SELECT membership_status 
      FROM user_class_memberships 
      WHERE user_id = ? AND class_id = ?
    `, [userId, classId]);

    if (existingResult.length && existingResult[0].membership_status === 'active') {
      throw new Error('Already a member of this class');
    }

    // Insert membership
    await connection.query(`
      INSERT INTO user_class_memberships 
      (user_id, class_id, role_in_class, membership_status, joinedAt, receive_notifications, createdAt, updatedAt)
      VALUES (?, ?, ?, 'active', NOW(), ?, NOW(), NOW())
    `, [userId, classId, role_in_class, receive_notifications ? 1 : 0]);

    await connection.commit();

    return {
      success: true,
      message: 'Successfully joined class',
      class_id: classId,
      class_name: classData.class_name,
      role_in_class
    };

  } catch (error) {
    await connection.rollback();
    console.error('❌ joinClass error:', error);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Leave a class
 * @param {number} userId - User ID
 * @param {string} classId - Class ID
 * @returns {Object} Leave result
 */
export const leaveClass = async (userId, classId) => {
  try {
    // Check membership
    const membershipResult = await db.query(`
      SELECT ucm.role_in_class, c.class_name
      FROM user_class_memberships ucm
      INNER JOIN classes c ON ucm.class_id = c.class_id
      WHERE ucm.user_id = ? AND ucm.class_id = ? AND ucm.membership_status = 'active'
    `, [userId, classId]);

    if (!membershipResult.length) {
      throw new Error('Not a member of this class');
    }

    const membership = membershipResult[0];

    // Update membership status
    await db.query(`
      UPDATE user_class_memberships 
      SET membership_status = 'expired', updatedAt = NOW()
      WHERE user_id = ? AND class_id = ?
    `, [userId, classId]);

    return {
      success: true,
      message: 'Successfully left class',
      class_id: classId,
      class_name: membership.class_name,
      previous_role: membership.role_in_class
    };

  } catch (error) {
    console.error('❌ leaveClass error:', error);
    throw new Error(`Failed to leave class: ${error.message}`);
  }
};

/**
 * Get class members
 * @param {string} classId - Class ID
 * @param {number} userId - Requesting user ID
 * @param {Object} options - Query options
 * @returns {Object} Class members
 */
export const getClassMembers = async (classId, userId, options = {}) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      membership_status = 'active',
      sort_by = 'joinedAt',
      sort_order = 'DESC'
    } = options;
    
    const offset = (page - 1) * limit;
    
    // Get total count
    const countResult = await db.query(`
      SELECT COUNT(*) as total
      FROM user_class_memberships ucm
      WHERE ucm.class_id = ? AND ucm.membership_status = ?
    `, [classId, membership_status]);
    
    const total = countResult[0].total;
    
    // Get members
    const members = await db.query(`
      SELECT 
        u.id, u.username, u.converse_id,
        ucm.role_in_class, ucm.joinedAt, ucm.membership_status
      FROM user_class_memberships ucm
      INNER JOIN users u ON ucm.user_id = u.id
      WHERE ucm.class_id = ? AND ucm.membership_status = ?
      ORDER BY ucm.${sort_by} ${sort_order}
      LIMIT ? OFFSET ?
    `, [classId, membership_status, limit, offset]);

    return {
      data: members,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_records: total,
        per_page: limit
      }
    };

  } catch (error) {
    console.error('❌ getClassMembers error:', error);
    throw new Error(`Failed to get class members: ${error.message}`);
  }
};

/**
 * Get available classes for user
 * @param {number} userId - User ID
 * @param {Object} options - Query options
 * @returns {Object} Available classes
 */
export const getAvailableClasses = async (userId, options = {}) => {
  try {
    const { limit = 6 } = options;
    
    const classes = await db.query(`
      SELECT 
        c.*,
        COALESCE(cmc.total_members, 0) as total_members
      FROM classes c
      LEFT JOIN class_member_counts cmc ON c.class_id = cmc.class_id
      WHERE c.is_active = 1 
        AND c.allow_self_join = 1
        AND c.class_id NOT IN (
          SELECT class_id 
          FROM user_class_memberships 
          WHERE user_id = ? AND membership_status = 'active'
        )
        AND (c.max_members > COALESCE(cmc.total_members, 0))
      ORDER BY c.createdAt DESC
      LIMIT ?
    `, [userId, limit]);

    return {
      data: classes.map(cls => ({
        ...cls,
        available_spots: cls.max_members - cls.total_members,
        can_join_immediately: cls.auto_approve_members || cls.is_public
      }))
    };

  } catch (error) {
    console.error('❌ getAvailableClasses error:', error);
    throw new Error(`Failed to get available classes: ${error.message}`);
  }
};

// ===============================================
// REAL BUSINESS LOGIC SERVICES - DATABASE QUERIES
// ===============================================

/**
 * Get class content - REAL DATABASE QUERY
 * @param {string} classId - Class ID
 * @param {number} userId - User ID
 * @param {Object} options - Query options
 * @returns {Object} Class content with real data
 */
export const getClassContent = async (classId, userId, options = {}) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      content_type,
      sort_by = 'createdAt',
      sort_order = 'DESC'
    } = options;
    
    const offset = (page - 1) * limit;
    
    // First verify user has access to this class
    const membershipCheck = await db.query(`
      SELECT role_in_class, membership_status
      FROM user_class_memberships
      WHERE user_id = ? AND class_id = ? AND membership_status = 'active'
    `, [userId, classId]);
    
    if (!membershipCheck.length) {
      throw new Error('Access denied - not a member of this class');
    }
    
    // Build WHERE clause for content filtering
    let whereClause = 'WHERE cc.class_id = ? AND cc.is_active = 1';
    const queryParams = [classId];
    
    if (content_type) {
      whereClause += ' AND cc.content_type = ?';
      queryParams.push(content_type);
    }
    
    // Get total count of content
    const countResult = await db.query(`
      SELECT COUNT(*) as total
      FROM class_content cc
      ${whereClause}
    `, queryParams);
    
    const total = countResult[0].total;
    
    // Get actual content with creator info
    const content = await db.query(`
      SELECT 
        cc.*,
        u.username as created_by_username,
        u.converse_id as created_by_converse_id,
        COUNT(ccv.id) as view_count,
        COUNT(CASE WHEN ccv.user_id = ? THEN 1 END) as user_viewed
      FROM class_content cc
      LEFT JOIN users u ON cc.created_by = u.id
      LEFT JOIN class_content_views ccv ON cc.id = ccv.content_id
      ${whereClause}
      GROUP BY cc.id
      ORDER BY cc.${sort_by} ${sort_order}
      LIMIT ? OFFSET ?
    `, [userId, ...queryParams, limit, offset]);
    
    return {
      data: content.map(item => ({
        ...item,
        has_viewed: item.user_viewed > 0,
        view_count: item.view_count || 0
      })),
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_records: total,
        per_page: limit
      },
      user_role: membershipCheck[0].role_in_class,
      class_id: classId
    };
    
  } catch (error) {
    console.error('❌ getClassContent error:', error);
    throw new Error(`Failed to get class content: ${error.message}`);
  }
};

/**
 * Get class announcements - REAL DATABASE QUERY
 * @param {string} classId - Class ID  
 * @param {number} userId - User ID
 * @param {Object} options - Query options
 * @returns {Object} Class announcements with real data
 */
export const getClassAnnouncements = async (classId, userId, options = {}) => {
  try {
    const { 
      page = 1, 
      limit = 20,
      announcement_type = 'all',
      is_active = true,
      sort_by = 'createdAt',
      sort_order = 'DESC'
    } = options;
    
    const offset = (page - 1) * limit;
    
    // Verify user access to class
    const membershipCheck = await db.query(`
      SELECT role_in_class, membership_status
      FROM user_class_memberships
      WHERE user_id = ? AND class_id = ? AND membership_status = 'active'
    `, [userId, classId]);
    
    if (!membershipCheck.length) {
      throw new Error('Access denied - not a member of this class');
    }
    
    // Build WHERE clause
    let whereClause = 'WHERE ca.class_id = ?';
    const queryParams = [classId];
    
    if (is_active) {
      whereClause += ' AND ca.is_active = 1';
    }
    
    if (announcement_type !== 'all') {
      whereClause += ' AND ca.announcement_type = ?';
      queryParams.push(announcement_type);
    }
    
    // Get total count
    const countResult = await db.query(`
      SELECT COUNT(*) as total
      FROM class_announcements ca
      ${whereClause}
    `, queryParams);
    
    const total = countResult[0].total;
    
    // Get announcements with read status
    const announcements = await db.query(`
      SELECT 
        ca.*,
        u.username as created_by_username,
        u.converse_id as created_by_converse_id,
        CASE WHEN car.user_id IS NOT NULL THEN 1 ELSE 0 END as is_read,
        car.readAt as read_at
      FROM class_announcements ca
      LEFT JOIN users u ON ca.created_by = u.id
      LEFT JOIN class_announcement_reads car ON ca.id = car.announcement_id AND car.user_id = ?
      ${whereClause}
      ORDER BY ca.${sort_by} ${sort_order}
      LIMIT ? OFFSET ?
    `, [userId, ...queryParams, limit, offset]);
    
    return {
      data: announcements,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_records: total,
        per_page: limit
      },
      summary: {
        total_announcements: total,
        unread_count: announcements.filter(a => !a.is_read).length,
        urgent_count: announcements.filter(a => a.priority === 'urgent' && !a.is_read).length
      },
      user_role: membershipCheck[0].role_in_class,
      class_id: classId
    };
    
  } catch (error) {
    console.error('❌ getClassAnnouncements error:', error);
    throw new Error(`Failed to get announcements: ${error.message}`);
  }
};

/**
 * Submit class feedback - REAL DATABASE INSERT
 * @param {number} userId - User ID
 * @param {string} classId - Class ID
 * @param {Object} feedbackData - Feedback data
 * @returns {Object} Feedback submission result
 */
export const submitClassFeedback = async (userId, classId, feedbackData) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const {
      rating,
      feedback_text,
      feedback_type = 'general',
      session_id,
      is_anonymous = false
    } = feedbackData;
    
    // Verify user is member of class
    const membershipCheck = await connection.query(`
      SELECT role_in_class, membership_status, joinedAt
      FROM user_class_memberships
      WHERE user_id = ? AND class_id = ? AND membership_status = 'active'
    `, [userId, classId]);
    
    if (!membershipCheck.length) {
      throw new Error('Access denied - not a member of this class');
    }
    
    // Insert feedback
    const feedbackResult = await connection.query(`
      INSERT INTO class_feedback 
      (user_id, class_id, rating, feedback_text, feedback_type, session_id, is_anonymous, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [userId, classId, rating, feedback_text, feedback_type, session_id, is_anonymous ? 1 : 0]);
    
    // Update class statistics
    await connection.query(`
      UPDATE classes SET 
        total_feedback = total_feedback + 1,
        average_rating = (
          SELECT AVG(rating) FROM class_feedback 
          WHERE class_id = ? AND rating IS NOT NULL
        ),
        updatedAt = NOW()
      WHERE class_id = ?
    `, [classId, classId]);
    
    await connection.commit();
    
    return {
      success: true,
      feedback_id: feedbackResult.insertId,
      user_id: userId,
      class_id: classId,
      rating,
      feedback_type,
      submitted_at: new Date().toISOString(),
      message: 'Feedback submitted successfully'
    };
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ submitClassFeedback error:', error);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Mark class attendance - REAL DATABASE TRANSACTION
 * @param {number} userId - User ID
 * @param {string} classId - Class ID  
 * @param {Object} options - Attendance options
 * @returns {Object} Attendance result
 */
export const markClassAttendance = async (userId, classId, options = {}) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const {
      session_id,
      status = 'present',
      notes,
      check_in_time = new Date(),
      location
    } = options;
    
    // Verify user is member of class
    const membershipCheck = await connection.query(`
      SELECT role_in_class, membership_status
      FROM user_class_memberships
      WHERE user_id = ? AND class_id = ? AND membership_status = 'active'
    `, [userId, classId]);
    
    if (!membershipCheck.length) {
      throw new Error('Access denied - not a member of this class');
    }
    
    // Check if attendance already recorded for this session
    const existingAttendance = await connection.query(`
      SELECT id, status FROM class_attendance
      WHERE user_id = ? AND class_id = ? AND session_id = ?
    `, [userId, classId, session_id]);
    
    if (existingAttendance.length) {
      // Update existing attendance
      await connection.query(`
        UPDATE class_attendance SET
          status = ?, notes = ?, check_in_time = ?, location = ?, updatedAt = NOW()
        WHERE user_id = ? AND class_id = ? AND session_id = ?
      `, [status, notes, check_in_time, location, userId, classId, session_id]);
    } else {
      // Insert new attendance record
      await connection.query(`
        INSERT INTO class_attendance
        (user_id, class_id, session_id, status, notes, check_in_time, location, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [userId, classId, session_id, status, notes, check_in_time, location]);
    }
    
    // Update user's attendance statistics
    await connection.query(`
      UPDATE user_class_memberships SET
        total_sessions_attended = (
          SELECT COUNT(*) FROM class_attendance 
          WHERE user_id = ? AND class_id = ? AND status IN ('present', 'late')
        ),
        last_attendance = NOW(),
        updatedAt = NOW()
      WHERE user_id = ? AND class_id = ?
    `, [userId, classId, userId, classId]);
    
    await connection.commit();
    
    // Get updated attendance stats
    const attendanceStats = await db.query(`
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as late_count,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count
      FROM class_attendance
      WHERE user_id = ? AND class_id = ?
    `, [userId, classId]);
    
    const stats = attendanceStats[0] || {};
    
    return {
      success: true,
      user_id: userId,
      class_id: classId,
      session_id,
      status,
      notes,
      check_in_time,
      location,
      attendance_stats: {
        total_sessions: stats.total_sessions || 0,
        present_count: stats.present_count || 0,
        late_count: stats.late_count || 0,
        absent_count: stats.absent_count || 0,
        attendance_rate: stats.total_sessions > 0 ? 
          Math.round(((stats.present_count + stats.late_count) / stats.total_sessions) * 100) : 0
      },
      message: 'Attendance marked successfully'
    };
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ markClassAttendance error:', error);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Get class schedule - REAL DATABASE QUERY
 * @param {string} classId - Class ID
 * @param {number} userId - User ID
 * @param {Object} options - Query options
 * @returns {Object} Class schedule with real data
 */
export const getClassSchedule = async (classId, userId, options = {}) => {
  try {
    const { 
      start_date = new Date().toISOString().split('T')[0],
      end_date,
      session_type
    } = options;
    
    // Verify user access
    const membershipCheck = await db.query(`
      SELECT role_in_class, membership_status
      FROM user_class_memberships
      WHERE user_id = ? AND class_id = ? AND membership_status = 'active'
    `, [userId, classId]);
    
    if (!membershipCheck.length) {
      throw new Error('Access denied - not a member of this class');
    }
    
    // Build WHERE clause for schedule
    let whereClause = 'WHERE cs.class_id = ? AND cs.session_date >= ?';
    const queryParams = [classId, start_date];
    
    if (end_date) {
      whereClause += ' AND cs.session_date <= ?';
      queryParams.push(end_date);
    }
    
    if (session_type) {
      whereClause += ' AND cs.session_type = ?';
      queryParams.push(session_type);
    }
    
    // Get scheduled sessions
    const sessions = await db.query(`
      SELECT 
        cs.*,
        u.username as instructor_name,
        COUNT(ca.id) as attendees_count,
        COUNT(CASE WHEN ca.user_id = ? AND ca.status IN ('present', 'late') THEN 1 END) as user_attended
      FROM class_sessions cs
      LEFT JOIN users u ON cs.instructor_id = u.id
      LEFT JOIN class_attendance ca ON cs.id = ca.session_id
      ${whereClause}
      GROUP BY cs.id
      ORDER BY cs.session_date ASC, cs.start_time ASC
    `, [userId, ...queryParams]);
    
    return {
      class_id: classId,
      user_role: membershipCheck[0].role_in_class,
      schedule: {
        upcoming_sessions: sessions.filter(s => new Date(s.session_date) >= new Date()),
        past_sessions: sessions.filter(s => new Date(s.session_date) < new Date()),
        total_sessions: sessions.length
      },
      summary: {
        sessions_attended: sessions.filter(s => s.user_attended > 0).length,
        attendance_rate: sessions.length > 0 ? 
          Math.round((sessions.filter(s => s.user_attended > 0).length / sessions.length) * 100) : 0
      }
    };
    
  } catch (error) {
    console.error('❌ getClassSchedule error:', error);
    throw new Error(`Failed to get class schedule: ${error.message}`);
  }
};

/**
 * Get class progress for user - REAL DATABASE ANALYSIS
 * @param {number} userId - User ID
 * @param {string} classId - Class ID
 * @returns {Object} User's progress in class
 */
export const getClassProgress = async (userId, classId) => {
  try {
    // Verify membership
    const membershipCheck = await db.query(`
      SELECT role_in_class, joinedAt, membership_status
      FROM user_class_memberships
      WHERE user_id = ? AND class_id = ? AND membership_status = 'active'
    `, [userId, classId]);
    
    if (!membershipCheck.length) {
      throw new Error('Access denied - not a member of this class');
    }
    
    // Get comprehensive progress data
    const progressData = await db.query(`
      SELECT 
        -- Content progress
        COUNT(DISTINCT cc.id) as total_content,
        COUNT(DISTINCT ccv.content_id) as viewed_content,
        
        -- Attendance progress
        COUNT(DISTINCT cs.id) as total_sessions,
        COUNT(CASE WHEN ca.status IN ('present', 'late') THEN 1 END) as attended_sessions,
        
        -- Assignment progress (if exists)
        COUNT(DISTINCT cas.id) as total_assignments,
        COUNT(CASE WHEN cas.status = 'completed' THEN 1 END) as completed_assignments,
        
        -- Feedback given
        COUNT(DISTINCT cf.id) as feedback_given
        
      FROM classes c
      LEFT JOIN class_content cc ON c.class_id = cc.class_id AND cc.is_active = 1
      LEFT JOIN class_content_views ccv ON cc.id = ccv.content_id AND ccv.user_id = ?
      LEFT JOIN class_sessions cs ON c.class_id = cs.class_id
      LEFT JOIN class_attendance ca ON cs.id = ca.session_id AND ca.user_id = ?
      LEFT JOIN class_assignments cas ON c.class_id = cas.class_id AND cas.user_id = ?
      LEFT JOIN class_feedback cf ON c.class_id = cf.class_id AND cf.user_id = ?
      WHERE c.class_id = ?
      GROUP BY c.class_id
    `, [userId, userId, userId, userId, classId]);
    
    const stats = progressData[0] || {};
    const membership = membershipCheck[0];
    
    // Calculate progress percentages
    const contentProgress = stats.total_content > 0 ? 
      Math.round((stats.viewed_content / stats.total_content) * 100) : 0;
    
    const attendanceProgress = stats.total_sessions > 0 ? 
      Math.round((stats.attended_sessions / stats.total_sessions) * 100) : 0;
    
    const assignmentProgress = stats.total_assignments > 0 ? 
      Math.round((stats.completed_assignments / stats.total_assignments) * 100) : 0;
    
    // Overall progress calculation
    const overallProgress = Math.round((contentProgress + attendanceProgress + assignmentProgress) / 3);
    
    return {
      user_id: userId,
      class_id: classId,
      role_in_class: membership.role_in_class,
      membership_info: {
        joined_at: membership.joinedAt,
        days_as_member: Math.floor((new Date() - new Date(membership.joinedAt)) / (1000 * 60 * 60 * 24))
      },
      overall_progress: {
        percentage: overallProgress,
        status: overallProgress >= 80 ? 'excellent' : 
               overallProgress >= 60 ? 'good' : 
               overallProgress >= 40 ? 'fair' : 'needs_improvement'
      },
      content_progress: {
        viewed: stats.viewed_content || 0,
        total: stats.total_content || 0,
        percentage: contentProgress
      },
      attendance_progress: {
        attended: stats.attended_sessions || 0,
        total: stats.total_sessions || 0,
        percentage: attendanceProgress
      },
      assignment_progress: {
        completed: stats.completed_assignments || 0,
        total: stats.total_assignments || 0,
        percentage: assignmentProgress
      },
      engagement: {
        feedback_given: stats.feedback_given || 0,
        participation_score: overallProgress
      }
    };
    
  } catch (error) {
    console.error('❌ getClassProgress error:', error);
    throw new Error(`Failed to get class progress: ${error.message}`);
  }
};

export default {
  getAllClasses,
  getClassById,
  getUserClasses,
  joinClass,
  leaveClass,
  getClassMembers,
  getAvailableClasses,
  getClassContent,
  getClassAnnouncements,
  submitClassFeedback,
  markClassAttendance,
  getClassSchedule,
  getClassProgress
};






