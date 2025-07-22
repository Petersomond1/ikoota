//ikootaapi/routes/authRoutes.js - CONSOLIDATED AUTHENTICATION
import express from 'express';
import {
  // ✅ NEW: Enhanced authentication functions from membership
  sendVerificationCode,
  registerWithVerification,
  enhancedLogin,
  logoutUser,
  
  // ✅ KEEP: Existing password reset functions
  requestPasswordReset,
  resetPassword,
  verifyPasswordReset,
  verifyUser,
  getAuthenticatedUser,
  
} from '../controllers/authControllers.js';
import { authenticate } from '../middlewares/auth.middleware.js';
// Add this to your authRoutes.js - Development Email Testing
import { sendEmail } from '../utils/notifications.js';

const router = express.Router();

// ==================================================
// PRIMARY AUTHENTICATION ROUTES (Enhanced versions)
// ==================================================

// ✅ MOVED: Enhanced verification and registration system
router.post('/send-verification', sendVerificationCode);
router.post('/register', registerWithVerification);
router.post('/login', enhancedLogin);
router.get('/logout', logoutUser);

// ==================================================
// PASSWORD RESET ROUTES (Existing)
// ==================================================

router.post('/passwordreset/request', requestPasswordReset);
router.post('/passwordreset/reset', resetPassword);
router.post('/passwordreset/verify', verifyPasswordReset);

// ==================================================
// USER VERIFICATION ROUTES (Existing)
// ==================================================

router.get('/verify/:token', verifyUser);

// ==================================================
// AUTHENTICATED USER ROUTES (Existing)
// ==================================================

router.get('/', authenticate, getAuthenticatedUser);

// ==================================================
// DEVELOPMENT & TESTING ROUTES
// ==================================================

// Simple test route to verify auth routes work
router.get('/test-simple', (req, res) => {
  res.json({
    success: true,
    message: 'Authentication routes are working!',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
});

// Test route with authentication
router.get('/test-auth', authenticate, (req, res) => {
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
  router.post('/test-email', async (req, res) => {
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
  router.get('/test-email-config', async (req, res) => {
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
  router.get('/test-notifications', async (req, res) => {
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

// ==================================================
// ERROR HANDLING & LOGGING
// ==================================================

// Log all routes in development
if (process.env.NODE_ENV === 'development') {
  console.log('🔐 Authentication routes loaded:');
  console.log('   Primary Auth: /send-verification, /register, /login, /logout');
  console.log('   Password Reset: /passwordreset/request, /passwordreset/reset, /passwordreset/verify');
  console.log('   User Verification: /verify/:token');
  console.log('   Authenticated User: /');
  console.log('   Test: /test-simple, /test-auth');
}

// 404 handler for unmatched auth routes
router.use('*', (req, res) => {
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
router.use((error, req, res, next) => {
  console.error('Authentication route error:', error);
  
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Internal server error',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});


// Add this to your authRoutes.js for testing

// ===== DEVELOPMENT EMAIL TEST ROUTE =====
if (process.env.NODE_ENV === 'development') {
  router.post('/test-email', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email address required' });
      }
      
      console.log('🧪 Testing email to:', email);
      
      const result = await sendEmail(email, 'verification_code', {
        VERIFICATION_CODE: '123456',
        EXPIRES_IN: '10 minutes'
      });
      
      res.json({
        success: true,
        message: 'Test email sent successfully',
        result
      });
      
    } catch (error) {
      console.error('❌ Test email failed:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        help: 'Check your Gmail App Password configuration'
      });
    }
  });
}

export default router;