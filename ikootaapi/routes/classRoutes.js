// ikootaapi/routes/classRoutes.js
// USER-FACING CLASS MANAGEMENT ROUTES
// Handles class enrollment, participation, and user class operations

import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  validateClassId,
  validatePagination,
  validateSorting,
  validateDateRange,
  validateRequestSize
} from '../middlewares/classValidation.js';
import {
  getAllClasses,
  getClassById,
  joinClass,
  leaveClass,
  getClassMembers,
  getUserClasses,
  getClassContent,
  submitClassFeedback,
  getClassAnnouncements,
  markAttendance
} from '../controllers/classControllers.js';

const router = express.Router();

// ===============================================
// GLOBAL MIDDLEWARE FOR ALL CLASS ROUTES
// ===============================================

// Apply request size validation to all routes
router.use(validateRequestSize);

// Add route logging
router.use((req, res, next) => {
  console.log(`📊 Class Route: ${req.method} ${req.originalUrl}`);
  next();
});

// ===============================================
// PUBLIC CLASS ROUTES (NO AUTH REQUIRED)
// ===============================================

/**
 * GET /api/classes/test
 * Test endpoint for class system
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Class system is working!',
    system: 'Class Management',
    version: '1.0.0',
    endpoints: {
      public: [
        'GET /api/classes - Get all public classes',
        'GET /api/classes/test - Test endpoint'
      ],
      authenticated: [
        'GET /api/classes/:id - Get specific class',
        'POST /api/classes/:id/join - Join class',
        'POST /api/classes/:id/leave - Leave class',
        'GET /api/classes/:id/members - Get class members',
        'GET /api/classes/my-classes - Get user classes'
      ]
    },
    database_tables: [
      'classes',
      'user_class_memberships',
      'class_member_counts'
    ],
    features: [
      'Class discovery and browsing',
      'Class enrollment and participation',
      'Member directory access',
      'User class dashboard',
      'Progress tracking'
    ],
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/classes
 * Get all public classes (no authentication required)
 * Supports pagination, sorting, and filtering
 */
router.get('/', validatePagination, validateSorting, getAllClasses);

// ===============================================
// AUTHENTICATED CLASS ROUTES
// ===============================================

/**
 * GET /api/classes/my-classes
 * Get classes for the authenticated user
 */
router.get('/my-classes', authenticate, validatePagination, validateSorting, getUserClasses);

/**
 * GET /api/classes/:id
 * Get specific class details
 * Requires authentication to see member-only content
 */
router.get('/:id', authenticate, validateClassId, getClassById);

/**
 * POST /api/classes/:id/join
 * Join a specific class
 * Requires authentication
 */
router.post('/:id/join', authenticate, validateClassId, joinClass);

/**
 * POST /api/classes/:id/leave
 * Leave a specific class
 * Requires authentication
 */
router.post('/:id/leave', authenticate, validateClassId, leaveClass);

/**
 * GET /api/classes/:id/members
 * Get members of a specific class
 * Requires authentication and class membership or public class
 */
router.get('/:id/members', authenticate, validateClassId, validatePagination, validateSorting, getClassMembers);

/**
 * GET /api/classes/:id/content
 * Get content associated with a specific class
 * Requires authentication and class membership
 */
router.get('/:id/content', authenticate, validateClassId, validatePagination, getClassContent);

/**
 * GET /api/classes/:id/announcements
 * Get announcements for a specific class
 * Requires authentication and class membership
 */
router.get('/:id/announcements', authenticate, validateClassId, validatePagination, getClassAnnouncements);

/**
 * POST /api/classes/:id/feedback
 * Submit feedback for a class
 * Requires authentication and class membership
 */
router.post('/:id/feedback', authenticate, validateClassId, submitClassFeedback);

/**
 * POST /api/classes/:id/attendance
 * Mark attendance for a class session
 * Requires authentication and class membership
 */
router.post('/:id/attendance', authenticate, validateClassId, markAttendance);

// ===============================================
// ADVANCED SEARCH AND FILTERING
// ===============================================

/**
 * GET /api/classes/search
 * Advanced class search with filters
 * Public endpoint with optional authentication for personalized results
 */
router.get('/search', validatePagination, validateSorting, (req, res, next) => {
  // Optional authentication - if token provided, use it, otherwise continue as public
  const token = req.headers.authorization;
  if (token) {
    authenticate(req, res, next);
  } else {
    next();
  }
}, getAllClasses);

/**
 * GET /api/classes/by-type/:type
 * Get classes by type (demographic, subject, public, special)
 * Public endpoint
 */
router.get('/by-type/:type', validatePagination, validateSorting, (req, res, next) => {
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
}, getAllClasses);

// ===============================================
// CLASS STATISTICS (PUBLIC)
// ===============================================

/**
 * GET /api/classes/stats/public
 * Get public statistics about classes
 * No authentication required
 */
router.get('/stats/public', (req, res) => {
  // This would be handled by a controller, but for now return basic stats
  res.json({
    success: true,
    message: 'Public class statistics',
    stats: {
      total_public_classes: 'Available via controller',
      active_classes: 'Available via controller',
      class_types: {
        demographic: 'Count available via controller',
        subject: 'Count available via controller',
        public: 'Count available via controller',
        special: 'Count available via controller'
      }
    },
    note: 'Full statistics available through class controller',
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// USER PROGRESS AND ACTIVITY
// ===============================================

/**
 * GET /api/classes/my-progress
 * Get user's progress across all their classes
 * Requires authentication
 */
router.get('/my-progress', authenticate, validateDateRange, (req, res) => {
  // This would be handled by a controller
  res.json({
    success: true,
    message: 'User class progress',
    user_id: req.user.id,
    progress: {
      total_classes_joined: 'Available via controller',
      active_classes: 'Available via controller',
      completed_classes: 'Available via controller',
      attendance_rate: 'Available via controller'
    },
    note: 'Full progress data available through class controller',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/classes/my-activity
 * Get user's recent class activity
 * Requires authentication
 */
router.get('/my-activity', authenticate, validatePagination, (req, res) => {
  res.json({
    success: true,
    message: 'User class activity',
    user_id: req.user.id,
    activity: {
      recent_joins: 'Available via controller',
      recent_participation: 'Available via controller',
      upcoming_events: 'Available via controller'
    },
    note: 'Full activity data available through class controller',
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// CLASS RECOMMENDATIONS
// ===============================================

/**
 * GET /api/classes/recommendations
 * Get personalized class recommendations for user
 * Requires authentication
 */
router.get('/recommendations', authenticate, validatePagination, (req, res) => {
  res.json({
    success: true,
    message: 'Personalized class recommendations',
    user_id: req.user.id,
    recommendations: {
      based_on_interests: 'Available via controller',
      popular_classes: 'Available via controller',
      similar_users: 'Available via controller'
    },
    note: 'Full recommendations available through class controller',
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// ERROR HANDLING MIDDLEWARE
// ===============================================

/**
 * Handle class-specific errors
 */
router.use((error, req, res, next) => {
  console.error('🚨 Class Route Error:', error.message);
  
  // Handle specific class errors
  if (error.code === 'CLASS_NOT_FOUND') {
    return res.status(404).json({
      success: false,
      error: 'Class not found',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
  
  if (error.code === 'CLASS_FULL') {
    return res.status(409).json({
      success: false,
      error: 'Class is full',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
  
  if (error.code === 'ALREADY_MEMBER') {
    return res.status(409).json({
      success: false,
      error: 'Already a member',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
  
  if (error.code === 'NOT_MEMBER') {
    return res.status(403).json({
      success: false,
      error: 'Not a class member',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
  
  if (error.code === 'ACCESS_DENIED') {
    return res.status(403).json({
      success: false,
      error: 'Access denied',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
  
  // Pass to global error handler
  next(error);
});

// ===============================================
// 404 HANDLER FOR CLASS ROUTES
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
        'GET /api/classes/by-type/:type - Get classes by type',
        'GET /api/classes/stats/public - Public statistics'
      ],
      authenticated: [
        'GET /api/classes/my-classes - Get user classes',
        'GET /api/classes/:id - Get specific class',
        'POST /api/classes/:id/join - Join class',
        'POST /api/classes/:id/leave - Leave class',
        'GET /api/classes/:id/members - Get class members',
        'GET /api/classes/:id/content - Get class content',
        'GET /api/classes/:id/announcements - Get announcements',
        'POST /api/classes/:id/feedback - Submit feedback',
        'POST /api/classes/:id/attendance - Mark attendance',
        'GET /api/classes/my-progress - Get user progress',
        'GET /api/classes/my-activity - Get user activity',
        'GET /api/classes/recommendations - Get recommendations'
      ]
    },
    note: 'For admin class management, use /api/admin/classes/*',
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// EXPORT ROUTER
// ===============================================

export default router;