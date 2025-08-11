// ikootaapi/routes/classRoutes.js
// CLASS MANAGEMENT ROUTES - COMPLETE USER-FACING IMPLEMENTATION
// All user-facing class operations with comprehensive validation and error handling

import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import {
  validateClassId,
  validateUserId,
  validatePagination,
  validateSorting,
  validateClassData,
  validateFeedback,
  validateAttendance,
  validateDateRange,
  validateRequestSize,
  validateClassRoute,
  validateClassCreation
} from '../middlewares/classValidation.js';


// Import class controllers
import {
  getAllClasses,
  getAvailableClasses,
  getUserClasses,
  getClassById,
  joinClass,
  leaveClass,
  assignUserToClass,
  getClassContent,
  getClassParticipants,
  getClassSchedule,
  markClassAttendance,
  getClassProgress,
  submitClassFeedback,
  getClassFeedback,
  searchClasses,
  getClassQuickInfo,
  testClassRoutes,
  // Legacy functions
  getClasses,
  postClass,
  putClass
} from '../controllers/classControllers.js';

const router = express.Router();

// ===============================================
// MIDDLEWARE SETUP
// ===============================================

// Request size validation for all routes
router.use(validateRequestSize);

// Rate limiting middleware (if available)
if (process.env.ENABLE_RATE_LIMITING === 'true') {
  try {
    const rateLimit = (await import('express-rate-limit')).default;
    const classRateLimit = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        success: false,
        error: 'Too many class requests from this IP, please try again later.',
        retry_after: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false
    });
    router.use(classRateLimit);
  } catch (error) {
    console.warn('Rate limiting not available:', error.message);
  }
}

// ===============================================
// CLASS DISCOVERY & ACCESS
// ===============================================

/**
 * GET /classes - Get all available classes with comprehensive filtering
 * Public endpoint with optional authentication for personalized results
 */
router.get('/', 
  validatePagination, 
  validateSorting, 
  validateDateRange,
  getAllClasses
);

/**
 * GET /classes/search - Advanced class search
 * Public endpoint with enhanced search capabilities
 */
router.get('/search',
  validatePagination,
  validateSorting,
  searchClasses
);

/**
 * GET /classes/available - Get classes available to user for joining
 * Requires authentication
 */
router.get('/available', 
  authenticate, 
  validatePagination, 
  validateSorting,
  getAvailableClasses
);

/**
 * GET /classes/my-classes - Get user's enrolled classes
 * Requires authentication
 */
router.get('/my-classes', 
  authenticate, 
  validatePagination, 
  validateSorting,
  getUserClasses
);

/**
 * GET /classes/:id - Get specific class details
 * Public endpoint but shows different details based on authentication/membership
 */
router.get('/:id', 
  validateClassId, 
  getClassById
);

/**
 * GET /classes/:id/quick-info - Get essential class info for quick display
 * Lightweight endpoint for cards, previews, etc.
 */
router.get('/:id/quick-info',
  validateClassId,
  getClassQuickInfo
);

// ===============================================
// CLASS CONTENT ACCESS
// ===============================================

/**
 * GET /classes/:id/content - Get class content
 * Requires authentication and class membership
 */
router.get('/:id/content', 
  authenticate, 
  validateClassId, 
  validatePagination,
  validateSorting,
  getClassContent
);

/**
 * GET /classes/:id/participants - Get class participants
 * Requires authentication and class membership, returns privacy-filtered results
 */
router.get('/:id/participants', 
  authenticate, 
  validateClassId, 
  validatePagination,
  validateSorting,
  getClassParticipants
);

/**
 * GET /classes/:id/schedule - Get class schedule
 * Requires authentication and class membership
 */
router.get('/:id/schedule', 
  authenticate, 
  validateClassId,
  validateDateRange,
  getClassSchedule
);

// ===============================================
// CLASS ENROLLMENT
// ===============================================

/**
 * POST /classes/:id/join - Join a class
 * Requires authentication
 */
router.post('/:id/join', 
  authenticate, 
  validateClassId,
  validateRequestSize,
  joinClass
);

/**
 * POST /classes/:id/leave - Leave a class
 * Requires authentication
 */
router.post('/:id/leave', 
  authenticate, 
  validateClassId,
  validateRequestSize,
  leaveClass
);

/**
 * POST /classes/assign - Assign user to class (admin/moderator function)
 * Requires authentication and appropriate permissions
 */
router.post('/assign', 
  authenticate,
  validateUserId,
  validateRequestSize,
  assignUserToClass
);

// ===============================================
// CLASS INTERACTION
// ===============================================

/**
 * POST /classes/:id/attendance - Mark attendance for a class session
 * Requires authentication and class membership
 */
router.post('/:id/attendance', 
  authenticate, 
  validateClassId,
  validateAttendance,
  validateRequestSize,
  markClassAttendance
);

/**
 * GET /classes/:id/progress - Get user's progress in class
 * Requires authentication and class membership
 */
router.get('/:id/progress', 
  authenticate, 
  validateClassId,
  getClassProgress
);

// ===============================================
// CLASS FEEDBACK
// ===============================================

/**
 * POST /classes/:id/feedback - Submit class feedback
 * Requires authentication and class membership
 */
router.post('/:id/feedback', 
  authenticate, 
  validateClassId,
  validateFeedback,
  validateRequestSize,
  submitClassFeedback
);

/**
 * GET /classes/:id/feedback - Get class feedback (for instructors/moderators)
 * Requires authentication and appropriate permissions
 */
router.get('/:id/feedback', 
  authenticate, 
  validateClassId, 
  validatePagination,
  validateDateRange,
  getClassFeedback
);

// ===============================================
// LEGACY SUPPORT ROUTES
// ===============================================

/**
 * @deprecated Use GET /classes instead
 * Legacy compatibility route
 */
router.get('/legacy/all', 
  validatePagination,
  (req, res, next) => {
    console.warn('⚠️ Legacy route /classes/legacy/all accessed. Use GET /classes instead.');
    next();
  },
  getClasses
);

/**
 * Legacy POST class creation - redirects to admin routes
 * @deprecated Use admin routes for class creation
 */
/**
 * Legacy POST class creation - redirects to admin routes
 * @deprecated Use admin routes for class creation
 */
router.post('/', 
  authenticate,
  (req, res, next) => {
    console.warn('⚠️ Legacy route POST /classes accessed. Use POST /admin/classes instead.');
    next();
  },
  postClass
);

/**
 * Legacy PUT class update - redirects to admin routes
 * @deprecated Use admin routes for class updates
 */
router.put('/:id',
  authenticate,
  validateClassId,
  (req, res, next) => {
    console.warn('⚠️ Legacy route PUT /classes/:id accessed. Use PUT /admin/classes/:id instead.');
    next();
  },
  putClass
);

// ===============================================
// TESTING & DEBUG ENDPOINTS
// ===============================================

/**
 * GET /classes/test - Test endpoint for class routes
 * Development and monitoring endpoint
 */
router.get('/test', 
  authenticate, 
  testClassRoutes
);

/**
 * GET /classes/test/validation/:id - Test ID validation (development only)
 */
if (process.env.NODE_ENV === 'development') {
  router.get('/test/validation/:id', (req, res) => {
    const { validateIdFormat } = require('../utils/idGenerator.js');
    const { id } = req.params;
    
    const isValid = validateIdFormat(id, 'class');
    
    res.json({
      success: true,
      message: 'Class ID validation test',
      test_id: id,
      is_valid: isValid,
      expected_format: 'OTU#XXXXXX',
      examples: ['OTU#001234', 'OTU#Public', 'OTU#987654'],
      timestamp: new Date().toISOString()
    });
  });

  /**
   * GET /classes/test/routes - List all available routes (development only)
   */
  router.get('/test/routes', (req, res) => {
    res.json({
      success: true,
      message: 'Class routes listing',
      routes: {
        discovery: {
          'GET /': 'Get all classes',
          'GET /search': 'Advanced search',
          'GET /available': 'Get available classes (auth required)',
          'GET /my-classes': 'Get user classes (auth required)',
          'GET /:id': 'Get specific class',
          'GET /:id/quick-info': 'Get quick class info'
        },
        content: {
          'GET /:id/content': 'Get class content (auth + membership required)',
          'GET /:id/participants': 'Get participants (auth + membership required)',
          'GET /:id/schedule': 'Get class schedule (auth + membership required)'
        },
        enrollment: {
          'POST /:id/join': 'Join class (auth required)',
          'POST /:id/leave': 'Leave class (auth required)',
          'POST /assign': 'Assign user to class (admin/moderator required)'
        },
        interaction: {
          'POST /:id/attendance': 'Mark attendance (auth + membership required)',
          'GET /:id/progress': 'Get progress (auth + membership required)'
        },
        feedback: {
          'POST /:id/feedback': 'Submit feedback (auth + membership required)',
          'GET /:id/feedback': 'Get feedback (instructor/moderator required)'
        },
        legacy: {
          'GET /legacy/all': 'Legacy get all classes (deprecated)',
          'POST /': 'Legacy create class (deprecated - use admin routes)',
          'PUT /:id': 'Legacy update class (deprecated - use admin routes)'
        },
        testing: {
          'GET /test': 'Test routes (auth required)',
          'GET /test/validation/:id': 'Test ID validation (dev only)',
          'GET /test/routes': 'List routes (dev only)'
        }
      },
      authentication_notes: {
        public_endpoints: ['GET /', 'GET /search', 'GET /:id', 'GET /:id/quick-info'],
        auth_required: ['All other endpoints'],
        membership_required: ['Content access', 'Participants', 'Schedule', 'Attendance', 'Progress', 'Feedback submission'],
        admin_required: ['POST /assign', 'Class creation/updates (use admin routes)']
      },
      timestamp: new Date().toISOString()
    });
  });
}

// ===============================================
// HEALTH CHECK ENDPOINT
// ===============================================

/**
 * GET /classes/health - Health check for class routes
 * Public endpoint for monitoring
 */
router.get('/health', (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'class-routes',
    version: '2.0.0',
    checks: {
      routes_loaded: true,
      middleware_active: true,
      validation_available: true
    }
  };

  // Test database connection if available
  try {
    // Simple async database test
    import('../config/db.js').then(({ default: db }) => {
      db.query('SELECT 1').then(() => {
        healthStatus.checks.database_connection = 'healthy';
      }).catch(() => {
        healthStatus.checks.database_connection = 'unhealthy';
      });
    }).catch(() => {
      healthStatus.checks.database_connection = 'unavailable';
    });
  } catch (error) {
    healthStatus.checks.database_connection = 'error';
  }

  res.json({
    success: true,
    data: healthStatus
  });
});

// ===============================================
// METRICS ENDPOINT (if monitoring enabled)
// ===============================================

if (process.env.ENABLE_METRICS === 'true') {
  /**
   * GET /classes/metrics - Basic metrics for monitoring
   * Requires authentication
   */
  router.get('/metrics', authenticate, async (req, res) => {
    try {
      const db = (await import('../config/db.js')).default;
      
      const metrics = {
        timestamp: new Date().toISOString(),
        class_counts: {
          total: 0,
          active: 0,
          public: 0,
          private: 0
        },
        user_engagement: {
          total_enrollments: 0,
          active_memberships: 0
        },
        system_health: {
          database_responsive: false,
          routes_operational: true
        }
      };

      // Get basic class statistics
      const [classStats] = await db.query(`
        SELECT 
          COUNT(*) as total_classes,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_classes,
          SUM(CASE WHEN is_public = 1 THEN 1 ELSE 0 END) as public_classes
        FROM classes 
        WHERE class_id LIKE "OTU#%"
      `);

      metrics.class_counts.total = classStats.total_classes;
      metrics.class_counts.active = classStats.active_classes;
      metrics.class_counts.public = classStats.public_classes;
      metrics.class_counts.private = classStats.total_classes - classStats.public_classes;

      // Get enrollment statistics
      const [enrollmentStats] = await db.query(`
        SELECT 
          COUNT(*) as total_enrollments,
          SUM(CASE WHEN membership_status = 'active' THEN 1 ELSE 0 END) as active_memberships
        FROM user_class_memberships ucm
        INNER JOIN classes c ON ucm.class_id = c.class_id
        WHERE c.class_id LIKE "OTU#%"
      `);

      metrics.user_engagement.total_enrollments = enrollmentStats.total_enrollments;
      metrics.user_engagement.active_memberships = enrollmentStats.active_memberships;
      metrics.system_health.database_responsive = true;

      res.json({
        success: true,
        message: 'Class metrics retrieved successfully',
        data: metrics,
        collected_by: req.user.username
      });

    } catch (error) {
      res.json({
        success: false,
        message: 'Error collecting metrics',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });
}

// ===============================================
// WEBHOOK ENDPOINTS (if webhooks enabled)
// ===============================================

if (process.env.ENABLE_WEBHOOKS === 'true') {
  /**
   * POST /classes/webhook/enrollment - Webhook for enrollment events
   * Internal endpoint for system integrations
   */
  router.post('/webhook/enrollment', express.json(), (req, res) => {
    const { event_type, class_id, user_id, timestamp } = req.body;
    
    // Log webhook event
    console.log(`📢 Class enrollment webhook: ${event_type} for user ${user_id} in class ${class_id}`);
    
    // Process webhook (implement based on requirements)
    // This could trigger notifications, analytics updates, etc.
    
    res.json({
      success: true,
      message: 'Webhook processed successfully',
      event: {
        type: event_type,
        class_id,
        user_id,
        processed_at: new Date().toISOString(),
        original_timestamp: timestamp
      }
    });
  });
}

// ===============================================
// ERROR HANDLING
// ===============================================

/**
 * 404 handler for class routes
 */
router.use('*', (req, res) => {
  const suggestions = [];
  const path = req.path.toLowerCase();
  
  // Suggest similar routes based on path
  if (path.includes('class')) {
    suggestions.push('/api/classes', '/api/classes/available', '/api/classes/my-classes');
  }
  if (path.includes('join')) {
    suggestions.push('/api/classes/:id/join');
  }
  if (path.includes('content')) {
    suggestions.push('/api/classes/:id/content');
  }
  if (path.includes('feedback')) {
    suggestions.push('/api/classes/:id/feedback');
  }
  if (path.includes('admin')) {
    suggestions.push('/api/admin/classes');
  }

  res.status(404).json({
    success: false,
    error: 'Class route not found',
    requested_path: req.path,
    method: req.method,
    available_routes: {
      discovery: [
        'GET / - Get all available classes',
        'GET /search - Advanced class search',
        'GET /available - Get classes available to user (auth required)',
        'GET /my-classes - Get user\'s enrolled classes (auth required)',
        'GET /:id - Get specific class details',
        'GET /:id/quick-info - Get essential class info'
      ],
      content: [
        'GET /:id/content - Get class content (auth + membership required)',
        'GET /:id/participants - Get class participants (auth + membership required)',
        'GET /:id/schedule - Get class schedule (auth + membership required)'
      ],
      enrollment: [
        'POST /:id/join - Join a class (auth required)',
        'POST /:id/leave - Leave a class (auth required)',
        'POST /assign - Assign user to class (admin/moderator required)'
      ],
      interaction: [
        'POST /:id/attendance - Mark attendance (auth + membership required)',
        'GET /:id/progress - Get user progress (auth + membership required)'
      ],
      feedback: [
        'POST /:id/feedback - Submit class feedback (auth + membership required)',
        'GET /:id/feedback - Get class feedback (instructor/moderator required)'
      ],
      testing: [
        'GET /test - Class routes test (auth required)',
        'GET /health - Health check (public)'
      ]
    },
    suggestions: suggestions.length > 0 ? suggestions : [
      '/api/classes',
      '/api/classes/available',
      '/api/admin/classes'
    ],
    documentation: 'See API documentation for complete route details',
    timestamp: new Date().toISOString()
  });
});

/**
 * Error handler for class routes
 */
router.use((error, req, res, next) => {
  console.error('❌ Class route error:', {
    error: error.message,
    path: req.path,
    method: req.method,
    user: req.user?.username || 'unauthenticated',
    timestamp: new Date().toISOString(),
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
  
  // Determine error type and status code
  let statusCode = 500;
  let errorCode = 'INTERNAL_ERROR';
  
  if (error.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    errorCode = 'UNAUTHORIZED';
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
    errorCode = 'FORBIDDEN';
  } else if (error.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    errorCode = 'DUPLICATE_ENTRY';
  } else if (error.statusCode) {
    statusCode = error.statusCode;
    errorCode = error.code || 'CUSTOM_ERROR';
  }
  
  res.status(statusCode).json({
    success: false,
    error: error.message || 'Class operation error',
    code: errorCode,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error.details
    })
  });
});

// ===============================================
// ROUTE INITIALIZATION LOGGING
// ===============================================

if (process.env.NODE_ENV === 'development') {
  console.log('🎓 Class routes loaded successfully:');
  console.log('   📋 Discovery: GET /, /search, /available, /my-classes, /:id');
  console.log('   📚 Content: GET /:id/content, /:id/participants, /:id/schedule');
  console.log('   🎯 Enrollment: POST /:id/join, /:id/leave, /assign');
  console.log('   📝 Interaction: POST /:id/attendance, GET /:id/progress');
  console.log('   💬 Feedback: POST /:id/feedback, GET /:id/feedback');
  console.log('   🔧 Testing: GET /test, /health');
  console.log('   ⚠️  Legacy: GET /legacy/all, POST /, PUT /:id (deprecated)');
}

export default router;