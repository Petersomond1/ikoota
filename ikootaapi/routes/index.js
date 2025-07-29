// // ikootaapi/routes/index.js - Updated main router
// import express from 'express';

// // Import reorganized route modules
// import authRoutes from './authRoutes.js';
// import userRoutes from './userRoutes.js';
// import membershipApplicationRoutes from './membershipApplicationRoutes.js';
// import surveyRoutes from './surveyRoutes.js';
// import adminUserRoutes from './adminUserRoutes.js';
// import adminMembershipRoutes from './adminMembershipRoutes.js';
// import adminContentRoutes from './adminContentRoutes.js';
// import contentRoutes from './contentRoutes.js';
// import communicationRoutes from './communicationRoutes.js';
// import identityRoutes from './identityRoutes.js';
// import systemRoutes from './systemRoutes.js';

// const router = express.Router();

// // ===== MOUNT ROUTES IN LOGICAL ORDER =====
// console.log('🔧 Mounting reorganized API routes...');

// // System routes (health checks, info)
// router.use('/', systemRoutes);

// // Authentication (must be early for token validation)
// router.use('/auth', authRoutes);

// // User management
// router.use('/users', userRoutes);

// // Membership and applications
// router.use('/membership', membershipApplicationRoutes);
// router.use('/survey', surveyRoutes);

// // Admin routes (grouped by function)
// router.use('/admin/users', adminUserRoutes);
// router.use('/admin/membership', adminMembershipRoutes);
// router.use('/admin/content', adminContentRoutes);

// // Content and community
// router.use('/content', contentRoutes);
// router.use('/teachings', contentRoutes); // Alias for backward compatibility
// router.use('/classes', contentRoutes);   // Alias for backward compatibility
// router.use('/comments', contentRoutes);  // Alias for backward compatibility

// // Communication
// router.use('/chat', communicationRoutes);
// router.use('/communication', communicationRoutes);

// // Identity verification
// router.use('/identity', identityRoutes);

// // ===== FALLBACK 404 HANDLER =====
// router.use('*', (req, res) => {
//   console.log('❌ API route not found:', req.originalUrl);
//   res.status(404).json({
//     success: false,
//     message: 'API endpoint not found',
//     path: req.originalUrl,
//     availableRoutes: {
//       authentication: '/api/auth/*',
//       users: '/api/users/*',
//       membership: '/api/membership/*',
//       admin: '/api/admin/*',
//       content: '/api/content/*',
//       communication: '/api/chat/*',
//       identity: '/api/identity/*',
//       system: '/api/health, /api/info'
//     },
//     timestamp: new Date().toISOString()
//   });
// });

// export default router;



// ikootaapi/routes/index.js
// FIXED VERSION: Proper route mounting order

import express from 'express';

// Import all your route modules
import authRoutes from './authRoutes.js';
import membershipRoutes from './membershipRoutes.js';
import adminRoutes from './adminRoutes.js';
import surveyRoutes from './surveyRoutes.js';
import teachingsRoutes from './teachingsRoutes.js';
import userRoutes from './userRoutes.js';
import chatRoutes from './chatRoutes.js';
import commentRoutes from './commentRoutes.js';
import communicationRoutes from './communicationRoutes.js';
import classRoutes from './classRoutes.js';
import identityRoutes from './identityRoutes.js';

const router = express.Router();

// ===== CRITICAL: MOUNT ADMIN ROUTES FIRST =====
// Admin routes must come BEFORE any catch-all routes

console.log('🔧 Mounting admin routes at /admin...');
router.use('/admin', adminRoutes);

// ===== MOUNT OTHER ROUTES =====
router.use('/auth', authRoutes);
router.use('/membership', membershipRoutes);
router.use('/survey', surveyRoutes);
router.use('/teachings', teachingsRoutes);
router.use('/users', userRoutes);
router.use('/chats', chatRoutes);
router.use('/comments', commentRoutes);
router.use('/communication', communicationRoutes);
router.use('/classes', classRoutes);
router.use('/identity', identityRoutes);

// ===== HEALTH CHECK ENDPOINT =====
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ===== API INFO ENDPOINT =====
router.get('/info', (req, res) => {
  res.json({
    success: true,
    message: 'API Information',
    version: '1.0.0',
    routes: {
      admin: '/api/admin/*',
      auth: '/api/auth/*',
      membership: '/api/membership/*',
      survey: '/api/survey/*',
      teachings: '/api/teachings/*',
      users: '/api/users/*',
      chats: '/api/chats/*',
      comments: '/api/comments/*',
      communication: '/api/communication/*',
      classes: '/api/classes/*',
      identity: '/api/identity/*'
    },
    timestamp: new Date().toISOString()
  });
});

// ===== 404 HANDLER FOR API ROUTES =====
router.use('*', (req, res) => {
  console.log('❌ API route not found:', req.originalUrl);
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
    availableRoutes: [
      '/api/admin/*',
      '/api/auth/*', 
      '/api/membership/*',
      '/api/survey/*',
      '/api/health',
      '/api/info'
    ]
  });
});

export default router;



// //ikootaapi\routes\index.js
// import express from 'express';
// import authRoutes from './authRoutes.js';
// import surveyRoutes from './surveyRoutes.js';
// import teachingsRoutes from './teachingsRoutes.js';
// import userRoutes from './userRoutes.js';
// import chatRoutes from './chatRoutes.js';
// import adminRoutes from './adminRoutes.js';
// import classRoutes from './classRoutes.js';
// import commentRoutes from './commentRoutes.js';
// import communicationRoutes from './communicationRoutes.js';
// // ✅ UPDATED: Import the new modular membership routes
// import membershipRoutes from './membershipRoutes.js';  // Changed from membershipRoutes_old.js
// import identityRoutes from './identityRoutes.js';

// const router = express.Router();

// // Health check endpoint with enhanced information
// router.get('/health', (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'API is running',
//     timestamp: new Date().toISOString(),
//     version: process.env.API_VERSION || '2.0.0',  // Updated version
//     environment: process.env.NODE_ENV || 'development',
//     database: 'Connected',
//     features: {
//       modularMembership: true,  // ✅ NEW: Indicates modular architecture
//       combinedContent: true,
//       prefixedIds: true,
//       enhancedSurveys: true,
//       userManagement: true,
//       communicationSystem: true,
//       enhancedComments: true,
//       adminManagement: true,    // ✅ NEW: Enhanced admin features
//       transactionSafety: true   // ✅ NEW: Database transaction safety
//     }
//   });
// });

// // Debug middleware to log all routes
// router.use((req, res, next) => {
//   console.log(`🔍 ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
//   next();
// });

// // API routes with enhanced organization
// router.use('/auth', authRoutes);
// router.use('/survey', surveyRoutes);
// router.use('/teachings', teachingsRoutes);
// router.use('/users', userRoutes);
// router.use('/chats', chatRoutes);
// router.use('/admin', adminRoutes);
// router.use('/classes', classRoutes);
// router.use('/comments', commentRoutes);
// router.use('/communication', communicationRoutes);
// // ✅ UPDATED: Now uses the new modular membership routes
// router.use('/membership', membershipRoutes);
// router.use('/identity', identityRoutes);

// // Add specific debugging for membership routes
// router.use('/membership', (req, res, next) => {
//   console.log(`🎯 Membership route hit: ${req.method} ${req.path}`);
//   next();
// });

// // Add debugging to show what's mounted
// console.log('📋 Routes mounted:');
// console.log('  - /api/auth');
// console.log('  - /api/membership (✅ MODULAR ARCHITECTURE)');  // Updated
// console.log('  - /api/survey');
// console.log('  - /api/teachings');
// console.log('  - /api/users');
// console.log('  - /api/chats');
// console.log('  - /api/comments');
// console.log('  - /api/communication');
// console.log('  - /api/admin');
// console.log('  - /api/classes');
// console.log('  - /api/identity');

// // Enhanced API documentation endpoint
// router.use('/docs', (req, res) => {
//   res.json({
//     success: true,
//     message: 'API Documentation',
//     version: process.env.API_VERSION || '2.0.0',  // Updated version
//     baseUrl: `${req.protocol}://${req.get('host')}/api`,
//     endpoints: {
//       auth: '/api/auth - Authentication',
//       membership: '/api/membership - Modular membership management',  // Updated description
//       survey: '/api/survey - Survey management',
//       teachings: '/api/teachings - Teaching content',
//       users: '/api/users - User management',
//       chats: '/api/chats - Chat content',
//       comments: '/api/comments - Comment management',
//       communication: '/api/communication - Email & SMS',
//       admin: '/api/admin - Administrative functions',
//       classes: '/api/classes - Class management',
//       identity: '/api/identity - Identity management'
//     }
//   });
// });

// router.get('/docs', (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'API Documentation',
//     version: process.env.API_VERSION || '2.0.0',  // Updated version
//     baseUrl: `${req.protocol}://${req.get('host')}/api`,
//     endpoints: {
//       auth: {
//         path: '/api/auth',
//         description: 'Authentication and authorization',
//         methods: ['POST /send-verification', 'POST /login', 'POST /register', 'POST /logout', 'POST /refresh']
//       },
//       membership: {
//         path: '/api/membership', 
//         description: 'Modular membership application and management',  // Updated description
//         architecture: 'Modular controllers with enhanced functionality',  // ✅ NEW
//         methods: [
//           // User endpoints
//           'GET /dashboard - Enhanced user dashboard',
//           'GET /status - Comprehensive membership status',
//           'GET /survey/check-status - Survey status compatibility',
//           'POST /survey/submit-application - Submit initial application',
//           'GET /application/status - Application status check',
//           'GET /application-history - User application history',
//           'GET /permissions - User permissions check',
          
//           // Full membership endpoints
//           'GET /full-membership-status - Full membership status',
//           'POST /submit-full-membership - Submit full membership app',
//           'POST /reapply-full-membership - Reapply after decline',
          
//           // Admin endpoints (require admin role)
//           'GET /admin/pending-applications - Get pending applications',
//           'POST /approve/:userId - Approve pre-member application',
//           'POST /decline/:userId - Decline application',
//           'POST /admin/bulk-approve - Bulk approve operations',
//           'GET /admin/mentors - Available mentors',
//           'GET /admin/classes - Available classes',
//           'GET /admin/reports - Comprehensive reports',
//           'GET /admin/analytics - Advanced analytics',
//           'GET /admin/membership-overview - Admin dashboard',
//           'POST /admin/send-notification - Send notifications',
          
//           // System endpoints
//           'GET /health - System health check',
//           'GET /test-simple - Connectivity test',
//           'GET /admin/config - System configuration'
//         ],
//         features: [  // ✅ NEW: Feature list
//           'Modular architecture with 4 specialized controllers',
//           'Database transaction safety for all critical operations',
//           'Enhanced error handling with proper HTTP status codes',
//           'Comprehensive audit logging for all admin actions',
//           'Role-based access control (user, admin, super_admin)',
//           'Non-blocking email notifications',
//           'Advanced filtering and pagination',
//           'Complete pre-member → full member flow',
//           'Mentor and class assignment system',
//           'Bulk operations for admin efficiency'
//         ]
//       },
//       survey: {
//         path: '/api/survey',
//         description: 'Survey management and submissions',
//         methods: [
//           'GET /questions',
//           'POST /submit',
//           'GET /logs (admin)',
//           'PUT /approve (admin)',
//           'GET /stats (admin)',
//           'GET /my-surveys'
//         ]
//       },
//       // ... rest of your existing endpoint definitions
//       teachings: {
//         path: '/api/teachings',
//         description: 'Teaching content management',
//         methods: [
//           'GET /',
//           'POST /',
//           'GET /search',
//           'GET /stats',
//           'GET /user',
//           'GET /prefixed/:id',
//           'PUT /:id',
//           'DELETE /:id'
//         ]
//       },
//       users: {
//         path: '/api/users',
//         description: 'User management and profiles',
//         methods: [
//           'GET /profile',
//           'PUT /profile',
//           'GET / (admin)',
//           'GET /stats (admin)',
//           'GET /:id/activity',
//           'PUT /role (admin)',
//           'DELETE /:id (super_admin)'
//         ]
//       },
//       chats: {
//         path: '/api/chats',
//         description: 'Chat content management',
//         methods: [
//           'GET /',
//           'POST /',
//           'GET /combinedcontent',
//           'GET /prefixed/:id',
//           'PUT /:id',
//           'DELETE /:id'
//         ]
//       },
//       comments: {
//         path: '/api/comments',
//         description: 'Comment management and interaction',
//         methods: [
//           'GET /all (admin)',
//           'GET /stats (admin)',
//           'POST /',
//           'GET /parent-comments',
//           'GET /by-parents',
//           'GET /user/:id',
//           'GET /:commentId',
//           'PUT /:commentId',
//           'DELETE /:commentId',
//           'POST /upload'
//         ]
//       },
//       communication: {
//         path: '/api/communication',
//         description: 'Email and SMS communication system',
//         methods: [
//           'GET /templates',
//           'GET /health (admin)',
//           'GET /stats (admin)',
//           'POST /email/send',
//           'POST /email/bulk (admin)',
//           'POST /sms/send',
//           'POST /sms/bulk (admin)',
//           'POST /notification'
//         ]
//       },
//       admin: {
//         path: '/api/admin',
//         description: 'Administrative functions',
//         methods: ['GET /dashboard', 'GET /users', 'PUT /users/:id']
//       },
//       classes: {
//         path: '/api/classes',
//         description: 'Class management',
//         methods: ['GET /', 'POST /', 'PUT /:id', 'DELETE /:id']
//       }
//     },
//     // ✅ UPDATED: Enhanced features list
//     features: {
//       authentication: 'JWT-based authentication with refresh tokens',
//       authorization: 'Role-based access control (user, admin, super_admin)',
//       modularMembership: 'Modular membership architecture with specialized controllers',  // NEW
//       transactionSafety: 'Database transactions for data integrity',  // NEW
//       auditLogging: 'Comprehensive audit trails for all actions',  // NEW
//       combinedContent: 'Unified API for chats and teachings',
//       prefixedIds: 'Human-readable prefixed IDs (c123, t456)',
//       pagination: 'Cursor and offset-based pagination',
//       search: 'Full-text search across content',
//       fileUpload: 'S3-based file upload with multiple formats',
//       emailNotifications: 'Automated email and SMS notifications',
//       softDelete: 'Soft delete with data preservation',
//       commentSystem: 'Enhanced commenting with media support',
//       communicationSystem: 'Comprehensive email and SMS management',
//       enhancedErrorHandling: 'Standardized error responses with proper HTTP codes',  // NEW
//       bulkOperations: 'Efficient bulk processing for admin tasks'  // NEW
//     },
//     authentication: {
//       required: 'Most endpoints require authentication',
//       exceptions: [
//         '/api/auth/login',
//         '/api/auth/register',
//         '/api/survey/questions',
//         '/api/health',
//         '/api/docs',
//         '/api/info'
//       ],
//       tokenFormat: 'Bearer <JWT_TOKEN>',
//       refreshToken: 'Available for token renewal'
//     },
//     responseFormat: {
//       success: {
//         structure: {
//           success: true,
//           data: 'Response data',
//           message: 'Optional success message'
//         }
//       },
//       error: {
//         structure: {
//           success: false,
//           error: 'Error message',
//           message: 'User-friendly message',
//           errorType: 'Error category',  // ✅ NEW
//           errorId: 'Unique error identifier',  // ✅ NEW
//           timestamp: 'Error timestamp'  // ✅ NEW
//         }
//       },
//       pagination: {
//         structure: {
//           success: true,
//           data: 'Array of items',
//           pagination: {
//             page: 'Current page',
//             limit: 'Items per page',
//             total: 'Total items',
//             pages: 'Total pages',
//             hasMore: 'Boolean indicating more items available'  // ✅ NEW
//           }
//         }
//       }
//     },
//     statusCodes: {
//       200: 'Success',
//       201: 'Created',
//       400: 'Bad Request - Invalid input',
//       401: 'Unauthorized - Authentication required',
//       403: 'Forbidden - Insufficient permissions',
//       404: 'Not Found - Resource not found',
//       500: 'Internal Server Error',
//       503: 'Service Unavailable - Database issues'  // ✅ NEW
//     },
//     // ✅ NEW: Migration information
//     migration: {
//       version: '2.0.0',
//       architecture: 'Modular controllers with enhanced functionality',
//       improvements: [
//         'Zero functionality loss - all existing endpoints preserved',
//         'Enhanced error handling with proper HTTP status codes',
//         'Database transaction safety for critical operations',
//         'Comprehensive audit logging for admin actions',
//         'Better separation of concerns for maintainability',
//         'Non-blocking notifications for better performance'
//       ],
//       compatibility: 'Full backward compatibility maintained'
//     },
//     note: 'All endpoints require authentication except login, register, public survey questions, health, docs, and info'
//   });
// });

// // Enhanced system information endpoint
// router.get('/info', (req, res) => {
//   res.status(200).json({
//     success: true,
//     system: {
//       name: 'Ikoota API',
//       version: process.env.API_VERSION || '2.0.0',  // Updated version
//       environment: process.env.NODE_ENV || 'development',
//       database: 'MySQL',
//       architecture: 'Modular controllers with enhanced functionality',  // ✅ NEW
//       features: [
//         'Modular Membership Architecture',  // ✅ NEW
//         'Database Transaction Safety',      // ✅ NEW
//         'Enhanced Error Handling',          // ✅ NEW
//         'Comprehensive Audit Logging',      // ✅ NEW
//         'Combined Content API',
//         'Prefixed ID System',
//         'Enhanced Survey Management',
//         'Role-based Authorization',
//         'File Upload Support',
//         'Email & SMS Notifications',
//         'Advanced Comment System',
//         'Communication Management',
//         'Activity Logging & Statistics'
//       ]
//     },
//     modules: {
//       authentication: 'JWT-based with role management',
//       membership: 'Modular architecture with 4 specialized controllers',  // ✅ UPDATED
//       content: 'Chats and teachings with combined API',
//       comments: 'Rich commenting with media support',
//       communication: 'Email and SMS with templates',
//       surveys: 'Application and feedback management',
//       users: 'Comprehensive user management',
//       admin: 'Administrative controls and statistics'
//     },
//     // ✅ NEW: Controller information
//     membershipControllers: {
//       core: 'Shared utilities and functions (membershipCore.js)',
//       preMember: 'Pre-member application flow (preMemberApplicationController.js)',
//       admin: 'Admin management functions (adminManagementController.js)',
//       status: 'Status checks and basic operations (userStatusController.js)'
//     },
//     statistics: {
//       note: 'Use /api/users/stats, /api/teachings/stats, /api/survey/stats, /api/comments/stats, /api/communication/stats for detailed statistics'
//     },
//     timestamp: new Date().toISOString()
//   });
// });

// // Enhanced 404 handler for undefined API routes
// router.use('*', (req, res) => {
//   res.status(404).json({
//     success: false,
//     error: 'Route not found',
//     message: `The endpoint ${req.originalUrl} does not exist`,
//     suggestion: 'Check the API documentation at /api/docs',
//     availableEndpoints: [
//       '/api/auth - Authentication',
//       '/api/membership - Modular membership management',  // Updated description
//       '/api/survey - Survey management',
//       '/api/teachings - Teaching content',
//       '/api/users - User management',
//       '/api/chats - Chat content', 
//       '/api/comments - Comment management',
//       '/api/communication - Email & SMS',
//       '/api/admin - Administrative functions',
//       '/api/classes - Class management',
//       '/api/identity - Identity management'
//     ],
//     documentation: '/api/docs',
//     health: '/api/health',
//     info: '/api/info'
//   });
// });

// export default router;


