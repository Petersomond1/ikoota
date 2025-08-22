// routes/index.js - ENHANCED WITH CLASS MANAGEMENT INTEGRATION
// Adding class routes to existing comprehensive router
// *** IDENTITY ROUTES REMOVED AND MERGED INTO USER ROUTES ***

import express from 'express';

// ===============================================
// IMPORT ALL ROUTE MODULES (INCLUDING NEW CLASS ROUTES)
// ===============================================

// Authentication routes
import authRoutes from './authRoutes.js';

// User routes (now includes merged identity routes)
import userRoutes from './userRoutes.js';
import userAdminRoutes from './userAdminRoutes.js';

// Content routes  
import contentRoutes from './contentRoutes.js';

// Membership routes
import membershipRoutes from './membershipRoutes.js';
import membershipAdminRoutes from './membershipAdminRoutes.js';

// Survey routes (already integrated)
import surveyRoutes from './surveyRoutes.js';
import surveyAdminRoutes from './surveyAdminRoutes.js';

// ✅ Class management routes
import classRoutes from './classRoutes.js';
import classAdminRoutes from './classAdminRoutes.js';

// Communication and system routes
import communicationRoutes from './communicationRoutes.js';
import systemRoutes from './systemRoutes.js';

// ❌ REMOVED: Identity routes (merged into user routes)
// import identityRoutes from './identityRoutes.js';
// import identityAdminRoutes from './identityAdminRoutes.js';

const router = express.Router();

// ===============================================
// GLOBAL MIDDLEWARE
// ===============================================

router.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  req.apiVersion = '4.2'; // Updated version for identity route consolidation
  next();
});

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

// 2. User Routes (Enhanced with Identity Management)
console.log('🔗 Mounting user routes at /users...');
try {
  router.use('/users', userRoutes);
  console.log('✅ User routes mounted');
  console.log('   🆔 Identity routes merged: converse ID, mentor ID, privacy settings');
} catch (error) {
  console.error('❌ Failed to mount user routes:', error.message);
}

// 3. User Admin Routes (Enhanced with Identity Admin)
console.log('🔗 Mounting user admin routes at /admin/users...');
try {
  router.use('/admin/users', userAdminRoutes);
  console.log('✅ User admin routes mounted');
  console.log('   🔐 Identity admin routes merged: masking, unmasking, mentor management');
} catch (error) {
  console.error('❌ Failed to mount user admin routes:', error.message);
}

// 4. Content Routes
console.log('🔗 Mounting content routes at /content...');
try {
  router.use('/content', contentRoutes);
  console.log('✅ Content routes mounted');
} catch (error) {
  console.error('❌ Failed to mount content routes:', error.message);
}

// 5. Membership Routes
console.log('🔗 Mounting membership routes at /membership...');
try {
  router.use('/membership', membershipRoutes);
  console.log('✅ Membership routes mounted');
} catch (error) {
  console.error('❌ Failed to mount membership routes:', error.message);
}

// 6. Membership Admin Routes
console.log('🔗 Mounting membership admin routes at /membership/admin...');
try {
  router.use('/membership/admin', membershipAdminRoutes);
  console.log('✅ Membership admin routes mounted');
} catch (error) {
  console.error('❌ Failed to mount membership admin routes:', error.message);
}

// 7. Survey Routes (already integrated)
console.log('🔗 Mounting survey routes at /survey...');
try {
  router.use('/survey', surveyRoutes);
  console.log('✅ Survey routes mounted');
} catch (error) {
  console.error('❌ Failed to mount survey routes:', error.message);
}

// 8. Survey Admin Routes (already integrated)
console.log('🔗 Mounting survey admin routes at /admin/survey...');
try {
  router.use('/admin/survey', surveyAdminRoutes);
  console.log('✅ Survey admin routes mounted');
} catch (error) {
  console.error('❌ Failed to mount survey admin routes:', error.message);
}

// ✅ 9. Class Management Routes
console.log('🔗 Mounting class routes at /classes...');
try {
  router.use('/classes', classRoutes);
  console.log('✅ Class routes mounted');
  console.log('   📊 Class endpoints now available:');
  console.log('   • GET /api/classes - Get all classes');
  console.log('   • POST /api/classes - Create class (admin only)');
  console.log('   • GET /api/classes/:id - Get specific class');
  console.log('   • PUT /api/classes/:id - Update class (admin only)');
  console.log('   • DELETE /api/classes/:id - Delete class (admin only)');
  console.log('   • GET /api/classes/:id/members - Get class members');
  console.log('   • POST /api/classes/:id/join - Join class');
  console.log('   • POST /api/classes/:id/leave - Leave class');
  console.log('   • GET /api/classes/my-classes - Get user classes');
} catch (error) {
  console.error('❌ Failed to mount class routes:', error.message);
  console.warn('⚠️ Continuing without class routes...');
}

// ✅ 10. Class Admin Routes
console.log('🔗 Mounting class admin routes at /admin/classes...');
try {
  router.use('/admin/classes', classAdminRoutes);
  console.log('✅ Class admin routes mounted');
  console.log('   🔐 Class admin endpoints now available:');
  console.log('   • GET /api/admin/classes - Get all classes for management');
  console.log('   • POST /api/admin/classes - Create class with full options');
  console.log('   • GET /api/admin/classes/:id - Get class (admin view)');
  console.log('   • PUT /api/admin/classes/:id - Update class (admin)');
  console.log('   • DELETE /api/admin/classes/:id - Delete class (admin)');
  console.log('   • GET /api/admin/classes/:id/participants - Manage participants');
  console.log('   • GET /api/admin/classes/:id/content - Manage content');
  console.log('   • GET /api/admin/classes/analytics - Class analytics');
  console.log('   • POST /api/admin/classes/bulk-create - Bulk operations');
} catch (error) {
  console.error('❌ Failed to mount class admin routes:', error.message);
  console.warn('⚠️ Continuing without class admin routes...');
}

// 11. Communication Routes
console.log('🔗 Mounting communication routes at /communication...');
try {
  router.use('/communication', communicationRoutes);
  console.log('✅ Communication routes mounted');
} catch (error) {
  console.error('❌ Failed to mount communication routes:', error.message);
  console.warn('⚠️ Continuing without communication routes...');
}

// 12. System Routes
console.log('🔗 Mounting system routes at /system...');
try {
  router.use('/system', systemRoutes);
  console.log('✅ System routes mounted');
} catch (error) {
  console.error('❌ Failed to mount system routes:', error.message);
  console.warn('⚠️ Continuing without system routes...');
}

// ❌ REMOVED: Identity routes (merged into user routes)
// console.log('🔗 Mounting identity routes at /identity...');
// router.use('/identity', identityRoutes);
// console.log('✅ Identity routes mounted');

// console.log('🔗 Mounting identity admin routes at /admin/identity...');
// router.use('/admin/identity', identityAdminRoutes);
// console.log('✅ Identity admin routes mounted');

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

// Legacy membership routes
router.use('/apply', (req, res, next) => {
  console.log('🔄 Legacy /apply → /membership/apply');
  req.url = '/apply' + req.url;
  membershipRoutes(req, res, next);
});

// Legacy survey routes
router.use('/membership/survey', (req, res, next) => {
  console.log('🔄 Legacy /membership/survey → /survey');
  if (req.url === '/submit_applicationsurvey' && req.method === 'POST') {
    req.url = '/submit_applicationsurvey';
    surveyRoutes(req, res, next);
  } else {
    req.url = req.url.replace('/submit_applicationsurvey', '/submit');
    surveyRoutes(req, res, next);
  }
});

// ✅ NEW: Identity routes backward compatibility - redirect to user routes
router.use('/identity', (req, res, next) => {
  console.log('🔄 Legacy /identity → /users (identity routes merged)');
  
  // Handle specific identity route redirections
  if (req.url.startsWith('/converse')) {
    req.url = req.url;
    userRoutes(req, res, next);
  } else if (req.url.startsWith('/mentor')) {
    req.url = req.url;
    userRoutes(req, res, next);
  } else if (req.url === '/status') {
    req.url = '/identity/status';
    userRoutes(req, res, next);
  } else if (req.url === '/verify') {
    req.url = '/identity/verify';
    userRoutes(req, res, next);
  } else if (req.url === '/privacy-settings') {
    req.url = '/privacy-settings';
    userRoutes(req, res, next);
  } else {
    // For unmatched routes, provide helpful redirect info
    res.status(301).json({
      success: false,
      message: 'Identity routes have been merged into user routes',
      redirect: {
        from: `/api/identity${req.url}`,
        to: `/api/users${req.url}`,
        note: 'Identity management is now part of user management'
      },
      newEndpoints: {
        converseId: '/api/users/converse/*',
        mentorId: '/api/users/mentor/*',
        identity: '/api/users/identity/*',
        privacy: '/api/users/privacy-settings'
      },
      timestamp: new Date().toISOString()
    });
  }
});

// ✅ NEW: Identity admin routes backward compatibility - redirect to user admin routes
router.use('/admin/identity', (req, res, next) => {
  console.log('🔄 Legacy /admin/identity → /admin/users (identity admin routes merged)');
  
  // Provide helpful redirect info for admin routes
  res.status(301).json({
    success: false,
    message: 'Identity admin routes have been merged into user admin routes',
    redirect: {
      from: `/api/admin/identity${req.url}`,
      to: `/api/admin/users${req.url.replace('/mask-identity', '/mask-identity-advanced')}`,
      note: 'Identity administration is now part of user administration'
    },
    newEndpoints: {
      maskIdentity: '/api/admin/users/mask-identity-advanced',
      unmaskIdentity: '/api/admin/users/unmask-identity',
      auditTrail: '/api/admin/users/identity-audit-trail',
      dashboard: '/api/admin/users/identity-dashboard',
      analytics: '/api/admin/users/mentor-analytics',
      bulkOperations: '/api/admin/users/bulk-assign-mentors'
    },
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// API INFORMATION ROUTES (UPDATED)
// ===============================================

router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Ikoota API v4.2 - CONSOLIDATED SYSTEM WITH MERGED IDENTITY MANAGEMENT',
    version: '4.2.0-identity-consolidated',
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
        status: '✅ ENHANCED',
        description: 'User profiles, settings, status + Identity management (converse ID, mentor ID, privacy)'
      },
      user_administration: {
        path: '/api/admin/users',
        status: '✅ ENHANCED',
        description: 'Admin user management, roles, permissions + Identity admin (masking, audit, analytics)'
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
      membership_administration: {
        path: '/api/membership/admin',
        status: '✅ MOUNTED',
        description: 'Admin membership management and analytics'
      },
      survey_system: {
        path: '/api/survey',
        status: '✅ MOUNTED',
        description: 'Survey submission, drafts, status, history'
      },
      survey_administration: {
        path: '/api/admin/survey',
        status: '✅ MOUNTED',
        description: 'Admin survey management, approval, analytics'
      },
      class_system: {
        path: '/api/classes',
        status: '✅ MOUNTED',
        description: 'Class management, enrollment, participation'
      },
      class_administration: {
        path: '/api/admin/classes',
        status: '✅ MOUNTED',
        description: 'Admin class management, analytics, bulk operations'
      },
      communication_system: {
        path: '/api/communication',
        status: '✅ MOUNTED',
        description: 'Communication and messaging system'
      },
      system_management: {
        path: '/api/system',
        status: '✅ MOUNTED',
        description: 'System administration and monitoring'
      }
    },
    
    // ✅ REMOVED: Separate identity endpoints (now merged)
    deprecated_routes: {
      identity_routes: {
        old_path: '/api/identity',
        new_path: '/api/users',
        status: '❌ MERGED INTO USER ROUTES',
        migration: 'All identity endpoints are now available under /api/users'
      },
      identity_admin_routes: {
        old_path: '/api/admin/identity',
        new_path: '/api/admin/users',
        status: '❌ MERGED INTO USER ADMIN ROUTES',
        migration: 'All identity admin endpoints are now available under /api/admin/users'
      }
    },
    
    // ✅ UPDATED: Enhanced user endpoints with identity management
    enhanced_user_endpoints: {
      identity_management: [
        'GET /api/users/converse - Get converse ID',
        'POST /api/users/converse/generate - Generate converse ID',
        'PUT /api/users/converse - Update converse ID',
        'DELETE /api/users/converse - Delete converse ID',
        'GET /api/users/converse/class/:classId/members - Get class members',
        'GET /api/users/mentor - Get mentor ID',
        'POST /api/users/mentor/generate - Generate mentor ID',
        'PUT /api/users/mentor - Update mentor ID',
        'DELETE /api/users/mentor - Delete mentor ID',
        'GET /api/users/mentor/mentees - Get mentees',
        'POST /api/users/mentor/mentees/assign - Assign mentee',
        'DELETE /api/users/mentor/mentees/:menteeId - Remove mentee',
        'GET /api/users/identity/status - Identity status',
        'POST /api/users/identity/verify - Start verification',
        'GET /api/users/privacy-settings - Get privacy settings',
        'PUT /api/users/privacy-settings - Update privacy settings'
      ],
      admin_identity_management: [
        'POST /api/admin/users/mask-identity-advanced - Advanced identity masking',
        'POST /api/admin/users/unmask-identity - Unmask identity (Super Admin)',
        'GET /api/admin/users/identity-audit-trail - Audit trail (Super Admin)',
        'GET /api/admin/users/identity-overview - System overview (Super Admin)',
        'GET /api/admin/users/search-masked-identities - Search identities (Super Admin)',
        'GET /api/admin/users/identity-dashboard - Identity dashboard',
        'GET /api/admin/users/mentor-analytics - Enhanced mentor analytics',
        'POST /api/admin/users/bulk-assign-mentors - Bulk mentor assignment',
        'GET /api/admin/users/identity-health - Identity system health',
        'GET /api/admin/users/identity-stats - Identity statistics'
      ]
    },
    
    // ✅ Migration guide for identity routes
    migration_guide: {
      for_frontend_developers: {
        old_identity_endpoints: 'Replace /api/identity/* with /api/users/*',
        old_admin_endpoints: 'Replace /api/admin/identity/* with /api/admin/users/*',
        backward_compatibility: 'Legacy routes will redirect with 301 status and new endpoint info',
        enhanced_features: 'Identity management now integrated with user profiles and settings'
      },
      for_backend_developers: {
        removed_files: [
          'routes/identityRoutes.js',
          'routes/identityAdminRoutes.js'
        ],
        updated_files: [
          'routes/userRoutes.js (added identity endpoints)',
          'routes/userAdminRoutes.js (added identity admin endpoints)',
          'routes/index.js (removed identity route imports and mounts)'
        ],
        controller_imports: 'Move identity controller imports to user route files'
      }
    },
    
    frontend_compatibility: {
      audience_class_manager: 'Backend now matches AudienceClassMgr.jsx expectations',
      endpoints_aligned: 'All frontend expected endpoints now available',
      admin_security: 'Admin operations properly secured with role checks',
      identity_consolidated: 'Identity management now part of user management for cleaner API'
    }
  });
});

// Updated health check
router.get('/health', async (req, res) => {
  try {
    const routeCount = {
      auth: 'mounted',
      users: 'mounted (enhanced with identity)', 
      user_admin: 'mounted (enhanced with identity admin)',
      content: 'mounted',
      membership: 'mounted',
      membership_admin: 'mounted',
      survey: 'mounted',
      survey_admin: 'mounted',
      classes: 'mounted',
      class_admin: 'mounted',
      communication: 'mounted',
      system: 'mounted'
    };
    
    res.json({
      success: true,
      message: 'All route systems healthy - Identity Management Consolidated!',
      systems: routeCount,
      total_systems: Object.keys(routeCount).length,
      admin_systems: ['user_admin', 'membership_admin', 'survey_admin', 'class_admin'],
      consolidated_features: {
        identity_management: 'Merged into user management for cleaner API structure',
        identity_admin: 'Merged into user admin for centralized user administration',
        backward_compatibility: 'Legacy identity routes redirect to new locations'
      },
      removed_systems: {
        identity_routes: 'Merged into /api/users/*',
        identity_admin_routes: 'Merged into /api/admin/users/*'
      },
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

// ===============================================
// ERROR HANDLING (UPDATED)
// ===============================================

router.use('*', (req, res) => {
  console.log(`❌ Route not found in main router: ${req.method} ${req.originalUrl}`);
  
  const path = req.originalUrl.toLowerCase();
  const suggestions = [];
  
  // Enhanced suggestions including consolidated routes
  if (path.includes('/identity')) {
    suggestions.push('Identity routes have been merged into user routes');
    suggestions.push('Try /api/users/converse, /api/users/mentor, /api/users/privacy-settings');
    suggestions.push('For admin: /api/admin/users/mask-identity-advanced, /api/admin/users/identity-dashboard');
  } else if (path.includes('class')) {
    suggestions.push('/api/classes/test', '/api/classes/', '/api/admin/classes/test');
  } else if (path.includes('admin') && path.includes('survey')) {
    suggestions.push('/api/admin/survey/test', '/api/admin/survey/pending');
  } else if (path.includes('survey')) {
    suggestions.push('/api/survey/test', '/api/survey/questions');
  } else if (path.includes('/api/auth/')) {
    suggestions.push('Auth routes: /api/auth/login, /api/auth/register, /api/auth/send-verification');
  } else if (path.includes('/api/users/') || path.includes('/api/user/')) {
    suggestions.push('User routes: /api/users/profile, /api/users/dashboard, /api/users/test');
    suggestions.push('Identity routes: /api/users/converse, /api/users/mentor, /api/users/identity/status');
    suggestions.push('Make sure you are authenticated (include Authorization header)');
  } else if (path.includes('/api/admin/users/')) {
    suggestions.push('User admin routes: /api/admin/users/test, /api/admin/users/stats');
    suggestions.push('Identity admin routes: /api/admin/users/identity-dashboard, /api/admin/users/mentor-analytics');
    suggestions.push('Admin routes require admin role');
  } else if (path.includes('/api/content/')) {
    suggestions.push('Content routes: /api/content/chats, /api/content/teachings, /api/content/comments');
    suggestions.push('For creation: POST /api/content/chats (7-step), POST /api/content/teachings (8-step)');
    suggestions.push('For admin: /api/content/admin/pending, /api/content/admin/stats');
  } else if (path.includes('/api/membership/admin/')) {
    suggestions.push('Membership admin routes: /api/membership/admin/test, /api/membership/admin/stats');
    suggestions.push('Advanced admin routes: /api/membership/admin/dashboard, /api/membership/admin/alerts');
    suggestions.push('Admin routes require admin role');
  } else if (path.includes('/api/membership/')) {
    suggestions.push('Membership routes: /api/membership/status, /api/membership/dashboard');
    suggestions.push('Applications: /api/membership/apply/initial, /api/membership/apply/full');
  }
  
  res.status(404).json({
    success: false,
    message: 'API endpoint not found in main router',
    path: req.originalUrl,
    method: req.method,
    available_systems: {
      auth: '/api/auth/*',
      users: '/api/users/* (includes identity management)',
      user_admin: '/api/admin/users/* (includes identity admin)',
      content: '/api/content/*',
      membership: '/api/membership/*',
      membership_admin: '/api/membership/admin/*',
      survey: '/api/survey/*',
      survey_admin: '/api/admin/survey/*',
      classes: '/api/classes/*',
      class_admin: '/api/admin/classes/*',
      communication: '/api/communication/*',
      system: '/api/system/*'
    },
    consolidated_routes: {
      identity_management: '/api/users/* - Previously /api/identity/*',
      identity_admin: '/api/admin/users/* - Previously /api/admin/identity/*'
    },
    suggestions: suggestions.length > 0 ? suggestions : [
      'Check /api/info for available endpoints',
      'Try /api/admin/users/test for user admin (includes identity admin)',
      'Try /api/users/test-identity for identity features',
      'Try /api/membership/admin/test for membership admin',
      'Try /api/admin/survey/test for survey admin',
      'Try /api/admin/classes/test for class admin',
      'Try /api/survey/test for survey system',
      'Try /api/classes/test for class system',
      'Try /api/users/test to verify user routes (includes identity)',
      'Legacy identity routes have been consolidated into user routes'
    ],
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// STARTUP LOGGING (UPDATED)
// ===============================================

if (process.env.NODE_ENV === 'development') {
  console.log('\n🚀 MAIN ROUTER - CONSOLIDATED SYSTEM WITH IDENTITY MANAGEMENT MERGED');
  console.log('================================================================================');
  console.log('✅ ROUTE SYSTEMS MOUNTED:');
  console.log('   📁 Authentication: /auth');
  console.log('   👤 Users: /users (includes identity management)');
  console.log('   🔧 User Admin: /admin/users (includes identity admin)');
  console.log('   📚 Content: /content');
  console.log('   👥 Membership: /membership');
  console.log('   🔐 Membership Admin: /membership/admin');
  console.log('   📊 Survey System: /survey');
  console.log('   🔍 Survey Admin: /admin/survey');
  console.log('   🎓 Class System: /classes');
  console.log('   📋 Class Admin: /admin/classes');
  console.log('   💬 Communication: /communication');
  console.log('   ⚙️  System: /system');
  console.log('');
  console.log('🔄 CONSOLIDATED FEATURES:');
  console.log('   ✨ Identity management merged into user routes');
  console.log('   ✨ Identity admin merged into user admin routes');
  console.log('   ✨ Backward compatibility maintained with redirects');
  console.log('   ✨ Cleaner API structure with consolidated endpoints');
  console.log('   ✨ Enhanced user management with identity features');
  console.log('   ✨ Comprehensive admin panel with identity administration');
  console.log('');
  console.log('❌ REMOVED ROUTES (MERGED):');
  console.log('   🚫 /identity/* → merged into /users/*');
  console.log('   🚫 /admin/identity/* → merged into /admin/users/*');
  console.log('');
  console.log('🔄 BACKWARD COMPATIBILITY:');
  console.log('   ↪️  /api/identity/* → redirects to /api/users/*');
  console.log('   ↪️  /api/admin/identity/* → redirects to /api/admin/users/*');
  console.log('================================================================================\n');
}

export default router;












// // routes/index.js - ENHANCED WITH CLASS MANAGEMENT INTEGRATION
// // Adding class routes to existing comprehensive router

// import express from 'express';

// // ===============================================
// // IMPORT ALL ROUTE MODULES (INCLUDING NEW CLASS ROUTES)
// // ===============================================

// // Authentication routes
// import authRoutes from './authRoutes.js';

// // User routes
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

// // ✅ NEW: Class management routes
// import classRoutes from './classRoutes.js';
// import classAdminRoutes from './classAdminRoutes.js';

// // In routes/index.js - ADD after class admin routes
// import communicationRoutes from './communicationRoutes.js';

// // In routes/index.js - ADD as system routes
// import systemRoutes from './systemRoutes.js';

// const router = express.Router();

// // ===============================================
// // GLOBAL MIDDLEWARE
// // ===============================================

// router.use((req, res, next) => {
//   req.requestTime = new Date().toISOString();
//   req.apiVersion = '4.1'; // Updated version for class integration
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

// // 2. User Routes
// console.log('🔗 Mounting user routes at /users...');
// try {
//   router.use('/users', userRoutes);
//   console.log('✅ User routes mounted');
// } catch (error) {
//   console.error('❌ Failed to mount user routes:', error.message);
// }

// // 3. User Admin Routes
// console.log('🔗 Mounting user admin routes at /admin/users...');
// try {
//   router.use('/admin/users', userAdminRoutes);
//   console.log('✅ User admin routes mounted');
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
// console.log('🔗 Mounting survey admin routes at /admin/survey...');
// try {
//   router.use('/admin/survey', surveyAdminRoutes);
//   console.log('✅ Survey admin routes mounted');
// } catch (error) {
//   console.error('❌ Failed to mount survey admin routes:', error.message);
// }

// // ✅ 9. NEW: Class Management Routes
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

// // ✅ 10. NEW: Class Admin Routes
// console.log('🔗 Mounting class admin routes at /admin/classes...');
// try {
//   router.use('/admin/classes', classAdminRoutes);
//   console.log('✅ Class admin routes mounted');
//   console.log('   🔐 Class admin endpoints now available:');
//   console.log('   • GET /api/admin/classes - Get all classes for management');
//   console.log('   • POST /api/admin/classes - Create class with full options');
//   console.log('   • GET /api/admin/classes/:id - Get class (admin view)');
//   console.log('   • PUT /api/admin/classes/:id - Update class (admin)');
//   console.log('   • DELETE /api/admin/classes/:id - Delete class (admin)');
//   console.log('   • GET /api/admin/classes/:id/participants - Manage participants');
//   console.log('   • GET /api/admin/classes/:id/content - Manage content');
//   console.log('   • GET /api/admin/classes/analytics - Class analytics');
//   console.log('   • POST /api/admin/classes/bulk-create - Bulk operations');
// } catch (error) {
//   console.error('❌ Failed to mount class admin routes:', error.message);
//   console.warn('⚠️ Continuing without class admin routes...');
// }


// router.use('/communication', communicationRoutes);
// console.log('✅ Communication routes mounted at /communication');


// router.use('/system', systemRoutes);
// console.log('✅ System routes mounted at /system');


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

// // ===============================================
// // API INFORMATION ROUTES (UPDATED)
// // ===============================================

// router.get('/', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Ikoota API v4.1 - COMPLETE SYSTEM WITH CLASS MANAGEMENT',
//     version: '4.1.0-class-integrated',
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
//         status: '✅ MOUNTED',
//         description: 'User profiles, settings, status'
//       },
//       user_administration: {
//         path: '/api/admin/users',
//         status: '✅ MOUNTED',
//         description: 'Admin user management, roles, permissions'
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
//         path: '/api/admin/survey',
//         status: '✅ MOUNTED',
//         description: 'Admin survey management, approval, analytics'
//       },
//       // ✅ NEW: Class management routes
//       class_system: {
//         path: '/api/classes',
//         status: '✅ MOUNTED',
//         description: '🆕 Class management, enrollment, participation'
//       },
//       class_administration: {
//         path: '/api/admin/classes',
//         status: '✅ MOUNTED',
//         description: '🆕 Admin class management, analytics, bulk operations'
//       }
//     },
    
//     // ✅ NEW: Class management endpoints
//     class_endpoints: {
//       user_facing: [
//         'GET /api/classes - Get all classes',
//         'GET /api/classes/:id - Get specific class',
//         'POST /api/classes/:id/join - Join class',
//         'POST /api/classes/:id/leave - Leave class',
//         'GET /api/classes/:id/members - Get class members',
//         'GET /api/classes/my-classes - Get user classes'
//       ],
//       admin_facing: [
//         'POST /api/classes - Create class (admin only)',
//         'PUT /api/classes/:id - Update class (admin only)',
//         'DELETE /api/classes/:id - Delete class (admin only)',
//         'GET /api/admin/classes - Class management dashboard',
//         'GET /api/admin/classes/analytics - Class analytics',
//         'POST /api/admin/classes/bulk-create - Bulk operations'
//       ]
//     },
    
//     // ✅ NEW: Class system features
//     class_features: {
//       user_features: [
//         'Class discovery and browsing',
//         'Class enrollment and participation',
//         'Class member directory',
//         'User class dashboard',
//         'Class progress tracking'
//       ],
//       admin_features: [
//         'Complete class lifecycle management',
//         'Participant management and analytics',
//         'Content management and distribution',
//         'Bulk operations and data export',
//         'Comprehensive reporting and insights'
//       ]
//     },
    
//     frontend_compatibility: {
//       audience_class_manager: 'Backend now matches AudienceClassMgr.jsx expectations',
//       endpoints_aligned: 'All frontend expected endpoints now available',
//       admin_security: 'Admin operations properly secured with role checks'
//     }
//   });
// });

// // Updated health check
// router.get('/health', async (req, res) => {
//   try {
//     const routeCount = {
//       auth: 'mounted',
//       users: 'mounted', 
//       user_admin: 'mounted',
//       content: 'mounted',
//       membership: 'mounted',
//       membership_admin: 'mounted',
//       survey: 'mounted',
//       survey_admin: 'mounted',
//       classes: 'mounted',        // ✅ NEW
//       class_admin: 'mounted'     // ✅ NEW
//     };
    
//     res.json({
//       success: true,
//       message: 'All route systems healthy - Class Management Integrated!',
//       systems: routeCount,
//       total_systems: Object.keys(routeCount).length,
//       admin_systems: ['user_admin', 'membership_admin', 'survey_admin', 'class_admin'], // ✅ NEW
//       new_features: {
//         class_system: 'Complete class management and enrollment system',
//         class_admin: 'Comprehensive class administration panel',
//         frontend_ready: 'Backend ready for AudienceClassMgr.jsx'
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
  
//   // Enhanced suggestions including class routes
//   if (path.includes('class')) {
//     suggestions.push('/api/classes/test', '/api/classes/', '/api/admin/classes/test');
//   } else if (path.includes('admin') && path.includes('survey')) {
//     suggestions.push('/api/admin/survey/test', '/api/admin/survey/pending');
//   } else if (path.includes('survey')) {
//     suggestions.push('/api/survey/test', '/api/survey/questions');
//   } else if (path.includes('/api/auth/')) {
//     suggestions.push('Auth routes: /api/auth/login, /api/auth/register, /api/auth/send-verification');
//   } else if (path.includes('/api/users/') || path.includes('/api/user/')) {
//     suggestions.push('User routes: /api/users/profile, /api/users/dashboard, /api/users/test');
//     suggestions.push('Make sure you are authenticated (include Authorization header)');
//   } else if (path.includes('/api/admin/users/')) {
//     suggestions.push('User admin routes: /api/admin/users/test, /api/admin/users/stats');
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
//   } else if (path.includes('/api/user-status/')) {
//     suggestions.push('Legacy routes preserved for compatibility');
//     suggestions.push('Consider using /api/membership/* for enhanced membership features');
//     suggestions.push('Consider using /api/survey/* for general survey features');
//   }
  
//   res.status(404).json({
//     success: false,
//     message: 'API endpoint not found in main router',
//     path: req.originalUrl,
//     method: req.method,
//     available_systems: {
//       auth: '/api/auth/*',
//       users: '/api/users/*',
//       user_admin: '/api/admin/users/*',
//       content: '/api/content/*',
//       membership: '/api/membership/*',
//       membership_admin: '/api/membership/admin/*',
//       survey: '/api/survey/*',
//       survey_admin: '/api/admin/survey/*',
//       classes: '/api/classes/*',              // ✅ NEW
//       class_admin: '/api/admin/classes/*'     // ✅ NEW
//     },
//     class_system: { // ✅ NEW
//       user_endpoints: '/api/classes/* - Class enrollment and participation',
//       admin_endpoints: '/api/admin/classes/* - Class management and analytics',
//       frontend_compatible: 'Endpoints match AudienceClassMgr.jsx expectations'
//     },
//     suggestions: suggestions.length > 0 ? suggestions : [
//       'Check /api/info for available endpoints',
//       'Check /api/debug/routes for all registered routes (development only)',
//       'Try /api/admin/users/test for user admin',
//       'Try /api/membership/admin/test for membership admin',
//       'Try /api/admin/survey/test for survey admin',
//       'Try /api/admin/classes/test for class admin', // ✅ NEW
//       'Try /api/survey/test for survey system',
//       'Try /api/classes/test for class system', // ✅ NEW
//       'Try /api/membership/admin/dashboard for advanced admin dashboard',
//       'Try /api/content/chats for chat system',
//       'Try /api/content/teachings for teaching system',
//       'Try /api/membership/status for membership system',
//       'Try /api/membership/dashboard for user dashboard',
//       'Try /api/users/test to verify user routes',
//       'Legacy endpoints at /api/user-status/* are preserved'
//     ],
//     timestamp: new Date().toISOString()
//   });
// });

// // ===============================================
// // STARTUP LOGGING (UPDATED)
// // ===============================================

// if (process.env.NODE_ENV === 'development') {
//   console.log('\n🚀 MAIN ROUTER - ALL SYSTEMS + CLASS MANAGEMENT INTEGRATION');
//   console.log('================================================================================');
//   console.log('✅ ROUTE SYSTEMS MOUNTED:');
//   console.log('   📁 Authentication: /auth');
//   console.log('   👤 Users: /users');
//   console.log('   🔧 User Admin: /admin/users');
//   console.log('   📚 Content: /content');
//   console.log('   👥 Membership: /membership');
//   console.log('   🔐 Membership Admin: /membership/admin');
//   console.log('   📊 Survey System: /survey');
//   console.log('   🔍 Survey Admin: /admin/survey');
//   console.log('   🎓 Class System: /classes');               // ✅ NEW
//   console.log('   📋 Class Admin: /admin/classes');          // ✅ NEW
//   console.log('');
//   console.log('🎓 CLASS MANAGEMENT FEATURES:');               // ✅ NEW
//   console.log('   ✨ Complete class lifecycle management');
//   console.log('   ✨ User enrollment and participation');
//   console.log('   ✨ Admin class management panel');
//   console.log('   ✨ OTU# ID format support');
//   console.log('   ✨ Comprehensive validation and security');
//   console.log('   ✨ Frontend AudienceClassMgr.jsx compatible');
//   console.log('   ✨ Analytics and reporting');
//   console.log('   ✨ Bulk operations support');
//   console.log('================================================================================\n');
// }

// export default router;












// // routes/index.js - ENHANCED WITH CLASS MANAGEMENT INTEGRATION
// // Adding class routes to existing comprehensive router

// import express from 'express';

// // ===============================================
// // IMPORT ALL ROUTE MODULES (INCLUDING NEW CLASS ROUTES)
// // ===============================================

// // Authentication routes
// import authRoutes from './authRoutes.js';

// // User routes
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

// // ✅ NEW: Class management routes
// import classRoutes from './classRoutes.js';
// import classAdminRoutes from './classAdminRoutes.js';

// const router = express.Router();

// // ===============================================
// // GLOBAL MIDDLEWARE
// // ===============================================

// router.use((req, res, next) => {
//   req.requestTime = new Date().toISOString();
//   req.apiVersion = '4.1'; // Updated version for class integration
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

// // 2. User Routes
// console.log('🔗 Mounting user routes at /users...');
// try {
//   router.use('/users', userRoutes);
//   console.log('✅ User routes mounted');
// } catch (error) {
//   console.error('❌ Failed to mount user routes:', error.message);
// }

// // 3. User Admin Routes
// console.log('🔗 Mounting user admin routes at /admin/users...');
// try {
//   router.use('/admin/users', userAdminRoutes);
//   console.log('✅ User admin routes mounted');
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
// console.log('🔗 Mounting survey admin routes at /admin/survey...');
// try {
//   router.use('/admin/survey', surveyAdminRoutes);
//   console.log('✅ Survey admin routes mounted');
// } catch (error) {
//   console.error('❌ Failed to mount survey admin routes:', error.message);
// }

// // ✅ 9. NEW: Class Management Routes
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
// } catch (error) {
//   console.error('❌ Failed to mount class routes:', error.message);
//   console.warn('⚠️ Continuing without class routes...');
// }

// // ✅ 10. NEW: Class Admin Routes
// console.log('🔗 Mounting class admin routes at /admin/classes...');
// try {
//   router.use('/admin/classes', classAdminRoutes);
//   console.log('✅ Class admin routes mounted');
//   console.log('   🔐 Class admin endpoints now available:');
//   console.log('   • GET /api/admin/classes - Get all classes for management');
//   console.log('   • POST /api/admin/classes - Create class with full options');
//   console.log('   • GET /api/admin/classes/:id - Get class (admin view)');
//   console.log('   • PUT /api/admin/classes/:id - Update class (admin)');
//   console.log('   • DELETE /api/admin/classes/:id - Delete class (admin)');
//   console.log('   • GET /api/admin/classes/:id/participants - Manage participants');
//   console.log('   • GET /api/admin/classes/:id/content - Manage content');
//   console.log('   • GET /api/admin/classes/analytics - Class analytics');
//   console.log('   • POST /api/admin/classes/bulk-create - Bulk operations');
// } catch (error) {
//   console.error('❌ Failed to mount class admin routes:', error.message);
//   console.warn('⚠️ Continuing without class admin routes...');
// }

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

// // ===============================================
// // API INFORMATION ROUTES (UPDATED)
// // ===============================================

// router.get('/', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Ikoota API v4.1 - COMPLETE SYSTEM WITH CLASS MANAGEMENT',
//     version: '4.1.0-class-integrated',
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
//         status: '✅ MOUNTED',
//         description: 'User profiles, settings, status'
//       },
//       user_administration: {
//         path: '/api/admin/users',
//         status: '✅ MOUNTED',
//         description: 'Admin user management, roles, permissions'
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
//         path: '/api/admin/survey',
//         status: '✅ MOUNTED',
//         description: 'Admin survey management, approval, analytics'
//       },
//       // ✅ NEW: Class management routes
//       class_system: {
//         path: '/api/classes',
//         status: '✅ MOUNTED',
//         description: '🆕 Class management, enrollment, participation'
//       },
//       class_administration: {
//         path: '/api/admin/classes',
//         status: '✅ MOUNTED',
//         description: '🆕 Admin class management, analytics, bulk operations'
//       }
//     },
    
//     // ✅ NEW: Class management endpoints
//     class_endpoints: {
//       user_facing: [
//         'GET /api/classes - Get all classes',
//         'GET /api/classes/:id - Get specific class',
//         'POST /api/classes/:id/join - Join class',
//         'POST /api/classes/:id/leave - Leave class',
//         'GET /api/classes/:id/members - Get class members',
//         'GET /api/classes/my-classes - Get user classes'
//       ],
//       admin_facing: [
//         'POST /api/classes - Create class (admin only)',
//         'PUT /api/classes/:id - Update class (admin only)',
//         'DELETE /api/classes/:id - Delete class (admin only)',
//         'GET /api/admin/classes - Class management dashboard',
//         'GET /api/admin/classes/analytics - Class analytics',
//         'POST /api/admin/classes/bulk-create - Bulk operations'
//       ]
//     },
    
//     // ✅ NEW: Class system features
//     class_features: {
//       user_features: [
//         'Class discovery and browsing',
//         'Class enrollment and participation',
//         'Class member directory',
//         'User class dashboard',
//         'Class progress tracking'
//       ],
//       admin_features: [
//         'Complete class lifecycle management',
//         'Participant management and analytics',
//         'Content management and distribution',
//         'Bulk operations and data export',
//         'Comprehensive reporting and insights'
//       ]
//     },
    
//     frontend_compatibility: {
//       audience_class_manager: 'Backend now matches AudienceClassMgr.jsx expectations',
//       endpoints_aligned: 'All frontend expected endpoints now available',
//       admin_security: 'Admin operations properly secured with role checks'
//     }
//   });
// });

// // Updated health check
// router.get('/health', async (req, res) => {
//   try {
//     const routeCount = {
//       auth: 'mounted',
//       users: 'mounted', 
//       user_admin: 'mounted',
//       content: 'mounted',
//       membership: 'mounted',
//       membership_admin: 'mounted',
//       survey: 'mounted',
//       survey_admin: 'mounted',
//       classes: 'mounted',        // ✅ NEW
//       class_admin: 'mounted'     // ✅ NEW
//     };
    
//     res.json({
//       success: true,
//       message: 'All route systems healthy - Class Management Integrated!',
//       systems: routeCount,
//       total_systems: Object.keys(routeCount).length,
//       admin_systems: ['user_admin', 'membership_admin', 'survey_admin', 'class_admin'], // ✅ NEW
//       new_features: {
//         class_system: 'Complete class management and enrollment system',
//         class_admin: 'Comprehensive class administration panel',
//         frontend_ready: 'Backend ready for AudienceClassMgr.jsx'
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
  
//   // Enhanced suggestions including class routes
//   if (path.includes('class')) {
//     suggestions.push('/api/classes/test', '/api/classes/', '/api/admin/classes/test');
//   } else if (path.includes('admin') && path.includes('survey')) {
//     suggestions.push('/api/admin/survey/test', '/api/admin/survey/pending');
//   } else if (path.includes('survey')) {
//     suggestions.push('/api/survey/test', '/api/survey/questions');
//   }
//   // ... other existing suggestions
  
//   res.status(404).json({
//     success: false,
//     message: 'API endpoint not found in main router',
//     path: req.originalUrl,
//     method: req.method,
//     available_systems: {
//       auth: '/api/auth/*',
//       users: '/api/users/*',
//       user_admin: '/api/admin/users/*',
//       content: '/api/content/*',
//       membership: '/api/membership/*',
//       membership_admin: '/api/membership/admin/*',
//       survey: '/api/survey/*',
//       survey_admin: '/api/admin/survey/*',
//       classes: '/api/classes/*',              // ✅ NEW
//       class_admin: '/api/admin/classes/*'     // ✅ NEW
//     },
//     class_system: { // ✅ NEW
//       user_endpoints: '/api/classes/* - Class enrollment and participation',
//       admin_endpoints: '/api/admin/classes/* - Class management and analytics',
//       frontend_compatible: 'Endpoints match AudienceClassMgr.jsx expectations'
//     },
//     timestamp: new Date().toISOString()
//   });
// });

// // ===============================================
// // STARTUP LOGGING (UPDATED)
// // ===============================================

// if (process.env.NODE_ENV === 'development') {
//   console.log('\n🚀 MAIN ROUTER - ALL SYSTEMS + CLASS MANAGEMENT INTEGRATION');
//   console.log('================================================================================');
//   console.log('✅ ROUTE SYSTEMS MOUNTED:');
//   console.log('   📁 Authentication: /auth');
//   console.log('   👤 Users: /users');
//   console.log('   🔧 User Admin: /admin/users');
//   console.log('   📚 Content: /content');
//   console.log('   👥 Membership: /membership');
//   console.log('   🔐 Membership Admin: /membership/admin');
//   console.log('   📊 Survey System: /survey');
//   console.log('   🔍 Survey Admin: /admin/survey');
//   console.log('   🎓 Class System: /classes');               // ✅ NEW
//   console.log('   📋 Class Admin: /admin/classes');          // ✅ NEW
//   console.log('');
//   console.log('🎓 CLASS MANAGEMENT FEATURES:');               // ✅ NEW
//   console.log('   ✨ Complete class lifecycle management');
//   console.log('   ✨ User enrollment and participation');
//   console.log('   ✨ Admin class management panel');
//   console.log('   ✨ OTU# ID format support');
//   console.log('   ✨ Comprehensive validation and security');
//   console.log('   ✨ Frontend AudienceClassMgr.jsx compatible');
//   console.log('   ✨ Analytics and reporting');
//   console.log('   ✨ Bulk operations support');
//   console.log('================================================================================\n');
// }

// export default router;












// // routes/index.js - COMPLETE ROUTE HUB WITH ALL SYSTEMS INCLUDING SURVEY
// // Enhanced version of existing router with survey system integration
// // Maintains all existing functionality while adding survey capabilities

// import express from 'express';

// // ===============================================
// // IMPORT ALL ROUTE MODULES
// // ===============================================

// // Authentication routes
// import authRoutes from './authRoutes.js';

// // User routes
// import userRoutes from './userRoutes.js';
// import userAdminRoutes from './userAdminRoutes.js';

// // Content routes  
// import contentRoutes from './contentRoutes.js';

// // Membership routes
// import membershipRoutes from './membershipRoutes.js';
// import membershipAdminRoutes from './membershipAdminRoutes.js';

// // ✅ NEW: Survey routes
// import surveyRoutes from './surveyRoutes.js';
// import surveyAdminRoutes from './surveyAdminRoutes.js';

// const router = express.Router();

// // ===============================================
// // GLOBAL MIDDLEWARE
// // ===============================================

// // Add request metadata to all routes
// router.use((req, res, next) => {
//   req.requestTime = new Date().toISOString();
//   req.apiVersion = '4.0'; // Updated version for survey integration
//   next();
// });

// // Add debugging middleware to see what routes are being hit
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

// // 2. User Routes (regular user management)
// console.log('🔗 Mounting user routes at /users...');
// try {
//   router.use('/users', userRoutes);
//   console.log('✅ User routes mounted');
// } catch (error) {
//   console.error('❌ Failed to mount user routes:', error.message);
// }

// // 3. User Admin Routes
// console.log('🔗 Mounting user admin routes at /admin/users...');
// try {
//   router.use('/admin/users', userAdminRoutes);
//   console.log('✅ User admin routes mounted');
// } catch (error) {
//   console.error('❌ Failed to mount user admin routes:', error.message);
//   console.warn('⚠️ Continuing without user admin routes...');
// }

// // 4. Content Routes
// console.log('🔗 Mounting content routes at /content...');
// try {
//   router.use('/content', contentRoutes);
//   console.log('✅ Content routes mounted');
// } catch (error) {
//   console.error('❌ Failed to mount content routes:', error.message);
// }

// // 5. Membership Routes (main membership functionality)
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
//   console.log('   📊 Membership admin endpoints now available:');
//   console.log('   • GET /api/membership/admin/test');
//   console.log('   • GET /api/membership/admin/full-membership-stats');
//   console.log('   • GET /api/membership/admin/applications');
//   console.log('   • GET /api/membership/admin/analytics');
//   console.log('   • GET /api/membership/admin/stats');
//   console.log('   • GET /api/membership/admin/overview');
// } catch (error) {
//   console.error('❌ Failed to mount membership admin routes:', error.message);
//   console.warn('⚠️ Continuing without membership admin routes...');
// }

// // ✅ 7. NEW: Survey Routes (user-facing survey operations)
// console.log('🔗 Mounting survey routes at /survey...');
// try {
//   router.use('/survey', surveyRoutes);
//   console.log('✅ Survey routes mounted');
//   console.log('   📊 Survey endpoints now available:');
//   console.log('   • POST /api/survey/submit - Submit survey');
//   console.log('   • GET /api/survey/questions - Get questions');
//   console.log('   • GET /api/survey/status - Check status');
//   console.log('   • POST /api/survey/draft/save - Save draft');
//   console.log('   • GET /api/survey/drafts - Get drafts');
//   console.log('   • GET /api/survey/history - Survey history');
// } catch (error) {
//   console.error('❌ Failed to mount survey routes:', error.message);
//   console.warn('⚠️ Continuing without survey routes...');
// }

// // ✅ 8. NEW: Survey Admin Routes (survey administration)
// console.log('🔗 Mounting survey admin routes at /admin/survey...');
// try {
//   router.use('/admin/survey', surveyAdminRoutes);
//   console.log('✅ Survey admin routes mounted');
//   console.log('   🔐 Survey admin endpoints now available:');
//   console.log('   • GET /api/admin/survey/test - Test survey admin');
//   console.log('   • GET /api/admin/survey/pending - Pending surveys');
//   console.log('   • PUT /api/admin/survey/approve - Approve surveys');
//   console.log('   • GET /api/admin/survey/analytics - Survey analytics');
//   console.log('   • GET /api/admin/survey/questions - Manage questions');
//   console.log('   • GET /api/admin/survey/export - Export data (super admin)');
// } catch (error) {
//   console.error('❌ Failed to mount survey admin routes:', error.message);
//   console.warn('⚠️ Continuing without survey admin routes...');
// }

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

// router.use('/comments', (req, res, next) => {
//   console.log('🔄 Legacy /comments → /content/comments');
//   req.url = '/comments' + req.url;
//   contentRoutes(req, res, next);
// });

// // Legacy membership routes
// router.use('/apply', (req, res, next) => {
//   console.log('🔄 Legacy /apply → /membership/apply');
//   req.url = '/apply' + req.url;
//   membershipRoutes(req, res, next);
// });

// // ✅ NEW: Legacy survey routes for surveypageservice.js compatibility
// router.use('/membership/survey', (req, res, next) => {
//   console.log('🔄 Legacy /membership/survey → /survey');
//   // Handle the specific legacy endpoint
//   if (req.url === '/submit_applicationsurvey' && req.method === 'POST') {
//     req.url = '/submit_applicationsurvey';
//     surveyRoutes(req, res, next);
//   } else {
//     // Other legacy survey routes
//     req.url = req.url.replace('/submit_applicationsurvey', '/submit');
//     surveyRoutes(req, res, next);
//   }
// });

// // ===============================================
// // API INFORMATION ROUTES
// // ===============================================

// // Main API info endpoint
// router.get('/', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Ikoota API v4.0 - COMPLETE SYSTEM WITH SURVEY INTEGRATION',
//     version: '4.0.0-survey-integrated',
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
//         status: '✅ MOUNTED',
//         description: 'User profiles, settings, status'
//       },
//       user_administration: {
//         path: '/api/admin/users',
//         status: '✅ MOUNTED',
//         description: 'Admin user management, roles, permissions'
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
//       // ✅ NEW: Survey system routes
//       survey_system: {
//         path: '/api/survey',
//         status: '✅ MOUNTED',
//         description: '🆕 Survey submission, drafts, status, history'
//       },
//       survey_administration: {
//         path: '/api/admin/survey',
//         status: '✅ MOUNTED',
//         description: '🆕 Admin survey management, approval, analytics'
//       }
//     },
    
//     admin_endpoints: {
//       user_admin: [
//         'GET /api/admin/users/test - Test user admin system',
//         'GET /api/admin/users - Get all users',
//         'GET /api/admin/users/search - Search users',
//         'GET /api/admin/users/stats - User statistics',
//         'POST /api/admin/users/create - Create user',
//         'PUT /api/admin/users/:id - Update user',
//         'PUT /api/admin/users/role - Update user role',
//         'POST /api/admin/users/ban - Ban user',
//         'POST /api/admin/users/unban - Unban user'
//       ],
//       membership_admin: [
//         'GET /api/membership/admin/test - Test membership admin system',
//         'GET /api/membership/admin/full-membership-stats - Get statistics',
//         'GET /api/membership/admin/applications - Get applications',
//         'GET /api/membership/admin/analytics - Get analytics',
//         'GET /api/membership/admin/stats - Get application stats',
//         'GET /api/membership/admin/overview - Get overview',
//         'GET /api/membership/admin/health - Health check'
//       ],
//       // ✅ NEW: Survey admin endpoints
//       survey_admin: [
//         'GET /api/admin/survey/test - Test survey admin system',
//         'GET /api/admin/survey/pending - Get pending surveys',
//         'PUT /api/admin/survey/approve - Approve surveys',
//         'PUT /api/admin/survey/reject - Reject surveys',
//         'POST /api/admin/survey/bulk-approve - Bulk approve',
//         'GET /api/admin/survey/analytics - Survey analytics',
//         'GET /api/admin/survey/questions - Manage questions',
//         'GET /api/admin/survey/export - Export data (super admin)'
//       ]
//     },
    
//     // ✅ NEW: Enhanced quick tests including survey system
//     quick_tests: {
//       user_admin: 'GET /api/admin/users/test',
//       membership_admin: 'GET /api/membership/admin/test',
//       survey_admin: 'GET /api/admin/survey/test',
//       survey_system: 'GET /api/survey/test',
//       user_profile: 'GET /api/users/profile',
//       membership_status: 'GET /api/membership/status',
//       survey_status: 'GET /api/survey/status',
//       content_chats: 'GET /api/content/chats'
//     },
    
//     // ✅ NEW: Survey system features
//     survey_features: {
//       user_features: [
//         'Survey submission and management',
//         'Draft auto-save (30-second intervals)',
//         'Survey history and status tracking',
//         'Dynamic question labels',
//         'Response updates for pending surveys'
//       ],
//       admin_features: [
//         'Question management (CRUD operations)',
//         'Survey approval workflow',
//         'Bulk operations (approve/reject)',
//         'Comprehensive analytics dashboard',
//         'Data export (CSV/JSON)',
//         'System metrics and audit logs'
//       ]
//     },
    
//     legacy_compatibility: {
//       content: 'Old /chats, /teachings routes redirect to /content/*',
//       membership: 'Old /apply routes redirect to /membership/*',
//       survey: 'Old /membership/survey/* routes redirect to /survey/*' // ✅ NEW
//     },
    
//     system_architecture: {
//       survey_independence: 'Survey system operates independently from membership applications',
//       admin_separation: 'Survey admin (/admin/survey) separate from membership admin (/membership/admin)',
//       shared_infrastructure: 'Shared authentication, database, and utilities',
//       frontend_ready: 'Backend prepared for SurveyControls.jsx and enhanced MembershipReviewControls.jsx'
//     }
//   });
// });

// // Health check for the router
// router.get('/health', async (req, res) => {
//   try {
//     const routeCount = {
//       auth: 'mounted',
//       users: 'mounted', 
//       user_admin: 'mounted',
//       content: 'mounted',
//       membership: 'mounted',
//       membership_admin: 'mounted',
//       survey: 'mounted',        // ✅ NEW
//       survey_admin: 'mounted'   // ✅ NEW
//     };
    
//     res.json({
//       success: true,
//       message: 'All route systems healthy - Survey System Integrated!',
//       systems: routeCount,
//       total_systems: Object.keys(routeCount).length,
//       admin_systems: ['user_admin', 'membership_admin', 'survey_admin'], // ✅ NEW
//       new_features: {
//         survey_system: 'General surveys, feedback forms, assessments',
//         survey_admin: 'Independent survey administration panel',
//         system_separation: 'Survey and membership systems operate independently'
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

// // Route discovery endpoint
// router.get('/routes', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Route Discovery - COMPLETE SYSTEM WITH SURVEY INTEGRATION',
//     version: '4.0.0-survey-integrated',
    
//     all_routes: {
//       authentication: {
//         base: '/api/auth',
//         status: 'operational',
//         endpoints: ['POST /login', 'POST /register', 'POST /logout']
//       },
//       user_management: {
//         base: '/api/users',
//         status: 'operational',
//         endpoints: ['GET /profile', 'PUT /profile', 'GET /dashboard']
//       },
//       user_administration: {
//         base: '/api/admin/users',
//         status: 'operational',
//         note: 'Requires admin role',
//         endpoints: ['GET /test', 'GET /', 'GET /search', 'POST /create']
//       },
//       content_management: {
//         base: '/api/content',
//         status: 'operational',
//         endpoints: ['GET /chats', 'POST /chats', 'GET /teachings']
//       },
//       membership_management: {
//         base: '/api/membership',
//         status: 'operational',
//         endpoints: ['GET /status', 'GET /dashboard', 'POST /apply/initial']
//       },
//       membership_administration: {
//         base: '/api/membership/admin',
//         status: 'operational',
//         note: 'Requires admin role',
//         endpoints: ['GET /test', 'GET /stats', 'GET /applications']
//       },
//       // ✅ NEW: Survey system routes
//       survey_management: {
//         base: '/api/survey',
//         status: 'operational',
//         note: '🆕 Independent survey system',
//         endpoints: ['POST /submit', 'GET /questions', 'GET /status', 'POST /draft/save']
//       },
//       survey_administration: {
//         base: '/api/admin/survey',
//         status: 'operational', 
//         note: '🆕 Survey admin panel (requires admin role)',
//         endpoints: ['GET /test', 'GET /pending', 'PUT /approve', 'GET /analytics']
//       }
//     },
    
//     admin_test_urls: {
//       user_admin: 'http://localhost:3000/api/admin/users/test',
//       membership_admin: 'http://localhost:3000/api/membership/admin/test',
//       survey_admin: 'http://localhost:3000/api/admin/survey/test' // ✅ NEW
//     },
    
//     survey_system_info: { // ✅ NEW
//       purpose: 'Independent survey management separate from membership applications',
//       user_endpoints: '/api/survey/* - Submit surveys, manage drafts, view history',
//       admin_endpoints: '/api/admin/survey/* - Question management, approval, analytics',
//       compatibility: 'Legacy /membership/survey/* routes redirect to /survey/*',
//       frontend_ready: 'Backend prepared for SurveyControls.jsx component'
//     },
    
//     timestamp: new Date().toISOString()
//   });
// });

// // ===============================================
// // TEST ROUTES FOR DEBUGGING
// // ===============================================

// // Test route to verify the main router is working
// router.get('/test-main-router', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Main router (routes/index.js) is working with Survey Integration!',
//     timestamp: new Date().toISOString(),
//     mounted_systems: [
//       'auth ✅',
//       'users ✅', 
//       'admin/users ✅',
//       'content ✅',
//       'membership ✅',
//       'membership/admin ✅',
//       'survey ✅',        // ✅ NEW
//       'admin/survey ✅'   // ✅ NEW
//     ],
//     new_integration: {
//       survey_routes: '/api/survey/* - 15+ user endpoints',
//       survey_admin_routes: '/api/admin/survey/* - 25+ admin endpoints',
//       legacy_compatibility: 'surveypageservice.js endpoints still work',
//       system_separation: 'Survey and membership systems independent'
//     }
//   });
// });

// // ✅ NEW: Survey system integration test
// router.get('/test-survey-integration', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Survey System Integration Test',
//     timestamp: new Date().toISOString(),
//     survey_routes: {
//       user_facing: '/api/survey/* (submit, drafts, status, history)',
//       admin_facing: '/api/admin/survey/* (questions, approval, analytics)',
//       legacy_support: '/api/membership/survey/submit_applicationsurvey still works'
//     },
//     integration_status: {
//       routes_mounted: 'Survey routes integrated into main router',
//       middleware_ready: 'Enhanced auth.js with survey permissions',
//       database_ready: 'Enhancement script prepared for survey support',
//       frontend_ready: 'Backend prepared for SurveyControls.jsx'
//     },
//     next_steps: [
//       'Run database enhancement script',
//       'Update middleware/auth.js with survey permissions', 
//       'Test all survey endpoints',
//       'Begin frontend SurveyControls.jsx development'
//     ]
//   });
// });

// // ===============================================
// // ERROR HANDLING
// // ===============================================

// // 404 handler for routes
// router.use('*', (req, res) => {
//   console.log(`❌ Route not found in main router: ${req.method} ${req.originalUrl}`);
  
//   const path = req.originalUrl.toLowerCase();
//   const suggestions = [];
  
//   // Smart suggestions based on the requested path
//   if (path.includes('admin') && path.includes('survey')) {
//     suggestions.push('/api/admin/survey/test', '/api/admin/survey/pending', '/api/admin/survey/analytics');
//   } else if (path.includes('survey')) {
//     suggestions.push('/api/survey/test', '/api/survey/questions', '/api/survey/status');
//   } else if (path.includes('admin') && path.includes('user')) {
//     suggestions.push('/api/admin/users/test', '/api/admin/users/stats');
//   } else if (path.includes('admin') && path.includes('membership')) {
//     suggestions.push('/api/membership/admin/test', '/api/membership/admin/stats');
//   } else if (path.includes('user')) {
//     suggestions.push('/api/users/profile', '/api/users/dashboard');
//   } else if (path.includes('membership')) {
//     suggestions.push('/api/membership/status', '/api/membership/dashboard');
//   } else if (path.includes('content')) {
//     suggestions.push('/api/content/chats', '/api/content/teachings');
//   } else if (path.includes('auth')) {
//     suggestions.push('/api/auth/login', '/api/auth/register');
//   }
  
//   res.status(404).json({
//     success: false,
//     message: 'API endpoint not found in main router',
//     path: req.originalUrl,
//     method: req.method,
//     suggestions: suggestions.length > 0 ? suggestions : [
//       '/api/ - API info',
//       '/api/health - Health check',
//       '/api/routes - Route discovery',
//       '/api/admin/users/test - User admin test',
//       '/api/membership/admin/test - Membership admin test',
//       '/api/admin/survey/test - Survey admin test', // ✅ NEW
//       '/api/survey/test - Survey system test', // ✅ NEW
//       '/api/users/profile - User profile',
//       '/api/membership/status - Membership status'
//     ],
    
//     available_systems: {
//       auth: '/api/auth/*',
//       users: '/api/users/*',
//       user_admin: '/api/admin/users/*',
//       content: '/api/content/*',
//       membership: '/api/membership/*',
//       membership_admin: '/api/membership/admin/*',
//       survey: '/api/survey/*',              // ✅ NEW
//       survey_admin: '/api/admin/survey/*'   // ✅ NEW
//     },
    
//     admin_systems: {
//       user_administration: '/api/admin/users/* (requires admin role)',
//       membership_administration: '/api/membership/admin/* (requires admin role)',
//       survey_administration: '/api/admin/survey/* (requires admin role)' // ✅ NEW
//     },
    
//     survey_system: { // ✅ NEW
//       user_endpoints: '/api/survey/* - Submit surveys, manage drafts, view history',
//       admin_endpoints: '/api/admin/survey/* - Question management, approval, analytics',
//       purpose: 'Independent survey system separate from membership applications',
//       legacy_compatibility: 'Old /membership/survey/* routes redirect to /survey/*'
//     },
    
//     timestamp: new Date().toISOString()
//   });
// });

// // ===============================================
// // STARTUP LOGGING
// // ===============================================

// if (process.env.NODE_ENV === 'development') {
//   console.log('\n🚀 MAIN ROUTER (routes/index.js) - ALL SYSTEMS + SURVEY INTEGRATION');
//   console.log('================================================================================');
//   console.log('✅ ROUTE SYSTEMS MOUNTED:');
//   console.log('   📁 Authentication: /auth');
//   console.log('   👤 Users: /users');
//   console.log('   🔧 User Admin: /admin/users');
//   console.log('   📚 Content: /content');
//   console.log('   👥 Membership: /membership');
//   console.log('   🔐 Membership Admin: /membership/admin');
//   console.log('   📊 Survey System: /survey');               // ✅ NEW
//   console.log('   🔍 Survey Admin: /admin/survey');          // ✅ NEW
//   console.log('');
//   console.log('🔄 LEGACY COMPATIBILITY:');
//   console.log('   🔗 /chats → /content/chats');
//   console.log('   🔗 /teachings → /content/teachings');
//   console.log('   🔗 /comments → /content/comments');
//   console.log('   🔗 /apply → /membership/apply');
//   console.log('   🔗 /membership/survey → /survey');          // ✅ NEW
//   console.log('');
//   console.log('📊 SURVEY SYSTEM FEATURES:');                 // ✅ NEW
//   console.log('   ✨ Independent from membership applications');
//   console.log('   ✨ Draft auto-save every 30 seconds');
//   console.log('   ✨ Dynamic question and label management');
//   console.log('   ✨ Survey approval workflow');
//   console.log('   ✨ Comprehensive analytics and reporting');
//   console.log('   ✨ Data export capabilities (CSV/JSON)');
//   console.log('   ✨ Admin panel for survey management');
//   console.log('');
//   console.log('🎯 QUICK TEST URLS:');
//   console.log('   • Main router: GET /api/test-main-router');
//   console.log('   • Survey integration: GET /api/test-survey-integration');
//   console.log('   • Survey admin: GET /api/admin/survey/test');
//   console.log('   • Survey system: GET /api/survey/test');
//   console.log('   • User admin: GET /api/admin/users/test');
//   console.log('   • Membership admin: GET /api/membership/admin/test');
//   console.log('   • API info: GET /api/');
//   console.log('   • Route discovery: GET /api/routes');
//   console.log('   • Health check: GET /api/health');
//   console.log('================================================================================\n');
// }

// export default router;






// // routes/index.js - COMPLETE ROUTE HUB WITH ALL ADMIN ROUTES
// // This is the main router that mounts ALL route systems

// import express from 'express';

// // ===============================================
// // IMPORT ALL ROUTE MODULES
// // ===============================================

// // Authentication routes
// import authRoutes from './authRoutes.js';

// // User routes
// import userRoutes from './userRoutes.js';
// import userAdminRoutes from './userAdminRoutes.js';  // ✅ ADD THIS

// // Content routes  
// import contentRoutes from './contentRoutes.js';

// // Membership routes
// import membershipRoutes from './membershipRoutes.js';
// import membershipAdminRoutes from './membershipAdminRoutes.js';  // ✅ ADD THIS

// const router = express.Router();

// // ===============================================
// // GLOBAL MIDDLEWARE
// // ===============================================

// // Add request metadata to all routes
// router.use((req, res, next) => {
//   req.requestTime = new Date().toISOString();
//   req.apiVersion = '3.1';
//   next();
// });

// // Add debugging middleware to see what routes are being hit
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

// // 2. User Routes (regular user management)
// console.log('🔗 Mounting user routes at /users...');
// try {
//   router.use('/users', userRoutes);
//   console.log('✅ User routes mounted');
// } catch (error) {
//   console.error('❌ Failed to mount user routes:', error.message);
// }

// // 3. User Admin Routes - ✅ CRITICAL FIX
// console.log('🔗 Mounting user admin routes at /admin/users...');
// try {
//   router.use('/admin/users', userAdminRoutes);
//   console.log('✅ User admin routes mounted');
// } catch (error) {
//   console.error('❌ Failed to mount user admin routes:', error.message);
//   console.warn('⚠️ Continuing without user admin routes...');
// }

// // 4. Content Routes
// console.log('🔗 Mounting content routes at /content...');
// try {
//   router.use('/content', contentRoutes);
//   console.log('✅ Content routes mounted');
// } catch (error) {
//   console.error('❌ Failed to mount content routes:', error.message);
// }

// // 5. Membership Routes (main membership functionality)
// console.log('🔗 Mounting membership routes at /membership...');
// try {
//   router.use('/membership', membershipRoutes);
//   console.log('✅ Membership routes mounted');
// } catch (error) {
//   console.error('❌ Failed to mount membership routes:', error.message);
// }

// // 6. Membership Admin Routes - ✅ CRITICAL FIX  
// console.log('🔗 Mounting membership admin routes at /membership/admin...');
// try {
//   router.use('/membership/admin', membershipAdminRoutes);
//   console.log('✅ Membership admin routes mounted');
//   console.log('   📊 Admin endpoints now available:');
//   console.log('   • GET /api/membership/admin/test');
//   console.log('   • GET /api/membership/admin/full-membership-stats');
//   console.log('   • GET /api/membership/admin/applications');
//   console.log('   • GET /api/membership/admin/analytics');
//   console.log('   • GET /api/membership/admin/stats');
//   console.log('   • GET /api/membership/admin/overview');
// } catch (error) {
//   console.error('❌ Failed to mount membership admin routes:', error.message);
//   console.warn('⚠️ Continuing without membership admin routes...');
// }

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

// router.use('/comments', (req, res, next) => {
//   console.log('🔄 Legacy /comments → /content/comments');
//   req.url = '/comments' + req.url;
//   contentRoutes(req, res, next);
// });

// // Legacy membership routes
// router.use('/apply', (req, res, next) => {
//   console.log('🔄 Legacy /apply → /membership/apply');
//   req.url = '/apply' + req.url;
//   membershipRoutes(req, res, next);
// });

// // ===============================================
// // API INFORMATION ROUTES
// // ===============================================

// // Main API info endpoint
// router.get('/', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Ikoota API v3.1 - COMPLETE SYSTEM WITH ALL ADMIN ROUTES',
//     version: '3.1.0',
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
//         status: '✅ MOUNTED',
//         description: 'User profiles, settings, status'
//       },
//       user_administration: {  // ✅ NEW
//         path: '/api/admin/users',
//         status: '✅ MOUNTED',
//         description: 'Admin user management, roles, permissions'
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
//       membership_administration: {  // ✅ NEW
//         path: '/api/membership/admin',
//         status: '✅ MOUNTED',
//         description: 'Admin membership management and analytics'
//       }
//     },
    
//     admin_endpoints: {  // ✅ NEW SECTION
//       user_admin: [
//         'GET /api/admin/users/test - Test user admin system',
//         'GET /api/admin/users - Get all users',
//         'GET /api/admin/users/search - Search users',
//         'GET /api/admin/users/stats - User statistics',
//         'POST /api/admin/users/create - Create user',
//         'PUT /api/admin/users/:id - Update user',
//         'PUT /api/admin/users/role - Update user role',
//         'POST /api/admin/users/ban - Ban user',
//         'POST /api/admin/users/unban - Unban user'
//       ],
//       membership_admin: [
//         'GET /api/membership/admin/test - Test membership admin system',
//         'GET /api/membership/admin/full-membership-stats - Get statistics',
//         'GET /api/membership/admin/applications - Get applications',
//         'GET /api/membership/admin/analytics - Get analytics',
//         'GET /api/membership/admin/stats - Get application stats',
//         'GET /api/membership/admin/overview - Get overview',
//         'GET /api/membership/admin/health - Health check'
//       ]
//     },
    
//     quick_tests: {
//       user_admin: 'GET /api/admin/users/test',
//       membership_admin: 'GET /api/membership/admin/test',
//       user_profile: 'GET /api/users/profile',
//       membership_status: 'GET /api/membership/status',
//       content_chats: 'GET /api/content/chats'
//     },
    
//     legacy_compatibility: {
//       content: 'Old /chats, /teachings routes redirect to /content/*',
//       membership: 'Old /apply routes redirect to /membership/*'
//     }
//   });
// });

// // Health check for the router
// router.get('/health', async (req, res) => {
//   try {
//     const routeCount = {
//       auth: 'mounted',
//       users: 'mounted', 
//       user_admin: 'mounted',  // ✅ NEW
//       content: 'mounted',
//       membership: 'mounted',
//       membership_admin: 'mounted'  // ✅ NEW
//     };
    
//     res.json({
//       success: true,
//       message: 'All route systems healthy',
//       systems: routeCount,
//       total_systems: Object.keys(routeCount).length,
//       admin_systems: ['user_admin', 'membership_admin'],  // ✅ NEW
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

// // Route discovery endpoint
// router.get('/routes', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Route Discovery - COMPLETE SYSTEM',
//     version: '3.1.0',
    
//     all_routes: {
//       authentication: {
//         base: '/api/auth',
//         status: 'operational',
//         endpoints: ['POST /login', 'POST /register', 'POST /logout']
//       },
//       user_management: {
//         base: '/api/users',
//         status: 'operational',
//         endpoints: ['GET /profile', 'PUT /profile', 'GET /dashboard']
//       },
//       user_administration: {  // ✅ NEW
//         base: '/api/admin/users',
//         status: 'operational',
//         note: 'Requires admin role',
//         endpoints: ['GET /test', 'GET /', 'GET /search', 'POST /create']
//       },
//       content_management: {
//         base: '/api/content',
//         status: 'operational',
//         endpoints: ['GET /chats', 'POST /chats', 'GET /teachings']
//       },
//       membership_management: {
//         base: '/api/membership',
//         status: 'operational',
//         endpoints: ['GET /status', 'GET /dashboard', 'POST /apply/initial']
//       },
//       membership_administration: {  // ✅ NEW
//         base: '/api/membership/admin',
//         status: 'operational',
//         note: 'Requires admin role',
//         endpoints: ['GET /test', 'GET /stats', 'GET /applications']
//       }
//     },
    
//     admin_test_urls: {  // ✅ NEW
//       user_admin: 'http://localhost:3000/api/admin/users/test',
//       membership_admin: 'http://localhost:3000/api/membership/admin/test'
//     },
    
//     timestamp: new Date().toISOString()
//   });
// });

// // ===============================================
// // TEST ROUTES FOR DEBUGGING
// // ===============================================

// // Test route to verify the main router is working
// router.get('/test-main-router', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Main router (routes/index.js) is working!',
//     timestamp: new Date().toISOString(),
//     mounted_systems: [
//       'auth ✅',
//       'users ✅', 
//       'admin/users ✅',  // ✅ NEW
//       'content ✅',
//       'membership ✅',
//       'membership/admin ✅'  // ✅ NEW
//     ]
//   });
// });

// // ===============================================
// // ERROR HANDLING
// // ===============================================

// // 404 handler for routes
// router.use('*', (req, res) => {
//   console.log(`❌ Route not found in main router: ${req.method} ${req.originalUrl}`);
  
//   const path = req.originalUrl.toLowerCase();
//   const suggestions = [];
  
//   // Smart suggestions based on the requested path
//   if (path.includes('admin') && path.includes('user')) {
//     suggestions.push('/api/admin/users/test', '/api/admin/users/stats');
//   } else if (path.includes('admin') && path.includes('membership')) {
//     suggestions.push('/api/membership/admin/test', '/api/membership/admin/stats');
//   } else if (path.includes('user')) {
//     suggestions.push('/api/users/profile', '/api/users/dashboard');
//   } else if (path.includes('membership')) {
//     suggestions.push('/api/membership/status', '/api/membership/dashboard');
//   } else if (path.includes('content')) {
//     suggestions.push('/api/content/chats', '/api/content/teachings');
//   } else if (path.includes('auth')) {
//     suggestions.push('/api/auth/login', '/api/auth/register');
//   }
  
//   res.status(404).json({
//     success: false,
//     message: 'API endpoint not found in main router',
//     path: req.originalUrl,
//     method: req.method,
//     suggestions: suggestions.length > 0 ? suggestions : [
//       '/api/ - API info',
//       '/api/health - Health check',
//       '/api/routes - Route discovery',
//       '/api/admin/users/test - User admin test',  // ✅ NEW
//       '/api/membership/admin/test - Membership admin test',  // ✅ NEW
//       '/api/users/profile - User profile',
//       '/api/membership/status - Membership status'
//     ],
    
//     available_systems: {
//       auth: '/api/auth/*',
//       users: '/api/users/*',
//       user_admin: '/api/admin/users/*',  // ✅ NEW
//       content: '/api/content/*',
//       membership: '/api/membership/*',
//       membership_admin: '/api/membership/admin/*'  // ✅ NEW
//     },
    
//     admin_systems: {  // ✅ NEW
//       user_administration: '/api/admin/users/* (requires admin role)',
//       membership_administration: '/api/membership/admin/* (requires admin role)'
//     },
    
//     timestamp: new Date().toISOString()
//   });
// });

// // ===============================================
// // STARTUP LOGGING
// // ===============================================

// if (process.env.NODE_ENV === 'development') {
//   console.log('\n🚀 MAIN ROUTER (routes/index.js) - ALL SYSTEMS MOUNTED');
//   console.log('================================================================================');
//   console.log('✅ ROUTE SYSTEMS MOUNTED:');
//   console.log('   📁 Authentication: /auth');
//   console.log('   👤 Users: /users');
//   console.log('   🔧 User Admin: /admin/users');  // ✅ NEW
//   console.log('   📚 Content: /content');
//   console.log('   👥 Membership: /membership');
//   console.log('   🔐 Membership Admin: /membership/admin');  // ✅ NEW
//   console.log('');
//   console.log('🎯 ADMIN SYSTEMS READY:');
//   console.log('   • User Administration: /api/admin/users/*');
//   console.log('   • Membership Administration: /api/membership/admin/*');
//   console.log('');
//   console.log('🧪 QUICK TESTS:');
//   console.log('   • Main Router: /api/test-main-router');
//   console.log('   • User Admin: /api/admin/users/test');
//   console.log('   • Membership Admin: /api/membership/admin/test');
//   console.log('================================================================================\n');
// }

// export default router;








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







