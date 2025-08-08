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
  deleteSurveyResponse
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
    message: 'Survey requirements endpoint - implement with survey service',
    requirements: {
      membershipStage: 'Must be pre_member or higher',
      questions: 'Dynamic questions from question_labels table',
      validation: 'All required fields must be completed'
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
      membershipStage: req.user?.membership_stage
    },
    availableOperations: ['submit', 'view questions', 'check status'],
    endpoint: '/api/survey/test'
  });
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
        'GET /test - Survey routes test'
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
  console.log('📊 Survey routes loaded: submissions, questions, status checks');
}

export default router;




//2nd copy 


// // ikootaapi/routes/surveyRoutes.js
// // SURVEY ROUTES - User survey operations
// // Handles survey submission, questions, status checks, and question labels

// import express from 'express';
// import { 
//   submitInitialSurvey,
//   submitFullMembershipSurvey,
//   getSurveyQuestions,
//   getQuestionLabels,
//   checkSurveyStatus,
//   getSurveyHistory,
//   saveSurveyDraft
// } from '../controllers/surveyControllers.js';
// import { authenticateToken } from '../middleware/authMiddleware.js';
// import { validateSurveySubmission } from '../middleware/validationMiddleware.js';

// const router = express.Router();

// // ===============================================
// // SURVEY SUBMISSION ENDPOINTS
// // ===============================================

// // Submit initial application survey
// router.post('/submit-application', 
//   authenticateToken,
//   validateSurveySubmission,
//   submitInitialSurvey
// );

// // Legacy endpoint for backward compatibility
// router.post('/submit_applicationsurvey', 
//   authenticateToken,
//   validateSurveySubmission,
//   submitInitialSurvey
// );

// // Submit full membership survey
// router.post('/submit-full-membership',
//   authenticateToken,
//   validateSurveySubmission,
//   submitFullMembershipSurvey
// );

// // Save survey draft (auto-save functionality)
// router.post('/save-draft',
//   authenticateToken,
//   saveSurveyDraft
// );

// // ===============================================
// // SURVEY QUESTIONS & LABELS
// // ===============================================

// // Get survey questions (legacy format)
// router.get('/questions', getSurveyQuestions);

// // Get question labels for dynamic forms
// router.get('/question-labels', getQuestionLabels);

// // ===============================================
// // SURVEY STATUS & HISTORY
// // ===============================================

// // Check user's survey status
// router.get('/check-status',
//   authenticateToken,
//   checkSurveyStatus
// );

// // Get user's survey history
// router.get('/history',
//   authenticateToken,
//   getSurveyHistory
// );

// // ===============================================
// // DEVELOPMENT & TESTING ENDPOINTS
// // ===============================================

// if (process.env.NODE_ENV === 'development') {
//   // Test endpoint for survey routes
//   router.get('/test', (req, res) => {
//     res.json({
//       success: true,
//       message: 'Survey routes working',
//       endpoints: {
//         submission: [
//           'POST /api/survey/submit-application',
//           'POST /api/survey/submit-full-membership',
//           'POST /api/survey/save-draft'
//         ],
//         retrieval: [
//           'GET /api/survey/questions',
//           'GET /api/survey/question-labels',
//           'GET /api/survey/check-status',
//           'GET /api/survey/history'
//         ]
//       }
//     });
//   });
// }

// // ===============================================
// // ERROR HANDLING
// // ===============================================

// router.use((error, req, res, next) => {
//   console.error('Survey route error:', error);
//   res.status(error.statusCode || 500).json({
//     success: false,
//     error: error.message || 'Survey operation failed',
//     ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
//   });
// });

// export default router;