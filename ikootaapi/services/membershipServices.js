// ikootaapi/services/membershipServices.js
// FIXED: camelCase timestamps + db.query() instead of db.execute()
// Uses correct MySQL schema and field names from provided database

import db from '../config/db.js';
import { generateUniqueConverseId } from '../utils/idGenerator.js';
import { sendNotification } from '../utils/notifications.js';

// =============================================================================
// CORE MEMBERSHIP STATUS OPERATIONS
// =============================================================================

/**
 * Get comprehensive user membership status
 * @param {number} userId - User ID
 * @returns {Object} Complete membership status
 */
export const getUserMembershipStatus = async (userId) => {
  try {
    const result = await db.query(`
      SELECT 
        u.id, u.username, u.email, u.membership_stage, u.is_member,
        u.application_status, u.full_membership_status,
        u.converse_id, u.application_ticket, u.full_membership_ticket,
        u.applicationSubmittedAt, u.applicationReviewedAt,
        u.fullMembershipAppliedAt, u.fullMembershipReviewedAt,
        u.mentor_id, u.primary_class_id, u.total_classes,
        sl.approval_status as survey_status,
        sl.application_type as survey_type,
        fma.status as full_application_status,
        fma.submittedAt as full_application_submitted,
        fma.reviewedAt as full_application_reviewed
      FROM users u
      LEFT JOIN surveylog sl ON u.id = sl.user_id 
        AND sl.application_type = 'initial_application'
        AND sl.id = (
          SELECT MAX(id) FROM surveylog sl2 
          WHERE sl2.user_id = u.id AND sl2.application_type = 'initial_application'
        )
      LEFT JOIN full_membership_applications fma ON u.id = fma.user_id
      WHERE u.id = ? AND u.role = 'user'
    `, [userId]);

    if (!result.length) {
      throw new Error('User not found or not a regular user');
    }

    const user = result[0];
    
    // Calculate status progression
    const statusProgression = calculateStatusProgression(user);
    
    return {
      userId: user.id,
      username: user.username,
      email: user.email,
      
      // Current Status
      membership_stage: user.membership_stage || 'none',
      is_member: user.is_member || 'applied',
      application_status: user.application_status || 'not_submitted',
      full_membership_status: user.full_membership_status || 'not_applied',
      
      // Identifiers
      converse_id: user.converse_id,
      application_ticket: user.application_ticket,
      full_membership_ticket: user.full_membership_ticket,
      
      // Relationships
      mentor_id: user.mentor_id,
      primary_class_id: user.primary_class_id,
      total_classes: user.total_classes || 0,
      
      // Application Info
      initial_application: {
        status: user.survey_status || 'not_submitted',
        type: user.survey_type,
        submittedAt: user.applicationSubmittedAt,
        reviewedAt: user.applicationReviewedAt
      },
      
      full_membership_application: {
        status: user.full_application_status || 'not_applied',
        submittedAt: user.full_application_submitted,
        reviewedAt: user.full_application_reviewed
      },
      
      // Status Analysis
      status_progression: statusProgression,
      can_apply_full_membership: canApplyForFullMembership(user),
      next_actions: getNextActions(user)
    };

  } catch (error) {
    console.error('❌ Error getting user membership status:', error);
    throw new Error(`Failed to get membership status: ${error.message}`);
  }
};

/**
 * Get membership dashboard data for user
 * @param {number} userId - User ID
 * @returns {Object} Dashboard data
 */
export const getMembershipDashboard = async (userId) => {
  try {
    const membershipStatus = await getUserMembershipStatus(userId);
    
    // Get additional dashboard data
    const notifications = await db.query(`
      SELECT * FROM notification_queue 
      WHERE user_id = ? AND status = 'pending'
      ORDER BY createdAt DESC LIMIT 5
    `, [userId]);

    const recentActivity = await db.query(`
      SELECT action, details, createdAt 
      FROM audit_logs 
      WHERE user_id = ? 
      ORDER BY createdAt DESC LIMIT 10
    `, [userId]);

    // Get class information if user has classes
    let classInfo = null;
    if (membershipStatus.primary_class_id) {
      const classData = await db.query(`
        SELECT class_id, class_name, class_description, member_count
        FROM classes 
        WHERE class_id = ?
      `, [membershipStatus.primary_class_id]);
      
      if (classData.length) {
        classInfo = classData[0];
      }
    }

    return {
      membership_status: membershipStatus,
      notifications: notifications || [],
      recent_activity: recentActivity || [],
      class_info: classInfo,
      dashboard_stats: {
        total_notifications: notifications?.length || 0,
        membership_progress: calculateMembershipProgress(membershipStatus),
        account_completeness: calculateAccountCompleteness(membershipStatus)
      }
    };

  } catch (error) {
    console.error('❌ Error getting membership dashboard:', error);
    throw new Error(`Failed to get dashboard data: ${error.message}`);
  }
};

// =============================================================================
// APPLICATION SUBMISSION OPERATIONS
// =============================================================================

/**
 * Submit initial membership application
 * @param {number} userId - User ID
 * @param {Array} answers - Survey answers
 * @param {string} applicationTicket - Application ticket
 * @returns {Object} Submission result
 */
export const submitInitialApplication = async (userId, answers, applicationTicket) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Validate user can apply
    const userCheck = await connection.query(`
      SELECT id, username, email, membership_stage, application_status 
      FROM users WHERE id = ?
    `, [userId]);

    if (!userCheck.length) {
      throw new Error('User not found');
    }

    const user = userCheck[0];

    // Check if user can apply
    if (user.membership_stage && user.membership_stage !== 'none' && user.membership_stage !== 'applicant') {
      throw new Error('User has already progressed beyond initial application stage');
    }

    // Check for existing pending application
    const existingApp = await connection.query(`
      SELECT id FROM surveylog 
      WHERE user_id = ? AND application_type = 'initial_application' 
      AND approval_status = 'pending'
    `, [userId]);

    if (existingApp.length) {
      throw new Error('User already has a pending application');
    }

    // Generate application ticket if not provided
    const finalTicket = applicationTicket || `APP-${Date.now()}-${userId}`;

    // Insert survey log entry
    const surveyResult = await connection.query(`
      INSERT INTO surveylog (
        user_id, answers, application_type, application_ticket,
        approval_status, createdAt, processedAt
      ) VALUES (?, ?, 'initial_application', ?, 'pending', NOW(), NOW())
    `, [userId, JSON.stringify(answers), finalTicket]);

    // Update user status
    await connection.query(`
      UPDATE users SET 
        membership_stage = 'applicant',
        application_status = 'submitted',
        application_ticket = ?,
        applicationSubmittedAt = NOW(),
        updatedAt = NOW()
      WHERE id = ?
    `, [finalTicket, userId]);

    await connection.commit();

    // Send notification (non-blocking)
    setImmediate(async () => {
      try {
        await sendNotification(
          user.email,
          'email',
          'welcome_registration',
          {
            USERNAME: user.username,
            APPLICATION_TICKET: finalTicket
          }
        );
      } catch (notifError) {
        console.warn('Failed to send application notification:', notifError.message);
      }
    });

    console.log('✅ Initial application submitted:', { userId, applicationId: surveyResult.insertId });

    return {
      success: true,
      application_id: surveyResult.insertId,
      application_ticket: finalTicket,
      status: 'pending',
      message: 'Initial application submitted successfully'
    };

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error submitting initial application:', error);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Submit full membership application
 * @param {number} userId - User ID
 * @param {Array} answers - Application answers
 * @param {string} membershipTicket - Membership ticket
 * @returns {Object} Submission result
 */
export const submitFullMembershipApplication = async (userId, answers, membershipTicket) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Validate user eligibility
    const userCheck = await connection.query(`
      SELECT id, username, email, membership_stage, full_membership_status 
      FROM users WHERE id = ?
    `, [userId]);

    if (!userCheck.length) {
      throw new Error('User not found');
    }

    const user = userCheck[0];

    // Must be pre-member to apply for full membership
    if (user.membership_stage !== 'pre_member') {
      throw new Error('User must be pre-member to apply for full membership');
    }

    // Check if can apply
    if (user.full_membership_status === 'pending') {
      throw new Error('User already has a pending full membership application');
    }

    if (user.full_membership_status === 'approved') {
      throw new Error('User already has approved full membership');
    }

    // Generate membership ticket if not provided
    const finalTicket = membershipTicket || `FM-${Date.now()}-${userId}`;

    // Check for existing application
    const existingApp = await connection.query(`
      SELECT id FROM full_membership_applications WHERE user_id = ?
    `, [userId]);

    if (existingApp.length) {
      // Update existing application
      await connection.query(`
        UPDATE full_membership_applications SET
          answers = ?, membership_ticket = ?, status = 'pending',
          submittedAt = NOW(), updatedAt = NOW()
        WHERE user_id = ?
      `, [JSON.stringify(answers), finalTicket, userId]);
    } else {
      // Create new application
      await connection.query(`
        INSERT INTO full_membership_applications (
          user_id, membership_ticket, answers, status, submittedAt, createdAt
        ) VALUES (?, ?, ?, 'pending', NOW(), NOW())
      `, [userId, finalTicket, JSON.stringify(answers)]);
    }

    // Update user status
    await connection.query(`
      UPDATE users SET 
        full_membership_status = 'pending',
        full_membership_ticket = ?,
        fullMembershipAppliedAt = NOW(),
        updatedAt = NOW()
      WHERE id = ?
    `, [finalTicket, userId]);

    await connection.commit();

    console.log('✅ Full membership application submitted:', { userId, ticket: finalTicket });

    return {
      success: true,
      membership_ticket: finalTicket,
      status: 'pending',
      message: 'Full membership application submitted successfully'
    };

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error submitting full membership application:', error);
    throw error;
  } finally {
    connection.release();
  }
};

// =============================================================================
// MEMBERSHIP ANALYTICS
// =============================================================================

/**
 * Get membership analytics for user
 * @param {number} userId - User ID
 * @returns {Object} Analytics data
 */
export const getMembershipAnalytics = async (userId) => {
  try {
    const userStats = await db.query(`
      SELECT 
        u.membership_stage,
        u.is_member,
        u.total_classes,
        u.createdAt as account_created,
        u.applicationSubmittedAt,
        u.fullMembershipAppliedAt,
        COUNT(DISTINCT al.id) as total_activities,
        COUNT(DISTINCT cca.id) as content_accesses
      FROM users u
      LEFT JOIN audit_logs al ON u.id = al.user_id
      LEFT JOIN class_content_access cca ON u.id = cca.user_id
      WHERE u.id = ?
      GROUP BY u.id
    `, [userId]);

    if (!userStats.length) {
      throw new Error('User not found');
    }

    const stats = userStats[0];

    // Calculate membership journey timing
    const journeyTiming = calculateJourneyTiming(stats);

    // Get stage distribution for comparison
    const stageDistribution = await db.query(`
      SELECT membership_stage, COUNT(*) as count
      FROM users 
      WHERE role = 'user'
      GROUP BY membership_stage
    `);

    return {
      user_stats: {
        membership_stage: stats.membership_stage,
        is_member: stats.is_member,
        total_classes: stats.total_classes || 0,
        total_activities: stats.total_activities || 0,
        content_accesses: stats.content_accesses || 0,
        account_age_days: calculateDaysSince(stats.account_created)
      },
      journey_timing: journeyTiming,
      comparison_data: {
        stage_distribution: stageDistribution || [],
        user_percentile: calculateUserPercentile(stats, stageDistribution)
      }
    };

  } catch (error) {
    console.error('❌ Error getting membership analytics:', error);
    throw new Error(`Failed to get analytics: ${error.message}`);
  }
};

// =============================================================================
// ADDITIONAL SERVICE METHODS FOR CONTROLLERS
// =============================================================================

/**
 * Get membership profile for user
 * @param {number} userId - User ID
 * @returns {Object} Membership profile
 */
export const getMembershipProfile = async (userId) => {
  try {
    const result = await db.query(`
      SELECT 
        u.id, u.username, u.email, u.phone, u.avatar,
        u.membership_stage, u.is_member, u.converse_id,
        u.mentor_id, u.primary_class_id, u.total_classes,
        u.createdAt, u.lastLogin,
        m.username as mentor_name,
        c.class_name as primary_class_name
      FROM users u
      LEFT JOIN mentors m ON u.mentor_id = m.id
      LEFT JOIN classes c ON u.primary_class_id = c.class_id
      WHERE u.id = ?
    `, [userId]);

    if (!result.length) {
      throw new Error('User not found');
    }

    const user = result[0];

    return {
      basic_info: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        converse_id: user.converse_id
      },
      membership_info: {
        stage: user.membership_stage,
        status: user.is_member,
        total_classes: user.total_classes || 0,
        memberSince: user.createdAt,
        lastLogin: user.lastLogin
      },
      relationships: {
        mentor: {
          id: user.mentor_id,
          name: user.mentor_name
        },
        primary_class: {
          id: user.primary_class_id,
          name: user.primary_class_name
        }
      }
    };

  } catch (error) {
    console.error('❌ Error getting membership profile:', error);
    throw new Error(`Failed to get profile: ${error.message}`);
  }
};

/**
 * Update membership profile
 * @param {number} userId - User ID
 * @param {Object} updateData - Data to update
 * @returns {Object} Update result
 */
export const updateMembershipProfile = async (userId, updateData) => {
  try {
    const allowedFields = ['phone', 'avatar'];
    const updates = {};
    
    // Filter allowed fields
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updates[field] = updateData[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      throw new Error('No valid fields to update');
    }

    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(userId);

    await db.query(`
      UPDATE users SET ${setClause}, updatedAt = NOW()
      WHERE id = ?
    `, values);

    return {
      success: true,
      updated_fields: Object.keys(updates),
      message: 'Profile updated successfully'
    };

  } catch (error) {
    console.error('❌ Error updating profile:', error);
    throw new Error(`Failed to update profile: ${error.message}`);
  }
};

/**
 * Get user's class information
 * @param {number} userId - User ID
 * @returns {Object} Class information
 */
export const getUserClass = async (userId) => {
  try {
    const result = await db.query(`
      SELECT 
        u.primary_class_id, u.total_classes,
        c.class_id, c.class_name, c.class_description,
        c.member_count, c.createdAt as classCreatedAt,
        ucm.joinedAt, ucm.status as membership_status
      FROM users u
      LEFT JOIN classes c ON u.primary_class_id = c.class_id
      LEFT JOIN user_class_memberships ucm ON u.id = ucm.user_id AND u.primary_class_id = ucm.class_id
      WHERE u.id = ?
    `, [userId]);

    if (!result.length) {
      throw new Error('User not found');
    }

    const data = result[0];

    if (!data.primary_class_id) {
      return {
        has_class: false,
        message: 'User is not assigned to any class yet'
      };
    }

    return {
      has_class: true,
      primary_class: {
        id: data.class_id,
        name: data.class_name,
        description: data.class_description,
        member_count: data.member_count,
        createdAt: data.classCreatedAt
      },
      membership: {
        joinedAt: data.joinedAt,
        status: data.membership_status,
        total_classes: data.total_classes || 0
      }
    };

  } catch (error) {
    console.error('❌ Error getting user class:', error);
    throw new Error(`Failed to get class info: ${error.message}`);
  }
};

/**
 * Get user's mentor information
 * @param {number} userId - User ID
 * @returns {Object} Mentor information
 */
export const getUserMentor = async (userId) => {
  try {
    const result = await db.query(`
      SELECT 
        u.mentor_id,
        m.id, m.username, m.email, m.phone,
        m.specialization, m.experience_years,
        m.createdAt as mentorSince
      FROM users u
      LEFT JOIN mentors m ON u.mentor_id = m.id
      WHERE u.id = ?
    `, [userId]);

    if (!result.length) {
      throw new Error('User not found');
    }

    const data = result[0];

    if (!data.mentor_id) {
      return {
        has_mentor: false,
        message: 'User does not have an assigned mentor yet'
      };
    }

    return {
      has_mentor: true,
      mentor: {
        id: data.id,
        username: data.username,
        email: data.email,
        phone: data.phone,
        specialization: data.specialization,
        experience_years: data.experience_years,
        mentorSince: data.mentorSince
      }
    };

  } catch (error) {
    console.error('❌ Error getting user mentor:', error);
    throw new Error(`Failed to get mentor info: ${error.message}`);
  }
};

/**
 * Get membership notifications
 * @param {number} userId - User ID
 * @param {Object} options - Query options
 * @returns {Object} Notifications
 */
export const getMembershipNotifications = async (userId, options = {}) => {
  try {
    const { limit = 10, offset = 0, status = 'all' } = options;
    
    let whereClause = 'WHERE user_id = ?';
    const params = [userId];
    
    if (status !== 'all') {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    const notifications = await db.query(`
      SELECT 
        id, user_id, type, title, message, status,
        priority, createdAt, updatedAt, readAt
      FROM notification_queue 
      ${whereClause}
      ORDER BY createdAt DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    const countResult = await db.query(`
      SELECT COUNT(*) as total
      FROM notification_queue 
      ${whereClause}
    `, params);

    return {
      notifications: notifications || [],
      pagination: {
        total: countResult[0]?.total || 0,
        limit,
        offset,
        has_more: (countResult[0]?.total || 0) > (offset + limit)
      },
      summary: {
        unread_count: notifications?.filter(n => n.status === 'pending').length || 0,
        total_count: countResult[0]?.total || 0
      }
    };

  } catch (error) {
    console.error('❌ Error getting notifications:', error);
    throw new Error(`Failed to get notifications: ${error.message}`);
  }
};

/**
 * Mark notification as read
 * @param {number} notificationId - Notification ID
 * @param {number} userId - User ID
 * @returns {Object} Update result
 */
export const markNotificationRead = async (notificationId, userId) => {
  try {
    const result = await db.query(`
      UPDATE notification_queue 
      SET status = 'read', readAt = NOW(), updatedAt = NOW()
      WHERE id = ? AND user_id = ?
    `, [notificationId, userId]);

    if (result.affectedRows === 0) {
      throw new Error('Notification not found or access denied');
    }

    return {
      success: true,
      notification_id: notificationId,
      message: 'Notification marked as read'
    };

  } catch (error) {
    console.error('❌ Error marking notification read:', error);
    throw new Error(`Failed to mark notification: ${error.message}`);
  }
};

/**
 * Get membership statistics
 * @param {number} userId - User ID
 * @returns {Object} Statistics
 */
export const getMembershipStats = async (userId) => {
  try {
    const userStats = await db.query(`
      SELECT 
        u.membership_stage, u.is_member, u.total_classes,
        u.createdAt, u.applicationSubmittedAt, u.fullMembershipAppliedAt,
        COUNT(DISTINCT al.id) as total_activities,
        COUNT(DISTINCT cca.id) as content_accesses,
        COUNT(DISTINCT nq.id) as total_notifications
      FROM users u
      LEFT JOIN audit_logs al ON u.id = al.user_id
      LEFT JOIN class_content_access cca ON u.id = cca.user_id
      LEFT JOIN notification_queue nq ON u.id = nq.user_id
      WHERE u.id = ?
      GROUP BY u.id
    `, [userId]);

    if (!userStats.length) {
      throw new Error('User not found');
    }

    const stats = userStats[0];
    const accountAge = calculateDaysSince(stats.createdAt);
    const membershipProgress = calculateMembershipProgress({ membership_stage: stats.membership_stage });

    return {
      membership: {
        stage: stats.membership_stage,
        status: stats.is_member,
        progress_percentage: membershipProgress
      },
      activity: {
        total_activities: stats.total_activities || 0,
        content_accesses: stats.content_accesses || 0,
        total_notifications: stats.total_notifications || 0,
        classes_joined: stats.total_classes || 0
      },
      timeline: {
        account_age_days: accountAge,
        applicationSubmittedAt: stats.applicationSubmittedAt,
        fullMembershipAppliedAt: stats.fullMembershipAppliedAt
      },
      engagement: {
        activities_per_day: accountAge > 0 ? ((stats.total_activities || 0) / accountAge).toFixed(2) : 0,
        content_per_day: accountAge > 0 ? ((stats.content_accesses || 0) / accountAge).toFixed(2) : 0
      }
    };

  } catch (error) {
    console.error('❌ Error getting membership stats:', error);
    throw new Error(`Failed to get stats: ${error.message}`);
  }
};

/**
 * Get membership help information
 * @param {number} userId - User ID
 * @param {string} category - Help category
 * @returns {Object} Help information
 */
export const getMembershipHelp = async (userId, category) => {
  try {
    const userStatus = await getUserMembershipStatus(userId);
    
    const helpInfo = {
      user_status: {
        stage: userStatus.membership_stage,
        can_progress: userStatus.can_apply_full_membership
      },
      categories: {
        application: {
          title: 'Application Process',
          topics: [
            { title: 'How to apply for membership', url: '/help/application-process' },
            { title: 'Application requirements', url: '/help/requirements' },
            { title: 'Review timeline', url: '/help/timeline' }
          ]
        },
        membership: {
          title: 'Membership Stages',
          topics: [
            { title: 'Understanding membership levels', url: '/help/stages' },
            { title: 'Benefits of each stage', url: '/help/benefits' },
            { title: 'Progression requirements', url: '/help/progression' }
          ]
        },
        technical: {
          title: 'Technical Support',
          topics: [
            { title: 'Account issues', url: '/help/account' },
            { title: 'Login problems', url: '/help/login' },
            { title: 'Platform features', url: '/help/features' }
          ]
        }
      },
      faqs: [
        {
          question: 'How long does application review take?',
          answer: 'Initial applications are typically reviewed within 3-5 business days.'
        },
        {
          question: 'Can I reapply if my application is declined?',
          answer: 'Yes, you can reapply after addressing the feedback provided in the decline reason.'
        },
        {
          question: 'What are the benefits of full membership?',
          answer: 'Full members get access to exclusive content, advanced features, and special events.'
        }
      ]
    };

    if (category && helpInfo.categories[category]) {
      return {
        category: category,
        help_data: helpInfo.categories[category],
        user_status: helpInfo.user_status
      };
    }

    return helpInfo;

  } catch (error) {
    console.error('❌ Error getting help info:', error);
    throw new Error(`Failed to get help: ${error.message}`);
  }
};

/**
 * Submit support request
 * @param {number} userId - User ID
 * @param {Object} requestData - Support request data
 * @returns {Object} Submission result
 */
export const submitSupportRequest = async (userId, requestData) => {
  try {
    const { subject, message, category, priority } = requestData;
    
    // Insert support request (assuming you have a support_requests table)
    const result = await db.query(`
      INSERT INTO support_requests (
        user_id, subject, message, category, priority, 
        status, createdAt
      ) VALUES (?, ?, ?, ?, ?, 'open', NOW())
    `, [userId, subject, message, category, priority]);

    // Log the support request
    await db.query(`
      INSERT INTO audit_logs (user_id, action, details, createdAt)
      VALUES (?, 'support_request_submitted', ?, NOW())
    `, [
      userId,
      JSON.stringify({
        request_id: result.insertId,
        subject: subject,
        category: category,
        priority: priority
      })
    ]);

    return {
      success: true,
      request_id: result.insertId,
      message: 'Support request submitted successfully',
      estimated_response: getEstimatedResponseTime(priority)
    };

  } catch (error) {
    console.error('❌ Error submitting support request:', error);
    throw new Error(`Failed to submit support request: ${error.message}`);
  }
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate status progression
 * @param {Object} user - User data
 * @returns {Object} Status progression
 */
const calculateStatusProgression = (user) => {
  const stages = ['none', 'applicant', 'pre_member', 'member'];
  const currentStageIndex = stages.indexOf(user.membership_stage || 'none');
  
  return {
    current_stage: user.membership_stage || 'none',
    current_stage_index: currentStageIndex,
    total_stages: stages.length,
    progress_percentage: Math.round((currentStageIndex / (stages.length - 1)) * 100),
    next_stage: stages[currentStageIndex + 1] || null,
    completed_stages: stages.slice(0, currentStageIndex + 1)
  };
};

/**
 * Check if user can apply for full membership
 * @param {Object} user - User data
 * @returns {boolean} Can apply
 */
const canApplyForFullMembership = (user) => {
  return user.membership_stage === 'pre_member' && 
         ['not_applied', 'declined'].includes(user.full_membership_status || 'not_applied');
};

/**
 * Get next actions for user
 * @param {Object} user - User data
 * @returns {Array} Next actions
 */
const getNextActions = (user) => {
  const actions = [];
  
  if (!user.membership_stage || user.membership_stage === 'none') {
    actions.push({
      action: 'submit_initial_application',
      title: 'Submit Initial Application',
      description: 'Complete your membership application survey'
    });
  } else if (user.membership_stage === 'applicant' && user.survey_status === 'pending') {
    actions.push({
      action: 'wait_for_review',
      title: 'Application Under Review',
      description: 'Your application is being reviewed by administrators'
    });
  } else if (user.membership_stage === 'pre_member' && canApplyForFullMembership(user)) {
    actions.push({
      action: 'apply_full_membership',
      title: 'Apply for Full Membership',
      description: 'Submit your full membership application'
    });
  } else if (user.membership_stage === 'member') {
    actions.push({
      action: 'explore_content',
      title: 'Explore Member Content',
      description: 'Access exclusive member features and content'
    });
  }
  
  return actions;
};

/**
 * Calculate membership progress percentage
 * @param {Object} status - Membership status
 * @returns {number} Progress percentage
 */
const calculateMembershipProgress = (status) => {
  const progressMap = {
    'none': 0,
    'applicant': 25,
    'pre_member': 60,
    'member': 100
  };
  
  return progressMap[status.membership_stage] || 0;
};

/**
 * Calculate account completeness
 * @param {Object} status - Membership status
 * @returns {number} Completeness percentage
 */
const calculateAccountCompleteness = (status) => {
  let completeness = 0;
  let total = 0;
  
  // Basic info (always counted)
  total += 20;
  if (status.username && status.email) completeness += 20;
  
  // Application submitted
  total += 30;
  if (status.application_status !== 'not_submitted') completeness += 30;
  
  // Has converse ID
  total += 20;
  if (status.converse_id) completeness += 20;
  
  // Class assignment
  total += 15;
  if (status.primary_class_id) completeness += 15;
  
  // Full membership if applicable
  total += 15;
  if (status.membership_stage === 'member' || status.full_membership_status === 'approved') {
    completeness += 15;
  } else if (status.membership_stage === 'pre_member') {
    completeness += 7; // Partial credit
  }
  
  return Math.round((completeness / total) * 100);
};

/**
 * Calculate journey timing
 * @param {Object} stats - User stats
 * @returns {Object} Journey timing
 */
const calculateJourneyTiming = (stats) => {
  const timing = {
    account_created: stats.account_created,
    days_since_created: calculateDaysSince(stats.account_created)
  };
  
  if (stats.applicationSubmittedAt) {
    timing.applicationSubmittedAt = stats.applicationSubmittedAt;
    timing.days_to_application = calculateDaysBetween(stats.account_created, stats.applicationSubmittedAt);
  }
  
  if (stats.fullMembershipAppliedAt) {
    timing.fullMembershipAppliedAt = stats.fullMembershipAppliedAt;
    timing.days_to_full_application = calculateDaysBetween(stats.account_created, stats.fullMembershipAppliedAt);
  }
  
  return timing;
};

/**
 * Calculate days since date
 * @param {Date} date - Date
 * @returns {number} Days
 */
const calculateDaysSince = (date) => {
  if (!date) return 0;
  return Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
};

/**
 * Calculate days between dates
 * @param {Date} start - Start date
 * @param {Date} end - End date
 * @returns {number} Days
 */
const calculateDaysBetween = (start, end) => {
  if (!start || !end) return 0;
  return Math.floor((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24));
};

/**
 * Calculate user percentile
 * @param {Object} userStats - User stats
 * @param {Array} distribution - Stage distribution
 * @returns {number} Percentile
 */
const calculateUserPercentile = (userStats, distribution) => {
  const stageOrder = ['none', 'applicant', 'pre_member', 'member'];
  const userStageIndex = stageOrder.indexOf(userStats.membership_stage);
  
  const totalUsers = distribution.reduce((sum, stage) => sum + stage.count, 0);
  const usersBelow = distribution
    .filter(stage => stageOrder.indexOf(stage.membership_stage) < userStageIndex)
    .reduce((sum, stage) => sum + stage.count, 0);
  
  return totalUsers > 0 ? Math.round((usersBelow / totalUsers) * 100) : 0;
};

/**
 * Get estimated response time based on priority
 * @param {string} priority - Request priority
 * @returns {string} Estimated response time
 */
const getEstimatedResponseTime = (priority) => {
  const responseMap = {
    'urgent': '2-4 hours',
    'high': '4-8 hours',
    'normal': '1-2 business days',
    'low': '2-3 business days'
  };
  
  return responseMap[priority] || '1-2 business days';
};

/**
 * Get stage-specific requirements
 * @param {Object} userStatus - User status object
 * @returns {Object} Stage-specific requirements
 */
const getStageSpecificRequirements = (userStatus) => {
  const stage = userStatus.membership_stage;
  
  switch (stage) {
    case 'none':
    case null:
    case undefined:
      return {
        stage: 'new_user',
        title: 'New User',
        description: 'Ready to begin membership journey',
        requirements: [
          'Complete account verification',
          'Submit initial membership application',
          'Provide required information in survey'
        ],
        next_action: 'Submit initial application',
        estimated_time: '10-15 minutes'
      };
      
    case 'applicant':
      return {
        stage: 'applicant',
        title: 'Application Submitted',
        description: 'Application under review by administrators',
        requirements: [
          'Wait for admin review',
          'Respond to any follow-up questions',
          'Maintain good standing during review'
        ],
        next_action: 'Wait for review completion',
        estimated_time: '3-5 business days'
      };
      
    case 'pre_member':
      return {
        stage: 'pre_member',
        title: 'Pre-Member',
        description: 'Approved for basic access, eligible for full membership',
        requirements: [
          'Participate actively in community',
          'Maintain good standing for 30+ days',
          'Complete full membership application when ready'
        ],
        next_action: 'Apply for full membership',
        estimated_time: '20-30 minutes'
      };
      
    case 'member':
      return {
        stage: 'member',
        title: 'Full Member',
        description: 'Complete access to all platform features',
        requirements: [
          'Continue active participation',
          'Maintain community guidelines',
          'Consider mentorship opportunities'
        ],
        next_action: 'Explore all features',
        estimated_time: 'Ongoing'
      };
      
    default:
      return {
        stage: 'unknown',
        title: 'Unknown Stage',
        description: 'Please contact support for assistance',
        requirements: [],
        next_action: 'Contact support',
        estimated_time: 'N/A'
      };
  }
};

/**
 * Get estimated timeline for user's current stage
 * @param {Object} userStatus - User status object
 * @returns {Object} Timeline estimation
 */
const getEstimatedTimeline = (userStatus) => {
  const stage = userStatus.membership_stage;
  const createdAt = userStatus.user_id ? new Date() : new Date(); // This would come from user creation date
  
  const timeline = {
    current_stage: stage,
    time_in_current_stage: 0, // This would be calculated from actual dates
    estimated_progression: {}
  };
  
  switch (stage) {
    case 'none':
      timeline.estimated_progression = {
        to_applicant: '10-15 minutes (application submission)',
        to_pre_member: '3-5 business days (after admin review)',
        to_member: '30+ days minimum (from pre-member status)'
      };
      break;
      
    case 'applicant':
      timeline.estimated_progression = {
        to_pre_member: '1-5 business days (pending admin review)',
        to_member: '30+ days minimum (after pre-member approval)'
      };
      break;
      
    case 'pre_member':
      timeline.estimated_progression = {
        to_member: 'Ready to apply (when requirements met)'
      };
      break;
      
    case 'member':
      timeline.estimated_progression = {
        complete: 'Full access achieved'
      };
      break;
  }
  
  return timeline;
};

/**
 * Get membership progression information
 * @param {number} userId - User ID
 * @returns {Object} Progression information
 */
export const getMembershipProgression = async (userId) => {
  try {
    // Import from applicationService to avoid circular dependency
    const { getMembershipProgression: getProgressionApp } = await import('./applicationService.js');
    return await getProgressionApp(userId);
  } catch (error) {
    console.error('❌ Error getting membership progression:', error);
    throw new Error(`Failed to get membership progression: ${error.message}`);
  }
};

/**
 * Get membership requirements and next steps
 * @param {number} userId - User ID
 * @returns {Object} Requirements and next steps
 */
export const getMembershipRequirements = async (userId) => {
  try {
    const userStatus = await getUserMembershipStatus(userId);
    
    const requirements = {
      current_stage: userStatus.membership_stage,
      overall_requirements: {
        initial_application: {
          required: true,
          completed: userStatus.initial_application.status === 'approved',
          description: 'Complete and get approval for initial membership application',
          requirements: [
            'Submit membership survey',
            'Provide valid contact information',
            'Wait for admin review and approval'
          ]
        },
        full_membership: {
          required: userStatus.membership_stage === 'pre_member',
          completed: userStatus.full_membership_application.status === 'approved',
          description: 'Apply for and get approval for full membership',
          requirements: [
            'Must be an approved pre-member',
            'Active participation for at least 30 days',
            'Complete full membership questionnaire',
            'Maintain good standing in community'
          ]
        }
      },
      
      next_steps: userStatus.next_actions,
      
      stage_specific: getStageSpecificRequirements(userStatus),
      
      progress_summary: {
        current_stage: userStatus.membership_stage,
        progress_percentage: userStatus.status_progression.progress_percentage,
        next_milestone: userStatus.status_progression.next_stage,
        estimated_timeline: getEstimatedTimeline(userStatus)
      }
    };
    
    return requirements;
  } catch (error) {
    console.error('❌ Error getting membership requirements:', error);
    throw new Error(`Failed to get membership requirements: ${error.message}`);
  }
};

/**
 * Withdraw application
 * @param {number} userId - User ID
 * @param {string} reason - Withdrawal reason
 * @param {string} applicationType - Application type
 * @returns {Object} Withdrawal result
 */
export const withdrawApplication = async (userId, reason, applicationType) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    if (!userId || !reason || !applicationType) {
      throw new Error('User ID, reason, and application type are required');
    }
    
    if (reason.trim().length < 10) {
      throw new Error('Withdrawal reason must be at least 10 characters');
    }
    
    const validTypes = ['initial_application', 'full_membership'];
    if (!validTypes.includes(applicationType)) {
      throw new Error(`Invalid application type. Must be one of: ${validTypes.join(', ')}`);
    }
    
    const user = await connection.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user.length) {
      throw new Error('User not found');
    }
    
    const withdrawalId = `WD-${Date.now()}-${userId}`;
    let applicationUpdated = false;
    let currentApplicationId = null;
    
    if (applicationType === 'initial_application') {
      // Find pending initial application
      const [pendingApp] = await connection.query(`
        SELECT id FROM surveylog 
        WHERE user_id = ? AND application_type = 'initial_application' 
        AND approval_status = 'pending'
        ORDER BY createdAt DESC LIMIT 1
      `, [userId]);
      
      if (!pendingApp.length) {
        throw new Error('No pending initial application found to withdraw');
      }
      
      currentApplicationId = pendingApp[0].id;
      
      // Update application status
      await connection.query(`
        UPDATE surveylog 
        SET approval_status = 'withdrawn',
            admin_notes = CONCAT(COALESCE(admin_notes, ''), '\n[WITHDRAWN BY USER] ', ?),
            reviewedAt = NOW()
        WHERE id = ?
      `, [reason, currentApplicationId]);
      
      // Update user status
      await connection.query(`
        UPDATE users 
        SET application_status = 'withdrawn', updatedAt = NOW()
        WHERE id = ?
      `, [userId]);
      
      applicationUpdated = true;
      
    } else if (applicationType === 'full_membership') {
      // Find pending full membership application
      const [pendingFullApp] = await connection.query(`
        SELECT id FROM full_membership_applications 
        WHERE user_id = ? AND status = 'pending'
        ORDER BY submittedAt DESC LIMIT 1
      `, [userId]);
      
      if (!pendingFullApp.length) {
        throw new Error('No pending full membership application found to withdraw');
      }
      
      currentApplicationId = pendingFullApp[0].id;
      
      // Update full membership application
      await connection.query(`
        UPDATE full_membership_applications 
        SET status = 'withdrawn',
            admin_notes = CONCAT(COALESCE(admin_notes, ''), '\n[WITHDRAWN BY USER] ', ?),
            reviewedAt = NOW()
        WHERE id = ?
      `, [reason, currentApplicationId]);
      
      // Update user status
      await connection.query(`
        UPDATE users 
        SET full_membership_status = 'withdrawn', updatedAt = NOW()
        WHERE id = ?
      `, [userId]);
      
      applicationUpdated = true;
    }
    
    if (!applicationUpdated) {
      throw new Error('Failed to update application status');
    }
    
    // Log withdrawal in audit
    await connection.query(`
      INSERT INTO audit_logs (user_id, action, details, createdAt)
      VALUES (?, 'application_withdrawn', ?, NOW())
    `, [
      userId,
      JSON.stringify({
        withdrawal_id: withdrawalId,
        application_type: applicationType,
        application_id: currentApplicationId,
        reason: reason
      })
    ]);
    
    await connection.commit();
    
    const reapplyAfter = new Date();
    reapplyAfter.setDate(reapplyAfter.getDate() + 30); // 30-day waiting period
    
    return {
      success: true,
      withdrawal_id: withdrawalId,
      application_id: currentApplicationId,
      application_type: applicationType,
      can_reapply: true,
      reapply_after: reapplyAfter.toISOString(),
      message: 'Application withdrawn successfully'
    };
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error withdrawing application:', error);
    throw new Error(`Failed to withdraw application: ${error.message}`);
  } finally {
    connection.release();
  }
};

/**
 * Check user eligibility (delegated to applicationService)
 * @param {number} userId - User ID
 * @param {string} action - Action to check
 * @returns {Object} Eligibility result
 */
export const checkEligibility = async (userId, action) => {
  // Import here to avoid circular dependency
  const { checkEligibility: checkEligibilityApp } = await import('./applicationService.js');
  return await checkEligibilityApp(userId, action);
};

export default {
  getUserMembershipStatus,
  getMembershipDashboard,
  submitInitialApplication,
  submitFullMembershipApplication,
  getMembershipAnalytics,
  getMembershipProfile,
  updateMembershipProfile,
  getUserClass,
  getUserMentor,
  getMembershipNotifications,
  markNotificationRead,
  getMembershipStats,
  getMembershipHelp,
  submitSupportRequest,
  getMembershipProgression,
  getMembershipRequirements,
  withdrawApplication,
  checkEligibility
};