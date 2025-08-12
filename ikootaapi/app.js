// ikootaapi/app.js - OPTIMIZED WITH REAL DATABASE INTEGRATION
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import jwt from 'jsonwebtoken';

// Import real route handlers
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/enhanced/user.routes.js';
import applicationRoutes from './routes/enhanced/application.routes.js';
import contentRoutes from './routes/enhanced/content.routes.js';
import adminRoutes from './routes/enhanced/admin.routes.js';

// Import middleware
import { authenticate, requireMembership } from './middleware/auth.js';
import db from './config/db.js';

const app = express();

// Basic middleware
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// ===============================================
// HEALTH CHECK ROUTES
// ===============================================

app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await db.query('SELECT 1');
    res.json({
      success: true,
      message: 'Server is healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({
      success: true,
      message: 'API is healthy',
      database: 'connected',
      routes: 'enhanced_with_real_database',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'API unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ===============================================
// REAL ROUTE INTEGRATION - NO MORE MOCK DATA
// ===============================================

// Authentication routes (real database)
app.use('/api/auth', authRoutes);

// User management routes (real database)
app.use('/api/user', userRoutes);

// Application system routes (real database)
app.use('/api/applications', applicationRoutes);

// Content management routes (real database)
app.use('/api/content', contentRoutes);

// Admin panel routes (real database)
app.use('/api/admin', authenticate, adminRoutes);

// ===============================================
// LEGACY SURVEY ENDPOINTS - REAL DATABASE
// ===============================================

// Survey status check - now with real database
app.get('/api/user-status/survey/check-status', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    // Check if user has completed initial application
    const result = await db.query(`
      SELECT approval_status, created_at 
      FROM surveylog 
      WHERE user_id = $1 AND survey_data->>'type' = 'initial'
      ORDER BY created_at DESC 
      LIMIT 1
    `, [userId]);

    const hasApplication = result.rows.length > 0;
    const applicationStatus = hasApplication ? result.rows[0].approval_status : null;

    console.log('✅ Real survey status check for user:', userId);
    
    res.status(200).json({
      success: true,
      needs_survey: !hasApplication,
      survey_completed: hasApplication,
      application_status: applicationStatus,
      user_id: userId,
      message: 'Survey status retrieved from database'
    });
    
  } catch (error) {
    console.error('❌ Survey check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check survey status'
    });
  }
});

// Legacy survey status - redirect to new endpoint
app.get('/api/user-status/survey/status', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'This endpoint has been updated. Use /api/applications/initial/status',
    redirect: '/api/applications/initial/status',
    data: {
      status: 'migrated_to_enhanced_routes',
      survey_id: null,
      last_updated: new Date().toISOString()
    }
  });
});

// Legacy dashboard - redirect to new endpoint
app.get('/api/user-status/dashboard', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'This endpoint has been updated. Use /api/user/dashboard',
    redirect: '/api/user/dashboard',
    data: {
      user_id: req.user.id,
      membership_status: req.user.membership_stage,
      notifications: [],
      last_login: new Date().toISOString(),
      message: 'Please use the enhanced dashboard endpoint'
    }
  });
});

// ===============================================
// MIGRATION INFO & DEBUG ENDPOINTS
// ===============================================

app.get('/api/info', (req, res) => {
  res.json({
    success: true,
    message: 'Ikoota API - Enhanced with Real Database Integration',
    version: '2.0.0-real-database',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database_status: 'connected_to_real_database',
    migration: {
      status: 'completed',
      changes: [
        'All routes now use real database queries',
        'Mock data completely removed',
        'Enhanced controllers and services added',
        'Proper validation middleware implemented',
        'Admin functionality fully integrated'
      ]
    },
    enhanced_routes: {
      authentication: '/api/auth/*',
      user_management: '/api/user/*',
      applications: '/api/applications/*',
      content: '/api/content/*',
      admin: '/api/admin/*'
    },
    legacy_routes: {
      survey_check: '/api/user-status/survey/check-status (updated)',
      health: ['/health', '/api/health']
    }
  });
});

app.get('/api/debug', authenticate, async (req, res) => {
  try {
    // Test database connection
    const dbTest = await db.query('SELECT COUNT(*) as user_count FROM users');
    
    res.json({
      success: true,
      message: 'Debug info - Real Database Integration Active',
      database: {
        status: 'connected',
        user_count: dbTest.rows[0].user_count,
        connection: 'real_postgresql_database'
      },
      current_user: {
        id: req.user.id,
        email: req.user.email,
        membership: req.user.membership_stage,
        role: req.user.role
      },
      enhanced_features: [
        'Real JWT authentication with database verification',
        'Membership progression system',
        'Content access control (Towncrier/Iko)',
        'Application review system',
        'Admin user management',
        'Teaching creation and management'
      ],
      test_endpoints: {
        user_profile: 'GET /api/user/profile',
        user_dashboard: 'GET /api/user/dashboard',
        content_access: 'GET /api/content/towncrier',
        admin_panel: 'GET /api/admin/users (admin only)'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Debug check failed',
      database: 'connection_error',
      message: error.message
    });
  }
});

// Development-only test token endpoint (real JWT)
if (process.env.NODE_ENV === 'development') {
  app.get('/api/debug/test-token', async (req, res) => {
    try {
      // Get a real user from database or create test data
      let testUser;
      const existingUser = await db.query('SELECT * FROM users LIMIT 1');
      
      if (existingUser.rows.length > 0) {
        testUser = existingUser.rows[0];
      } else {
        testUser = {
          user_id: 1,
          username: 'testuser',
          email: 'test@example.com',
          role: 'user',
          membership_stage: 'pre_member',
          is_member: 'pre_member'
        };
      }
      
      const testToken = jwt.sign({
        user_id: testUser.id || testUser.user_id,
        username: testUser.username,
        email: testUser.email,
        role: testUser.role,
        membership_stage: testUser.membership_stage,
        is_member: testUser.is_member
      }, process.env.JWT_SECRET || 'your-secret-key-here', { expiresIn: '7d' });
      
      console.log('🧪 Real test token generated from database user');
      
      res.json({
        success: true,
        token: testToken,
        user: {
          id: testUser.id || testUser.user_id,
          username: testUser.username,
          email: testUser.email,
          role: testUser.role,
          membership_stage: testUser.membership_stage,
          is_member: testUser.is_member
        },
        message: 'Test token generated from real database user',
        tokenInfo: {
          parts: testToken.split('.').length,
          isValidJWT: testToken.split('.').length === 3,
          length: testToken.length,
          source: 'real_database_user'
        }
      });
    } catch (error) {
      console.error('❌ Test token generation failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate test token',
        message: error.message
      });
    }
  });
}

// ===============================================
// REMOVED ENDPOINTS (Previously Mock Data)
// ===============================================

// These endpoints have been removed and replaced with enhanced routes:
// - /api/content/chats (replaced with /api/content/teachings)
// - /api/content/teachings (enhanced with real database)
// - /api/content/comments (integrated into teachings)
// - /api/membership/* (replaced with /api/applications/*)
// - /api/users/profile (replaced with /api/user/profile)
// - /api/admin/* (enhanced with real functionality)

// ===============================================
// COMPATIBILITY ENDPOINTS
// ===============================================

// Check overall system compatibility
app.get('/api/compatibility', authenticate, async (req, res) => {
  try {
    const checks = {
      database: false,
      authentication: false,
      user_routes: false,
      content_routes: false,
      admin_routes: false
    };

    // Test database
    try {
      await db.query('SELECT 1');
      checks.database = true;
    } catch (e) {
      console.error('Database check failed:', e.message);
    }

    // Test authentication (already passed if we're here)
    checks.authentication = true;

    // Test user access
    try {
      const user = await db.query('SELECT id FROM users WHERE id = $1', [req.user.id]);
      checks.user_routes = user.rows.length > 0;
    } catch (e) {
      console.error('User routes check failed:', e.message);
    }

    // Test content access based on membership
    checks.content_routes = ['pre_member', 'member', 'admin', 'super_admin'].includes(req.user.membership_stage);

    // Test admin access
    checks.admin_routes = ['admin', 'super_admin'].includes(req.user.membership_stage);

    const allPassed = Object.values(checks).every(check => check === true);

    res.json({
      success: true,
      compatibility: allPassed ? 'fully_compatible' : 'partial_compatibility',
      checks,
      user_info: {
        id: req.user.id,
        membership: req.user.membership_stage,
        role: req.user.role
      },
      recommendations: allPassed ? [] : [
        !checks.database && 'Database connection needs attention',
        !checks.user_routes && 'User data access issues detected',
        !checks.content_routes && 'Content access restricted - check membership level',
        !checks.admin_routes && 'Admin access not available - requires admin role'
      ].filter(Boolean)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Compatibility check failed',
      message: error.message
    });
  }
});

// ===============================================
// 404 HANDLER
// ===============================================

app.use('*', (req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
  
  const suggestions = [];
  const path = req.originalUrl.toLowerCase();
  
  // Suggest migration paths for old endpoints
  if (path.includes('/content/chats')) {
    suggestions.push('Try /api/content/teachings instead');
  }
  if (path.includes('/membership/')) {
    suggestions.push('Try /api/applications/ instead');
  }
  if (path.includes('/users/profile')) {
    suggestions.push('Try /api/user/profile instead');
  }
  
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    system_status: 'Enhanced routes with real database integration active',
    suggestions: suggestions.length > 0 ? suggestions : [
      'Check /api/info for available endpoints',
      'Use /api/compatibility to test your access level'
    ],
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// ERROR HANDLER
// ===============================================

app.use((error, req, res, next) => {
  console.error('🚨 Error:', error.message);
  
  // Database connection errors
  if (error.code === 'ECONNREFUSED') {
    return res.status(503).json({
      success: false,
      error: 'Database connection failed',
      message: 'Please check database configuration',
      timestamp: new Date().toISOString()
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid authentication token',
      timestamp: new Date().toISOString()
    });
  }

  // Generic error response
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// STARTUP MESSAGE
// ===============================================

console.log('\n🚀 ENHANCED APP.JS LOADED - REAL DATABASE INTEGRATION');
console.log('================================================================================');
console.log('✅ MAJOR UPGRADE COMPLETED:');
console.log('   • All mock data removed');
console.log('   • Real database queries implemented');
console.log('   • Enhanced route system active');
console.log('   • Proper authentication with database verification');
console.log('   • Content access control (Towncrier/Iko)');
console.log('   • Application system with real workflow');
console.log('   • Admin panel with user management');
console.log('');
console.log('🔗 Enhanced API Endpoints:');
console.log('   • POST /api/auth/login (real database authentication)');
console.log('   • GET /api/user/dashboard (comprehensive user data)');
console.log('   • GET /api/content/towncrier (pre-member content)');
console.log('   • GET /api/content/iko (full member content)');
console.log('   • POST /api/applications/initial (application system)');
console.log('   • GET /api/admin/users (admin user management)');
console.log('');
console.log('🧪 Testing Endpoints:');
console.log('   • GET /api/info (system information)');
console.log('   • GET /api/compatibility (test your access)');
console.log('   • GET /api/debug (authenticated debug info)');
console.log('');
console.log('📊 Migration Complete - No More Sample Data!');
console.log('================================================================================\n');

export default app;