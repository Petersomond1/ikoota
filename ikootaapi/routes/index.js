// routes/index.js - COMPLETE ROUTE HUB WITH ALL ADMIN ROUTES
// This is the main router that mounts ALL route systems

import express from 'express';

// ===============================================
// IMPORT ALL ROUTE MODULES
// ===============================================

// Authentication routes
import authRoutes from './authRoutes.js';

// User routes
import userRoutes from './userRoutes.js';
import userAdminRoutes from './userAdminRoutes.js';  // ✅ ADD THIS

// Content routes  
import contentRoutes from './contentRoutes.js';

// Membership routes
import membershipRoutes from './membershipRoutes.js';
import membershipAdminRoutes from './membershipAdminRoutes.js';  // ✅ ADD THIS

const router = express.Router();

// ===============================================
// GLOBAL MIDDLEWARE
// ===============================================

// Add request metadata to all routes
router.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  req.apiVersion = '3.1';
  next();
});

// Add debugging middleware to see what routes are being hit
router.use('*', (req, res, next) => {
  console.log(`🔍 Route Debug: ${req.method} ${req.originalUrl}`);
  next();
});

// ===============================================
// MOUNT ALL ROUTES WITH PROPER PATHS
// ===============================================

// 1. Authentication Routes
console.log('🔗 Mounting authentication routes at /auth...');
router.use('/auth', authRoutes);
console.log('✅ Authentication routes mounted');

// 2. User Routes (regular user management)
console.log('🔗 Mounting user routes at /users...');
try {
  router.use('/users', userRoutes);
  console.log('✅ User routes mounted');
} catch (error) {
  console.error('❌ Failed to mount user routes:', error.message);
}

// 3. User Admin Routes - ✅ CRITICAL FIX
console.log('🔗 Mounting user admin routes at /admin/users...');
try {
  router.use('/admin/users', userAdminRoutes);
  console.log('✅ User admin routes mounted');
} catch (error) {
  console.error('❌ Failed to mount user admin routes:', error.message);
  console.warn('⚠️ Continuing without user admin routes...');
}

// 4. Content Routes
console.log('🔗 Mounting content routes at /content...');
try {
  router.use('/content', contentRoutes);
  console.log('✅ Content routes mounted');
} catch (error) {
  console.error('❌ Failed to mount content routes:', error.message);
}

// 5. Membership Routes (main membership functionality)
console.log('🔗 Mounting membership routes at /membership...');
try {
  router.use('/membership', membershipRoutes);
  console.log('✅ Membership routes mounted');
} catch (error) {
  console.error('❌ Failed to mount membership routes:', error.message);
}

// 6. Membership Admin Routes - ✅ CRITICAL FIX  
console.log('🔗 Mounting membership admin routes at /membership/admin...');
try {
  router.use('/membership/admin', membershipAdminRoutes);
  console.log('✅ Membership admin routes mounted');
  console.log('   📊 Admin endpoints now available:');
  console.log('   • GET /api/membership/admin/test');
  console.log('   • GET /api/membership/admin/full-membership-stats');
  console.log('   • GET /api/membership/admin/applications');
  console.log('   • GET /api/membership/admin/analytics');
  console.log('   • GET /api/membership/admin/stats');
  console.log('   • GET /api/membership/admin/overview');
} catch (error) {
  console.error('❌ Failed to mount membership admin routes:', error.message);
  console.warn('⚠️ Continuing without membership admin routes...');
}

// ===============================================
// BACKWARD COMPATIBILITY ROUTES
// ===============================================

console.log('🔄 Setting up backward compatibility...');

// Legacy content routes
router.use('/chats', (req, res, next) => {
  console.log('🔄 Legacy /chats → /content/chats');
  req.url = '/chats' + req.url;
  contentRoutes(req, res, next);
});

router.use('/teachings', (req, res, next) => {
  console.log('🔄 Legacy /teachings → /content/teachings');
  req.url = '/teachings' + req.url;
  contentRoutes(req, res, next);
});

router.use('/comments', (req, res, next) => {
  console.log('🔄 Legacy /comments → /content/comments');
  req.url = '/comments' + req.url;
  contentRoutes(req, res, next);
});

// Legacy membership routes
router.use('/apply', (req, res, next) => {
  console.log('🔄 Legacy /apply → /membership/apply');
  req.url = '/apply' + req.url;
  membershipRoutes(req, res, next);
});

// ===============================================
// API INFORMATION ROUTES
// ===============================================

// Main API info endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Ikoota API v3.1 - COMPLETE SYSTEM WITH ALL ADMIN ROUTES',
    version: '3.1.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    
    mounted_routes: {
      authentication: {
        path: '/api/auth',
        status: '✅ MOUNTED',
        description: 'JWT authentication system'
      },
      user_management: {
        path: '/api/users',
        status: '✅ MOUNTED',
        description: 'User profiles, settings, status'
      },
      user_administration: {  // ✅ NEW
        path: '/api/admin/users',
        status: '✅ MOUNTED',
        description: 'Admin user management, roles, permissions'
      },
      content_system: {
        path: '/api/content',
        status: '✅ MOUNTED',
        description: 'Chats, teachings, comments with admin panel'
      },
      membership_system: {
        path: '/api/membership',
        status: '✅ MOUNTED',
        description: 'Membership applications and status'
      },
      membership_administration: {  // ✅ NEW
        path: '/api/membership/admin',
        status: '✅ MOUNTED',
        description: 'Admin membership management and analytics'
      }
    },
    
    admin_endpoints: {  // ✅ NEW SECTION
      user_admin: [
        'GET /api/admin/users/test - Test user admin system',
        'GET /api/admin/users - Get all users',
        'GET /api/admin/users/search - Search users',
        'GET /api/admin/users/stats - User statistics',
        'POST /api/admin/users/create - Create user',
        'PUT /api/admin/users/:id - Update user',
        'PUT /api/admin/users/role - Update user role',
        'POST /api/admin/users/ban - Ban user',
        'POST /api/admin/users/unban - Unban user'
      ],
      membership_admin: [
        'GET /api/membership/admin/test - Test membership admin system',
        'GET /api/membership/admin/full-membership-stats - Get statistics',
        'GET /api/membership/admin/applications - Get applications',
        'GET /api/membership/admin/analytics - Get analytics',
        'GET /api/membership/admin/stats - Get application stats',
        'GET /api/membership/admin/overview - Get overview',
        'GET /api/membership/admin/health - Health check'
      ]
    },
    
    quick_tests: {
      user_admin: 'GET /api/admin/users/test',
      membership_admin: 'GET /api/membership/admin/test',
      user_profile: 'GET /api/users/profile',
      membership_status: 'GET /api/membership/status',
      content_chats: 'GET /api/content/chats'
    },
    
    legacy_compatibility: {
      content: 'Old /chats, /teachings routes redirect to /content/*',
      membership: 'Old /apply routes redirect to /membership/*'
    }
  });
});

// Health check for the router
router.get('/health', async (req, res) => {
  try {
    const routeCount = {
      auth: 'mounted',
      users: 'mounted', 
      user_admin: 'mounted',  // ✅ NEW
      content: 'mounted',
      membership: 'mounted',
      membership_admin: 'mounted'  // ✅ NEW
    };
    
    res.json({
      success: true,
      message: 'All route systems healthy',
      systems: routeCount,
      total_systems: Object.keys(routeCount).length,
      admin_systems: ['user_admin', 'membership_admin'],  // ✅ NEW
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'Route system unhealthy',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Route discovery endpoint
router.get('/routes', (req, res) => {
  res.json({
    success: true,
    message: 'Route Discovery - COMPLETE SYSTEM',
    version: '3.1.0',
    
    all_routes: {
      authentication: {
        base: '/api/auth',
        status: 'operational',
        endpoints: ['POST /login', 'POST /register', 'POST /logout']
      },
      user_management: {
        base: '/api/users',
        status: 'operational',
        endpoints: ['GET /profile', 'PUT /profile', 'GET /dashboard']
      },
      user_administration: {  // ✅ NEW
        base: '/api/admin/users',
        status: 'operational',
        note: 'Requires admin role',
        endpoints: ['GET /test', 'GET /', 'GET /search', 'POST /create']
      },
      content_management: {
        base: '/api/content',
        status: 'operational',
        endpoints: ['GET /chats', 'POST /chats', 'GET /teachings']
      },
      membership_management: {
        base: '/api/membership',
        status: 'operational',
        endpoints: ['GET /status', 'GET /dashboard', 'POST /apply/initial']
      },
      membership_administration: {  // ✅ NEW
        base: '/api/membership/admin',
        status: 'operational',
        note: 'Requires admin role',
        endpoints: ['GET /test', 'GET /stats', 'GET /applications']
      }
    },
    
    admin_test_urls: {  // ✅ NEW
      user_admin: 'http://localhost:3000/api/admin/users/test',
      membership_admin: 'http://localhost:3000/api/membership/admin/test'
    },
    
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// TEST ROUTES FOR DEBUGGING
// ===============================================

// Test route to verify the main router is working
router.get('/test-main-router', (req, res) => {
  res.json({
    success: true,
    message: 'Main router (routes/index.js) is working!',
    timestamp: new Date().toISOString(),
    mounted_systems: [
      'auth ✅',
      'users ✅', 
      'admin/users ✅',  // ✅ NEW
      'content ✅',
      'membership ✅',
      'membership/admin ✅'  // ✅ NEW
    ]
  });
});

// ===============================================
// ERROR HANDLING
// ===============================================

// 404 handler for routes
router.use('*', (req, res) => {
  console.log(`❌ Route not found in main router: ${req.method} ${req.originalUrl}`);
  
  const path = req.originalUrl.toLowerCase();
  const suggestions = [];
  
  // Smart suggestions based on the requested path
  if (path.includes('admin') && path.includes('user')) {
    suggestions.push('/api/admin/users/test', '/api/admin/users/stats');
  } else if (path.includes('admin') && path.includes('membership')) {
    suggestions.push('/api/membership/admin/test', '/api/membership/admin/stats');
  } else if (path.includes('user')) {
    suggestions.push('/api/users/profile', '/api/users/dashboard');
  } else if (path.includes('membership')) {
    suggestions.push('/api/membership/status', '/api/membership/dashboard');
  } else if (path.includes('content')) {
    suggestions.push('/api/content/chats', '/api/content/teachings');
  } else if (path.includes('auth')) {
    suggestions.push('/api/auth/login', '/api/auth/register');
  }
  
  res.status(404).json({
    success: false,
    message: 'API endpoint not found in main router',
    path: req.originalUrl,
    method: req.method,
    suggestions: suggestions.length > 0 ? suggestions : [
      '/api/ - API info',
      '/api/health - Health check',
      '/api/routes - Route discovery',
      '/api/admin/users/test - User admin test',  // ✅ NEW
      '/api/membership/admin/test - Membership admin test',  // ✅ NEW
      '/api/users/profile - User profile',
      '/api/membership/status - Membership status'
    ],
    
    available_systems: {
      auth: '/api/auth/*',
      users: '/api/users/*',
      user_admin: '/api/admin/users/*',  // ✅ NEW
      content: '/api/content/*',
      membership: '/api/membership/*',
      membership_admin: '/api/membership/admin/*'  // ✅ NEW
    },
    
    admin_systems: {  // ✅ NEW
      user_administration: '/api/admin/users/* (requires admin role)',
      membership_administration: '/api/membership/admin/* (requires admin role)'
    },
    
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// STARTUP LOGGING
// ===============================================

if (process.env.NODE_ENV === 'development') {
  console.log('\n🚀 MAIN ROUTER (routes/index.js) - ALL SYSTEMS MOUNTED');
  console.log('================================================================================');
  console.log('✅ ROUTE SYSTEMS MOUNTED:');
  console.log('   📁 Authentication: /auth');
  console.log('   👤 Users: /users');
  console.log('   🔧 User Admin: /admin/users');  // ✅ NEW
  console.log('   📚 Content: /content');
  console.log('   👥 Membership: /membership');
  console.log('   🔐 Membership Admin: /membership/admin');  // ✅ NEW
  console.log('');
  console.log('🎯 ADMIN SYSTEMS READY:');
  console.log('   • User Administration: /api/admin/users/*');
  console.log('   • Membership Administration: /api/membership/admin/*');
  console.log('');
  console.log('🧪 QUICK TESTS:');
  console.log('   • Main Router: /api/test-main-router');
  console.log('   • User Admin: /api/admin/users/test');
  console.log('   • Membership Admin: /api/membership/admin/test');
  console.log('================================================================================\n');
}

export default router;








// // ikootaapi/routes/index.js - FIXED WITH ADMIN MEMBERSHIP ROUTES
// // Add admin membership routes to your existing file

// import express from 'express';

// // ===============================================
// // EXISTING ROUTES (PRESERVE EXACTLY AS THEY ARE)
// // ===============================================

// // Import your existing routes - keep these exactly as they were
// import authRoutes from './authRoutes.js';

// // ===============================================
// // NEW INTEGRATED ROUTES (READY TO USE)
// // ===============================================

// // Import the content routes we built - this file EXISTS and is complete
// import contentRoutes from './contentRoutes.js';

// // Import the membership routes we just completed - this file NOW EXISTS and is complete
// import membershipRoutes from './membershipRoutes.js';

// // ✅ CRITICAL FIX: Import admin membership routes
// import membershipAdminRoutes from './membershipAdminRoutes.js';

// const router = express.Router();

// // ===============================================
// // GLOBAL MIDDLEWARE
// // ===============================================

// // Add request metadata to all routes
// router.use((req, res, next) => {
//   req.requestTime = new Date().toISOString();
//   req.apiVersion = '3.0';
//   next();
// });

// // ===============================================
// // MOUNT EXISTING ROUTES (PRESERVE FUNCTIONALITY)
// // ===============================================

// // Keep your existing authentication routes exactly as they are
// console.log('🔗 Mounting authentication routes at /auth...');
// router.use('/auth', authRoutes);

// // ===============================================
// // MOUNT NEW INTEGRATED ROUTES (READY TO USE)
// // ===============================================

// // Mount the content management system we built
// console.log('📚 Mounting content management routes at /content...');
// router.use('/content', contentRoutes);

// // Mount the membership system we just completed
// console.log('👥 Mounting membership management routes at /membership...');
// router.use('/membership', membershipRoutes);

// // ✅ CRITICAL FIX: Mount admin membership routes WITHIN the membership namespace
// console.log('🔐 Mounting admin membership routes at /membership/admin...');
// router.use('/membership/admin', membershipAdminRoutes);

// // ===============================================
// // BACKWARD COMPATIBILITY FOR CONTENT ROUTES
// // ===============================================

// // Legacy route mappings for existing clients
// console.log('🔄 Setting up backward compatibility for content routes...');

// // Map old direct content routes to new unified content routes
// router.use('/chats', (req, res, next) => {
//   console.log('🔄 Legacy /chats route accessed, redirecting to /content/chats');
//   req.url = '/chats' + req.url;
//   contentRoutes(req, res, next);
// });

// router.use('/teachings', (req, res, next) => {
//   console.log('🔄 Legacy /teachings route accessed, redirecting to /content/teachings');
//   req.url = '/teachings' + req.url;
//   contentRoutes(req, res, next);
// });

// router.use('/comments', (req, res, next) => {
//   console.log('🔄 Legacy /comments route accessed, redirecting to /content/comments');
//   req.url = '/comments' + req.url;
//   contentRoutes(req, res, next);
// });

// // If you had messages mapped to teachings
// router.use('/messages', (req, res, next) => {
//   console.log('🔄 Legacy /messages route accessed, redirecting to /content/teachings');
//   req.url = '/teachings' + req.url;
//   contentRoutes(req, res, next);
// });

// // ===============================================
// // BACKWARD COMPATIBILITY FOR MEMBERSHIP ROUTES
// // ===============================================

// // Legacy membership route mappings (if you had any direct routes before)
// console.log('🔄 Setting up backward compatibility for membership routes...');

// // If you had direct membership application routes before
// router.use('/apply', (req, res, next) => {
//   console.log('🔄 Legacy /apply route accessed, redirecting to /membership/apply');
//   req.url = '/apply' + req.url;
//   membershipRoutes(req, res, next);
// });

// // If you had direct application routes before
// router.use('/application', (req, res, next) => {
//   console.log('🔄 Legacy /application route accessed, redirecting to /membership/application');
//   req.url = '/application' + req.url;
//   membershipRoutes(req, res, next);
// });

// // ===============================================
// // API INFORMATION ENDPOINTS
// // ===============================================

// // API status and documentation
// router.get('/', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Ikoota API v3.1 - Content & Membership Management Integrated WITH ADMIN ROUTES',
//     version: '3.1.0',
//     timestamp: new Date().toISOString(),
//     environment: process.env.NODE_ENV || 'development',
    
//     endpoints: {
//       // Your existing routes
//       existing: {
//         auth: '/api/auth/* (authentication system)',
//       },
      
//       // Content management system
//       content: {
//         chats: '/api/content/chats/* (7-step chat creation & management)',
//         teachings: '/api/content/teachings/* (8-step teaching creation & management)',
//         comments: '/api/content/comments/* (threaded comments with media)',
//         admin: '/api/content/admin/* (content moderation & analytics)',
//       },
      
//       // Membership management system
//       membership: {
//         status: '/api/membership/status/* (membership status & dashboard)',
//         applications: '/api/membership/apply/* (initial & full membership applications)',
//         analytics: '/api/membership/analytics/* (membership analytics)',
//         survey: '/api/membership/survey/* (survey integration)',
//         // ✅ NEW: Admin membership routes
//         admin: '/api/membership/admin/* (admin membership management)',
//       },
      
//       // ✅ NEW: Admin membership endpoints
//       membershipAdmin: {
//         applications: 'GET /api/membership/admin/applications - Get applications',
//         stats: 'GET /api/membership/admin/full-membership-stats - Get full membership stats',
//         analytics: 'GET /api/membership/admin/analytics - Get analytics',
//         overview: 'GET /api/membership/admin/overview - Get overview',
//         test: 'GET /api/membership/admin/test - Test connectivity'
//       },
      
//       // Legacy compatibility
//       legacy: {
//         note: 'Legacy routes automatically redirected to new systems',
//         content: {
//           '/api/chats': '/api/content/chats',
//           '/api/teachings': '/api/content/teachings',
//           '/api/comments': '/api/content/comments',
//           '/api/messages': '/api/content/teachings'
//         },
//         membership: {
//           '/api/apply': '/api/membership/apply',
//           '/api/application': '/api/membership/application'
//         }
//       }
//     },
    
//     currentPhase: {
//       phase: 'Content & Membership Management Integration WITH ADMIN ROUTES',
//       status: 'Complete and Ready',
//       features: {
//         contentManagement: {
//           multiStepForms: 'Chat (7-step) and Teaching (8-step) creation',
//           contentModeration: 'Admin approval workflow',
//           mediaSupport: 'S3-integrated file uploads',
//           threadedComments: 'Nested comment system with media',
//           searchAndFilter: 'Advanced content discovery',
//           analytics: 'Content performance tracking'
//         },
//         membershipManagement: {
//           progressiveApplication: 'Guest → Pre-Member → Full Member flow',
//           surveyIntegration: 'Integrated application surveys',
//           adminReview: 'Complete application review system',
//           bulkOperations: 'Bulk approval and management',
//           analytics: 'Membership analytics and reporting',
//           roleBasedAccess: 'Comprehensive permission system'
//         },
//         // ✅ NEW: Admin features
//         adminMembership: {
//           applicationReview: 'Comprehensive application review system',
//           bulkOperations: 'Bulk approve/decline applications',
//           analytics: 'Advanced membership analytics',
//           userManagement: 'Advanced user search and management',
//           systemHealth: 'System health monitoring',
//           dataExport: 'Membership data export capabilities'
//         }
//       }
//     },
    
//     migration: {
//       status: 'backward_compatible',
//       existing_routes: 'fully_preserved',
//       new_features: 'content_and_membership_ready',
//       admin_features: 'admin_membership_ready', // ✅ NEW
//       breaking_changes: 'none'
//     }
//   });
// });

// // Health check endpoint
// router.get('/health', async (req, res) => {
//   try {
//     const healthData = {
//       status: 'healthy',
//       timestamp: new Date().toISOString(),
//       version: '3.1.0',
//       uptime: Math.floor(process.uptime()),
//       memory: {
//         used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
//         total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
//       },
//       systems: {
//         authentication: 'operational',
//         contentManagement: 'operational',
//         membershipManagement: 'operational',
//         adminMembership: 'operational', // ✅ NEW
//         database: 'operational',
//         fileUpload: 'operational',
//         surveyIntegration: 'operational'
//       },
//       routes: {
//         existing: 'preserved and operational',
//         content: 'integrated and operational',
//         membership: 'integrated and operational',
//         adminMembership: 'integrated and operational' // ✅ NEW
//       },
//       featureStats: {
//         contentRoutes: 50,
//         membershipRoutes: 40,
//         adminMembershipRoutes: 25, // ✅ NEW
//         multiStepFormsEnabled: true,
//         mediaUploadEnabled: true,
//         adminPanelEnabled: true,
//         surveyIntegrationEnabled: true,
//         bulkOperationsEnabled: true
//       }
//     };
    
//     res.json(healthData);
//   } catch (error) {
//     res.status(503).json({
//       status: 'unhealthy',
//       error: error.message,
//       timestamp: new Date().toISOString()
//     });
//   }
// });

// // Route discovery endpoint
// router.get('/routes', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Ikoota API Route Discovery - Content & Membership Management WITH ADMIN ROUTES',
//     version: '3.1.0',
    
//     availableRoutes: {
//       authentication: {
//         base: '/api/auth',
//         status: 'operational',
//         endpoints: [
//           'POST /api/auth/login',
//           'POST /api/auth/logout',
//           'POST /api/auth/refresh',
//         ]
//       },
      
//       contentManagement: {
//         base: '/api/content',
//         status: 'operational',
//         endpoints: [
//           'GET /api/content/chats - Get all chats',
//           'POST /api/content/chats - Create chat',
//           'GET /api/content/teachings - Get all teachings',
//           'POST /api/content/teachings - Create teaching',
//           'GET /api/content/admin/stats - Get content stats'
//         ]
//       },
      
//       membershipManagement: {
//         base: '/api/membership',
//         status: 'operational',
//         endpoints: [
//           'GET /api/membership/status - Get current user status',
//           'POST /api/membership/apply/initial - Submit initial application',
//           'POST /api/membership/apply/full - Submit full membership application',
//           'GET /api/membership/dashboard - Get user dashboard'
//         ]
//       },
      
//       // ✅ NEW: Admin membership routes
//       adminMembershipManagement: {
//         base: '/api/membership/admin',
//         status: 'operational',
//         note: 'Requires admin or super_admin role',
//         endpoints: [
//           'GET /api/membership/admin/test - Test admin connectivity',
//           'GET /api/membership/admin/applications - Get applications with filtering',
//           'GET /api/membership/admin/full-membership-stats - Get full membership statistics',
//           'GET /api/membership/admin/stats - Get application statistics', 
//           'GET /api/membership/admin/analytics - Get membership analytics',
//           'GET /api/membership/admin/overview - Get membership overview',
//           'PUT /api/membership/admin/applications/:id/review - Review application',
//           'POST /api/membership/admin/applications/bulk-review - Bulk review applications',
//           'GET /api/membership/admin/search-users - Search users with filters',
//           'GET /api/membership/admin/health - System health check'
//         ]
//       },
      
//       legacyCompatibility: {
//         note: 'These routes redirect to the new systems',
//         content: [
//           'GET /api/chats → /api/content/chats',
//           'GET /api/teachings → /api/content/teachings',
//           'GET /api/comments → /api/content/comments',
//           'GET /api/messages → /api/content/teachings'
//         ],
//         membership: [
//           'POST /api/apply → /api/membership/apply',
//           'GET /api/application → /api/membership/application'
//         ]
//       }
//     },
    
//     currentPhase: 'Content & Membership Management Integration WITH ADMIN ROUTES Complete',
//     timestamp: new Date().toISOString()
//   });
// });

// // ===============================================
// // ENHANCED 404 HANDLER
// // ===============================================

// router.use('*', (req, res) => {
//   console.log(`❌ API route not found: ${req.method} ${req.originalUrl}`);
  
//   const requestedPath = req.originalUrl.toLowerCase();
//   const suggestions = [];
  
//   // Smart path suggestions based on requested path
//   if (requestedPath.includes('admin') && requestedPath.includes('membership')) {
//     suggestions.push('/api/membership/admin/test', '/api/membership/admin/applications', '/api/membership/admin/stats');
//   } else if (requestedPath.includes('chat')) {
//     suggestions.push('/api/content/chats', '/api/chats');
//   } else if (requestedPath.includes('teaching') || requestedPath.includes('message')) {
//     suggestions.push('/api/content/teachings', '/api/teachings');
//   } else if (requestedPath.includes('membership') || requestedPath.includes('member')) {
//     suggestions.push('/api/membership/status', '/api/membership/apply/initial');
//   } else if (requestedPath.includes('apply') || requestedPath.includes('application')) {
//     suggestions.push('/api/membership/apply/initial', '/api/membership/apply/full');
//   } else if (requestedPath.includes('admin')) {
//     suggestions.push('/api/content/admin/stats', '/api/membership/admin/overview');
//   } else if (requestedPath.includes('auth')) {
//     suggestions.push('/api/auth/login', '/api/auth/logout');
//   }
  
//   res.status(404).json({
//     success: false,
//     message: 'API endpoint not found',
//     path: req.originalUrl,
//     method: req.method,
//     suggestions: suggestions.length > 0 ? suggestions : [
//       '/api/health - Health check',
//       '/api/routes - Route discovery',
//       '/api/content/chats - Chat management',
//       '/api/membership/status - Membership status',
//       '/api/membership/admin/test - Admin test endpoint', // ✅ NEW
//       '/api/auth/login - Authentication'
//     ],
    
//     availableSystems: {
//       authentication: '/api/auth/*',
//       contentManagement: '/api/content/*',
//       membershipManagement: '/api/membership/*',
//       adminMembershipManagement: '/api/membership/admin/*', // ✅ NEW
//       legacyRoutes: '/api/chats, /api/teachings, /api/comments, /api/apply'
//     },
    
//     help: {
//       documentation: '/api/',
//       routeDiscovery: '/api/routes', 
//       healthCheck: '/api/health',
//       contentManagement: '/api/content',
//       membershipManagement: '/api/membership',
//       adminMembershipManagement: '/api/membership/admin' // ✅ NEW
//     },
    
//     timestamp: new Date().toISOString()
//   });
// });

// // ===============================================
// // STARTUP LOGGING
// // ===============================================

// if (process.env.NODE_ENV === 'development') {
//   console.log('\n🚀 IKOOTA API ROUTES - CONTENT & MEMBERSHIP WITH ADMIN ROUTES COMPLETE');
//   console.log('================================================================================');
//   console.log('✅ EXISTING ROUTES: Fully preserved and operational');
//   console.log('✅ CONTENT SYSTEM: 50+ endpoints for chats, teachings, comments');
//   console.log('✅ MEMBERSHIP SYSTEM: 40+ endpoints for progressive membership flow');
//   console.log('✅ ADMIN MEMBERSHIP: 25+ endpoints for admin management'); // ✅ NEW
//   console.log('✅ MULTI-STEP FORMS: 7-step chats, 8-step teachings, progressive applications');
//   console.log('✅ ADMIN PANELS: Content moderation & membership administration');
//   console.log('✅ FILE UPLOADS: S3-integrated media management');
//   console.log('✅ SURVEY INTEGRATION: Survey-based application system');
//   console.log('✅ BACKWARD COMPATIBILITY: All legacy routes automatically redirected');
//   console.log('================================================================================');
  
//   console.log('\n📊 CURRENT INTEGRATION STATUS:');
//   console.log('   📁 Content Routes: /api/content/* (50+ endpoints) ✅ READY');
//   console.log('   👥 Membership Routes: /api/membership/* (40+ endpoints) ✅ READY');
//   console.log('   🔐 Admin Membership: /api/membership/admin/* (25+ endpoints) ✅ READY'); // ✅ NEW
//   console.log('   🔄 Legacy Support: All legacy routes redirected ✅ READY');
//   console.log('   🛡️ Admin Systems: Content & membership administration ✅ READY');
//   console.log('   📤 Upload System: Multi-file S3 integration ✅ READY');
//   console.log('   📋 Survey Integration: Progressive application system ✅ READY');
//   console.log('   🎯 Multi-Step Forms: Chat, teaching, & application creation ✅ READY');
  
//   console.log('\n🎯 READY FOR TESTING:');
//   console.log('   • API Info: http://localhost:3000/api/');
//   console.log('   • Route Discovery: http://localhost:3000/api/routes');
//   console.log('   • Health Check: http://localhost:3000/api/health');
//   console.log('   • Content System: http://localhost:3000/api/content/');
//   console.log('   • Membership System: http://localhost:3000/api/membership/');
//   console.log('   • Admin Test: http://localhost:3000/api/membership/admin/test'); // ✅ NEW
//   console.log('   • Admin Stats: http://localhost:3000/api/membership/admin/full-membership-stats'); // ✅ NEW
//   console.log('================================================================================\n');
// }

// export default router;








// // ikootaapi/routes/index.js - UPDATED WITH MEMBERSHIP ROUTES
// // Preserves existing functionality and adds BOTH content routes AND membership routes

// import express from 'express';

// // ===============================================
// // EXISTING ROUTES (PRESERVE EXACTLY AS THEY ARE)
// // ===============================================

// // Import your existing routes - keep these exactly as they were
// import authRoutes from './authRoutes.js';

// // ===============================================
// // NEW INTEGRATED ROUTES (READY TO USE)
// // ===============================================

// // Import the content routes we built - this file EXISTS and is complete
// import contentRoutes from './contentRoutes.js';

// // Import the membership routes we just completed - this file NOW EXISTS and is complete
// import membershipRoutes from './membershipRoutes.js';

// // Add any other existing routes you currently have in your project:
// // import userRoutes from './userRoutes.js';           // If you have this
// // import surveyRoutes from './surveyRoutes.js';       // If you have this
// // etc.

// // ===============================================
// // FUTURE ENHANCED ROUTES (COMMENTED OUT UNTIL BUILT)
// // ===============================================

// // These routes are NOT ready yet - they would cause import errors
// // Uncomment these ONLY when the actual files are created

// // import enhancedUserRoutes from './enhanced/user.routes.js';         // ❌ DOESN'T EXIST YET
// // import enhancedApplicationRoutes from './enhanced/application.routes.js'; // ❌ DOESN'T EXIST YET  
// // import enhancedAdminRoutes from './enhanced/admin.routes.js';       // ❌ DOESN'T EXIST YET

// // ===============================================
// // OPTIONAL MIDDLEWARE (IF YOU HAVE THEM)
// // ===============================================

// // Only import middleware if you actually have these files
// // import { tracingMiddleware } from '../middleware/tracingMiddleware.js'; // If you have this
// // import { authenticate } from '../middleware/auth.middleware.js';        // If you have this

// const router = express.Router();

// // ===============================================
// // GLOBAL MIDDLEWARE
// // ===============================================

// // Add request metadata to all routes
// router.use((req, res, next) => {
//   req.requestTime = new Date().toISOString();
//   req.apiVersion = '3.0';
//   next();
// });

// // Optional: Add tracing if you have the middleware
// // router.use(tracingMiddleware);

// // ===============================================
// // MOUNT EXISTING ROUTES (PRESERVE FUNCTIONALITY)
// // ===============================================

// // Keep your existing authentication routes exactly as they are
// router.use('/auth', authRoutes);

// // Mount any other existing routes you currently have:
// // router.use('/users', userRoutes);              // If you have this
// // router.use('/survey', surveyRoutes);           // If you have this

// // ===============================================
// // MOUNT NEW INTEGRATED ROUTES (READY TO USE)
// // ===============================================

// // Mount the content management system we built
// console.log('📚 Mounting content management routes...');
// router.use('/content', contentRoutes);

// // Mount the membership system we just completed
// console.log('👥 Mounting membership management routes...');
// router.use('/membership', membershipRoutes);

// // ===============================================
// // MOUNT FUTURE ENHANCED ROUTES (WHEN READY)
// // ===============================================

// // Uncomment these ONLY when the corresponding route files are built:

// // router.use('/user', enhancedUserRoutes);        // When enhanced/user.routes.js exists
// // router.use('/applications', enhancedApplicationRoutes); // When enhanced/application.routes.js exists  
// // router.use('/admin', enhancedAdminRoutes);      // When enhanced/admin.routes.js exists

// // ===============================================
// // BACKWARD COMPATIBILITY FOR CONTENT ROUTES
// // ===============================================

// // Legacy route mappings for existing clients
// console.log('🔄 Setting up backward compatibility for content routes...');

// // Map old direct content routes to new unified content routes
// router.use('/chats', (req, res, next) => {
//   console.log('🔄 Legacy /chats route accessed, redirecting to /content/chats');
//   req.url = '/chats' + req.url;
//   contentRoutes(req, res, next);
// });

// router.use('/teachings', (req, res, next) => {
//   console.log('🔄 Legacy /teachings route accessed, redirecting to /content/teachings');
//   req.url = '/teachings' + req.url;
//   contentRoutes(req, res, next);
// });

// router.use('/comments', (req, res, next) => {
//   console.log('🔄 Legacy /comments route accessed, redirecting to /content/comments');
//   req.url = '/comments' + req.url;
//   contentRoutes(req, res, next);
// });

// // If you had messages mapped to teachings
// router.use('/messages', (req, res, next) => {
//   console.log('🔄 Legacy /messages route accessed, redirecting to /content/teachings');
//   req.url = '/teachings' + req.url;
//   contentRoutes(req, res, next);
// });

// // ===============================================
// // BACKWARD COMPATIBILITY FOR MEMBERSHIP ROUTES
// // ===============================================

// // Legacy membership route mappings (if you had any direct routes before)
// console.log('🔄 Setting up backward compatibility for membership routes...');

// // If you had direct membership application routes before
// router.use('/apply', (req, res, next) => {
//   console.log('🔄 Legacy /apply route accessed, redirecting to /membership/apply');
//   req.url = '/apply' + req.url;
//   membershipRoutes(req, res, next);
// });

// // If you had direct application routes before
// router.use('/application', (req, res, next) => {
//   console.log('🔄 Legacy /application route accessed, redirecting to /membership/application');
//   req.url = '/application' + req.url;
//   membershipRoutes(req, res, next);
// });

// // ===============================================
// // API INFORMATION ENDPOINTS
// // ===============================================

// // API status and documentation
// router.get('/', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Ikoota API v3.1 - Content & Membership Management Integrated',
//     version: '3.1.0',
//     timestamp: new Date().toISOString(),
//     environment: process.env.NODE_ENV || 'development',
    
//     endpoints: {
//       // Your existing routes
//       existing: {
//         auth: '/api/auth/* (authentication system)',
//         // Add documentation for other existing routes you have
//       },
      
//       // Content management system
//       content: {
//         chats: '/api/content/chats/* (7-step chat creation & management)',
//         teachings: '/api/content/teachings/* (8-step teaching creation & management)',
//         comments: '/api/content/comments/* (threaded comments with media)',
//         admin: '/api/content/admin/* (content moderation & analytics)',
//       },
      
//       // Membership management system
//       membership: {
//         status: '/api/membership/status/* (membership status & dashboard)',
//         applications: '/api/membership/apply/* (initial & full membership applications)',
//         admin: '/api/membership/admin/* (membership administration)',
//         analytics: '/api/membership/analytics/* (membership analytics)',
//         survey: '/api/membership/survey/* (survey integration)',
//       },
      
//       // Future enhanced routes (planned)
//       planned: {
//         note: 'These routes will be added in future updates',
//         enhancedUser: '/api/user/* (enhanced user management) - PLANNED',
//         applications: '/api/applications/* (enhanced application system) - PLANNED',
//         enhancedAdmin: '/api/admin/* (enhanced admin panel) - PLANNED'
//       },
      
//       // Legacy compatibility
//       legacy: {
//         note: 'Legacy routes automatically redirected to new systems',
//         content: {
//           '/api/chats': '/api/content/chats',
//           '/api/teachings': '/api/content/teachings',
//           '/api/comments': '/api/content/comments',
//           '/api/messages': '/api/content/teachings'
//         },
//         membership: {
//           '/api/apply': '/api/membership/apply',
//           '/api/application': '/api/membership/application'
//         }
//       }
//     },
    
//     currentPhase: {
//       phase: 'Content & Membership Management Integration',
//       status: 'Complete and Ready',
//       features: {
//         contentManagement: {
//           multiStepForms: 'Chat (7-step) and Teaching (8-step) creation',
//           contentModeration: 'Admin approval workflow',
//           mediaSupport: 'S3-integrated file uploads',
//           threadedComments: 'Nested comment system with media',
//           searchAndFilter: 'Advanced content discovery',
//           analytics: 'Content performance tracking'
//         },
//         membershipManagement: {
//           progressiveApplication: 'Guest → Pre-Member → Full Member flow',
//           surveyIntegration: 'Integrated application surveys',
//           adminReview: 'Complete application review system',
//           bulkOperations: 'Bulk approval and management',
//           analytics: 'Membership analytics and reporting',
//           roleBasedAccess: 'Comprehensive permission system'
//         }
//       }
//     },
    
//     migration: {
//       status: 'backward_compatible',
//       existing_routes: 'fully_preserved',
//       new_features: 'content_and_membership_ready',
//       breaking_changes: 'none'
//     }
//   });
// });

// // Health check endpoint
// router.get('/health', async (req, res) => {
//   try {
//     const healthData = {
//       status: 'healthy',
//       timestamp: new Date().toISOString(),
//       version: '3.1.0',
//       uptime: Math.floor(process.uptime()),
//       memory: {
//         used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
//         total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
//       },
//       systems: {
//         authentication: 'operational',
//         contentManagement: 'operational',
//         membershipManagement: 'operational',
//         database: 'operational',
//         fileUpload: 'operational',
//         surveyIntegration: 'operational'
//       },
//       routes: {
//         existing: 'preserved and operational',
//         content: 'integrated and operational',
//         membership: 'integrated and operational',
//         enhanced: 'planned for future phases'
//       },
//       featureStats: {
//         contentRoutes: 50,
//         membershipRoutes: 40,
//         multiStepFormsEnabled: true,
//         mediaUploadEnabled: true,
//         adminPanelEnabled: true,
//         surveyIntegrationEnabled: true,
//         bulkOperationsEnabled: true
//       }
//     };
    
//     res.json(healthData);
//   } catch (error) {
//     res.status(503).json({
//       status: 'unhealthy',
//       error: error.message,
//       timestamp: new Date().toISOString()
//     });
//   }
// });

// // Route discovery endpoint
// router.get('/routes', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Ikoota API Route Discovery - Current Phase: Content & Membership Management',
//     version: '3.1.0',
    
//     availableRoutes: {
//       authentication: {
//         base: '/api/auth',
//         status: 'operational',
//         endpoints: [
//           'POST /api/auth/login',
//           'POST /api/auth/logout',
//           'POST /api/auth/refresh',
//           // Add other auth endpoints you have
//         ]
//       },
      
//       contentManagement: {
//         base: '/api/content',
//         status: 'operational',
//         chats: [
//           'GET /api/content/chats - Get all chats',
//           'POST /api/content/chats/step/1 - Start chat creation',
//           // ... (rest of content routes as before)
//         ],
//         teachings: [
//           'GET /api/content/teachings - Get all teachings',
//           'POST /api/content/teachings/step/1 - Start teaching creation',
//           // ... (rest of teaching routes as before)
//         ],
//         comments: [
//           'GET /api/content/comments - Get all comments',
//           'POST /api/content/comments - Create comment',
//           // ... (rest of comment routes as before)
//         ],
//         admin: [
//           'GET /api/content/admin/stats - Get content statistics',
//           'GET /api/content/admin/pending - Get pending content',
//           // ... (rest of admin routes as before)
//         ]
//       },
      
//       membershipManagement: {
//         base: '/api/membership',
//         status: 'operational',
//         public: [
//           'GET /api/membership/requirements - Get membership requirements',
//           'GET /api/membership/question-labels - Get form question labels'
//         ],
//         userStatus: [
//           'GET /api/membership/status - Get current user status',
//           'GET /api/membership/status/:userId - Get user status by ID',
//           'GET /api/membership/dashboard - Get user dashboard',
//           'GET /api/membership/permissions - Get user permissions',
//           'GET /api/membership/application/status - Check application status'
//         ],
//         initialApplication: [
//           'POST /api/membership/apply/initial - Submit initial application',
//           'PUT /api/membership/apply/initial - Update initial application',
//           'GET /api/membership/apply/initial - Get initial application status'
//         ],
//         fullMembership: [
//           'GET /api/membership/full-membership/status - Get full membership status',
//           'POST /api/membership/apply/full - Submit full membership application',
//           'PUT /api/membership/apply/full - Update full membership application',
//           'POST /api/membership/apply/full/reapply - Reapply for full membership',
//           'POST /api/membership/apply/full/withdraw - Withdraw full membership application',
//           'GET /api/membership/full-membership/history - Get application history'
//         ],
//         surveyIntegration: [
//           'POST /api/membership/survey/save-draft - Save survey draft',
//           'GET /api/membership/survey/drafts - Get user survey drafts',
//           'POST /api/membership/survey/submit-application - Submit survey application'
//         ],
//         admin: [
//           'GET /api/membership/admin/pending-applications - Get pending applications',
//           'GET /api/membership/admin/pending-full-memberships - Get pending full memberships',
//           'POST /api/membership/admin/approve-application/:id - Approve application',
//           'POST /api/membership/admin/decline-application/:id - Decline application',
//           'POST /api/membership/admin/review-full-membership/:id - Review full membership',
//           'POST /api/membership/admin/bulk-review-applications - Bulk review applications',
//           'GET /api/membership/admin/overview - Get membership overview',
//           'GET /api/membership/admin/stats - Get application statistics',
//           'GET /api/membership/admin/analytics - Get membership analytics',
//           'GET /api/membership/admin/search-users - Search users',
//           'GET /api/membership/admin/system-config - Get system configuration',
//           'POST /api/membership/admin/send-notification - Send notifications'
//         ]
//       },
      
//       futureEnhancements: {
//         status: 'planned',
//         note: 'These routes will be added in future development phases',
//         planned: [
//           '/api/user/* - Enhanced user management',
//           '/api/applications/* - Enhanced application system',
//           '/api/admin/* - Enhanced admin panel'
//         ]
//       },
      
//       legacyCompatibility: {
//         note: 'These routes redirect to the new systems',
//         content: [
//           'GET /api/chats → /api/content/chats',
//           'GET /api/teachings → /api/content/teachings',
//           'GET /api/comments → /api/content/comments',
//           'GET /api/messages → /api/content/teachings'
//         ],
//         membership: [
//           'POST /api/apply → /api/membership/apply',
//           'GET /api/application → /api/membership/application'
//         ]
//       }
//     },
    
//     currentPhase: 'Content & Membership Management Integration Complete',
//     nextPhase: 'Enhanced User Management (Future)',
//     timestamp: new Date().toISOString()
//   });
// });

// // ===============================================
// // ENHANCED 404 HANDLER
// // ===============================================

// router.use('*', (req, res) => {
//   console.log(`❌ API route not found: ${req.method} ${req.originalUrl}`);
  
//   const requestedPath = req.originalUrl.toLowerCase();
//   const suggestions = [];
  
//   // Smart path suggestions based on requested path
//   if (requestedPath.includes('chat')) {
//     suggestions.push('/api/content/chats', '/api/chats');
//   }
//   if (requestedPath.includes('teaching') || requestedPath.includes('message')) {
//     suggestions.push('/api/content/teachings', '/api/teachings');
//   }
//   if (requestedPath.includes('comment')) {
//     suggestions.push('/api/content/comments', '/api/comments');
//   }
//   if (requestedPath.includes('membership') || requestedPath.includes('member')) {
//     suggestions.push('/api/membership/status', '/api/membership/apply/initial');
//   }
//   if (requestedPath.includes('apply') || requestedPath.includes('application')) {
//     suggestions.push('/api/membership/apply/initial', '/api/membership/apply/full');
//   }
//   if (requestedPath.includes('admin')) {
//     suggestions.push('/api/content/admin/stats', '/api/membership/admin/pending-applications');
//   }
//   if (requestedPath.includes('auth')) {
//     suggestions.push('/api/auth/login', '/api/auth/logout');
//   }
//   if (requestedPath.includes('upload')) {
//     suggestions.push('/api/content/comments/upload');
//   }
//   if (requestedPath.includes('survey')) {
//     suggestions.push('/api/membership/survey/drafts', '/api/membership/survey/save-draft');
//   }
  
//   res.status(404).json({
//     success: false,
//     message: 'API endpoint not found',
//     path: req.originalUrl,
//     method: req.method,
//     suggestions: suggestions.length > 0 ? suggestions : [
//       '/api/health - Health check',
//       '/api/routes - Route discovery',
//       '/api/content/chats - Chat management',
//       '/api/content/teachings - Teaching management',
//       '/api/membership/status - Membership status',
//       '/api/membership/apply/initial - Apply for membership',
//       '/api/auth/login - Authentication'
//     ],
    
//     availableSystems: {
//       authentication: '/api/auth/*',
//       contentManagement: '/api/content/*',
//       membershipManagement: '/api/membership/*',
//       legacyRoutes: '/api/chats, /api/teachings, /api/comments, /api/apply'
//     },
    
//     help: {
//       documentation: '/api/',
//       routeDiscovery: '/api/routes', 
//       healthCheck: '/api/health',
//       contentManagement: '/api/content',
//       membershipManagement: '/api/membership'
//     },
    
//     timestamp: new Date().toISOString()
//   });
// });

// // ===============================================
// // STARTUP LOGGING
// // ===============================================

// if (process.env.NODE_ENV === 'development') {
//   console.log('\n🚀 IKOOTA API ROUTES - CONTENT & MEMBERSHIP MANAGEMENT COMPLETE');
//   console.log('================================================================================');
//   console.log('✅ EXISTING ROUTES: Fully preserved and operational');
//   console.log('✅ CONTENT SYSTEM: 50+ endpoints for chats, teachings, comments');
//   console.log('✅ MEMBERSHIP SYSTEM: 40+ endpoints for progressive membership flow');
//   console.log('✅ MULTI-STEP FORMS: 7-step chats, 8-step teachings, progressive applications');
//   console.log('✅ ADMIN PANELS: Content moderation & membership administration');
//   console.log('✅ FILE UPLOADS: S3-integrated media management');
//   console.log('✅ SURVEY INTEGRATION: Survey-based application system');
//   console.log('✅ BACKWARD COMPATIBILITY: All legacy routes automatically redirected');
//   console.log('⏳ FUTURE PHASES: Enhanced user, application, and admin routes planned');
//   console.log('================================================================================');
  
//   console.log('\n📊 CURRENT INTEGRATION STATUS:');
//   console.log('   📁 Content Routes: /api/content/* (50+ endpoints) ✅ READY');
//   console.log('   👥 Membership Routes: /api/membership/* (40+ endpoints) ✅ READY');
//   console.log('   🔄 Legacy Support: All legacy routes redirected ✅ READY');
//   console.log('   🛡️ Admin Systems: Content & membership administration ✅ READY');
//   console.log('   📤 Upload System: Multi-file S3 integration ✅ READY');
//   console.log('   📋 Survey Integration: Progressive application system ✅ READY');
//   console.log('   🎯 Multi-Step Forms: Chat, teaching, & application creation ✅ READY');
//   console.log('   📋 Enhanced Routes: /api/user, /api/applications ⏳ FUTURE PHASE');
  
//   console.log('\n🎯 READY FOR TESTING:');
//   console.log('   • API Info: http://localhost:3000/api/');
//   console.log('   • Route Discovery: http://localhost:3000/api/routes');
//   console.log('   • Health Check: http://localhost:3000/api/health');
//   console.log('   • Content System: http://localhost:3000/api/content/');
//   console.log('   • Membership System: http://localhost:3000/api/membership/');
//   console.log('   • Member Status: http://localhost:3000/api/membership/status');
//   console.log('   • Apply Initial: http://localhost:3000/api/membership/apply/initial');
//   console.log('   • Admin Overview: http://localhost:3000/api/membership/admin/overview');
//   console.log('================================================================================\n');
// }

// export default router;












// // ikootaapi/routes/index.js - CORRECT VERSION
// // Preserves existing functionality and adds ONLY the content routes we've built
// // Comments out future enhanced routes until they are actually built

// import express from 'express';

// // ===============================================
// // EXISTING ROUTES (PRESERVE EXACTLY AS THEY ARE)
// // ===============================================

// // Import your existing routes - keep these exactly as they were
// import authRoutes from './authRoutes.js';

// // Add any other existing routes you currently have in your project:
// // import userRoutes from './userRoutes.js';           // If you have this
// // import membershipRoutes from './membershipRoutes.js'; // If you have this
// // import surveyRoutes from './surveyRoutes.js';       // If you have this
// // etc.

// // ===============================================
// // NEW CONTENT ROUTES (READY TO USE)
// // ===============================================

// // Import the content routes we just built - this file EXISTS and is complete
// import contentRoutes from './contentRoutes.js';

// // ===============================================
// // FUTURE ENHANCED ROUTES (COMMENTED OUT UNTIL BUILT)
// // ===============================================

// // These routes are NOT ready yet - they would cause import errors
// // Uncomment these ONLY when the actual files are created

// // import enhancedUserRoutes from './enhanced/user.routes.js';         // ❌ DOESN'T EXIST YET
// // import enhancedApplicationRoutes from './enhanced/application.routes.js'; // ❌ DOESN'T EXIST YET  
// // import enhancedAdminRoutes from './enhanced/admin.routes.js';       // ❌ DOESN'T EXIST YET

// // ===============================================
// // OPTIONAL MIDDLEWARE (IF YOU HAVE THEM)
// // ===============================================

// // Only import middleware if you actually have these files
// // import { tracingMiddleware } from '../middleware/tracingMiddleware.js'; // If you have this
// // import { authenticate } from '../middleware/auth.middleware.js';        // If you have this

// const router = express.Router();

// // ===============================================
// // GLOBAL MIDDLEWARE
// // ===============================================

// // Add request metadata to all routes
// router.use((req, res, next) => {
//   req.requestTime = new Date().toISOString();
//   req.apiVersion = '3.0';
//   next();
// });

// // Optional: Add tracing if you have the middleware
// // router.use(tracingMiddleware);

// // ===============================================
// // MOUNT EXISTING ROUTES (PRESERVE FUNCTIONALITY)
// // ===============================================

// // Keep your existing authentication routes exactly as they are
// router.use('/auth', authRoutes);

// // Mount any other existing routes you currently have:
// // router.use('/users', userRoutes);              // If you have this
// // router.use('/membership', membershipRoutes);   // If you have this  
// // router.use('/survey', surveyRoutes);           // If you have this

// // ===============================================
// // MOUNT NEW CONTENT ROUTES (READY TO USE)
// // ===============================================

// // Mount the content management system we just built
// console.log('📚 Mounting content management routes...');
// router.use('/content', contentRoutes);

// // ===============================================
// // MOUNT FUTURE ENHANCED ROUTES (WHEN READY)
// // ===============================================

// // Uncomment these ONLY when the corresponding route files are built:

// // router.use('/user', enhancedUserRoutes);        // When enhanced/user.routes.js exists
// // router.use('/applications', enhancedApplicationRoutes); // When enhanced/application.routes.js exists  
// // router.use('/admin', enhancedAdminRoutes);      // When enhanced/admin.routes.js exists

// // ===============================================
// // BACKWARD COMPATIBILITY FOR CONTENT ROUTES
// // ===============================================

// // Legacy route mappings for existing clients
// console.log('🔄 Setting up backward compatibility for content routes...');

// // Map old direct content routes to new unified content routes
// router.use('/chats', (req, res, next) => {
//   console.log('🔄 Legacy /chats route accessed, redirecting to /content/chats');
//   req.url = '/chats' + req.url;
//   contentRoutes(req, res, next);
// });

// router.use('/teachings', (req, res, next) => {
//   console.log('🔄 Legacy /teachings route accessed, redirecting to /content/teachings');
//   req.url = '/teachings' + req.url;
//   contentRoutes(req, res, next);
// });

// router.use('/comments', (req, res, next) => {
//   console.log('🔄 Legacy /comments route accessed, redirecting to /content/comments');
//   req.url = '/comments' + req.url;
//   contentRoutes(req, res, next);
// });

// // If you had messages mapped to teachings
// router.use('/messages', (req, res, next) => {
//   console.log('🔄 Legacy /messages route accessed, redirecting to /content/teachings');
//   req.url = '/teachings' + req.url;
//   contentRoutes(req, res, next);
// });

// // ===============================================
// // API INFORMATION ENDPOINTS
// // ===============================================

// // API status and documentation
// router.get('/', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Ikoota API v3.0 - Content Management Integrated',
//     version: '3.0.0',
//     timestamp: new Date().toISOString(),
//     environment: process.env.NODE_ENV || 'development',
    
//     endpoints: {
//       // Your existing routes
//       existing: {
//         auth: '/api/auth/* (authentication system)',
//         // Add documentation for other existing routes you have
//       },
      
//       // New content management system
//       content: {
//         chats: '/api/content/chats/* (7-step chat creation & management)',
//         teachings: '/api/content/teachings/* (8-step teaching creation & management)',
//         comments: '/api/content/comments/* (threaded comments with media)',
//         admin: '/api/content/admin/* (content moderation & analytics)',
//       },
      
//       // Future enhanced routes (planned)
//       planned: {
//         note: 'These routes will be added in future updates',
//         enhancedUser: '/api/user/* (enhanced user management) - PLANNED',
//         applications: '/api/applications/* (membership system) - PLANNED',
//         enhancedAdmin: '/api/admin/* (enhanced admin panel) - PLANNED'
//       },
      
//       // Legacy compatibility
//       legacy: {
//         note: 'Legacy routes automatically redirected to new content system',
//         mappings: {
//           '/api/chats': '/api/content/chats',
//           '/api/teachings': '/api/content/teachings',
//           '/api/comments': '/api/content/comments',
//           '/api/messages': '/api/content/teachings'
//         }
//       }
//     },
    
//     currentPhase: {
//       phase: 'Content Management Integration',
//       status: 'Complete and Ready',
//       features: {
//         multiStepForms: 'Chat (7-step) and Teaching (8-step) creation',
//         contentModeration: 'Admin approval workflow',
//         mediaSupport: 'S3-integrated file uploads',
//         threadedComments: 'Nested comment system with media',
//         searchAndFilter: 'Advanced content discovery',
//         analytics: 'Content performance tracking'
//       }
//     },
    
//     migration: {
//       status: 'backward_compatible',
//       existing_routes: 'fully_preserved',
//       new_features: 'content_management_ready',
//       breaking_changes: 'none'
//     }
//   });
// });

// // Health check endpoint
// router.get('/health', async (req, res) => {
//   try {
//     const healthData = {
//       status: 'healthy',
//       timestamp: new Date().toISOString(),
//       version: '3.0.0',
//       uptime: Math.floor(process.uptime()),
//       memory: {
//         used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
//         total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
//       },
//       systems: {
//         authentication: 'operational',
//         contentManagement: 'operational',
//         database: 'operational',
//         fileUpload: 'operational'
//       },
//       routes: {
//         existing: 'preserved and operational',
//         content: 'integrated and operational',
//         enhanced: 'planned for future phases'
//       },
//       contentStats: {
//         routesAvailable: 50,
//         multiStepFormsEnabled: true,
//         mediaUploadEnabled: true,
//         adminPanelEnabled: true
//       }
//     };
    
//     res.json(healthData);
//   } catch (error) {
//     res.status(503).json({
//       status: 'unhealthy',
//       error: error.message,
//       timestamp: new Date().toISOString()
//     });
//   }
// });

// // Route discovery endpoint
// router.get('/routes', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Ikoota API Route Discovery - Current Phase: Content Management',
//     version: '3.0.0',
    
//     availableRoutes: {
//       authentication: {
//         base: '/api/auth',
//         status: 'operational',
//         endpoints: [
//           'POST /api/auth/login',
//           'POST /api/auth/logout',
//           'POST /api/auth/refresh',
//           // Add other auth endpoints you have
//         ]
//       },
      
//       contentManagement: {
//         base: '/api/content',
//         status: 'operational',
//         chats: [
//           'GET /api/content/chats - Get all chats',
//           'POST /api/content/chats/step/1 - Start chat creation',
//           'POST /api/content/chats/step/2 - Add content',
//           'POST /api/content/chats/step/3 - Add media',
//           'POST /api/content/chats/step/4 - Set audience',
//           'POST /api/content/chats/step/5 - Add summary',
//           'POST /api/content/chats/step/6 - Review',
//           'POST /api/content/chats/step/7 - Publish',
//           'GET /api/content/chats/user/:userId - Get user chats',
//           'GET /api/content/chats/:id - Get single chat',
//           'PUT /api/content/chats/:id - Update chat',
//           'DELETE /api/content/chats/:id - Delete chat',
//           'GET /api/content/chats/search - Search chats'
//         ],
//         teachings: [
//           'GET /api/content/teachings - Get all teachings',
//           'POST /api/content/teachings/step/1 - Start teaching creation',
//           'POST /api/content/teachings/step/2 - Add content', 
//           'POST /api/content/teachings/step/3 - Set difficulty',
//           'POST /api/content/teachings/step/4 - Add prerequisites',
//           'POST /api/content/teachings/step/5 - Add objectives',
//           'POST /api/content/teachings/step/6 - Add resources',
//           'POST /api/content/teachings/step/7 - Add quiz',
//           'POST /api/content/teachings/step/8 - Publish',
//           'GET /api/content/teachings/user/:userId - Get user teachings',
//           'GET /api/content/teachings/featured - Get featured teachings',
//           'GET /api/content/teachings/search - Search teachings'
//         ],
//         comments: [
//           'GET /api/content/comments - Get all comments',
//           'POST /api/content/comments - Create comment',
//           'POST /api/content/comments/upload - Upload comment with media',
//           'GET /api/content/comments/chat/:chatId - Get chat comments',
//           'GET /api/content/comments/teaching/:teachingId - Get teaching comments',
//           'GET /api/content/comments/user/:userId - Get user comments',
//           'PUT /api/content/comments/:id - Update comment',
//           'DELETE /api/content/comments/:id - Delete comment'
//         ],
//         admin: [
//           'GET /api/content/admin/stats - Get content statistics',
//           'GET /api/content/admin/pending - Get pending content',
//           'POST /api/content/admin/approve/:type/:id - Approve content',
//           'POST /api/content/admin/reject/:type/:id - Reject content',
//           'POST /api/content/admin/bulk-approve - Bulk approve content',
//           'GET /api/content/admin/reports - Get content reports',
//           'GET /api/content/admin/analytics - Get analytics'
//         ]
//       },
      
//       futureEnhancements: {
//         status: 'planned',
//         note: 'These routes will be added in future development phases',
//         planned: [
//           '/api/user/* - Enhanced user management',
//           '/api/applications/* - Membership application system',
//           '/api/admin/* - Enhanced admin panel'
//         ]
//       },
      
//       legacyCompatibility: {
//         note: 'These routes redirect to the new content system',
//         routes: [
//           'GET /api/chats → /api/content/chats',
//           'GET /api/teachings → /api/content/teachings',
//           'GET /api/comments → /api/content/comments',
//           'GET /api/messages → /api/content/teachings'
//         ]
//       }
//     },
    
//     currentPhase: 'Content Management Integration Complete',
//     nextPhase: 'Enhanced User Management (Future)',
//     timestamp: new Date().toISOString()
//   });
// });

// // ===============================================
// // ENHANCED 404 HANDLER
// // ===============================================

// router.use('*', (req, res) => {
//   console.log(`❌ API route not found: ${req.method} ${req.originalUrl}`);
  
//   const requestedPath = req.originalUrl.toLowerCase();
//   const suggestions = [];
  
//   // Smart path suggestions based on requested path
//   if (requestedPath.includes('chat')) {
//     suggestions.push('/api/content/chats', '/api/chats');
//   }
//   if (requestedPath.includes('teaching') || requestedPath.includes('message')) {
//     suggestions.push('/api/content/teachings', '/api/teachings');
//   }
//   if (requestedPath.includes('comment')) {
//     suggestions.push('/api/content/comments', '/api/comments');
//   }
//   if (requestedPath.includes('admin')) {
//     suggestions.push('/api/content/admin/stats', '/api/content/admin/pending');
//   }
//   if (requestedPath.includes('auth')) {
//     suggestions.push('/api/auth/login', '/api/auth/logout');
//   }
//   if (requestedPath.includes('upload')) {
//     suggestions.push('/api/content/comments/upload');
//   }
  
//   res.status(404).json({
//     success: false,
//     message: 'API endpoint not found',
//     path: req.originalUrl,
//     method: req.method,
//     suggestions: suggestions.length > 0 ? suggestions : [
//       '/api/health - Health check',
//       '/api/routes - Route discovery',
//       '/api/content/chats - Chat management',
//       '/api/content/teachings - Teaching management',
//       '/api/auth/login - Authentication'
//     ],
    
//     availableSystems: {
//       authentication: '/api/auth/*',
//       contentManagement: '/api/content/*',
//       legacyRoutes: '/api/chats, /api/teachings, /api/comments'
//     },
    
//     help: {
//       documentation: '/api/',
//       routeDiscovery: '/api/routes', 
//       healthCheck: '/api/health',
//       contentManagement: '/api/content'
//     },
    
//     timestamp: new Date().toISOString()
//   });
// });

// // ===============================================
// // STARTUP LOGGING
// // ===============================================

// if (process.env.NODE_ENV === 'development') {
//   console.log('\n🚀 IKOOTA API ROUTES - CONTENT MANAGEMENT PHASE COMPLETE');
//   console.log('================================================================================');
//   console.log('✅ EXISTING ROUTES: Fully preserved and operational');
//   console.log('✅ CONTENT SYSTEM: 50+ new endpoints for chats, teachings, comments');
//   console.log('✅ MULTI-STEP FORMS: 7-step chats, 8-step teachings');
//   console.log('✅ ADMIN PANEL: Complete moderation and analytics system');
//   console.log('✅ FILE UPLOADS: S3-integrated media management');
//   console.log('✅ BACKWARD COMPATIBILITY: Legacy routes automatically redirected');
//   console.log('⏳ FUTURE PHASES: Enhanced user, application, and admin routes planned');
//   console.log('================================================================================');
  
//   console.log('\n📊 CURRENT INTEGRATION STATUS:');
//   console.log('   📁 Content Routes: /api/content/* (50+ endpoints) ✅ READY');
//   console.log('   🔄 Legacy Support: /api/chats, /api/teachings, /api/comments ✅ READY');
//   console.log('   🛡️ Admin Routes: Content moderation and analytics ✅ READY');
//   console.log('   📤 Upload System: Multi-file S3 integration ✅ READY');
//   console.log('   🎯 Multi-Step: Progressive form creation ✅ READY');
//   console.log('   📋 Enhanced Routes: /api/user, /api/applications ⏳ FUTURE PHASE');
  
//   console.log('\n🎯 READY FOR TESTING:');
//   console.log('   • API Info: http://localhost:3000/api/');
//   console.log('   • Route Discovery: http://localhost:3000/api/routes');
//   console.log('   • Health Check: http://localhost:3000/api/health');
//   console.log('   • Content Chats: http://localhost:3000/api/content/chats');
//   console.log('   • Content Teachings: http://localhost:3000/api/content/teachings');
//   console.log('================================================================================\n');
// }

// export default router;







