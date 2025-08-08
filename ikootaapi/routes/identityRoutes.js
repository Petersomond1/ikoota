// ikootaapi/routes/identityRoutes.js
// IDENTITY MANAGEMENT ROUTES
// Converse ID and Mentor ID operations

import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';

// Import identity controllers (separated as requested)
import {
  // Converse ID operations
  generateConverseId,
  getConverseId,
  updateConverseId,
  deleteConverseId,
  getClassMembers
} from '../controllers/converseIdControllers.js';

import {
  // Mentor ID operations
  generateMentorId,
  getMentorId,
  updateMentorId,
  deleteMentorId,
  getMentees,
  assignMentee,
  removeMentee
} from '../controllers/mentorIdControllers.js';

const router = express.Router();

// ===============================================
// CONVERSE ID MANAGEMENT - /api/identity/converse/*
// ===============================================

// GET /identity/converse - Get user's converse ID
router.get('/converse', authenticate, getConverseId);

// POST /identity/converse/generate - Generate new converse ID
router.post('/converse/generate', authenticate, generateConverseId);

// PUT /identity/converse - Update converse ID settings
router.put('/converse', authenticate, updateConverseId);

// DELETE /identity/converse - Delete/reset converse ID
router.delete('/converse', authenticate, deleteConverseId);

// GET /identity/converse/class/:classId/members - Get class members via converse ID
router.get('/converse/class/:classId/members', authenticate, getClassMembers);

// ===============================================
// MENTOR ID MANAGEMENT - /api/identity/mentor/*
// ===============================================

// GET /identity/mentor - Get user's mentor ID
router.get('/mentor', authenticate, getMentorId);

// POST /identity/mentor/generate - Generate new mentor ID
router.post('/mentor/generate', authenticate, generateMentorId);

// PUT /identity/mentor - Update mentor ID settings
router.put('/mentor', authenticate, updateMentorId);

// DELETE /identity/mentor - Delete/reset mentor ID
router.delete('/mentor', authenticate, deleteMentorId);

// GET /identity/mentor/mentees - Get mentor's mentees
router.get('/mentor/mentees', authenticate, getMentees);

// POST /identity/mentor/mentees/assign - Assign mentee
router.post('/mentor/mentees/assign', authenticate, assignMentee);

// DELETE /identity/mentor/mentees/:menteeId - Remove mentee
router.delete('/mentor/mentees/:menteeId', authenticate, removeMentee);

// ===============================================
// GENERAL IDENTITY OPERATIONS
// ===============================================

// GET /identity/status - Get identity status
router.get('/status', authenticate, async (req, res) => {
  res.json({
    success: true,
    message: 'Identity status endpoint - implement with identity service',
    timestamp: new Date().toISOString()
  });
});

// POST /identity/verify - Start identity verification
router.post('/verify', authenticate, async (req, res) => {
  res.json({
    success: true,
    message: 'Identity verification endpoint - implement with verification service',
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// PRIVACY SETTINGS
// ===============================================

// GET /identity/privacy-settings - Get privacy settings
router.get('/privacy-settings', authenticate, async (req, res) => {
  res.json({
    success: true,
    message: 'Privacy settings endpoint - implement with privacy service',
    timestamp: new Date().toISOString()
  });
});

// PUT /identity/privacy-settings - Update privacy settings
router.put('/privacy-settings', authenticate, async (req, res) => {
  res.json({
    success: true,
    message: 'Update privacy settings endpoint - implement with privacy service',
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// TESTING ENDPOINTS
// ===============================================

// Identity management test
router.get('/test', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Identity routes are working!',
    timestamp: new Date().toISOString(),
    user: {
      id: req.user?.id,
      username: req.user?.username,
      role: req.user?.role
    },
    availableIdentityTypes: ['converse', 'mentor'],
    endpoint: '/api/identity/test'
  });
});

// ===============================================
// ERROR HANDLING
// ===============================================

// 404 handler
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Identity route not found',
    path: req.path,
    method: req.method,
    availableRoutes: {
      converseId: [
        'GET /converse - Get converse ID',
        'POST /converse/generate - Generate converse ID',
        'PUT /converse - Update converse ID',
        'DELETE /converse - Delete converse ID',
        'GET /converse/class/:classId/members - Get class members'
      ],
      mentorId: [
        'GET /mentor - Get mentor ID',
        'POST /mentor/generate - Generate mentor ID',
        'PUT /mentor - Update mentor ID',
        'DELETE /mentor - Delete mentor ID',
        'GET /mentor/mentees - Get mentees',
        'POST /mentor/mentees/assign - Assign mentee',
        'DELETE /mentor/mentees/:menteeId - Remove mentee'
      ],
      general: [
        'GET /status - Identity status',
        'POST /verify - Start verification'
      ],
      privacy: [
        'GET /privacy-settings - Get privacy settings',
        'PUT /privacy-settings - Update privacy settings'
      ],
      testing: [
        'GET /test - Identity routes test'
      ]
    },
    timestamp: new Date().toISOString()
  });
});

// Error handler
router.use((error, req, res, next) => {
  console.error('❌ Identity route error:', {
    error: error.message,
    path: req.path,
    method: req.method,
    user: req.user?.username || 'unauthenticated',
    timestamp: new Date().toISOString()
  });
  
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Identity operation error',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

if (process.env.NODE_ENV === 'development') {
  console.log('🆔 Identity routes loaded: converse ID, mentor ID, privacy settings');
}

export default router;