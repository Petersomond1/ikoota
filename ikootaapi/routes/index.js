// ikootaapi/routes/index.js - SURVEY ADMIN ROUTE MOUNTING FIX
// Add this to your existing routes/index.js file

import express from 'express';

// ===============================================
// IMPORT ALL ROUTE MODULES - VERIFY THESE IMPORTS
// ===============================================

import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import userAdminRoutes from './userAdminRoutes.js';
import contentRoutes from './contentRoutes.js';
import membershipRoutes from './membershipRoutes.js';
import membershipAdminRoutes from './membershipAdminRoutes.js';

// ✅ CRITICAL: Verify these survey route imports
import surveyRoutes from './surveyRoutes.js';
import surveyAdminRoutes from './surveyAdminRoutes.js';

const router = express.Router();

// ===============================================
// DEBUG MIDDLEWARE FOR SURVEY ROUTES
// ===============================================

// Add debugging for all survey-related requests
router.use('/survey*', (req, res, next) => {
  console.log('🔍 SURVEY ROUTE DEBUG:', {
    originalUrl: req.originalUrl,
    path: req.path,
    method: req.method,
    baseUrl: req.baseUrl,
    timestamp: new Date().toISOString()
  });
  next();
});

// ===============================================
// MOUNT ROUTES WITH ENHANCED ERROR HANDLING
// ===============================================

// Standard routes first...
console.log('🔗 Mounting authentication routes at /auth...');
router.use('/auth', authRoutes);

console.log('🔗 Mounting user routes at /users...');
router.use('/users', userRoutes);

console.log('🔗 Mounting user admin routes at /users/admin...');
router.use('/users/admin', userAdminRoutes);

console.log('🔗 Mounting content routes at /content...');
router.use('/content', contentRoutes);

console.log('🔗 Mounting membership routes at /membership...');
router.use('/membership', membershipRoutes);

console.log('🔗 Mounting membership admin routes at /membership/admin...');
router.use('/membership/admin', membershipAdminRoutes);



// ✅ SURVEY ADMIN ROUTES - ENHANCED MOUNTING WITH VERIFICATION
console.log('🔗 Mounting survey admin routes at /survey/admin...');
try {
  if (typeof surveyAdminRoutes !== 'function' && typeof surveyAdminRoutes !== 'object') {
    throw new Error('surveyAdminRoutes is not a valid router');
  }
  
  // Mount survey admin routes
  router.use('/survey/admin', surveyAdminRoutes);
  console.log('✅ Survey admin routes mounted successfully');
  
  // Verify mounting worked
  setTimeout(() => {
    console.log('🧪 Testing survey admin route mounting...');
    // Add a test route directly to verify
    router.get('/survey/admin/mount-test', (req, res) => {
      res.json({
        success: true,
        message: 'Survey admin routes are properly mounted',
        timestamp: new Date().toISOString(),
        route: '/api/survey/admin/mount-test'
      });
    });
    console.log('✅ Survey admin mount test route added');
  }, 1000);
  
} catch (error) {
  console.error('❌ Failed to mount survey admin routes:', error.message);
  console.error('Survey admin routes import:', typeof surveyAdminRoutes);
  
  // Add fallback route for debugging
  router.get('/survey/admin/*', (req, res) => {
    res.status(503).json({
      success: false,
      error: 'Survey admin routes failed to mount',
      details: error.message,
      fallback: true,
      originalUrl: req.originalUrl
    });
  });
}

// ✅ SURVEY ROUTES - ENHANCED MOUNTING WITH VERIFICATION
console.log('🔗 Mounting survey routes at /survey...');
try {
  if (typeof surveyRoutes !== 'function' && typeof surveyRoutes !== 'object') {
    throw new Error('surveyRoutes is not a valid router');
  }
  router.use('/survey', surveyRoutes);
  console.log('✅ Survey routes mounted successfully');
} catch (error) {
  console.error('❌ Failed to mount survey routes:', error.message);
  console.error('Survey routes import:', typeof surveyRoutes);
}

// ===============================================
// ROUTE VERIFICATION ENDPOINT
// ===============================================

router.get('/debug/survey-routes', (req, res) => {
  try {
    // Test if survey admin routes are accessible
    const routeTests = {
      survey_routes_imported: typeof surveyRoutes === 'function' || typeof surveyRoutes === 'object',
      survey_admin_routes_imported: typeof surveyAdminRoutes === 'function' || typeof surveyAdminRoutes === 'object',
      survey_routes_type: typeof surveyRoutes,
      survey_admin_routes_type: typeof surveyAdminRoutes,
    };
    
    res.json({
      success: true,
      message: 'Survey route debugging information',
      route_tests: routeTests,
      mounted_routes: {
        survey: '/api/survey/*',
        survey_admin: '/api/survey/admin/*'
      },
      test_urls: {
        survey_test: '/api/survey/test',
        survey_admin_test: '/api/survey/admin/test',
        survey_admin_stats: '/api/survey/admin/stats',
        survey_admin_health: '/api/survey/admin/health'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Route debugging failed',
      details: error.message
    });
  }
});

// ===============================================
// ENHANCED 404 HANDLER WITH SURVEY ROUTE HINTS
// ===============================================

router.use('*', (req, res) => {
  const path = req.originalUrl.toLowerCase();
  const suggestions = [];
  
  if (path.includes('/survey/admin')) {
    suggestions.push('Survey admin routes may not be properly mounted');
    suggestions.push('Try: GET /api/survey/admin/test');
    suggestions.push('Try: GET /api/survey/admin/health'); 
    suggestions.push('Check: /api/debug/survey-routes');
    suggestions.push('Verify: surveyAdminRoutes.js is properly exported');
  } else if (path.includes('/survey')) {
    suggestions.push('Survey routes may not be properly mounted');
    suggestions.push('Try: GET /api/survey/test');
    suggestions.push('Check: surveyRoutes.js is properly exported');
  }
  
  console.log(`❌ Route not found: ${req.method} ${req.originalUrl}`);
  
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    suggestions: suggestions.length > 0 ? suggestions : [
      'Check if the route is properly mounted',
      'Verify middleware is correctly applied',
      'Try /api/debug/survey-routes for survey route debugging'
    ],
    debugging: {
      survey_routes_debug: '/api/debug/survey-routes',
      health_check: '/api/health',
      route_info: '/api/info'
    }
  });
});

export default router;









// // routes/index.js - ENHANCED WITH CLASS MANAGEMENT INTEGRATION
// // Adding class routes to existing comprehensive router
// // *** IDENTITY ROUTES REMOVED AND MERGED INTO USER ROUTES ***

// import express from 'express';

// // ===============================================
// // IMPORT ALL ROUTE MODULES (INCLUDING NEW CLASS ROUTES)
// // ===============================================

// // Authentication routes
// import authRoutes from './authRoutes.js';

// // User routes (now includes merged identity routes)
// import userRoutes from './userRoutes.js';
// import userAdminRoutes from './userAdminRoutes.js';

// // Content routes  
// import contentRoutes from './contentRoutes.js';

// // Membership routes
// import membershipRoutes from './membershipRoutes.js';
// import membershipAdminRoutes from './membershipAdminRoutes.js';

// // Survey routes (already integrated)
// import surveyRoutes from './surveyRoutes.js';
// import surveyAdminRoutes from './surveyAdminRoutes.js';

// // ✅ Class management routes
// import classRoutes from './classRoutes.js';
// import classAdminRoutes from './classAdminRoutes.js';

// // Communication and system routes
// import communicationRoutes from './communicationRoutes.js';
// import systemRoutes from './systemRoutes.js';

// // ❌ REMOVED: Identity routes (merged into user routes)
// // import identityRoutes from './identityRoutes.js';
// // import identityAdminRoutes from './identityAdminRoutes.js';

// const router = express.Router();

// // ===============================================
// // GLOBAL MIDDLEWARE
// // ===============================================

// router.use((req, res, next) => {
//   req.requestTime = new Date().toISOString();
//   req.apiVersion = '4.2'; // Updated version for identity route consolidation
//   next();
// });

// router.use('*', (req, res, next) => {
//   console.log(`🔍 Route Debug: ${req.method} ${req.originalUrl}`);
//   next();
// });

// // ===============================================
// // MOUNT ALL ROUTES WITH PROPER PATHS
// // ===============================================

// // 1. Authentication Routes
// console.log('🔗 Mounting authentication routes at /auth...');
// router.use('/auth', authRoutes);
// console.log('✅ Authentication routes mounted');

// // 2. User Routes (Enhanced with Identity Management)
// console.log('🔗 Mounting user routes at /users...');
// try {
//   router.use('/users', userRoutes);
//   console.log('✅ User routes mounted');
//   console.log('   🆔 Identity routes merged: converse ID, mentor ID, privacy settings');
// } catch (error) {
//   console.error('❌ Failed to mount user routes:', error.message);
// }

// // 3. User Admin Routes (Enhanced with Identity Admin)
// console.log('🔗 Mounting user admin routes at /users/admin...');
// try {
//   router.use('/users/admin', userAdminRoutes);
//   console.log('✅ User admin routes mounted');
//   console.log('   🔐 Identity admin routes merged: masking, unmasking, mentor management');
// } catch (error) {
//   console.error('❌ Failed to mount user admin routes:', error.message);
// }

// // 4. Content Routes
// console.log('🔗 Mounting content routes at /content...');
// try {
//   router.use('/content', contentRoutes);
//   console.log('✅ Content routes mounted');
// } catch (error) {
//   console.error('❌ Failed to mount content routes:', error.message);
// }

// // 5. Membership Routes
// console.log('🔗 Mounting membership routes at /membership...');
// try {
//   router.use('/membership', membershipRoutes);
//   console.log('✅ Membership routes mounted');
// } catch (error) {
//   console.error('❌ Failed to mount membership routes:', error.message);
// }

// // 6. Membership Admin Routes
// console.log('🔗 Mounting membership admin routes at /membership/admin...');
// try {
//   router.use('/membership/admin', membershipAdminRoutes);
//   console.log('✅ Membership admin routes mounted');
// } catch (error) {
//   console.error('❌ Failed to mount membership admin routes:', error.message);
// }

// // 7. Survey Routes (already integrated)
// console.log('🔗 Mounting survey routes at /survey...');
// try {
//   router.use('/survey', surveyRoutes);
//   console.log('✅ Survey routes mounted');
// } catch (error) {
//   console.error('❌ Failed to mount survey routes:', error.message);
// }

// // 8. Survey Admin Routes (already integrated)
// console.log('🔗 Mounting survey admin routes at /survey/admin...');
// try {
//   router.use('/survey/admin', surveyAdminRoutes);
//   console.log('✅ Survey admin routes mounted');
// } catch (error) {
//   console.error('❌ Failed to mount survey admin routes:', error.message);
// }

// // ✅ 9. Class Management Routes
// console.log('🔗 Mounting class routes at /classes...');
// try {
//   router.use('/classes', classRoutes);
//   console.log('✅ Class routes mounted');
//   console.log('   📊 Class endpoints now available:');
//   console.log('   • GET /api/classes - Get all classes');
//   console.log('   • POST /api/classes - Create class (admin only)');
//   console.log('   • GET /api/classes/:id - Get specific class');
//   console.log('   • PUT /api/classes/:id - Update class (admin only)');
//   console.log('   • DELETE /api/classes/:id - Delete class (admin only)');
//   console.log('   • GET /api/classes/:id/members - Get class members');
//   console.log('   • POST /api/classes/:id/join - Join class');
//   console.log('   • POST /api/classes/:id/leave - Leave class');
//   console.log('   • GET /api/classes/my-classes - Get user classes');
// } catch (error) {
//   console.error('❌ Failed to mount class routes:', error.message);
//   console.warn('⚠️ Continuing without class routes...');
// }

// // ✅ 10. Class Admin Routes
// console.log('🔗 Mounting class admin routes at /classes/admin...');
// try {
//   router.use('/classes/admin', classAdminRoutes);
//   console.log('✅ Class admin routes mounted');
//   console.log('   🔐 Class admin endpoints now available:');
//   console.log('   • GET /api/classes/admin - Get all classes for management');
//   console.log('   • POST /api/classes/admin - Create class with full options');
//   console.log('   • GET /api/classes/admin/:id - Get class (admin view)');
//   console.log('   • PUT /api/classes/admin/:id - Update class (admin)');
//   console.log('   • DELETE /api/classes/admin/:id - Delete class (admin)');
//   console.log('   • GET /api/classes/admin/:id/participants - Manage participants');
//   console.log('   • GET /api/classes/admin/:id/content - Manage content');
//   console.log('   • GET /api/classes/admin/:id/analytics - Class analytics');
//   console.log('   • POST /api/classes/admin/bulk-create - Bulk operations');
// } catch (error) {
//   console.error('❌ Failed to mount class admin routes:', error.message);
//   console.warn('⚠️ Continuing without class admin routes...');
// }

// // 11. Communication Routes
// console.log('🔗 Mounting communication routes at /communication...');
// try {
//   router.use('/communication', communicationRoutes);
//   console.log('✅ Communication routes mounted');
// } catch (error) {
//   console.error('❌ Failed to mount communication routes:', error.message);
//   console.warn('⚠️ Continuing without communication routes...');
// }

// // 12. System Routes
// console.log('🔗 Mounting system routes at /system...');
// try {
//   router.use('/system', systemRoutes);
//   console.log('✅ System routes mounted');
// } catch (error) {
//   console.error('❌ Failed to mount system routes:', error.message);
//   console.warn('⚠️ Continuing without system routes...');
// }

// // ❌ REMOVED: Identity routes (merged into user routes)
// // console.log('🔗 Mounting identity routes at /identity...');
// // router.use('/identity', identityRoutes);
// // console.log('✅ Identity routes mounted');

// // console.log('🔗 Mounting identity admin routes at /admin/identity...');
// // router.use('/admin/identity', identityAdminRoutes);
// // console.log('✅ Identity admin routes mounted');

// // ===============================================
// // BACKWARD COMPATIBILITY ROUTES
// // ===============================================

// console.log('🔄 Setting up backward compatibility...');

// // Legacy content routes
// router.use('/chats', (req, res, next) => {
//   console.log('🔄 Legacy /chats → /content/chats');
//   req.url = '/chats' + req.url;
//   contentRoutes(req, res, next);
// });

// router.use('/teachings', (req, res, next) => {
//   console.log('🔄 Legacy /teachings → /content/teachings');
//   req.url = '/teachings' + req.url;
//   contentRoutes(req, res, next);
// });

// // Legacy membership routes
// router.use('/apply', (req, res, next) => {
//   console.log('🔄 Legacy /apply → /membership/apply');
//   req.url = '/apply' + req.url;
//   membershipRoutes(req, res, next);
// });

// // Legacy survey routes
// router.use('/membership/survey', (req, res, next) => {
//   console.log('🔄 Legacy /membership/survey → /survey');
//   if (req.url === '/submit_applicationsurvey' && req.method === 'POST') {
//     req.url = '/submit_applicationsurvey';
//     surveyRoutes(req, res, next);
//   } else {
//     req.url = req.url.replace('/submit_applicationsurvey', '/submit');
//     surveyRoutes(req, res, next);
//   }
// });

// // ✅ NEW: Identity routes backward compatibility - redirect to user routes
// router.use('/identity', (req, res, next) => {
//   console.log('🔄 Legacy /identity → /users (identity routes merged)');
  
//   // Handle specific identity route redirections
//   if (req.url.startsWith('/converse')) {
//     req.url = req.url;
//     userRoutes(req, res, next);
//   } else if (req.url.startsWith('/mentor')) {
//     req.url = req.url;
//     userRoutes(req, res, next);
//   } else if (req.url === '/status') {
//     req.url = '/identity/status';
//     userRoutes(req, res, next);
//   } else if (req.url === '/verify') {
//     req.url = '/identity/verify';
//     userRoutes(req, res, next);
//   } else if (req.url === '/privacy-settings') {
//     req.url = '/privacy-settings';
//     userRoutes(req, res, next);
//   } else {
//     // For unmatched routes, provide helpful redirect info
//     res.status(301).json({
//       success: false,
//       message: 'Identity routes have been merged into user routes',
//       redirect: {
//         from: `/api/identity${req.url}`,
//         to: `/api/users${req.url}`,
//         note: 'Identity management is now part of user management'
//       },
//       newEndpoints: {
//         converseId: '/api/users/converse/*',
//         mentorId: '/api/users/mentor/*',
//         identity: '/api/users/identity/*',
//         privacy: '/api/users/privacy-settings'
//       },
//       timestamp: new Date().toISOString()
//     });
//   }
// });

// // ✅ NEW: Identity admin routes backward compatibility - redirect to user admin routes
// router.use('/admin/identity', (req, res, next) => {
//   console.log('🔄 Legacy /admin/identity → /users/admin (identity admin routes merged)');
  
//   // Provide helpful redirect info for admin routes
//   res.status(301).json({
//     success: false,
//     message: 'Identity admin routes have been merged into user admin routes',
//     redirect: {
//       from: `/api/admin/identity${req.url}`,
//       to: `/api/users/admin${req.url.replace('/mask-identity', '/mask-identity-advanced')}`,
//       note: 'Identity administration is now part of user administration'
//     },
//     newEndpoints: {
//       maskIdentity: '/api/users/admin/mask-identity-advanced',
//       unmaskIdentity: '/api/users/admin/unmask-identity',
//       auditTrail: '/api/users/admin/identity-audit-trail',
//       dashboard: '/api/users/admin/identity-dashboard',
//       analytics: '/api/users/admin/mentor-analytics',
//       bulkOperations: '/api/users/admin/bulk-assign-mentors'
//     },
//     timestamp: new Date().toISOString()
//   });
// });

// // ===============================================
// // API INFORMATION ROUTES (UPDATED)
// // ===============================================

// router.get('/', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Ikoota API v4.2 - CONSOLIDATED SYSTEM WITH MERGED IDENTITY MANAGEMENT',
//     version: '4.2.0-identity-consolidated',
//     timestamp: new Date().toISOString(),
//     environment: process.env.NODE_ENV || 'development',
    
//     mounted_routes: {
//       authentication: {
//         path: '/api/auth',
//         status: '✅ MOUNTED',
//         description: 'JWT authentication system'
//       },
//       user_management: {
//         path: '/api/users',
//         status: '✅ ENHANCED',
//         description: 'User profiles, settings, status + Identity management (converse ID, mentor ID, privacy)'
//       },
//       user_administration: {
//         path: '/api/users/admin',
//         status: '✅ ENHANCED',
//         description: 'Admin user management, roles, permissions + Identity admin (masking, audit, analytics)'
//       },
//       content_system: {
//         path: '/api/content',
//         status: '✅ MOUNTED',
//         description: 'Chats, teachings, comments with admin panel'
//       },
//       membership_system: {
//         path: '/api/membership',
//         status: '✅ MOUNTED',
//         description: 'Membership applications and status'
//       },
//       membership_administration: {
//         path: '/api/membership/admin',
//         status: '✅ MOUNTED',
//         description: 'Admin membership management and analytics'
//       },
//       survey_system: {
//         path: '/api/survey',
//         status: '✅ MOUNTED',
//         description: 'Survey submission, drafts, status, history'
//       },
//       survey_administration: {
//         path: '/api/survey/admin',
//         status: '✅ MOUNTED',
//         description: 'Admin survey management, approval, analytics'
//       },
//       class_system: {
//         path: '/api/classes',
//         status: '✅ MOUNTED',
//         description: 'Class management, enrollment, participation'
//       },
//       class_administration: {
//         path: '/api/classes/admin',
//         status: '✅ MOUNTED',
//         description: 'Admin class management, analytics, bulk operations'
//       },
//       communication_system: {
//         path: '/api/communication',
//         status: '✅ MOUNTED',
//         description: 'Communication and messaging system'
//       },
//       system_management: {
//         path: '/api/system',
//         status: '✅ MOUNTED',
//         description: 'System administration and monitoring'
//       }
//     },
    
//     // ✅ REMOVED: Separate identity endpoints (now merged)
//     deprecated_routes: {
//       identity_routes: {
//         old_path: '/api/identity',
//         new_path: '/api/users',
//         status: '❌ MERGED INTO USER ROUTES',
//         migration: 'All identity endpoints are now available under /api/users'
//       },
//       identity_admin_routes: {
//         old_path: '/api/admin/identity',
//         new_path: '/api/users/admin',
//         status: '❌ MERGED INTO USER ADMIN ROUTES',
//         migration: 'All identity admin endpoints are now available under /api/users/admin'
//       }
//     },
    
//     // ✅ UPDATED: Enhanced user endpoints with identity management
//     enhanced_user_endpoints: {
//       identity_management: [
//         'GET /api/users/converse - Get converse ID',
//         'POST /api/users/converse/generate - Generate converse ID',
//         'PUT /api/users/converse - Update converse ID',
//         'DELETE /api/users/converse - Delete converse ID',
//         'GET /api/users/converse/class/:classId/members - Get class members',
//         'GET /api/users/mentor - Get mentor ID',
//         'POST /api/users/mentor/generate - Generate mentor ID',
//         'PUT /api/users/mentor - Update mentor ID',
//         'DELETE /api/users/mentor - Delete mentor ID',
//         'GET /api/users/mentor/mentees - Get mentees',
//         'POST /api/users/mentor/mentees/assign - Assign mentee',
//         'DELETE /api/users/mentor/mentees/:menteeId - Remove mentee',
//         'GET /api/users/identity/status - Identity status',
//         'POST /api/users/identity/verify - Start verification',
//         'GET /api/users/privacy-settings - Get privacy settings',
//         'PUT /api/users/privacy-settings - Update privacy settings'
//       ],
//       admin_identity_management: [
//         'POST /api/users/admin/mask-identity-advanced - Advanced identity masking',
//         'POST /api/users/admin/unmask-identity - Unmask identity (Super Admin)',
//         'GET /api/users/admin/identity-audit-trail - Audit trail (Super Admin)',
//         'GET /api/users/admin/identity-overview - System overview (Super Admin)',
//         'GET /api/users/admin/search-masked-identities - Search identities (Super Admin)',
//         'GET /api/users/admin/identity-dashboard - Identity dashboard',
//         'GET /api/users/admin/mentor-analytics - Enhanced mentor analytics',
//         'POST /api/users/admin/bulk-assign-mentors - Bulk mentor assignment',
//         'GET /api/users/admin/identity-health - Identity system health',
//         'GET /api/users/admin/identity-stats - Identity statistics'
//       ]
//     },
    
//     // ✅ Migration guide for identity routes
//     migration_guide: {
//       for_frontend_developers: {
//         old_identity_endpoints: 'Replace /api/identity/* with /api/users/*',
//         old_admin_endpoints: 'Replace /api/admin/identity/* with /api/users/admin/*',
//         backward_compatibility: 'Legacy routes will redirect with 301 status and new endpoint info',
//         enhanced_features: 'Identity management now integrated with user profiles and settings'
//       },
//       for_backend_developers: {
//         removed_files: [
//           'routes/identityRoutes.js',
//           'routes/identityAdminRoutes.js'
//         ],
//         updated_files: [
//           'routes/userRoutes.js (added identity endpoints)',
//           'routes/userAdminRoutes.js (added identity admin endpoints)',
//           'routes/index.js (removed identity route imports and mounts)'
//         ],
//         controller_imports: 'Move identity controller imports to user route files'
//       }
//     },
    
//     frontend_compatibility: {
//       audience_class_manager: 'Backend now matches AudienceClassMgr.jsx expectations',
//       endpoints_aligned: 'All frontend expected endpoints now available',
//       admin_security: 'Admin operations properly secured with role checks',
//       identity_consolidated: 'Identity management now part of user management for cleaner API'
//     }
//   });
// });

// // Updated health check
// router.get('/health', async (req, res) => {
//   try {
//     const routeCount = {
//       auth: 'mounted',
//       users: 'mounted (enhanced with identity)', 
//       user_admin: 'mounted (enhanced with identity admin)',
//       content: 'mounted',
//       membership: 'mounted',
//       membership_admin: 'mounted',
//       survey: 'mounted',
//       survey_admin: 'mounted',
//       classes: 'mounted',
//       class_admin: 'mounted',
//       communication: 'mounted',
//       system: 'mounted'
//     };
    
//     res.json({
//       success: true,
//       message: 'All route systems healthy - Identity Management Consolidated!',
//       systems: routeCount,
//       total_systems: Object.keys(routeCount).length,
//       admin_systems: ['user_admin', 'membership_admin', 'survey_admin', 'class_admin'],
//       consolidated_features: {
//         identity_management: 'Merged into user management for cleaner API structure',
//         identity_admin: 'Merged into user admin for centralized user administration',
//         backward_compatibility: 'Legacy identity routes redirect to new locations'
//       },
//       removed_systems: {
//         identity_routes: 'Merged into /api/users/*',
//         identity_admin_routes: 'Merged into /api/users/admin/*'
//       },
//       timestamp: new Date().toISOString()
//     });
//   } catch (error) {
//     res.status(503).json({
//       success: false,
//       error: 'Route system unhealthy',
//       message: error.message,
//       timestamp: new Date().toISOString()
//     });
//   }
// });

// // ===============================================
// // ERROR HANDLING (UPDATED)
// // ===============================================

// router.use('*', (req, res) => {
//   console.log(`❌ Route not found in main router: ${req.method} ${req.originalUrl}`);
  
//   const path = req.originalUrl.toLowerCase();
//   const suggestions = [];
  
//   // Enhanced suggestions including consolidated routes
//   if (path.includes('/identity')) {
//     suggestions.push('Identity routes have been merged into user routes');
//     suggestions.push('Try /api/users/converse, /api/users/mentor, /api/users/privacy-settings');
//     suggestions.push('For admin: /api/users/admin/mask-identity-advanced, /api/users/admin/identity-dashboard');
//   } else if (path.includes('class')) {
//     suggestions.push('/api/classes/test', '/api/classes/', '/api/classes/admin/test');
//   } else if (path.includes('admin') && path.includes('survey')) {
//     suggestions.push('/api/survey/admin/test', '/api/survey/admin/pending');
//   } else if (path.includes('survey')) {
//     suggestions.push('/api/survey/test', '/api/survey/questions');
//   } else if (path.includes('/api/auth/')) {
//     suggestions.push('Auth routes: /api/auth/login, /api/auth/register, /api/auth/send-verification');
//   } else if (path.includes('/api/users/') || path.includes('/api/user/')) {
//     suggestions.push('User routes: /api/users/profile, /api/users/dashboard, /api/users/test');
//     suggestions.push('Identity routes: /api/users/converse, /api/users/mentor, /api/users/identity/status');
//     suggestions.push('Make sure you are authenticated (include Authorization header)');
//   } else if (path.includes('/api/users/admin/')) {
//     suggestions.push('User admin routes: /api/users/admin/test, /api/users/admin/stats');
//     suggestions.push('Identity admin routes: /api/users/admin/identity-dashboard, /api/users/admin/mentor-analytics');
//     suggestions.push('Admin routes require admin role');
//   } else if (path.includes('/api/content/')) {
//     suggestions.push('Content routes: /api/content/chats, /api/content/teachings, /api/content/comments');
//     suggestions.push('For creation: POST /api/content/chats (7-step), POST /api/content/teachings (8-step)');
//     suggestions.push('For admin: /api/content/admin/pending, /api/content/admin/stats');
//   } else if (path.includes('/api/membership/admin/')) {
//     suggestions.push('Membership admin routes: /api/membership/admin/test, /api/membership/admin/stats');
//     suggestions.push('Advanced admin routes: /api/membership/admin/dashboard, /api/membership/admin/alerts');
//     suggestions.push('Admin routes require admin role');
//   } else if (path.includes('/api/membership/')) {
//     suggestions.push('Membership routes: /api/membership/status, /api/membership/dashboard');
//     suggestions.push('Applications: /api/membership/apply/initial, /api/membership/apply/full');
//   }
  
//   res.status(404).json({
//     success: false,
//     message: 'API endpoint not found in main router',
//     path: req.originalUrl,
//     method: req.method,
//     available_systems: {
//       auth: '/api/auth/*',
//       users: '/api/users/* (includes identity management)',
//       user_admin: '/api/users/admin/* (includes identity admin)',
//       content: '/api/content/*',
//       membership: '/api/membership/*',
//       membership_admin: '/api/membership/admin/*',
//       survey: '/api/survey/*',
//       survey_admin: '/api/survey/admin/*',
//       classes: '/api/classes/*',
//       class_admin: '/api/classes/admin/*',
//       communication: '/api/communication/*',
//       system: '/api/system/*'
//     },
//     consolidated_routes: {
//       identity_management: '/api/users/* - Previously /api/identity/*',
//       identity_admin: '/api/users/admin/* - Previously /api/admin/identity/*'
//     },
//     suggestions: suggestions.length > 0 ? suggestions : [
//       'Check /api/info for available endpoints',
//       'Try /api/users/admin/test for user admin (includes identity admin)',
//       'Try /api/users/test-identity for identity features',
//       'Try /api/membership/admin/test for membership admin',
//       'Try /api/survey/admin/test for survey admin',
//       'Try /api/classes/admin/test for class admin',
//       'Try /api/survey/test for survey system',
//       'Try /api/classes/test for class system',
//       'Try /api/users/test to verify user routes (includes identity)',
//       'Legacy identity routes have been consolidated into user routes'
//     ],
//     timestamp: new Date().toISOString()
//   });
// });

// // ===============================================
// // STARTUP LOGGING (UPDATED)
// // ===============================================

// if (process.env.NODE_ENV === 'development') {
//   console.log('\n🚀 MAIN ROUTER - CONSOLIDATED SYSTEM WITH IDENTITY MANAGEMENT MERGED');
//   console.log('================================================================================');
//   console.log('✅ ROUTE SYSTEMS MOUNTED:');
//   console.log('   📁 Authentication: /auth');
//   console.log('   👤 Users: /users (includes identity management)');
//   console.log('   🔧 User Admin: /users/admin (includes identity admin)');
//   console.log('   📚 Content: /content');
//   console.log('   👥 Membership: /membership');
//   console.log('   🔐 Membership Admin: /membership/admin');
//   console.log('   📊 Survey System: /survey');
//   console.log('   🔍 Survey Admin: /survey/admin');
//   console.log('   🎓 Class System: /classes');
//   console.log('   📋 Class Admin: /classes/admin');
//   console.log('   💬 Communication: /communication');
//   console.log('   ⚙️  System: /system');
//   console.log('');
//   console.log('🔄 CONSOLIDATED FEATURES:');
//   console.log('   ✨ Identity management merged into user routes');
//   console.log('   ✨ Identity admin merged into user admin routes');
//   console.log('   ✨ Backward compatibility maintained with redirects');
//   console.log('   ✨ Cleaner API structure with consolidated endpoints');
//   console.log('   ✨ Enhanced user management with identity features');
//   console.log('   ✨ Comprehensive admin panel with identity administration');
//   console.log('');
//   console.log('❌ REMOVED ROUTES (MERGED):');
//   console.log('   🚫 /identity/* → merged into /users/*');
//   console.log('   🚫 /admin/identity/* → merged into /users/admin/*');
//   console.log('');
//   console.log('🔄 BACKWARD COMPATIBILITY:');
//   console.log('   ↪️  /api/identity/* → redirects to /api/users/*');
//   console.log('   ↪️  /api/admin/identity/* → redirects to /api/users/admin/*');
//   console.log('================================================================================\n');
// }

// export default router;






