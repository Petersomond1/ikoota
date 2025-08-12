// ikootaapi/app.js
// ✅ CRITICAL FIX - Replace the sample token with a real JWT

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import jwt from 'jsonwebtoken'; // ✅ JWT import (already added)

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

// ========================================================================
// ✅ AUTHENTICATION MIDDLEWARE (Already Added)
// ========================================================================

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded.user_id) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token: missing user ID'
      });
    }

    req.user = {
      id: decoded.user_id,
      email: decoded.email,
      username: decoded.username,
      role: decoded.role,
      membership_stage: decoded.membership_stage,
      is_member: decoded.is_member
    };
    
    console.log('✅ User authenticated:', {
      id: req.user.id,
      email: req.user.email
    });
    
    next();
  } catch (error) {
    console.error('❌ Authentication error:', error.message);
    res.status(401).json({ 
      success: false,
      error: error.message.includes('malformed') ? 'Invalid token format' : 'Authentication failed'
    });
  }
};

// ===============================================
// HEALTH CHECK ROUTES
// ===============================================

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// ✅ FIXED AUTHENTICATION ROUTES - Return Real JWT
// ===============================================

app.post('/api/auth/login', (req, res) => {
  try {
    console.log('🔍 Login attempt:', req.body);
    
    // Create a real user object (this would normally come from your database)
    const userData = {
      user_id: 1,
      username: 'testuser',
      email: req.body.email || 'test@example.com',
      role: 'user',
      membership_stage: 'pre_member',
      is_member: 'pre_member'
    };
    
    // ✅ CRITICAL FIX: Generate a REAL JWT token
    const realJwtToken = jwt.sign(
      userData, 
      process.env.JWT_SECRET || 'your-secret-key-here', // Use fallback for development
      { expiresIn: '7d' }
    );
    
    console.log('✅ Generated real JWT token for user:', userData.email);
    console.log('🔍 Token parts:', realJwtToken.split('.').length);
    
    res.json({
      success: true,
      message: 'Login successful',
      token: realJwtToken, // ✅ FIXED: Real JWT instead of 'sample_jwt_token'
      user: {
        id: userData.user_id,
        username: userData.username,
        email: userData.email,
        role: userData.role,
        membership_stage: userData.membership_stage,
        is_member: userData.is_member
      }
    });
    
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: error.message
    });
  }
});

app.post('/api/auth/register', (req, res) => {
  res.json({
    success: true,
    message: 'Registration successful',
    user: {
      id: Date.now(),
      ...req.body,
      created_at: new Date().toISOString()
    }
  });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// ===============================================
// USER STATUS ROUTES
// ===============================================

app.get('/api/user-status/survey/status', (req, res) => {
  res.json({
    success: true,
    message: 'Survey status endpoint',
    data: {
      status: 'not_started',
      survey_id: null,
      last_updated: new Date().toISOString()
    }
  });
});

app.get('/api/user-status/dashboard', (req, res) => {
  res.json({
    success: true,
    message: 'User dashboard data',
    data: {
      user_id: 1,
      membership_status: 'pending',
      notifications: [],
      last_login: new Date().toISOString()
    }
  });
});

// ✅ The authentication endpoint we added
app.get('/api/user-status/survey/check-status', authenticate, (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    console.log('✅ Survey status check for user:', userId);
    
    res.status(200).json({
      success: true,
      needs_survey: false,
      survey_completed: true,
      user_id: userId,
      message: 'Survey status retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Survey check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check survey status'
    });
  }
});

// ===============================================
// ✅ ENHANCED TEST TOKEN ENDPOINT
// ===============================================

if (process.env.NODE_ENV === 'development') {
  app.get('/api/debug/test-token', (req, res) => {
    try {
      const testUser = {
        user_id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        membership_stage: 'pre_member',
        is_member: 'pre_member'
      };
      
      const testToken = jwt.sign(
        testUser, 
        process.env.JWT_SECRET || 'your-secret-key-here', 
        { expiresIn: '7d' }
      );
      
      console.log('🧪 Test token generated');
      console.log('🔍 Token parts:', testToken.split('.').length);
      
      res.json({
        success: true,
        token: testToken,
        user: testUser,
        message: 'Test token generated for debugging',
        tokenInfo: {
          parts: testToken.split('.').length,
          isValidJWT: testToken.split('.').length === 3,
          length: testToken.length
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
// MEMBERSHIP ROUTES
// ===============================================

app.get('/api/membership/status/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    success: true,
    message: 'Membership status',
    data: {
      user_id: id,
      status: 'pending',
      application_date: '2025-01-01',
      last_updated: new Date().toISOString()
    }
  });
});

app.get('/api/membership/applications', (req, res) => {
  res.json({
    success: true,
    message: 'Membership applications',
    data: []
  });
});

// ===============================================
// CONTENT ROUTES
// ===============================================

app.get('/api/content/chats', (req, res) => {
  res.json({
    success: true,
    message: 'Chats data',
    data: [
      {
        id: 1,
        title: 'Sample Chat',
        content: 'This is a sample chat message',
        created_at: new Date().toISOString()
      }
    ]
  });
});

app.get('/api/content/teachings', (req, res) => {
  res.json({
    success: true,
    message: 'Teachings data',
    data: [
      {
        id: 1,
        title: 'Sample Teaching',
        content: 'This is a sample teaching content',
        created_at: new Date().toISOString()
      }
    ]
  });
});

app.get('/api/content/comments', (req, res) => {
  res.json({
    success: true,
    message: 'Comments data',
    data: []
  });
});

app.get('/api/content/comments/all', (req, res) => {
  res.json({
    success: true,
    message: 'All comments',
    data: [
      {
        id: 1,
        content: 'Sample comment',
        author: 'User',
        created_at: new Date().toISOString()
      }
    ]
  });
});

app.get('/api/content/comments/parent-comments', (req, res) => {
  const { user_id } = req.query;
  res.json({
    success: true,
    message: 'Parent comments',
    data: [
      {
        id: 1,
        content: 'Sample parent comment',
        author: 'User',
        user_id: user_id || '1',
        replies: [],
        created_at: new Date().toISOString()
      }
    ]
  });
});

app.get('/api/content/chats/combinedcontent', (req, res) => {
  res.json({
    success: true,
    message: 'Combined chat content',
    data: {
      chats: [
        {
          id: 1,
          title: 'Sample Chat',
          content: 'Combined chat content',
          created_at: new Date().toISOString()
        }
      ],
      comments: [
        {
          id: 1,
          content: 'Chat comment',
          created_at: new Date().toISOString()
        }
      ]
    }
  });
});

app.post('/api/content/chats', (req, res) => {
  res.json({
    success: true,
    message: 'Chat created',
    data: {
      id: Date.now(),
      ...req.body,
      created_at: new Date().toISOString()
    }
  });
});

app.post('/api/content/teachings', (req, res) => {
  res.json({
    success: true,
    message: 'Teaching created',
    data: {
      id: Date.now(),
      ...req.body,
      created_at: new Date().toISOString()
    }
  });
});

// ===============================================
// USER ROUTES
// ===============================================

app.get('/api/users/profile', (req, res) => {
  res.json({
    success: true,
    message: 'User profile',
    data: {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      created_at: '2025-01-01'
    }
  });
});

app.put('/api/users/profile', (req, res) => {
  res.json({
    success: true,
    message: 'Profile updated',
    data: {
      ...req.body,
      updated_at: new Date().toISOString()
    }
  });
});

// ===============================================
// ADMIN ROUTES
// ===============================================

app.get('/api/admin/users', (req, res) => {
  res.json({
    success: true,
    message: 'Admin users list',
    data: []
  });
});

app.get('/api/admin/membership/applications', (req, res) => {
  res.json({
    success: true,
    message: 'Admin membership applications',
    data: []
  });
});

// ===============================================
// DEBUG & INFO ROUTES
// ===============================================

app.get('/api/info', (req, res) => {
  res.json({
    success: true,
    message: 'Ikoota API - Fixed JWT Token Issue',
    version: '1.0.0-jwt-fixed',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    jwtFix: 'Now returns real JWT tokens instead of sample strings',
    routes: {
      health: ['/health', '/api/health'],
      auth: ['/api/auth/login', '/api/auth/register', '/api/auth/logout'],
      userStatus: ['/api/user-status/survey/status', '/api/user-status/survey/check-status'],
      debug: ['/api/debug/test-token']
    }
  });
});

app.get('/api/debug', (req, res) => {
  res.json({
    success: true,
    message: 'Debug info - JWT Token Fix Applied',
    jwtTokenFix: 'Login endpoint now returns real JWT tokens',
    testEndpoint: '/api/debug/test-token',
    authEndpoint: '/api/user-status/survey/check-status',
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// 404 HANDLER
// ===============================================

app.use('*', (req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
  
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    fix: 'JWT Token issue has been resolved',
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// ERROR HANDLER
// ===============================================

app.use((error, req, res, next) => {
  console.error('🚨 Error:', error.message);
  res.status(500).json({
    success: false,
    error: error.message,
    timestamp: new Date().toISOString()
  });
});

console.log('\n🚀 APP.JS LOADED WITH JWT TOKEN FIX');
console.log('================================================================================');
console.log('✅ CRITICAL FIX APPLIED: Login now returns REAL JWT tokens');
console.log('✅ Authentication endpoint: /api/user-status/survey/check-status');
console.log('✅ Test token endpoint: /api/debug/test-token');
console.log('🎯 The "jwt malformed" error should now be resolved');
console.log('📊 Test the fix:');
console.log('   • POST /api/auth/login (now returns real JWT)');
console.log('   • GET /api/debug/test-token (generates real test token)');
console.log('   • GET /api/user-status/survey/check-status (requires Bearer token)');
console.log('================================================================================\n');

export default app;