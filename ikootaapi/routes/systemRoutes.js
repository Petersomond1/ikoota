// ikootaapi/routes/systemRoutes.js
// SYSTEM HEALTH & METRICS ROUTES
// Health checks, API information, testing, and performance monitoring

import express from 'express';
import { authenticate } from '../middleware/auth.js';

// Import system controllers
import {
  healthCheck,
  getSystemStatus,
  getPerformanceMetrics,
  getDatabaseHealth,
  getAPIInformation,
  testConnectivity,
  getAdminSettings,
  updateAdminSettings,
  testEmailConfiguration,
  getSettingsHistory
} from '../controllers/systemControllers.js';

import db from '../config/db.js';

const router = express.Router();

// ===============================================
// MAIN SYSTEM ENDPOINTS
// ===============================================

// GET /health - System health check
router.get('/health', async (req, res) => {
  try {
    // Quick database test
    await db.query('SELECT 1');
    
    res.json({
      success: true,
      message: 'API is healthy',
      status: 'operational',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB',
        heap: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
      },
      database: 'connected',
      version: '3.0.0'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'API is unhealthy',
      status: 'degraded',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /info - Comprehensive API information
router.get('/info', (req, res) => {
  res.json({
    success: true,
    message: 'Ikoota API - Reorganized Architecture v3.0.0',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    
    architecture: {
      description: 'Functionally grouped routes with enhanced maintainability',
      version: '3.0.0',
      principles: [
        'Domain-driven route organization',
        'Clear admin/user separation', 
        'Service layer architecture',
        'Zero functionality loss',
        'Enhanced security and monitoring'
      ]
    },
    
    routeStructure: {
      core: {
        authentication: '/api/auth/* - Login, registration, password reset',
        system: '/api/health, /api/info, /api/metrics - System monitoring'
      },
      userManagement: {
        profile: '/api/users/* - Profile, settings, preferences',
        status: '/api/user/userstatus/* - Dashboard, status checks',
        admin: '/api/users/admin/* - Admin user management'
      },
      membershipSystem: {
        applications: '/api/membership/* - Applications, status, workflow',
        admin: '/api/membership/admin/* - Application reviews, analytics'
      },
      contentSystem: {
        unified: '/api/content/* - Chats, teachings, comments unified',
        breakdown: {
          chats: '/api/content/chats/*',
          teachings: '/api/content/teachings/*',
          comments: '/api/content/comments/*',
          admin: '/api/content/admin/*'
        }
      },
      surveySystem: {
        submissions: '/api/survey/* - Survey submissions, questions',
        admin: '/api/survey/admin/* - Question management, approval'
      },
      classSystem: {
        enrollment: '/api/classes/* - Class enrollment, content access',
        admin: '/api/classes/admin/* - Class creation, management'
      },
      identitySystem: {
        management: '/api/identity/* - Converse/mentor ID operations',
        admin: '/api/admin/identity/* - Identity administration'
      },
      communication: '/api/communication/* - Email, SMS, notifications, future video/audio'
    },
    
    features: {
      security: [
        'Enhanced rate limiting (auth: 20, admin: 50, general: 100 per 15min)',
        'Admin route isolation with special logging',
        'Comprehensive error handling and categorization',
        'JWT-based authentication with role-based access'
      ],
      performance: [
        'Response compression enabled',
        'Request caching for expensive operations',
        'Database connection pooling',
        'Memory usage monitoring'
      ],
      monitoring: [
        'Enhanced request/response logging',
        'Admin operation tracking',
        'Performance metrics collection',
        'Database health monitoring'
      ],
      compatibility: [
        'Zero-downtime migration support',
        'Legacy route preservation',
        'Gradual migration capability',
        'Frontend compatibility maintained'
      ]
    },
    
    improvements: {
      organization: [
        'Reduced route files from 15+ to 13 focused modules',
        'Clear separation of admin and user operations',
        'Unified content management structure',
        'Consistent naming conventions'
      ],
      functionality: [
        'Added missing ID generation endpoints',
        'Enhanced notification system',
        'Improved error handling and responses',
        'Better request validation and sanitization'
      ]
    }
  });
});

// GET /metrics - Performance metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = {
      success: true,
      message: 'System performance metrics',
      timestamp: new Date().toISOString(),
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version
      },
      database: {
        status: 'connected'
      }
    };
    
    // Test database performance
    const start = Date.now();
    await db.query('SELECT 1');
    const dbResponseTime = Date.now() - start;
    
    metrics.database.responseTime = `${dbResponseTime}ms`;
    metrics.database.performance = dbResponseTime < 100 ? 'excellent' : dbResponseTime < 500 ? 'good' : 'slow';
    
    res.json(metrics);
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'Failed to collect metrics',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /routes - Route discovery
router.get('/routes', (req, res) => {
  res.json({
    success: true,
    message: 'API Route Discovery - Reorganized Architecture',
    totalModules: 13,
    organizationPattern: 'Domain-driven with admin separation',
    
    routeModules: {
      core: [
        'systemRoutes.js - Health, metrics, testing',
        'authRoutes.js - Authentication only'
      ],
      userManagement: [
        'userRoutes.js - Profile, settings, preferences',
        'userStatusRoutes.js - Dashboard, status checks',
        'userAdminRoutes.js - Admin user management'
      ],
      membershipSystem: [
        'membershipRoutes.js - Applications, status workflow',
        'membershipAdminRoutes.js - Admin reviews, analytics'
      ],
      surveySystem: [
        'surveyRoutes.js - Submissions, questions',
        'surveyAdminRoutes.js - Admin survey management'
      ],
      contentSystem: [
        'contentRoutes.js - Unified chats, teachings, comments'
      ],
      classSystem: [
        'classRoutes.js - Enrollment, content access',
        'classAdminRoutes.js - Admin class management'
      ],
      identitySystem: [
        'userRoutes.js - Includes merged identity operations',
        'userAdminRoutes.js - Includes merged identity admin control'
      ],
      communication: [
        'communicationRoutes.js - Email, SMS, notifications, future video/audio'
      ]
    },
    
    adminSeparation: {
      pattern: 'All admin routes use /api/admin/ prefix',
      security: 'Enhanced rate limiting and logging',
      modules: [
        '/api/users/admin/*',
        '/api/membership/admin/*',
        '/api/survey/admin/*', 
        '/api/classes/admin/*',
        '/api/admin/identity/*'
      ]
    },
    
    backwardCompatibility: {
      enabled: true,
      legacyMappings: [
        '/api/chats → /api/content/chats',
        '/api/teachings → /api/content/teachings',
        '/api/comments → /api/content/comments',
        '/api/messages → /api/content/teachings'
      ]
    },
    
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// TESTING ENDPOINTS
// ===============================================

// GET /test - Simple connectivity test
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'API connectivity test passed',
    timestamp: new Date().toISOString(),
    server: 'operational',
    endpoint: '/api/test'
  });
});

// GET /test/auth - Authentication test
router.get('/test/auth', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Authentication test passed',
    timestamp: new Date().toISOString(),
    user: {
      id: req.user?.id,
      username: req.user?.username,
      role: req.user?.role
    },
    endpoint: '/api/test/auth'
  });
});

// GET /test/database - Database connectivity test
router.get('/test/database', async (req, res) => {
  try {
    const start = Date.now();
    const [result] = await db.query('SELECT 1 as test, NOW() as current_time');
    const responseTime = Date.now() - start;
    
    res.json({
      success: true,
      message: 'Database connectivity test passed',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        responseTime: `${responseTime}ms`,
        performance: responseTime < 100 ? 'excellent' : responseTime < 500 ? 'good' : 'slow',
        result: result[0]
      },
      endpoint: '/api/test/database'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Database connectivity test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ===============================================
// ADMIN SETTINGS ENDPOINTS
// ===============================================

// GET /admin/settings - Get admin settings (Admin only)
router.get('/admin/settings', authenticate, getAdminSettings);

// PUT /admin/settings - Update admin settings (Admin only)
router.put('/admin/settings', authenticate, updateAdminSettings);

// POST /admin/settings/test-email - Test email configuration (Admin only)
router.post('/admin/settings/test-email', authenticate, testEmailConfiguration);

// GET /admin/settings/history - Get settings history (Admin only)
router.get('/admin/settings/history', authenticate, getSettingsHistory);

// ===============================================
// DEVELOPMENT ENDPOINTS
// ===============================================

if (process.env.NODE_ENV === 'development') {
  // GET /debug/environment - Environment information
  router.get('/debug/environment', (req, res) => {
    res.json({
      success: true,
      message: 'Environment debug information',
      environment: {
        nodeEnv: process.env.NODE_ENV,
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
        uptime: process.uptime(),
        cwd: process.cwd(),
        pid: process.pid
      },
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    });
  });
  
  // GET /debug/routes-detailed - Detailed route information
  router.get('/debug/routes-detailed', (req, res) => {
    res.json({
      success: true,
      message: 'Detailed route information for debugging',
      architecture: 'v3.0.0 - Reorganized',
      implementationStatus: {
        phase1: '✅ Core infrastructure (app.js, server.js, index.js)',
        phase2: '✅ Route reorganization (13 modules)',
        phase3: '⏳ Controller consolidation',
        phase4: '⏳ Service layer implementation'
      },
      routeFiles: {
        completed: [
          'systemRoutes.js',
          'authRoutes.js',
          'userRoutes.js',
          'userStatusRoutes.js',
          'userAdminRoutes.js',
          'membershipRoutes.js',
          'membershipAdminRoutes.js',
          'surveyRoutes.js',
          'surveyAdminRoutes.js',
          'contentRoutes.js',
          'classRoutes.js',
          'classAdminRoutes.js',
          'userRoutes.js (includes merged identity)',
          'userAdminRoutes.js (includes merged identity admin)',
          'communicationRoutes.js'
        ],
        nextPhase: 'Controller and service reorganization'
      },
      timestamp: new Date().toISOString()
    });
  });
}

// ===============================================
// ERROR HANDLING
// ===============================================

// System routes 404 handler
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'System route not found',
    path: req.originalUrl,
    method: req.method,
    availableRoutes: {
      main: [
        'GET /health - System health check',
        'GET /info - Comprehensive API information',
        'GET /metrics - Performance metrics',
        'GET /routes - Route discovery'
      ],
      testing: [
        'GET /test - Simple connectivity test',
        'GET /test/auth - Authentication test',
        'GET /test/database - Database connectivity test'
      ],
      admin: [
        'GET /admin/settings - Get admin settings (Admin only)',
        'PUT /admin/settings - Update admin settings (Admin only)',
        'POST /admin/settings/test-email - Test email configuration (Admin only)',
        'GET /admin/settings/history - Get settings history (Admin only)'
      ],
      debug: process.env.NODE_ENV === 'development' ? [
        'GET /debug/environment - Environment information',
        'GET /debug/routes-detailed - Detailed route information'
      ] : 'Available in development mode only'
    },
    timestamp: new Date().toISOString()
  });
});

// System routes error handler
router.use((error, req, res, next) => {
  console.error('❌ System route error:', {
    error: error.message,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'System operation error',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

if (process.env.NODE_ENV === 'development') {
  console.log('🔧 System routes loaded: health checks, metrics, API information, testing, admin settings');
  console.log('🔐 Admin settings routes:');
  console.log('   • GET /admin/settings - Get admin settings');
  console.log('   • PUT /admin/settings - Update admin settings');
  console.log('   • POST /admin/settings/test-email - Test email config');
  console.log('   • GET /admin/settings/history - Settings history');
}

export default router;


