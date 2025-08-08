// ikootaapi/controllers/surveyAdminControllers.js
// SURVEY ADMIN CONTROLLERS - Admin survey management
// Handles survey approval, logs, analytics, and question management

import {
  fetchAllSurveyLogs,
  approveSurveySubmission,
  bulkApproveSurveySubmissions,
  getSurveyAnalyticsData,
  exportSurveyDataToCSV,
  deleteSurveyLogById,
  getSurveyDetailsById
} from '../services/surveyServices.js';
import {
  updateQuestionLabels as updateLabelsService
} from '../services/questionLabelsService.js';
import logger from '../utils/logger.js';

// ===============================================
// SURVEY LOGS & DETAILS
// ===============================================

/**
 * Get all survey logs with user information
 * Enhanced for compatibility with membership admin panels
 * GET /api/admin/survey/logs
 */
export const getSurveyLogs = async (req, res) => {
  try {
    console.log('🔍 getSurveyLogs admin controller called');
    console.log('🔍 Admin:', req.user?.id, req.user?.role);
    
    // Optional filters from query params (compatible with membership admin)
    const { 
      status, 
      applicationType = 'initial_application', 
      stage,
      startDate, 
      endDate,
      page = 1,
      limit = 50,
      search = ''
    } = req.query;
    
    const filters = {
      ...(status && { approval_status: status }),
      ...(applicationType && { application_type: applicationType }),
      ...(stage && { membership_stage: stage }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      ...(search && { search })
    };
    
    const logs = await fetchAllSurveyLogs(filters, { page, limit });
    
    // Transform data for compatibility with membership admin controllers
    const transformedData = logs.data.map(log => ({
      ...log,
      // Ensure compatibility with membership admin frontend
      user_id: log.user_id,
      username: log.username,
      email: log.user_email || log.email,
      ticket: log.application_ticket,
      submittedAt: log.createdAt,
      status: log.approval_status,
      stage: log.membership_stage,
      is_member: log.is_member,
      mentor_assigned: log.mentor_assigned,
      class_assigned: log.class_assigned,
      converse_id_generated: log.converse_id_generated
    }));
    
    console.log(`✅ Retrieved ${transformedData.length} survey logs`);
    
    res.status(200).json({
      success: true,
      data: transformedData,
      applications: transformedData, // Alias for membership admin compatibility
      count: logs.count,
      total: logs.count, // Alias for compatibility
      page: logs.page,
      totalPages: logs.totalPages,
      pagination: {
        page: logs.page,
        limit: parseInt(limit),
        total: logs.count,
        totalPages: logs.totalPages
      },
      filters: { status, applicationType, stage, search },
      reviewer: req.user.username,
      reviewerRole: req.user.role,
      message: 'Survey logs fetched successfully'
    });
    
  } catch (error) {
    console.error('❌ Error in getSurveyLogs:', error);
    logger.error('Admin survey logs error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch survey logs'
    });
  }
};

/**
 * Get specific survey details
 * GET /api/admin/survey/logs/:id
 */
export const getSurveyDetails = async (req, res) => {
  try {
    console.log('🔍 getSurveyDetails admin controller called');
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Survey ID is required'
      });
    }
    
    const surveyDetails = await getSurveyDetailsById(id);
    
    if (!surveyDetails) {
      return res.status(404).json({
        success: false,
        error: 'Survey not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: surveyDetails,
      message: 'Survey details fetched successfully'
    });
    
  } catch (error) {
    console.error('❌ Error in getSurveyDetails:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch survey details'
    });
  }
};

// ===============================================
// SURVEY APPROVAL
// ===============================================

/**
 * Approve or reject a survey with mentor and class assignment
 * Enhanced to work with membershipAdminControllers
 * PUT /api/admin/survey/approve
 */
export const approveSurvey = async (req, res) => {
  try {
    console.log('🔍 approveSurvey admin controller called');
    console.log('🔍 Request body:', req.body);
    console.log('🔍 Admin:', req.user?.id, req.user?.role);
    
    const { 
      surveyId, 
      userId, 
      status, 
      adminNotes,
      mentorId,
      classId,
      converseId 
    } = req.body;
    
    // Validate required fields
    if (!surveyId || !userId || !status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'surveyId, userId, and status are required'
      });
    }
    
    // Validate status values (compatible with membership controllers)
    const validStatuses = ['approved', 'declined', 'granted', 'rejected', 'pending'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    // Generate converse ID if approving and not provided
    let finalConverseId = converseId;
    if ((status === 'approved' || status === 'granted') && !converseId) {
      try {
        // This would call your generateUniqueConverseId function
        finalConverseId = `CVS${Date.now().toString(36).toUpperCase()}`;
      } catch (err) {
        console.warn('Could not generate converse ID:', err);
      }
    }
    
    const result = await approveSurveySubmission({
      surveyId,
      userId,
      status,
      adminNotes,
      reviewedBy: req.user.id,
      reviewerName: req.user.username,
      mentorId: mentorId || null,
      classId: classId || null,
      converseId: finalConverseId
    });
    
    console.log('✅ Survey approval processed:', result);
    
    // Log admin action
    logger.info('Admin survey approval:', {
      adminId: req.user.id,
      surveyId,
      userId,
      status,
      mentorId,
      classId,
      converseId: finalConverseId,
      timestamp: new Date().toISOString()
    });
    
    res.status(200).json({
      success: true,
      message: `Survey ${status} successfully`,
      data: {
        surveyId,
        userId,
        status,
        membershipStage: result.membershipStage,
        converseId: finalConverseId,
        mentorAssigned: mentorId,
        classAssigned: classId,
        reviewedBy: req.user.username,
        reviewedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error in approveSurvey:', error);
    logger.error('Survey approval error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update survey status'
    });
  }
};

/**
 * Bulk approve surveys
 * POST /api/admin/survey/bulk-approve
 */
export const bulkApproveSurveys = async (req, res) => {
  try {
    console.log('🔍 bulkApproveSurveys admin controller called');
    
    const { surveyIds, status, adminNotes } = req.body;
    
    if (!surveyIds || !Array.isArray(surveyIds) || surveyIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Survey IDs array is required'
      });
    }
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }
    
    const result = await bulkApproveSurveySubmissions({
      surveyIds,
      status,
      adminNotes,
      reviewedBy: req.user.id,
      reviewerName: req.user.username
    });
    
    logger.info('Admin bulk survey approval:', {
      adminId: req.user.id,
      count: surveyIds.length,
      status,
      timestamp: new Date().toISOString()
    });
    
    res.status(200).json({
      success: true,
      message: `${result.processed} surveys ${status} successfully`,
      ...result
    });
    
  } catch (error) {
    console.error('❌ Error in bulkApproveSurveys:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to bulk approve surveys'
    });
  }
};

// ===============================================
// QUESTION MANAGEMENT
// ===============================================

/**
 * Update question labels
 * PUT /api/admin/survey/question-labels
 */
export const updateQuestionLabels = async (req, res) => {
  try {
    console.log('🔍 updateQuestionLabels admin controller called');
    console.log('🔍 Admin:', req.user?.id, req.user?.role);
    
    const { labels } = req.body;
    
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
    
    await updateLabelsService(labels);
    
    logger.info('Admin updated question labels:', {
      adminId: req.user.id,
      labelCount,
      timestamp: new Date().toISOString()
    });
    
    res.status(200).json({
      success: true,
      message: 'Question labels updated successfully',
      labelsUpdated: labelCount
    });
    
  } catch (error) {
    console.error('❌ Error in updateQuestionLabels:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update question labels'
    });
  }
};

// ===============================================
// ANALYTICS & REPORTING
// ===============================================

/**
 * Get survey analytics
 * GET /api/admin/survey/analytics
 */
export const getSurveyAnalytics = async (req, res) => {
  try {
    console.log('🔍 getSurveyAnalytics admin controller called');
    
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    const analytics = await getSurveyAnalyticsData({
      startDate,
      endDate,
      groupBy
    });
    
    res.status(200).json({
      success: true,
      data: analytics,
      message: 'Survey analytics fetched successfully'
    });
    
  } catch (error) {
    console.error('❌ Error in getSurveyAnalytics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch survey analytics'
    });
  }
};

/**
 * Export survey data
 * GET /api/admin/survey/export
 */
export const exportSurveyData = async (req, res) => {
  try {
    console.log('🔍 exportSurveyData admin controller called');
    
    const { format = 'csv', status, startDate, endDate } = req.query;
    
    const filters = {
      ...(status && { approval_status: status }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate })
    };
    
    const exportData = await exportSurveyDataToCSV(filters);
    
    // Set appropriate headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="survey-export-${Date.now()}.csv"`);
    
    res.status(200).send(exportData);
    
  } catch (error) {
    console.error('❌ Error in exportSurveyData:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export survey data'
    });
  }
};

// ===============================================
// SURVEY MANAGEMENT
// ===============================================

/**
 * Delete a survey log
 * DELETE /api/admin/survey/logs/:id
 */
export const deleteSurveyLog = async (req, res) => {
  try {
    console.log('🔍 deleteSurveyLog admin controller called');
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Survey ID is required'
      });
    }
    
    const result = await deleteSurveyLogById(id);
    
    logger.info('Admin deleted survey log:', {
      adminId: req.user.id,
      surveyId: id,
      timestamp: new Date().toISOString()
    });
    
    res.status(200).json({
      success: true,
      message: 'Survey log deleted successfully',
      ...result
    });
    
  } catch (error) {
    console.error('❌ Error in deleteSurveyLog:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete survey log'
    });
  }
};

export default {
  getSurveyLogs,
  getSurveyDetails,
  approveSurvey,
  bulkApproveSurveys,
  updateQuestionLabels,
  getSurveyAnalytics,
  exportSurveyData,
  deleteSurveyLog
};