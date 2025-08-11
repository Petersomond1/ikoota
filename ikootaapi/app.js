// ikootaapi/app.js
// MINIMAL WORKING VERSION - Create routes directly in app.js

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

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
// DIRECT ROUTE CREATION - No imports needed
// ===============================================

// Health checks
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
// USER STATUS ROUTES - Direct implementation
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

// ===============================================
// MEMBERSHIP ROUTES - Direct implementation
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
// CONTENT ROUTES - Direct implementation
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

// Additional comment endpoints your frontend needs
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

// Additional chat endpoints
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

// POST routes for content
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
// AUTHENTICATION ROUTES - Direct implementation
// ===============================================

app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    message: 'Login successful',
    token: 'sample_jwt_token',
    user: {
      id: 1,
      username: 'testuser',
      email: 'test@example.com'
    }
  });
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
// USER ROUTES - Direct implementation
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
// ADMIN ROUTES - Direct implementation
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
// API INFO & DEBUG ROUTES
// ===============================================

app.get('/api/info', (req, res) => {
  res.json({
    success: true,
    message: 'Ikoota API - Minimal Working Version',
    version: '1.0.0-minimal',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    routes: {
      health: ['/health', '/api/health'],
      userStatus: ['/api/user-status/survey/status', '/api/user-status/dashboard'],
      membership: ['/api/membership/status/:id', '/api/membership/applications'],
      content: ['/api/content/chats', '/api/content/teachings', '/api/content/comments'],
      auth: ['/api/auth/login', '/api/auth/register', '/api/auth/logout'],
      users: ['/api/users/profile'],
      admin: ['/api/admin/users', '/api/admin/membership/applications']
    }
  });
});

app.get('/api/debug', (req, res) => {
  res.json({
    success: true,
    message: 'Debug info - All routes created directly in app.js',
    routeCount: 15,
    workingEndpoints: [
      'GET /health',
      'GET /api/health',
      'GET /api/user-status/survey/status',
      'GET /api/user-status/dashboard', 
      'GET /api/membership/status/:id',
      'GET /api/content/chats',
      'GET /api/content/chats/combinedcontent',
      'GET /api/content/teachings',
      'GET /api/content/comments/all',
      'GET /api/content/comments/parent-comments',
      'POST /api/content/chats',
      'POST /api/content/teachings',
      'POST /api/auth/login',
      'GET /api/users/profile',
      'GET /api/admin/users'
    ],
    noImportErrors: 'All routes created directly, no file imports needed',
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
    availableEndpoints: [
      'GET /health',
      'GET /api/health',
      'GET /api/info',
      'GET /api/debug',
      'GET /api/user-status/survey/status',
      'GET /api/user-status/dashboard',
      'GET /api/membership/status/:id',
      'GET /api/content/chats',
      'GET /api/content/chats/combinedcontent',
      'GET /api/content/teachings',
      'GET /api/content/comments/all',
      'GET /api/content/comments/parent-comments',
      'POST /api/content/chats',
      'POST /api/auth/login',
      'GET /api/users/profile'
    ],
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

console.log('\n🚀 MINIMAL APP.JS LOADED');
console.log('================================================================================');
console.log('✅ ALL ROUTES CREATED DIRECTLY - No imports, no external files needed');
console.log('🎯 This should fix all 404 errors');
console.log('📊 Test endpoints:');
console.log('   • GET /api/user-status/survey/status');
console.log('   • GET /api/membership/status/2');
console.log('   • GET /api/content/chats');
console.log('   • GET /api/content/teachings');
console.log('   • GET /api/debug');
console.log('================================================================================\n');

export default app;