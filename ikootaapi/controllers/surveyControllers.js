// ikootaapi/controllers/surveyControllers.js
// SURVEY CONTROLLERS - User survey operations
// Handles survey submissions, questions, status checks, and responses

import {
  submitInitialApplicationService,
  submitFullMembershipApplicationService,
  fetchSurveyQuestions,
  checkUserSurveyStatus,
  getUserSurveyHistory,
  updateUserSurveyResponse,
  deleteUserSurveyResponse,
  saveDraftSurvey,
  getUserSurveyDrafts,
  deleteSurveyDraft
} from '../services/surveyServices.js';
import {
  fetchQuestionLabels,
  initializeDefaultLabels
} from '../services/questionLabelsService.js';
import { generateToken } from '../utils/jwt.js';
import logger from '../utils/logger.js';
import db from '../config/db.js';

// ===============================================
// SURVEY SUBMISSION CONTROLLERS
// ===============================================

/**
 * Submit initial application survey
 * POST /api/survey/submit, /api/survey/application/submit, /api/survey/submit_applicationsurvey
 */
export const submitSurvey = async (req, res, next) => {
  try {
    console.log('🔍 submitSurvey controller called');
    console.log('🔍 User:', req.user?.id, req.user?.email);
    console.log('🔍 Request body keys:', Object.keys(req.body));
    
    const { 
      answers, 
      applicationTicket, 
      username, 
      userId,
      applicationType = 'initial_application' 
    } = req.body;
    
    // Validate required fields
    if (!answers) {
      return res.status(400).json({
        success: false,
        error: 'Survey answers are required'
      });
    }
    
    // Get user info from token or request body
    const userEmail = req.user?.email || req.body.email;
    const userIdToUse = req.user?.id || userId;
    const usernameToUse = req.user?.username || username;
    
    if (!userEmail || !userIdToUse) {
      return res.status(400).json({
        success: false,
        error: 'User identification required'
      });
    }
    
    // Process answers based on format
    let processedAnswers;
    if (Array.isArray(answers)) {
      // Already in correct format
      processedAnswers = answers;
    } else if (typeof answers === 'object') {
      // Convert object to array format
      processedAnswers = Object.entries(answers).map(([question, answer]) => ({
        question,
        answer: Array.isArray(answer) ? answer.join(', ') : answer.toString()
      }));
    } else {
      processedAnswers = answers;
    }
    
    // Generate application ticket if not provided
    const ticket = applicationTicket || generateApplicationTicket(usernameToUse);
    
    // Submit the survey based on type
    let result;
    if (applicationType === 'full_membership') {
      result = await submitFullMembershipApplicationService({
        answers: processedAnswers,
        membershipTicket: ticket,
        userId: userIdToUse,
        userEmail,
        username: usernameToUse
      });
    } else {
      result = await submitInitialApplicationService({
        answers: processedAnswers,
        applicationTicket: ticket,
        userId: userIdToUse,
        userEmail,
        username: usernameToUse
      });
    }
    
    // Generate new token with updated status
    const userData = { 
      userId: userIdToUse, 
      email: userEmail, 
      is_member: 'pending',
      application_status: 'submitted'
    };
    const token = generateToken(userData);
    
    // Set cookie if needed
    res.cookie('access_token', token, { 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    console.log('✅ Survey submitted successfully');
    
    res.status(200).json({
      success: true,
      message: 'Survey submitted successfully',
      applicationTicket: ticket,
      redirect: "/pending-verification",
      token: process.env.NODE_ENV === 'development' ? token : undefined
    });
    
  } catch (error) {
    console.error('❌ Error in submitSurvey controller:', error);
    logger.error('Survey submission error:', error);
    next(error);
  }
};

// ===============================================
// SURVEY DRAFT CONTROLLERS (NEW)
// ===============================================

/**
 * Save survey draft
 * POST /survey/draft/save
 */
export const saveSurveyDraft = async (req, res, next) => {
  try {
    console.log('🔍 saveSurveyDraft controller called');
    console.log('🔍 User:', req.user?.id, req.user?.username, req.user?.role);
    console.log('🔍 Request body keys:', Object.keys(req.body));
    
    const { 
      answers, 
      draftId = null,
      applicationType = 'initial_application',
      adminNotes = null,
      targetUserId = null // For admin use
    } = req.body;
    
    // Validate required fields
    if (!answers) {
      return res.status(400).json({
        success: false,
        error: 'Survey answers are required'
      });
    }
    
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    // Determine if this is an admin operation
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
    const userId = targetUserId && isAdmin ? targetUserId : req.user.id;
    const adminId = isAdmin && targetUserId ? req.user.id : null;
    
    // Admin validation
    if (targetUserId && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required to save drafts for other users'
      });
    }
    
    // Validate target user exists if admin is saving for someone else
    if (adminId && targetUserId) {
      const [userCheck] = await db.query(
        'SELECT id, username FROM users WHERE id = ?',
        [targetUserId]
      );
      
      if (userCheck.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Target user not found'
        });
      }
    }
    
    // Save the draft
    const result = await saveDraftSurvey({
      userId,
      answers,
      draftId,
      applicationType,
      adminId,
      adminNotes
    });
    
    console.log('✅ Survey draft saved successfully');
    
    res.status(200).json({
      success: true,
      message: 'Survey draft saved successfully',
      data: result,
      savedBy: adminId ? 'admin' : 'user',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error in saveSurveyDraft controller:', error);
    next(error);
  }
};

/**
 * Get user's survey drafts
 * GET /survey/drafts
 */
export const getSurveyDrafts = async (req, res, next) => {
  try {
    console.log('🔍 getSurveyDrafts controller called');
    console.log('🔍 User:', req.user?.id, req.user?.username);
    
    const { applicationType, targetUserId } = req.query;
    
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    // Determine if this is an admin operation
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
    const userId = targetUserId && isAdmin ? parseInt(targetUserId) : req.user.id;
    
    // Admin validation
    if (targetUserId && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required to view drafts for other users'
      });
    }
    
    const drafts = await getUserSurveyDrafts(userId, applicationType);
    
    console.log(`✅ Retrieved ${drafts.length} survey drafts`);
    
    res.status(200).json({
      success: true,
      data: drafts,
      count: drafts.length,
      userId: userId,
      applicationType: applicationType || 'all',
      requestedBy: isAdmin && targetUserId ? 'admin' : 'user',
      message: 'Survey drafts retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Error in getSurveyDrafts controller:', error);
    next(error);
  }
};

/**
 * Delete survey draft
 * DELETE /survey/draft/:draftId
 */
export const deleteSurveyDraftController = async (req, res, next) => {
  try {
    console.log('🔍 deleteSurveyDraft controller called');
    
    const { draftId } = req.params;
    const { targetUserId } = req.body;
    
    if (!draftId) {
      return res.status(400).json({
        success: false,
        error: 'Draft ID is required'
      });
    }
    
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    // Determine if this is an admin operation
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
    const userId = targetUserId && isAdmin ? targetUserId : req.user.id;
    const adminId = isAdmin && targetUserId ? req.user.id : null;
    
    // Admin validation
    if (targetUserId && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required to delete drafts for other users'
      });
    }
    
    const result = await deleteSurveyDraft(draftId, userId, adminId);
    
    console.log('✅ Survey draft deleted successfully');
    
    res.status(200).json({
      success: true,
      message: 'Survey draft deleted successfully',
      draftId: parseInt(draftId),
      deletedBy: adminId ? 'admin' : 'user',
      ...result
    });
    
  } catch (error) {
    console.error('❌ Error in deleteSurveyDraft controller:', error);
    next(error);
  }
};

// ===============================================
// SURVEY QUESTIONS & LABELS
// ===============================================

/**
 * Get survey questions
 * GET /api/survey/questions
 */
export const getSurveyQuestions = async (req, res) => {
  try {
    console.log('🔍 getSurveyQuestions controller called');
    
    const questions = await fetchSurveyQuestions();
    
    res.status(200).json({
      success: true,
      data: questions,
      count: questions.length,
      message: 'Survey questions fetched successfully'
    });
    
  } catch (error) {
    console.error('❌ Error in getSurveyQuestions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch survey questions'
    });
  }
};

/**
 * Get question labels for dynamic forms
 * GET /api/survey/question-labels
 */
export const getQuestionLabels = async (req, res) => {
  try {
    console.log('🔍 getQuestionLabels controller called');
    
    // Initialize defaults if needed (first run)
    await initializeDefaultLabels();
    
    const labels = await fetchQuestionLabels();
    
    console.log('✅ Question labels fetched:', Object.keys(labels).length, 'labels');
    
    res.status(200).json({
      success: true,
      data: labels,
      count: Object.keys(labels).length,
      message: 'Question labels fetched successfully'
    });
    
  } catch (error) {
    console.error('❌ Error in getQuestionLabels:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch question labels'
    });
  }
};

// ===============================================
// SURVEY STATUS & HISTORY
// ===============================================

/**
 * Check user's survey status
 * GET /api/survey/status, /api/survey/check-status
 */
export const getSurveyStatus = async (req, res) => {
  try {
    console.log('🔍 getSurveyStatus controller called');
    console.log('🔍 User:', req.user?.id, req.user?.username);
    
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    const status = await checkUserSurveyStatus(req.user.id);
    
    console.log('✅ Survey status retrieved:', status);
    
    res.status(200).json({
      success: true,
      ...status,
      message: 'Survey status retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Error in getSurveyStatus:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check survey status'
    });
  }
};

/**
 * Get user's survey history
 * GET /api/survey/history
 */
export const getSurveyHistory = async (req, res) => {
  try {
    console.log('🔍 getSurveyHistory controller called');
    console.log('🔍 User:', req.user?.id);
    
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    const history = await getUserSurveyHistory(req.user.id);
    
    res.status(200).json({
      success: true,
      data: history,
      count: history.length,
      message: 'Survey history retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Error in getSurveyHistory:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch survey history'
    });
  }
};

// ===============================================
// SURVEY RESPONSE MANAGEMENT
// ===============================================

/**
 * Update survey response
 * PUT /api/survey/response/update
 */
export const updateSurveyResponse = async (req, res) => {
  try {
    console.log('🔍 updateSurveyResponse controller called');
    
    const { surveyId, answers } = req.body;
    
    if (!surveyId || !answers) {
      return res.status(400).json({
        success: false,
        error: 'Survey ID and answers are required'
      });
    }
    
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    const result = await updateUserSurveyResponse(
      surveyId,
      req.user.id,
      answers
    );
    
    res.status(200).json({
      success: true,
      message: 'Survey response updated successfully',
      ...result
    });
    
  } catch (error) {
    console.error('❌ Error in updateSurveyResponse:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update survey response'
    });
  }
};

/**
 * Delete survey response
 * DELETE /api/survey/response
 */
export const deleteSurveyResponse = async (req, res) => {
  try {
    console.log('🔍 deleteSurveyResponse controller called');
    
    const { surveyId } = req.body;
    
    if (!surveyId) {
      return res.status(400).json({
        success: false,
        error: 'Survey ID is required'
      });
    }
    
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    const result = await deleteUserSurveyResponse(surveyId, req.user.id);
    
    res.status(200).json({
      success: true,
      message: 'Survey response deleted successfully',
      ...result
    });
    
  } catch (error) {
    console.error('❌ Error in deleteSurveyResponse:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete survey response'
    });
  }
};

// ===============================================
// HELPER FUNCTIONS
// ===============================================

/**
 * Generate application ticket
 */
function generateApplicationTicket(username = 'USER') {
  const prefix = username ? username.substring(0, 3).toUpperCase() : 'USR';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `APP-${prefix}-${timestamp}${random}`;
}

export default {
  submitSurvey,
  getSurveyQuestions,
  getQuestionLabels,
  getSurveyStatus,
  getSurveyHistory,
  updateSurveyResponse,
  deleteSurveyResponse,
  // New draft functions
  saveSurveyDraft,
  getSurveyDrafts,
  deleteSurveyDraft: deleteSurveyDraftController
};