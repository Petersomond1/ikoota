// ikootaapi/services/applicationService.js
// ===============================================
// APPLICATION SERVICE - CLEAN VERSION
// Business logic for application operations - no duplications
// Uses correct MySQL schema and separation of concerns
// ===============================================

import db from '../config/db.js';
import CustomError from '../utils/CustomError.js';

// =============================================================================
// APPLICATION STATUS OPERATIONS
// =============================================================================

/**
 * Get comprehensive application status for user
 * @param {number} userId - User ID
 * @returns {Object} Application status
 */
export const getApplicationStatus = async (userId) => {
  try {
    const [result] = await db.query(`
      SELECT 
        u.id, u.username, u.membership_stage,
        -- New optimized status fields (with compatibility fallback)
        COALESCE(u.initial_application_status, 
          CASE 
            WHEN u.initial_application_status = 'not_applied' THEN 'not_applied'
            WHEN u.initial_application_status = 'submitted' THEN 'submitted'
            WHEN u.initial_application_status = 'under_review' THEN 'under_review'
            WHEN u.initial_application_status = 'approved' THEN 'approved'
            WHEN u.initial_application_status = 'declined' THEN 'declined'
            ELSE 'not_applied'
          END
        ) as initial_application_status,
        COALESCE(u.full_membership_appl_status,
          CASE 
            WHEN u.full_membership_appl_status = 'not_applied' THEN 'not_applied'
            WHEN u.full_membership_appl_status = 'applied' THEN 'submitted'
            WHEN u.full_membership_appl_status = 'pending' THEN 'under_review'
            WHEN u.full_membership_appl_status = 'suspended' THEN 'suspended'
            WHEN u.full_membership_appl_status = 'approved' THEN 'approved'
            WHEN u.full_membership_appl_status = 'declined' THEN 'declined'
            ELSE 'not_applied'
          END
        ) as full_membership_appl_status,
        -- Derive is_member from membership_stage (no longer stored separately)
        CASE 
          WHEN u.membership_stage = 'member' THEN 1
          ELSE 0
        END as is_member,
        u.application_ticket, u.full_membership_ticket,
        u.applicationSubmittedAt, u.applicationReviewedAt,
        u.fullMembershipAppliedAt, u.fullMembershipReviewedAt,
        
        -- Initial application from surveylog
        sl.id as survey_id,
        sl.new_status as initial_status,
        sl.createdAt as initial_submitted,
        sl.reviewedAt as initial_reviewed,
        sl.reviewed_by as initial_reviewer,
        sl.admin_notes as initial_reason,
        
        -- Full membership application
        fma.id as full_app_id,
        fma.status as full_status,
        fma.submittedAt as full_submitted,
        fma.reviewedAt as full_reviewed,
        fma.reviewed_by as full_reviewer,
        fma.admin_notes as full_notes
        
      FROM users u
      LEFT JOIN surveylog sl ON u.id = sl.user_id 
        AND sl.new_survey_type = 'initial_application'
        AND sl.id = (
          SELECT MAX(id) FROM surveylog sl2 
          WHERE sl2.user_id = u.id AND sl2.new_survey_type = 'initial_application'
        )
      LEFT JOIN full_membership_applications fma ON u.id = fma.user_id
        AND fma.id = (
          SELECT MAX(id) FROM full_membership_applications fma2 
          WHERE fma2.user_id = u.id
        )
      WHERE u.id = ? AND u.role = 'user'
    `, [userId]);

    if (!result.length) {
      throw new CustomError('User not found', 404);
    }

    const data = result[0];

    return {
      user_id: data.id,
      username: data.username,
      overall_status: {
        membership_stage: data.membership_stage || 'none',
        is_member: data.membership_stage === 'member',
        can_progress: determineCanProgress(data)
      },
      
      initial_application: {
        exists: !!data.survey_id,
        id: data.survey_id,
        status: data.initial_status || 'not_submitted',
        ticket: data.application_ticket,
        submittedAt: data.initial_submitted || data.applicationSubmittedAt,
        reviewedAt: data.initial_reviewed || data.applicationReviewedAt,
        reviewer_id: data.initial_reviewer,
        decision_reason: data.initial_reason,
        timeline: calculateApplicationTimeline(
          data.initial_submitted || data.applicationSubmittedAt,
          data.initial_reviewed || data.applicationReviewedAt
        )
      },
      
      full_membership_application: {
        exists: !!data.full_app_id,
        id: data.full_app_id,
        status: data.full_status || data.full_membership_appl_status || 'not_applied',
        ticket: data.full_membership_ticket,
        submittedAt: data.full_submitted || data.fullMembershipAppliedAt,
        reviewedAt: data.full_reviewed || data.fullMembershipReviewedAt,
        reviewer_id: data.full_reviewer,
        admin_notes: data.full_notes,
        timeline: calculateApplicationTimeline(
          data.full_submitted || data.fullMembershipAppliedAt,
          data.full_reviewed || data.fullMembershipReviewedAt
        )
      },
      
      next_steps: getNextSteps(data),
      requirements_met: checkRequirementsMet(data)
    };

  } catch (error) {
    console.error('❌ Error getting application status:', error);
    throw new CustomError(`Failed to get application status: ${error.message}`, 500);
  }
};

/**
 * Get detailed application information
 * @param {number} applicationId - Application ID
 * @param {number} userId - User ID (for authorization)
 * @param {string} type - Application type ('initial' or 'full')
 * @returns {Object} Application details
 */
export const getApplicationDetails = async (applicationId, userId, type = 'initial') => {
  try {
    let query, params;

    if (type === 'initial') {
      query = `
        SELECT 
          sl.id, sl.user_id, sl.answers, sl.application_ticket,
          sl.new_status, sl.createdAt, sl.reviewedAt,
          sl.reviewed_by, sl.admin_notes,
          u.username, u.email,
          reviewer.username as reviewer_name
        FROM surveylog sl
        JOIN users u ON sl.user_id = u.id
        LEFT JOIN users reviewer ON sl.reviewed_by = reviewer.id
        WHERE sl.id = ? AND sl.user_id = ? AND sl.new_survey_type = 'initial_application'
      `;
      params = [applicationId, userId];
    } else {
      query = `
        SELECT 
          fma.id, fma.user_id, fma.answers, fma.membership_ticket,
          fma.status, fma.submittedAt, fma.reviewedAt,
          fma.reviewed_by, fma.admin_notes,
          u.username, u.email,
          reviewer.username as reviewer_name
        FROM full_membership_applications fma
        JOIN users u ON fma.user_id = u.id
        LEFT JOIN users reviewer ON fma.reviewed_by = reviewer.id
        WHERE fma.id = ? AND fma.user_id = ?
      `;
      params = [applicationId, userId];
    }

    const [result] = await db.query(query, params);

    if (!result.length) {
      throw new CustomError('Application not found or access denied', 404);
    }

    const app = result[0];

    // Parse answers if they're stored as JSON string
    let parsedAnswers = app.answers;
    if (typeof app.answers === 'string') {
      try {
        parsedAnswers = JSON.parse(app.answers);
      } catch (parseError) {
        console.warn('Failed to parse application answers:', parseError);
        parsedAnswers = [];
      }
    }

    return {
      id: app.id,
      type: type,
      user_info: {
        id: app.user_id,
        username: app.username,
        email: app.email
      },
      
      application_data: {
        ticket: app.application_ticket || app.membership_ticket,
        answers: parsedAnswers,
        status: app.new_status || app.status,
        submittedAt: app.createdAt || app.submittedAt,
        reviewedAt: app.reviewedAt
      },
      
      review_info: {
        reviewer_id: app.reviewed_by,
        reviewer_name: app.reviewer_name,
        admin_notes: app.admin_notes
      },
      
      timeline: calculateDetailedTimeline(app),
      processing_stats: calculateProcessingStats(app)
    };

  } catch (error) {
    console.error('❌ Error getting application details:', error);
    throw new CustomError(`Failed to get application details: ${error.message}`, 500);
  }
};

/**
 * Get application history for user
 * @param {number} userId - User ID
 * @returns {Object} Application history
 */
export const getApplicationHistory = async (userId) => {
  try {
    // Get all initial applications
    const [initialApps] = await db.query(`
      SELECT 
        id, application_ticket, new_status,
        createdAt, reviewedAt, reviewed_by,
        admin_notes
      FROM surveylog 
      WHERE user_id = ? AND new_survey_type = 'initial_application'
      ORDER BY createdAt DESC
    `, [userId]);

    // Get all full membership applications
    const [fullApps] = await db.query(`
      SELECT 
        id, membership_ticket, status,
        submittedAt, reviewedAt, reviewed_by,
        admin_notes
      FROM full_membership_applications 
      WHERE user_id = ?
      ORDER BY submittedAt DESC
    `, [userId]);

    // Get review history
    const [reviewHistory] = await db.query(`
      SELECT 
        new_survey_type, previous_status, new_status,
        review_notes, action_taken, reviewedAt,
        reviewer_id
      FROM membership_review_history 
      WHERE user_id = ?
      ORDER BY reviewedAt DESC
    `, [userId]);

    return {
      user_id: userId,
      initial_applications: initialApps.map(app => ({
        id: app.id,
        ticket: app.application_ticket,
        status: app.new_status,
        submittedAt: app.createdAt,
        reviewedAt: app.reviewedAt,
        reviewer_id: app.reviewed_by,
        reason: app.admin_notes,
        type: 'initial_application'
      })),
      
      full_membership_applications: fullApps.map(app => ({
        id: app.id,
        ticket: app.membership_ticket,
        status: app.status,
        submittedAt: app.submittedAt,
        reviewedAt: app.reviewedAt,
        reviewer_id: app.reviewed_by,
        notes: app.admin_notes,
        type: 'full_membership'
      })),
      
      review_history: reviewHistory.map(review => ({
        application_type: review.new_survey_type,
        previous_status: review.previous_status,
        new_status: review.new_status,
        notes: review.review_notes,
        action: review.action_taken,
        reviewedAt: review.reviewedAt,
        reviewer_id: review.reviewer_id
      })),
      
      summary: {
        total_initial_applications: initialApps.length,
        total_full_applications: fullApps.length,
        total_reviews: reviewHistory.length,
        latest_activity: getLatestActivity(initialApps, fullApps, reviewHistory)
      }
    };

  } catch (error) {
    console.error('❌ Error getting application history:', error);
    throw new CustomError(`Failed to get application history: ${error.message}`, 500);
  }
};

// =============================================================================
// APPLICATION VALIDATION
// =============================================================================

/**
 * Validate application eligibility
 * @param {number} userId - User ID
 * @param {string} applicationType - 'initial' or 'full'
 * @returns {Object} Eligibility status
 */
export const validateApplicationEligibility = async (userId, applicationType) => {
  try {
    const [userResult] = await db.query(`
      SELECT 
        id, membership_stage, 
        -- New optimized status fields (with compatibility fallback)
        COALESCE(initial_application_status, 
          CASE 
            WHEN application_status = 'not_submitted' THEN 'not_applied'
            WHEN application_status = 'submitted' THEN 'submitted'
            WHEN application_status = 'under_review' THEN 'under_review'
            WHEN application_status = 'approved' THEN 'approved'
            WHEN application_status = 'declined' THEN 'declined'
            ELSE 'not_applied'
          END
        ) as initial_application_status,
        COALESCE(full_membership_appl_status,
          CASE 
            WHEN full_membership_appl_status = 'not_applied' THEN 'not_applied'
            WHEN full_membership_appl_status = 'applied' THEN 'submitted'
            WHEN full_membership_appl_status = 'pending' THEN 'under_review'
            WHEN full_membership_appl_status = 'suspended' THEN 'suspended'
            WHEN full_membership_appl_status = 'approved' THEN 'approved'
            WHEN full_membership_appl_status = 'declined' THEN 'declined'
            ELSE 'not_applied'
          END
        ) as full_membership_appl_status,
        -- Derive is_member from membership_stage (no longer stored separately)
        CASE 
          WHEN membership_stage = 'member' THEN 1
          ELSE 0
        END as is_member,
        applicationSubmittedAt,
        fullMembershipAppliedAt
      FROM users 
      WHERE id = ? AND role = 'user'
    `, [userId]);

    if (!userResult.length) {
      throw new CustomError('User not found', 404);
    }

    const user = userResult[0];
    let eligible = false;
    let reason = '';
    let requirements = [];

    if (applicationType === 'initial') {
      // Check initial application eligibility
      if (!user.membership_stage || user.membership_stage === 'none') {
        eligible = true;
        reason = 'Eligible for initial application';
      } else if (user.membership_stage === 'applicant' && user.initial_application_status === 'declined') {
        eligible = true;
        reason = 'Eligible to reapply after rejection';
      } else {
        eligible = false;
        reason = 'User has already progressed beyond initial application stage';
      }

      requirements = [
        { requirement: 'Must be new user or rejected applicant', met: eligible },
        { requirement: 'Must complete survey questions', met: true },
        { requirement: 'Must provide valid contact information', met: true }
      ];

    } else if (applicationType === 'full') {
      // Check full membership eligibility
      if (user.membership_stage === 'pre_member') {
        const currentStatus = user.full_membership_appl_status || 'not_applied';
        if (['not_applied', 'declined'].includes(currentStatus)) {
          eligible = true;
          reason = 'Eligible for full membership application';
        } else if (currentStatus === 'pending') {
          eligible = false;
          reason = 'Full membership application already pending';
        } else if (currentStatus === 'approved') {
          eligible = false;
          reason = 'User already has approved full membership';
        }
      } else {
        eligible = false;
        reason = 'User must be pre-member to apply for full membership';
      }

      requirements = [
        { requirement: 'Must be pre-member', met: user.membership_stage === 'pre_member' },
        { requirement: 'Must not have pending application', met: user.full_membership_appl_status !== 'under_review' },
        { requirement: 'Must not already be full member', met: user.full_membership_appl_status !== 'approved' }
      ];
    }

    return {
      eligible,
      reason,
      requirements,
      user_status: {
        membership_stage: user.membership_stage,
        is_member: user.membership_stage === 'member',
        initial_application_status: user.initial_application_status,
        full_membership_appl_status: user.full_membership_appl_status
      },
      can_reapply: checkCanReapply(user, applicationType)
    };

  } catch (error) {
    console.error('❌ Error validating application eligibility:', error);
    throw new CustomError(`Failed to validate eligibility: ${error.message}`, 500);
  }
};

/**
 * Get membership progression information
 * @param {number} userId - User ID
 * @returns {Object} Progression info
 */
export const getMembershipProgression = async (userId) => {
  try {
    const status = await getApplicationStatus(userId);
    
    const stages = [
      { name: 'none', title: 'New User', description: 'Account created, ready to apply' },
      { name: 'applicant', title: 'Applicant', description: 'Initial application submitted' },
      { name: 'pre_member', title: 'Pre-Member', description: 'Initial application approved' },
      { name: 'member', title: 'Full Member', description: 'Full membership granted' }
    ];

    const currentStage = status.overall_status.membership_stage;
    const currentIndex = stages.findIndex(stage => stage.name === currentStage);

    return {
      current_stage: currentStage,
      current_index: currentIndex,
      stages: stages.map((stage, index) => ({
        ...stage,
        completed: index <= currentIndex,
        current: index === currentIndex,
        accessible: index <= currentIndex + 1
      })),
      progress_percentage: currentIndex >= 0 ? Math.round(((currentIndex + 1) / stages.length) * 100) : 0,
      next_stage: stages[currentIndex + 1] || null,
      can_advance: status.overall_status.can_progress
    };

  } catch (error) {
    console.error('❌ Error getting membership progression:', error);
    throw new CustomError(`Failed to get progression: ${error.message}`, 500);
  }
};

/**
 * Check user eligibility for various actions
 * @param {number} userId - User ID
 * @param {string} action - Action to check
 * @returns {Object} Eligibility result
 */
export const checkEligibility = async (userId, action) => {
  try {
    const [userResult] = await db.query(`
      SELECT 
        membership_stage, 
        -- New optimized status fields (with compatibility fallback)
        COALESCE(initial_application_status, 
          CASE 
            WHEN application_status = 'not_submitted' THEN 'not_applied'
            WHEN application_status = 'submitted' THEN 'submitted'
            WHEN application_status = 'under_review' THEN 'under_review'
            WHEN application_status = 'approved' THEN 'approved'
            WHEN application_status = 'declined' THEN 'declined'
            ELSE 'not_applied'
          END
        ) as initial_application_status,
        COALESCE(full_membership_appl_status,
          CASE 
            WHEN full_membership_appl_status = 'not_applied' THEN 'not_applied'
            WHEN full_membership_appl_status = 'applied' THEN 'submitted'
            WHEN full_membership_appl_status = 'pending' THEN 'under_review'
            WHEN full_membership_appl_status = 'suspended' THEN 'suspended'
            WHEN full_membership_appl_status = 'approved' THEN 'approved'
            WHEN full_membership_appl_status = 'declined' THEN 'declined'
            ELSE 'not_applied'
          END
        ) as full_membership_appl_status,
        -- Derive is_member from membership_stage (no longer stored separately)
        CASE 
          WHEN membership_stage = 'member' THEN 1
          ELSE 0
        END as is_member,
        role, isbanned, is_verified
      FROM users 
      WHERE id = ?
    `, [userId]);

    if (!userResult.length) {
      throw new CustomError('User not found', 404);
    }

    const user = userResult[0];
    let eligible = false;
    let reason = '';
    let requirements = [];

    switch (action) {
      case 'submit_initial_application':
        const initialEligibility = await validateApplicationEligibility(userId, 'initial');
        eligible = initialEligibility.eligible;
        reason = initialEligibility.reason;
        requirements = initialEligibility.requirements;
        break;

      case 'submit_full_membership':
        const fullEligibility = await validateApplicationEligibility(userId, 'full');
        eligible = fullEligibility.eligible;
        reason = fullEligibility.reason;
        requirements = fullEligibility.requirements;
        break;

      case 'access_towncrier':
        eligible = ['pre_member', 'member'].includes(user.membership_stage) || ['admin', 'super_admin'].includes(user.role);
        reason = eligible ? 'Has required membership level' : 'Requires pre-member status or higher';
        break;

      case 'access_iko':
        eligible = user.membership_stage === 'member' || ['admin', 'super_admin'].includes(user.role);
        reason = eligible ? 'Has full member access' : 'Requires full member status';
        break;

      case 'join_classes':
        eligible = ['pre_member', 'member'].includes(user.membership_stage);
        reason = eligible ? 'Can join classes' : 'Requires pre-member status or higher';
        break;

      default:
        eligible = true;
        reason = 'No specific requirements';
    }

    return {
      action,
      eligible,
      reason,
      requirements,
      user_status: {
        membership_stage: user.membership_stage,
        is_member: user.membership_stage === 'member',
        role: user.role,
        is_verified: user.is_verified,
        is_banned: user.isbanned
      }
    };

  } catch (error) {
    console.error('❌ Error checking eligibility:', error);
    throw new CustomError(`Failed to check eligibility: ${error.message}`, 500);
  }
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Determine if user can progress to next stage
 */
const determineCanProgress = (userData) => {
  const stage = userData.membership_stage;
  const initialStatus = userData.initial_status;
  const fullStatus = userData.full_status || userData.full_membership_appl_status;

  if (!stage || stage === 'none') {
    return true; // Can apply for initial
  }
  
  if (stage === 'applicant' && initialStatus === 'approved') {
    return true; // Can become pre-member
  }
  
  if (stage === 'pre_member' && (!fullStatus || ['not_applied', 'declined'].includes(fullStatus))) {
    return true; // Can apply for full membership
  }
  
  return false;
};

/**
 * Calculate application timeline
 */
const calculateApplicationTimeline = (submitted, reviewed) => {
  if (!submitted) return null;

  const timeline = {
    submittedAt: submitted,
    reviewedAt: reviewed,
    days_since_submission: Math.floor((new Date() - new Date(submitted)) / (1000 * 60 * 60 * 24))
  };

  if (reviewed) {
    timeline.days_to_review = Math.floor((new Date(reviewed) - new Date(submitted)) / (1000 * 60 * 60 * 24));
    timeline.status = 'reviewed';
  } else {
    timeline.status = 'pending';
  }

  return timeline;
};

/**
 * Get next steps for user
 */
const getNextSteps = (userData) => {
  const steps = [];
  const stage = userData.membership_stage;
  const initialStatus = userData.initial_status;
  const fullStatus = userData.full_status || userData.full_membership_appl_status;

  if (!stage || stage === 'none') {
    steps.push({
      action: 'submit_initial_application',
      title: 'Submit Initial Application',
      description: 'Complete the membership survey to begin your journey',
      priority: 'high'
    });
  } else if (stage === 'applicant' && initialStatus === 'pending') {
    steps.push({
      action: 'wait_for_review',
      title: 'Application Under Review',
      description: 'Your application is being reviewed by our team',
      priority: 'info'
    });
  } else if (stage === 'pre_member' && (!fullStatus || fullStatus === 'not_applied')) {
    steps.push({
      action: 'apply_full_membership',
      title: 'Apply for Full Membership',
      description: 'Take the next step and apply for full member status',
      priority: 'high'
    });
  } else if (stage === 'pre_member' && fullStatus === 'declined') {
    steps.push({
      action: 'reapply_full_membership',
      title: 'Reapply for Full Membership',
      description: 'Your previous application was declined. You can apply again',
      priority: 'medium'
    });
  } else if (stage === 'member') {
    steps.push({
      action: 'explore_features',
      title: 'Explore Member Features',
      description: 'You now have full access to all platform features',
      priority: 'info'
    });
  }

  return steps;
};

/**
 * Check requirements met
 */
const checkRequirementsMet = (userData) => {
  const requirements = {
    initial_application: {
      submitted: !!userData.survey_id,
      approved: userData.initial_status === 'approved'
    },
    full_membership: {
      eligible: userData.membership_stage === 'pre_member',
      submitted: !!userData.full_app_id,
      approved: (userData.full_status || userData.full_membership_appl_status) === 'approved'
    }
  };

  requirements.overall_progress = calculateOverallProgress(requirements);
  
  return requirements;
};

/**
 * Calculate overall progress percentage
 */
const calculateOverallProgress = (requirements) => {
  let completed = 0;
  let total = 4; // Total requirements

  if (requirements.initial_application.submitted) completed++;
  if (requirements.initial_application.approved) completed++;
  if (requirements.full_membership.submitted) completed++;
  if (requirements.full_membership.approved) completed++;

  return Math.round((completed / total) * 100);
};

/**
 * Calculate detailed timeline
 */
const calculateDetailedTimeline = (app) => {
  const submitted = app.createdAt || app.submittedAt;
  const reviewed = app.reviewedAt;

  const timeline = {
    submittedAt: submitted,
    reviewedAt: reviewed,
    current_status: app.new_status || app.status
  };

  if (submitted) {
    timeline.days_since_submission = Math.floor((new Date() - new Date(submitted)) / (1000 * 60 * 60 * 24));
  }

  if (reviewed && submitted) {
    timeline.processing_time_days = Math.floor((new Date(reviewed) - new Date(submitted)) / (1000 * 60 * 60 * 24));
  }

  return timeline;
};

/**
 * Calculate processing statistics
 */
const calculateProcessingStats = (app) => {
  const submitted = app.createdAt || app.submittedAt;
  const reviewed = app.reviewedAt;
  const status = app.new_status || app.status;

  return {
    is_pending: ['pending', 'under_review'].includes(status),
    is_completed: ['approved', 'declined', 'rejected'].includes(status),
    processing_time: reviewed && submitted ? 
      Math.floor((new Date(reviewed) - new Date(submitted)) / (1000 * 60 * 60 * 24)) : null,
    days_waiting: submitted && !reviewed ? 
      Math.floor((new Date() - new Date(submitted)) / (1000 * 60 * 60 * 24)) : null
  };
};

/**
 * Get latest activity
 */
const getLatestActivity = (initialApps, fullApps, reviewHistory) => {
  const activities = [];

  // Add initial applications
  initialApps.forEach(app => {
    activities.push({
      type: 'initial_application',
      action: app.new_status === 'pending' ? 'submitted' : 'reviewed',
      date: app.reviewedAt || app.createdAt,
      status: app.new_status
    });
  });

  // Add full applications
  fullApps.forEach(app => {
    activities.push({
      type: 'full_membership',
      action: app.status === 'pending' ? 'submitted' : 'reviewed',
      date: app.reviewedAt || app.submittedAt,
      status: app.status
    });
  });

  // Add review history
  reviewHistory.forEach(review => {
    activities.push({
      type: 'review',
      action: review.action_taken,
      date: review.reviewedAt,
      status: review.new_status
    });
  });

  // Sort by date and return latest
  activities.sort((a, b) => new Date(b.date) - new Date(a.date));
  return activities[0] || null;
};

/**
 * Check if user can reapply
 */
const checkCanReapply = (user, applicationType) => {
  if (applicationType === 'initial') {
    return user.membership_stage === 'applicant' && user.initial_application_status === 'declined';
  } else if (applicationType === 'full') {
    return user.membership_stage === 'pre_member' && user.full_membership_appl_status === 'declined';
  }
  return false;
};

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  getApplicationStatus,
  getApplicationDetails,
  getApplicationHistory,
  validateApplicationEligibility,
  getMembershipProgression,
  checkEligibility
};