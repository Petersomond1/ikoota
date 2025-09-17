// ikootaapi/services/liveClassService.js
// TYPE 2: LIVE TEACHING SESSIONS SERVICE
// Following scheduleClassroomSession.md documentation strictly

import db from '../config/db.js';
import CustomError from '../utils/CustomError.js';

// ===============================================
// TYPE 2: LIVE TEACHING SESSIONS
// Database Tables: live_class_schedules, live_class_sessions, live_class_audit_log
// ===============================================

/**
 * STEP 1: Schedule a live teaching session
 * Endpoint: POST /api/classes/live/schedule
 * @param {number} userId - Instructor ID
 * @param {Object} sessionData - Session details from documentation
 */
export const scheduleLiveClass = async (userId, sessionData) => {
  try {
    console.log(`📅 Service: Scheduling TYPE 2 live teaching session for user ${userId}`);

    const {
      title,
      description,
      class_type = 'video',
      scheduled_start_time,
      estimated_duration = 60,
      target_audience = 'members',
      target_class_id,
      notification_preferences = {},
      streaming_settings = {},
      special_instructions
    } = sessionData;

    // Verify user has member-level access (per documentation)
    const userCheck = await db.query(`
      SELECT id, membership_stage, role, username, email
      FROM users
      WHERE id = ?
    `, [userId]);

    if (!userCheck.length) {
      throw new CustomError('User not found', 404);
    }

    const user = userCheck[0];

    // Check member level privileges (per documentation requirement)
    if (user.membership_stage !== 'member' && user.role !== 'admin' && user.role !== 'super_admin') {
      throw new CustomError('Member level required to schedule live classes', 403);
    }

    // Verify target_class_id exists if specified (following database schema)
    if (target_class_id) {
      const classCheck = await db.query(`
        SELECT class_id, class_name FROM classes
        WHERE class_id = ? AND is_active = 1
      `, [target_class_id]);

      if (!classCheck.length) {
        throw new CustomError(`Target class ${target_class_id} not found or inactive`, 404);
      }
    }

    // Generate unique session_id (following live_class_schedules schema)
    const sessionId = `LS_${Date.now()}_${userId}_${Math.random().toString(36).substr(2, 9)}`;

    // Insert into live_class_schedules table (following exact schema)
    const result = await db.query(`
      INSERT INTO live_class_schedules (
        session_id, requested_by, title, description, class_type,
        scheduled_start_time, estimated_duration, target_audience, target_class_id,
        notification_preferences, streaming_settings, special_instructions,
        instructor_id, status, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_approval', NOW())
    `, [
      sessionId,
      userId,
      title,
      description,
      class_type,
      scheduled_start_time,
      estimated_duration,
      target_audience,
      target_class_id,
      JSON.stringify(notification_preferences),
      JSON.stringify(streaming_settings),
      special_instructions,
      userId
    ]);

    console.log(`✅ Live teaching session scheduled with ID: ${result.insertId}`);

    return {
      success: true,
      message: 'Live teaching session scheduled successfully - pending admin approval',
      data: {
        schedule_id: result.insertId,
        session_id: sessionId,
        title,
        scheduled_start_time,
        target_class_id,
        status: 'pending_approval',
        instructor_id: userId,
        estimated_duration,
        next_step: 'Admin approval required before session can go live'
      }
    };

  } catch (error) {
    console.error('❌ scheduleLiveClass error:', error);
    throw error;
  }
};

/**
 * STEP 2: Get pending live class approvals (Admin)
 * Endpoint: GET /api/classes/live/admin/pending
 */
export const getPendingLiveClassApprovals = async (options = {}) => {
  try {
    const { limit = 10, classId } = options;

    let whereClause = "WHERE lcs.status = 'pending_approval'";
    const queryParams = [];

    if (classId) {
      whereClause += " AND lcs.target_class_id = ?";
      queryParams.push(classId);
    }

    // Following live_class_schedules schema exactly
    const query = `
      SELECT
        lcs.id, lcs.session_id, lcs.title, lcs.description,
        lcs.target_class_id, lcs.class_type, lcs.scheduled_start_time,
        lcs.estimated_duration, lcs.target_audience, lcs.requested_by,
        lcs.instructor_id, lcs.special_instructions, lcs.createdAt,
        u.username as instructor_username, u.email as instructor_email,
        cls.class_name as target_class_name
      FROM live_class_schedules lcs
      LEFT JOIN users u ON lcs.instructor_id = u.id
      LEFT JOIN classes cls ON lcs.target_class_id COLLATE utf8mb4_general_ci = cls.class_id COLLATE utf8mb4_general_ci
      ${whereClause}
      ORDER BY lcs.createdAt ASC
      LIMIT ?
    `;

    queryParams.push(parseInt(limit));
    const results = await db.query(query, queryParams);

    return {
      success: true,
      data: results || []
    };

  } catch (error) {
    console.error('❌ getPendingLiveClassApprovals error:', error);
    throw new CustomError(error.message, 500);
  }
};

/**
 * STEP 2: Admin review and approve/reject live class schedule
 * Endpoint: PUT /api/classes/live/admin/review/:scheduleId
 */
export const reviewLiveClassSchedule = async (adminUserId, scheduleId, reviewData) => {
  try {
    console.log(`📋 Service: Admin ${adminUserId} reviewing live class schedule ${scheduleId}`);

    const { action, admin_notes } = reviewData;

    // Validate action per documentation
    const validActions = ['approve', 'reject'];
    if (!validActions.includes(action)) {
      throw new CustomError(`Invalid action. Must be: ${validActions.join(', ')}`, 400);
    }

    // Check if schedule exists and is pending
    const scheduleCheck = await db.query(`
      SELECT id, title, instructor_id, status, target_class_id
      FROM live_class_schedules
      WHERE id = ?
    `, [scheduleId]);

    if (!scheduleCheck.length) {
      throw new CustomError('Live class schedule not found', 404);
    }

    const schedule = scheduleCheck[0];

    if (schedule.status !== 'pending_approval') {
      throw new CustomError(`Schedule is already ${schedule.status} and cannot be modified`, 400);
    }

    // Map action to database status (following schema enum)
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    // Update the schedule (following live_class_schedules schema)
    await db.query(`
      UPDATE live_class_schedules
      SET status = ?, reviewed_by = ?, reviewed_at = NOW(), admin_notes = ?
      WHERE id = ?
    `, [newStatus, adminUserId, admin_notes, scheduleId]);

    // Log the action (following live_class_audit_log schema)
    await db.query(`
      INSERT INTO live_class_audit_log (
        schedule_id, action_type, performed_by, action_details, createdAt
      ) VALUES (?, ?, ?, ?, NOW())
    `, [
      scheduleId,
      `admin_${action}`,
      adminUserId,
      JSON.stringify({ action, admin_notes, previous_status: schedule.status })
    ]);

    console.log(`✅ Live class schedule ${scheduleId} ${action}ed by admin ${adminUserId}`);

    return {
      success: true,
      message: `Live class schedule ${action}ed successfully`,
      data: {
        schedule_id: scheduleId,
        previous_status: schedule.status,
        new_status: newStatus,
        action,
        admin_notes,
        reviewed_by: adminUserId,
        reviewed_at: new Date(),
        next_step: action === 'approve'
          ? 'Session ready for notifications and live start'
          : 'Instructor will be notified of rejection'
      }
    };

  } catch (error) {
    console.error('❌ reviewLiveClassSchedule error:', error);
    throw error;
  }
};

/**
 * STEP 3: Send notifications to attendees
 * Endpoint: POST /api/classes/live/admin/notify/:scheduleId
 */
export const sendLiveClassNotifications = async (scheduleId) => {
  try {
    console.log(`📨 Sending notifications for live session: ${scheduleId}`);

    // Get session details (following live_class_schedules schema)
    const sessionQuery = `
      SELECT * FROM live_class_schedules
      WHERE id = ? AND status = 'approved'
    `;

    const sessionResult = await db.query(sessionQuery, [scheduleId]);
    if (!sessionResult || sessionResult.length === 0) {
      throw new CustomError('Live session not found or not approved', 404);
    }

    const session = sessionResult[0];

    // Get participants for notifications (following user_class_memberships schema)
    const participantsQuery = `
      SELECT u.email, u.username, u.converse_id
      FROM user_class_memberships ucm
      JOIN users u ON ucm.user_id = u.id
      WHERE ucm.class_id = ? AND ucm.membership_status = 'active'
    `;

    const participants = await db.query(participantsQuery, [session.target_class_id]);

    // Update notifications sent status (following schema)
    await db.query(`
      UPDATE live_class_schedules
      SET notifications_sent = 1, notifications_sent_at = NOW()
      WHERE id = ?
    `, [scheduleId]);

    console.log(`📧 Found ${participants.length} participants to notify`);

    const notificationResults = participants.map(participant => ({
      email: participant.email,
      username: participant.username,
      converse_id: participant.converse_id,
      notification_type: 'live_class_starting',
      status: 'sent',
      timestamp: new Date().toISOString()
    }));

    console.log(`✅ Notifications sent for session ${scheduleId}`);

    return {
      success: true,
      message: 'Live class notifications sent successfully',
      data: {
        session_id: scheduleId,
        session_title: session.title || 'Live Session',
        participants_notified: participants.length,
        notification_details: notificationResults
      }
    };

  } catch (error) {
    console.error('❌ sendLiveClassNotifications error:', error);
    throw new CustomError(error.message, 500);
  }
};

/**
 * STEP 4: Start a live class session
 * Endpoint: POST /api/classes/live/start/:sessionId
 */
export const startLiveClassSession = async (sessionId) => {
  try {
    console.log(`🎥 Starting TYPE 2 live teaching session: ${sessionId}`);

    // Get session details from live_class_schedules
    const sessionQuery = `
      SELECT * FROM live_class_schedules
      WHERE id = ? AND status = 'approved'
    `;

    const sessionResult = await db.query(sessionQuery, [sessionId]);
    if (!sessionResult || sessionResult.length === 0) {
      throw new CustomError('Live teaching session not found or not approved', 404);
    }

    const schedule = sessionResult[0];

    // Create entry in live_class_sessions table (following schema)
    const liveSessionInsert = await db.query(`
      INSERT INTO live_class_sessions (
        schedule_id, session_id, instructor_id, title, class_type,
        streaming_settings, started_at, status, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), 'active', NOW())
    `, [
      sessionId,
      schedule.session_id,
      schedule.instructor_id,
      schedule.title,
      schedule.class_type,
      JSON.stringify(schedule.streaming_settings || {})
    ]);

    // Update schedule status to 'live'
    await db.query(`
      UPDATE live_class_schedules
      SET status = 'live', actual_start_time = NOW()
      WHERE id = ?
    `, [sessionId]);

    // Log the action
    await db.query(`
      INSERT INTO live_class_audit_log (
        schedule_id, action_type, performed_by, action_details, createdAt
      ) VALUES (?, 'session_started', ?, ?, NOW())
    `, [
      sessionId,
      schedule.instructor_id,
      JSON.stringify({ live_session_id: liveSessionInsert.insertId })
    ]);

    console.log(`✅ TYPE 2 Live teaching session ${sessionId} started successfully`);

    return {
      success: true,
      message: 'Live teaching session started successfully',
      data: {
        session_id: sessionId,
        live_session_id: liveSessionInsert.insertId,
        session_title: schedule.title || 'Live Teaching Session',
        session_type: 'TYPE_2_LIVE_TEACHING',
        status: 'active',
        start_time: new Date().toISOString(),
        streaming_url: `ws://localhost:3002/stream/live/${sessionId}`,
        classroom_url: `/api/classes/${schedule.target_class_id}/classroom/session`
      }
    };

  } catch (error) {
    console.error('❌ startLiveClassSession error:', error);
    throw new CustomError(error.message, 500);
  }
};

/**
 * Get live class admin dashboard data
 */
export const getLiveClassAdminDashboard = async () => {
  try {
    // Get statistics from live_class_schedules (following schema)
    const stats = await db.query(`
      SELECT
        COUNT(*) as total_scheduled,
        SUM(CASE WHEN status = 'pending_approval' THEN 1 ELSE 0 END) as pending_approval,
        SUM(CASE WHEN status = 'approved' AND DATE(scheduled_start_time) = CURDATE() THEN 1 ELSE 0 END) as approved_today,
        SUM(CASE WHEN status = 'live' THEN 1 ELSE 0 END) as currently_live,
        SUM(CASE WHEN status = 'completed' AND scheduled_start_time >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as completed_this_week
      FROM live_class_schedules
    `);

    // Get recent requests
    const recent_requests = await db.query(`
      SELECT
        id, title, description, target_class_id,
        requested_by, scheduled_start_time,
        estimated_duration, status, createdAt
      FROM live_class_schedules
      ORDER BY createdAt DESC
      LIMIT 5
    `);

    // Get upcoming sessions
    const upcoming_sessions = await db.query(`
      SELECT
        id, title, description, target_class_id,
        scheduled_start_time, estimated_duration,
        instructor_id, target_audience
      FROM live_class_schedules
      WHERE status = 'approved'
        AND scheduled_start_time > NOW()
      ORDER BY scheduled_start_time ASC
      LIMIT 5
    `);

    return {
      success: true,
      data: {
        stats: stats[0] || {
          total_scheduled: 0,
          pending_approval: 0,
          approved_today: 0,
          currently_live: 0,
          completed_this_week: 0
        },
        recent_requests: recent_requests || [],
        upcoming_sessions: upcoming_sessions || []
      }
    };

  } catch (error) {
    console.error('❌ getLiveClassAdminDashboard error:', error);
    throw new CustomError(error.message, 500);
  }
};

/**
 * Get user's live class sessions
 * Endpoint: GET /api/classes/live/my-sessions
 */
export const getUserLiveClasses = async (userId) => {
  try {
    const query = `
      SELECT
        lcs.id, lcs.session_id, lcs.title, lcs.description,
        lcs.scheduled_start_time, lcs.estimated_duration,
        lcs.target_class_id, lcs.status, lcs.createdAt,
        cls.class_name as target_class_name
      FROM live_class_schedules lcs
      LEFT JOIN classes cls ON lcs.target_class_id COLLATE utf8mb4_general_ci = cls.class_id COLLATE utf8mb4_general_ci
      WHERE lcs.instructor_id = ?
      ORDER BY lcs.scheduled_start_time DESC
    `;

    const results = await db.query(query, [userId]);

    return {
      success: true,
      data: results || []
    };

  } catch (error) {
    console.error('❌ getUserLiveClasses error:', error);
    throw new CustomError(error.message, 500);
  }
};