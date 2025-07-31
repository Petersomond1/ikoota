// 3. SYSTEM ROUTES - HEALTH CHECKS & UTILITIES
// File: ikootaapi/routes/systemRoutes.js
// ===============================================

import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';

// Import system-related functions
import {
  healthCheck,
  testSimple,
  testAuth,
  testDashboard,
  getSystemStatus
} from '../controllers/userStatusController.js';

const systemRouter = express.Router();

// ===============================================
// MAIN SYSTEM ENDPOINTS
// ===============================================

// Health check endpoint
systemRouter.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '1.0.0'
  });
});

// API info endpoint
systemRouter.get('/info', (req, res) => {
  res.json({
    success: true,
    message: 'API Information',
    version: '1.0.0',
    routes: {
      authentication: '/api/auth/*',
      users: '/api/users/*',
      membership: '/api/membership/*',
      admin: '/api/admin/*',
      content: '/api/content/*',
      communication: '/api/chat/*',
      identity: '/api/identity/*',
      system: '/api/health, /api/info'
    },
    timestamp: new Date().toISOString()
  });
});

// System status endpoint
systemRouter.get('/system/status', getSystemStatus);

// ===============================================
// DEVELOPMENT & TESTING ENDPOINTS
// ===============================================

// Simple connectivity test
systemRouter.get('/test/simple', testSimple);

// Authentication test
systemRouter.get('/test/auth', authenticate, testAuth);

// Dashboard connectivity test
systemRouter.get('/test/dashboard', authenticate, testDashboard);

// ===============================================
// DEBUG ROUTES (DEVELOPMENT ONLY)
// ===============================================

if (process.env.NODE_ENV === 'development') {
  
  // Debug route list
  systemRouter.get('/debug/routes', (req, res) => {
    res.json({
      success: true,
      message: 'Available system routes',
      routes: {
        main: [
          'GET /health - System health check',
          'GET /info - API information',
          'GET /system/status - System status overview'
        ],
        testing: [
          'GET /test/simple - Simple connectivity test',
          'GET /test/auth - Authentication test (requires login)',
          'GET /test/dashboard - Dashboard connectivity test (requires login)'
        ],
        debug: [
          'GET /debug/routes - This route list'
        ]
      },
      timestamp: new Date().toISOString()
    });
  });
}

// ===============================================
// ERROR HANDLING
// ===============================================

// System routes error handler
systemRouter.use((error, req, res, next) => {
  console.error('❌ System route error:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'System error',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

if (process.env.NODE_ENV === 'development') {
  console.log('🔧 System routes loaded: health checks, API info, and testing endpoints');
}

export default systemRouter;
