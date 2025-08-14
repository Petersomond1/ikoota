// ikootaapi/services/userStatusServices.js
// USER STATUS & DASHBOARD SERVICES
// Business logic for user status checks, dashboards, and system health

import db from '../config/db.js';
import CustomError from '../utils/CustomError.js';

// ===============================================
// DASHBOARD SERVICES
// ===============================================

/**
 * Get comprehensive user dashboard data
 * @param {number} userId - User ID
 * @returns {Object} Dashboard data
 */
export const getUserDashboardService = async (userId) => {
  try {
    console.log('📊 Getting dashboard data for user:', userId);

    // Get comprehensive user data with joins
    const [userDashboard] = await db.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.phone,
        u.role,
        u.membership_stage,
        u.is_member,
        u.full_membership_status,
        u.converse_id,
        u.mentor_id,
        u.primary_class_id,
        u.total_classes,
        u.is_identity_masked,
        u.createdAt,
        u.updatedAt,
        u.lastLogin,
        
        -- Initial Application Info
        COALESCE(initial_app.approval_status, 'not_submitted') as initial_application_status,
        initial_app.createdAt as initial_application_date,
        initial_app.reviewedAt as initial_reviewed_date,
        initial_reviewer.username as initial_reviewer_name,
        
        -- Full Membership Info
        COALESCE(full_app.status, 'not_applied') as full_membership_application_status,
        full_app.submittedAt as full_membership_application_date,
        full_app.reviewedAt as full_membership_reviewed_date,
        full_reviewer.username as full_membership_reviewer_name,
        
        -- Access Info
        fma.firstAccessedAt as full_membership_first_access,
        fma.access_count as full_membership_access_count,
        
        -- Mentor Info
        mentor.username as mentor_name,
        mentor.email as mentor_email,
        
        -- Class Info
        class.class_name as primary_class_name
        
      FROM users u
      LEFT JOIN surveylog initial_app ON u.id = initial_app.user_id 
        AND initial_app.application_type = 'initial_application'
        AND initial_app.id = (
          SELECT MAX(id) FROM surveylog 
          WHERE user_id = u.id AND application_type = 'initial_application'
        )
      LEFT JOIN users initial_reviewer ON initial_app.reviewed_by = initial_reviewer.id
      LEFT JOIN full_membership_applications full_app ON u.id = full_app.user_id
      LEFT JOIN users full_reviewer ON full_app.reviewed_by = full_reviewer.id
      LEFT JOIN full_membership_access fma ON u.id = fma.user_id
      LEFT JOIN users mentor ON u.mentor_id = mentor.id
      LEFT JOIN classes class ON u.primary_class_id = class.id
      WHERE u.id = ?
    `, [userId]);

    if (userDashboard.length === 0) {
      throw new CustomError('User not found', 404);
    }

    const user = userDashboard[0];

    // Get user's content statistics
    const contentStats = await getUserContentStatsService(userId);

    // Determine user's current access and next steps
    const accessInfo = {
      can_access_towncrier: ['pre_member', 'member'].includes(user.membership_stage) || ['admin', 'super_admin'].includes(user.role),
      can_access_iko: user.membership_stage === 'member' || ['admin', 'super_admin'].includes(user.role),
      can_apply_full_membership: user.membership_stage === 'pre_member' && (!user.full_membership_application_status || user.full_membership_application_status === 'not_applied'),
      needs_initial_application: (!user.membership_stage || user.membership_stage === 'none') && user.initial_application_status === 'not_submitted',
      is_admin: ['admin', 'super_admin'].includes(user.role)
    };

    // Calculate membership journey progress
    const journeyStages = [
      { stage: 'registration', name: 'Registration', completed: true, date: user.createdAt },
      { 
        stage: 'application', 
        name: 'Initial Application', 
        completed: user.initial_application_status !== 'not_submitted', 
        date: user.initial_application_date 
      },
      { 
        stage: 'pre_member', 
        name: 'Pre-Member', 
        completed: ['pre_member', 'member'].includes(user.membership_stage), 
        date: user.initial_reviewed_date 
      },
      { 
        stage: 'full_member', 
        name: 'Full Member', 
        completed: user.membership_stage === 'member', 
        date: user.full_membership_reviewed_date 
      }
    ];

    const completedStages = journeyStages.filter(s => s.completed).length;
    const progressPercentage = Math.round((completedStages / journeyStages.length) * 100);

    // Generate recommended actions
    const recommendedActions = generateRecommendedActions(accessInfo, user);

     // ✅ BUILD CLEAN RESPONSE OBJECT (avoid circular refs)
    const cleanResponse = {
      user_profile: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        membership_stage: user.membership_stage,
        is_member: user.is_member,
        converse_id: user.converse_id,
        is_identity_masked: !!user.is_identity_masked,
        member_since: user.createdAt,
        last_updated: user.updatedAt,
        lastLogin: user.lastLogin
      },
      
      application_status: {
        initial_application: {
          status: user.initial_application_status,
          submitted_date: user.initial_application_date,
          reviewed_date: user.initial_reviewed_date,
          reviewer: user.initial_reviewer_name
        },
        full_membership_application: {
          status: user.full_membership_application_status,
          submitted_date: user.full_membership_application_date,
          reviewed_date: user.full_membership_reviewed_date,
          reviewer: user.full_membership_reviewer_name
        }
      },
      
      access_information: accessInfo,
      content_statistics: contentStats,
      
      membership_access: {
        full_membership_first_access: user.full_membership_first_access,
        full_membership_access_count: user.full_membership_access_count || 0,
        full_membership_status: user.full_membership_status
      },
      
      assignments: {
        mentor: {
          id: user.mentor_id,
          name: user.mentor_name,
          email: user.mentor_email
        },
        primary_class: {
          id: user.primary_class_id,
          name: user.primary_class_name
        },
        total_classes: user.total_classes || 0
      },
      
      membership_journey: {
        stages: journeyStages,
        current_stage: journeyStages.find(s => s.completed && !journeyStages[journeyStages.indexOf(s) + 1]?.completed)?.stage || 'registration',
        progress_percentage: progressPercentage,
        completed_stages: completedStages,
        total_stages: journeyStages.length
      },
      
      recommended_actions: recommendedActions,
      
      dashboard_metadata: {
        generated_at: new Date().toISOString(),
        data_freshness: 'real_time',
        user_timezone: 'UTC',
        version: '3.0.0'
      }
    };

    // ✅ DEBUG: Log the response size and structure
    console.log('📊 Dashboard response size:', JSON.stringify(cleanResponse).length, 'characters');
    console.log('📊 Dashboard response keys:', Object.keys(cleanResponse));
    
    // ✅ SAFETY: Check for circular references
    try {
      JSON.stringify(cleanResponse);
      console.log('✅ Dashboard response serializable - no circular refs');
    } catch (circularError) {
      console.error('❌ CIRCULAR REFERENCE DETECTED:', circularError.message);
      throw new Error('Dashboard response contains circular references');
    }

    return cleanResponse;

  } catch (error) {
    console.error('❌ Error in getUserDashboardService:', error);
    throw error;
  }
};

/**
 * Get user content statistics
 * @param {number} userId - User ID
 * @returns {Object} Content statistics
 */
export const getUserContentStatsService = async (userId) => {
  try {
    // Get user's content statistics (handle missing tables gracefully)
    let contentStats = { total_chats: 0, total_teachings: 0, total_comments: 0 };
    
    try {
      const [stats] = await db.query(`
        SELECT 
          (SELECT COUNT(*) FROM chats WHERE user_id = ? AND chats.id IS NOT NULL) as total_chats,
          (SELECT COUNT(*) FROM teachings WHERE user_id = ? AND teachings.id IS NOT NULL) as total_teachings,
          (SELECT COUNT(*) FROM comments WHERE user_id = ? AND comments.id IS NOT NULL) as total_comments
      `, [userId, userId, userId]);
      
      if (stats && stats.length > 0) {
        contentStats = stats[0];
      }
    } catch (statsError) {
      console.warn('Content stats tables may not exist:', statsError.message);
    }

    return {
      total_chats: contentStats.total_chats || 0,
      total_teachings: contentStats.total_teachings || 0,
      total_comments: contentStats.total_comments || 0,
      total_content: (contentStats.total_chats || 0) + (contentStats.total_teachings || 0)
    };

  } catch (error) {
    console.error('❌ Error in getUserContentStatsService:', error);
    return {
      total_chats: 0,
      total_teachings: 0,
      total_comments: 0,
      total_content: 0
    };
  }
};

/**
 * Generate recommended actions based on user status
 * @param {Object} accessInfo - User access information
 * @param {Object} user - User data
 * @returns {Array} Recommended actions
 */
const generateRecommendedActions = (accessInfo, user) => {
  const recommendedActions = [];
  
  if (accessInfo.needs_initial_application) {
    recommendedActions.push({
      action: 'complete_initial_application',
      title: 'Complete Initial Application',
      description: 'Start your journey by completing the initial membership application',
      priority: 'high',
      link: '/applicationsurvey'
    });
  }
  
  if (accessInfo.can_apply_full_membership) {
    recommendedActions.push({
      action: 'apply_full_membership',
      title: 'Apply for Full Membership',
      description: 'Take the next step and apply for full membership access',
      priority: 'medium',
      link: '/full-membership-application'
    });
  }
  
  if (accessInfo.can_access_towncrier) {
    recommendedActions.push({
      action: 'explore_towncrier',
      title: 'Explore Towncrier',
      description: 'Access pre-member content and community features',
      priority: 'low',
      link: '/towncrier'
    });
  }
  
  if (accessInfo.can_access_iko) {
    recommendedActions.push({
      action: 'explore_iko',
      title: 'Explore Iko',
      description: 'Access full member content and advanced features',
      priority: 'low',
      link: '/iko'
    });
  }
  
  if (accessInfo.is_admin) {
    recommendedActions.push({
      action: 'access_admin',
      title: 'Admin Dashboard',
      description: 'Access administrative functions and management tools',
      priority: 'low',
      link: '/admin'
    });
  }

  return recommendedActions;
};

// ===============================================
// MEMBERSHIP STATUS SERVICES
// ===============================================

/**
 * Get current membership status
 * @param {number} userId - User ID
 * @returns {Object} Membership status
 */
export const getCurrentMembershipStatusService = async (userId) => {
  try {
    console.log('🔍 Getting membership status for user:', userId);
    
    const [userStatus] = await db.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.membership_stage,
        u.is_member,
        u.full_membership_status,
        u.application_status,
        u.applicationSubmittedAt,
        u.applicationReviewedAt,
        u.fullMembershipAppliedAt,
        u.fullMembershipReviewedAt,
        u.converse_id,
        u.mentor_id,
        u.primary_class_id,
        u.decline_reason,
        u.createdAt,
        u.role,
        
        -- Latest initial application
        s.approval_status as survey_approval_status,
        s.reviewedAt as survey_reviewed_at,
        s.createdAt as survey_submitted_at,
        s.admin_notes as survey_admin_notes,
        
        -- Latest full membership application
        fma.status as full_app_status,
        fma.submittedAt as full_app_submitted,
        fma.reviewedAt as full_app_reviewed,
        fma.admin_notes as full_app_admin_notes
        
      FROM users u
      LEFT JOIN surveylog s ON u.id = s.user_id 
        AND s.application_type = 'initial_application'
        AND s.id = (
          SELECT MAX(id) FROM surveylog 
          WHERE user_id = u.id AND application_type = 'initial_application'
        )
      LEFT JOIN full_membership_applications fma ON u.id = fma.user_id
      WHERE u.id = ?
    `, [userId]);
    
    // ✅ FIXED: userStatus is already the user object from destructuring
    if (!userStatus) {
      throw new CustomError('User not found', 404);
    }
    
    // ✅ FIXED: userStatus IS the user object, not an array
    const user = userStatus;
    
    // Determine if user needs to complete survey
    const needsSurvey = (
      (!user.membership_stage || user.membership_stage === 'none') && 
      (!user.application_status || user.application_status === 'not_submitted') &&
      (!user.survey_approval_status || user.survey_approval_status === 'not_submitted')
    );
    
    const surveyCompleted = !!(user.survey_submitted_at || user.applicationSubmittedAt);
    
    // Determine redirect path and next action
    const navigation = determineUserNavigation(user, needsSurvey);

    return {
      user_id: user.id,
      username: user.username,
      
      current_status: {
        membership_stage: user.membership_stage,
        is_member: user.is_member,
        full_membership_status: user.full_membership_status,
        converse_id: user.converse_id,
        role: user.role
      },
      
      application_progress: {
        initial_application: {
          needs_survey: needsSurvey,
          survey_completed: surveyCompleted,
          approval_status: user.survey_approval_status || user.application_status,
          submitted_at: user.survey_submitted_at || user.applicationSubmittedAt,
          reviewed_at: user.survey_reviewed_at || user.applicationReviewedAt,
          admin_notes: user.survey_admin_notes
        },
        full_membership: {
          status: user.full_app_status || 'not_applied',
          submitted_at: user.full_app_submitted || user.fullMembershipAppliedAt,
          reviewed_at: user.full_app_reviewed || user.fullMembershipReviewedAt,
          admin_notes: user.full_app_admin_notes
        }
      },
      
      access_permissions: {
        can_access_towncrier: ['pre_member', 'member'].includes(user.membership_stage) || ['admin', 'super_admin'].includes(user.role),
        can_access_iko: user.membership_stage === 'member' || ['admin', 'super_admin'].includes(user.role),
        can_apply_full_membership: user.membership_stage === 'pre_member' && (!user.full_app_status || user.full_app_status === 'not_applied'),
        can_access_admin: ['admin', 'super_admin'].includes(user.role)
      },
      
      assignments: {
        mentor_id: user.mentor_id,
        primary_class_id: user.primary_class_id
      },
      
      navigation,
      
      additional_info: {
        decline_reason: user.decline_reason,
        member_since: user.createdAt,
        last_status_update: user.applicationReviewedAt || user.fullMembershipReviewedAt
      }
    };
    
  } catch (error) {
    console.error('❌ Error in getCurrentMembershipStatusService:', error);
    throw error;
  }
};

/**
 * Determine user navigation based on status
 * @param {Object} user - User data
 * @param {boolean} needsSurvey - Whether user needs to complete survey
 * @returns {Object} Navigation information
 */
const determineUserNavigation = (user, needsSurvey) => {
  let redirectTo = '/dashboard';
  let statusMessage = 'Dashboard access';
  let nextAction = 'check_dashboard';
  
  if (needsSurvey) {
    redirectTo = '/applicationsurvey';
    statusMessage = 'Complete initial application';
    nextAction = 'complete_application';
  } else if (user.survey_approval_status === 'pending' || user.application_status === 'pending') {
    redirectTo = '/pending-verification';
    statusMessage = 'Application under review';
    nextAction = 'wait_for_review';
  } else if (user.membership_stage === 'pre_member') {
    redirectTo = '/towncrier';
    statusMessage = 'Pre-member access granted';
    nextAction = 'explore_towncrier';
  } else if (user.membership_stage === 'member') {
    redirectTo = '/iko';
    statusMessage = 'Full member access granted';
    nextAction = 'explore_iko';
  } else if (user.survey_approval_status === 'declined' || user.application_status === 'declined') {
    redirectTo = '/application-declined';
    statusMessage = 'Application was declined';
    nextAction = 'review_feedback';
  }

  return {
    redirect_to: redirectTo,
    status_message: statusMessage,
    next_action: nextAction
  };
};

// ===============================================
// APPLICATION STATUS SERVICES
// ===============================================

/**
 * Check survey status
 * @param {number} userId - User ID
 * @returns {Object} Survey status
 */
export const checkSurveyStatusService = async (userId) => {
  try {
    console.log('🔍 Checking survey status for user:', userId);

    // Get comprehensive survey and application status
    const [userResults] = await db.query(`
      SELECT 
        u.*,
        sl.approval_status,
        sl.answers,
        sl.createdAt as survey_submittedAt,
        sl.reviewedAt as survey_reviewedAt,
        sl.reviewed_by as survey_reviewed_by,
        sl.admin_notes as survey_admin_notes,
        sl.application_ticket,
        fma.status as membership_application_status,
        fma.membership_ticket,
        fma.submittedAt as membership_appliedAt,
        fma.reviewedAt as membership_reviewedAt,
        fma.reviewed_by as membership_reviewed_by,
        fma.admin_notes as membership_admin_notes,
        reviewer.username as reviewer_name
      FROM users u
      LEFT JOIN surveylog sl ON u.id = sl.user_id
        AND sl.application_type = 'initial_application'
        AND sl.id = (
          SELECT MAX(id) FROM surveylog 
          WHERE user_id = u.id AND application_type = 'initial_application'
        )
      LEFT JOIN full_membership_applications fma ON u.id = fma.user_id
      LEFT JOIN users reviewer ON sl.reviewed_by = reviewer.id
      WHERE u.id = ?
      LIMIT 1
    `, [userId]);

    // ✅ FIXED: Check for results properly
    if (!userResults) {
      throw new CustomError('User not found', 404);
    }

    // ✅ FIXED: userResults IS the user object, not an array
    const user = userResults;
    
    const surveyCompleted = !!user.answers;
    const needsSurvey = !surveyCompleted && !['granted', 'member', 'pre_member'].includes(user.is_member);

    // Determine status and next steps
    const { status, nextSteps, canResubmit } = determineSurveyStatus(user, surveyCompleted);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        membership_stage: user.membership_stage,
        is_member: user.is_member
      },
      survey: {
        completed: surveyCompleted,
        status: status,
        submittedAt: user.survey_submittedAt,
        reviewedAt: user.survey_reviewedAt,
        reviewedBy: user.reviewer_name,
        ticket: user.application_ticket,
        adminNotes: user.survey_admin_notes,
        canResubmit: canResubmit,
        answers: user.answers ? (typeof user.answers === 'string' ? JSON.parse(user.answers) : user.answers) : null
      },
      nextSteps: nextSteps,
      redirect: status === 'not_completed' ? '/applicationsurvey' : 
                status === 'approved' ? '/dashboard' : 
                status === 'declined' ? '/application-declined' :
                '/pending-verification'
    };

  } catch (error) {
    console.error('❌ Error in checkSurveyStatusService:', error);
    throw error;
  }
};

/**
 * Determine survey status and next steps
 * @param {Object} user - User data
 * @param {boolean} surveyCompleted - Whether survey is completed
 * @returns {Object} Status information
 */
const determineSurveyStatus = (user, surveyCompleted) => {
  let status = 'not_started';
  let nextSteps = [];
  let canResubmit = false;
  
  if (!surveyCompleted) {
    status = 'not_completed';
    nextSteps = [
      'Complete the membership application survey',
      'Provide thoughtful answers to all questions',
      'Submit your application for review'
    ];
  } else {
    switch (user.approval_status) {
      case 'pending':
        status = 'pending_review';
        nextSteps = [
          'Your application is under review',
          'Review process typically takes 3-5 business days',
          'You will receive email notification once reviewed'
        ];
        break;
      case 'approved':
        status = 'approved';
        nextSteps = [
          'Congratulations! Your application has been approved',
          'You now have pre-member access to Towncrier content',
          'Consider applying for full membership when eligible'
        ];
        break;
      case 'declined':
      case 'rejected':
        status = 'declined';
        canResubmit = true;
        nextSteps = [
          'Your application was not approved',
          'Review the feedback provided by our team',
          'You may resubmit your application with improvements'
        ];
        break;
      default:
        status = 'under_review';
        nextSteps = [
          'Your application is currently being reviewed',
          'Please wait for the review process to complete'
        ];
    }
  }

  return { status, nextSteps, canResubmit };
};

/**
 * Get application status
 * @param {number} userId - User ID
 * @returns {Object} Application status
 */
export const getApplicationStatusService = async (userId) => {
  try {
    console.log('📋 Checking application status for user:', userId);

    // Get application status from both initial and full membership applications
    const [applications] = await db.query(`
      SELECT 
        'initial_application' as application_type,
        sl.approval_status as status,
        sl.createdAt as submitted_at,
        sl.reviewedAt as reviewed_at,
        sl.reviewed_by,
        sl.admin_notes,
        sl.application_ticket,
        reviewer.username as reviewer_name
      FROM surveylog sl
      LEFT JOIN users reviewer ON sl.reviewed_by = reviewer.id
      WHERE sl.user_id = ? AND sl.application_type = 'initial_application'
      
      UNION ALL
      
      SELECT 
        'full_membership' as application_type,
        fma.status,
        fma.submittedAt as submitted_at,
        fma.reviewedAt as reviewed_at,
        fma.reviewed_by,
        fma.admin_notes,
        fma.membership_ticket as application_ticket,
        reviewer.username as reviewer_name
      FROM full_membership_applications fma
      LEFT JOIN users reviewer ON fma.reviewed_by = reviewer.id
      WHERE fma.user_id = ?
      
      ORDER BY submitted_at DESC
    `, [userId, userId]);

    const applicationHistory = applications.map(app => ({
      application_type: app.application_type,
      status: app.status,
      submitted_at: app.submitted_at,
      reviewed_at: app.reviewed_at,
      reviewer_name: app.reviewer_name,
      admin_notes: app.admin_notes,
      ticket: app.application_ticket
    }));

    const latestApplication = applications[0] || null;

    return {
      user_id: userId,
      latest_application: latestApplication ? {
        type: latestApplication.application_type,
        status: latestApplication.status,
        submitted_at: latestApplication.submitted_at,
        reviewed_at: latestApplication.reviewed_at,
        reviewer: latestApplication.reviewer_name,
        admin_notes: latestApplication.admin_notes,
        ticket: latestApplication.application_ticket
      } : null,
      application_history: applicationHistory,
      summary: {
        total_applications: applications.length,
        has_pending: applications.some(app => app.status === 'pending'),
        latest_status: latestApplication?.status || 'none'
      }
    };

  } catch (error) {
    console.error('❌ Error in getApplicationStatusService:', error);
    throw error;
  }
};

/**
 * Get application history
 * @param {number} userId - User ID
 * @returns {Object} Application history
 */
export const getApplicationHistoryService = async (userId) => {
  try {
    console.log('📚 Getting application history for user:', userId);

    // Get comprehensive application history
    const [history] = await db.query(`
      SELECT 
        mrh.id,
        mrh.application_type,
        mrh.previous_status,
        mrh.new_status,
        mrh.review_notes,
        mrh.action_taken,
        mrh.reviewedAt,
        mrh.notification_sent,
        reviewer.username as reviewer_name,
        reviewer.role as reviewer_role
      FROM membership_review_history mrh
      LEFT JOIN users reviewer ON mrh.reviewer_id = reviewer.id
      WHERE mrh.user_id = ?
      ORDER BY mrh.reviewedAt DESC
    `, [userId]);

    return {
      user_id: userId,
      application_history: history.map(record => ({
        id: record.id,
        application_type: record.application_type,
        status_change: {
          from: record.previous_status,
          to: record.new_status
        },
        action_taken: record.action_taken,
        review_notes: record.review_notes,
        reviewed_at: record.reviewedAt,
        reviewer: {
          name: record.reviewer_name,
          role: record.reviewer_role
        },
        notification_sent: !!record.notification_sent
      })),
      summary: {
        total_reviews: history.length,
        last_review: history[0]?.reviewedAt || null,
        status_changes: history.length
      }
    };

  } catch (error) {
    console.error('❌ Error in getApplicationHistoryService:', error);
    throw error;
  }
};

// ===============================================
// SYSTEM HEALTH SERVICES
// ===============================================

/**
 * Get system health status
 * @returns {Object} System health data
 */
export const getSystemHealthService = async () => {
  try {
    console.log('❤️ Getting system health status');
    
    // Check database connectivity
    const [dbTest] = await db.query('SELECT 1 as health_check, NOW() as current_time');
    
    // Get basic system stats
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as new_users_24h,
        (SELECT COUNT(*) FROM surveylog WHERE approval_status = 'pending') as pending_applications,
        (SELECT COUNT(*) FROM full_membership_applications WHERE status = 'pending') as pending_full_memberships
      FROM users
    `);
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        response_time: 'normal',
        current_time: dbTest[0].current_time
      },
      statistics: {
        total_users: stats[0].total_users,
        new_users_24h: stats[0].new_users_24h,
        pending_applications: stats[0].pending_applications,
        pending_full_memberships: stats[0].pending_full_memberships
      },
      version: '3.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime_seconds: Math.floor(process.uptime())
    };
    
  } catch (error) {
    console.error('❌ System health check failed:', error);
    
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    };
  }
};

/**
 * Get system status overview
 * @returns {Object} System status data
 */
export const getSystemStatusService = async () => {
  try {
    console.log('🖥️ Getting system status overview');
    
    // Get comprehensive system statistics
    const [systemStats] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE membership_stage = 'pre_member') as pre_members,
        (SELECT COUNT(*) FROM users WHERE membership_stage = 'member') as full_members,
        (SELECT COUNT(*) FROM users WHERE membership_stage = 'applicant') as applicants,
        (SELECT COUNT(*) FROM users WHERE membership_stage = 'none' OR membership_stage IS NULL) as unregistered,
        (SELECT COUNT(*) FROM surveylog WHERE approval_status = 'pending') as pending_initial_applications,
        (SELECT COUNT(*) FROM full_membership_applications WHERE status = 'pending') as pending_full_applications,
        (SELECT COUNT(*) FROM users WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as new_users_today,
        (SELECT COUNT(*) FROM surveylog WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as new_applications_today,
        (SELECT COUNT(*) FROM full_membership_applications WHERE submittedAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as new_full_apps_today
    `);
    
    // Check database performance
    const startTime = Date.now();
    await db.query('SELECT 1');
    const dbResponseTime = Date.now() - startTime;
    
    // Get recent activity
    const [recentActivity] = await db.query(`
      SELECT 
        'initial_application' as activity_type,
        sl.approval_status as status,
        sl.createdAt as activity_time,
        u.username
      FROM surveylog sl
      JOIN users u ON sl.user_id = u.id
      WHERE sl.createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      
      UNION ALL
      
      SELECT 
        'full_membership' as activity_type,
        fma.status,
        fma.submittedAt as activity_time,
        u.username
      FROM full_membership_applications fma
      JOIN users u ON fma.user_id = u.id
      WHERE fma.submittedAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      
      ORDER BY activity_time DESC
      LIMIT 20
    `);
    
    const stats = systemStats[0];
    
    return {
      system_health: {
        status: 'operational',
        database_response_time_ms: dbResponseTime,
        uptime_seconds: Math.floor(process.uptime()),
        memory_usage: process.memoryUsage(),
        node_version: process.version,
        environment: process.env.NODE_ENV || 'development'
      },
      
      user_statistics: {
        total_users: stats.total_users,
        membership_breakdown: {
          unregistered: stats.unregistered,
          applicants: stats.applicants,
          pre_members: stats.pre_members,
          full_members: stats.full_members
        },
        growth_metrics: {
          new_users_today: stats.new_users_today,
          new_applications_today: stats.new_applications_today,
          new_full_applications_today: stats.new_full_apps_today
        }
      },
      
      application_queue: {
        pending_initial_applications: stats.pending_initial_applications,
        pending_full_applications: stats.pending_full_applications,
        total_pending: stats.pending_initial_applications + stats.pending_full_applications
      },
      
      health_indicators: {
        database: dbResponseTime < 1000 ? 'healthy' : 'slow',
        application_processing: (stats.pending_initial_applications + stats.pending_full_applications) < 100 ? 'normal' : 'backlog',
        user_growth: stats.new_users_today > 0 ? 'active' : 'stable'
      },
      
      recent_activity: recentActivity.map(activity => ({
        type: activity.activity_type,
        status: activity.status,
        time: activity.activity_time,
        username: activity.username
      })),
      
      generated_at: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error in getSystemStatusService:', error);
    return {
      system_status: 'degraded',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// ===============================================
// USER PREFERENCES SERVICES
// ===============================================

/**
 * Get user preferences
 * @param {number} userId - User ID
 * @returns {Object} User preferences
 */
export const getUserPreferencesService = async (userId) => {
  try {
    console.log('⚙️ Getting preferences for user:', userId);
    
    const [preferences] = await db.query(`
      SELECT 
        email_notifications,
        sms_notifications,
        newsletter_subscription,
        privacy_level,
        preferred_communication_method,
        timezone,
        language_preference
      FROM user_preferences 
      WHERE user_id = ?
    `, [userId]);
    
    // Default preferences if none exist
    const defaultPreferences = {
      email_notifications: true,
      sms_notifications: false,
      newsletter_subscription: true,
      privacy_level: 'standard',
      preferred_communication_method: 'email',
      timezone: 'UTC',
      language_preference: 'en'
    };
    
    const userPreferences = preferences.length > 0 ? preferences[0] : defaultPreferences;
    
    return {
      preferences: userPreferences,
      user_id: userId
    };
    
  } catch (error) {
    console.error('❌ Error in getUserPreferencesService:', error);
    throw error;
  }
};

/**
 * Update user preferences
 * @param {number} userId - User ID
 * @param {Object} preferenceData - Preference data to update
 * @returns {Object} Update result
 */
export const updateUserPreferencesService = async (userId, preferenceData) => {
  try {
    console.log('🔧 Updating preferences for user:', userId);
    
    const {
      email_notifications,
      sms_notifications,
      newsletter_subscription,
      privacy_level,
      preferred_communication_method,
      timezone,
      language_preference
    } = preferenceData;
    
    // Update or insert preferences
    await db.query(`
      INSERT INTO user_preferences 
      (user_id, email_notifications, sms_notifications, newsletter_subscription, 
       privacy_level, preferred_communication_method, timezone, language_preference, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        email_notifications = VALUES(email_notifications),
        sms_notifications = VALUES(sms_notifications),
        newsletter_subscription = VALUES(newsletter_subscription),
        privacy_level = VALUES(privacy_level),
        preferred_communication_method = VALUES(preferred_communication_method),
        timezone = VALUES(timezone),
        language_preference = VALUES(language_preference),
        updatedAt = NOW()
    `, [
      userId,
      email_notifications !== undefined ? email_notifications : true,
      sms_notifications !== undefined ? sms_notifications : false,
      newsletter_subscription !== undefined ? newsletter_subscription : true,
      privacy_level || 'standard',
      preferred_communication_method || 'email',
      timezone || 'UTC',
      language_preference || 'en'
    ]);
    
    return {
      message: 'Preferences updated successfully',
      user_id: userId,
      updated_at: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error in updateUserPreferencesService:', error);
    throw error;
  }
};

// ===============================================
// USER PERMISSIONS SERVICES
// ===============================================

/**
 * Get user permissions
 * @param {number} userId - User ID
 * @param {string} userRole - User role
 * @param {string} membershipStage - User membership stage
 * @returns {Object} User permissions
 */
export const getUserPermissionsService = (userId, userRole = 'user', membershipStage = 'none') => {
  try {
    console.log('🔒 Getting permissions for user:', userId, 'role:', userRole);

    const permissions = {
      // Basic permissions
      can_edit_profile: true,
      can_delete_account: !['admin', 'super_admin'].includes(userRole),
      can_change_password: true,
      can_update_settings: true,
      
      // Content permissions
      can_view_content: ['pre_member', 'member'].includes(membershipStage) || ['admin', 'super_admin'].includes(userRole),
      can_create_content: membershipStage === 'member' || ['admin', 'super_admin'].includes(userRole),
      can_comment: ['pre_member', 'member'].includes(membershipStage) || ['admin', 'super_admin'].includes(userRole),
      
      // Membership permissions
      can_apply_membership: !membershipStage || membershipStage === 'none',
      can_apply_full_membership: membershipStage === 'pre_member',
      can_access_towncrier: ['pre_member', 'member'].includes(membershipStage) || ['admin', 'super_admin'].includes(userRole),
      can_access_iko: membershipStage === 'member' || ['admin', 'super_admin'].includes(userRole),
      
      // Admin permissions
      can_access_admin: ['admin', 'super_admin'].includes(userRole),
      can_manage_users: ['admin', 'super_admin'].includes(userRole),
      can_review_applications: ['admin', 'super_admin'].includes(userRole),
      can_delete_users: userRole === 'super_admin',
      
      // System permissions
      can_view_reports: ['admin', 'super_admin'].includes(userRole),
      can_send_notifications: ['admin', 'super_admin'].includes(userRole)
    };
    
    return {
      permissions,
      user_context: {
        role: userRole,
        membership_stage: membershipStage,
        user_id: userId
      }
    };
    
  } catch (error) {
    console.error('❌ Error in getUserPermissionsService:', error);
    throw error;
  }
};

// ===============================================
// DEBUG SERVICES
// ===============================================

/**
 * Debug application status consistency
 * @param {number} userId - User ID to debug
 * @returns {Object} Debug analysis
 */
export const debugApplicationStatusService = async (userId) => {
  try {
    console.log('🐛 Debug application status for user:', userId);
    
    const [userInfo] = await db.query(`
      SELECT 
        u.*,
        sl.id as survey_id,
        sl.approval_status as survey_status,
        sl.createdAt as survey_created,
        sl.reviewedAt as survey_reviewed,
        sl.answers as survey_answers,
        fma.id as full_app_id,
        fma.status as full_app_status,
        fma.submittedAt as full_app_submitted,
        fma.reviewedAt as full_app_reviewed
      FROM users u
      LEFT JOIN surveylog sl ON u.id = sl.user_id 
        AND sl.application_type = 'initial_application'
      LEFT JOIN full_membership_applications fma ON u.id = fma.user_id
      WHERE u.id = ?
      ORDER BY sl.createdAt DESC, fma.submittedAt DESC
    `, [userId]);
    
    if (userInfo.length === 0) {
      throw new CustomError('User not found', 404);
    }
    
    const user = userInfo[0];
    
    // Analyze status consistency
    const analysis = {
      user_table_status: {
        membership_stage: user.membership_stage,
        is_member: user.is_member,
        application_status: user.application_status,
        full_membership_status: user.full_membership_status,
        applicationSubmittedAt: user.applicationSubmittedAt,
        applicationReviewedAt: user.applicationReviewedAt,
        fullMembershipAppliedAt: user.fullMembershipAppliedAt,
        fullMembershipReviewedAt: user.fullMembershipReviewedAt
      },
      survey_table_status: {
        has_survey: !!user.survey_id,
        survey_status: user.survey_status,
        survey_created: user.survey_created,
        survey_reviewed: user.survey_reviewed,
        has_answers: !!user.survey_answers
      },
      full_membership_table_status: {
        has_full_app: !!user.full_app_id,
        full_app_status: user.full_app_status,
        full_app_submitted: user.full_app_submitted,
        full_app_reviewed: user.full_app_reviewed
      },
      consistency_check: {
        user_survey_status_match: user.application_status === user.survey_status,
        user_full_app_status_match: user.full_membership_status === user.full_app_status,
        dates_consistent: true, // Could add more detailed date validation
        membership_stage_logical: true // Could add validation logic
      }
    };
    
    // Add recommendations
    const recommendations = [];
    if (!analysis.consistency_check.user_survey_status_match) {
      recommendations.push('User table and survey table statuses do not match');
    }
    if (!analysis.consistency_check.user_full_app_status_match) {
      recommendations.push('User table and full membership application statuses do not match');
    }
    if (analysis.survey_table_status.has_survey && !analysis.survey_table_status.has_answers) {
      recommendations.push('Survey record exists but no answers found');
    }
    if (recommendations.length === 0) {
      recommendations.push('No consistency issues detected');
    }
    
    return {
      userId: parseInt(userId),
      username: user.username,
      analysis,
      recommendations,
      data_sources: {
        users_table: 'Primary user information',
        surveylog_table: 'Initial application data',
        full_membership_applications_table: 'Full membership data'
      },
      debug_timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error in debugApplicationStatusService:', error);
    throw error;
  }
};

// ===============================================
// LEGACY COMPATIBILITY SERVICES
// ===============================================

/**
 * Get legacy membership status format
 * @param {number} userId - User ID
 * @returns {Object} Legacy format membership status
 */
export const getLegacyMembershipStatusService = async (userId) => {
  try {
    console.log('🔄 Getting legacy membership status for user:', userId);
    
    // Get user basic info
    const [users] = await db.query(`
      SELECT id, username, email, role, membership_stage, is_member, converse_id
      FROM users WHERE id = ?
    `, [userId]);
    
    // ✅ FIXED: users is already the user object from destructuring
    if (!users) {
      throw new CustomError('User not found', 404);
    }
    
    // ✅ FIXED: users IS the user object, not an array
    const user = users;
    
    // Get application status from surveylog
    const [applications] = await db.query(`
      SELECT approval_status, createdAt, reviewedAt 
      FROM surveylog 
      WHERE user_id = ? AND application_type = 'initial_application'
      ORDER BY createdAt DESC 
      LIMIT 1
    `, [userId]);
    
    const latestApp = applications[0] || null;
    
    // Legacy format response
    return {
      user_id: user.id,
      username: user.username,
      email: user.email,
      member_status: user.is_member || 'pending',
      membership_level: user.membership_stage || 'none',
      application_status: latestApp?.approval_status || 'not_submitted',
      application_date: latestApp?.createdAt,
      review_date: latestApp?.reviewedAt,
      is_active: ['pre_member', 'member'].includes(user.membership_stage),
      can_access_content: ['pre_member', 'member'].includes(user.membership_stage) || ['admin', 'super_admin'].includes(user.role)
    };
    
  } catch (error) {
    console.error('❌ Error in getLegacyMembershipStatusService:', error);
    throw error;
  }
};

/**
 * Get simplified user status
 * @param {number} userId - User ID
 * @returns {Object} Simplified user status
 */
export const getUserStatusService = async (userId) => {
  try {
    console.log('👤 Getting simplified user status for:', userId);
    
    const [users] = await db.query(`
      SELECT id, username, role, membership_stage, is_member
      FROM users WHERE id = ?
    `, [userId]);
    
    // ✅ FIXED: users is already the user object from destructuring
    if (!users) {
      throw new CustomError('User not found', 404);
    }
    
    // ✅ FIXED: users IS the user object, not an array
    const user = users;
    
    // Simplified status response
    return {
      user_id: user.id,
      username: user.username,
      status: user.is_member,
      stage: user.membership_stage,
      role: user.role,
      is_authenticated: true,
      permissions: {
        can_access_towncrier: ['pre_member', 'member'].includes(user.membership_stage) || ['admin', 'super_admin'].includes(user.role),
        can_access_iko: user.membership_stage === 'member' || ['admin', 'super_admin'].includes(user.role),
        can_apply_initial: !user.membership_stage || user.membership_stage === 'none' || (user.membership_stage === 'applicant' && user.is_member === 'rejected'),
        can_apply_full: user.membership_stage === 'pre_member'
      }
    };
    
  } catch (error) {
    console.error('❌ Error in getUserStatusService:', error);
    throw error;
  }
};

// ===============================================
// EXPORT ALL SERVICES
// ===============================================

export default {
  // Dashboard services
  getUserDashboardService,
  getUserContentStatsService,
  
  // Status services
  getCurrentMembershipStatusService,
  checkSurveyStatusService,
  getApplicationStatusService,
  getApplicationHistoryService,
  
  // System health services
  getSystemHealthService,
  getSystemStatusService,
  
  // Preferences services
  getUserPreferencesService,
  updateUserPreferencesService,
  
  // Permissions services
  getUserPermissionsService,
  
  // Debug services
  debugApplicationStatusService,
  
  // Legacy services
  getLegacyMembershipStatusService,
  getUserStatusService
};