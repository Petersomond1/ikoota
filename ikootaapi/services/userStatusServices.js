// ikootaapi/services/userStatusServices.js
// USER STATUS & DASHBOARD SERVICES - COMPLETE FILE
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

    // ✅ Safe result access
    if (!userDashboard || (Array.isArray(userDashboard) && userDashboard.length === 0)) {
      throw new CustomError('User not found', 404);
    }

    const user = Array.isArray(userDashboard) ? userDashboard[0] : userDashboard;

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

    // ✅ BUILD CLEAN RESPONSE OBJECT
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
      
      if (stats && (Array.isArray(stats) ? stats.length > 0 : stats)) {
        const statsData = Array.isArray(stats) ? stats[0] : stats;
        contentStats = statsData;
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
    
    // ✅ Safe result access
    if (!userStatus || (Array.isArray(userStatus) && userStatus.length === 0)) {
      throw new CustomError('User not found', 404);
    }
    
    const user = Array.isArray(userStatus) ? userStatus[0] : userStatus;
    
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

    // ✅ Safe result access
    if (!userResults || (Array.isArray(userResults) && userResults.length === 0)) {
      throw new CustomError('User not found', 404);
    }

    const user = Array.isArray(userResults) ? userResults[0] : userResults;
    
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

    // ✅ Safe array access
    const safeApplications = Array.isArray(applications) ? applications : [];
    const applicationHistory = safeApplications.map(app => ({
      application_type: app.application_type,
      status: app.status,
      submitted_at: app.submitted_at,
      reviewed_at: app.reviewed_at,
      reviewer_name: app.reviewer_name,
      admin_notes: app.admin_notes,
      ticket: app.application_ticket
    }));

    const latestApplication = safeApplications.length > 0 ? safeApplications[0] : null;

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
        total_applications: safeApplications.length,
        has_pending: safeApplications.some(app => app.status === 'pending'),
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

    // ✅ Safe array access with fallback
    const safeHistory = Array.isArray(history) ? history : [];

    return {
      user_id: userId,
      data: {
        application_history: safeHistory.map(record => ({
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
        }))
      },
      summary: {
        total_reviews: safeHistory.length,
        last_review: safeHistory.length > 0 ? safeHistory[0].reviewedAt : null,
        status_changes: safeHistory.length
      }
    };

  } catch (error) {
    console.error('❌ Error in getApplicationHistoryService:', error);
    // Return empty history instead of throwing to prevent breaking the app
    return {
      user_id: userId,
      data: {
        application_history: []
      },
      summary: {
        total_reviews: 0,
        last_review: null,
        status_changes: 0
      }
    };
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
    
    // ✅ Safe result access
    const healthCheck = Array.isArray(dbTest) ? dbTest[0] : dbTest;
    
    // Get basic system stats
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as new_users_24h,
        (SELECT COUNT(*) FROM surveylog WHERE approval_status = 'pending') as pending_applications,
        (SELECT COUNT(*) FROM full_membership_applications WHERE status = 'pending') as pending_full_memberships
      FROM users
    `);
    
    // ✅ Safe result access
    const systemStats = Array.isArray(stats) ? stats[0] : stats;
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        response_time: 'normal',
        current_time: healthCheck?.current_time
      },
      statistics: {
        total_users: systemStats?.total_users || 0,
        new_users_24h: systemStats?.new_users_24h || 0,
        pending_applications: systemStats?.pending_applications || 0,
        pending_full_memberships: systemStats?.pending_full_memberships || 0
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
        (SELECT COUNT(*) FROM users WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as new_users_today,
        (SELECT COUNT(*) FROM users WHERE lastLogin >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as active_users_7_days
    `);
    
    // ✅ Safe result access
    const stats = (Array.isArray(systemStats) && systemStats[0]) ? systemStats[0] : {
      total_users: 0,
      pre_members: 0,
      full_members: 0,
      applicants: 0,
      unregistered: 0,
      new_users_today: 0,
      active_users_7_days: 0
    };
    
    // Check database performance
    const startTime = Date.now();
    await db.query('SELECT 1');
    const dbResponseTime = Date.now() - startTime;
    
    // Get pending applications (with error handling)
    let pendingApplications = 0;
    try {
      const [pendingResult] = await db.query(`
        SELECT COUNT(*) as pending_count 
        FROM surveylog 
        WHERE approval_status = 'pending'
      `);
      pendingApplications = (Array.isArray(pendingResult) && pendingResult[0]) ? pendingResult[0].pending_count : 0;
    } catch (pendingError) {
      console.warn('Could not fetch pending applications:', pendingError.message);
    }
    
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
        activity_metrics: {
          new_users_today: stats.new_users_today,
          active_users_7_days: stats.active_users_7_days
        }
      },
      
      application_queue: {
        pending_applications: pendingApplications,
        processing_status: pendingApplications < 50 ? 'normal' : 'backlog'
      },
      
      health_indicators: {
        database: dbResponseTime < 1000 ? 'healthy' : 'slow',
        application_processing: pendingApplications < 100 ? 'normal' : 'backlog',
        user_growth: stats.new_users_today > 0 ? 'active' : 'stable'
      },
      
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
        notification_preferences,
        display_preferences,
        privacy_preferences,
        content_preferences
      FROM user_preferences 
      WHERE user_id = ?
    `, [userId]);
    
    // Default preferences
    const defaultPreferences = {
      notification_preferences: {
        email_on_comment: true,
        email_on_mention: true,
        email_weekly_digest: true,
        push_notifications: false
      },
      display_preferences: {
        theme: 'light',
        font_size: 'medium',
        compact_view: false,
        show_avatars: true
      },
      privacy_preferences: {
        profile_visibility: 'members_only',
        activity_visibility: 'members_only',
        email_visibility: 'admins_only'
      },
      content_preferences: {
        content_language: 'en',
        mature_content: false,
        auto_expand_content: true
      }
    };
    
    let userPreferences = defaultPreferences;
    if (Array.isArray(preferences) && preferences.length > 0) {
      const prefs = preferences[0];
      userPreferences = {
        notification_preferences: prefs.notification_preferences ? JSON.parse(prefs.notification_preferences) : defaultPreferences.notification_preferences,
        display_preferences: prefs.display_preferences ? JSON.parse(prefs.display_preferences) : defaultPreferences.display_preferences,
        privacy_preferences: prefs.privacy_preferences ? JSON.parse(prefs.privacy_preferences) : defaultPreferences.privacy_preferences,
        content_preferences: prefs.content_preferences ? JSON.parse(prefs.content_preferences) : defaultPreferences.content_preferences
      };
    }
    
    return {
      user_id: userId,
      preferences: userPreferences
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
export const updateUserPreferencesService = async (userId, preferencesData) => {
  try {
    console.log('🔧 Updating preferences for user:', userId);
    
    const allowedPreferenceTypes = [
      'notification_preferences',
      'display_preferences', 
      'privacy_preferences',
      'content_preferences'
    ];
    
    const filteredPreferences = Object.fromEntries(
      Object.entries(preferencesData).filter(([key]) => allowedPreferenceTypes.includes(key))
    );
    
    if (Object.keys(filteredPreferences).length === 0) {
      throw new CustomError('No valid preferences to update', 400);
    }
    
    // Convert objects to JSON strings for database storage
    const processedPreferences = Object.fromEntries(
      Object.entries(filteredPreferences).map(([key, value]) => [
        key, 
        typeof value === 'object' ? JSON.stringify(value) : value
      ])
    );
    
    // Build upsert query
    const fields = Object.keys(processedPreferences);
    const values = Object.values(processedPreferences);
    const placeholders = fields.map(() => '?').join(', ');
    const updateClause = fields.map(field => `${field} = VALUES(${field})`).join(', ');
    
    await db.query(`
      INSERT INTO user_preferences (user_id, ${fields.join(', ')}, createdAt, updatedAt)
      VALUES (?, ${placeholders}, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        ${updateClause},
        updatedAt = NOW()
    `, [userId, ...values]);
    
    return await getUserPreferencesService(userId);
    
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
      can_edit_own_content: true,
      can_delete_own_content: true,
      
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
      can_ban_users: ['admin', 'super_admin'].includes(userRole),
      
      // System permissions
      can_view_reports: ['admin', 'super_admin'].includes(userRole),
      can_send_notifications: ['admin', 'super_admin'].includes(userRole),
      can_export_data: ['admin', 'super_admin'].includes(userRole),
      
      // Feature permissions
      can_use_advanced_search: ['member'].includes(membershipStage) || ['admin', 'super_admin'].includes(userRole),
      can_create_groups: membershipStage === 'member' || ['admin', 'super_admin'].includes(userRole),
      can_moderate_content: ['admin', 'super_admin'].includes(userRole)
    };
    
    return {
      permissions,
      user_context: {
        role: userRole,
        membership_stage: membershipStage,
        user_id: userId
      },
      access_levels: {
        content_access: permissions.can_view_content ? 'granted' : 'denied',
        creation_access: permissions.can_create_content ? 'granted' : 'denied',
        admin_access: permissions.can_access_admin ? 'granted' : 'denied'
      }
    };
    
  } catch (error) {
    console.error('❌ Error in getUserPermissionsService:', error);
    throw error;
  }
};

// ===============================================
// ACTIVITY TRACKING SERVICES
// ===============================================

/**
 * Get user activity statistics
 * @param {number} userId - User ID
 * @returns {Object} Activity statistics
 */
export const getUserActivityStatsService = async (userId) => {
  try {
    console.log('📈 Getting activity stats for user:', userId);
    
    const [activityStats] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM user_activity_log WHERE user_id = ? AND activity_type = 'login') as total_logins,
        (SELECT COUNT(*) FROM user_activity_log WHERE user_id = ? AND activity_type = 'content_view' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as content_views_30d,
        (SELECT COUNT(*) FROM user_activity_log WHERE user_id = ? AND activity_type = 'comment' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as comments_30d,
        (SELECT MAX(created_at) FROM user_activity_log WHERE user_id = ? AND activity_type = 'login') as last_login,
        (SELECT COUNT(DISTINCT DATE(created_at)) FROM user_activity_log WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as active_days_30d
    `, [userId, userId, userId, userId, userId]);
    
    // ✅ Safe result access
    const stats = (Array.isArray(activityStats) && activityStats[0]) ? activityStats[0] : {
      total_logins: 0,
      content_views_30d: 0,
      comments_30d: 0,
      last_login: null,
      active_days_30d: 0
    };
    
    return {
      user_id: userId,
      activity_summary: {
        total_logins: stats.total_logins || 0,
        last_login: stats.last_login,
        active_days_last_30: stats.active_days_30d || 0
      },
      engagement_metrics: {
        content_views_30d: stats.content_views_30d || 0,
        comments_30d: stats.comments_30d || 0,
        engagement_score: calculateEngagementScore(stats)
      },
      generated_at: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error in getUserActivityStatsService:', error);
    // Return default stats instead of throwing
    return {
      user_id: userId,
      activity_summary: {
        total_logins: 0,
        last_login: null,
        active_days_last_30: 0
      },
      engagement_metrics: {
        content_views_30d: 0,
        comments_30d: 0,
        engagement_score: 0
      },
      generated_at: new Date().toISOString()
    };
  }
};

/**
 * Calculate user engagement score
 * @param {Object} stats - Activity statistics
 * @returns {number} Engagement score (0-100)
 */
const calculateEngagementScore = (stats) => {
  const weights = {
    active_days: 0.4,
    content_views: 0.3,
    comments: 0.3
  };
  
  // Normalize values to 0-100 scale
  const normalizedActiveDays = Math.min((stats.active_days_30d || 0) / 30, 1) * 100;
  const normalizedContentViews = Math.min((stats.content_views_30d || 0) / 100, 1) * 100;
  const normalizedComments = Math.min((stats.comments_30d || 0) / 20, 1) * 100;
  
  const engagementScore = (
    normalizedActiveDays * weights.active_days +
    normalizedContentViews * weights.content_views +
    normalizedComments * weights.comments
  );
  
  return Math.round(engagementScore);
};

// ===============================================
// NOTIFICATION SERVICES
// ===============================================

/**
 * Get user notifications
 * @param {number} userId - User ID
 * @param {Object} options - Query options
 * @returns {Object} Notifications
 */
export const getUserNotificationsService = async (userId, options = {}) => {
  try {
    console.log('🔔 Getting notifications for user:', userId);
    
    const {
      limit = 20,
      offset = 0,
      unread_only = false,
      notification_type = null
    } = options;
    
    let whereClause = 'WHERE user_id = ?';
    let queryParams = [userId];
    
    if (unread_only) {
      whereClause += ' AND is_read = FALSE';
    }
    
    if (notification_type) {
      whereClause += ' AND notification_type = ?';
      queryParams.push(notification_type);
    }
    
    const [notifications] = await db.query(`
      SELECT 
        id,
        notification_type,
        title,
        message,
        data,
        is_read,
        priority,
        created_at,
        read_at,
        expires_at
      FROM user_notifications 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, limit, offset]);
    
    // Get total count
    const [countResult] = await db.query(`
      SELECT COUNT(*) as total_count
      FROM user_notifications 
      ${whereClause}
    `, queryParams);
    
    const safeNotifications = Array.isArray(notifications) ? notifications : [];
    const totalCount = (Array.isArray(countResult) && countResult[0]) ? countResult[0].total_count : 0;
    
    return {
      user_id: userId,
      notifications: safeNotifications.map(notif => ({
        id: notif.id,
        type: notif.notification_type,
        title: notif.title,
        message: notif.message,
        data: notif.data ? JSON.parse(notif.data) : null,
        is_read: !!notif.is_read,
        priority: notif.priority,
        created_at: notif.created_at,
        read_at: notif.read_at,
        expires_at: notif.expires_at
      })),
      pagination: {
        total_count: totalCount,
        limit: limit,
        offset: offset,
        has_more: (offset + limit) < totalCount
      },
      summary: {
        unread_count: safeNotifications.filter(n => !n.is_read).length,
        total_notifications: totalCount
      }
    };
    
  } catch (error) {
    console.error('❌ Error in getUserNotificationsService:', error);
    return {
      user_id: userId,
      notifications: [],
      pagination: { total_count: 0, limit: 0, offset: 0, has_more: false },
      summary: { unread_count: 0, total_notifications: 0 }
    };
  }
};

/**
 * Mark notifications as read
 * @param {number} userId - User ID
 * @param {Array} notificationIds - Notification IDs to mark as read
 * @returns {Object} Update result
 */
export const markNotificationsReadService = async (userId, notificationIds = []) => {
  try {
    console.log('✅ Marking notifications as read for user:', userId);
    
    if (notificationIds.length === 0) {
      // Mark all notifications as read
      await db.query(`
        UPDATE user_notifications 
        SET is_read = TRUE, read_at = NOW() 
        WHERE user_id = ? AND is_read = FALSE
      `, [userId]);
    } else {
      // Mark specific notifications as read
      const placeholders = notificationIds.map(() => '?').join(',');
      await db.query(`
        UPDATE user_notifications 
        SET is_read = TRUE, read_at = NOW() 
        WHERE user_id = ? AND id IN (${placeholders})
      `, [userId, ...notificationIds]);
    }
    
    return {
      success: true,
      marked_count: notificationIds.length || 'all',
      updated_at: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error in markNotificationsReadService:', error);
    throw error;
  }
};


/**
 * Get user statistics for admin dashboard
 * @returns {Object} User statistics
 */
export const getUserStatsService = async () => {
  try {
    console.log('📊 Getting user statistics');
    
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as total_admins,
        COUNT(CASE WHEN role = 'super_admin' THEN 1 END) as total_super_admins,
        COUNT(CASE WHEN role = 'mentor' THEN 1 END) as total_mentors,
        COUNT(CASE WHEN membership_stage = 'pre_member' THEN 1 END) as pre_members,
        COUNT(CASE WHEN membership_stage = 'member' THEN 1 END) as full_members,
        COUNT(CASE WHEN membership_stage = 'applicant' THEN 1 END) as applicants,
        COUNT(CASE WHEN isblocked = 1 THEN 1 END) as blocked_users,
        COUNT(CASE WHEN isbanned = 1 THEN 1 END) as banned_users,
        COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_users_30_days,
        COUNT(CASE WHEN lastLogin >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as active_users_7_days
      FROM users
    `);
    
    // ✅ Safe result access
    const statsData = (Array.isArray(stats) && stats[0]) ? stats[0] : {
      total_users: 0,
      total_admins: 0,
      total_super_admins: 0,
      total_mentors: 0,
      pre_members: 0,
      full_members: 0,
      applicants: 0,
      blocked_users: 0,
      banned_users: 0,
      new_users_30_days: 0,
      active_users_7_days: 0
    };
    
    return {
      user_counts: {
        total: statsData.total_users,
        admins: statsData.total_admins,
        super_admins: statsData.total_super_admins,
        mentors: statsData.total_mentors,
        pre_members: statsData.pre_members,
        full_members: statsData.full_members,
        applicants: statsData.applicants
      },
      user_status: {
        blocked: statsData.blocked_users,
        banned: statsData.banned_users
      },
      activity_metrics: {
        new_users_30_days: statsData.new_users_30_days,
        active_users_7_days: statsData.active_users_7_days
      },
      generated_at: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error in getUserStats:', error);
    throw error;
  }
};

// ===============================================
// EXPORT ALL SERVICES
// ===============================================

// export {
//   // Dashboard services
//   getUserDashboardService,
//   getUserContentStatsService,
  
//   // Status services
//   getCurrentMembershipStatusService,
//   checkSurveyStatusService,
//   getApplicationStatusService,
//   getApplicationHistoryService,
  
//   // System health services
//   getSystemHealthService,
//   getSystemStatusService,
  
//   // Preferences services
//   getUserPreferencesService,
//   updateUserPreferencesService,
  
//   // Permissions services
//   getUserPermissionsService,
  
//   // Activity services
//   getUserActivityStatsService,
  
//   // Notification services
//   getUserNotificationsService,
//   markNotificationsReadService
// };

// export default {
//   // Dashboard services
//   getUserDashboardService,
//   getUserContentStatsService,
  
//   // Status services
//   getCurrentMembershipStatusService,
//   checkSurveyStatusService,
//   getApplicationStatusService,
//   getApplicationHistoryService,
  
//   // System health services
//   getSystemHealthService,
//   getSystemStatusService,
  
//   // Preferences services
//   getUserPreferencesService,
//   updateUserPreferencesService,
  
//   // Permissions services
//   getUserPermissionsService,
  
//   // Activity services
//   getUserActivityStatsService,
  
//   // Notification services
//   getUserNotificationsService,
//   markNotificationsReadService
// };