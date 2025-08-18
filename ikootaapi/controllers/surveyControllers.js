// ikootaapi/controllers/surveyController.js
// ===============================================
// SURVEY CONTROLLER - COMPLETE IMPLEMENTATION
// Maps to all 15+ survey routes from surveyRoutes.js
// Handles survey submission, questions, drafts, and user management
// Integrated with membership system for seamless application flow
// ===============================================

import db from '../config/db.js';
import surveyServices from '../services/surveyServices.js';
import questionLabelsService from '../services/questionLabelsService.js';
import { sendEmail } from '../utils/email.js';
import { sendNotification } from '../utils/notifications.js';
import { generateUniqueId } from '../utils/idGenerator.js';
import CustomError from '../utils/CustomError.js';

// =============================================================================
// SURVEY SUBMISSION CONTROLLERS
// =============================================================================

/**
 * Submit survey/application
 * Route: POST /api/survey/submit
 * Route: POST /api/survey/application/submit (alias)
 * Route: POST /api/survey/submit_applicationsurvey (legacy)
 */
export const submitSurvey = async (req, res) => {
  try {
    const { answers, applicationType = 'initial_application', draftId = null } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;
    const username = req.user.username;

    console.log(`🔍 User ${username} submitting ${applicationType} survey`);

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Survey answers are required',
        details: 'Answers must be provided as an object or array'
      });
    }

    // Validate answers completeness
    const requiredFields = ['fullName', 'reasonForJoining', 'expectedContributions'];
    const missingFields = requiredFields.filter(field => !answers[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Required fields missing',
        missing_fields: missingFields,
        details: 'Please complete all required fields before submitting'
      });
    }

    // Generate application ticket
    const applicationTicket = `${applicationType.toUpperCase()}-${Date.now()}-${userId}`;

    let result;

    if (applicationType === 'initial_application') {
      // Submit initial application using survey service
      result = await surveyServices.submitInitialApplicationService({
        answers,
        applicationTicket,
        userId,
        userEmail,
        username
      });
    } else if (applicationType === 'full_membership') {
      // Submit full membership application
      const membershipTicket = `FM-${Date.now()}-${userId}`;
      result = await surveyServices.submitFullMembershipApplicationService({
        answers,
        membershipTicket,
        userId,
        userEmail,
        username
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid application type',
        valid_types: ['initial_application', 'full_membership']
      });
    }

    // Delete draft if it was used for submission
    if (draftId) {
      try {
        await surveyServices.deleteSurveyDraft(draftId, userId);
      } catch (draftError) {
        console.warn('Failed to delete draft after submission:', draftError.message);
      }
    }

    res.json({
      success: true,
      message: 'Survey submitted successfully',
      submission: {
        application_type: applicationType,
        application_ticket: result.applicationTicket || result.membershipTicket,
        survey_id: result.surveyId || result.applicationId,
        status: 'pending',
        submitted_at: new Date().toISOString()
      },
      user: {
        id: userId,
        username: username
      },
      next_steps: {
        message: 'Your application is now under review',
        estimated_review_time: '3-5 business days',
        notification_method: 'email'
      }
    });

  } catch (error) {
    console.error('❌ Error submitting survey:', error);
    
    // Handle specific errors
    if (error.message.includes('already submitted')) {
      return res.status(409).json({
        success: false,
        error: 'Application already submitted',
        details: 'You already have a pending application of this type'
      });
    }

    if (error.message.includes('not eligible')) {
      return res.status(403).json({
        success: false,
        error: 'Not eligible for this application type',
        details: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to submit survey',
      details: error.message
    });
  }
};

// =============================================================================
// SURVEY DRAFT MANAGEMENT CONTROLLERS
// =============================================================================

/**
 * Save survey draft
 * Route: POST /api/survey/draft/save
 */
export const saveSurveyDraft = async (req, res) => {
  try {
    const { answers, applicationType = 'initial_application', draftName = null } = req.body;
    const userId = req.user.id;

    console.log(`🔍 User ${req.user.username} saving survey draft (${applicationType})`);

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Draft answers are required'
      });
    }

    // Save draft using survey service
    const result = await surveyServices.saveDraftSurvey({
      userId,
      answers,
      applicationType,
      draftName
    });

    res.json({
      success: true,
      message: 'Draft saved successfully',
      draft: {
        id: result.draftId,
        application_type: applicationType,
        answer_count: Array.isArray(answers) ? answers.length : Object.keys(answers).length,
        saved_at: new Date().toISOString()
      },
      auto_save: true
    });

  } catch (error) {
    console.error('❌ Error saving survey draft:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save draft',
      details: error.message
    });
  }
};

/**
 * Get user's survey drafts
 * Route: GET /api/survey/drafts
 */
export const getSurveyDrafts = async (req, res) => {
  try {
    const { applicationType = null } = req.query;
    const userId = req.user.id;

    console.log(`🔍 User ${req.user.username} fetching survey drafts`);

    const drafts = await surveyServices.getUserSurveyDrafts(userId, applicationType);

    // Format drafts for response
    const formattedDrafts = drafts.map(draft => ({
      id: draft.id,
      application_type: draft.application_type,
      answers: draft.answers,
      created_at: draft.createdAt,
      updatedAt: draft.updatedAt,
      admin_notes: draft.admin_notes,
      is_admin_saved: !!draft.saved_by_admin_id,
      answer_completeness: calculateAnswerCompleteness(draft.answers)
    }));

    res.json({
      success: true,
      drafts: formattedDrafts,
      summary: {
        total_drafts: formattedDrafts.length,
        by_type: groupDraftsByType(formattedDrafts),
        latest_draft: formattedDrafts.length > 0 ? formattedDrafts[0] : null
      },
      filters_applied: { applicationType }
    });

  } catch (error) {
    console.error('❌ Error fetching survey drafts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch drafts',
      details: error.message
    });
  }
};

/**
 * Delete survey draft
 * Route: DELETE /api/survey/draft/:draftId
 */
export const deleteSurveyDraftController = async (req, res) => {
  try {
    const { draftId } = req.params;
    const userId = req.user.id;

    console.log(`🔍 User ${req.user.username} deleting draft ${draftId}`);

    const result = await surveyServices.deleteSurveyDraft(draftId, userId);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Draft not found or access denied'
      });
    }

    res.json({
      success: true,
      message: 'Draft deleted successfully',
      draft_id: draftId,
      deleted_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error deleting survey draft:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete draft',
      details: error.message
    });
  }
};

// =============================================================================
// SURVEY QUESTIONS & LABELS CONTROLLERS
// =============================================================================

/**
 * Get survey questions
 * Route: GET /api/survey/questions
 */
export const getSurveyQuestions = async (req, res) => {
  try {
    const { applicationType = 'initial_application' } = req.query;

    console.log(`🔍 User ${req.user.username} fetching survey questions (${applicationType})`);

    // Get questions from survey service
    const questions = await surveyServices.fetchSurveyQuestions();

    // Get question labels for dynamic forms
    const labels = await questionLabelsService.fetchQuestionLabels();

    // Build structured questions based on application type
    const structuredQuestions = buildStructuredQuestions(applicationType, questions, labels);

    res.json({
      success: true,
      questions: structuredQuestions,
      application_type: applicationType,
      metadata: {
        total_questions: structuredQuestions.length,
        required_questions: structuredQuestions.filter(q => q.required).length,
        estimated_time: Math.ceil(structuredQuestions.length * 1.5) + ' minutes'
      },
      labels: labels,
      form_config: {
        auto_save_enabled: true,
        auto_save_interval: 30000, // 30 seconds
        validation_on_blur: true,
        progress_tracking: true
      }
    });

  } catch (error) {
    console.error('❌ Error fetching survey questions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch survey questions',
      details: error.message
    });
  }
};

/**
 * Get question labels for dynamic surveys
 * Route: GET /api/survey/question-labels
 */
export const getQuestionLabels = async (req, res) => {
  try {
    console.log(`🔍 User ${req.user.username} fetching question labels`);

    const labels = await questionLabelsService.fetchQuestionLabels();

    res.json({
      success: true,
      labels: labels,
      label_count: Object.keys(labels).length,
      categories: categorizeLabels(labels),
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching question labels:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch question labels',
      details: error.message
    });
  }
};

// =============================================================================
// SURVEY STATUS & HISTORY CONTROLLERS
// =============================================================================

/**
 * Get survey status
 * Route: GET /api/survey/status
 * Route: GET /api/survey/check-status (enhanced status check)
 */
export const getSurveyStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { includeHistory = false } = req.query;

    console.log(`🔍 User ${req.user.username} checking survey status`);

    // Get comprehensive survey status
    const status = await surveyServices.checkUserSurveyStatus(userId);

    // Get history if requested
    let history = null;
    if (includeHistory === 'true') {
      history = await surveyServices.getUserSurveyHistory(userId);
    }

    // Determine next actions based on status
    const nextActions = determineNextActions(status);

    res.json({
      success: true,
      status: {
        user_id: userId,
        current_membership_stage: status.currentMembershipStage,
        current_member_status: status.currentMemberStatus,
        
        // Initial application status
        has_initial_application: status.hasInitialApplication,
        initial_application_status: status.initialApplicationStatus,
        
        // Full membership status
        has_full_membership_application: status.hasFullMembershipApplication,
        full_membership_status: status.fullMembershipStatus,
        
        // Survey completion
        survey_completed: status.survey_completed,
        needs_survey: status.needs_survey,
        
        // User details
        user_details: status.user_details
      },
      next_actions: nextActions,
      history: history,
      recommendations: generateRecommendations(status),
      checked_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error checking survey status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check survey status',
      details: error.message
    });
  }
};

/**
 * Get user's survey history
 * Route: GET /api/survey/history
 */
export const getSurveyHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(`🔍 User ${req.user.username} fetching survey history`);

    const history = await surveyServices.getUserSurveyHistory(userId);

    // Format history with additional context
    const formattedHistory = history.map(entry => ({
      id: entry.id,
      application_type: entry.application_type,
      status: entry.approval_status,
      submitted_at: entry.createdAt,
      reviewed_at: entry.reviewedAt,
      admin_notes: entry.admin_notes,
      application_ticket: entry.application_ticket,
      processing_days: entry.reviewedAt ? 
        Math.floor((new Date(entry.reviewedAt) - new Date(entry.createdAt)) / (1000 * 60 * 60 * 24)) : 
        Math.floor((new Date() - new Date(entry.createdAt)) / (1000 * 60 * 60 * 24)),
      is_current: entry.approval_status === 'pending'
    }));

    // Group by application type
    const groupedHistory = {
      initial_applications: formattedHistory.filter(h => h.application_type === 'initial_application'),
      full_membership_applications: formattedHistory.filter(h => h.application_type === 'full_membership'),
      other_applications: formattedHistory.filter(h => !['initial_application', 'full_membership'].includes(h.application_type))
    };

    res.json({
      success: true,
      history: formattedHistory,
      grouped_history: groupedHistory,
      summary: {
        total_applications: formattedHistory.length,
        pending_applications: formattedHistory.filter(h => h.status === 'pending').length,
        approved_applications: formattedHistory.filter(h => h.status === 'approved').length,
        declined_applications: formattedHistory.filter(h => h.status === 'declined').length,
        average_processing_days: formattedHistory
          .filter(h => h.reviewed_at)
          .reduce((sum, h) => sum + h.processing_days, 0) / 
          Math.max(1, formattedHistory.filter(h => h.reviewed_at).length)
      }
    });

  } catch (error) {
    console.error('❌ Error fetching survey history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch survey history',
      details: error.message
    });
  }
};

// =============================================================================
// SURVEY RESPONSE MANAGEMENT CONTROLLERS
// =============================================================================

/**
 * Update survey response
 * Route: PUT /api/survey/response/update
 */
export const updateSurveyResponse = async (req, res) => {
  try {
    const { surveyId, answers } = req.body;
    const userId = req.user.id;

    console.log(`🔍 User ${req.user.username} updating survey response ${surveyId}`);

    if (!surveyId || !answers) {
      return res.status(400).json({
        success: false,
        error: 'Survey ID and answers are required'
      });
    }

    // Verify survey belongs to user and is editable
    const [surveyCheck] = await db.query(`
      SELECT id, approval_status, application_type 
      FROM surveylog 
      WHERE id = ? AND CAST(user_id AS UNSIGNED) = ? AND approval_status = 'pending'
    `, [surveyId, userId]);

    if (!surveyCheck.length) {
      return res.status(404).json({
        success: false,
        error: 'Survey not found or cannot be updated',
        details: 'Only pending surveys can be updated'
      });
    }

    const result = await surveyServices.updateUserSurveyResponse(surveyId, userId, answers);

    res.json({
      success: true,
      message: 'Survey response updated successfully',
      survey: {
        id: surveyId,
        application_type: surveyCheck[0].application_type,
        status: 'pending',
        updatedAt: new Date().toISOString()
      },
      answer_count: Array.isArray(answers) ? answers.length : Object.keys(answers).length
    });

  } catch (error) {
    console.error('❌ Error updating survey response:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update survey response',
      details: error.message
    });
  }
};

/**
 * Delete survey response
 * Route: DELETE /api/survey/response
 */
export const deleteSurveyResponse = async (req, res) => {
  try {
    const { surveyId } = req.body;
    const userId = req.user.id;

    console.log(`🔍 User ${req.user.username} deleting survey response ${surveyId}`);

    if (!surveyId) {
      return res.status(400).json({
        success: false,
        error: 'Survey ID is required'
      });
    }

    const result = await surveyServices.deleteUserSurveyResponse(surveyId, userId);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Survey not found or cannot be deleted'
      });
    }

    res.json({
      success: true,
      message: 'Survey response deleted successfully',
      survey_id: surveyId,
      deleted_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error deleting survey response:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete survey response',
      details: error.message
    });
  }
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate answer completeness percentage
 */
const calculateAnswerCompleteness = (answers) => {
  if (!answers) return 0;
  
  const totalFields = 15; // Expected number of form fields
  const completedFields = Object.values(answers).filter(value => 
    value !== null && value !== undefined && value !== ''
  ).length;
  
  return Math.round((completedFields / totalFields) * 100);
};

/**
 * Group drafts by application type
 */
const groupDraftsByType = (drafts) => {
  const grouped = {};
  drafts.forEach(draft => {
    const type = draft.application_type;
    if (!grouped[type]) grouped[type] = 0;
    grouped[type]++;
  });
  return grouped;
};

/**
 * Build structured questions based on application type
 */
const buildStructuredQuestions = (applicationType, questions, labels) => {
  const baseQuestions = [
    {
      id: 'fullName',
      label: labels.fullName || 'Full Name',
      type: 'text',
      required: true,
      category: 'personal',
      validation: { minLength: 2, maxLength: 100 }
    },
    {
      id: 'email',
      label: 'Email Address',
      type: 'email',
      required: true,
      category: 'personal',
      validation: { pattern: 'email' }
    },
    {
      id: 'phoneNumber',
      label: labels.phoneNumber || 'Phone Number',
      type: 'tel',
      required: false,
      category: 'personal'
    },
    {
      id: 'currentLocation',
      label: labels.currentLocation || 'Current Location',
      type: 'text',
      required: true,
      category: 'personal'
    },
    {
      id: 'highestEducation',
      label: labels.highestEducation || 'Highest Level of Education',
      type: 'select',
      required: true,
      category: 'education',
      options: [
        'High School',
        'Associate Degree',
        'Bachelor\'s Degree',
        'Master\'s Degree',
        'Doctoral Degree',
        'Professional Certification',
        'Other'
      ]
    },
    {
      id: 'currentOccupation',
      label: labels.currentOccupation || 'Current Occupation',
      type: 'text',
      required: true,
      category: 'professional'
    },
    {
      id: 'howDidYouHear',
      label: labels.howDidYouHear || 'How did you hear about Ikoota?',
      type: 'select',
      required: true,
      category: 'interest',
      options: [
        'Social Media',
        'Friend/Colleague Referral',
        'Google Search',
        'Professional Network',
        'Educational Institution',
        'Online Community',
        'Other'
      ]
    },
    {
      id: 'reasonForJoining',
      label: labels.reasonForJoining || 'Why do you want to join Ikoota?',
      type: 'textarea',
      required: true,
      category: 'interest',
      validation: { minLength: 50, maxLength: 1000 }
    },
    {
      id: 'expectedContributions',
      label: labels.expectedContributions || 'How do you plan to contribute to the community?',
      type: 'textarea',
      required: true,
      category: 'interest',
      validation: { minLength: 50, maxLength: 1000 }
    },
    {
      id: 'educationalGoals',
      label: labels.educationalGoals || 'What are your educational goals?',
      type: 'textarea',
      required: false,
      category: 'goals',
      validation: { maxLength: 1000 }
    },
    {
      id: 'specialSkills',
      label: labels.specialSkills || 'Special Skills',
      type: 'textarea',
      required: false,
      category: 'professional',
      validation: { maxLength: 500 }
    },
    {
      id: 'languagesSpoken',
      label: labels.languagesSpoken || 'Languages Spoken',
      type: 'text',
      required: false,
      category: 'personal'
    },
    {
      id: 'agreeToTerms',
      label: labels.agreeToTerms || 'I agree to the Terms and Conditions',
      type: 'checkbox',
      required: true,
      category: 'agreements'
    },
    {
      id: 'agreeToCodeOfConduct',
      label: labels.agreeToCodeOfConduct || 'I agree to follow the Community Code of Conduct',
      type: 'checkbox',
      required: true,
      category: 'agreements'
    }
  ];

  // Add additional questions for full membership
  if (applicationType === 'full_membership') {
    baseQuestions.push(
      {
        id: 'preMemberExperience',
        label: 'Describe your experience as a pre-member',
        type: 'textarea',
        required: true,
        category: 'membership',
        validation: { minLength: 100, maxLength: 1000 }
      },
      {
        id: 'fullMembershipGoals',
        label: 'What do you hope to achieve as a full member?',
        type: 'textarea',
        required: true,
        category: 'membership',
        validation: { minLength: 50, maxLength: 1000 }
      },
      {
        id: 'communityContribution',
        label: 'How will you contribute to the full member community?',
        type: 'textarea',
        required: true,
        category: 'membership',
        validation: { minLength: 50, maxLength: 1000 }
      }
    );
  }

  return baseQuestions;
};

/**
 * Categorize labels by type
 */
const categorizeLabels = (labels) => {
  const categories = {
    personal: [],
    education: [],
    professional: [],
    interest: [],
    goals: [],
    agreements: [],
    membership: []
  };

  const categoryMap = {
    fullName: 'personal',
    dateOfBirth: 'personal',
    nationality: 'personal',
    currentLocation: 'personal',
    phoneNumber: 'personal',
    languagesSpoken: 'personal',
    
    highestEducation: 'education',
    fieldOfStudy: 'education',
    currentInstitution: 'education',
    graduationYear: 'education',
    educationalGoals: 'education',
    
    currentOccupation: 'professional',
    workExperience: 'professional',
    professionalSkills: 'professional',
    careerGoals: 'professional',
    specialSkills: 'professional',
    
    howDidYouHear: 'interest',
    reasonForJoining: 'interest',
    expectedContributions: 'interest',
    previousMemberships: 'interest',
    
    agreeToTerms: 'agreements',
    agreeToCodeOfConduct: 'agreements',
    agreeToDataProcessing: 'agreements'
  };

  Object.entries(labels).forEach(([key, label]) => {
    const category = categoryMap[key] || 'other';
    if (categories[category]) {
      categories[category].push({ key, label });
    }
  });

  return categories;
};

/**
 * Determine next actions based on survey status
 */
const determineNextActions = (status) => {
  const actions = [];

  if (!status.hasInitialApplication) {
    actions.push({
      action: 'submit_initial_application',
      title: 'Submit Initial Application',
      description: 'Complete your membership application to begin the review process',
      priority: 'high',
      url: '/apply/initial'
    });
  } else if (status.initialApplicationStatus === 'pending') {
    actions.push({
      action: 'wait_for_review',
      title: 'Application Under Review',
      description: 'Your application is being reviewed by our team',
      priority: 'medium',
      estimated_time: '3-5 business days'
    });
  } else if (status.currentMembershipStage === 'pre_member' && !status.hasFullMembershipApplication) {
    actions.push({
      action: 'apply_full_membership',
      title: 'Apply for Full Membership',
      description: 'You\'re eligible to apply for full membership benefits',
      priority: 'high',
      url: '/apply/full-membership'
    });
  } else if (status.fullMembershipStatus === 'pending') {
    actions.push({
      action: 'full_membership_review',
      title: 'Full Membership Under Review',
      description: 'Your full membership application is being reviewed',
      priority: 'medium',
      estimated_time: '5-7 business days'
    });
  }

  if (status.currentMembershipStage === 'member') {
    actions.push({
      action: 'explore_member_benefits',
      title: 'Explore Member Benefits',
      description: 'Access your full member dashboard and exclusive content',
      priority: 'low',
      url: '/member/dashboard'
    });
  }

  return actions;
};

/**
 * Generate recommendations based on status
 */
const generateRecommendations = (status) => {
  const recommendations = [];

  if (status.needs_survey) {
    recommendations.push({
      type: 'action_required',
      title: 'Complete Your Application',
      message: 'Finish your membership application to proceed with the review process'
    });
  }

  if (status.currentMembershipStage === 'applicant' && status.initialApplicationStatus === 'declined') {
    recommendations.push({
      type: 'reapplication',
      title: 'Consider Reapplying',
      message: 'Review the feedback and consider submitting a new application addressing the concerns'
    });
  }

  if (status.currentMembershipStage === 'pre_member') {
    recommendations.push({
      type: 'next_step',
      title: 'Full Membership Available',
      message: 'You can now apply for full membership to access additional benefits'
    });
  }

  return recommendations;
};

// =============================================================================
// EXPORT CONTROLLER FUNCTIONS
// =============================================================================

export default {
  // Survey Submission
  submitSurvey,
  
  // Draft Management
  saveSurveyDraft,
  getSurveyDrafts,
  deleteSurveyDraftController,
  
  // Questions & Labels
  getSurveyQuestions,
  getQuestionLabels,
  
  // Status & History
  getSurveyStatus,
  getSurveyHistory,
  
  // Response Management
  updateSurveyResponse,
  deleteSurveyResponse
};

// Named exports for specific functions
export {
  submitSurvey,
  saveSurveyDraft,
  getSurveyDrafts,
  deleteSurveyDraftController,
  getSurveyQuestions,
  getQuestionLabels,
  getSurveyStatus,
  getSurveyHistory,
  updateSurveyResponse,
  deleteSurveyResponse
};