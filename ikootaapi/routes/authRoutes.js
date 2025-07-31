// File: ikootaapi/routes/authRoutes.js
// AUTH ROUTES - CONSOLIDATED AUTHENTICATION

import express from 'express';
import {
  // Enhanced authentication functions from membership
  sendVerificationCode,
  registerWithVerification,
  enhancedLogin,
  logoutUser,
  
  // Existing password reset functions
  requestPasswordReset,
  resetPassword,
  verifyPasswordReset,
  verifyUser,
  getAuthenticatedUser,
} from '../controllers/authControllers.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { sendEmail } from '../utils/notifications.js';

const authRouter = express.Router();

// ===============================================
// PRIMARY AUTHENTICATION ROUTES (Enhanced versions)
// ===============================================

// Enhanced verification and registration system
authRouter.post('/send-verification', sendVerificationCode);
authRouter.post('/register', registerWithVerification);
authRouter.post('/login', enhancedLogin);
authRouter.get('/logout', logoutUser);

// ===============================================
// PASSWORD RESET ROUTES
// ===============================================

authRouter.post('/passwordreset/request', requestPasswordReset);
authRouter.post('/passwordreset/reset', resetPassword);
authRouter.post('/passwordreset/verify', verifyPasswordReset);

// ===============================================
// USER VERIFICATION ROUTES
// ===============================================

authRouter.get('/verify/:token', verifyUser);

// ===============================================
// AUTHENTICATED USER ROUTES
// ===============================================

authRouter.get('/', authenticate, getAuthenticatedUser);

// ===============================================
// DEVELOPMENT & TESTING ROUTES
// ===============================================

// Simple test route to verify auth routes work
authRouter.get('/test-simple', (req, res) => {
  res.json({
    success: true,
    message: 'Authentication routes are working!',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
});

// Test route with authentication
authRouter.get('/test-auth', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Authentication is working!',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// ===== DEVELOPMENT EMAIL TEST ROUTES =====
if (process.env.NODE_ENV === 'development') {
  
  // Test basic email sending
  authRouter.post('/test-email', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ 
          success: false,
          error: 'Email address required',
          example: { email: 'your-email@gmail.com' }
        });
      }
      
      console.log('🧪 Testing email to:', email);
      
      const result = await sendEmail(email, 'verification_code', {
        VERIFICATION_CODE: '123456',
        EXPIRES_IN: '10 minutes'
      });
      
      res.json({
        success: true,
        message: 'Test email sent successfully',
        result,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Test email failed:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        help: 'Check your Gmail App Password configuration',
        instructions: [
          '1. Enable 2FA on Gmail',
          '2. Generate App Password',
          '3. Set MAIL_USER and MAIL_PASS in .env',
          '4. Restart server'
        ]
      });
    }
  });

  // Test email configuration
  authRouter.get('/test-email-config', async (req, res) => {
    try {
      const { testEmailConnection, getEmailConfig } = await import('../utils/email.js');
      
      const config = getEmailConfig();
      const connectionTest = await testEmailConnection();
      
      res.json({
        success: true,
        configuration: config,
        connectionTest,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Email config test failed:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Test all notification services
  authRouter.get('/test-notifications', async (req, res) => {
    try {
      const { testNotificationServices } = await import('../utils/notifications.js');
      
      const results = await testNotificationServices();
      
      res.json({
        success: true,
        services: results,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Notification services test failed:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
}

// ===============================================
// ERROR HANDLING & LOGGING
// ===============================================

// 404 handler for unmatched auth routes
authRouter.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Authentication route not found',
    path: req.path,
    method: req.method,
    availableRoutes: {
      primary: [
        'POST /send-verification',
        'POST /register',
        'POST /login',
        'GET /logout'
      ],
      passwordReset: [
        'POST /passwordreset/request',
        'POST /passwordreset/reset',
        'POST /passwordreset/verify'
      ],
      verification: [
        'GET /verify/:token'
      ],
      user: [
        'GET /'
      ],
      testing: [
        'GET /test-simple',
        'GET /test-auth'
      ]
    }
  });
});

// Global error handler for auth routes
authRouter.use((error, req, res, next) => {
  console.error('Authentication route error:', error);
  
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Internal server error',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Log routes in development
if (process.env.NODE_ENV === 'development') {
  console.log('🔐 Authentication routes loaded:');
  console.log('   Primary Auth: /send-verification, /register, /login, /logout');
  console.log('   Password Reset: /passwordreset/request, /passwordreset/reset, /passwordreset/verify');
  console.log('   User Verification: /verify/:token');
  console.log('   Authenticated User: /');
  console.log('   Test: /test-simple, /test-auth');
}

export default authRouter;
