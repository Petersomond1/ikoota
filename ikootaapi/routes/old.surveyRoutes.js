// File: ikootaapi/routes/surveyRoutes.js
// SURVEY ROUTES - CONSOLIDATED SURVEY MANAGEMENT

import express from 'express';
import { 
  submitSurvey, 
  getSurveyQuestions, 
  updateSurveyQuestions, 
  getSurveyLogs, 
  approveSurvey,
  getQuestionLabels,
  updateSurveyQuestionLabels
} from '../controllers/old.surveyControllers.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const surveyRouter = express.Router();

// ===============================================
// SURVEY SUBMISSION ROUTES
// ===============================================

// Submit application survey form
surveyRouter.post('/submit', authenticate, submitSurvey);
surveyRouter.post('/application/submit', authenticate, submitSurvey);
surveyRouter.post('/submit_applicationsurvey', authenticate, submitSurvey); // Legacy compatibility

// ===============================================
// SURVEY MANAGEMENT ROUTES
// ===============================================

// Question labels endpoints for dynamic survey management
surveyRouter.get('/question-labels', authenticate, getQuestionLabels);
surveyRouter.put('/question-labels', authenticate, updateSurveyQuestionLabels);

// Legacy endpoints (backward compatibility)
surveyRouter.get('/questions', authenticate, getSurveyQuestions);
surveyRouter.put('/questions', authenticate, updateSurveyQuestions);

// ===============================================
// SURVEY STATUS & LOGS ROUTES
// ===============================================

// Survey status check
surveyRouter.get('/status', authenticate, async (req, res) => {
  // This would integrate with the survey status controller
  res.json({ message: 'Survey status endpoint - integrate with userStatusController' });
});

// Survey logs and approval (admin only)
surveyRouter.get('/logs', authenticate, getSurveyLogs);
surveyRouter.put('/approve', authenticate, approveSurvey);

// ===============================================
// ERROR HANDLING
// ===============================================

// 404 handler for survey routes
surveyRouter.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Survey route not found',
    path: req.path,
    method: req.method,
    availableRoutes: {
      submission: [
        'POST /submit - Submit survey',
        'POST /application/submit - Submit application survey'
      ],
      management: [
        'GET /question-labels - Get question labels',
        'PUT /question-labels - Update question labels',
        'GET /questions - Get survey questions',
        'PUT /questions - Update survey questions'
      ],
      status: [
        'GET /status - Get survey status',
        'GET /logs - Get survey logs (admin)',
        'PUT /approve - Approve survey (admin)'
      ]
    },
    timestamp: new Date().toISOString()
  });
});

// Global error handler for survey routes
surveyRouter.use((error, req, res, next) => {
  console.error('❌ Survey route error:', error);
  
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Internal server error',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

if (process.env.NODE_ENV === 'development') {
  console.log('📊 Survey routes loaded with question management and submission');
}

export default surveyRouter;

