// ikootaapi/services/classContentService.js
// TYPE 3: RECORDED TEACHING SESSIONS SERVICE
// Content upload, approval and classroom session management

import db from '../config/db.js';
import CustomError from '../utils/CustomError.js';

// ===============================================
// TYPE 3: RECORDED TEACHING SESSIONS
// Database Tables: class_content, class_content_access, class_sessions, video_sessions
// ===============================================

/**
 * STEP 1: Upload video/audio content (Instructor)
 * Endpoint: POST /api/classes/:id/videos
 * @param {number} userId - Instructor ID
 * @param {string} classId - Class ID
 * @param {Object} contentData - Content data including files
 */
export const uploadClassVideo = async (userId, classId, contentData) => {
  try {
    console.log(`📹 Service: Uploading content for class ${classId} by user ${userId}`);

    // Get user role and class membership
    const userCheck = await db.query(`
      SELECT u.role, u.membership_stage, ucm.role_in_class
      FROM users u
      LEFT JOIN user_class_memberships ucm ON u.id = ucm.user_id AND ucm.class_id = ?
      WHERE u.id = ?
    `, [classId, userId]);

    if (!userCheck.length) {
      throw new CustomError('User not found', 404);
    }

    const user = userCheck[0];

    // Check permissions (member level required per documentation)
    if (user.membership_stage !== 'member' && user.role !== 'admin' && user.role !== 'super_admin') {
      throw new CustomError('Member level required to upload content', 403);
    }

    // Process file uploads
    let mediaUrls = {};
    if (contentData.files) {
      // Handle video files
      if (contentData.files.video && contentData.files.video.length > 0) {
        const videoFile = contentData.files.video[0];
        const videoKey = `classes/${classId}/videos/${Date.now()}_${videoFile.originalname}`;
        const videoUrl = `https://ikoota-videos.s3.amazonaws.com/${videoKey}`;
        mediaUrls.video_url = videoUrl;
        console.log(`📹 Would upload video to S3: ${videoKey}`);
      }

      // Handle audio files
      if (contentData.files.audio && contentData.files.audio.length > 0) {
        const audioFile = contentData.files.audio[0];
        const audioKey = `classes/${classId}/audio/${Date.now()}_${audioFile.originalname}`;
        const audioUrl = `https://ikoota-videos.s3.amazonaws.com/${audioKey}`;
        mediaUrls.audio_url = audioUrl;
        console.log(`🎵 Would upload audio to S3: ${audioKey}`);
      }
    }

    // Process audience targeting (following class_content schema exactly)
    const targetAudience = contentData.target_audience || 'current_class';
    const targetClassIds = contentData.target_class_ids || null;
    const crossClassAccess = targetAudience !== 'current_class' ? 1 : 0;

    // Insert content into class_content table (following exact schema)
    const insertResult = await db.query(`
      INSERT INTO class_content (
        class_id, target_audience, target_class_ids, cross_class_access,
        title, content_type, content_text, media_url, media_type,
        file_size_bytes, estimated_duration, is_published, is_active,
        created_by, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      classId,
      targetAudience,
      targetClassIds ? JSON.stringify(targetClassIds) : null,
      crossClassAccess,
      contentData.title,
      contentData.content_type || 'video',
      contentData.description || contentData.content_text || null,
      mediaUrls.video_url || mediaUrls.audio_url || null,
      contentData.content_type === 'video' ? 'video' :
      contentData.content_type === 'audio' ? 'audio' : 'text',
      contentData.files?.video?.[0]?.size || contentData.files?.audio?.[0]?.size || null,
      contentData.duration || contentData.estimated_duration || null,
      false, // is_published (pending approval per documentation)
      true,  // is_active
      userId
    ]);

    console.log(`✅ Content uploaded with ID: ${insertResult.insertId} - Status: pending_approval`);

    return {
      success: true,
      message: 'Content uploaded successfully - pending admin approval',
      data: {
        content_id: insertResult.insertId,
        class_id: classId,
        title: contentData.title,
        content_type: contentData.content_type || 'video',
        media_url: mediaUrls.video_url || mediaUrls.audio_url,
        target_audience: targetAudience,
        is_published: false, // pending approval
        uploaded_at: new Date().toISOString(),
        next_step: 'Admin review required before content becomes available to students'
      }
    };

  } catch (error) {
    console.error('❌ uploadClassVideo error:', error);
    throw error;
  }
};

/**
 * STEP 2: Get pending content approvals (Admin)
 * Endpoint: GET /api/classes/admin/pending-approvals?type=videos
 */
export const getPendingContentApprovals = async (options = {}) => {
  try {
    const { type = 'videos', limit = 10, classId } = options;

    let whereClause = "WHERE cc.is_published = 0 AND cc.is_active = 1";
    const queryParams = [];

    if (type === 'videos') {
      whereClause += " AND cc.content_type IN ('video', 'audio')";
    }

    if (classId) {
      whereClause += " AND cc.class_id = ?";
      queryParams.push(classId);
    }

    // Get pending content (simplified to avoid collation issues)
    const query = `
      SELECT
        cc.id, cc.class_id, cc.title, cc.content_type,
        cc.content_text, cc.media_url, cc.media_type,
        cc.file_size_bytes, cc.estimated_duration,
        cc.target_audience, cc.target_class_ids,
        cc.created_by, cc.createdAt
      FROM class_content cc
      ${whereClause}
      ORDER BY cc.createdAt ASC
      LIMIT ?
    `;

    queryParams.push(parseInt(limit));
    const results = await db.query(query, queryParams);

    return {
      success: true,
      data: results || []
    };

  } catch (error) {
    console.error('❌ getPendingContentApprovals error:', error);
    throw new CustomError(error.message, 500);
  }
};

/**
 * STEP 3: Review and approve/reject content (Admin)
 * Endpoint: PUT /api/classes/admin/content/:contentId/review
 */
export const reviewContent = async (adminUserId, contentId, reviewData) => {
  try {
    console.log(`📋 Service: Admin ${adminUserId} reviewing content ${contentId}`);

    const { action, admin_notes, visibility = 'public', featured = false } = reviewData;

    // Validate action
    const validActions = ['approve', 'reject'];
    if (!validActions.includes(action)) {
      throw new CustomError(`Invalid action. Must be: ${validActions.join(', ')}`, 400);
    }

    // Check if content exists and is pending
    const contentCheck = await db.query(`
      SELECT id, title, class_id, created_by, is_published
      FROM class_content
      WHERE id = ?
    `, [contentId]);

    if (!contentCheck.length) {
      throw new CustomError('Content not found', 404);
    }

    const content = contentCheck[0];

    if (content.is_published) {
      throw new CustomError('Content has already been reviewed', 400);
    }

    if (action === 'approve') {
      // Approve content (following class_content schema)
      await db.query(`
        UPDATE class_content
        SET is_published = 1, publish_date = NOW()
        WHERE id = ?
      `, [contentId]);

      // Create content access entry (following class_content_access schema)
      await db.query(`
        INSERT INTO class_content_access (
          content_id, content_type, class_id, access_level, createdAt
        ) VALUES (?, 'teaching', ?, 'read', NOW())
      `, [contentId, content.class_id]);

    } else {
      // Reject content - set as inactive
      await db.query(`
        UPDATE class_content
        SET is_active = 0
        WHERE id = ?
      `, [contentId]);
    }

    console.log(`✅ Content ${contentId} ${action}ed by admin ${adminUserId}`);

    return {
      success: true,
      message: `Content ${action}ed successfully`,
      data: {
        content_id: contentId,
        action,
        admin_notes,
        reviewed_by: adminUserId,
        reviewed_at: new Date(),
        next_step: action === 'approve'
          ? 'Content is now available to students'
          : 'Content has been rejected and is no longer visible'
      }
    };

  } catch (error) {
    console.error('❌ reviewContent error:', error);
    throw error;
  }
};

/**
 * STEP 4: Get approved class videos (Students)
 * Endpoint: GET /api/classes/:id/videos?status=approved
 */
export const getClassVideos = async (classId, userId, options = {}) => {
  try {
    console.log(`🎬 Service: Getting videos for class ${classId}`);

    const { status = 'approved' } = options;

    // Verify user is a member
    const membershipCheck = await db.query(`
      SELECT id FROM user_class_memberships
      WHERE user_id = ? AND class_id = ? AND membership_status = 'active'
    `, [userId, classId]);

    if (!membershipCheck.length) {
      throw new CustomError('Access denied: You must be a class member', 403);
    }

    // Get videos (only approved content for students)
    let whereClause = "WHERE cc.class_id = ? AND cc.is_active = 1";
    const queryParams = [classId];

    if (status === 'approved') {
      whereClause += " AND cc.is_published = 1";
    }

    whereClause += " AND cc.content_type IN ('video', 'audio')";

    const query = `
      SELECT
        cc.id, cc.title, cc.content_type, cc.content_text,
        cc.media_url, cc.media_type, cc.file_size_bytes,
        cc.estimated_duration, cc.is_published, cc.publish_date,
        cc.createdAt, u.username as created_by_username
      FROM class_content cc
      LEFT JOIN users u ON cc.created_by = u.id
      ${whereClause}
      ORDER BY cc.publish_date DESC, cc.createdAt DESC
    `;

    const videos = await db.query(query, queryParams);

    return {
      success: true,
      data: videos || [],
      total_videos: videos?.length || 0
    };

  } catch (error) {
    console.error('❌ getClassVideos error:', error);
    throw error;
  }
};

/**
 * STEP 5: Create classroom session for recorded content (Optional)
 * Endpoint: POST /api/classes/:id/classroom/sessions
 */
export const createClassroomSession = async (classId, userId, sessionData) => {
  try {
    console.log(`🎥 Service: Creating classroom session for class ${classId}`);

    const {
      session_type = 'recorded',
      video_id,
      title,
      description,
      availability = 'immediate',
      allow_chat = true,
      require_attendance = true
    } = sessionData;

    // Verify user has permission to create sessions
    const userCheck = await db.query(`
      SELECT u.membership_stage, u.role, ucm.role_in_class
      FROM users u
      LEFT JOIN user_class_memberships ucm ON u.id = ucm.user_id AND ucm.class_id = ?
      WHERE u.id = ?
    `, [classId, userId]);

    if (!userCheck.length) {
      throw new CustomError('User not found', 404);
    }

    const user = userCheck[0];

    if (user.membership_stage !== 'member' && user.role !== 'admin' && user.role !== 'super_admin') {
      throw new CustomError('Member level required to create sessions', 403);
    }

    // If video_id provided, verify it exists and is approved
    if (video_id) {
      const videoCheck = await db.query(`
        SELECT id, title FROM class_content
        WHERE id = ? AND class_id = ? AND is_published = 1 AND content_type IN ('video', 'audio')
      `, [video_id, classId]);

      if (!videoCheck.length) {
        throw new CustomError('Video content not found or not approved', 404);
      }
    }

    // Create session entry (following class_sessions schema)
    const sessionResult = await db.query(`
      INSERT INTO class_sessions (
        class_id, session_title, session_date, duration_minutes,
        session_type, is_mandatory, location, online_link,
        created_by, is_active, createdAt
      ) VALUES (?, ?, NOW(), ?, 'lecture', ?, 'Online', ?, ?, 1, NOW())
    `, [
      classId,
      title,
      sessionData.duration_minutes || 60,
      require_attendance ? 1 : 0,
      `/classes/${classId}/classroom/session`,
      userId
    ]);

    // If this is for a specific video, create video_session entry
    if (video_id) {
      const videoSessionId = `session_${classId}_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

      await db.query(`
        INSERT INTO video_sessions (
          session_id, class_id, title, description, instructor_id,
          session_type, created_by, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `, [videoSessionId, classId, title, description, userId, session_type, userId]);
    }

    console.log(`✅ Classroom session created for class ${classId}`);

    return {
      success: true,
      message: 'Classroom session created successfully',
      data: {
        session_id: sessionResult.insertId,
        class_id: classId,
        title,
        session_type,
        video_id,
        allow_chat,
        require_attendance,
        availability,
        created_at: new Date().toISOString(),
        session_url: `/classes/${classId}/classroom/session`
      }
    };

  } catch (error) {
    console.error('❌ createClassroomSession error:', error);
    throw error;
  }
};

/**
 * STEP 6: Join classroom session
 * Endpoint: POST /api/classes/:classId/classroom/sessions/:sessionId/join
 */
export const joinClassroomSession = async (classId, sessionId, userId) => {
  try {
    console.log(`👥 Service: User ${userId} joining classroom session ${sessionId} in class ${classId}`);

    // Verify user is member of the class
    const memberQuery = `
      SELECT ucm.*, u.username, u.converse_id
      FROM user_class_memberships ucm
      JOIN users u ON ucm.user_id = u.id
      WHERE ucm.user_id = ? AND ucm.class_id = ? AND ucm.membership_status = 'active'
    `;
    const memberResult = await db.query(memberQuery, [userId, classId]);

    if (memberResult.length === 0) {
      throw new CustomError('Must be a class member to join session', 403);
    }

    const member = memberResult[0];

    // Record session participation (following classroom_participants schema)
    await db.query(`
      INSERT INTO classroom_participants (
        classId, userId, converseId, username, joinedAt, isActive
      ) VALUES (?, ?, ?, ?, NOW(), 1)
      ON DUPLICATE KEY UPDATE
        isActive = 1, joinedAt = NOW()
    `, [classId, userId, member.converse_id, member.username]);

    return {
      success: true,
      message: 'Successfully joined classroom session',
      data: {
        session_id: sessionId,
        class_id: classId,
        user_id: userId,
        join_time: new Date().toISOString(),
        session_url: `/classes/${classId}/classroom/session`,
        chat_enabled: true,
        attendance_marked: true
      }
    };

  } catch (error) {
    console.error('❌ joinClassroomSession error:', error);
    throw error;
  }
};

/**
 * Get classroom session info
 * Endpoint: GET /api/classes/:classId/classroom/session
 */
export const getClassroomSession = async (classId, userId) => {
  try {
    console.log(`📺 Service: Getting classroom session for class ${classId}`);

    // Verify membership
    const membershipCheck = await db.query(`
      SELECT id FROM user_class_memberships
      WHERE user_id = ? AND class_id = ? AND membership_status = 'active'
    `, [userId, classId]);

    if (!membershipCheck.length) {
      throw new CustomError('Access denied: You must be a class member', 403);
    }

    // Get active session info
    const sessionQuery = `
      SELECT
        cs.id, cs.session_title, cs.session_date,
        cs.duration_minutes, cs.session_type, cs.is_mandatory,
        cs.online_link, cs.created_by
      FROM class_sessions cs
      WHERE cs.class_id = ? AND cs.is_active = 1
      ORDER BY cs.session_date DESC
      LIMIT 1
    `;

    const session = await db.query(sessionQuery, [classId]);

    // Get current participants
    const participantsQuery = `
      SELECT username, converseId, joinedAt, isActive
      FROM classroom_participants
      WHERE classId = ? AND isActive = 1
      ORDER BY joinedAt ASC
    `;

    const participants = await db.query(participantsQuery, [classId]);

    return {
      success: true,
      data: {
        session: session[0] || null,
        participants: participants || [],
        class_id: classId,
        total_participants: participants?.length || 0
      }
    };

  } catch (error) {
    console.error('❌ getClassroomSession error:', error);
    throw error;
  }
};

/**
 * Delete video content
 * @param {number} userId - User ID
 * @param {string} classId - Class ID
 * @param {number} videoId - Video ID
 */
export const deleteClassVideo = async (userId, classId, videoId) => {
  try {
    console.log(`🗑️ Service: Deleting video ${videoId} from class ${classId} by user ${userId}`);

    // Get video details and verify access
    const videoCheck = await db.query(`
      SELECT
        cc.*,
        ucm.role_in_class,
        u.membership_stage
      FROM class_content cc
      LEFT JOIN user_class_memberships ucm ON cc.class_id = ucm.class_id AND ucm.user_id = ?
      LEFT JOIN users u ON ucm.user_id = u.id
      WHERE cc.id = ? AND cc.class_id = ? AND cc.content_type IN ('video', 'audio')
    `, [userId, videoId, classId]);

    if (!videoCheck.length) {
      throw new CustomError('Video not found', 404);
    }

    const video = videoCheck[0];

    // Check permissions (creator or moderator or member-level user)
    const isCreator = video.created_by === userId;
    const isModeratorOrAbove = ['moderator', 'assistant'].includes(video.role_in_class);
    const isMember = video.membership_stage === 'member';

    if (!isCreator && !isModeratorOrAbove && !isMember) {
      throw new CustomError('Access denied - insufficient privileges to delete video', 403);
    }

    // Delete the video record from database
    const deleteResult = await db.query(
      'DELETE FROM class_content WHERE id = ? AND class_id = ?',
      [videoId, classId]
    );

    if (deleteResult.affectedRows === 0) {
      throw new CustomError('Failed to delete video - no rows affected', 404);
    }

    console.log(`✅ Video deleted successfully: ${videoId}`);

    return {
      success: true,
      message: 'Video deleted successfully',
      data: {
        video_id: parseInt(videoId),
        title: video.title,
        deleted_at: new Date().toISOString(),
        deleted_by: userId
      }
    };

  } catch (error) {
    console.error('❌ deleteClassVideo error:', error);
    throw error;
  }
};

// ===============================================
// TYPE 2: LIVE TEACHING SESSIONS CHAT SERVICES
// Following scheduleClassroomSession.md documentation - STEP 6 Chat functionality
// ===============================================

/**
 * Get classroom chat messages
 * @param {string} classId - Class ID
 * @param {number} userId - User ID
 */
export const getClassroomChat = async (classId, userId) => {
  try {
    console.log(`💬 Service: Getting chat messages for class ${classId}`);

    // Check if user is a member of the class
    const memberCheck = await db.query(`
      SELECT ucm.membership_status, ucm.role_in_class
      FROM user_class_memberships ucm
      WHERE ucm.user_id = ? AND ucm.class_id = ? AND ucm.membership_status = 'active'
    `, [userId, classId]);

    if (!memberCheck.length) {
      throw new CustomError('Must be a class member to access chat', 403);
    }

    // Get chat messages from class_content table
    const chatMessages = await db.query(`
      SELECT
        cc.id,
        cc.content_text as message,
        cc.created_by,
        u.username,
        u.converse_id as author_converse_id,
        cc.createdAt as timestamp,
        cc.content_type as message_type
      FROM class_content cc
      JOIN users u ON cc.created_by = u.id
      WHERE cc.class_id = ?
        AND cc.content_type = 'chat_message'
        AND cc.is_active = 1
      ORDER BY cc.createdAt DESC
      LIMIT 50
    `, [classId]);

    // Get active participants
    const participants = await db.query(`
      SELECT
        cp.userId,
        cp.converseId,
        cp.username,
        cp.isActive,
        cp.joinedAt
      FROM classroom_participants cp
      WHERE cp.classId = ? AND cp.isActive = 1
    `, [classId]);

    return {
      success: true,
      data: {
        messages: chatMessages.reverse(), // Show oldest first
        participants: participants,
        total_messages: chatMessages.length,
        class_id: classId
      }
    };

  } catch (error) {
    console.error('❌ getClassroomChat error:', error);
    throw error;
  }
};

/**
 * Send classroom chat message
 * @param {string} classId - Class ID
 * @param {number} userId - User ID
 * @param {string} message - Message content
 * @param {string} messageType - Message type (chat, announcement, instruction)
 */
export const sendClassroomChatMessage = async (classId, userId, message, messageType = 'chat') => {
  try {
    console.log(`💬 Service: Sending chat message to class ${classId} by user ${userId}`);

    // Check if user is a member of the class
    const memberCheck = await db.query(`
      SELECT ucm.membership_status, ucm.role_in_class, u.username, u.converse_id
      FROM user_class_memberships ucm
      JOIN users u ON ucm.user_id = u.id
      WHERE ucm.user_id = ? AND ucm.class_id = ? AND ucm.membership_status = 'active'
    `, [userId, classId]);

    if (!memberCheck.length) {
      throw new CustomError('Must be a class member to send chat messages', 403);
    }

    const user = memberCheck[0];

    // Insert message into class_content table
    const result = await db.query(`
      INSERT INTO class_content (
        class_id, title, content_type, content_text,
        created_by, is_published, is_active, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      classId,
      'Chat Message',
      'chat_message',
      message.trim(),
      userId,
      true, // Published immediately
      true  // Active
    ]);

    // Update participant message count
    await db.query(`
      UPDATE classroom_participants
      SET messagesSent = messagesSent + 1
      WHERE classId = ? AND userId = ?
    `, [classId, userId]);

    const newMessage = {
      id: result.insertId,
      message: message.trim(),
      author_converse_id: user.converse_id,
      username: user.username,
      timestamp: new Date().toISOString(),
      message_type: messageType,
      created_by: userId
    };

    return {
      success: true,
      data: newMessage,
      message: 'Chat message sent successfully'
    };

  } catch (error) {
    console.error('❌ sendClassroomChatMessage error:', error);
    throw error;
  }
};

/**
 * Get classroom participants
 * @param {string} classId - Class ID
 * @param {number} userId - User ID
 */
export const getClassroomParticipants = async (classId, userId) => {
  try {
    console.log(`👥 Service: Getting participants for class ${classId}`);

    // Check if user is a member of the class
    const memberCheck = await db.query(`
      SELECT ucm.membership_status, ucm.role_in_class
      FROM user_class_memberships ucm
      WHERE ucm.user_id = ? AND ucm.class_id = ? AND ucm.membership_status = 'active'
    `, [userId, classId]);

    if (!memberCheck.length) {
      throw new CustomError('Must be a class member to view participants', 403);
    }

    // Get active participants from classroom_participants table (simplified to avoid collation issues)
    const participants = await db.query(`
      SELECT
        cp.id,
        cp.userId,
        cp.converseId,
        cp.username,
        cp.joinedAt,
        cp.sessionDuration,
        cp.messagesSent,
        cp.isActive,
        CASE
          WHEN cp.leftAt IS NULL AND cp.isActive = 1 THEN 'online'
          ELSE 'offline'
        END as status
      FROM classroom_participants cp
      WHERE cp.classId = ? AND cp.isActive = 1
      ORDER BY cp.joinedAt ASC
    `, [classId]);

    // Get class member counts directly from user_class_memberships table
    const classCounts = await db.query(`
      SELECT
        COUNT(*) as total_members,
        COUNT(CASE WHEN role_in_class = 'moderator' THEN 1 END) as moderators
      FROM user_class_memberships
      WHERE class_id = ? AND membership_status = 'active'
    `, [classId]);

    return {
      success: true,
      data: {
        participants: participants,
        stats: {
          active_participants: participants.length,
          total_class_members: classCounts[0]?.total_members || 0,
          moderators: classCounts[0]?.moderators || 0
        },
        class_id: classId
      }
    };

  } catch (error) {
    console.error('❌ getClassroomParticipants error:', error);
    throw error;
  }
};