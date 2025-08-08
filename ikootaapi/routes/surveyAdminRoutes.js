// ikootaapi/routes/surveyAdminRoutes.js
// ADMIN SURVEY MANAGEMENT ROUTES
// Administrative control over surveys and question labels

import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

// Import survey admin controllers
import {
  // Question management
  updateSurveyQuestions,
  updateSurveyQuestionLabels,
  createSurveyQuestion,
  deleteSurveyQuestion,
  
  // Survey review and approval
  getSurveyLogs,
  approveSurvey,
  rejectSurvey,
  getPendingSurveys,
  
  // Analytics and reporting
  getSurveyAnalytics,
  getSurveyStats,
  exportSurveyData
} from '../controllers/surveyAdminControllers.js';

const router = express.Router();

// ===============================================
// APPLY ADMIN AUTHENTICATION TO ALL ROUTES
// ===============================================
router.use(authenticate);
router.use(authorize(['admin', 'super_admin']));

// ===============================================
// QUESTION MANAGEMENT
// ===============================================

// GET /admin/survey/questions - Get all survey questions
router.get('/questions', async (req, res) => {
  res.json({
    success: true,
    message: 'Get survey questions endpoint - implement with survey admin service',
    timestamp: new Date().toISOString()
  });
});

// POST /admin/survey/questions - Create new survey question
router.post('/questions', createSurveyQuestion);

// PUT /admin/survey/questions - Update survey questions
router.put('/questions', updateSurveyQuestions);

// DELETE /admin/survey/questions/:id - Delete survey question
router.delete('/questions/:id', deleteSurveyQuestion);

// ===============================================
// QUESTION LABELS MANAGEMENT
// ===============================================

// GET /admin/survey/question-labels - Get question labels
router.get('/question-labels', async (req, res) => {
  res.json({
    success: true,
    message: 'Get question labels endpoint - implement with question labels service',
    timestamp: new Date().toISOString()
  });
});

// PUT /admin/survey/question-labels - Update question labels
router.put('/question-labels', updateSurveyQuestionLabels);

// POST /admin/survey/question-labels - Create new question label
router.post('/question-labels', async (req, res) => {
  res.json({
    success: true,
    message: 'Create question label endpoint - implement with question labels service',
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// SURVEY REVIEW & APPROVAL
// ===============================================

// GET /admin/survey/pending - Get pending surveys
router.get('/pending', getPendingSurveys);

// GET /admin/survey/logs - Get survey logs
router.get('/logs', getSurveyLogs);

// PUT /admin/survey/approve - Approve survey
router.put('/approve', approveSurvey);

// PUT /admin/survey/reject - Reject survey
router.put('/reject', rejectSurvey);

// PUT /admin/survey/:id/status - Update survey status
router.put('/:id/status', async (req, res) => {
  const { status } = req.body;
  
  if (status === 'approved') {
    req.surveyId = req.params.id;
    return approveSurvey(req, res);
  } else if (status === 'rejected') {
    req.surveyId = req.params.id;
    return rejectSurvey(req, res);
  }
  
  res.status(400).json({
    success: false,
    error: 'Invalid status. Must be "approved" or "rejected"',
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// ANALYTICS & REPORTING
// ===============================================

// GET /admin/survey/analytics - Get survey analytics
router.get('/analytics', getSurveyAnalytics);

// GET /admin/survey/stats - Get survey statistics
router.get('/stats', getSurveyStats);

// GET /admin/survey/completion-rates - Get completion rates
router.get('/completion-rates', async (req, res) => {
  res.json({
    success: true,
    message: 'Survey completion rates endpoint - implement with analytics service',
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// DATA EXPORT
// ===============================================

// GET /admin/survey/export - Export survey data (super admin only)
router.get('/export', authorize(['super_admin']), exportSurveyData);

// GET /admin/survey/export/responses - Export survey responses
router.get('/export/responses', authorize(['super_admin']), (req, res, next) => {
  req.exportType = 'responses';
  exportSurveyData(req, res, next);
});

// GET /admin/survey/export/analytics - Export survey analytics
router.get('/export/analytics', authorize(['super_admin']), (req, res, next) => {
  req.exportType = 'analytics';
  exportSurveyData(req, res, next);
});

// ===============================================
// SURVEY CONFIGURATION
// ===============================================

// GET /admin/survey/config - Get survey configuration
router.get('/config', async (req, res) => {
  res.json({
    success: true,
    message: 'Survey configuration endpoint - implement with survey admin service',
    timestamp: new Date().toISOString()
  });
});

// PUT /admin/survey/config - Update survey configuration
router.put('/config', async (req, res) => {
  res.json({
    success: true,
    message: 'Update survey configuration endpoint - implement with survey admin service',
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// TESTING ENDPOINTS
// ===============================================

// Survey admin test
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Admin survey routes are working!',
    timestamp: new Date().toISOString(),
    user: {
      id: req.user?.id,
      username: req.user?.username,
      role: req.user?.role
    },
    availableOperations: [
      'question management',
      'survey approval',
      'analytics',
      'data export'
    ],
    endpoint: '/api/admin/survey/test'
  });
});

// ===============================================
// ERROR HANDLING
// ===============================================

// 404 handler
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Admin survey route not found',
    path: req.path,
    method: req.method,
    availableRoutes: {
      questionManagement: [
        'GET /questions - Get all survey questions',
        'POST /questions - Create new question',
        'PUT /questions - Update questions',
        'DELETE /questions/:id - Delete question'
      ],
      questionLabels: [
        'GET /question-labels - Get question labels',
        'PUT /question-labels - Update question labels',
        'POST /question-labels - Create question label'
      ],
      surveyReview: [
        'GET /pending - Get pending surveys',
        'GET /logs - Get survey logs',
        'PUT /approve - Approve survey',
        'PUT /reject - Reject survey',
        'PUT /:id/status - Update survey status'
      ],
      analytics: [
        'GET /analytics - Survey analytics',
        'GET /stats - Survey statistics',
        'GET /completion-rates - Completion rates'
      ],
      dataExport: [
        'GET /export - Export survey data (super admin)',
        'GET /export/responses - Export responses (super admin)',
        'GET /export/analytics - Export analytics (super admin)'
      ],
      configuration: [
        'GET /config - Get survey configuration',
        'PUT /config - Update survey configuration'
      ],
      testing: [
        'GET /test - Admin survey routes test'
      ]
    },
    adminNote: 'All routes require admin or super_admin role',
    timestamp: new Date().toISOString()
  });
});

// Error handler
router.use((error, req, res, next) => {
  console.error('❌ Admin survey route error:', {
    error: error.message,
    path: req.path,
    method: req.method,
    user: req.user?.username || 'unauthenticated',
    userRole: req.user?.role,
    timestamp: new Date().toISOString()
  });
  
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Admin survey operation error',
    path: req.path,
    method: req.method,
    userRole: req.user?.role,
    timestamp: new Date().toISOString()
  });
});

if (process.env.NODE_ENV === 'development') {
  console.log('🔐 Admin survey routes loaded: question management, approval, analytics');
}

export default router;




//2nd copy 

// // ikootaapi/routes/surveyAdminRoutes.js
// // SURVEY ADMIN ROUTES - Admin survey management
// // Handles survey approval, question management, logs, and analytics

// import express from 'express';
// import {
//   getSurveyLogs,
//   approveSurvey,
//   bulkApproveSurveys,
//   updateQuestionLabels,
//   getSurveyAnalytics,
//   exportSurveyData,
//   deleteSurveyLog,
//   getSurveyDetails
// } from '../controllers/surveyAdminControllers.js';
// import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';
// import { validateSurveyApproval } from '../middleware/validationMiddleware.js';

// const router = express.Router();

// // ===============================================
// // MIDDLEWARE - Require admin for all routes
// // ===============================================
// router.use(authenticateToken);
// router.use(requireAdmin);

// // ===============================================
// // SURVEY LOGS & ANALYTICS
// // ===============================================

// // GET /api/admin/survey/logs - Get all survey logs
// router.get('/logs', getSurveyLogs);

// // GET /api/admin/survey/logs/:id - Get specific survey details
// router.get('/logs/:id', getSurveyDetails);

// // GET /api/admin/survey/analytics - Get survey analytics
// router.get('/analytics', getSurveyAnalytics);

// // GET /api/admin/survey/export - Export survey data
// router.get('/export', exportSurveyData);

// // ===============================================
// // SURVEY APPROVAL & MANAGEMENT
// // ===============================================

// // PUT /api/admin/survey/approve - Approve/reject a survey
// router.put('/approve', 
//   validateSurveyApproval,
//   approveSurvey
// );

// // POST /api/admin/survey/bulk-approve - Bulk approve surveys
// router.post('/bulk-approve', 
//   validateSurveyApproval,
//   bulkApproveSurveys
// );

// // DELETE /api/admin/survey/logs/:id - Delete a survey log
// router.delete('/logs/:id', deleteSurveyLog);

// // ===============================================
// // QUESTION MANAGEMENT
// // ===============================================

// // PUT /api/admin/survey/question-labels - Update question labels
// router.put('/question-labels', updateQuestionLabels);

// // ===============================================
// // TESTING ENDPOINTS
// // ===============================================

// if (process.env.NODE_ENV === 'development') {
//   // Test endpoint for admin survey routes
//   router.get('/test', (req, res) => {
//     res.json({
//       success: true,
//       message: 'Admin survey routes working',
//       user: {
//         id: req.user?.id,
//         username: req.user?.username,
//         role: req.user?.role
//       },
//       endpoints: {
//         logs: [
//           'GET /api/admin/survey/logs',
//           'GET /api/admin/survey/logs/:id',
//           'DELETE /api/admin/survey/logs/:id'
//         ],
//         approval: [
//           'PUT /api/admin/survey/approve',
//           'POST /api/admin/survey/bulk-approve'
//         ],
//         analytics: [
//           'GET /api/admin/survey/analytics',
//           'GET /api/admin/survey/export'
//         ],
//         management: [
//           'PUT /api/admin/survey/question-labels'
//         ]
//       },
//       timestamp: new Date().toISOString()
//     });
//   });
// }

// // ===============================================
// // ERROR HANDLING
// // ===============================================

// router.use((error, req, res, next) => {
//   console.error('Admin survey route error:', error);
//   res.status(error.statusCode || 500).json({
//     success: false,
//     error: error.message || 'Admin survey operation failed',
//     ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
//   });
// });

// export default router;