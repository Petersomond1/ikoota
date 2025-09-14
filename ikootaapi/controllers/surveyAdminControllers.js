// ikootaapi/controllers/surveyAdminController.js
// ===============================================
// SURVEY ADMIN CONTROLLER - COMPLETE IMPLEMENTATION
// Maps to all 10+ admin survey routes from surveyAdminRoutes.js
// Handles question management, survey approval, analytics, and configuration
// Administrative control over survey system independent of membership admin
// ===============================================

import db from '../config/db.js';
import surveyServices from '../services/surveyServices.js';
import questionLabelsService from '../services/questionLabelsService.js';
import { sendEmail } from '../utils/email.js';
import { sendNotification } from '../utils/notifications.js';
import CustomError from '../utils/CustomError.js';

// =============================================================================
// QUESTION MANAGEMENT CONTROLLERS
// =============================================================================

/**
 * Get all survey questions
 * Route: GET /survey/admin/questions
 */
export const getSurveyQuestions = async (req, res) => {
  try {
    console.log('🔍 Survey admin fetching all questions');

    const [questions] = await db.query(`
      SELECT 
        id,
        question,
        question_type,
        question_order,
        is_required,
        validation_rules,
        category,
        is_active,
        createdAt,
        updatedAt
      FROM survey_questions 
      ORDER BY question_order ASC, id ASC
    `);

    // Get usage statistics for each question
    const [usageStats] = await db.query(`
      SELECT 
        sq.id as question_id,
        COUNT(DISTINCT sl.new_survey_id) as usage_count,
        COUNT(CASE WHEN sl.new_status = 'approved' THEN 1 END) as approved_responses,
        MAX(sl.createdAt) as last_used
      FROM survey_questions sq
      LEFT JOIN surveylog sl ON (
        sl.response_table_id IN (
          SELECT id FROM initial_membership_applications WHERE JSON_CONTAINS(answers, CONCAT('"', sq.question, '"'))
          UNION
          SELECT id FROM full_membership_applications WHERE JSON_CONTAINS(answers, CONCAT('"', sq.question, '"'))
          UNION
          SELECT id FROM survey_responses WHERE JSON_CONTAINS(answers, CONCAT('"', sq.question, '"'))
        )
      )
      GROUP BY sq.id
    `);

    // Merge usage stats with questions
    const questionsWithStats = questions.map(question => {
      const stats = usageStats.find(stat => stat.question_id === question.id) || {
        usage_count: 0,
        approved_responses: 0,
        last_used: null
      };
      
      return {
        ...question,
        usage_statistics: stats,
        effectiveness_rate: stats.usage_count > 0 ? 
          ((stats.approved_responses / stats.usage_count) * 100).toFixed(2) : 0
      };
    });

    res.json({
      success: true,
      questions: questionsWithStats,
      summary: {
        total_questions: questions.length,
        active_questions: questions.filter(q => q.is_active).length,
        required_questions: questions.filter(q => q.is_required).length,
        categories: [...new Set(questions.map(q => q.category).filter(Boolean))]
      },
      generatedAt: new Date().toISOString()
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
 * Create new survey question
 * Route: POST /survey/admin/questions
 */
export const createSurveyQuestion = async (req, res) => {
  try {
    const {
      question,
      question_type = 'text',
      question_order = null,
      is_required = false,
      validation_rules = null,
      category = 'general',
      options = null
    } = req.body;

    const adminId = req.user.id;

    console.log('🔍 Survey admin creating new question');

    if (!question || question.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: 'Question text is required and must be at least 5 characters'
      });
    }

    // Determine question order if not provided
    let finalOrder = question_order;
    if (!finalOrder) {
      const [maxOrder] = await db.query('SELECT MAX(question_order) as max_order FROM survey_questions');
      finalOrder = (maxOrder[0]?.max_order || 0) + 1;
    }

    // Insert new question
    const [result] = await db.query(`
      INSERT INTO survey_questions (
        question, question_type, question_order, is_required, 
        validation_rules, category, options, is_active, 
        created_by, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, NOW(), NOW())
    `, [
      question.trim(),
      question_type,
      finalOrder,
      is_required,
      validation_rules ? JSON.stringify(validation_rules) : null,
      category,
      options ? JSON.stringify(options) : null,
      adminId
    ]);

    // Log the action
    await db.query(`
      INSERT INTO audit_logs (user_id, action, details, createdAt)
      VALUES (?, 'survey_question_created', ?, NOW())
    `, [adminId, JSON.stringify({
      question_id: result.insertId,
      question: question.trim(),
      category: category,
      created_by: req.user.username
    })]);

    res.json({
      success: true,
      message: 'Survey question created successfully',
      question: {
        id: result.insertId,
        question: question.trim(),
        question_type: question_type,
        question_order: finalOrder,
        is_required: is_required,
        category: category,
        is_active: true
      },
      created_by: req.user.username,
      createdAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error creating survey question:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create survey question',
      details: error.message
    });
  }
};

/**
 * Update survey questions
 * Route: PUT /survey/admin/questions
 */
export const updateSurveyQuestions = async (req, res) => {
  try {
    const { questions } = req.body;
    const adminId = req.user.id;

    console.log('🔍 Survey admin updating questions');

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Questions array is required'
      });
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      const updateResults = [];

      for (const questionData of questions) {
        const { id, question, question_type, is_required, validation_rules, category, is_active } = questionData;

        if (!id) {
          throw new Error('Question ID is required for updates');
        }

        const [result] = await connection.query(`
          UPDATE survey_questions 
          SET question = ?, question_type = ?, is_required = ?, 
              validation_rules = ?, category = ?, is_active = ?, 
              updated_by = ?, updatedAt = NOW()
          WHERE id = ?
        `, [
          question,
          question_type || 'text',
          is_required || false,
          validation_rules ? JSON.stringify(validation_rules) : null,
          category || 'general',
          is_active !== false, // Default to true unless explicitly false
          adminId,
          id
        ]);

        updateResults.push({
          question_id: id,
          updated: result.affectedRows > 0,
          question: question
        });
      }

      // Log the bulk update
      await connection.query(`
        INSERT INTO audit_logs (user_id, action, details, createdAt)
        VALUES (?, 'survey_questions_bulk_updated', ?, NOW())
      `, [adminId, JSON.stringify({
        updated_count: updateResults.filter(r => r.updated).length,
        total_requested: questions.length,
        updated_by: req.user.username
      })]);

      await connection.commit();

      res.json({
        success: true,
        message: 'Survey questions updated successfully',
        results: updateResults,
        summary: {
          total_requested: questions.length,
          successfully_updated: updateResults.filter(r => r.updated).length,
          failed_updates: updateResults.filter(r => !r.updated).length
        },
        updated_by: req.user.username,
        updatedAt: new Date().toISOString()
      });

    } catch (updateError) {
      await connection.rollback();
      throw updateError;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('❌ Error updating survey questions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update survey questions',
      details: error.message
    });
  }
};

/**
 * Delete survey question
 * Route: DELETE /survey/admin/questions/:id
 */
export const deleteSurveyQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { soft_delete = true } = req.query;
    const adminId = req.user.id;

    console.log(`🔍 Survey admin deleting question ${id} (soft: ${soft_delete})`);

    // Check if question exists and get details
    const [questionCheck] = await db.query('SELECT * FROM survey_questions WHERE id = ?', [id]);

    if (!questionCheck.length) {
      return res.status(404).json({
        success: false,
        error: 'Survey question not found'
      });
    }

    const question = questionCheck[0];

    // Check if question is in use
    const [usageCheck] = await db.query(`
      SELECT COUNT(*) as usage_count 
      FROM (
        SELECT id FROM initial_membership_applications WHERE JSON_CONTAINS(answers, CONCAT('"', ?, '"'))
        UNION
        SELECT id FROM full_membership_applications WHERE JSON_CONTAINS(answers, CONCAT('"', ?, '"'))
        UNION
        SELECT id FROM survey_responses WHERE JSON_CONTAINS(answers, CONCAT('"', ?, '"'))
      ) as combined_responses
    `, [question.question, question.question, question.question]);

    const inUse = usageCheck[0].usage_count > 0;

    let result;
    let deletionType;

    if (soft_delete === 'true' || inUse) {
      // Soft delete - mark as inactive
      [result] = await db.query(`
        UPDATE survey_questions 
        SET is_active = 0, deleted_by = ?, deletedAt = NOW(), updatedAt = NOW()
        WHERE id = ?
      `, [adminId, id]);
      deletionType = 'soft_delete';
    } else {
      // Hard delete - remove completely
      [result] = await db.query('DELETE FROM survey_questions WHERE id = ?', [id]);
      deletionType = 'hard_delete';
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Question not found or already deleted'
      });
    }

    // Log the deletion
    await db.query(`
      INSERT INTO audit_logs (user_id, action, details, createdAt)
      VALUES (?, 'survey_question_deleted', ?, NOW())
    `, [adminId, JSON.stringify({
      question_id: id,
      question: question.question,
      deletion_type: deletionType,
      was_in_use: inUse,
      deleted_by: req.user.username
    })]);

    res.json({
      success: true,
      message: `Survey question ${deletionType === 'soft_delete' ? 'deactivated' : 'deleted'} successfully`,
      question: {
        id: id,
        question: question.question,
        category: question.category
      },
      deletion_type: deletionType,
      was_in_use: inUse,
      deleted_by: req.user.username,
      deleted_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error deleting survey question:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete survey question',
      details: error.message
    });
  }
};

// =============================================================================
// QUESTION LABELS MANAGEMENT CONTROLLERS
// =============================================================================

/**
 * Get question labels
 * Route: GET /survey/admin/question-labels
 */
export const getSurveyQuestionLabels = async (req, res) => {
  try {
    console.log('🔍 Survey admin fetching question labels');

    const labels = await questionLabelsService.fetchQuestionLabels();
    const stats = await questionLabelsService.getLabelStatistics();

    res.json({
      success: true,
      labels: labels,
      statistics: stats,
      label_count: Object.keys(labels).length,
      categories: questionLabelsService.categorizeLabels ? 
        questionLabelsService.categorizeLabels(labels) : null,
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

/**
 * Update question labels
 * Route: PUT /survey/admin/question-labels
 */
export const updateSurveyQuestionLabels = async (req, res) => {
  try {
    const { labels } = req.body;
    const adminId = req.user.id;

    console.log('🔍 Survey admin updating question labels');

    if (!labels || typeof labels !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Labels object is required'
      });
    }

    // Validate labels
    if (!questionLabelsService.validateLabels(labels)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid labels format or missing required fields'
      });
    }

    // Update labels using service
    await questionLabelsService.updateQuestionLabels(labels);

    // Log the update
    await db.query(`
      INSERT INTO audit_logs (user_id, action, details, createdAt)
      VALUES (?, 'question_labels_updated', ?, NOW())
    `, [adminId, JSON.stringify({
      label_count: Object.keys(labels).length,
      updated_by: req.user.username,
      timestamp: new Date().toISOString()
    })]);

    res.json({
      success: true,
      message: 'Question labels updated successfully',
      updated_labels: Object.keys(labels).length,
      updated_by: req.user.username,
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error updating question labels:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update question labels',
      details: error.message
    });
  }
};

/**
 * Create new question label
 * Route: POST /survey/admin/question-labels
 */
export const createSurveyQuestionLabel = async (req, res) => {
  try {
    const { field_name, label_text } = req.body;
    const adminId = req.user.id;

    console.log('🔍 Survey admin creating question label');

    if (!field_name || !label_text) {
      return res.status(400).json({
        success: false,
        error: 'Field name and label text are required'
      });
    }

    // Create single label using service
    const result = await questionLabelsService.updateSingleLabel(field_name, label_text);

    // Log the creation
    await db.query(`
      INSERT INTO audit_logs (user_id, action, details, createdAt)
      VALUES (?, 'question_label_created', ?, NOW())
    `, [adminId, JSON.stringify({
      field_name: field_name,
      label_text: label_text,
      created_by: req.user.username
    })]);

    res.json({
      success: true,
      message: 'Question label created successfully',
      label: {
        field_name: field_name,
        label_text: label_text
      },
      created_by: req.user.username,
      createdAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error creating question label:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create question label',
      details: error.message
    });
  }
};

// =============================================================================
// SURVEY REVIEW & APPROVAL CONTROLLERS
// =============================================================================

/**
 * Get pending surveys
 * Route: GET /survey/admin/pending
 */
export const getPendingSurveys = async (req, res) => {
  try {
    const { page = 1, limit = 20, application_type = 'all' } = req.query;

    console.log('🔍 Survey admin fetching pending surveys');
    console.log('🔍 Query params:', req.query);
    console.log('🔍 Filters will be:', { approval_status: 'pending', application_type: application_type !== 'all' ? application_type : undefined });

    const filters = { approval_status: 'pending' };
    if (application_type !== 'all') {
      filters.new_survey_type = application_type;
    }

    const pagination = { page: parseInt(page), limit: parseInt(limit) };
    console.log('🔍 About to call fetchAllSurveyLogs with:', { filters, pagination });
    
    const result = await surveyServices.fetchAllSurveyLogs(filters, pagination);
    console.log('🔍 fetchAllSurveyLogs result:', { count: result.count, dataLength: result.data?.length });

    // Enhance with survey-specific metadata
    const enhancedSurveys = (result.data || []).map(survey => ({
      ...survey,
      submission_quality: assessSubmissionQuality(survey.answers || survey.questions_answers || '{}'),
      review_priority: calculateSurveyReviewPriority(survey),
      days_pending: Math.floor((Date.now() - new Date(survey.createdAt)) / (1000 * 60 * 60 * 24))
    }));

    res.json({
      success: true,
      surveys: enhancedSurveys,
      pagination: {
        page: result.page,
        totalPages: result.totalPages,
        total: result.count,
        limit: parseInt(limit)
      },
      summary: {
        total_pending: result.count,
        high_priority: enhancedSurveys.filter(s => s.review_priority === 'high').length,
        low_quality: enhancedSurveys.filter(s => s.submission_quality === 'low').length,
        average_days_pending: enhancedSurveys.reduce((sum, s) => sum + s.days_pending, 0) / Math.max(1, enhancedSurveys.length)
      },
      filters_applied: { application_type, status: 'pending' }
    });

  } catch (error) {
    console.error('❌ Error fetching pending surveys:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending surveys',
      details: error.message
    });
  }
};

/**
 * Get survey logs
 * Route: GET /survey/admin/logs
 */
export const getSurveyLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status = 'all',
      type = 'all',
      startDate = null,
      endDate = null,
      search = ''
    } = req.query;

    console.log('🔍 Survey admin fetching survey logs');

    // Build filters
    const filters = {};
    if (status !== 'all') filters.new_status = status;
    if (type !== 'all') filters.new_survey_type = type;
    if (search) filters.search = search;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const pagination = { page: parseInt(page), limit: parseInt(limit) };
    
    // Add error handling for the service call
    let result;
    try {
      result = await surveyServices.fetchAllSurveyLogs(filters, pagination);
    } catch (serviceError) {
      console.error('❌ Survey service error:', serviceError);
      // Return a fallback response if service fails
      result = {
        data: [],
        page: 1,
        totalPages: 0,
        count: 0
      };
    }

    // Get additional statistics with error handling
    let statsResult = [{}];
    try {
      const queryResult = await db.query(`
        SELECT 
          COUNT(*) as total_logs,
          COUNT(CASE WHEN new_status = 'pending' THEN 1 END) as pending_count,
          COUNT(CASE WHEN new_status = 'approved' THEN 1 END) as approved_count,
          COUNT(CASE WHEN new_status = 'declined' THEN 1 END) as declined_count,
          AVG(CASE WHEN reviewedAt IS NOT NULL THEN DATEDIFF(reviewedAt, createdAt) END) as avg_review_days,
          COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as submissions_24h
        FROM surveylog
        WHERE createdAt >= COALESCE(?, DATE_SUB(NOW(), INTERVAL 90 DAY))
          AND createdAt <= COALESCE(?, NOW())
      `, [startDate, endDate]);
      statsResult = queryResult;
    } catch (dbError) {
      console.error('❌ Database query error for stats:', dbError);
      // Use default empty stats if query fails
      statsResult = [{
        total_logs: 0,
        pending_count: 0,
        approved_count: 0,
        declined_count: 0,
        avg_review_days: 0,
        submissions_24h: 0
      }];
    }

    res.json({
      success: true,
      logs: result.data,
      pagination: {
        page: result.page,
        totalPages: result.totalPages,
        total: result.count,
        limit: parseInt(limit)
      },
      statistics: statsResult[0] || {},
      filters_applied: { status, type, startDate, endDate, search },
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching survey logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch survey logs',
      details: error.message
    });
  }
};

/**
 * Approve survey
 * Route: PUT /survey/admin/approve
 */
export const approveSurvey = async (req, res) => {
  try {
    const {
      surveyId,
      surveyIds = [],
      adminNotes = '',
      mentorId = null,
      classId = null,
      converseId = null
    } = req.body;

    const reviewerId = req.user.id;
    const reviewerName = req.user.username;

    console.log('🔍 Survey admin approving survey(s)');

    // Handle single or bulk approval
    const idsToApprove = surveyId ? [surveyId] : surveyIds;

    if (!idsToApprove.length) {
      return res.status(400).json({
        success: false,
        error: 'Survey ID or survey IDs are required'
      });
    }

    const results = [];

    for (const id of idsToApprove) {
      try {
        // Get survey details with JOINs to response tables
        const [surveyData] = await db.query(`
          SELECT 
            sl.new_survey_id,
            sl.new_survey_type,
            sl.new_status,
            sl.response_table_id,
            sl.createdAt,
            sl.reviewedAt,
            CASE 
              WHEN sl.new_survey_type = 'initial_application' THEN ima.user_id
              WHEN sl.new_survey_type = 'full_membership' THEN fma.user_id
              ELSE sr.user_id
            END as user_id,
            u.username, 
            u.email
          FROM surveylog sl
          LEFT JOIN initial_membership_applications ima ON sl.response_table_id = ima.id AND sl.new_survey_type = 'initial_application'
          LEFT JOIN full_membership_applications fma ON sl.response_table_id = fma.id AND sl.new_survey_type = 'full_membership'
          LEFT JOIN survey_responses sr ON sl.response_table_id = sr.id AND sl.new_survey_type = 'survey'
          LEFT JOIN users u ON (
            CASE 
              WHEN sl.new_survey_type = 'initial_application' THEN ima.user_id
              WHEN sl.new_survey_type = 'full_membership' THEN fma.user_id
              ELSE sr.user_id
            END = u.id
          )
          WHERE sl.new_survey_id = ? AND sl.new_status = 'pending'
        `, [id]);

        if (!surveyData.length) {
          results.push({
            survey_id: id,
            success: false,
            error: 'Survey not found or already processed'
          });
          continue;
        }

        const survey = surveyData[0];

        // Approve using survey service
        const approvalResult = await surveyServices.approveSurveySubmission({
          surveyId: id,
          userId: survey.user_id,
          status: 'approved',
          adminNotes,
          reviewedBy: reviewerId,
          reviewerName,
          mentorId,
          classId,
          converseId
        });

        results.push({
          survey_id: id,
          user_id: survey.user_id,
          username: survey.username,
          success: true,
          new_status: 'approved',
          membership_stage: approvalResult.membershipStage
        });

      } catch (approvalError) {
        console.error(`Failed to approve survey ${id}:`, approvalError);
        results.push({
          survey_id: id,
          success: false,
          error: approvalError.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    res.json({
      success: successCount > 0,
      message: `${successCount} survey(s) approved successfully`,
      results: results,
      summary: {
        total_requested: idsToApprove.length,
        approved: successCount,
        failed: failureCount
      },
      approved_by: reviewerName,
      approved_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error approving survey:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve survey',
      details: error.message
    });
  }
};

/**
 * Reject survey
 * Route: PUT /survey/admin/reject
 */
export const rejectSurvey = async (req, res) => {
  try {
    const {
      surveyId,
      surveyIds = [],
      adminNotes = '',
      rejectionReason = ''
    } = req.body;

    const reviewerId = req.user.id;
    const reviewerName = req.user.username;

    console.log('🔍 Survey admin rejecting survey(s)');

    // Handle single or bulk rejection
    const idsToReject = surveyId ? [surveyId] : surveyIds;

    if (!idsToReject.length) {
      return res.status(400).json({
        success: false,
        error: 'Survey ID or survey IDs are required'
      });
    }

    if (!adminNotes && !rejectionReason) {
      return res.status(400).json({
        success: false,
        error: 'Admin notes or rejection reason is required'
      });
    }

    const results = [];
    const finalNotes = adminNotes || rejectionReason;

    for (const id of idsToReject) {
      try {
        // Get survey details with JOINs to response tables
        const [surveyData] = await db.query(`
          SELECT 
            sl.new_survey_id,
            sl.new_survey_type,
            sl.new_status,
            sl.response_table_id,
            sl.createdAt,
            sl.reviewedAt,
            CASE 
              WHEN sl.new_survey_type = 'initial_application' THEN ima.user_id
              WHEN sl.new_survey_type = 'full_membership' THEN fma.user_id
              ELSE sr.user_id
            END as user_id,
            u.username, 
            u.email
          FROM surveylog sl
          LEFT JOIN initial_membership_applications ima ON sl.response_table_id = ima.id AND sl.new_survey_type = 'initial_application'
          LEFT JOIN full_membership_applications fma ON sl.response_table_id = fma.id AND sl.new_survey_type = 'full_membership'
          LEFT JOIN survey_responses sr ON sl.response_table_id = sr.id AND sl.new_survey_type = 'survey'
          LEFT JOIN users u ON (
            CASE 
              WHEN sl.new_survey_type = 'initial_application' THEN ima.user_id
              WHEN sl.new_survey_type = 'full_membership' THEN fma.user_id
              ELSE sr.user_id
            END = u.id
          )
          WHERE sl.new_survey_id = ? AND sl.new_status = 'pending'
        `, [id]);

        if (!surveyData.length) {
          results.push({
            survey_id: id,
            success: false,
            error: 'Survey not found or already processed'
          });
          continue;
        }

        const survey = surveyData[0];

        // Reject using survey service
        const rejectionResult = await surveyServices.approveSurveySubmission({
          surveyId: id,
          userId: survey.user_id,
          status: 'declined',
          adminNotes: finalNotes,
          reviewedBy: reviewerId,
          reviewerName
        });

        results.push({
          survey_id: id,
          user_id: survey.user_id,
          username: survey.username,
          success: true,
          new_status: 'declined',
          rejection_reason: finalNotes
        });

      } catch (rejectionError) {
        console.error(`Failed to reject survey ${id}:`, rejectionError);
        results.push({
          survey_id: id,
          success: false,
          error: rejectionError.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    res.json({
      success: successCount > 0,
      message: `${successCount} survey(s) rejected`,
      results: results,
      summary: {
        total_requested: idsToReject.length,
        rejected: successCount,
        failed: failureCount
      },
      rejected_by: reviewerName,
      rejected_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error rejecting survey:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject survey',
      details: error.message
    });
  }
};

// =============================================================================
// ANALYTICS & REPORTING CONTROLLERS
// =============================================================================

/**
 * Get survey analytics
 * Route: GET /survey/admin/analytics
 */
export const getSurveyAnalytics = async (req, res) => {
  try {
    const { 
      startDate = null, 
      endDate = null, 
      groupBy = 'day' 
    } = req.query;

    console.log('🔍 Survey admin fetching analytics');

    const analytics = await surveyServices.getSurveyAnalyticsData({
      startDate,
      endDate,
      groupBy
    });

    // Get additional insights
    const [questionAnalytics] = await db.query(`
      SELECT 
        sq.id,
        sq.question,
        sq.category,
        COUNT(DISTINCT sl.id) as response_count,
        AVG(CASE WHEN sl.approval_status = 'approved' THEN 1 ELSE 0 END) * 100 as approval_rate,
        COUNT(CASE WHEN sl.approval_status = 'approved' THEN 1 END) as approved_responses
      FROM survey_questions sq
      LEFT JOIN surveylog sl ON JSON_CONTAINS(sl.answers, CONCAT('"', sq.question, '"'))
      WHERE sq.is_active = 1
        AND (sl.createdAt >= COALESCE(?, DATE_SUB(NOW(), INTERVAL 30 DAY)) OR sl.createdAt IS NULL)
        AND (sl.createdAt <= COALESCE(?, NOW()) OR sl.createdAt IS NULL)
      GROUP BY sq.id, sq.question, sq.category
      ORDER BY response_count DESC
    `, [startDate, endDate]);

    res.json({
      success: true,
      analytics: analytics,
      question_analytics: questionAnalytics,
      insights: {
        most_responded_question: questionAnalytics[0] || null,
        average_approval_rate: analytics.summary ? 
          (analytics.summary.approved / Math.max(1, analytics.summary.total) * 100).toFixed(2) : 0,
        total_responses_analyzed: analytics.summary?.total || 0
      },
      parameters: { startDate, endDate, groupBy },
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching survey analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch survey analytics',
      details: error.message
    });
  }
};

/**
 * Get survey statistics
 * Route: GET /survey/admin/stats
 */
export const getSurveyStats = async (req, res) => {
  try {
    const { period = '30d', detailed = false } = req.query;

    console.log(`🔍 Survey admin fetching statistics (${period})`);

    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;

    // Get comprehensive survey statistics
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_surveys,
        COUNT(CASE WHEN new_status = 'pending' THEN 1 END) as pending_surveys,
        COUNT(CASE WHEN new_status = 'approved' THEN 1 END) as approved_surveys,
        COUNT(CASE WHEN new_status = 'declined' THEN 1 END) as declined_surveys,
        
        -- Survey type breakdown
        COUNT(CASE WHEN new_survey_type = 'initial_application' THEN 1 END) as initial_applications,
        COUNT(CASE WHEN new_survey_type = 'full_membership' THEN 1 END) as full_membership_applications,
        
        -- Quality metrics
        AVG(CASE WHEN reviewedAt IS NOT NULL THEN DATEDIFF(reviewedAt, createdAt) END) as avg_review_days,
        COUNT(CASE WHEN new_status = 'approved' THEN 1 END) / COUNT(*) * 100 as approval_rate,
        
        -- Time-based metrics
        COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as submissions_24h,
        COUNT(CASE WHEN reviewedAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as reviews_24h
        
      FROM surveylog
      WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [days]);

    // Get response quality distribution from response tables
    const [qualityStats] = await db.query(`
      SELECT 
        quality_level,
        COUNT(*) as count,
        AVG(CASE WHEN new_status = 'approved' THEN 1 ELSE 0 END) * 100 as approval_rate
      FROM (
        SELECT 
          CASE 
            WHEN JSON_LENGTH(ima.answers) >= 10 THEN 'high'
            WHEN JSON_LENGTH(ima.answers) >= 5 THEN 'medium'
            ELSE 'low'
          END as quality_level,
          sl.new_status
        FROM surveylog sl
        JOIN initial_membership_applications ima ON sl.response_table_id = ima.id AND sl.new_survey_type = 'initial_application'
        WHERE sl.createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
        UNION ALL
        SELECT 
          CASE 
            WHEN JSON_LENGTH(fma.answers) >= 10 THEN 'high'
            WHEN JSON_LENGTH(fma.answers) >= 5 THEN 'medium'
            ELSE 'low'
          END as quality_level,
          sl.new_status
        FROM surveylog sl
        JOIN full_membership_applications fma ON sl.response_table_id = fma.id AND sl.new_survey_type = 'full_membership'
        WHERE sl.createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
        UNION ALL
        SELECT 
          CASE 
            WHEN JSON_LENGTH(sr.questions_answers) >= 10 THEN 'high'
            WHEN JSON_LENGTH(sr.questions_answers) >= 5 THEN 'medium'
            ELSE 'low'
          END as quality_level,
          sl.new_status
        FROM surveylog sl
        JOIN survey_responses sr ON sl.response_table_id = sr.id AND sl.new_survey_type = 'general_survey'
        WHERE sl.createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
      ) as combined_quality
      GROUP BY quality_level
    `, [days, days, days]);

    // Get detailed breakdown if requested
    let detailedBreakdown = null;
    if (detailed === 'true') {
      const [breakdown] = await db.query(`
        SELECT 
          DATE(createdAt) as date,
          new_survey_type as survey_type,
          COUNT(*) as submissions,
          COUNT(CASE WHEN new_status = 'approved' THEN 1 END) as approvals,
          COUNT(CASE WHEN new_status = 'declined' THEN 1 END) as rejections,
          AVG(CASE WHEN reviewedAt IS NOT NULL THEN DATEDIFF(reviewedAt, createdAt) END) as avg_processing_days
        FROM surveylog
        WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(createdAt), new_survey_type
        ORDER BY date DESC, new_survey_type
      `, [days]);
      
      detailedBreakdown = breakdown;
    }

    res.json({
      success: true,
      period: period,
      statistics: stats[0] || {},
      quality_distribution: qualityStats || [],
      detailed_breakdown: detailedBreakdown,
      summary: {
        total_in_period: stats[0]?.total_surveys || 0,
        approval_rate: parseFloat((stats[0]?.approval_rate || 0).toFixed(2)),
        avg_processing_time: parseFloat((stats[0]?.avg_review_days || 0).toFixed(1)),
        daily_average: Math.round((stats[0]?.total_surveys || 0) / days)
      },
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching survey statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch survey statistics',
      details: error.message
    });
  }
};

/**
 * Get survey completion rates
 * Route: GET /survey/admin/completion-rates
 */
export const getSurveyCompletionRates = async (req, res) => {
  try {
    console.log('🔍 Survey admin fetching completion rates');

    // Get completion rates by question
    const [questionRates] = await db.query(`
      SELECT 
        sq.id,
        sq.question,
        sq.category,
        COUNT(sl.id) as total_responses,
        COUNT(CASE WHEN JSON_EXTRACT(sl.answers, CONCAT('$.', sq.id)) IS NOT NULL THEN 1 END) as completed_responses,
        (COUNT(CASE WHEN JSON_EXTRACT(sl.answers, CONCAT('$.', sq.id)) IS NOT NULL THEN 1 END) / COUNT(sl.id)) * 100 as completion_rate
      FROM survey_questions sq
      LEFT JOIN surveylog sl ON sl.createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      WHERE sq.is_active = 1
      GROUP BY sq.id, sq.question, sq.category
      ORDER BY completion_rate DESC
    `);

    // Get overall completion trends
    const [completionTrends] = await db.query(`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as total_submissions,
        AVG(JSON_LENGTH(answers)) as avg_answers_per_submission,
        COUNT(CASE WHEN JSON_LENGTH(answers) >= 10 THEN 1 END) as complete_submissions,
        (COUNT(CASE WHEN JSON_LENGTH(answers) >= 10 THEN 1 END) / COUNT(*)) * 100 as completion_rate
      FROM surveylog
      WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND answers IS NOT NULL
      GROUP BY DATE(createdAt)
      ORDER BY date DESC
    `);

    res.json({
      success: true,
      question_completion_rates: questionRates,
      completion_trends: completionTrends,
      summary: {
        total_questions: questionRates.length,
        avg_question_completion_rate: questionRates.reduce((sum, q) => sum + q.completion_rate, 0) / Math.max(1, questionRates.length),
        highest_completion_question: questionRates[0] || null,
        lowest_completion_question: questionRates[questionRates.length - 1] || null
      },
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching completion rates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch completion rates',
      details: error.message
    });
  }
};

// =============================================================================
// DATA EXPORT CONTROLLERS
// =============================================================================

/**
 * Export survey data (super admin only)
 * Route: GET /survey/admin/export
 * Route: GET /survey/admin/export/responses
 * Route: GET /survey/admin/export/analytics
 */
export const exportSurveyData = async (req, res) => {
  try {
    const {
      exportType = 'all',
      format = 'csv',
      startDate = null,
      endDate = null,
      includeAnswers = 'false'
    } = req.query;

    console.log(`🔍 Survey admin exporting ${exportType} data in ${format} format`);

    // Determine what to export based on route or parameter
    let dataType = exportType;
    if (req.exportType) {
      dataType = req.exportType; // Set by route middleware
    }

    let exportData;
    let filename;

    switch (dataType) {
      case 'responses':
        exportData = await exportSurveyResponses(startDate, endDate, includeAnswers === 'true');
        filename = `survey_responses_${new Date().toISOString().split('T')[0]}.${format}`;
        break;
        
      case 'analytics':
        exportData = await exportSurveyAnalytics(startDate, endDate);
        filename = `survey_analytics_${new Date().toISOString().split('T')[0]}.${format}`;
        break;
        
      default:
        exportData = await exportAllSurveyData(startDate, endDate, includeAnswers === 'true');
        filename = `survey_export_${new Date().toISOString().split('T')[0]}.${format}`;
    }

    // Format data
    let formattedData;
    if (format === 'csv') {
      formattedData = await surveyServices.exportSurveyDataToCSV({ startDate, endDate });
    } else {
      formattedData = JSON.stringify(exportData, null, 2);
    }

    // Log export action
    await db.query(`
      INSERT INTO audit_logs (user_id, action, details, createdAt)
      VALUES (?, 'survey_data_exported', ?, NOW())
    `, [req.user.id, JSON.stringify({
      exportType: dataType,
      format: format,
      recordCount: exportData.length,
      includeAnswers: includeAnswers === 'true',
      exportedBy: req.user.username,
      dateRange: { startDate, endDate }
    })]);

    // Set headers for download
    const contentType = format === 'csv' ? 'text/csv' : 'application/json';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.send(formattedData);

  } catch (error) {
    console.error('❌ Error exporting survey data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export survey data',
      details: error.message
    });
  }
};

// =============================================================================
// SURVEY CONFIGURATION CONTROLLERS
// =============================================================================

/**
 * Get survey configuration
 * Route: GET /survey/admin/config
 */
export const getSurveyConfig = async (req, res) => {
  try {
    console.log('🔍 Survey admin fetching configuration');

    // Get survey system configuration
    const [configSettings] = await db.query(`
      SELECT setting_key, setting_value, description
      FROM system_settings 
      WHERE setting_key LIKE 'survey.%' AND is_active = 1
      ORDER BY setting_key
    `).catch(() => [[]]);

    // Default configuration
    const defaultConfig = {
      survey: {
        auto_save_enabled: true,
        auto_save_interval: 30000,
        max_draft_age_days: 30,
        require_all_fields: false,
        enable_question_validation: true,
        max_file_upload_size: 5242880, // 5MB
        allowed_file_types: ['pdf', 'doc', 'docx', 'txt']
      },
      questions: {
        max_questions_per_survey: 50,
        allow_conditional_questions: true,
        enable_question_randomization: false,
        require_question_categories: true
      },
      review: {
        auto_assign_reviewers: true,
        require_review_notes: true,
        enable_bulk_operations: true,
        review_timeout_days: 7
      },
      notifications: {
        notify_on_submission: true,
        notify_on_approval: true,
        notify_on_rejection: true,
        admin_notification_email: process.env.ADMIN_EMAIL || ''
      }
    };

    // Merge with database settings
    const dbConfig = {};
    configSettings.forEach(setting => {
      const keys = setting.setting_key.split('.');
      let current = dbConfig;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = setting.setting_value;
    });

    const finalConfig = { ...defaultConfig, ...dbConfig };

    res.json({
      success: true,
      configuration: finalConfig,
      settings_count: configSettings.length,
      editable_settings: [
        'survey.auto_save_interval',
        'survey.max_draft_age_days',
        'questions.max_questions_per_survey',
        'review.review_timeout_days',
        'notifications.admin_notification_email'
      ],
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching survey configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch survey configuration',
      details: error.message
    });
  }
};

/**
 * Update survey configuration
 * Route: PUT /survey/admin/config
 */
export const updateSurveyConfig = async (req, res) => {
  try {
    const { configuration } = req.body;
    const adminId = req.user.id;

    console.log('🔍 Survey admin updating configuration');

    if (!configuration || typeof configuration !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Configuration object is required'
      });
    }

    // Flatten configuration for database storage
    const settings = [];
    const flattenObject = (obj, prefix = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const settingKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null) {
          flattenObject(value, settingKey);
        } else {
          settings.push({
            key: settingKey,
            value: value.toString(),
            type: typeof value
          });
        }
      }
    };

    flattenObject(configuration);

    // Update in database
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      for (const setting of settings) {
        await connection.query(`
          INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by, updatedAt)
          VALUES (?, ?, ?, ?, NOW())
          ON DUPLICATE KEY UPDATE 
            setting_value = VALUES(setting_value),
            updated_by = VALUES(updated_by),
            updatedAt = VALUES(updatedAt)
        `, [setting.key, setting.value, setting.type, adminId]);
      }

      await connection.commit();

      // Log configuration update
      await db.query(`
        INSERT INTO audit_logs (user_id, action, details, createdAt)
        VALUES (?, 'survey_config_updated', ?, NOW())
      `, [adminId, JSON.stringify({
        settings_updated: settings.length,
        updated_by: req.user.username,
        timestamp: new Date().toISOString()
      })]);

      res.json({
        success: true,
        message: 'Survey configuration updated successfully',
        settings_updated: settings.length,
        updated_by: req.user.username,
        updatedAt: new Date().toISOString()
      });

    } catch (dbError) {
      await connection.rollback();
      throw dbError;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('❌ Error updating survey configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update survey configuration',
      details: error.message
    });
  }
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Assess submission quality based on answers
 */
const assessSubmissionQuality = (answers) => {
  if (!answers) return 'low';
  
  try {
    const parsedAnswers = typeof answers === 'string' ? JSON.parse(answers) : answers;
    const answerCount = Object.keys(parsedAnswers).length;
    const nonEmptyAnswers = Object.values(parsedAnswers).filter(value => 
      value && value.toString().trim().length > 0
    ).length;
    
    const completionRate = nonEmptyAnswers / Math.max(1, answerCount);
    const avgAnswerLength = Object.values(parsedAnswers)
      .filter(value => typeof value === 'string')
      .reduce((sum, value) => sum + value.length, 0) / Math.max(1, nonEmptyAnswers);
    
    if (completionRate >= 0.9 && avgAnswerLength >= 50) return 'high';
    if (completionRate >= 0.7 && avgAnswerLength >= 20) return 'medium';
    return 'low';
    
  } catch (error) {
    return 'low';
  }
};

/**
 * Calculate survey review priority
 */
const calculateSurveyReviewPriority = (survey) => {
  const daysPending = Math.floor((Date.now() - new Date(survey.createdAt)) / (1000 * 60 * 60 * 24));
  const quality = assessSubmissionQuality(survey.answers || survey.questions_answers || '{}');
  
  if (daysPending > 14 || (daysPending > 7 && quality === 'high')) return 'high';
  if (daysPending > 7 || (daysPending > 3 && quality === 'high')) return 'medium';
  return 'low';
};

/**
 * Export survey responses
 */
const exportSurveyResponses = async (startDate, endDate, includeAnswers) => {
  const whereClause = [];
  const params = [];
  
  if (startDate) {
    whereClause.push('sl.createdAt >= ?');
    params.push(startDate);
  }
  
  if (endDate) {
    whereClause.push('sl.createdAt <= ?');
    params.push(endDate);
  }
  
  const selectFields = includeAnswers ? 
    'sl.*, u.username, u.email' : 
    'sl.id, sl.user_id, sl.application_type, sl.approval_status, sl.createdAt, sl.reviewedAt, u.username';
  
  const whereString = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';
  
  const [responses] = await db.query(`
    SELECT ${selectFields}
    FROM surveylog sl
    JOIN users u ON CAST(sl.user_id AS UNSIGNED) = u.id
    ${whereString}
    ORDER BY sl.createdAt DESC
  `, params);
  
  return responses;
};

/**
 * Export survey analytics
 */
const exportSurveyAnalytics = async (startDate, endDate) => {
  const analytics = await surveyServices.getSurveyAnalyticsData({
    startDate,
    endDate,
    groupBy: 'day'
  });
  
  return {
    summary: analytics.summary,
    trends: analytics.trends,
    breakdown: analytics.statusBreakdown,
    exported_at: new Date().toISOString(),
    date_range: { startDate, endDate }
  };
};

/**
 * Export all survey data
 */
const exportAllSurveyData = async (startDate, endDate, includeAnswers) => {
  const responses = await exportSurveyResponses(startDate, endDate, includeAnswers);
  const analytics = await exportSurveyAnalytics(startDate, endDate);
  
  return {
    responses,
    analytics,
    metadata: {
      total_responses: responses.length,
      export_date: new Date().toISOString(),
      includes_answers: includeAnswers,
      date_range: { startDate, endDate }
    }
  };
};

// =============================================================================
// EXPORT ALL CONTROLLER FUNCTIONS
// =============================================================================

export default {
  // Question Management
  getSurveyQuestions,
  createSurveyQuestion,
  updateSurveyQuestions,
  deleteSurveyQuestion,
  
  // Question Labels Management
  getSurveyQuestionLabels,
  updateSurveyQuestionLabels,
  createSurveyQuestionLabel,
  
  // Survey Review & Approval
  getPendingSurveys,
  getSurveyLogs,
  approveSurvey,
  rejectSurvey,
  
  // Analytics & Reporting
  getSurveyAnalytics,
  getSurveyStats,
  getSurveyCompletionRates,
  
  // Data Export
  exportSurveyData,
  
  // Configuration
  getSurveyConfig,
  updateSurveyConfig,
  
  // Helper Functions
  assessSubmissionQuality,
  calculateSurveyReviewPriority
};

// Named exports for specific controller functions
// export {
//   // Question Management
//   getSurveyQuestions,
//   createSurveyQuestion,
//   updateSurveyQuestions,
//   deleteSurveyQuestion,
  
//   // Question Labels Management
//   getSurveyQuestionLabels,
//   updateSurveyQuestionLabels,
//   createSurveyQuestionLabel,
  
//   // Survey Review & Approval
//   getPendingSurveys,
//   getSurveyLogs,
//   approveSurvey,
//   rejectSurvey,
  
//   // Analytics & Reporting
//   getSurveyAnalytics,
//   getSurveyStats,
//   getSurveyCompletionRates,
  
//   // Data Export
//   exportSurveyData,
  
//   // Configuration
//   getSurveyConfig,
//   updateSurveyConfig
// };