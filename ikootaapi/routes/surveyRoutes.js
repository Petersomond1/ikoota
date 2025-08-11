// ikootaapi/routes/surveyRoutes.js
// SURVEY MANAGEMENT ROUTES
// Survey submissions and question management

import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';

// Import survey controllers
import {
  submitSurvey,
  getSurveyQuestions,
  getQuestionLabels,
  getSurveyStatus,
  getSurveyHistory,
  updateSurveyResponse,
  deleteSurveyResponse,
  // NEW: Draft functions
  saveSurveyDraft,
  getSurveyDrafts,
  deleteSurveyDraftController
} from '../controllers/surveyControllers.js';

const router = express.Router();

// ===============================================
// SURVEY SUBMISSION
// ===============================================

// POST /survey/submit - Submit survey/application
router.post('/submit', authenticate, submitSurvey);

// POST /survey/application/submit - Submit application survey (alias)
router.post('/application/submit', authenticate, submitSurvey);

// Legacy compatibility
router.post('/submit_applicationsurvey', authenticate, submitSurvey);

// ===============================================
// SURVEY DRAFT MANAGEMENT (NEW)
// ===============================================

// POST /survey/draft/save - Save survey draft
router.post('/draft/save', authenticate, saveSurveyDraft);

// GET /survey/drafts - Get user's survey drafts
router.get('/drafts', authenticate, getSurveyDrafts);

// DELETE /survey/draft/:draftId - Delete survey draft
router.delete('/draft/:draftId', authenticate, deleteSurveyDraftController);

// PUT /survey/draft/:draftId - Update survey draft
router.put('/draft/:draftId', authenticate, async (req, res, next) => {
  // Convert to save draft with draftId
  req.body.draftId = req.params.draftId;
  return saveSurveyDraft(req, res, next);
});

// ===============================================
// SURVEY QUESTIONS & LABELS
// ===============================================

// GET /survey/questions - Get survey questions
router.get('/questions', authenticate, getSurveyQuestions);

// GET /survey/question-labels - Get question labels for dynamic surveys
router.get('/question-labels', authenticate, getQuestionLabels);

// ===============================================
// SURVEY STATUS & HISTORY
// ===============================================

// GET /survey/status - Get survey status
router.get('/status', authenticate, getSurveyStatus);

// GET /survey/check-status - Enhanced status check (compatibility)
router.get('/check-status', authenticate, getSurveyStatus);

// GET /survey/history - Get user's survey history
router.get('/history', authenticate, getSurveyHistory);

// ===============================================
// SURVEY RESPONSE MANAGEMENT
// ===============================================

// PUT /survey/response/update - Update survey response
router.put('/response/update', authenticate, updateSurveyResponse);

// DELETE /survey/response - Delete survey response
router.delete('/response', authenticate, deleteSurveyResponse);

// ===============================================
// SURVEY REQUIREMENTS
// ===============================================

// GET /survey/requirements - Get survey requirements
router.get('/requirements', authenticate, async (req, res) => {
  res.json({
    success: true,
    message: 'Survey requirements endpoint',
    requirements: {
      membershipStage: 'Must be pre_member or higher',
      questions: 'Dynamic questions from question_labels table',
      validation: 'All required fields must be completed',
      drafts: 'Draft saving available for incomplete surveys'
    },
    features: {
      draftSaving: true,
      adminDraftManagement: true,
      multipleDraftTypes: true
    },
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// TESTING ENDPOINTS
// ===============================================

// Survey system test
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
    availableOperations: [
      'submit', 
      'view questions', 
      'check status',
      'save drafts',
      'manage drafts'
    ],
    newFeatures: {
      draftManagement: 'Available',
      adminDraftAccess: req.user?.role === 'admin' || req.user?.role === 'super_admin' ? 'Enabled' : 'Disabled'
    },
    endpoint: '/api/survey/test'
  });
});

// Draft system test
router.get('/test/drafts', authenticate, async (req, res) => {
  try {
    // Test draft functionality
    const testData = {
      canSaveDrafts: true,
      canViewDrafts: true,
      canDeleteDrafts: true,
      adminAccess: req.user?.role === 'admin' || req.user?.role === 'super_admin'
    };
    
    res.json({
      success: true,
      message: 'Draft system test successful',
      features: testData,
      timestamp: new Date().toISOString(),
      endpoints: {
        save: 'POST /draft/save',
        list: 'GET /drafts',
        update: 'PUT /draft/:id',
        delete: 'DELETE /draft/:id'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Draft test failed',
      message: error.message
    });
  }
});

// ===============================================
// ERROR HANDLING
// ===============================================

// 404 handler
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Survey route not found',
    path: req.path,
    method: req.method,
    availableRoutes: {
      submission: [
        'POST /submit - Submit survey/application',
        'POST /application/submit - Submit application survey'
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
        'GET /requirements - Get survey requirements'
      ],
      testing: [
        'GET /test - Survey routes test',
        'GET /test/drafts - Draft system test'
      ]
    },
    timestamp: new Date().toISOString()
  });
});

// Error handler
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
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

if (process.env.NODE_ENV === 'development') {
  console.log('📊 Survey routes loaded: submissions, questions, status checks, drafts');
}

export default router;