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
import db from '../config/db.js';
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
 * Reject survey (wrapper around approveSurvey with reject status)
 * PUT /api/admin/survey/reject
 */
export const rejectSurvey = async (req, res) => {
  try {
    console.log('🔍 rejectSurvey admin controller called');
    
    // Set status to rejected and call approveSurvey
    const requestWithRejectStatus = {
      ...req,
      body: {
        ...req.body,
        status: 'rejected'
      }
    };
    
    return approveSurvey(requestWithRejectStatus, res);
    
  } catch (error) {
    console.error('❌ Error in rejectSurvey:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to reject survey'
    });
  }
};

/**
 * Get pending surveys
 * GET /api/admin/survey/pending
 */
export const getPendingSurveys = async (req, res) => {
  try {
    console.log('🔍 getPendingSurveys admin controller called');
    
    const { page = 1, limit = 50 } = req.query;
    
    // Use existing fetchAllSurveyLogs with pending filter
    const filters = { approval_status: 'pending' };
    const logs = await fetchAllSurveyLogs(filters, { page, limit });
    
    res.status(200).json({
      success: true,
      data: logs.data,
      pending: logs.data, // Alias for compatibility
      count: logs.count,
      page: logs.page,
      totalPages: logs.totalPages,
      message: 'Pending surveys fetched successfully'
    });
    
  } catch (error) {
    console.error('❌ Error in getPendingSurveys:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch pending surveys'
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
 * Update survey questions
 * PUT /api/admin/survey/questions
 */
export const updateSurveyQuestions = async (req, res) => {
  try {
    console.log('🔍 updateSurveyQuestions admin controller called');
    console.log('🔍 Admin:', req.user?.id, req.user?.role);
    
    const { questions } = req.body;
    
    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({
        success: false,
        error: 'Questions array is required',
        message: 'Please provide an array of questions in the request body'
      });
    }
    
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Clear existing questions
      await connection.query('DELETE FROM survey_questions');
      
      // Insert new questions
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        await connection.query(
          `INSERT INTO survey_questions 
           (question, question_order, is_active, createdAt, updatedAt) 
           VALUES (?, ?, 1, NOW(), NOW())`,
          [question, i + 1]
        );
      }
      
      await connection.commit();
      
      logger.info('Admin updated survey questions:', {
        adminId: req.user.id,
        questionCount: questions.length,
        timestamp: new Date().toISOString()
      });
      
      res.status(200).json({
        success: true,
        message: 'Survey questions updated successfully',
        questionsUpdated: questions.length
      });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ Error in updateSurveyQuestions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update survey questions'
    });
  }
};

/**
 * Create new survey question
 * POST /api/admin/survey/questions
 */
export const createSurveyQuestion = async (req, res) => {
  try {
    console.log('🔍 createSurveyQuestion admin controller called');
    
    const { question, questionOrder, isActive = true } = req.body;
    
    if (!question || question.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Question text is required'
      });
    }
    
    // Get the next question order if not provided
    let order = questionOrder;
    if (!order) {
      const [maxOrder] = await db.query(
        'SELECT MAX(question_order) as max_order FROM survey_questions'
      );
      order = (maxOrder[0]?.max_order || 0) + 1;
    }
    
    const [result] = await db.query(
      `INSERT INTO survey_questions 
       (question, question_order, is_active, createdAt, updatedAt) 
       VALUES (?, ?, ?, NOW(), NOW())`,
      [question.trim(), order, isActive ? 1 : 0]
    );
    
    logger.info('Admin created survey question:', {
      adminId: req.user.id,
      questionId: result.insertId,
      question: question.trim(),
      timestamp: new Date().toISOString()
    });
    
    res.status(201).json({
      success: true,
      message: 'Survey question created successfully',
      data: {
        id: result.insertId,
        question: question.trim(),
        questionOrder: order,
        isActive
      }
    });
    
  } catch (error) {
    console.error('❌ Error in createSurveyQuestion:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create survey question'
    });
  }
};

/**
 * Delete survey question
 * DELETE /api/admin/survey/questions/:id
 */
export const deleteSurveyQuestion = async (req, res) => {
  try {
    console.log('🔍 deleteSurveyQuestion admin controller called');
    
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Question ID is required'
      });
    }
    
    const [result] = await db.query(
      'DELETE FROM survey_questions WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Survey question not found'
      });
    }
    
    logger.info('Admin deleted survey question:', {
      adminId: req.user.id,
      questionId: id,
      timestamp: new Date().toISOString()
    });
    
    res.status(200).json({
      success: true,
      message: 'Survey question deleted successfully',
      deletedId: id
    });
    
  } catch (error) {
    console.error('❌ Error in deleteSurveyQuestion:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete survey question'
    });
  }
};

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

/**
 * Update survey question labels (alias for compatibility)
 * PUT /api/admin/survey/question-labels
 */
export const updateSurveyQuestionLabels = async (req, res) => {
  // This is just an alias to the existing updateQuestionLabels function
  return updateQuestionLabels(req, res);
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
 * Get survey statistics
 * GET /api/admin/survey/stats
 */
export const getSurveyStats = async (req, res) => {
  try {
    console.log('🔍 getSurveyStats admin controller called');
    
    // Get basic survey statistics
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_surveys,
        COUNT(CASE WHEN approval_status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN approval_status = 'declined' THEN 1 END) as declined_count,
        COUNT(CASE WHEN approval_status = 'rejected' THEN 1 END) as rejected_count,
        COUNT(CASE WHEN application_type = 'initial_application' THEN 1 END) as initial_applications,
        COUNT(CASE WHEN application_type = 'full_membership' THEN 1 END) as full_memberships,
        COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as last_30_days,
        COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as last_7_days,
        COUNT(CASE WHEN createdAt >= CURDATE() THEN 1 END) as today
      FROM surveylog
    `);
    
    // Get daily submission trends for the last 30 days
    const [trends] = await db.query(`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as submissions,
        COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN approval_status = 'declined' THEN 1 END) as declined
      FROM surveylog 
      WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(createdAt)
      ORDER BY date DESC
    `);
    
    // Get approval rate
    const totalProcessed = (stats[0]?.approved_count || 0) + (stats[0]?.declined_count || 0) + (stats[0]?.rejected_count || 0);
    const approvalRate = totalProcessed > 0 ? 
      ((stats[0]?.approved_count || 0) / totalProcessed * 100).toFixed(2) : 0;
    
    res.status(200).json({
      success: true,
      data: {
        summary: {
          ...stats[0],
          approval_rate: `${approvalRate}%`,
          total_processed: totalProcessed
        },
        trends: trends.slice(0, 30), // Last 30 days
        performance: {
          pending_percentage: stats[0]?.total_surveys > 0 ? 
            ((stats[0]?.pending_count || 0) / stats[0].total_surveys * 100).toFixed(2) : 0,
          approval_rate: approvalRate,
          processing_efficiency: totalProcessed > 0 ? 
            (((stats[0]?.approved_count || 0) + (stats[0]?.declined_count || 0)) / totalProcessed * 100).toFixed(2) : 0
        }
      },
      message: 'Survey statistics fetched successfully'
    });
    
  } catch (error) {
    console.error('❌ Error in getSurveyStats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch survey statistics'
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

// ===============================================
// EXPORTS
// ===============================================

export default {
  // Survey logs & details
  getSurveyLogs,
  getSurveyDetails,
  
  // Survey approval
  approveSurvey,
  rejectSurvey,
  getPendingSurveys,
  bulkApproveSurveys,
  
  // Question management
  updateSurveyQuestions,
  createSurveyQuestion,
  deleteSurveyQuestion,
  updateQuestionLabels,
  updateSurveyQuestionLabels,
  
  // Analytics & reporting
  getSurveyAnalytics,
  getSurveyStats,
  exportSurveyData,
  
  // Survey management
  deleteSurveyLog
};


