import express from 'express';
import authRoutes from './authRoutes.js';
import surveyRoutes from './surveyRoutes.js';
import teachingsRoutes from './teachingsRoutes.js';
import userRoutes from './userRoutes.js';
import chatRoutes from './chatRoutes.js';
import adminRoutes from './adminRoutes.js';
import classRoutes from './classRoutes.js';
import commentRoutes from './commentRoutes.js';
import communicationRoutes from './communicationRoutes.js';
import membershipRoutes from './membershipRoutes.js';
import identityRoutes from './identityRoutes.js';


const router = express.Router();

// Health check endpoint with enhanced information
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: 'Connected', // You could add actual DB health check here
    features: {
      combinedContent: true,
      prefixedIds: true,
      enhancedSurveys: true,
      userManagement: true,
      communicationSystem: true,
      enhancedComments: true
    }
  });
});

// Debug middleware to log all routes
router.use((req, res, next) => {
  console.log(`🔍 ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// API routes with enhanced organization
router.use('/auth', authRoutes);
router.use('/survey', surveyRoutes);
router.use('/teachings', teachingsRoutes);
router.use('/users', userRoutes);
router.use('/chats', chatRoutes);
router.use('/admin', adminRoutes);
router.use('/classes', classRoutes);
router.use('/comments', commentRoutes);
router.use('/communication', communicationRoutes);
router.use('/membership', membershipRoutes);
router.use('/identity', identityRoutes);



// Add specific debugging for membership routes
router.use('/membership', (req, res, next) => {
  console.log(`🎯 Membership route hit: ${req.method} ${req.path}`);
  next();
});

// Add debugging to show what's mounted
console.log('📋 Routes mounted:');
console.log('  - /api/auth');
console.log('  - /api/membership');
console.log('  - /api/survey');
console.log('  - /api/teachings');
console.log('  - /api/users');
console.log('  - /api/chats');
console.log('  - /api/comments');
console.log('  - /api/communication');
console.log('  - /api/admin');
console.log('  - /api/classes');
console.log('  - /api/identity');


// Enhanced API documentation endpoint

router.use('/docs', (req, res) => {
  res.json({
    success: true,
    message: 'API Documentation',
    version: process.env.API_VERSION || '1.0.0',
    baseUrl: `${req.protocol}://${req.get('host')}/api`,
    endpoints: {
      auth: '/api/auth - Authentication',
      membership: '/api/membership - Membership management',  // Updated
      survey: '/api/survey - Survey management',
      teachings: '/api/teachings - Teaching content',
      users: '/api/users - User management',
      chats: '/api/chats - Chat content',
      comments: '/api/comments - Comment management',
      communication: '/api/communication - Email & SMS',
      admin: '/api/admin - Administrative functions',
      classes: '/api/classes - Class management',
      identity: '/api/identity - Identity management'
    }
  });
});

router.get('/docs', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API Documentation',
    version: process.env.API_VERSION || '1.0.0',
    baseUrl: `${req.protocol}://${req.get('host')}/api`,
    endpoints: {
      auth: {
        path: '/api/auth',
        description: 'Authentication and authorization',
        methods: ['POST /login', 'POST /register', 'POST /logout', 'POST /refresh']
      },

      membership: {
    path: '/api/membership', 
    description: 'Membership application and management',
    methods: [
      'POST /auth/send-verification',
      'POST /auth/register', 
      'GET /dashboard',
      'GET /survey/check-status',
      'POST /survey/submit-application',
      'GET /admin/pending-applications (admin)',
      'GET /admin/analytics (admin)'
    ]
  },
      survey: {
        path: '/api/survey',
        description: 'Survey management and submissions',
        methods: [
          'GET /questions',
          'POST /submit',
          'GET /logs (admin)',
          'PUT /approve (admin)',
          'GET /stats (admin)',
          'GET /my-surveys'
        ]
      },
      teachings: {
        path: '/api/teachings',
        description: 'Teaching content management',
        methods: [
          'GET /',
          'POST /',
          'GET /search',
          'GET /stats',
          'GET /user',
          'GET /prefixed/:id',
          'PUT /:id',
          'DELETE /:id'
        ]
      },
      users: {
        path: '/api/users',
        description: 'User management and profiles',
        methods: [
          'GET /profile',
          'PUT /profile',
          'GET / (admin)',
          'GET /stats (admin)',
          'GET /:id/activity',
          'PUT /role (admin)',
          'DELETE /:id (super_admin)'
        ]
      },
      chats: {
        path: '/api/chats',
        description: 'Chat content management',
        methods: [
          'GET /',
          'POST /',
          'GET /combinedcontent',
          'GET /prefixed/:id',
          'PUT /:id',
          'DELETE /:id'
        ]
      },
      comments: {
        path: '/api/comments',
        description: 'Comment management and interaction',
        methods: [
          'GET /all (admin)',
          'GET /stats (admin)',
          'POST /',
          'GET /parent-comments',
          'GET /by-parents',
          'GET /user/:id',
          'GET /:commentId',
          'PUT /:commentId',
          'DELETE /:commentId',
          'POST /upload'
        ]
      },
      communication: {
        path: '/api/communication',
        description: 'Email and SMS communication system',
        methods: [
          'GET /templates',
          'GET /health (admin)',
          'GET /stats (admin)',
          'POST /email/send',
          'POST /email/bulk (admin)',
          'POST /sms/send',
          'POST /sms/bulk (admin)',
          'POST /notification'
        ]
      },
      admin: {
        path: '/api/admin',
        description: 'Administrative functions',
        methods: ['GET /dashboard', 'GET /users', 'PUT /users/:id']
      },
      classes: {
        path: '/api/classes',
        description: 'Class management',
        methods: ['GET /', 'POST /', 'PUT /:id', 'DELETE /:id']
      },
      combinedContent: {
        path: '/api/chats/combinedcontent',
        description: 'Combined chats and teachings content',
        methods: ['GET /']
      }
    },
    features: {
      authentication: 'JWT-based authentication with refresh tokens',
      authorization: 'Role-based access control (user, admin, super_admin)',
      combinedContent: 'Unified API for chats and teachings',
      prefixedIds: 'Human-readable prefixed IDs (c123, t456)',
      pagination: 'Cursor and offset-based pagination',
      search: 'Full-text search across content',
      fileUpload: 'S3-based file upload with multiple formats',
      emailNotifications: 'Automated email and SMS notifications',
      softDelete: 'Soft delete with data preservation',
      commentSystem: 'Enhanced commenting with media support',
      communicationSystem: 'Comprehensive email and SMS management',
      auditLogging: 'Activity logging and statistics'
    },
    authentication: {
      required: 'Most endpoints require authentication',
      exceptions: [
        '/api/auth/login',
        '/api/auth/register',
        '/api/survey/questions',
        '/api/health',
        '/api/docs',
        '/api/info'
      ],
      tokenFormat: 'Bearer <JWT_TOKEN>',
      refreshToken: 'Available for token renewal'
    },
    responseFormat: {
      success: {
        structure: {
          success: true,
          data: 'Response data',
          message: 'Optional success message'
        }
      },
      error: {
        structure: {
          success: false,
          error: 'Error message',
          message: 'User-friendly message'
        }
      },
      pagination: {
        structure: {
          success: true,
          data: 'Array of items',
          pagination: {
            page: 'Current page',
            limit: 'Items per page',
            total: 'Total items',
            pages: 'Total pages'
          }
        }
      }
    },
    statusCodes: {
      200: 'Success',
      201: 'Created',
      400: 'Bad Request - Invalid input',
      401: 'Unauthorized - Authentication required',
      403: 'Forbidden - Insufficient permissions',
      404: 'Not Found - Resource not found',
      500: 'Internal Server Error'
    },
    note: 'All endpoints require authentication except login, register, public survey questions, health, docs, and info'
  });
});

// Enhanced system information endpoint
router.get('/info', (req, res) => {
  res.status(200).json({
    success: true,
    system: {
      name: 'Ikoota API',
      version: process.env.API_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: 'MySQL',
      features: [
        'Combined Content API',
        'Prefixed ID System',
        'Enhanced Survey Management',
        'Role-based Authorization',
        'File Upload Support',
        'Email & SMS Notifications',
        'Advanced Comment System',
        'Communication Management',
        'Activity Logging & Statistics'
      ]
    },
    modules: {
      authentication: 'JWT-based with role management',
      content: 'Chats and teachings with combined API',
      comments: 'Rich commenting with media support',
      communication: 'Email and SMS with templates',
      surveys: 'Application and feedback management',
      users: 'Comprehensive user management',
      admin: 'Administrative controls and statistics'
    },
    statistics: {
      note: 'Use /api/users/stats, /api/teachings/stats, /api/survey/stats, /api/comments/stats, /api/communication/stats for detailed statistics'
    },
    timestamp: new Date().toISOString()
  });
});

// Enhanced 404 handler for undefined API routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `The endpoint ${req.originalUrl} does not exist`,
    suggestion: 'Check the API documentation at /api/docs',
    availableEndpoints: [
      '/api/auth - Authentication',
  '/api/membership - Membership management',  
  '/api/survey - Survey management',
  '/api/teachings - Teaching content',
  '/api/users - User management',
  '/api/chats - Chat content', 
  '/api/comments - Comment management',
  '/api/communication - Email & SMS',
  '/api/admin - Administrative functions',
  '/api/classes - Class management',
  '/api/identity - Identity management'
    ],
    documentation: '/api/docs',
    health: '/api/health',
    info: '/api/info'
  });
});

export default router;