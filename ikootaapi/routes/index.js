// ikootaapi/routes/index.js
// ENHANCED BASE ROUTING - Integrates existing routes with new functionality
// Preserves all existing functionality while adding new organized routes

import express from 'express';

// Import existing routes (preserve current functionality)
import authRoutes from './authRoutes.js'; // Your existing auth routes
// Import any other existing routes you currently have

// Import new enhanced routes
import enhancedUserRoutes from './enhanced/user.routes.js';
import enhancedApplicationRoutes from './enhanced/application.routes.js';
import enhancedAdminRoutes from './enhanced/admin.routes.js';
import enhancedContentRoutes from './enhanced/content.routes.js';

// Import middleware
import { tracingMiddleware } from '../middleware/tracingMiddleware.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// ===============================================
// GLOBAL MIDDLEWARE FOR ALL ROUTES
// ===============================================

// Add tracing to all routes
router.use(tracingMiddleware);

// Add request metadata
router.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  req.apiVersion = '3.0';
  next();
});

// ===============================================
// EXISTING ROUTES (PRESERVED)
// ===============================================

// Keep your existing authentication routes exactly as they are
router.use('/auth', authRoutes);

// Add any other existing routes here to preserve functionality
// router.use('/existing-route', existingRoutes);

// ===============================================
// NEW ENHANCED ROUTES (ADDITIVE)
// ===============================================

// Enhanced user management (extends existing functionality)
router.use('/user', enhancedUserRoutes);

// New application system (adds new functionality)
router.use('/applications', enhancedApplicationRoutes);

// New admin system (adds administrative capabilities)
router.use('/admin', enhancedAdminRoutes);

// New content system (adds Towncrier/Iko access and content management)
router.use('/content', enhancedContentRoutes);

// ===============================================
// API INFORMATION ENDPOINTS
// ===============================================

// API status and documentation
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Ikoota API v3.0 - Enhanced with backward compatibility',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    
    // Show both existing and new endpoints
    endpoints: {
      // Existing preserved endpoints
      existing: {
        auth: '/api/auth/* (preserved from v2.x)',
        // Add other existing endpoints here
      },
      
      // New enhanced endpoints
      enhanced: {
        user: '/api/user/* (enhanced user management)',
        applications: '/api/applications/* (new membership system)',
        admin: '/api/admin/* (new admin panel)',
        content: '/api/content/* (Towncrier/Iko access & content management)'
      }
    },
    
    migration: {
      status: 'backward_compatible',
      existing_routes: 'fully_preserved',
      new_features: 'additive_only',
      breaking_changes: 'none'
    }
  });
});

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '3.0.0',
      uptime: Math.floor(process.uptime()),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      },
      routes: {
        existing: 'operational',
        enhanced: 'operational'
      }
    };
    
    res.json(healthData);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;





// // ikootaapi/routes/index.js
// // REORGANIZED ROUTE COORDINATOR
// // Central hub for all reorganized route modules with enhanced architecture

// import express from 'express';
// import { validateIdFormat } from '../utils/idGenerator.js';



// const validateClassId = (req, res, next) => {
//   const { id } = req.params;
//   if (id && !validateIdFormat(id, 'class')) {
//     return res.status(400).json({
//       success: false,
//       error: 'Invalid class ID format. Expected OTU#XXXXXX format',
//       provided: id,
//       expected_format: 'OTU#XXXXXX'
//     });
//   }
//   next();
// };
// // ===============================================
// // IMPORT REORGANIZED ROUTE MODULES
// // ===============================================

// // Core System Routes
// import systemRoutes from './systemRoutes.js';
// import authRoutes from './authRoutes.js';

// // User Management Routes (3-tier structure)
// import userRoutes from './userRoutes.js';
// import userStatusRoutes from './userStatusRoutes.js';
// import userAdminRoutes from './userAdminRoutes.js';

// // Membership Management Routes (2-tier structure)
// import membershipRoutes from './membershipRoutes.js';
// import membershipAdminRoutes from './membershipAdminRoutes.js';

// // Survey Management Routes (2-tier structure)
// import surveyRoutes from './surveyRoutes.js';
// import surveyAdminRoutes from './surveyAdminRoutes.js';

// // Content Management Routes (unified)
// import contentRoutes from './contentRoutes.js';

// // Class Management Routes (2-tier structure)
// import classRoutes from './classRoutes.js';
// import classAdminRoutes from './classAdminRoutes.js';

// // Identity Management Routes (2-tier structure)
// import identityRoutes from './identityRoutes.js';
// import identityAdminRoutes from './identityAdminRoutes.js';

// // Communication Routes
// import communicationRoutes from './communicationRoutes.js';

// const router = express.Router();

// // ===============================================
// // ROUTE MOUNTING WITH ENHANCED ORGANIZATION
// // ===============================================

// console.log('🔧 Mounting reorganized API routes with enhanced architecture...');

// // ===== PHASE 1: CORE SYSTEM ROUTES =====
// console.log('📊 Phase 1: Core system routes...');
// router.use('/', systemRoutes);                    // /api/health, /api/info, /api/metrics
// router.use('/auth', authRoutes);                  // /api/auth/*

// // ===== PHASE 2: USER MANAGEMENT (3-TIER) =====
// console.log('👤 Phase 2: User management (3-tier structure)...');
// router.use('/users', userRoutes);                 // /api/users/* - Profile, settings, basic ops
// router.use('/user-status', userStatusRoutes);     // /api/user-status/* - Status, dashboard
// router.use('/admin/users', userAdminRoutes);      // /api/admin/users/* - Admin user management

// // ===== PHASE 3: MEMBERSHIP MANAGEMENT (2-TIER) =====  
// console.log('📋 Phase 3: Membership management (2-tier structure)...');
// router.use('/membership', membershipRoutes);      // /api/membership/* - Applications, status
// router.use('/admin/membership', membershipAdminRoutes); // /api/admin/membership/* - Admin reviews

// // ===== PHASE 4: SURVEY MANAGEMENT (2-TIER) =====
// console.log('📊 Phase 4: Survey management (2-tier structure)...');
// router.use('/survey', surveyRoutes);              // /api/survey/* - Submit, questions
// router.use('/admin/survey', surveyAdminRoutes);   // /api/admin/survey/* - Admin survey management

// // ===== PHASE 5: CONTENT MANAGEMENT (UNIFIED) =====
// console.log('📚 Phase 5: Content management (unified structure)...');
// router.use('/content', contentRoutes);            // /api/content/* - Chats, teachings, comments

// // ===== PHASE 6: CLASS MANAGEMENT (2-TIER) =====
// console.log('🎓 Phase 6: Class management (2-tier structure)...');
// router.use('/classes', classRoutes);              // /api/classes/* - General class operations  
// router.use('/admin/classes', classAdminRoutes);   // /api/admin/classes/* - Admin class management

// // ===== PHASE 7: IDENTITY MANAGEMENT (2-TIER) =====
// console.log('🆔 Phase 7: Identity management (2-tier structure)...');
// router.use('/identity', identityRoutes);          // /api/identity/* - Converse/mentor ID management
// router.use('/admin/identity', identityAdminRoutes); // /api/admin/identity/* - Admin identity control

// // ===== PHASE 8: COMMUNICATION =====
// console.log('💬 Phase 8: Communication infrastructure...');
// router.use('/communication', communicationRoutes); // /api/communication/* - Email, SMS, notifications

// // ===============================================
// // BACKWARD COMPATIBILITY LAYER
// // ===============================================
// console.log('🔄 Setting up backward compatibility layer...');

// // Legacy route mappings for zero-downtime migration
// const legacyRoutes = {
//   '/chats': '/content/chats',
//   '/teachings': '/content/teachings', 
//   '/comments': '/content/comments',
//   '/messages': '/content/teachings', // Messages mapped to teachings
//   '/membership-complete': '/membership',
//   '/admin-users': '/admin/users',
//   '/admin-membership': '/admin/membership',
//   '/admin-content': '/content/admin'
// };

// // Mount legacy compatibility routes
// Object.entries(legacyRoutes).forEach(([oldPath, newPath]) => {
//   router.use(oldPath, (req, res, next) => {
//     console.log(`🔄 Legacy route accessed: ${oldPath} → ${newPath}`);
//     req.url = newPath.replace('/content', '') + req.url;
    
//     // Route to appropriate handler based on new path
//     if (newPath.startsWith('/content')) {
//       contentRoutes(req, res, next);
//     } else if (newPath.startsWith('/admin/users')) {
//       userAdminRoutes(req, res, next);
//     } else if (newPath.startsWith('/admin/membership')) {
//       membershipAdminRoutes(req, res, next);
//     } else if (newPath.startsWith('/membership')) {
//       membershipRoutes(req, res, next);
//     } else {
//       next();
//     }
//   });
// });

// // ===============================================
// // API DISCOVERY & DOCUMENTATION
// // ===============================================

// router.get('/info', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Ikoota API - Reorganized Architecture v3.0.0',
//     version: '3.0.0',
//     timestamp: new Date().toISOString(),
//     environment: process.env.NODE_ENV || 'development',
    
//     architecture: {
//       description: 'Functionally grouped routes with clean separation of concerns',
//       principles: [
//         'Domain-driven route organization',
//         'Consistent admin/user separation',
//         'Service layer architecture ready',
//         'Zero functionality loss',
//         'Enhanced maintainability'
//       ],
//       improvements: [
//         'Reduced route file count from 15+ to 13 focused modules',
//         'Clear naming conventions (userAdminRoutes not adminUserRoutes)',
//         'Unified content management (/api/content/*)',
//         'Enhanced admin route security and logging',
//         'Comprehensive backward compatibility'
//       ]
//     },
    
//     routeOrganization: {
//       coreSystem: {
//         authentication: '/api/auth/*',
//         systemHealth: '/api/health, /api/info, /api/metrics'
//       },
//       userManagement: {
//         general: '/api/users/* - Profile, settings, basic operations',
//         status: '/api/user-status/* - Dashboard, status checks',
//         admin: '/api/admin/users/* - Admin user management'
//       },
//       membershipSystem: {
//         general: '/api/membership/* - Applications, status, surveys',
//         admin: '/api/admin/membership/* - Application reviews, analytics'
//       },
//       surveySystem: {
//         general: '/api/survey/* - Submit surveys, get questions',
//         admin: '/api/admin/survey/* - Manage questions, review submissions'
//       },
//       contentManagement: {
//         unified: '/api/content/* - All content types (chats, teachings, comments)',
//         structure: {
//           chats: '/api/content/chats/*',
//           teachings: '/api/content/teachings/*',
//           comments: '/api/content/comments/*',
//           admin: '/api/content/admin/*'
//         }
//       },
//       classManagement: {
//         general: '/api/classes/* - Class enrollment, content access',
//         admin: '/api/admin/classes/* - Class creation, management'
//       },
//       identityManagement: {
//         general: '/api/identity/* - Converse ID, mentor ID operations',
//         admin: '/api/admin/identity/* - Identity administration'
//       },
//       communication: '/api/communication/* - Email, SMS, notifications, future video/audio'
//     },
    
//     adminSeparation: {
//       pattern: 'All admin routes prefixed with /admin/ for clear separation',
//       security: 'Enhanced rate limiting and logging for admin operations',
//       routes: [
//         '/api/admin/users/*',
//         '/api/admin/membership/*', 
//         '/api/admin/survey/*',
//         '/api/admin/classes/*',
//         '/api/admin/identity/*'
//       ]
//     },
    
//     backwardCompatibility: {
//       enabled: true,
//       legacyRoutes: [
//         '/api/chats → /api/content/chats',
//         '/api/teachings → /api/content/teachings',
//         '/api/comments → /api/content/comments', 
//         '/api/messages → /api/content/teachings'
//       ],
//       migration: 'Zero-downtime migration supported'
//     },
    
//     serviceLayerReady: {
//       status: 'Architecture prepared for service layer implementation',
//       pattern: 'Routes → Controllers → Services',
//       benefits: [
//         'Business logic separation',
//         'Enhanced testability',
//         'Code reusability',
//         'Transaction management'
//       ]
//     }
//   });
// });

// router.get('/routes', (req, res) => {
//   const routeInfo = {
//     success: true,
//     message: 'Complete Route Discovery - Reorganized Architecture',
//     totalRouteModules: 13,
//     organizationPattern: 'Domain-driven with admin separation',
    
//     routeModules: {
//       core: [
//         'systemRoutes.js - Health, info, metrics',
//         'authRoutes.js - Authentication only'
//       ],
//       userManagement: [
//         'userRoutes.js - Profile, settings, basic operations',
//         'userStatusRoutes.js - Dashboard, status checks', 
//         'userAdminRoutes.js - Admin user management'
//       ],
//       membershipSystem: [
//         'membershipRoutes.js - Applications, status',
//         'membershipAdminRoutes.js - Admin reviews, analytics'
//       ],
//       surveySystem: [
//         'surveyRoutes.js - Submit, questions',
//         'surveyAdminRoutes.js - Admin survey management'
//       ],
//       content: [
//         'contentRoutes.js - Unified content management (chats, teachings, comments)'
//       ],
//       classSystem: [
//         'classRoutes.js - General class operations',
//         'classAdminRoutes.js - Admin class management'
//       ],
//       identitySystem: [
//         'identityRoutes.js - Converse/mentor ID operations',
//         'identityAdminRoutes.js - Admin identity control'
//       ],
//       communication: [
//         'communicationRoutes.js - Email, SMS, notifications, future video/audio'
//       ]
//     },
    
//     endpointStructure: {
//       '/api/auth/*': 'Authentication endpoints',
//       '/api/users/*': 'User profile and settings',
//       '/api/user-status/*': 'User dashboard and status',
//       '/api/membership/*': 'Membership applications and status',
//       '/api/survey/*': 'Survey submissions and questions',
//       '/api/content/*': 'Unified content (chats, teachings, comments)',
//       '/api/classes/*': 'Class enrollment and access',
//       '/api/identity/*': 'Identity management (converse/mentor)',
//       '/api/communication/*': 'Email, SMS, notifications',
//       '/api/admin/users/*': 'Admin user management',
//       '/api/admin/membership/*': 'Admin membership reviews',
//       '/api/admin/survey/*': 'Admin survey management',
//       '/api/admin/classes/*': 'Admin class management',
//       '/api/admin/identity/*': 'Admin identity control'
//     },
    
//     implementationStatus: {
//       phase1: '✅ Core infrastructure (app.js, server.js, index.js)',
//       phase2: '🔄 Route modules (in progress)',
//       phase3: '⏳ Controllers reorganization',
//       phase4: '⏳ Services implementation',
//       phase5: '⏳ Middleware consolidation'
//     },
    
//     timestamp: new Date().toISOString()
//   };
  
//   res.json(routeInfo);
// });

// // ===============================================
// // ENHANCED 404 HANDLER
// // ===============================================

// router.use('*', (req, res) => {
//   console.log(`❌ API route not found: ${req.method} ${req.originalUrl}`);
  
//   const requestedPath = req.originalUrl.toLowerCase();
//   const suggestions = [];
  
//   // Smart path suggestions
//   if (requestedPath.includes('user')) {
//     suggestions.push('/api/users', '/api/user-status', '/api/admin/users');
//   }
//   if (requestedPath.includes('member')) {
//     suggestions.push('/api/membership', '/api/admin/membership');
//   }
//   if (requestedPath.includes('admin')) {
//     suggestions.push('/api/admin/users', '/api/admin/membership', '/api/admin/classes');
//   }
//   if (requestedPath.includes('content') || requestedPath.includes('chat') || requestedPath.includes('teaching')) {
//     suggestions.push('/api/content/chats', '/api/content/teachings', '/api/content/comments');
//   }
//   if (requestedPath.includes('class')) {
//     suggestions.push('/api/classes', '/api/admin/classes');
//   }
//   if (requestedPath.includes('survey')) {
//     suggestions.push('/api/survey', '/api/admin/survey');
//   }
//   if (requestedPath.includes('identity')) {
//     suggestions.push('/api/identity', '/api/admin/identity');
//   }
  
//   res.status(404).json({
//     success: false,
//     message: 'API endpoint not found',
//     path: req.originalUrl,
//     method: req.method,
//     suggestions: suggestions.length > 0 ? suggestions : undefined,
    
//     availableRouteGroups: {
//       core: {
//         authentication: '/api/auth/*',
//         system: '/api/health, /api/info, /api/routes, /api/metrics'
//       },
//       userManagement: {
//         general: '/api/users/* - Profile, settings, basic operations',
//         status: '/api/user-status/* - Dashboard, status checks',
//         admin: '/api/admin/users/* - Admin user management'
//       },
//       membershipSystem: {
//         general: '/api/membership/* - Applications, status',
//         admin: '/api/admin/membership/* - Reviews, analytics'
//       },
//       surveySystem: {
//         general: '/api/survey/* - Submit, questions',
//         admin: '/api/admin/survey/* - Management'
//       },
//       contentManagement: {
//         unified: '/api/content/* - All content types',
//         breakdown: {
//           chats: '/api/content/chats/*',
//           teachings: '/api/content/teachings/*',
//           comments: '/api/content/comments/*',
//           admin: '/api/content/admin/*'
//         }
//       },
//       classManagement: {
//         general: '/api/classes/* - Enrollment, access',
//         admin: '/api/admin/classes/* - Creation, management'
//       },
//       identityManagement: {
//         general: '/api/identity/* - Converse/mentor operations',
//         admin: '/api/admin/identity/* - Administration'
//       },
//       communication: '/api/communication/* - Email, SMS, notifications'
//     },
    
//     legacyCompatibility: {
//       note: 'Legacy routes automatically redirected',
//       examples: [
//         '/api/chats → /api/content/chats',
//         '/api/teachings → /api/content/teachings',
//         '/api/messages → /api/content/teachings'
//       ]
//     },
    
//     help: {
//       documentation: '/api/info',
//       routeDiscovery: '/api/routes', 
//       healthCheck: '/api/health',
//       performanceMetrics: '/api/metrics'
//     },
    
//     timestamp: new Date().toISOString()
//   });
// });

// // ===============================================
// // GLOBAL ERROR HANDLER FOR ROUTES
// // ===============================================

// router.use((error, req, res, next) => {
//   const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2);
//   const isAdminRoute = req.originalUrl.startsWith('/api/admin/');
  
//   console.error('🚨 Global Route Error:', {
//     errorId,
//     error: error.message,
//     stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
//     path: req.originalUrl,
//     method: req.method,
//     ip: req.ip,
//     isAdminRoute,
//     timestamp: new Date().toISOString()
//   });
  
//   let statusCode = error.statusCode || error.status || 500;
//   let errorType = 'server_error';
  
//   // Enhanced error categorization
//   if (error.message.includes('validation') || error.message.includes('required')) {
//     statusCode = 400;
//     errorType = 'validation_error';
//   } else if (error.message.includes('authentication') || error.message.includes('token')) {
//     statusCode = 401;
//     errorType = 'authentication_error';
//   } else if (error.message.includes('permission') || error.message.includes('access denied')) {
//     statusCode = 403;
//     errorType = 'authorization_error';
//   } else if (error.message.includes('not found')) {
//     statusCode = 404;
//     errorType = 'not_found_error';
//   } else if (error.message.includes('database') || error.message.includes('connection')) {
//     statusCode = 503;
//     errorType = 'database_error';
//   } else if (error.message.includes('timeout')) {
//     statusCode = 504;
//     errorType = 'timeout_error';
//   }
  
//   const errorResponse = {
//     success: false,
//     error: error.message || 'Internal server error',
//     errorType,
//     errorId,
//     path: req.originalUrl,
//     method: req.method,
//     isAdminRoute,
//     timestamp: new Date().toISOString()
//   };
  
//   // Add debug info in development
//   if (process.env.NODE_ENV === 'development') {
//     errorResponse.debug = {
//       stack: error.stack,
//       details: error
//     };
//   }
  
  

  
//   // Add contextual help based on error type and route
//   if (statusCode === 401) {
//     errorResponse.help = {
//       message: 'Authentication required',
//       endpoint: '/api/auth/login',
//       adminNote: isAdminRoute ? 'Admin routes require Bearer token with admin/super_admin role' : undefined
//     };
//   } else if (statusCode === 403) {
//     errorResponse.help = {
//       message: 'Insufficient permissions',
//       adminNote: isAdminRoute ? 'Admin routes require admin or super_admin role' : undefined
//     };
//   } else if (statusCode === 404) {
//     errorResponse.help = {
//       message: 'Endpoint not found',
//       routeDiscovery: '/api/routes',
//       documentation: '/api/info'
//     };
//   }
  
//   res.status(statusCode).json(errorResponse);
// });

// // ===============================================
// // DEVELOPMENT LOGGING & STARTUP INFO
// // ===============================================

// if (process.env.NODE_ENV === 'development') {
//   console.log('\n🚀 IKOOTA API ROUTES - REORGANIZED ARCHITECTURE v3.0.0');
//   console.log('================================================================================');
//   console.log('✅ DOMAIN-DRIVEN ORGANIZATION: Routes grouped by business function');
//   console.log('✅ ADMIN SEPARATION: Clear /admin/ prefix for all administrative routes');
//   console.log('✅ SERVICE READY: Architecture prepared for service layer implementation');
//   console.log('✅ CONSISTENT NAMING: Standardized file and endpoint naming conventions');
//   console.log('✅ ZERO DOWNTIME: Complete backward compatibility with legacy routes');
//   console.log('================================================================================');
  
//   console.log('\n📊 REORGANIZATION SUMMARY:');
//   console.log('   📁 Route Modules: 13 functionally grouped files');
//   console.log('   🎯 Admin Routes: 6 dedicated admin modules with enhanced security');
//   console.log('   🔄 Legacy Support: 8 backward compatibility mappings');
//   console.log('   🛡️ Security: Enhanced rate limiting and error handling');
//   console.log('   📈 Scalability: Structure supports future features (video calls, etc.)');
  
//   console.log('\n🗂️ NEW FILE STRUCTURE:');
//   console.log('   Core System:');
//   console.log('   • systemRoutes.js - Health, info, metrics');
//   console.log('   • authRoutes.js - Authentication only');
//   console.log('');
//   console.log('   User Management (3-tier):');
//   console.log('   • userRoutes.js - Profile, settings, basic ops');
//   console.log('   • userStatusRoutes.js - Dashboard, status checks');
//   console.log('   • userAdminRoutes.js - Admin user management');
//   console.log('');
//   console.log('   Domain-Specific (2-tier each):');
//   console.log('   • membershipRoutes.js + membershipAdminRoutes.js');
//   console.log('   • surveyRoutes.js + surveyAdminRoutes.js');
//   console.log('   • classRoutes.js + classAdminRoutes.js');
//   console.log('   • identityRoutes.js + identityAdminRoutes.js');
//   console.log('');
//   console.log('   Unified Systems:');
//   console.log('   • contentRoutes.js - Chats, teachings, comments unified');
//   console.log('   • communicationRoutes.js - Email, SMS, future video/audio');
  
//   console.log('\n🎯 IMPLEMENTATION BENEFITS:');
//   console.log('   • Easier maintenance: Related functions grouped together');
//   console.log('   • Clear responsibility: Each file has focused purpose');
//   console.log('   • Scalable architecture: Easy to add new features');
//   console.log('   • Enhanced security: Admin routes properly isolated');
//   console.log('   • Better testing: Modular structure supports unit testing');
//   console.log('   • Code reusability: Service layer architecture ready');
  
//   console.log('\n🔄 MIGRATION STRATEGY:');
//   console.log('   1. ✅ Core infrastructure (app.js, server.js, index.js)');
//   console.log('   2. 🔄 Route reorganization (current phase)');
//   console.log('   3. ⏳ Controller consolidation'); 
//   console.log('   4. ⏳ Service layer implementation');
//   console.log('   5. ⏳ Legacy cleanup');
  
//   console.log('================================================================================');
//   console.log('🌟 REORGANIZED ROUTE ARCHITECTURE READY');
//   console.log('🔗 API Info: http://localhost:3000/api/info');
//   console.log('📋 Route Discovery: http://localhost:3000/api/routes');
//   console.log('❤️ Health Check: http://localhost:3000/api/health');
//   console.log('================================================================================\n');
// }

// export default router;

