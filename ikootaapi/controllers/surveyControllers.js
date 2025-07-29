// ikootaapi/controllers/surveyControllers.js - UPDATED WITH QUESTION LABELS
import { 
  submitSurveyService, 
  fetchSurveyQuestions, 
  modifySurveyQuestions, 
  fetchSurveyLogs, 
  approveUserSurvey 
} from '../services/surveyServices.js';
import { 
  fetchQuestionLabels, 
  updateQuestionLabels 
} from '../services/questionLabelsService.js';
import { generateToken } from '../utils/jwt.js';

export const submitSurvey = async (req, res, next) => {
  try {
    const email = req.user.email;
    await submitSurveyService(req.body, email);
    const userData = { userId: req.user.userId, email, is_member: 'pending' };
    const token = generateToken(userData);
    res.cookie('access_token', token, { httpOnly: true });
    res.status(200).json({ redirect: "/thankyou" });
  } catch (error) {
    console.error('Error in submitSurvey controller:', error);
    next(error);
  }
};

// ✅ NEW: Get question labels for dynamic survey form
export const getQuestionLabels = async (req, res) => {
  try {
    console.log('🔍 getQuestionLabels endpoint called');
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

// ✅ NEW: Update question labels from AuthControls
export const updateSurveyQuestionLabels = async (req, res) => {
  try {
    console.log('🔍 updateSurveyQuestionLabels endpoint called');
    console.log('🔍 User:', req.user?.id, req.user?.role);
    
    // Check admin privileges
    if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
      console.log('❌ Unauthorized access attempt to update question labels');
      return res.status(403).json({
        success: false,
        error: 'Admin privileges required to update question labels'
      });
    }
    
    const { labels } = req.body;
    
    // Validate input
    if (!labels || typeof labels !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Labels object is required',
        message: 'Please provide a labels object in the request body'
      });
    }
    
    const labelCount = Object.keys(labels).length;
    if (labelCount === 0) {
      return res.status(400).json({
        success: false,
        error: 'No labels provided',
        message: 'Please provide at least one question label'
      });
    }
    
    console.log(`🔍 Updating ${labelCount} question labels`);
    
    await updateQuestionLabels(labels);
    
    console.log('✅ Question labels updated successfully');
    
    res.status(200).json({ 
      success: true,
      message: 'Question labels updated successfully',
      labelsUpdated: labelCount
    });
    
  } catch (error) {
    console.error('❌ Error in updateSurveyQuestionLabels controller:', error);
    
    res.status(error.statusCode || 500).json({ 
      success: false,
      error: error.message || 'Failed to update question labels'
    });
  }
};

// Keep existing functions for backward compatibility
export const getSurveyQuestions = async (req, res) => {
  try {
    console.log('🔍 getSurveyQuestions endpoint called (legacy)');
    
    // Return question labels in old format for compatibility
    const labels = await fetchQuestionLabels();
    const questions = Object.values(labels);
    
    res.status(200).json(questions);
    
  } catch (error) {
    console.error('❌ Error in getSurveyQuestions:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch survey questions'
    });
  }
};

export const updateSurveyQuestions = async (req, res) => {
  try {
    console.log('🔍 updateSurveyQuestions endpoint called (legacy)');
    
    // This now updates question labels instead
    return updateSurveyQuestionLabels(req, res);
    
  } catch (error) {
    console.error('❌ Error in updateSurveyQuestions:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to update survey questions'
    });
  }
};

export const getSurveyLogs = async (req, res) => {
  try {
    console.log('🔍 getSurveyLogs endpoint called');
    console.log('🔍 User:', req.user?.id, req.user?.role);
        
    // Check if user has admin privileges
    if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
      console.log('❌ Unauthorized access attempt to survey logs');
      return res.status(403).json({
        success: false,
        error: 'Admin privileges required'
      });
    }
        
    console.log('🔍 Fetching survey logs...');
    const logs = await fetchSurveyLogs();
        
    console.log(`✅ Survey logs fetched successfully: ${logs.length} records`);
        
    res.status(200).json({
      success: true,
      data: logs,
      count: logs.length,
      message: 'Survey logs fetched successfully'
    });
      
  } catch (error) {
    console.error('❌ Error in getSurveyLogs:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to fetch survey logs'
    });
  }
};

export const approveSurvey = async (req, res) => {
  try {
    console.log('🔍 approveSurvey endpoint called');
    console.log('🔍 Request body:', req.body);
    console.log('🔍 User:', req.user?.id, req.user?.role);
    
    // Check if user has admin privileges
    if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
      console.log('❌ Unauthorized access attempt to approve survey');
      return res.status(403).json({
        success: false,
        error: 'Admin privileges required to approve surveys'
      });
    }
    
    const { surveyId, userId, status } = req.body;
    
    // Validate input
    if (!surveyId || !userId || !status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'surveyId, userId, and status are required'
      });
    }
    
    // Validate status
    const validStatuses = ['approved', 'declined', 'granted', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    const result = await approveUserSurvey(surveyId, userId, status);
    
    console.log('✅ Survey approval status updated successfully');
    
    res.status(200).json({ 
      success: true,
      message: `Survey ${status} successfully`
    });
    
  } catch (error) {
    console.error('❌ Error in approveSurvey controller:', error);
    res.status(error.statusCode || 500).json({ 
      success: false,
      error: error.message || 'Failed to update survey status'
    });
  }
};



