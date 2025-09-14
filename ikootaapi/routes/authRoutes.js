// ikootaapi/routes/authRoutes.js - WORKING VERSION FOR YOUR SYSTEM
import express from 'express';

// Import controllers from your authControllers.js file
import {
    sendVerificationCode,
    registerWithVerification,
    enhancedLogin,
    logoutUser,
    requestPasswordReset,
    resetPassword,
    verifyPasswordReset,
    verifyUser,
    getAuthenticatedUser,
    authHealthCheck,
    getAuthStats
} from '../controllers/authControllers.js';

import { getBasicProfile } from '../controllers/userStatusControllers.js';

// Import your existing middleware
import { authenticate } from '../middleware/auth.js';

// Import database connection
import db from '../config/db.js';

const router = express.Router();

// ===============================================
// PRIMARY AUTHENTICATION ROUTES
// ===============================================

// ✅ Enhanced verification and registration system
router.post('/send-verification', sendVerificationCode);
router.post('/register', registerWithVerification);
router.post('/login', enhancedLogin);
router.get('/logout', logoutUser);

// ===============================================
// PASSWORD RESET ROUTES
// ===============================================

router.post('/passwordreset/request', requestPasswordReset);
router.post('/passwordreset/reset', resetPassword);
router.post('/passwordreset/verify', verifyPasswordReset);

// ===============================================
// USER VERIFICATION ROUTES
// ===============================================

router.get('/verify/:token', verifyUser);

// ===============================================
// AUTHENTICATED USER ROUTES
// ===============================================

router.get('/', authenticate, getAuthenticatedUser);


//Userinfo.jsx, AuthContext.js,
// New route to get user profile info
router.get('/users/profile', authenticate, getBasicProfile);

// Route to get converse_id by user_id for privacy display
router.get('/users/:userId/converse-id', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Query to get converse_id for the specified user_id
    const [user] = await db.query(
      'SELECT converse_id FROM users WHERE id = ?',
      [userId]
    );
    
    if (user && user.converse_id) {
      res.json({
        success: true,
        converse_id: user.converse_id,
        user_id: userId
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'User not found or converse_id not available',
        user_id: userId
      });
    }
  } catch (error) {
    console.error('Error fetching converse_id:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});



// ===============================================
// TESTING ROUTES
// ===============================================

// Simple test route to verify auth routes work
router.get('/test-simple', (req, res) => {
  res.json({
    success: true,
    message: 'Authentication routes are working!',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    routes_available: [
      'POST /send-verification',
      'POST /register',
      'POST /login',
      'GET /logout',
      'POST /passwordreset/request',
      'POST /passwordreset/reset',
      'POST /passwordreset/verify',
      'GET /verify/:token',
      'GET /'
    ]
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

// Health check route
router.get('/health', authHealthCheck);

// Stats route (admin only)
router.get('/stats', authenticate, getAuthStats);

// ===============================================
// DEVELOPMENT TESTING ROUTES
// ===============================================

if (process.env.NODE_ENV === 'development') {
  // Test email functionality (development only)
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
      
      // Use your existing sendEmail function
      const { sendEmail } = await import('../utils/email.js');
      
      const result = await sendEmail(email, 'Test Email', 'This is a test email from Ikoota API');
      
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

  // Development test token endpoint
  router.get('/test-token', async (req, res) => {
    try {
      const jwt = await import('jsonwebtoken');
      const db = await import('../config/db.js');
      
      // Get a real user from database
      const users = await db.default.query('SELECT * FROM users LIMIT 1');
      const userRows = Array.isArray(users) ? (Array.isArray(users[0]) ? users[0] : users) : [];
      
      let testUser;
      
      if (userRows.length > 0) {
        testUser = userRows[0];
      } else {
        testUser = {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          role: 'user',
          membership_stage: 'pre_member',
          is_member: testUser.membership_stage === 'member'
        };
      }
      
      const testToken = jwt.default.sign({
        user_id: testUser.id,
        username: testUser.username,
        email: testUser.email,
        role: testUser.role,
        membership_stage: testUser.membership_stage,
        is_member: testUser.membership_stage === 'member'
      }, process.env.JWT_SECRET || 'your-secret-key-here', { expiresIn: '7d' });
      
      console.log('🧪 Test token generated from database user');
      
      res.json({
        success: true,
        token: testToken,
        user: {
          id: testUser.id,
          username: testUser.username,
          email: testUser.email,
          role: testUser.role,
          membership_stage: testUser.membership_stage,
          is_member: testUser.membership_stage === 'member'
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
// ERROR HANDLING & LOGGING
// ===============================================

// Log all routes in development
if (process.env.NODE_ENV === 'development') {
  console.log('🔐 Authentication routes loaded:');
  console.log('   Primary Auth: /send-verification, /register, /login, /logout');
  console.log('   Password Reset: /passwordreset/request, /passwordreset/reset, /passwordreset/verify');
  console.log('   User Verification: /verify/:token');
  console.log('   Authenticated User: /');
  console.log('   Test: /test-simple, /test-auth');
  console.log('   Health: /health, /stats');
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
        'GET /test-auth',
        'GET /health'
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

export default router;