// ikootaapi/app.js
// ENHANCED VERSION: Integrating admin membership routes with existing functionality

import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import routes from './routes/index.js';
import { errorHandler } from './utils/errorHandler.js';
import morgan from 'morgan';
import logger from './utils/logger.js';

// ===== NEW IMPORTS FOR ADMIN MEMBERSHIP =====
import adminMembershipRouter from './routes/adminMembershipRoutes.js';
import membershipApplicationRouter from './routes/membershipApplicationRoutes.js';

const app = express();

// Middleware: Secure HTTP headers
app.use(helmet());

// Middleware: CORS (Enhanced for admin routes)
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      process.env.PUBLIC_CLIENT_URL,
      process.env.CLIENT_URL || 'http://localhost:5173'  // Added for admin routes compatibility
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with']
}));

// Middleware: Rate limiting (Enhanced for admin routes)
const createRateLimit = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({ 
      success: false,
      error: 'Too many requests',
      message,
      retryAfter: Math.ceil(windowMs / 1000)
    });
  }
});

app.use('/api/auth', createRateLimit(15 * 60 * 1000, 10, 'Too many authentication attempts'));
// ===== ENHANCED: Special rate limit for admin routes =====
app.use('/api/admin', createRateLimit(15 * 60 * 1000, 50, 'Too many admin requests'));
app.use('/api', createRateLimit(15 * 60 * 1000, 100, 'Too many API requests')); 

// Middleware: Parsers
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware: Logging (Enhanced for admin routes)
app.use(morgan('dev'));

// ===== ENHANCED: Additional request logging for admin routes =====
app.use('/api/admin', (req, res, next) => {
  console.log(`🔐 ADMIN REQUEST: ${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log(`   User: ${req.user?.username || 'Not authenticated'}`);
  console.log(`   Role: ${req.user?.role || 'Unknown'}`);
  next();
});

// ===== ENHANCED: Mount admin routes BEFORE general routes =====
console.log('🔐 Mounting admin membership routes...');
app.use('/api/admin/membership', adminMembershipRouter);

console.log('👤 Mounting membership application routes...');
app.use('/api/membership', membershipApplicationRouter);

// ===== MOUNT ALL OTHER API ROUTES (EXISTING) =====
console.log('🚀 Mounting general API routes at /api...');
app.use('/api', routes);

// ===== ROOT HEALTH CHECK (EXISTING) =====
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ===== ENHANCED API DOCUMENTATION ENDPOINT =====
app.get('/api-docs', (req, res) => {
  if (process.env.NODE_ENV === 'development') {
    res.json({
      success: true,
      message: 'API Documentation',
      baseUrl: `http://localhost:${process.env.PORT || 3000}`,
      endpoints: {
        health: 'GET /health',
        admin: {
          membership: {
            'GET /api/admin/membership/test': 'Test admin endpoints connectivity',
            'GET /api/admin/membership/applications': 'Get membership applications (with ?status=pending)',
            'GET /api/admin/membership/full-membership-stats': 'Get dashboard statistics',
            'GET /api/admin/membership/pending-count': 'Get pending applications count',
            'PUT /api/admin/membership/applications/:id/review': 'Review individual application',
            'POST /api/admin/membership/applications/bulk-review': 'Bulk review applications',
            'GET /api/admin/membership/applications/:id': 'Get application details'
          },
          users: {
            'GET /api/admin/users': 'Get all users',
            'PUT /api/admin/users/:id': 'Update user',
            'GET /api/admin/users/manage': 'User management'
          },
          system: {
            'GET /api/admin/reports': 'Get reports',
            'GET /api/admin/mentors': 'Get mentors',
            'GET /api/admin/audit-logs': 'Get audit logs'
          }
        },
        membership: {
          'GET /api/membership/dashboard': 'User membership dashboard',
          'GET /api/membership/status': 'Current membership status',
          'POST /api/membership/application/submit': 'Submit membership application',
          'GET /api/membership/full-membership/status': 'Full membership status',
          'POST /api/membership/full-membership/submit': 'Submit full membership application'
        },
        api: {
          auth: 'GET /api/auth/*',
          survey: 'GET /api/survey/*',
          general: 'All other /api/* routes'
        }
      },
      notes: {
        authentication: 'Admin routes require Bearer token with admin/super_admin role',
        rateLimit: 'Admin routes: 50 req/15min, General API: 100 req/15min, Auth: 10 req/15min'
      }
    });
  } else {
    res.status(404).json({ message: 'Resource not found' });
  }
});

// ===== ENHANCED: Admin-specific test endpoint =====
app.get('/api/test', (req, res) => {
  const isAdminPath = req.originalUrl.includes('/admin/');
  
  res.json({
    success: true,
    message: 'API server is running',
    timestamp: new Date().toISOString(),
    serverVersion: '2.0.0-admin-enhanced',
    availableRoutes: {
      admin: [
        'GET /api/admin/membership/test',
        'GET /api/admin/membership/applications?status=pending',
        'GET /api/admin/membership/full-membership-stats',
        'GET /api/admin/membership/pending-count',
        'PUT /api/admin/membership/applications/:id/review',
        'POST /api/admin/membership/applications/bulk-review'
      ],
      membership: [
        'GET /api/membership/dashboard',
        'GET /api/membership/status',
        'POST /api/membership/application/submit',
        'GET /api/membership/full-membership/status',
        'POST /api/membership/full-membership/submit'
      ],
      general: [
        'GET /health',
        'GET /api-docs',
        'All routes from routes/index.js'
      ]
    },
    admin: {
      enabled: true,
      testEndpoint: '/api/admin/membership/test',
      authRequired: 'Bearer token with admin/super_admin role'
    }
  });
});

// ===== 404 HANDLER (ENHANCED) =====
app.use((req, res, next) => {
  const isAdminRoute = req.originalUrl.startsWith('/api/admin/');
  
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  
  res.status(404).json({ 
    success: false,
    message: 'Resource not found',
    path: req.originalUrl,
    method: req.method,
    suggestion: isAdminRoute 
      ? 'Check admin routes - ensure authentication and correct endpoint' 
      : 'Check /api-docs for available endpoints',
    availableRoutes: isAdminRoute 
      ? [
          '/api/admin/membership/test',
          '/api/admin/membership/applications',
          '/api/admin/membership/full-membership-stats'
        ]
      : [
          '/health',
          '/api-docs',
          '/api/test',
          '/api/admin/membership/*',
          '/api/membership/*'
        ],
    adminNote: isAdminRoute 
      ? 'Admin routes require proper authentication and admin/super_admin role' 
      : null
  });
});

// ===== ERROR HANDLER (EXISTING - Enhanced for admin routes) =====
app.use((error, req, res, next) => {
  const isAdminRoute = req.originalUrl.startsWith('/api/admin/');
  
  // Enhanced logging for admin routes
  if (isAdminRoute) {
    logger.error('❌ ADMIN ROUTE ERROR:', {
      error: error.message,
      path: req.path,
      method: req.method,
      user: req.user?.username || 'Not authenticated',
      role: req.user?.role || 'Unknown',
      timestamp: new Date().toISOString()
    });
  }
  
  // Use existing error handler
  errorHandler(error, req, res, next);
});

console.log('✅ Enhanced app.js loaded with admin membership routes');
console.log('🔐 Admin routes available at /api/admin/membership/*');
console.log('👤 Membership routes available at /api/membership/*');
console.log('📚 Documentation available at /api-docs');

export default app;




// // ikootaapi/app.js
// // CLEAN VERSION: No conflicting routes

// import express from 'express';
// import helmet from 'helmet';
// import rateLimit from 'express-rate-limit';
// import cookieParser from 'cookie-parser';
// import cors from 'cors';
// import routes from './routes/index.js';
// import { errorHandler } from './utils/errorHandler.js';
// import morgan from 'morgan';
// import logger from './utils/logger.js';

// const app = express();

// // Middleware: Secure HTTP headers
// app.use(helmet());

// // Middleware: CORS
// app.use(cors({
//   origin: function (origin, callback) {
//     const allowedOrigins = [
//       'http://localhost:5173',
//       'http://localhost:3000',
//       process.env.PUBLIC_CLIENT_URL
//     ].filter(Boolean);
    
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
//   credentials: true,
//   allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with']
// }));

// // Middleware: Rate limiting
// const createRateLimit = (windowMs, max, message) => rateLimit({
//   windowMs,
//   max,
//   standardHeaders: true,
//   legacyHeaders: false,
//   handler: (req, res) => {
//     logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
//     res.status(429).json({ 
//       success: false,
//       error: 'Too many requests',
//       message,
//       retryAfter: Math.ceil(windowMs / 1000)
//     });
//   }
// });

// app.use('/api/auth', createRateLimit(15 * 60 * 1000, 10, 'Too many authentication attempts'));
// app.use('/api', createRateLimit(15 * 60 * 1000, 100, 'Too many API requests')); 

// // Middleware: Parsers
// app.use(cookieParser());
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true }));

// // Middleware: Logging
// app.use(morgan('dev'));

// // ===== MOUNT ALL API ROUTES (CLEAN) =====
// console.log('🚀 Mounting API routes at /api...');
// app.use('/api', routes);

// // ===== ROOT HEALTH CHECK =====
// app.get('/health', (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'Server is healthy',
//     timestamp: new Date().toISOString(),
//     environment: process.env.NODE_ENV || 'development'
//   });
// });

// // ===== API DOCUMENTATION ENDPOINT =====
// app.get('/api-docs', (req, res) => {
//   if (process.env.NODE_ENV === 'development') {
//     res.json({
//       success: true,
//       message: 'API Documentation',
//       baseUrl: `http://localhost:${process.env.PORT || 3000}`,
//       endpoints: {
//         health: 'GET /health',
//         admin: {
//           membership: {
//             'GET /api/admin/membership/applications': 'Get membership applications',
//             'GET /api/admin/membership/full-membership-stats': 'Get dashboard statistics',
//             'GET /api/admin/membership/pending-count': 'Get pending count',
//             'PUT /api/admin/membership/review/:id': 'Review individual application',
//             'POST /api/admin/membership/bulk-review': 'Bulk review applications',
//             'GET /api/admin/membership/application/:id': 'Get application details'
//           },
//           users: {
//             'GET /api/admin/users': 'Get all users',
//             'PUT /api/admin/users/:id': 'Update user',
//             'GET /api/admin/users/manage': 'User management'
//           },
//           system: {
//             'GET /api/admin/reports': 'Get reports',
//             'GET /api/admin/mentors': 'Get mentors',
//             'GET /api/admin/audit-logs': 'Get audit logs'
//           }
//         },
//         api: {
//           auth: 'GET /api/auth/*',
//           membership: 'GET /api/membership/*',
//           survey: 'GET /api/survey/*'
//         }
//       }
//     });
//   } else {
//     res.status(404).json({ message: 'Resource not found' });
//   }
// });

// // ===== 404 HANDLER =====
// app.use((req, res, next) => {
//   logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
//   res.status(404).json({ 
//     success: false,
//     message: 'Resource not found',
//     path: req.originalUrl,
//     method: req.method,
//     suggestion: 'Check /api-docs for available endpoints'
//   });
// });

// // ===== ERROR HANDLER =====
// app.use(errorHandler);

// console.log('✅ Clean app.js loaded - no route conflicts');

// export default app;








// // ikootaapi/app.js
// // FIXED VERSION: Proper route mounting with Admin Membership Routes

// import express from 'express';
// import helmet from 'helmet';
// import rateLimit from 'express-rate-limit';
// import cookieParser from 'cookie-parser';
// import cors from 'cors';
// import routes from './routes/index.js';
// import { errorHandler } from './utils/errorHandler.js';
// import morgan from 'morgan';
// import logger from './utils/logger.js';
// import db from './config/db.js'; // ✅ Import database connection

// const app = express();

// // Middleware: Secure HTTP headers
// app.use(helmet());

// // Middleware: CORS
// app.use(cors({
//   origin: function (origin, callback) {
//     const allowedOrigins = [
//       'http://localhost:5173',
//       'http://localhost:3000',
//       process.env.PUBLIC_CLIENT_URL
//     ].filter(Boolean);
    
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
//   credentials: true,
//   allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with']
// }));

// // Middleware: Rate limiting
// const createRateLimit = (windowMs, max, message) => rateLimit({
//   windowMs,
//   max,
//   standardHeaders: true,
//   legacyHeaders: false,
//   handler: (req, res) => {
//     logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
//     res.status(429).json({ 
//       success: false,
//       error: 'Too many requests',
//       message,
//       retryAfter: Math.ceil(windowMs / 1000)
//     });
//   }
// });

// app.use('/api/auth', createRateLimit(15 * 60 * 1000, 10, 'Too many authentication attempts'));
// app.use('/api', createRateLimit(15 * 60 * 1000, 100, 'Too many API requests')); 

// // Middleware: Parsers
// app.use(cookieParser());
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true }));

// // Middleware: Logging
// app.use(morgan('dev'));

// // ===== ✅ ADMIN MEMBERSHIP ROUTES (Before general routes) =====

// // Route debugging middleware
// const debugRoutes = (req, res, next) => {
//   console.log(`🔍 REQUEST: ${req.method} ${req.originalUrl}`);
//   if (req.body && Object.keys(req.body).length > 0) {
//     console.log(`🔍 BODY:`, req.body);
//   }
//   next();
// };

// // ✅ Debug routes endpoint - FIXED PATH
// app.get('/debug/routes', (req, res) => {
//   const routes = [];
  
//   const extractRoutes = (stack, prefix = '') => {
//     stack.forEach(layer => {
//       if (layer.route) {
//         const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
//         routes.push({
//           method: methods,
//           path: prefix + layer.route.path
//         });
//       } else if (layer.name === 'router' && layer.handle.stack) {
//         const routerPrefix = layer.regexp.source
//           .replace('^\\/api', '')
//           .replace('\\/?(?=\\/|$)', '')
//           .replace(/\\\//g, '/')
//           .replace(/\$.*/, '');
        
//         extractRoutes(layer.handle.stack, prefix + routerPrefix);
//       }
//     });
//   };

//   extractRoutes(app._router.stack, '');

//   res.json({
//     success: true,
//     message: 'Available routes',
//     routes: routes.sort((a, b) => a.path.localeCompare(b.path)),
//     totalRoutes: routes.length
//   });
// });

// // ✅ Database test endpoint - FIXED PATH
// app.get('/debug/membership/test', async (req, res) => {
//   try {
//     console.log('🔍 DEBUG: Testing membership applications query');
    
//     // Test direct database query with camelCase timestamps
//     const applications = await db.query(`
//       SELECT 
//         fma.id,
//         fma.user_id,
//         fma.membership_ticket,
//         fma.status,
//         fma.submittedAt,     -- camelCase timestamp
//         fma.reviewedAt,      -- camelCase timestamp
//         fma.admin_notes,
//         u.username,
//         u.email
//       FROM full_membership_applications fma
//       JOIN users u ON fma.user_id = u.id
//       ORDER BY fma.submittedAt DESC
//     `);

//     const pendingApps = await db.query(`
//       SELECT COUNT(*) as count 
//       FROM full_membership_applications 
//       WHERE status = 'pending'
//     `);

//     res.json({
//       success: true,
//       debug: {
//         allApplications: applications,
//         pendingCount: pendingApps[0]?.count || 0,
//         serverTime: new Date().toISOString()
//       }
//     });

//   } catch (error) {
//     console.error('❌ DEBUG: Database test failed:', error);
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// });

// // ✅ Add debug middleware to admin routes - FIXED PATH
// app.use('/admin', debugRoutes);

// // ✅ Main membership applications endpoint - FIXED PATH
// app.get('/admin/membership/applications', async (req, res) => {
//   try {
//     console.log('🔍 ADMIN: Fetching membership applications');
//     console.log('🔍 QUERY PARAMS:', req.query);
    
//     const { status = 'pending' } = req.query;
    
//     let query;
//     let queryParams = [];

//     if (status === 'all') {
//       query = `
//         SELECT 
//           fma.id,
//           fma.user_id,
//           fma.membership_ticket,
//           fma.answers,
//           fma.status,
//           fma.submittedAt,     -- camelCase timestamp
//           fma.reviewedAt,      -- camelCase timestamp
//           fma.reviewed_by,
//           fma.admin_notes,
//           u.username as user_name,
//           u.email as user_email,
//           reviewer.username as reviewer_name
//         FROM full_membership_applications fma
//         JOIN users u ON fma.user_id = u.id
//         LEFT JOIN users reviewer ON fma.reviewed_by = reviewer.id
//         ORDER BY fma.submittedAt DESC
//       `;
//     } else {
//       query = `
//         SELECT 
//           fma.id,
//           fma.user_id,
//           fma.membership_ticket,
//           fma.answers,
//           fma.status,
//           fma.submittedAt,     -- camelCase timestamp
//           fma.reviewedAt,      -- camelCase timestamp
//           fma.reviewed_by,
//           fma.admin_notes,
//           u.username as user_name,
//           u.email as user_email,
//           reviewer.username as reviewer_name
//         FROM full_membership_applications fma
//         JOIN users u ON fma.user_id = u.id
//         LEFT JOIN users reviewer ON fma.reviewed_by = reviewer.id
//         WHERE fma.status = ?
//         ORDER BY fma.submittedAt DESC
//       `;
//       queryParams = [status];
//     }

//     console.log('🔍 EXECUTING QUERY:', query);
//     console.log('🔍 QUERY PARAMS:', queryParams);

//     const applications = await db.query(query, queryParams);
    
//     console.log('✅ QUERY RESULT:', applications.length, 'applications found');

//     res.json({
//       success: true,
//       data: applications,
//       meta: {
//         count: applications.length,
//         status: status,
//         timestamp: new Date().toISOString()
//       }
//     });

//   } catch (error) {
//     console.error('❌ ADMIN: Error fetching applications:', error);
//     res.status(500).json({
//       success: false,
//       error: error.message,
//       details: 'Failed to fetch membership applications'
//     });
//   }
// });

// // ✅ Stats endpoint - FIXED PATH
// app.get('/admin/membership/full-membership-stats', async (req, res) => {
//   try {
//     console.log('🔍 ADMIN: Fetching membership stats');
    
//     const stats = await db.query(`
//       SELECT 
//         status,
//         COUNT(*) as count
//       FROM full_membership_applications 
//       GROUP BY status
//     `);

//     const result = {
//       pending: 0,
//       approved: 0,
//       declined: 0,
//       suspended: 0,
//       total: 0
//     };

//     stats.forEach(stat => {
//       result[stat.status] = stat.count;
//       result.total += stat.count;
//     });

//     console.log('✅ STATS RESULT:', result);

//     res.json({
//       success: true,
//       data: result,
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('❌ ADMIN: Error fetching stats:', error);
//     res.status(500).json({
//       success: false,
//       error: error.message,
//       details: 'Failed to fetch membership statistics'
//     });
//   }
// });

// // ✅ Review individual application endpoint - FIXED PATH
// app.put('/admin/membership/review/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status, adminNotes } = req.body;
    
//     console.log('🔍 ADMIN: Reviewing application:', { id, status, adminNotes });
    
//     if (!['approved', 'declined', 'suspended'].includes(status)) {
//       return res.status(400).json({
//         success: false,
//         error: 'Invalid status. Must be approved, declined, or suspended'
//       });
//     }

//     // Update the application with camelCase timestamp
//     await db.query(`
//       UPDATE full_membership_applications 
//       SET 
//         status = ?,
//         admin_notes = ?,
//         reviewedAt = NOW(),    -- camelCase timestamp
//         reviewed_by = ?
//       WHERE id = ?
//     `, [status, adminNotes, req.user?.id || 1, id]);

//     // Update user's status if approved
//     if (status === 'approved') {
//       await db.query(`
//         UPDATE users 
//         SET 
//           is_member = 'member',
//           membership_stage = 'member',
//           full_membership_status = 'approved',
//           fullMembershipReviewedAt = NOW()    -- camelCase timestamp
//         WHERE id = (
//           SELECT user_id 
//           FROM full_membership_applications 
//           WHERE id = ?
//         )
//       `, [id]);
//     }

//     console.log('✅ ADMIN: Application reviewed successfully');

//     res.json({
//       success: true,
//       message: `Application ${status} successfully`,
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('❌ ADMIN: Error reviewing application:', error);
//     res.status(500).json({
//       success: false,
//       error: error.message,
//       details: 'Failed to review application'
//     });
//   }
// });

// // ✅ Bulk review endpoint - FIXED PATH
// app.post('/admin/membership/bulk-review', async (req, res) => {
//   try {
//     const { applicationIds, decision, notes } = req.body;
    
//     console.log('🔍 ADMIN: Bulk reviewing applications:', { applicationIds, decision, notes });
    
//     if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
//       return res.status(400).json({
//         success: false,
//         error: 'applicationIds must be a non-empty array'
//       });
//     }

//     if (!['approved', 'declined', 'suspended'].includes(decision)) {
//       return res.status(400).json({
//         success: false,
//         error: 'Invalid decision. Must be approved, declined, or suspended'
//       });
//     }

//     // Bulk update applications with camelCase timestamp
//     const placeholders = applicationIds.map(() => '?').join(',');
//     await db.query(`
//       UPDATE full_membership_applications 
//       SET 
//         status = ?,
//         admin_notes = ?,
//         reviewedAt = NOW(),    -- camelCase timestamp
//         reviewed_by = ?
//       WHERE id IN (${placeholders})
//     `, [decision, notes, req.user?.id || 1, ...applicationIds]);

//     // Update user status if approved
//     if (decision === 'approved') {
//       await db.query(`
//         UPDATE users 
//         SET 
//           is_member = 'member',
//           membership_stage = 'member',
//           full_membership_status = 'approved',
//           fullMembershipReviewedAt = NOW()    -- camelCase timestamp
//         WHERE id IN (
//           SELECT user_id 
//           FROM full_membership_applications 
//           WHERE id IN (${placeholders})
//         )
//       `, applicationIds);
//     }

//     console.log('✅ ADMIN: Bulk review completed successfully');

//     res.json({
//       success: true,
//       message: `${applicationIds.length} applications ${decision} successfully`,
//       processedCount: applicationIds.length,
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('❌ ADMIN: Error in bulk review:', error);
//     res.status(500).json({
//       success: false,
//       error: error.message,
//       details: 'Failed to bulk review applications'
//     });
//   }
// });

// console.log('✅ Admin membership routes loaded');

// // ===== CRITICAL: MOUNT ALL API ROUTES =====
// console.log('🚀 Mounting API routes at /api...');
// app.use('/api', routes);

// // ===== ROOT HEALTH CHECK =====
// app.get('/health', (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'Server is healthy',
//     timestamp: new Date().toISOString(),
//     environment: process.env.NODE_ENV || 'development'
//   });
// });

// // ===== API DOCUMENTATION ENDPOINT =====
// app.get('/api-docs', (req, res) => {
//   if (process.env.NODE_ENV === 'development') {
//     res.json({
//       success: true,
//       message: 'API Documentation',
//       baseUrl: `http://localhost:${process.env.PORT || 3000}`,
//       endpoints: {
//         health: 'GET /health',
//         debug: {
//           'GET /debug/routes': 'List all available routes',
//           'GET /debug/membership/test': 'Test database connectivity'
//         },
//         admin: {
//           'GET /admin/membership/applications': 'Get membership applications',
//           'GET /admin/membership/full-membership-stats': 'Get dashboard statistics',
//           'PUT /admin/membership/review/:id': 'Review individual application',
//           'POST /admin/membership/bulk-review': 'Bulk review applications'
//         },
//         api: {
//           auth: 'GET /api/auth/*',
//           membership: 'GET /api/membership/*'
//         }
//       }
//     });
//   } else {
//     res.status(404).json({ message: 'Resource not found' });
//   }
// });

// // ===== 404 HANDLER =====
// app.use((req, res, next) => {
//   logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
//   res.status(404).json({ 
//     success: false,
//     message: 'Resource not found',
//     path: req.originalUrl,
//     method: req.method,
//     suggestion: 'Check /api-docs for available endpoints'
//   });
// });

// // ===== ERROR HANDLER =====
// app.use(errorHandler);

// export default app;




// // ikootaapi/app.js
// // FIXED VERSION: Proper route mounting with Admin Membership Routes

// import express from 'express';
// import helmet from 'helmet';
// import rateLimit from 'express-rate-limit';
// import cookieParser from 'cookie-parser';
// import cors from 'cors';
// import routes from './routes/index.js';
// import { errorHandler } from './utils/errorHandler.js';
// import morgan from 'morgan';
// import logger from './utils/logger.js';
// import db from './config/db.js'; // ✅ Import database connection

// const app = express();

// // Middleware: Secure HTTP headers
// app.use(helmet());

// // Middleware: CORS
// app.use(cors({
//   origin: function (origin, callback) {
//     const allowedOrigins = [
//       'http://localhost:5173',
//       'http://localhost:3000',
//       process.env.PUBLIC_CLIENT_URL
//     ].filter(Boolean);
    
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
//   credentials: true,
//   allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with']
// }));

// // Middleware: Rate limiting
// const createRateLimit = (windowMs, max, message) => rateLimit({
//   windowMs,
//   max,
//   standardHeaders: true,
//   legacyHeaders: false,
//   handler: (req, res) => {
//     logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
//     res.status(429).json({ 
//       success: false,
//       error: 'Too many requests',
//       message,
//       retryAfter: Math.ceil(windowMs / 1000)
//     });
//   }
// });

// app.use('/api/auth', createRateLimit(15 * 60 * 1000, 10, 'Too many authentication attempts'));
// app.use('/api', createRateLimit(15 * 60 * 1000, 100, 'Too many API requests')); 

// // Middleware: Parsers
// app.use(cookieParser());
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true }));

// // Middleware: Logging
// app.use(morgan('dev'));

// // ===== ✅ ADMIN MEMBERSHIP ROUTES (Before general routes) =====

// // Route debugging middleware
// const debugRoutes = (req, res, next) => {
//   console.log(`🔍 REQUEST: ${req.method} ${req.originalUrl}`);
//   if (req.body && Object.keys(req.body).length > 0) {
//     console.log(`🔍 BODY:`, req.body);
//   }
//   next();
// };

// // ✅ Debug routes endpoint
// app.get('/api/debug/routes', (req, res) => {
//   const routes = [];
  
//   const extractRoutes = (stack, prefix = '') => {
//     stack.forEach(layer => {
//       if (layer.route) {
//         const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
//         routes.push({
//           method: methods,
//           path: prefix + layer.route.path
//         });
//       } else if (layer.name === 'router' && layer.handle.stack) {
//         const routerPrefix = layer.regexp.source
//           .replace('^\\/api', '')
//           .replace('\\/?(?=\\/|$)', '')
//           .replace(/\\\//g, '/')
//           .replace(/\$.*/, '');
        
//         extractRoutes(layer.handle.stack, prefix + routerPrefix);
//       }
//     });
//   };

//   extractRoutes(app._router.stack, '');

//   res.json({
//     success: true,
//     message: 'Available routes',
//     routes: routes.sort((a, b) => a.path.localeCompare(b.path)),
//     totalRoutes: routes.length
//   });
// });

// // ✅ Database test endpoint
// app.get('/api/debug/membership/test', async (req, res) => {
//   try {
//     console.log('🔍 DEBUG: Testing membership applications query');
    
//     // Test direct database query with camelCase timestamps
//     const applications = await db.query(`
//       SELECT 
//         fma.id,
//         fma.user_id,
//         fma.membership_ticket,
//         fma.status,
//         fma.submittedAt,     -- camelCase timestamp
//         fma.reviewedAt,      -- camelCase timestamp
//         fma.admin_notes,
//         u.username,
//         u.email
//       FROM full_membership_applications fma
//       JOIN users u ON fma.user_id = u.id
//       ORDER BY fma.submittedAt DESC
//     `);

//     const pendingApps = await db.query(`
//       SELECT COUNT(*) as count 
//       FROM full_membership_applications 
//       WHERE status = 'pending'
//     `);

//     res.json({
//       success: true,
//       debug: {
//         allApplications: applications,
//         pendingCount: pendingApps[0]?.count || 0,
//         serverTime: new Date().toISOString()
//       }
//     });

//   } catch (error) {
//     console.error('❌ DEBUG: Database test failed:', error);
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// });

// // ✅ Add debug middleware to admin routes
// app.use('/api/admin', debugRoutes);

// // ✅ Main membership applications endpoint
// app.get('/api/admin/membership/applications', async (req, res) => {
//   try {
//     console.log('🔍 ADMIN: Fetching membership applications');
//     console.log('🔍 QUERY PARAMS:', req.query);
    
//     const { status = 'pending' } = req.query;
    
//     let query;
//     let queryParams = [];

//     if (status === 'all') {
//       query = `
//         SELECT 
//           fma.id,
//           fma.user_id,
//           fma.membership_ticket,
//           fma.answers,
//           fma.status,
//           fma.submittedAt,     -- camelCase timestamp
//           fma.reviewedAt,      -- camelCase timestamp
//           fma.reviewed_by,
//           fma.admin_notes,
//           u.username as user_name,
//           u.email as user_email,
//           reviewer.username as reviewer_name
//         FROM full_membership_applications fma
//         JOIN users u ON fma.user_id = u.id
//         LEFT JOIN users reviewer ON fma.reviewed_by = reviewer.id
//         ORDER BY fma.submittedAt DESC
//       `;
//     } else {
//       query = `
//         SELECT 
//           fma.id,
//           fma.user_id,
//           fma.membership_ticket,
//           fma.answers,
//           fma.status,
//           fma.submittedAt,     -- camelCase timestamp
//           fma.reviewedAt,      -- camelCase timestamp
//           fma.reviewed_by,
//           fma.admin_notes,
//           u.username as user_name,
//           u.email as user_email,
//           reviewer.username as reviewer_name
//         FROM full_membership_applications fma
//         JOIN users u ON fma.user_id = u.id
//         LEFT JOIN users reviewer ON fma.reviewed_by = reviewer.id
//         WHERE fma.status = ?
//         ORDER BY fma.submittedAt DESC
//       `;
//       queryParams = [status];
//     }

//     console.log('🔍 EXECUTING QUERY:', query);
//     console.log('🔍 QUERY PARAMS:', queryParams);

//     const applications = await db.query(query, queryParams);
    
//     console.log('✅ QUERY RESULT:', applications.length, 'applications found');

//     res.json({
//       success: true,
//       data: applications,
//       meta: {
//         count: applications.length,
//         status: status,
//         timestamp: new Date().toISOString()
//       }
//     });

//   } catch (error) {
//     console.error('❌ ADMIN: Error fetching applications:', error);
//     res.status(500).json({
//       success: false,
//       error: error.message,
//       details: 'Failed to fetch membership applications'
//     });
//   }
// });

// // ✅ Stats endpoint
// app.get('/api/admin/membership/full-membership-stats', async (req, res) => {
//   try {
//     console.log('🔍 ADMIN: Fetching membership stats');
    
//     const stats = await db.query(`
//       SELECT 
//         status,
//         COUNT(*) as count
//       FROM full_membership_applications 
//       GROUP BY status
//     `);

//     const result = {
//       pending: 0,
//       approved: 0,
//       declined: 0,
//       suspended: 0,
//       total: 0
//     };

//     stats.forEach(stat => {
//       result[stat.status] = stat.count;
//       result.total += stat.count;
//     });

//     console.log('✅ STATS RESULT:', result);

//     res.json({
//       success: true,
//       data: result,
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('❌ ADMIN: Error fetching stats:', error);
//     res.status(500).json({
//       success: false,
//       error: error.message,
//       details: 'Failed to fetch membership statistics'
//     });
//   }
// });

// // ✅ Review individual application endpoint
// app.put('/api/admin/membership/review/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status, adminNotes } = req.body;
    
//     console.log('🔍 ADMIN: Reviewing application:', { id, status, adminNotes });
    
//     if (!['approved', 'declined', 'suspended'].includes(status)) {
//       return res.status(400).json({
//         success: false,
//         error: 'Invalid status. Must be approved, declined, or suspended'
//       });
//     }

//     // Update the application with camelCase timestamp
//     await db.query(`
//       UPDATE full_membership_applications 
//       SET 
//         status = ?,
//         admin_notes = ?,
//         reviewedAt = NOW(),    -- camelCase timestamp
//         reviewed_by = ?
//       WHERE id = ?
//     `, [status, adminNotes, req.user?.id || 1, id]);

//     // Update user's status if approved
//     if (status === 'approved') {
//       await db.query(`
//         UPDATE users 
//         SET 
//           is_member = 'member',
//           membership_stage = 'member',
//           full_membership_status = 'approved',
//           fullMembershipReviewedAt = NOW()    -- camelCase timestamp
//         WHERE id = (
//           SELECT user_id 
//           FROM full_membership_applications 
//           WHERE id = ?
//         )
//       `, [id]);
//     }

//     console.log('✅ ADMIN: Application reviewed successfully');

//     res.json({
//       success: true,
//       message: `Application ${status} successfully`,
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('❌ ADMIN: Error reviewing application:', error);
//     res.status(500).json({
//       success: false,
//       error: error.message,
//       details: 'Failed to review application'
//     });
//   }
// });

// // ✅ Bulk review endpoint
// app.post('/api/admin/membership/bulk-review', async (req, res) => {
//   try {
//     const { applicationIds, decision, notes } = req.body;
    
//     console.log('🔍 ADMIN: Bulk reviewing applications:', { applicationIds, decision, notes });
    
//     if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
//       return res.status(400).json({
//         success: false,
//         error: 'applicationIds must be a non-empty array'
//       });
//     }

//     if (!['approved', 'declined', 'suspended'].includes(decision)) {
//       return res.status(400).json({
//         success: false,
//         error: 'Invalid decision. Must be approved, declined, or suspended'
//       });
//     }

//     // Bulk update applications with camelCase timestamp
//     const placeholders = applicationIds.map(() => '?').join(',');
//     await db.query(`
//       UPDATE full_membership_applications 
//       SET 
//         status = ?,
//         admin_notes = ?,
//         reviewedAt = NOW(),    -- camelCase timestamp
//         reviewed_by = ?
//       WHERE id IN (${placeholders})
//     `, [decision, notes, req.user?.id || 1, ...applicationIds]);

//     // Update user status if approved
//     if (decision === 'approved') {
//       await db.query(`
//         UPDATE users 
//         SET 
//           is_member = 'member',
//           membership_stage = 'member',
//           full_membership_status = 'approved',
//           fullMembershipReviewedAt = NOW()    -- camelCase timestamp
//         WHERE id IN (
//           SELECT user_id 
//           FROM full_membership_applications 
//           WHERE id IN (${placeholders})
//         )
//       `, applicationIds);
//     }

//     console.log('✅ ADMIN: Bulk review completed successfully');

//     res.json({
//       success: true,
//       message: `${applicationIds.length} applications ${decision} successfully`,
//       processedCount: applicationIds.length,
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('❌ ADMIN: Error in bulk review:', error);
//     res.status(500).json({
//       success: false,
//       error: error.message,
//       details: 'Failed to bulk review applications'
//     });
//   }
// });

// console.log('✅ Admin membership routes loaded');

// // ===== CRITICAL: MOUNT ALL API ROUTES =====
// console.log('🚀 Mounting API routes at /api...');
// app.use('/api', routes);

// // ===== ROOT HEALTH CHECK =====
// app.get('/health', (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'Server is healthy',
//     timestamp: new Date().toISOString(),
//     environment: process.env.NODE_ENV || 'development'
//   });
// });

// // ===== API DOCUMENTATION ENDPOINT =====
// app.get('/api-docs', (req, res) => {
//   if (process.env.NODE_ENV === 'development') {
//     res.json({
//       success: true,
//       message: 'API Documentation',
//       baseUrl: `http://localhost:${process.env.PORT || 3000}`,
//       endpoints: {
//         health: 'GET /health',
//         debug: {
//           'GET /api/debug/routes': 'List all available routes',
//           'GET /api/debug/membership/test': 'Test database connectivity'
//         },
//         admin: {
//           'GET /api/admin/membership/applications': 'Get membership applications',
//           'GET /api/admin/membership/full-membership-stats': 'Get dashboard statistics',
//           'PUT /api/admin/membership/review/:id': 'Review individual application',
//           'POST /api/admin/membership/bulk-review': 'Bulk review applications'
//         },
//         api: {
//           auth: 'GET /api/auth/*',
//           membership: 'GET /api/membership/*'
//         }
//       }
//     });
//   } else {
//     res.status(404).json({ message: 'Resource not found' });
//   }
// });

// // ===== 404 HANDLER =====
// app.use((req, res, next) => {
//   logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
//   res.status(404).json({ 
//     success: false,
//     message: 'Resource not found',
//     path: req.originalUrl,
//     method: req.method,
//     suggestion: 'Check /api-docs for available endpoints'
//   });
// });

// // ===== ERROR HANDLER =====
// app.use(errorHandler);

// export default app;




// // ikootaapi/app.js
// // FIXED VERSION: Proper route mounting

// import express from 'express';
// import helmet from 'helmet';
// import rateLimit from 'express-rate-limit';
// import cookieParser from 'cookie-parser';
// import cors from 'cors';
// import routes from './routes/index.js';
// import { errorHandler } from './utils/errorHandler.js';
// import morgan from 'morgan';
// import logger from './utils/logger.js';

// const app = express();

// // Middleware: Secure HTTP headers
// app.use(helmet());

// // Middleware: CORS
// app.use(cors({
//   origin: function (origin, callback) {
//     const allowedOrigins = [
//       'http://localhost:5173',
//       'http://localhost:3000',
//       process.env.PUBLIC_CLIENT_URL
//     ].filter(Boolean);
    
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
//   credentials: true,
//   allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with']
// }));

// // Middleware: Rate limiting
// const createRateLimit = (windowMs, max, message) => rateLimit({
//   windowMs,
//   max,
//   standardHeaders: true,
//   legacyHeaders: false,
//   handler: (req, res) => {
//     logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
//     res.status(429).json({ 
//       success: false,
//       error: 'Too many requests',
//       message,
//       retryAfter: Math.ceil(windowMs / 1000)
//     });
//   }
// });

// app.use('/api/auth', createRateLimit(15 * 60 * 1000, 10, 'Too many authentication attempts'));
// app.use('/api', createRateLimit(15 * 60 * 1000, 100, 'Too many API requests')); 

// // Middleware: Parsers
// app.use(cookieParser());
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true }));

// // Middleware: Logging
// app.use(morgan('dev'));

// // ===== CRITICAL: MOUNT ALL API ROUTES =====
// console.log('🚀 Mounting API routes at /api...');
// app.use('/api', routes);

// // ===== ROOT HEALTH CHECK =====
// app.get('/health', (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'Server is healthy',
//     timestamp: new Date().toISOString(),
//     environment: process.env.NODE_ENV || 'development'
//   });
// });

// // ===== API DOCUMENTATION ENDPOINT =====
// app.get('/api-docs', (req, res) => {
//   if (process.env.NODE_ENV === 'development') {
//     res.json({
//       success: true,
//       message: 'API Documentation',
//       baseUrl: `http://localhost:${process.env.PORT || 3000}`,
//       endpoints: {
//         health: 'GET /health',
//         api: {
//           admin: {
//             // 'GET /api/admin/membership/applications': 'Get pending applications',
//             // 'GET /api/admin/membership/pending-count': 'Get count for sidebar badge',
//             // 'GET /api/admin/membership/full-membership-stats': 'Get dashboard statistics',
//             // 'PUT /api/admin/membership/review/:applicationId': 'Review individual application',
//             // 'POST /api/admin/membership/bulk-review': 'Bulk review applications',
//             // 'GET /api/admin/applications/stats': 'Get application statistics'
//           },
//           auth: 'GET /api/auth/*',
//           membership: 'GET /api/membership/*'
//         }
//       }
//     });
//   } else {
//     res.status(404).json({ message: 'Resource not found' });
//   }
// });

// // ===== 404 HANDLER =====
// app.use((req, res, next) => {
//   logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
//   res.status(404).json({ 
//     success: false,
//     message: 'Resource not found',
//     path: req.originalUrl,
//     method: req.method,
//     suggestion: 'Check /api-docs for available endpoints'
//   });
// });

// // ===== ERROR HANDLER =====
// app.use(errorHandler);

// export default app;



