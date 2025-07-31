// 2. COMMUNICATION ROUTES - CHAT & MESSAGING
// File: ikootaapi/routes/communicationRoutes.js
// ===============================================

import express from 'express';
import {
  sendEmailHandler,
  sendSMSHandler,
  sendBulkEmailHandler,
  sendBulkSMSHandler,
  sendNotificationHandler,
  checkCommunicationHealthHandler,
  getCommunicationStatsHandler,
  getAvailableTemplatesHandler
} from '../controllers/communicationControllers.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const communicationRouter = express.Router();

// ===============================================
// COMMUNICATION SETTINGS & UTILITIES
// ===============================================

// GET /communication/settings - Get communication settings
communicationRouter.get('/settings', authenticate, async (req, res) => {
  // This would integrate with user communication settings
  res.json({ message: 'Communication settings endpoint - implement with settings controller' });
});

// PUT /communication/settings - Update communication settings
communicationRouter.put('/settings', authenticate, async (req, res) => {
  // This would integrate with user communication settings
  res.json({ message: 'Update communication settings endpoint - implement with settings controller' });
});

// GET /communication/notifications - Get notification preferences
communicationRouter.get('/notifications', authenticate, async (req, res) => {
  // This would integrate with notification preferences
  res.json({ message: 'Notification preferences endpoint - implement with preferences controller' });
});

// PUT /communication/notifications - Update notification preferences
communicationRouter.put('/notifications', authenticate, async (req, res) => {
  // This would integrate with notification preferences
  res.json({ message: 'Update notification preferences endpoint - implement with preferences controller' });
});

// ===============================================
// EMAIL SERVICES
// ===============================================

// POST /communication/email/send - Send single email
communicationRouter.post('/email/send', authenticate, sendEmailHandler);

// POST /communication/email/bulk - Send bulk emails (admin only)
communicationRouter.post('/email/bulk', authenticate, sendBulkEmailHandler);

// ===============================================
// SMS SERVICES
// ===============================================

// POST /communication/sms/send - Send single SMS
communicationRouter.post('/sms/send', authenticate, sendSMSHandler);

// POST /communication/sms/bulk - Send bulk SMS (admin only)
communicationRouter.post('/sms/bulk', authenticate, sendBulkSMSHandler);

// ===============================================
// COMBINED NOTIFICATIONS
// ===============================================

// POST /communication/notification - Send combined notification (email + SMS)
communicationRouter.post('/notification', authenticate, sendNotificationHandler);

// ===============================================
// COMMUNICATION MANAGEMENT
// ===============================================

// GET /communication/templates - Get available email and SMS templates
communicationRouter.get('/templates', authenticate, getAvailableTemplatesHandler);

// GET /communication/health - Check communication services health (admin only)
communicationRouter.get('/health', authenticate, checkCommunicationHealthHandler);

// GET /communication/stats - Get communication statistics (admin only)
communicationRouter.get('/stats', authenticate, getCommunicationStatsHandler);

// ===============================================
// CHAT ROOM MANAGEMENT
// ===============================================

// GET /communication/rooms - Get chat rooms
communicationRouter.get('/rooms', authenticate, async (req, res) => {
  // This would integrate with chat room controller
  res.json({ message: 'Chat rooms endpoint - implement with chat room controller' });
});

// POST /communication/rooms - Create chat room
communicationRouter.post('/rooms', authenticate, async (req, res) => {
  // This would integrate with chat room controller
  res.json({ message: 'Create chat room endpoint - implement with chat room controller' });
});

// GET /communication/rooms/:id/messages - Get chat room messages
communicationRouter.get('/rooms/:id/messages', authenticate, async (req, res) => {
  // This would integrate with chat room messages controller
  res.json({ message: 'Chat room messages endpoint - implement with chat room controller' });
});

// POST /communication/rooms/:id/messages - Send message to chat room
communicationRouter.post('/rooms/:id/messages', authenticate, async (req, res) => {
  // This would integrate with chat room messages controller
  res.json({ message: 'Send chat room message endpoint - implement with chat room controller' });
});

// PUT /communication/rooms/:id/messages/:messageId - Update chat room message
communicationRouter.put('/rooms/:id/messages/:messageId', authenticate, async (req, res) => {
  // This would integrate with chat room messages controller
  res.json({ message: 'Update chat room message endpoint - implement with chat room controller' });
});

// DELETE /communication/rooms/:id/messages/:messageId - Delete chat room message
communicationRouter.delete('/rooms/:id/messages/:messageId', authenticate, async (req, res) => {
  // This would integrate with chat room messages controller
  res.json({ message: 'Delete chat room message endpoint - implement with chat room controller' });
});

// ===============================================
// DIRECT MESSAGING
// ===============================================

// GET /communication/conversations - Get conversations
communicationRouter.get('/conversations', authenticate, async (req, res) => {
  // This would integrate with direct messaging controller
  res.json({ message: 'Conversations endpoint - implement with messaging controller' });
});

// POST /communication/conversations - Create conversation
communicationRouter.post('/conversations', authenticate, async (req, res) => {
  // This would integrate with direct messaging controller
  res.json({ message: 'Create conversation endpoint - implement with messaging controller' });
});

// GET /communication/conversations/:id - Get specific conversation
communicationRouter.get('/conversations/:id', authenticate, async (req, res) => {
  // This would integrate with direct messaging controller
  res.json({ message: 'Get conversation endpoint - implement with messaging controller' });
});

// POST /communication/conversations/:id/messages - Send message in conversation
communicationRouter.post('/conversations/:id/messages', authenticate, async (req, res) => {
  // This would integrate with direct messaging controller
  res.json({ message: 'Send conversation message endpoint - implement with messaging controller' });
});

// ===============================================
// LEGACY COMPATIBILITY
// ===============================================

// Legacy route support for backward compatibility
communicationRouter.post('/send', authenticate, sendEmailHandler);

// ===============================================
// ERROR HANDLING
// ===============================================

// 404 handler for communication routes
communicationRouter.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Communication route not found',
    path: req.path,
    method: req.method,
    availableRoutes: {
      settings: [
        'GET /settings - Get communication settings',
        'PUT /settings - Update communication settings',
        'GET /notifications - Get notification preferences',
        'PUT /notifications - Update notification preferences'
      ],
      email: [
        'POST /email/send - Send single email',
        'POST /email/bulk - Send bulk emails (admin)'
      ],
      sms: [
        'POST /sms/send - Send single SMS',
        'POST /sms/bulk - Send bulk SMS (admin)'
      ],
      notifications: [
        'POST /notification - Send combined notification'
      ],
      management: [
        'GET /templates - Get available templates',
        'GET /health - Check service health (admin)',
        'GET /stats - Get communication statistics (admin)'
      ],
      chatRooms: [
        'GET /rooms - Get chat rooms',
        'POST /rooms - Create chat room',
        'GET /rooms/:id/messages - Get room messages',
        'POST /rooms/:id/messages - Send room message'
      ],
      directMessaging: [
        'GET /conversations - Get conversations',
        'POST /conversations - Create conversation',
        'GET /conversations/:id - Get specific conversation',
        'POST /conversations/:id/messages - Send message'
      ]
    },
    timestamp: new Date().toISOString()
  });
});

// Global error handler for communication routes
communicationRouter.use((error, req, res, next) => {
  console.error('❌ Communication route error:', error);
  
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Internal server error',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

if (process.env.NODE_ENV === 'development') {
  console.log('💬 Communication routes loaded with email, SMS, chat rooms, and messaging');
}

export default communicationRouter;


