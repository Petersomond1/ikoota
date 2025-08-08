// ikootaapi/routes/classRoutes.js
// CLASS MANAGEMENT ROUTES
// Class enrollment, content access, and participation

import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';

// Import class controllers
import {
  getAllClasses,
  getClassById,
  getClassContent,
  getClassParticipants,
  joinClass,
  leaveClass,
  assignUserToClass,
  getAvailableClasses,
  getUserClasses,
  getClassSchedule
} from '../controllers/classControllers.js';

const router = express.Router();

// ===============================================
// CLASS DISCOVERY & ACCESS
// ===============================================

// GET /classes - Get all available classes
router.get('/', getAllClasses);

// GET /classes/available - Get classes available to user
router.get('/available', authenticate, getAvailableClasses);

// GET /classes/my-classes - Get user's enrolled classes
router.get('/my-classes', authenticate, getUserClasses);

// GET /classes/:id - Get specific class details
router.get('/:id', authenticate, getClassById);

// ===============================================
// CLASS CONTENT ACCESS
// ===============================================

// GET /classes/:id/content - Get class content
router.get('/:id/content', authenticate, getClassContent);

// GET /classes/:id/participants - Get class participants
router.get('/:id/participants', authenticate, getClassParticipants);

// GET /classes/:id/schedule - Get class schedule
router.get('/:id/schedule', authenticate, getClassSchedule);

// ===============================================
// CLASS ENROLLMENT
// ===============================================

// POST /classes/:id/join - Join a class
router.post('/:id/join', authenticate, joinClass);

// POST /classes/:id/leave - Leave a class
router.post('/:id/leave', authenticate, leaveClass);

// POST /classes/assign - Assign user to class (legacy compatibility)
router.post('/assign', authenticate, assignUserToClass);

// ===============================================
// CLASS INTERACTION
// ===============================================

// POST /classes/:id/attendance - Mark attendance
router.post('/:id/attendance', authenticate, async (req, res) => {
  res.json({
    success: true,
    message: 'Class attendance endpoint - implement with class service',
    classId: req.params.id,
    timestamp: new Date().toISOString()
  });
});

// GET /classes/:id/progress - Get user's progress in class
router.get('/:id/progress', authenticate, async (req, res) => {
  res.json({
    success: true,
    message: 'Class progress endpoint - implement with class service',
    classId: req.params.id,
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// CLASS FEEDBACK
// ===============================================

// POST /classes/:id/feedback - Submit class feedback
router.post('/:id/feedback', authenticate, async (req, res) => {
  res.json({
    success: true,
    message: 'Class feedback endpoint - implement with class service',
    classId: req.params.id,
    timestamp: new Date().toISOString()
  });
});

// GET /classes/:id/feedback - Get class feedback (for instructors)
router.get('/:id/feedback', authenticate, async (req, res) => {
  res.json({
    success: true,
    message: 'Get class feedback endpoint - implement with class service',
    classId: req.params.id,
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// TESTING ENDPOINTS
// ===============================================

// Class system test
router.get('/test', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Class routes are working!',
    timestamp: new Date().toISOString(),
    user: {
      id: req.user?.id,
      username: req.user?.username,
      membershipStage: req.user?.membership_stage
    },
    availableOperations: [
      'view classes',
      'join/leave classes',
      'access content',
      'track progress'
    ],
    endpoint: '/api/classes/test'
  });
});

// ===============================================
// ERROR HANDLING
// ===============================================

// 404 handler
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Class route not found',
    path: req.path,
    method: req.method,
    availableRoutes: {
      discovery: [
        'GET / - Get all available classes',
        'GET /available - Get classes available to user',
        'GET /my-classes - Get user\'s enrolled classes',
        'GET /:id - Get specific class details'
      ],
      content: [
        'GET /:id/content - Get class content',
        'GET /:id/participants - Get class participants',
        'GET /:id/schedule - Get class schedule'
      ],
      enrollment: [
        'POST /:id/join - Join a class',
        'POST /:id/leave - Leave a class',
        'POST /assign - Assign user to class'
      ],
      interaction: [
        'POST /:id/attendance - Mark attendance',
        'GET /:id/progress - Get user progress'
      ],
      feedback: [
        'POST /:id/feedback - Submit class feedback',
        'GET /:id/feedback - Get class feedback'
      ],
      testing: [
        'GET /test - Class routes test'
      ]
    },
    timestamp: new Date().toISOString()
  });
});

// Error handler
router.use((error, req, res, next) => {
  console.error('❌ Class route error:', {
    error: error.message,
    path: req.path,
    method: req.method,
    user: req.user?.username || 'unauthenticated',
    timestamp: new Date().toISOString()
  });
  
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Class operation error',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

if (process.env.NODE_ENV === 'development') {
  console.log('🎓 Class routes loaded: enrollment, content access, participation');
}

export default router;