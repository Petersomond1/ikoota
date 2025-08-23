// ikootaapi/routes/classRoutes.js
// COMPLETE REBUILD USING EXACT MEMBERSHIP ROUTES PATTERNS
// Simple middleware setup, consistent route structure, proper error handling

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  validateClassId,
  validatePagination,
  validateSorting,
  validateDateRange,
  validateRequestSize
} from '../middleware/classValidation.js';
import * as classController from '../controllers/classControllers.js';

const router = express.Router();

// ===============================================
// GLOBAL MIDDLEWARE (FOLLOWING MEMBERSHIP PATTERN)
// ===============================================

// Apply request size validation to all routes
router.use(validateRequestSize);

// Add route logging middleware
router.use((req, res, next) => {
  console.log(`📊 Class Route: ${req.method} ${req.originalUrl}`);
  next();
});

// ===============================================
// PUBLIC CLASS ROUTES
// ===============================================

/**
 * GET /api/classes/test
 * Test endpoint for class system
 */
router.get('/test', classController.testClassRoutes);

/**
 * GET /api/classes
 * Get all public classes (no authentication required)
 */
router.get('/', 
  validatePagination, 
  validateSorting, 
  classController.getAllClasses
);

// ===============================================
// AUTHENTICATED CLASS ROUTES  
// ===============================================

/**
 * GET /api/classes/my-classes
 * Get classes for the authenticated user
 */
router.get('/my-classes',
  authenticate,
  validatePagination,
  validateSorting,
  classController.getUserClasses
);

/**
 * GET /api/classes/recommendations
 * Get personalized class recommendations
 */
router.get('/recommendations',
  authenticate,
  validatePagination,
  classController.getClassRecommendations
);

/**
 * GET /api/classes/my-progress
 * Get user's progress across all classes
 */
router.get('/my-progress',
  authenticate,
  validateDateRange,
  classController.getUserProgress
);

/**
 * GET /api/classes/my-activity
 * Get user's recent class activity
 */
router.get('/my-activity',
  authenticate,
  validatePagination,
  classController.getUserActivity
);

/**
 * GET /api/classes/:id
 * Get specific class details
 */
router.get('/:id',
  authenticate,
  validateClassId,
  classController.getClassById
);

/**
 * POST /api/classes/:id/join
 * Join a specific class
 */
router.post('/:id/join',
  authenticate,
  validateClassId,
  classController.joinClass
);

/**
 * POST /api/classes/:id/leave
 * Leave a specific class
 */
router.post('/:id/leave',
  authenticate,
  validateClassId,
  classController.leaveClass
);

/**
 * GET /api/classes/:id/members
 * Get members of a specific class
 */
router.get('/:id/members',
  authenticate,
  validateClassId,
  validatePagination,
  validateSorting,
  classController.getClassMembers
);

/**
 * GET /api/classes/:id/content
 * Get content for a specific class
 */
router.get('/:id/content',
  authenticate,
  validateClassId,
  validatePagination,
  classController.getClassContent
);

/**
 * GET /api/classes/:id/announcements
 * Get announcements for a specific class
 */
router.get('/:id/announcements',
  authenticate,
  validateClassId,
  validatePagination,
  classController.getClassAnnouncements
);

/**
 * POST /api/classes/:id/feedback
 * Submit feedback for a class
 */
router.post('/:id/feedback',
  authenticate,
  validateClassId,
  classController.submitClassFeedback
);

/**
 * POST /api/classes/:id/attendance
 * Mark attendance for a class session
 */
router.post('/:id/attendance',
  authenticate,
  validateClassId,
  classController.markAttendance
);

/**
 * GET /api/classes/:id/schedule
 * Get class schedule
 */
router.get('/:id/schedule',
  authenticate,
  validateClassId,
  validateDateRange,
  classController.getClassSchedule
);

/**
 * GET /api/classes/:id/progress
 * Get user's progress in specific class
 */
router.get('/:id/progress',
  authenticate,
  validateClassId,
  classController.getClassProgress
);

// ===============================================
// SEARCH ROUTES
// ===============================================

/**
 * GET /api/classes/search
 * Search classes with filters
 */
router.get('/search',
  validatePagination,
  validateSorting,
  (req, res, next) => {
    // Optional authentication - if token provided, use it
    const token = req.headers.authorization;
    if (token) {
      authenticate(req, res, next);
    } else {
      next();
    }
  },
  classController.getAllClasses
);

/**
 * GET /api/classes/by-type/:type
 * Get classes by type
 */
router.get('/by-type/:type',
  validatePagination,
  validateSorting,
  (req, res, next) => {
    const { type } = req.params;
    const allowedTypes = ['demographic', 'subject', 'public', 'special'];
    
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid class type',
        provided: type,
        allowed: allowedTypes,
        timestamp: new Date().toISOString()
      });
    }
    
    req.query.class_type = type;
    next();
  },
  classController.getAllClasses
);

// ===============================================
// ERROR HANDLING MIDDLEWARE
// ===============================================

/**
 * Handle class-specific errors
 */
router.use((error, req, res, next) => {
  console.error('🚨 Class Route Error:', error.message);
  
  // Handle specific error types
  if (error.message.includes('not found')) {
    return res.status(404).json({
      success: false,
      error: 'Resource not found',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
  
  if (error.message.includes('already')) {
    return res.status(409).json({
      success: false,
      error: 'Conflict',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
  
  if (error.message.includes('full')) {
    return res.status(409).json({
      success: false,
      error: 'Class is full',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
  
  if (error.message.includes('access') || error.message.includes('permission')) {
    return res.status(403).json({
      success: false,
      error: 'Access denied',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
  
  // Generic error response
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// 404 HANDLER
// ===============================================

router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Class endpoint not found',
    path: req.originalUrl,
    method: req.method,
    available_endpoints: {
      public: [
        'GET /api/classes - Get all public classes',
        'GET /api/classes/test - Test endpoint',
        'GET /api/classes/search - Search classes',
        'GET /api/classes/by-type/:type - Get classes by type'
      ],
      authenticated: [
        'GET /api/classes/my-classes - Get user classes',
        'GET /api/classes/recommendations - Get recommendations',
        'GET /api/classes/my-progress - Get user progress',
        'GET /api/classes/my-activity - Get user activity',
        'GET /api/classes/:id - Get specific class',
        'POST /api/classes/:id/join - Join class',
        'POST /api/classes/:id/leave - Leave class',
        'GET /api/classes/:id/members - Get class members',
        'GET /api/classes/:id/content - Get class content',
        'GET /api/classes/:id/announcements - Get announcements',
        'POST /api/classes/:id/feedback - Submit feedback',
        'POST /api/classes/:id/attendance - Mark attendance',
        'GET /api/classes/:id/schedule - Get class schedule',
        'GET /api/classes/:id/progress - Get class progress'
      ]
    },
    timestamp: new Date().toISOString()
  });
});

export default router;



