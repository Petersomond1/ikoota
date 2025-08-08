// File: ikootaapi/routes/adminContentRoutes.js
// ADMIN CONTENT ROUTES - ADMIN CONTENT & COMMUNICATION

import express from 'express';
import { authenticate, authorize, cacheMiddleware } from '../middlewares/auth.middleware.js';

// Import admin controllers
import {
  getPendingContent,
  manageContent,
  approveContent,
  rejectContent,
  getReports,
  updateReportStatus,
  getAuditLogs,
  sendNotification
} from '../controllers/adminControllers.js';

const adminContentRouter = express.Router();

// ===== BASIC MIDDLEWARE =====
adminContentRouter.use(authenticate);
adminContentRouter.use(authorize(['admin', 'super_admin']));

// ===============================================
// CONTENT MANAGEMENT ROUTES
// ===============================================

// Get pending content
adminContentRouter.get('/pending', cacheMiddleware(300), getPendingContent);

// Get all content for management
adminContentRouter.get('/all', cacheMiddleware(300), manageContent);
adminContentRouter.get('/', cacheMiddleware(300), manageContent); // Alias

// Bulk content actions
adminContentRouter.post('/bulk-manage', manageContent);

// Approve/reject specific content
adminContentRouter.post('/:id/approve', approveContent);
adminContentRouter.post('/:id/reject', rejectContent);

// ===============================================
// REPORTS MANAGEMENT ROUTES
// ===============================================

// Get all reports
adminContentRouter.get('/reports', cacheMiddleware(600), getReports);

// Update report status
adminContentRouter.put('/reports/:reportId/status', updateReportStatus);

// ===============================================
// NOTIFICATIONS & COMMUNICATION ROUTES
// ===============================================

// Send general notifications
adminContentRouter.post('/notifications/send', sendNotification);

// Send membership-specific notifications
adminContentRouter.post('/notifications/membership', async (req, res) => {
  // This would integrate with membership notification controller
  res.json({ message: 'Membership notification endpoint - integrate with membership controller' });
});

// Send bulk notifications
adminContentRouter.post('/notifications/bulk', async (req, res) => {
  // This would integrate with bulk notification controller
  res.json({ message: 'Bulk notification endpoint - integrate with communication controller' });
});

// ===============================================
// AUDIT LOGS ROUTES
// ===============================================

// Get audit logs
adminContentRouter.get('/audit-logs', cacheMiddleware(300), getAuditLogs);

// ===============================================
// ERROR HANDLING
// ===============================================

// 404 handler for admin content routes
adminContentRouter.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Admin content route not found',
    path: req.path,
    method: req.method,
    availableRoutes: {
      content: [
        'GET /pending - Get pending content',
        'GET /all - Get all content',
        'POST /bulk-manage - Bulk content actions',
        'POST /:id/approve - Approve content',
        'POST /:id/reject - Reject content'
      ],
      reports: [
        'GET /reports - Get all reports',
        'PUT /reports/:reportId/status - Update report status'
      ],
      notifications: [
        'POST /notifications/send - Send notification',
        'POST /notifications/membership - Send membership notification',
        'POST /notifications/bulk - Send bulk notifications'
      ],
      audit: [
        'GET /audit-logs - Get audit logs'
      ]
    },
    timestamp: new Date().toISOString()
  });
});

// Global error handler for admin content routes
adminContentRouter.use((error, req, res, next) => {
  console.error('❌ Admin content route error:', {
    error: error.message,
    stack: error.stack,
    route: req.originalUrl,
    method: req.method,
    user: req.user?.username,
    timestamp: new Date().toISOString()
  });
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? {
      stack: error.stack
    } : undefined,
    timestamp: new Date().toISOString()
  });
});

if (process.env.NODE_ENV === 'development') {
  console.log('📄 Admin content routes loaded with content management and communication');
}

export default adminContentRouter;