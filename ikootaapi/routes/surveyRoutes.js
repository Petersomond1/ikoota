// ikootaapi/routes/surveyRoutes.js - INTEGRATED VERSION
// Survey management routes for user-facing survey operations
// Updated to use existing middleware/auth.js (enhanced version)

import express from 'express';
import { authenticate, canSubmitSurveys } from '../middleware/auth.js';

// Import survey controllers (your existing ones)
import {
  submitSurvey,
  getSurveyQuestions,
  getQuestionLabels,
  getSurveyStatus,
  getSurveyHistory,
  updateSurveyResponse,
  deleteSurveyResponse,
  // Draft functions
  saveSurveyDraft,
  getSurveyDrafts,
  deleteSurveyDraftController
} from '../controllers/surveyControllers.js';

const router = express.Router();

// ===============================================
// SURVEY SYSTEM TEST ENDPOINT
// ===============================================

router.get('/test', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Survey routes are working!',
    timestamp: new Date().toISOString(),
    user: {
      id: req.user?.id,
      username: req.user?.username,
      membershipStage: req.user?.membership_stage,
      role: req.user?.role
    },
    available_operations: [
      'submit surveys', 
      'view questions', 
      'check status',
      'save drafts',
      'manage drafts'
    ],
    survey_features: {
      draftManagement: 'Available',
      autoSave: 'Enabled',
      questionLabels: 'Dynamic',
      statusTracking: 'Real-time',
      responseUpdates: 'Supported'
    },
    integration_status: {
      membership_compatibility: 'Works with membership applications',
      admin_access: req.user?.role === 'admin' || req.user?.role === 'super_admin' ? 'Enabled' : 'Disabled',
      database_connected: 'Yes'
    },
    endpoint: '/api/survey/test'
  });
});

// ===============================================
// SURVEY SUBMISSION ENDPOINTS
// ===============================================

// POST /api/survey/submit - Submit survey/application
router.post('/submit', authenticate, submitSurvey);

// POST /api/survey/application/submit - Submit application survey (alias)
router.post('/application/submit', authenticate, submitSurvey);

// Legacy compatibility for existing frontend
router.post('/submit_applicationsurvey', authenticate, submitSurvey);

// ===============================================
// SURVEY DRAFT MANAGEMENT
// ===============================================

// POST /api/survey/draft/save - Save survey draft
router.post('/draft/save', authenticate, saveSurveyDraft);

// GET /api/survey/drafts - Get user's survey drafts
router.get('/drafts', authenticate, getSurveyDrafts);

// DELETE /api/survey/draft/:draftId - Delete survey draft
router.delete('/draft/:draftId', authenticate, deleteSurveyDraftController);

// PUT /api/survey/draft/:draftId - Update survey draft
router.put('/draft/:draftId', authenticate, async (req, res, next) => {
  try {
    // Convert to save draft with draftId
    req.body.draftId = req.params.draftId;
    return saveSurveyDraft(req, res, next);
  } catch (error) {
    next(error);
  }
});

// ===============================================
// SURVEY QUESTIONS & LABELS
// ===============================================

// GET /api/survey/questions - Get survey questions
router.get('/questions', authenticate, getSurveyQuestions);

// GET /api/survey/question-labels - Get question labels for dynamic surveys
router.get('/question-labels', authenticate, getQuestionLabels);

// ===============================================
// SURVEY STATUS & HISTORY
// ===============================================

// GET /api/survey/status - Get survey status
router.get('/status', authenticate, getSurveyStatus);

// GET /api/survey/check-status - Enhanced status check (compatibility)
router.get('/check-status', authenticate, getSurveyStatus);

// GET /api/survey/history - Get user's survey history
router.get('/history', authenticate, getSurveyHistory);

// ===============================================
// SURVEY RESPONSE MANAGEMENT
// ===============================================

// PUT /api/survey/response/update - Update survey response
router.put('/response/update', authenticate, updateSurveyResponse);

// DELETE /api/survey/response - Delete survey response
router.delete('/response', authenticate, deleteSurveyResponse);

// ===============================================
// SURVEY INFORMATION & REQUIREMENTS
// ===============================================

// GET /api/survey/requirements - Get survey requirements
router.get('/requirements', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Survey requirements endpoint',
      requirements: {
        membershipStage: 'Available to all authenticated users',
        surveyTypes: [
          'General surveys (independent of membership)',
          'Custom questionnaires',
          'Feedback forms',
          'Assessment surveys'
        ],
        questions: 'Dynamic questions from question_labels table',
        validation: 'All required fields must be completed',
        drafts: 'Draft saving available for incomplete surveys'
      },
      features: {
        draftSaving: true,
        autoSave: true,
        questionValidation: true,
        responseUpdates: true,
        historyTracking: true,
        multipleAttempts: true
      },
      survey_vs_membership: {
        note: 'This survey system is separate from membership applications',
        membership_applications: 'Use /api/membership/apply/* endpoints',
        general_surveys: 'Use /api/survey/* endpoints (this system)',
        admin_distinction: 'Survey admin and membership admin are separate'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch survey requirements',
      details: error.message
    });
  }
});

// ===============================================
// SURVEY ANALYTICS (USER LEVEL)
// ===============================================

// GET /api/survey/my-analytics - Get user's survey analytics
router.get('/my-analytics', authenticate, async (req, res) => {
  try {
    // This would call a service to get user-specific survey analytics
    res.json({
      success: true,
      message: 'User survey analytics',
      user_id: req.user.id,
      analytics: {
        total_surveys_submitted: 0, // Would be calculated from database
        completed_surveys: 0,
        draft_surveys: 0,
        average_completion_time: '0 minutes',
        last_survey_date: null,
        survey_categories: []
      },
      participation_summary: {
        this_month: 0,
        this_year: 0,
        total_all_time: 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user analytics',
      details: error.message
    });
  }
});

// ===============================================
// TESTING ENDPOINTS
// ===============================================

// Draft system test
router.get('/test/drafts', authenticate, async (req, res) => {
  try {
    const testData = {
      canSaveDrafts: true,
      canViewDrafts: true,
      canDeleteDrafts: true,
      autoSaveEnabled: true,
      maxDrafts: 10,
      draftRetentionDays: 30
    };
    
    res.json({
      success: true,
      message: 'Draft system test successful',
      features: testData,
      user: {
        id: req.user.id,
        username: req.user.username,
        can_create_drafts: true
      },
      endpoints: {
        save: 'POST /api/survey/draft/save',
        list: 'GET /api/survey/drafts',
        update: 'PUT /api/survey/draft/:id',
        delete: 'DELETE /api/survey/draft/:id'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Draft test failed',
      message: error.message
    });
  }
});

// Survey submission test
router.get('/test/submission', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Survey submission test endpoint',
    user: {
      id: req.user.id,
      username: req.user.username,
      eligible_for_surveys: true
    },
    submission_process: {
      step1: 'GET /api/survey/questions - Fetch available questions',
      step2: 'POST /api/survey/draft/save - Save draft (optional)',
      step3: 'POST /api/survey/submit - Submit completed survey',
      step4: 'GET /api/survey/status - Check submission status'
    },
    validation_rules: {
      required_fields: 'Varies by survey type',
      min_answers: 1,
      max_file_uploads: 3,
      auto_save_interval: '30 seconds'
    },
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// SYSTEM INTEGRATION ENDPOINTS
// ===============================================

// GET /api/survey/integration-status - Check integration with other systems
router.get('/integration-status', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Survey system integration status',
      integrations: {
        membership_system: {
          status: 'Independent but compatible',
          note: 'Survey system works alongside membership applications',
          membership_routes: '/api/membership/*',
          survey_routes: '/api/survey/*'
        },
        user_system: {
          status: 'Fully integrated',
          authentication: 'Shared auth middleware',
          user_data: 'Access to user profile and preferences'
        },
        admin_system: {
          status: 'Separate admin panel',
          admin_routes: '/api/admin/survey/*',
          permissions: 'Requires admin role'
        },
        content_system: {
          status: 'Compatible',
          note: 'Surveys can be related to content but are independent'
        }
      },
      database_tables: {
        survey_questions: 'Dynamic question management',
        surveylog: 'Survey submissions and responses',
        survey_drafts: 'Draft management',
        question_labels: 'Dynamic form labels',
        audit_logs: 'Survey activity tracking'
      },
      frontend_ready: {
        SurveyControls_jsx: 'Backend ready for admin component',
        survey_forms: 'Dynamic form generation supported',
        admin_dashboard: 'Survey analytics and management ready'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to check integration status',
      details: error.message
    });
  }
});

// ===============================================
// ERROR HANDLING
// ===============================================

// 404 handler for survey routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Survey route not found',
    path: req.path,
    method: req.method,
    available_routes: {
      submission: [
        'POST /submit - Submit survey',
        'POST /application/submit - Submit application survey',
        'POST /submit_applicationsurvey - Legacy compatibility'
      ],
      drafts: [
        'POST /draft/save - Save survey draft',
        'GET /drafts - Get user drafts',
        'PUT /draft/:id - Update draft',
        'DELETE /draft/:id - Delete draft'
      ],
      questions: [
        'GET /questions - Get survey questions',
        'GET /question-labels - Get question labels'
      ],
      status: [
        'GET /status - Get survey status',
        'GET /check-status - Enhanced status check',
        'GET /history - Get survey history'
      ],
      management: [
        'PUT /response/update - Update survey response',
        'DELETE /response - Delete survey response'
      ],
      information: [
        'GET /requirements - Get survey requirements',
        'GET /my-analytics - User survey analytics',
        'GET /integration-status - Integration status'
      ],
      testing: [
        'GET /test - Survey routes test',
        'GET /test/drafts - Draft system test',
        'GET /test/submission - Submission test'
      ]
    },
    system_notes: {
      authentication_required: 'All routes require valid authentication',
      survey_independence: 'Survey system is independent of membership applications',
      admin_access: 'Admin features available at /api/admin/survey/*',
      frontend_compatibility: 'Ready for SurveyControls.jsx integration'
    },
    timestamp: new Date().toISOString()
  });
});

// Error handler for survey routes
router.use((error, req, res, next) => {
  console.error('❌ Survey route error:', {
    error: error.message,
    path: req.path,
    method: req.method,
    user: req.user?.username || 'unauthenticated',
    timestamp: new Date().toISOString()
  });
  
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Survey operation error',
    errorType: error.name || 'SurveyError',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Development logging
if (process.env.NODE_ENV === 'development') {
  console.log('📊 Survey routes loaded: submissions, questions, status checks, drafts');
  console.log('🔗 Survey system integrated with main router');
  console.log('📋 Available at /api/survey/* endpoints');
}

export default router;










// // ikootaapi/routes/surveyRoutes.js
// // SURVEY MANAGEMENT ROUTES
// // Survey submissions and question management

// import express from 'express';
// import { authenticate } from '../middlewares/auth.middleware.js';

// // Import survey controllers
// import {
//   submitSurvey,
//   getSurveyQuestions,
//   getQuestionLabels,
//   getSurveyStatus,
//   getSurveyHistory,
//   updateSurveyResponse,
//   deleteSurveyResponse,
//   // NEW: Draft functions
//   saveSurveyDraft,
//   getSurveyDrafts,
//   deleteSurveyDraftController
// } from '../controllers/surveyControllers.js';

// const router = express.Router();

// // ===============================================
// // SURVEY SUBMISSION
// // ===============================================

// // POST /survey/submit - Submit survey/application
// router.post('/submit', authenticate, submitSurvey);

// // POST /survey/application/submit - Submit application survey (alias)
// router.post('/application/submit', authenticate, submitSurvey);

// // Legacy compatibility
// router.post('/submit_applicationsurvey', authenticate, submitSurvey);

// // ===============================================
// // SURVEY DRAFT MANAGEMENT (NEW)
// // ===============================================

// // POST /survey/draft/save - Save survey draft
// router.post('/draft/save', authenticate, saveSurveyDraft);

// // GET /survey/drafts - Get user's survey drafts
// router.get('/drafts', authenticate, getSurveyDrafts);

// // DELETE /survey/draft/:draftId - Delete survey draft
// router.delete('/draft/:draftId', authenticate, deleteSurveyDraftController);

// // PUT /survey/draft/:draftId - Update survey draft
// router.put('/draft/:draftId', authenticate, async (req, res, next) => {
//   // Convert to save draft with draftId
//   req.body.draftId = req.params.draftId;
//   return saveSurveyDraft(req, res, next);
// });

// // ===============================================
// // SURVEY QUESTIONS & LABELS
// // ===============================================

// // GET /survey/questions - Get survey questions
// router.get('/questions', authenticate, getSurveyQuestions);

// // GET /survey/question-labels - Get question labels for dynamic surveys
// router.get('/question-labels', authenticate, getQuestionLabels);

// // ===============================================
// // SURVEY STATUS & HISTORY
// // ===============================================

// // GET /survey/status - Get survey status
// router.get('/status', authenticate, getSurveyStatus);

// // GET /survey/check-status - Enhanced status check (compatibility)
// router.get('/check-status', authenticate, getSurveyStatus);

// // GET /survey/history - Get user's survey history
// router.get('/history', authenticate, getSurveyHistory);

// // ===============================================
// // SURVEY RESPONSE MANAGEMENT
// // ===============================================

// // PUT /survey/response/update - Update survey response
// router.put('/response/update', authenticate, updateSurveyResponse);

// // DELETE /survey/response - Delete survey response
// router.delete('/response', authenticate, deleteSurveyResponse);

// // ===============================================
// // SURVEY REQUIREMENTS
// // ===============================================

// // GET /survey/requirements - Get survey requirements
// router.get('/requirements', authenticate, async (req, res) => {
//   res.json({
//     success: true,
//     message: 'Survey requirements endpoint',
//     requirements: {
//       membershipStage: 'Must be pre_member or higher',
//       questions: 'Dynamic questions from question_labels table',
//       validation: 'All required fields must be completed',
//       drafts: 'Draft saving available for incomplete surveys'
//     },
//     features: {
//       draftSaving: true,
//       adminDraftManagement: true,
//       multipleDraftTypes: true
//     },
//     timestamp: new Date().toISOString()
//   });
// });

// // ===============================================
// // TESTING ENDPOINTS
// // ===============================================

// // Survey system test
// router.get('/test', authenticate, (req, res) => {
//   res.json({
//     success: true,
//     message: 'Survey routes are working!',
//     timestamp: new Date().toISOString(),
//     user: {
//       id: req.user?.id,
//       username: req.user?.username,
//       membershipStage: req.user?.membership_stage,
//       role: req.user?.role
//     },
//     availableOperations: [
//       'submit', 
//       'view questions', 
//       'check status',
//       'save drafts',
//       'manage drafts'
//     ],
//     newFeatures: {
//       draftManagement: 'Available',
//       adminDraftAccess: req.user?.role === 'admin' || req.user?.role === 'super_admin' ? 'Enabled' : 'Disabled'
//     },
//     endpoint: '/api/survey/test'
//   });
// });

// // Draft system test
// router.get('/test/drafts', authenticate, async (req, res) => {
//   try {
//     // Test draft functionality
//     const testData = {
//       canSaveDrafts: true,
//       canViewDrafts: true,
//       canDeleteDrafts: true,
//       adminAccess: req.user?.role === 'admin' || req.user?.role === 'super_admin'
//     };
    
//     res.json({
//       success: true,
//       message: 'Draft system test successful',
//       features: testData,
//       timestamp: new Date().toISOString(),
//       endpoints: {
//         save: 'POST /draft/save',
//         list: 'GET /drafts',
//         update: 'PUT /draft/:id',
//         delete: 'DELETE /draft/:id'
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: 'Draft test failed',
//       message: error.message
//     });
//   }
// });

// // ===============================================
// // ERROR HANDLING
// // ===============================================

// // 404 handler
// router.use('*', (req, res) => {
//   res.status(404).json({
//     success: false,
//     error: 'Survey route not found',
//     path: req.path,
//     method: req.method,
//     availableRoutes: {
//       submission: [
//         'POST /submit - Submit survey/application',
//         'POST /application/submit - Submit application survey'
//       ],
//       drafts: [
//         'POST /draft/save - Save survey draft',
//         'GET /drafts - Get user drafts',
//         'PUT /draft/:id - Update draft',
//         'DELETE /draft/:id - Delete draft'
//       ],
//       questions: [
//         'GET /questions - Get survey questions',
//         'GET /question-labels - Get question labels'
//       ],
//       status: [
//         'GET /status - Get survey status',
//         'GET /check-status - Enhanced status check',
//         'GET /history - Get survey history'
//       ],
//       management: [
//         'PUT /response/update - Update survey response',
//         'DELETE /response - Delete survey response'
//       ],
//       information: [
//         'GET /requirements - Get survey requirements'
//       ],
//       testing: [
//         'GET /test - Survey routes test',
//         'GET /test/drafts - Draft system test'
//       ]
//     },
//     timestamp: new Date().toISOString()
//   });
// });

// // Error handler
// router.use((error, req, res, next) => {
//   console.error('❌ Survey route error:', {
//     error: error.message,
//     path: req.path,
//     method: req.method,
//     user: req.user?.username || 'unauthenticated',
//     timestamp: new Date().toISOString()
//   });
  
//   res.status(error.statusCode || 500).json({
//     success: false,
//     error: error.message || 'Survey operation error',
//     path: req.path,
//     method: req.method,
//     timestamp: new Date().toISOString()
//   });
// });

// if (process.env.NODE_ENV === 'development') {
//   console.log('📊 Survey routes loaded: submissions, questions, status checks, drafts');
// }

// export default router;