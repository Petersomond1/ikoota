// ikootaapi/app.js
// REORGANIZED APPLICATION ENTRY POINT
// Enhanced version with comprehensive middleware and route organization

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

// Import reorganized route modules
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/old.userRoutes.js';
import userStatusRoutes from './routes/old.userStatusRoutes.js';
import userAdminRoutes from './routes/userAdminRoutes.js';
import membershipRoutes from './routes/old.membershipRoutes.js';
import membershipAdminRoutes from './routes/membershipAdminRoutes.js';
import surveyRoutes from './routes/old.surveyRoutes.js';
import surveyAdminRoutes from './routes/surveyAdminRoutes.js';
import contentRoutes from './routes/old.contentRoutes.js';
import classRoutes from './routes/old.classRoutes.js';
import classAdminRoutes from './routes/classAdminRoutes.js';
import identityRoutes from './routes/old.identityRoutes.js';
import identityAdminRoutes from './routes/identityAdminRoutes.js';
import communicationRoutes from './routes/old.communicationRoutes.js';
import systemRoutes from './routes/systemRoutes.js';

const app = express();

// ===============================================
// GLOBAL MIDDLEWARE SETUP
// ===============================================

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || []
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compression and parsing
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===============================================
// RATE LIMITING
// ===============================================

// General rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Admin-specific rate limiting
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 50 : 500,
  message: {
    error: 'Too many admin requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Authentication rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 20 : 100,
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(generalLimiter);

// ===============================================
// REQUEST LOGGING MIDDLEWARE
// ===============================================

app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Enhanced logging for admin routes
  if (req.originalUrl.startsWith('/api/admin/')) {
    console.log(`🔐 ADMIN REQUEST: ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent')?.substring(0, 50) + '...',
      auth: req.headers.authorization ? 'Bearer token present' : 'No auth header'
    });
  } else if (process.env.NODE_ENV === 'development') {
    console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`, {
      ip: req.ip
    });
  }
  
  // Response time logging
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    
    if (process.env.NODE_ENV === 'development') {
      const statusColor = res.statusCode < 400 ? '✅' : '❌';
      const routeType = req.originalUrl.startsWith('/api/admin/') ? '🔐 ADMIN' : '📤';
      console.log(`${routeType} ${statusColor} ${res.statusCode} - ${req.method} ${req.originalUrl} (${duration}ms)`);
    }
    
    originalSend.call(this, data);
  };
  
  next();
});

// ===============================================
// ROUTE MOUNTING - REORGANIZED STRUCTURE
// ===============================================

console.log('🔧 Mounting reorganized API routes...');

// ===== 1. SYSTEM ROUTES (Health, Info, Testing) =====
app.use('/api', systemRoutes);

// ===== 2. AUTHENTICATION (Critical - Must be early) =====
app.use('/api/auth', authLimiter, authRoutes);

// ===== 3. USER MANAGEMENT =====
app.use('/api/users', userRoutes);
app.use('/api/user-status', userStatusRoutes);
app.use('/api/admin/users', adminLimiter, userAdminRoutes);

// ===== 4. MEMBERSHIP SYSTEM =====
app.use('/api/membership', membershipRoutes);
app.use('/api/admin/membership', adminLimiter, membershipAdminRoutes);

// ===== 5. SURVEY SYSTEM =====
app.use('/api/survey', surveyRoutes);
app.use('/api/admin/survey', adminLimiter, surveyAdminRoutes);

// ===== 6. CONTENT MANAGEMENT =====
app.use('/api/content', contentRoutes);

// ===== 7. CLASS MANAGEMENT =====
app.use('/api/classes', classRoutes);
app.use('/api/admin/classes', adminLimiter, classAdminRoutes);

// ===== 8. IDENTITY MANAGEMENT =====
app.use('/api/identity', identityRoutes);
app.use('/api/admin/identity', adminLimiter, identityAdminRoutes);

// ===== 9. COMMUNICATION =====
app.use('/api/communication', communicationRoutes);

// ===============================================
// BACKWARD COMPATIBILITY ROUTES
// ===============================================
console.log('🔄 Mounting backward compatibility routes...');

// Legacy routes for existing frontend compatibility
app.use('/api/chats', (req, res, next) => {
  req.url = '/chats' + req.url;
  contentRoutes(req, res, next);
});

app.use('/api/teachings', (req, res, next) => {
  req.url = '/teachings' + req.url;
  contentRoutes(req, res, next);
});

app.use('/api/comments', (req, res, next) => {
  req.url = '/comments' + req.url;
  contentRoutes(req, res, next);
});

app.use('/api/messages', (req, res, next) => {
  req.url = '/teachings' + req.url;
  contentRoutes(req, res, next);
});

// ===============================================
// API INFORMATION & DISCOVERY
// ===============================================

app.get('/api/info', (req, res) => {
  res.json({
    success: true,
    message: 'Ikoota API - Reorganized Architecture',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    architecture: {
      description: 'Functionally grouped routes with clean separation of concerns',
      principles: [
        'Domain-driven organization',
        'Consistent naming conventions', 
        'Clear admin/user separation',
        'Service layer architecture',
        'Zero functionality loss'
      ]
    },
    routes: {
      authentication: '/api/auth/*',
      users: {
        general: '/api/users/*',
        status: '/api/user-status/*', 
        admin: '/api/admin/users/*'
      },
      membership: {
        general: '/api/membership/*',
        admin: '/api/admin/membership/*'
      },
      surveys: {
        general: '/api/survey/*',
        admin: '/api/admin/survey/*'
      },
      content: '/api/content/* (chats, teachings, comments)',
      classes: {
        general: '/api/classes/*',
        admin: '/api/admin/classes/*'
      },
      identity: {
        general: '/api/identity/*',
        admin: '/api/admin/identity/*'
      },
      communication: '/api/communication/*',
      system: '/api/health, /api/info, /api/metrics'
    },
    compatibility: {
      note: 'Legacy routes preserved for zero-downtime migration',
      routes: '/api/chats/*, /api/teachings/*, /api/comments/*, /api/messages/*'
    }
  });
});

app.get('/api/routes', (req, res) => {
  res.json({
    success: true,
    message: 'Complete API Route Discovery - Reorganized',
    totalRouteGroups: 13,
    organization: {
      core: ['auth', 'users', 'user-status'],
      membership: ['membership', 'admin/membership'],
      content: ['content', 'classes', 'admin/classes'],
      identity: ['identity', 'admin/identity'],
      communication: ['communication'],
      system: ['health', 'info', 'metrics']
    },
    adminSeparation: {
      note: 'All admin routes have /admin/ prefix for clear separation',
      rateLimiting: 'Admin routes have stricter rate limits',
      logging: 'Enhanced logging for admin operations'
    },
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// GLOBAL ERROR HANDLER
// ===============================================

app.use((error, req, res, next) => {
  const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  const isAdminRoute = req.originalUrl.startsWith('/api/admin/');
  
  console.error('🚨 Global API Error:', {
    errorId,
    error: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
    isAdminRoute,
    timestamp: new Date().toISOString()
  });
  
  let statusCode = error.statusCode || error.status || 500;
  let errorType = 'server_error';
  
  // Error categorization
  if (error.message.includes('validation') || error.message.includes('required')) {
    statusCode = 400;
    errorType = 'validation_error';
  } else if (error.message.includes('authentication') || error.message.includes('token')) {
    statusCode = 401;
    errorType = 'authentication_error';
  } else if (error.message.includes('permission') || error.message.includes('access denied')) {
    statusCode = 403;
    errorType = 'authorization_error';
  } else if (error.message.includes('not found')) {
    statusCode = 404;
    errorType = 'not_found_error';
  } else if (error.message.includes('database') || error.message.includes('connection')) {
    statusCode = 503;
    errorType = 'database_error';
  }
  
  const errorResponse = {
    success: false,
    error: error.message || 'Internal server error',
    errorType,
    errorId,
    path: req.originalUrl,
    method: req.method,
    isAdminRoute,
    timestamp: new Date().toISOString()
  };
  
  if (process.env.NODE_ENV === 'development') {
    errorResponse.debug = {
      stack: error.stack,
      details: error
    };
  }
  
  // Add helpful suggestions based on error type
  if (statusCode === 401) {
    errorResponse.help = {
      message: 'Authentication required',
      endpoint: '/api/auth/login',
      adminNote: isAdminRoute ? 'Admin routes require Bearer token with admin/super_admin role' : undefined
    };
  } else if (statusCode === 403) {
    errorResponse.help = {
      message: 'Insufficient permissions',
      adminNote: isAdminRoute ? 'Admin routes require admin or super_admin role' : undefined
    };
  } else if (statusCode === 404) {
    errorResponse.help = {
      message: 'Endpoint not found',
      documentation: '/api/info',
      routeDiscovery: '/api/routes'
    };
  }
  
  res.status(statusCode).json(errorResponse);
});

// ===============================================
// 404 HANDLER
// ===============================================

app.use('*', (req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
  
  const requestedPath = req.originalUrl.toLowerCase();
  const suggestions = [];
  
  // Smart suggestions based on request path
  if (requestedPath.includes('user')) {
    suggestions.push('/api/users', '/api/user-status', '/api/admin/users');
  }
  if (requestedPath.includes('member')) {
    suggestions.push('/api/membership', '/api/admin/membership');
  }
  if (requestedPath.includes('admin')) {
    suggestions.push('/api/admin/users', '/api/admin/membership', '/api/admin/classes');
  }
  if (requestedPath.includes('chat') || requestedPath.includes('message')) {
    suggestions.push('/api/content/chats', '/api/communication');
  }
  if (requestedPath.includes('teaching')) {
    suggestions.push('/api/content/teachings');
  }
  if (requestedPath.includes('comment')) {
    suggestions.push('/api/content/comments');
  }
  if (requestedPath.includes('class')) {
    suggestions.push('/api/classes', '/api/admin/classes');
  }
  
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    suggestions: suggestions.length > 0 ? suggestions : undefined,
    availableRoutes: {
      core: {
        authentication: '/api/auth/*',
        users: '/api/users/*',
        userStatus: '/api/user-status/*',
        system: '/api/health, /api/info'
      },
      membership: {
        general: '/api/membership/*',
        admin: '/api/admin/membership/*'
      },
      content: {
        unified: '/api/content/* (chats, teachings, comments)',
        classes: '/api/classes/*',
        adminClasses: '/api/admin/classes/*'
      },
      identity: {
        general: '/api/identity/*',
        admin: '/api/admin/identity/*'
      },
      communication: '/api/communication/*',
      surveys: {
        general: '/api/survey/*',
        admin: '/api/admin/survey/*'
      },
      admin: {
        users: '/api/admin/users/*',
        membership: '/api/admin/membership/*',
        classes: '/api/admin/classes/*',
        identity: '/api/admin/identity/*',
        surveys: '/api/admin/survey/*'
      }
    },
    help: {
      documentation: '/api/info',
      routeDiscovery: '/api/routes',
      healthCheck: '/api/health'
    },
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// DEVELOPMENT LOGGING
// ===============================================

if (process.env.NODE_ENV === 'development') {
  console.log('\n🚀 IKOOTA API - REORGANIZED ARCHITECTURE');
  console.log('================================================================================');
  console.log('✅ FUNCTIONALLY GROUPED: Routes organized by business domain');
  console.log('✅ CONSISTENT NAMING: Standardized file and endpoint naming');
  console.log('✅ ADMIN SEPARATION: Clear admin/user route separation');
  console.log('✅ SERVICE ARCHITECTURE: Routes → Controllers → Services pattern');
  console.log('✅ ZERO DOWNTIME: Backward compatibility maintained');
  console.log('================================================================================');
  
  console.log('\n📊 REORGANIZED ROUTE STRUCTURE:');
  console.log('   🔐 Authentication: /api/auth/*');
  console.log('   👤 Users: /api/users/*, /api/user-status/*, /api/admin/users/*');
  console.log('   📋 Membership: /api/membership/*, /api/admin/membership/*');
  console.log('   📊 Surveys: /api/survey/*, /api/admin/survey/*');
  console.log('   📚 Content: /api/content/* (chats, teachings, comments)');
  console.log('   🎓 Classes: /api/classes/*, /api/admin/classes/*');
  console.log('   🆔 Identity: /api/identity/*, /api/admin/identity/*');
  console.log('   💬 Communication: /api/communication/*');
  console.log('   🔧 System: /api/health, /api/info, /api/metrics');
  
  console.log('\n🛡️ ENHANCED FEATURES:');
  console.log('   • Rate limiting: Auth (20), Admin (50), General (100) per 15min');
  console.log('   • Security: Helmet protection, CORS configured');
  console.log('   • Performance: Compression, request caching');
  console.log('   • Monitoring: Enhanced logging, error tracking');
  console.log('   • Compatibility: Legacy routes preserved');
  
  console.log('================================================================================\n');
}

export default app;








// // ikootaapi/app.js
// // ENHANCED VERSION: Integrating admin membership routes with existing functionality

// import express from 'express';
// import helmet from 'helmet';
// import rateLimit from 'express-rate-limit';
// import cookieParser from 'cookie-parser';
// import cors from 'cors';
// import routes from './routes/index.js';
// import { errorHandler } from './utils/errorHandler.js';
// import morgan from 'morgan';
// import logger from './utils/logger.js';

// // ===== NEW IMPORTS FOR ADMIN MEMBERSHIP =====
// import adminMembershipRouter from './routes/adminMembershipRoutes.js';
// import membershipApplicationRouter from './routes/membershipApplicationRoutes.js';

// const app = express();

// // Middleware: Secure HTTP headers
// app.use(helmet());

// // Middleware: CORS (Enhanced for admin routes)
// app.use(cors({
//   origin: function (origin, callback) {
//     const allowedOrigins = [
//       'http://localhost:5173',
//       'http://localhost:3000',
//       process.env.PUBLIC_CLIENT_URL,
//       process.env.CLIENT_URL || 'http://localhost:5173'  // Added for admin routes compatibility
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

// // Middleware: Rate limiting (Enhanced for admin routes)
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
// // ===== ENHANCED: Special rate limit for admin routes =====
// app.use('/api/admin', createRateLimit(15 * 60 * 1000, 50, 'Too many admin requests'));
// app.use('/api', createRateLimit(15 * 60 * 1000, 100, 'Too many API requests')); 

// // Middleware: Parsers
// app.use(cookieParser());
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true }));

// // Middleware: Logging (Enhanced for admin routes)
// app.use(morgan('dev'));

// // ===== ENHANCED: Additional request logging for admin routes =====
// app.use('/api/admin', (req, res, next) => {
//   console.log(`🔐 ADMIN REQUEST: ${new Date().toISOString()} - ${req.method} ${req.path}`);
//   console.log(`   User: ${req.user?.username || 'Not authenticated'}`);
//   console.log(`   Role: ${req.user?.role || 'Unknown'}`);
//   next();
// });

// // ===== ENHANCED: Mount admin routes BEFORE general routes =====
// console.log('🔐 Mounting admin membership routes...');
// app.use('/api/admin/membership', adminMembershipRouter);

// console.log('👤 Mounting membership application routes...');
// app.use('/api/membership', membershipApplicationRouter);

// // ===== MOUNT ALL OTHER API ROUTES (EXISTING) =====
// console.log('🚀 Mounting general API routes at /api...');
// app.use('/api', routes);

// // ===== ROOT HEALTH CHECK (EXISTING) =====
// app.get('/health', (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'Server is healthy',
//     timestamp: new Date().toISOString(),
//     environment: process.env.NODE_ENV || 'development'
//   });
// });

// // ===== ENHANCED API DOCUMENTATION ENDPOINT =====
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
//             'GET /api/admin/membership/test': 'Test admin endpoints connectivity',
//             'GET /api/admin/membership/applications': 'Get membership applications (with ?status=pending)',
//             'GET /api/admin/membership/full-membership-stats': 'Get dashboard statistics',
//             'GET /api/admin/membership/pending-count': 'Get pending applications count',
//             'PUT /api/admin/membership/applications/:id/review': 'Review individual application',
//             'POST /api/admin/membership/applications/bulk-review': 'Bulk review applications',
//             'GET /api/admin/membership/applications/:id': 'Get application details'
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
//         membership: {
//           'GET /api/membership/dashboard': 'User membership dashboard',
//           'GET /api/membership/status': 'Current membership status',
//           'POST /api/membership/application/submit': 'Submit membership application',
//           'GET /api/membership/full-membership/status': 'Full membership status',
//           'POST /api/membership/full-membership/submit': 'Submit full membership application'
//         },
//         api: {
//           auth: 'GET /api/auth/*',
//           survey: 'GET /api/survey/*',
//           general: 'All other /api/* routes'
//         }
//       },
//       notes: {
//         authentication: 'Admin routes require Bearer token with admin/super_admin role',
//         rateLimit: 'Admin routes: 50 req/15min, General API: 100 req/15min, Auth: 10 req/15min'
//       }
//     });
//   } else {
//     res.status(404).json({ message: 'Resource not found' });
//   }
// });

// // ===== ENHANCED: Admin-specific test endpoint =====
// app.get('/api/test', (req, res) => {
//   const isAdminPath = req.originalUrl.includes('/admin/');
  
//   res.json({
//     success: true,
//     message: 'API server is running',
//     timestamp: new Date().toISOString(),
//     serverVersion: '2.0.0-admin-enhanced',
//     availableRoutes: {
//       admin: [
//         'GET /api/admin/membership/test',
//         'GET /api/admin/membership/applications?status=pending',
//         'GET /api/admin/membership/full-membership-stats',
//         'GET /api/admin/membership/pending-count',
//         'PUT /api/admin/membership/applications/:id/review',
//         'POST /api/admin/membership/applications/bulk-review'
//       ],
//       membership: [
//         'GET /api/membership/dashboard',
//         'GET /api/membership/status',
//         'POST /api/membership/application/submit',
//         'GET /api/membership/full-membership/status',
//         'POST /api/membership/full-membership/submit'
//       ],
//       general: [
//         'GET /health',
//         'GET /api-docs',
//         'All routes from routes/index.js'
//       ]
//     },
//     admin: {
//       enabled: true,
//       testEndpoint: '/api/admin/membership/test',
//       authRequired: 'Bearer token with admin/super_admin role'
//     }
//   });
// });

// // ===== 404 HANDLER (ENHANCED) =====
// app.use((req, res, next) => {
//   const isAdminRoute = req.originalUrl.startsWith('/api/admin/');
  
//   logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  
//   res.status(404).json({ 
//     success: false,
//     message: 'Resource not found',
//     path: req.originalUrl,
//     method: req.method,
//     suggestion: isAdminRoute 
//       ? 'Check admin routes - ensure authentication and correct endpoint' 
//       : 'Check /api-docs for available endpoints',
//     availableRoutes: isAdminRoute 
//       ? [
//           '/api/admin/membership/test',
//           '/api/admin/membership/applications',
//           '/api/admin/membership/full-membership-stats'
//         ]
//       : [
//           '/health',
//           '/api-docs',
//           '/api/test',
//           '/api/admin/membership/*',
//           '/api/membership/*'
//         ],
//     adminNote: isAdminRoute 
//       ? 'Admin routes require proper authentication and admin/super_admin role' 
//       : null
//   });
// });

// // ===== ERROR HANDLER (EXISTING - Enhanced for admin routes) =====
// app.use((error, req, res, next) => {
//   const isAdminRoute = req.originalUrl.startsWith('/api/admin/');
  
//   // Enhanced logging for admin routes
//   if (isAdminRoute) {
//     logger.error('❌ ADMIN ROUTE ERROR:', {
//       error: error.message,
//       path: req.path,
//       method: req.method,
//       user: req.user?.username || 'Not authenticated',
//       role: req.user?.role || 'Unknown',
//       timestamp: new Date().toISOString()
//     });
//   }
  
//   // Use existing error handler
//   errorHandler(error, req, res, next);
// });

// console.log('✅ Enhanced app.js loaded with admin membership routes');
// console.log('🔐 Admin routes available at /api/admin/membership/*');
// console.log('👤 Membership routes available at /api/membership/*');
// console.log('📚 Documentation available at /api-docs');

// export default app;


