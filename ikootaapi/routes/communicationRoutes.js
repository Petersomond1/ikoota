// ikootaapi/routes/communicationRoutes.js
// ENHANCED COMMUNICATION ROUTES
// Complete route structure for email, SMS, notifications with proper controller integration

import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';
import db from '../config/db.js'; // Added missing db import

// Import reorganized communication controllers
import {
  // Email controllers
  sendEmailHandler,
  sendBulkEmailHandler,
  sendMembershipFeedbackEmail,
  
  // SMS controllers
  sendSMSHandler,
  sendBulkSMSHandler,
  
  // Notification controllers
  sendNotificationHandler,
  sendBulkNotificationHandler,
  
  // Settings controllers
  getCommunicationSettings,
  updateCommunicationSettings,
  
  // Template controllers
  getCommunicationTemplates,
  createCommunicationTemplate,
  
  // System controllers
  checkCommunicationHealth,
  getCommunicationStats,
  testCommunicationServices,
  getCommunicationConfig
} from '../controllers/communicationControllers.js';

const router = express.Router();

// ===============================================
// RATE LIMITING FOR COMMUNICATION ROUTES
// ===============================================

// General communication rate limiting
const communicationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: {
    success: false,
    error: 'Too many communication requests',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Bulk operation rate limiting (stricter)
const bulkOperationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 bulk operations per hour
  message: {
    success: false,
    error: 'Too many bulk communication operations',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// SMS rate limiting (stricter due to cost)
const smsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 SMS per 15 minutes
  message: {
    success: false,
    error: 'Too many SMS requests',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply general rate limiting to all communication routes
router.use(communicationLimiter);

// ===============================================
// EMAIL ROUTES
// ===============================================

// POST /communication/email/send - Send single email
router.post('/email/send', 
  authenticate, 
  sendEmailHandler
);

// POST /communication/email/bulk - Send bulk emails (admin only)
router.post('/email/bulk', 
  authenticate, 
  authorize(['admin', 'super_admin']), 
  bulkOperationLimiter,
  sendBulkEmailHandler
);

// POST /communication/email/send-membership-feedback - Send membership feedback email
router.post('/email/send-membership-feedback', 
  authenticate, 
  authorize(['admin', 'super_admin']), 
  sendMembershipFeedbackEmail
);

// ===============================================
// SMS ROUTES
// ===============================================

// POST /communication/sms/send - Send single SMS
router.post('/sms/send', 
  authenticate, 
  smsLimiter,
  sendSMSHandler
);

// POST /communication/sms/bulk - Send bulk SMS (admin only)
router.post('/sms/bulk', 
  authenticate, 
  authorize(['admin', 'super_admin']), 
  bulkOperationLimiter,
  smsLimiter,
  sendBulkSMSHandler
);

// ===============================================
// NOTIFICATION ROUTES
// ===============================================

// POST /communication/notification - Send combined notification (email + SMS)
router.post('/notification', 
  authenticate, 
  sendNotificationHandler
);

// POST /communication/notifications/bulk - Send bulk notifications (admin only)
router.post('/notifications/bulk', 
  authenticate, 
  authorize(['admin', 'super_admin']), 
  bulkOperationLimiter,
  sendBulkNotificationHandler
);

// ===============================================
// USER COMMUNICATION SETTINGS ROUTES
// ===============================================

// GET /communication/settings - Get user communication preferences
router.get('/settings', 
  authenticate, 
  getCommunicationSettings
);

// PUT /communication/settings - Update user communication preferences
router.put('/settings', 
  authenticate, 
  updateCommunicationSettings
);

// ===============================================
// TEMPLATE MANAGEMENT ROUTES
// ===============================================

// GET /communication/templates - Get available communication templates
router.get('/templates', 
  authenticate, 
  getCommunicationTemplates
);

// POST /communication/templates - Create new communication template (admin only)
router.post('/templates', 
  authenticate, 
  authorize(['admin', 'super_admin']), 
  createCommunicationTemplate
);

// PUT /communication/templates/:id - Update communication template (admin only)
router.put('/templates/:id', 
  authenticate, 
  authorize(['admin', 'super_admin']), 
  async (req, res) => {
    try {
      const templateId = req.params.id;
      const { templateType, subject, emailBody, smsMessage, variables, isActive } = req.body;

      if (!templateType || !['email', 'sms'].includes(templateType)) {
        return res.status(400).json({
          success: false,
          error: 'Template type (email or sms) is required'
        });
      }

      let updateQuery, updateParams;

      if (templateType === 'email') {
        updateQuery = `
          UPDATE email_templates 
          SET subject = ?, body_text = ?, body_html = ?, variables = ?, is_active = ?, updatedAt = NOW()
          WHERE id = ?
        `;
        updateParams = [subject, emailBody, emailBody, JSON.stringify(variables || []), isActive, templateId];
      } else {
        updateQuery = `
          UPDATE sms_templates 
          SET message = ?, variables = ?, is_active = ?, updatedAt = NOW()
          WHERE id = ?
        `;
        updateParams = [smsMessage, JSON.stringify(variables || []), isActive, templateId];
      }

      const [result] = await db.query(updateQuery, updateParams);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      // Log template update in audit logs
      await db.query(`
        INSERT INTO audit_logs (user_id, action, resource, details, createdAt)
        VALUES (?, ?, ?, ?, NOW())
      `, [
        req.user.id,
        'TEMPLATE_UPDATED',
        `${templateType}_template`,
        JSON.stringify({ templateId: parseInt(templateId), templateType })
      ]);

      res.status(200).json({
        success: true,
        message: 'Template updated successfully',
        templateId: parseInt(templateId),
        type: templateType,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error updating template:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        errorType: 'template_update_error'
      });
    }
  }
);

// DELETE /communication/templates/:id - Delete communication template (admin only)
router.delete('/templates/:id', 
  authenticate, 
  authorize(['admin', 'super_admin']), 
  async (req, res) => {
    try {
      const templateId = req.params.id;
      const { templateType } = req.query;

      if (!templateType || !['email', 'sms'].includes(templateType)) {
        return res.status(400).json({
          success: false,
          error: 'Template type (email or sms) is required in query parameters'
        });
      }

      const tableName = templateType === 'email' ? 'email_templates' : 'sms_templates';
      
      // Soft delete by setting is_active to false
      const [result] = await db.query(`
        UPDATE ${tableName} 
        SET is_active = FALSE, updatedAt = NOW()
        WHERE id = ?
      `, [templateId]);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      // Log template deletion in audit logs
      await db.query(`
        INSERT INTO audit_logs (user_id, action, resource, details, createdAt)
        VALUES (?, ?, ?, ?, NOW())
      `, [
        req.user.id,
        'TEMPLATE_DELETED',
        `${templateType}_template`,
        JSON.stringify({ templateId: parseInt(templateId), templateType })
      ]);

      res.status(200).json({
        success: true,
        message: 'Template deleted successfully',
        templateId: parseInt(templateId),
        type: templateType,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error deleting template:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        errorType: 'template_deletion_error'
      });
    }
  }
);

// GET /communication/templates/:id - Get specific template (admin only)
router.get('/templates/:id', 
  authenticate, 
  authorize(['admin', 'super_admin']), 
  async (req, res) => {
    try {
      const templateId = req.params.id;
      const { templateType } = req.query;

      if (!templateType || !['email', 'sms'].includes(templateType)) {
        return res.status(400).json({
          success: false,
          error: 'Template type (email or sms) is required in query parameters'
        });
      }

      const tableName = templateType === 'email' ? 'email_templates' : 'sms_templates';
      const [templates] = await db.query(`SELECT * FROM ${tableName} WHERE id = ?`, [templateId]);

      if (templates.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      res.status(200).json({
        success: true,
        data: templates[0],
        message: 'Template retrieved successfully'
      });

    } catch (error) {
      console.error('❌ Error getting template:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        errorType: 'template_retrieval_error'
      });
    }
  }
);

// ===============================================
// CHAT ROOMS & MESSAGING (FUTURE EXPANSION)
// ===============================================

// GET /communication/rooms - Get chat rooms
router.get('/rooms', 
  authenticate, 
  async (req, res) => {
    try {
      // TODO: Implement with chat room service
      const { limit = 20, offset = 0, type = 'all' } = req.query;

      res.status(200).json({
        success: true,
        message: 'Chat rooms endpoint - ready for implementation',
        data: {
          rooms: [],
          total: 0,
          pagination: { limit: parseInt(limit), offset: parseInt(offset) }
        },
        implementation_ready: true,
        endpoint: '/api/communication/rooms',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        errorType: 'chat_rooms_error'
      });
    }
  }
);

// POST /communication/rooms - Create chat room
router.post('/rooms', 
  authenticate, 
  async (req, res) => {
    try {
      const { roomName, description, isPublic = false, maxMembers = 50 } = req.body;

      if (!roomName) {
        return res.status(400).json({
          success: false,
          error: 'Room name is required',
          field: 'roomName'
        });
      }

      // TODO: Implement with chat room service
      res.status(201).json({
        success: true,
        message: 'Create chat room endpoint - ready for implementation',
        data: {
          roomId: 'temp_' + Date.now(),
          roomName,
          description,
          isPublic,
          maxMembers,
          createdBy: req.user.id,
          createdAt: new Date().toISOString()
        },
        implementation_ready: true,
        endpoint: '/api/communication/rooms',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        errorType: 'room_creation_error'
      });
    }
  }
);

// GET /communication/rooms/:id/messages - Get room messages
router.get('/rooms/:id/messages', 
  authenticate, 
  async (req, res) => {
    try {
      const roomId = req.params.id;
      const { limit = 50, offset = 0, since } = req.query;

      // TODO: Implement with chat room service
      res.status(200).json({
        success: true,
        message: 'Room messages endpoint - ready for implementation',
        data: {
          messages: [],
          total: 0,
          roomId,
          pagination: { limit: parseInt(limit), offset: parseInt(offset) }
        },
        implementation_ready: true,
        endpoint: `/api/communication/rooms/${roomId}/messages`,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        errorType: 'room_messages_error'
      });
    }
  }
);

// POST /communication/rooms/:id/messages - Send message to room
router.post('/rooms/:id/messages', 
  authenticate, 
  async (req, res) => {
    try {
      const roomId = req.params.id;
      const { message, mediaUrls = [] } = req.body;

      if (!message) {
        return res.status(400).json({
          success: false,
          error: 'Message content is required',
          field: 'message'
        });
      }

      // TODO: Implement with chat room service
      res.status(201).json({
        success: true,
        message: 'Send room message endpoint - ready for implementation',
        data: {
          messageId: 'temp_' + Date.now(),
          roomId,
          message,
          mediaUrls,
          senderId: req.user.id,
          senderUsername: req.user.username,
          sentAt: new Date().toISOString()
        },
        implementation_ready: true,
        endpoint: `/api/communication/rooms/${roomId}/messages`,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        errorType: 'send_room_message_error'
      });
    }
  }
);

// ===============================================
// DIRECT MESSAGING (FUTURE EXPANSION)
// ===============================================

// GET /communication/conversations - Get user conversations
router.get('/conversations', 
  authenticate, 
  async (req, res) => {
    try {
      const { limit = 20, offset = 0, unreadOnly = false } = req.query;

      // TODO: Implement with direct messaging service
      res.status(200).json({
        success: true,
        message: 'Conversations endpoint - ready for implementation',
        data: {
          conversations: [],
          total: 0,
          unreadCount: 0,
          pagination: { limit: parseInt(limit), offset: parseInt(offset) }
        },
        implementation_ready: true,
        endpoint: '/api/communication/conversations',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        errorType: 'conversations_error'
      });
    }
  }
);

// POST /communication/conversations - Create/start conversation
router.post('/conversations', 
  authenticate, 
  async (req, res) => {
    try {
      const { participantIds, initialMessage } = req.body;

      if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Participant IDs array is required',
          field: 'participantIds'
        });
      }

      // TODO: Implement with direct messaging service
      res.status(201).json({
        success: true,
        message: 'Create conversation endpoint - ready for implementation',
        data: {
          conversationId: 'temp_' + Date.now(),
          participantIds: [req.user.id, ...participantIds],
          createdBy: req.user.id,
          initialMessage,
          createdAt: new Date().toISOString()
        },
        implementation_ready: true,
        endpoint: '/api/communication/conversations',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        errorType: 'conversation_creation_error'
      });
    }
  }
);

// GET /communication/conversations/:id - Get specific conversation
router.get('/conversations/:id', 
  authenticate, 
  async (req, res) => {
    try {
      const conversationId = req.params.id;
      const { limit = 50, offset = 0 } = req.query;

      // TODO: Implement with direct messaging service
      res.status(200).json({
        success: true,
        message: 'Get conversation endpoint - ready for implementation',
        data: {
          conversationId,
          participants: [],
          messages: [],
          total: 0,
          pagination: { limit: parseInt(limit), offset: parseInt(offset) }
        },
        implementation_ready: true,
        endpoint: `/api/communication/conversations/${conversationId}`,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        errorType: 'get_conversation_error'
      });
    }
  }
);

// POST /communication/conversations/:id/messages - Send message in conversation
router.post('/conversations/:id/messages', 
  authenticate, 
  async (req, res) => {
    try {
      const conversationId = req.params.id;
      const { message, mediaUrls = [] } = req.body;

      if (!message) {
        return res.status(400).json({
          success: false,
          error: 'Message content is required',
          field: 'message'
        });
      }

      // TODO: Implement with direct messaging service
      res.status(201).json({
        success: true,
        message: 'Send conversation message endpoint - ready for implementation',
        data: {
          messageId: 'temp_' + Date.now(),
          conversationId,
          message,
          mediaUrls,
          senderId: req.user.id,
          senderUsername: req.user.username,
          sentAt: new Date().toISOString()
        },
        implementation_ready: true,
        endpoint: `/api/communication/conversations/${conversationId}/messages`,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        errorType: 'send_conversation_message_error'
      });
    }
  }
);

// ===============================================
// VIDEO/AUDIO CALLING (FUTURE EXPANSION)
// ===============================================

// POST /communication/video/initiate - Initiate video call
router.post('/video/initiate', 
  authenticate, 
  async (req, res) => {
    try {
      const { recipientIds, roomType = 'private' } = req.body;

      if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Recipient IDs array is required',
          field: 'recipientIds'
        });
      }

      // TODO: Implement with video calling service (WebRTC, Jitsi, etc.)
      res.status(201).json({
        success: true,
        message: 'Video call initiation endpoint - ready for WebRTC implementation',
        data: {
          callId: 'video_' + Date.now(),
          roomUrl: `https://meet.ikoota.com/room/video_${Date.now()}`,
          initiator: req.user.id,
          participants: [req.user.id, ...recipientIds],
          roomType,
          createdAt: new Date().toISOString()
        },
        implementation_ready: true,
        nextSteps: [
          'Integrate WebRTC or video calling service',
          'Create call invitation notifications',
          'Implement call history tracking',
          'Add call quality metrics'
        ],
        endpoint: '/api/communication/video/initiate',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        errorType: 'video_call_error'
      });
    }
  }
);

// POST /communication/audio/initiate - Initiate audio call
router.post('/audio/initiate', 
  authenticate, 
  async (req, res) => {
    try {
      const { recipientIds, roomType = 'private' } = req.body;

      if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Recipient IDs array is required',
          field: 'recipientIds'
        });
      }

      // TODO: Implement with audio calling service
      res.status(201).json({
        success: true,
        message: 'Audio call initiation endpoint - ready for implementation',
        data: {
          callId: 'audio_' + Date.now(),
          roomUrl: `https://meet.ikoota.com/room/audio_${Date.now()}`,
          initiator: req.user.id,
          participants: [req.user.id, ...recipientIds],
          roomType,
          createdAt: new Date().toISOString()
        },
        implementation_ready: true,
        endpoint: '/api/communication/audio/initiate',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        errorType: 'audio_call_error'
      });
    }
  }
);

// GET /communication/calls/history - Get call history
router.get('/calls/history', 
  authenticate, 
  async (req, res) => {
    try {
      const { limit = 20, offset = 0, type = 'all' } = req.query;

      // TODO: Implement with call history service
      res.status(200).json({
        success: true,
        message: 'Call history endpoint - ready for implementation',
        data: {
          calls: [],
          total: 0,
          pagination: { limit: parseInt(limit), offset: parseInt(offset) }
        },
        implementation_ready: true,
        endpoint: '/api/communication/calls/history',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        errorType: 'call_history_error'
      });
    }
  }
);

// ===============================================
// SYSTEM HEALTH & ANALYTICS (ADMIN ROUTES)
// ===============================================

// GET /communication/health - Check communication services health (admin only)
router.get('/health', 
  authenticate, 
  authorize(['admin', 'super_admin']), 
  checkCommunicationHealth
);

// GET /communication/stats - Get communication statistics (admin only)
router.get('/stats', 
  authenticate, 
  authorize(['admin', 'super_admin']), 
  getCommunicationStats
);

// GET /communication/config - Get communication configuration (admin only)
router.get('/config', 
  authenticate, 
  authorize(['admin', 'super_admin']), 
  getCommunicationConfig
);

// POST /communication/test - Test communication services (admin only)
router.post('/test', 
  authenticate, 
  authorize(['admin', 'super_admin']), 
  testCommunicationServices
);

// ===============================================
// COMMUNICATION LOGS & AUDIT (ADMIN ROUTES)
// ===============================================

// GET /communication/logs/email - Get email logs (admin only)
router.get('/logs/email', 
  authenticate, 
  authorize(['admin', 'super_admin']), 
  async (req, res) => {
    try {
      const { 
        limit = 100, 
        offset = 0, 
        status, 
        template, 
        startDate, 
        endDate,
        recipient 
      } = req.query;

      let whereClause = '';
      const whereParams = [];

      // Build dynamic WHERE clause
      const conditions = [];
      
      if (status) {
        conditions.push('status = ?');
        whereParams.push(status);
      }
      
      if (template) {
        conditions.push('template = ?');
        whereParams.push(template);
      }
      
      if (recipient) {
        conditions.push('recipient LIKE ?');
        whereParams.push(`%${recipient}%`);
      }
      
      if (startDate && endDate) {
        conditions.push('createdAt BETWEEN ? AND ?');
        whereParams.push(startDate, endDate);
      }
      
      if (conditions.length > 0) {
        whereClause = 'WHERE ' + conditions.join(' AND ');
      }

      const [logs] = await db.query(`
        SELECT 
          id, recipient, subject, template, status, message_id,
          error_message, sender_id, createdAt, processedAt
        FROM email_logs
        ${whereClause}
        ORDER BY createdAt DESC
        LIMIT ? OFFSET ?
      `, [...whereParams, parseInt(limit), parseInt(offset)]);

      // Get total count
      const [countResult] = await db.query(`
        SELECT COUNT(*) as total FROM email_logs ${whereClause}
      `, whereParams);

      res.status(200).json({
        success: true,
        data: {
          logs,
          total: countResult[0].total,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: countResult[0].total > parseInt(offset) + parseInt(limit)
          }
        },
        filters: { status, template, startDate, endDate, recipient },
        message: 'Email logs retrieved successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error getting email logs:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        errorType: 'email_logs_error'
      });
    }
  }
);

// GET /communication/logs/sms - Get SMS logs (admin only)
router.get('/logs/sms', 
  authenticate, 
  authorize(['admin', 'super_admin']), 
  async (req, res) => {
    try {
      const { 
        limit = 100, 
        offset = 0, 
        status, 
        template, 
        startDate, 
        endDate,
        recipient 
      } = req.query;

      let whereClause = '';
      const whereParams = [];

      // Build dynamic WHERE clause
      const conditions = [];
      
      if (status) {
        conditions.push('status = ?');
        whereParams.push(status);
      }
      
      if (template) {
        conditions.push('template = ?');
        whereParams.push(template);
      }
      
      if (recipient) {
        conditions.push('recipient LIKE ?');
        whereParams.push(`%${recipient}%`);
      }
      
      if (startDate && endDate) {
        conditions.push('createdAt BETWEEN ? AND ?');
        whereParams.push(startDate, endDate);
      }
      
      if (conditions.length > 0) {
        whereClause = 'WHERE ' + conditions.join(' AND ');
      }

      const [logs] = await db.query(`
        SELECT 
          id, recipient, message, template, status, sid,
          error_message, sender_id, createdAt, processedAt
        FROM sms_logs
        ${whereClause}
        ORDER BY createdAt DESC
        LIMIT ? OFFSET ?
      `, [...whereParams, parseInt(limit), parseInt(offset)]);

      // Get total count
      const [countResult] = await db.query(`
        SELECT COUNT(*) as total FROM sms_logs ${whereClause}
      `, whereParams);

      res.status(200).json({
        success: true,
        data: {
          logs,
          total: countResult[0].total,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: countResult[0].total > parseInt(offset) + parseInt(limit)
          }
        },
        filters: { status, template, startDate, endDate, recipient },
        message: 'SMS logs retrieved successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error getting SMS logs:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        errorType: 'sms_logs_error'
      });
    }
  }
);

// GET /communication/logs/bulk - Get bulk operation logs (admin only)
router.get('/logs/bulk', 
  authenticate, 
  authorize(['admin', 'super_admin']), 
  async (req, res) => {
    try {
      const { 
        limit = 50, 
        offset = 0, 
        type = 'all', 
        startDate, 
        endDate 
      } = req.query;

      const logs = {};

      // Get bulk email logs
      if (type === 'all' || type === 'email') {
        let emailWhereClause = '';
        const emailParams = [];

        if (startDate && endDate) {
          emailWhereClause = 'WHERE createdAt BETWEEN ? AND ?';
          emailParams.push(startDate, endDate);
        }

        const [emailLogs] = await db.query(`
          SELECT * FROM bulk_email_logs
          ${emailWhereClause}
          ORDER BY createdAt DESC
          LIMIT ? OFFSET ?
        `, [...emailParams, parseInt(limit), parseInt(offset)]);

        logs.email = emailLogs;
      }

      // Get bulk SMS logs
      if (type === 'all' || type === 'sms') {
        let smsWhereClause = '';
        const smsParams = [];

        if (startDate && endDate) {
          smsWhereClause = 'WHERE createdAt BETWEEN ? AND ?';
          smsParams.push(startDate, endDate);
        }

        const [smsLogs] = await db.query(`
          SELECT * FROM bulk_sms_logs
          ${smsWhereClause}
          ORDER BY createdAt DESC
          LIMIT ? OFFSET ?
        `, [...smsParams, parseInt(limit), parseInt(offset)]);

        logs.sms = smsLogs;
      }

      res.status(200).json({
        success: true,
        data: logs,
        filters: { type, startDate, endDate },
        pagination: { limit: parseInt(limit), offset: parseInt(offset) },
        message: 'Bulk operation logs retrieved successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error getting bulk logs:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        errorType: 'bulk_logs_error'
      });
    }
  }
);

// ===============================================
// TESTING & DEBUGGING ROUTES
// ===============================================

// GET /communication/test - Test communication system functionality
router.get('/test', 
  authenticate, 
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Communication routes are working!',
      timestamp: new Date().toISOString(),
      user: {
        id: req.user?.id,
        username: req.user?.username,
        role: req.user?.role
      },
      availableServices: {
        implemented: [
          'Single email sending',
          'Bulk email operations (admin)',
          'Single SMS sending',
          'Bulk SMS operations (admin)',
          'Combined notifications',
          'User communication settings',
          'Template management (admin)',
          'Health monitoring (admin)',
          'Communication analytics (admin)',
          'Activity logging'
        ],
        futureExpansion: [
          'Real-time chat rooms',
          'Direct messaging',
          'Video calling',
          'Audio calling',
          'Call history tracking',
          'Advanced notification scheduling'
        ]
      },
      routeStructure: {
        email: '/api/communication/email/*',
        sms: '/api/communication/sms/*',
        notifications: '/api/communication/notification*',
        settings: '/api/communication/settings',
        templates: '/api/communication/templates/*',
        chatRooms: '/api/communication/rooms/*',
        directMessaging: '/api/communication/conversations/*',
        videoCalling: '/api/communication/video/*',
        audioCalling: '/api/communication/audio/*',
        systemHealth: '/api/communication/health',
        analytics: '/api/communication/stats',
        logs: '/api/communication/logs/*'
      },
      endpoint: '/api/communication/test'
    });
  }
);

// ===============================================
// ENHANCED ERROR HANDLING
// ===============================================

// Communication-specific 404 handler
router.use('*', (req, res) => {
  console.log(`❌ Communication route not found: ${req.method} ${req.originalUrl}`);
  
  const requestedPath = req.originalUrl.toLowerCase();
  const suggestions = [];
  
  // Smart path suggestions for communication routes
  if (requestedPath.includes('email')) {
    suggestions.push(
      'POST /api/communication/email/send',
      'POST /api/communication/email/bulk',
      'POST /api/communication/email/send-membership-feedback'
    );
  }
  if (requestedPath.includes('sms')) {
    suggestions.push(
      'POST /api/communication/sms/send',
      'POST /api/communication/sms/bulk'
    );
  }
  if (requestedPath.includes('notification')) {
    suggestions.push(
      'POST /api/communication/notification',
      'POST /api/communication/notifications/bulk'
    );
  }
  if (requestedPath.includes('template')) {
    suggestions.push(
      'GET /api/communication/templates',
      'POST /api/communication/templates',
      'PUT /api/communication/templates/:id'
    );
  }
  if (requestedPath.includes('room') || requestedPath.includes('chat')) {
    suggestions.push(
      'GET /api/communication/rooms',
      'POST /api/communication/rooms',
      'GET /api/communication/conversations'
    );
  }
  if (requestedPath.includes('video') || requestedPath.includes('audio') || requestedPath.includes('call')) {
    suggestions.push(
      'POST /api/communication/video/initiate',
      'POST /api/communication/audio/initiate',
      'GET /api/communication/calls/history'
    );
  }
  if (requestedPath.includes('health') || requestedPath.includes('stat') || requestedPath.includes('config')) {
    suggestions.push(
      'GET /api/communication/health',
      'GET /api/communication/stats',
      'GET /api/communication/config'
    );
  }

  res.status(404).json({
    success: false,
    error: 'Communication route not found',
    path: req.originalUrl,
    method: req.method,
    suggestions: suggestions.length > 0 ? suggestions : undefined,
    
    availableRoutes: {
      email: {
        send: 'POST /email/send - Send single email',
        bulk: 'POST /email/bulk - Send bulk emails (admin)',
        membershipFeedback: 'POST /email/send-membership-feedback - Send membership feedback'
      },
      sms: {
        send: 'POST /sms/send - Send single SMS',
        bulk: 'POST /sms/bulk - Send bulk SMS (admin)'
      },
      notifications: {
        single: 'POST /notification - Send combined notification',
        bulk: 'POST /notifications/bulk - Send bulk notifications (admin)'
      },
      settings: {
        get: 'GET /settings - Get communication preferences',
        update: 'PUT /settings - Update communication preferences'
      },
      templates: {
        list: 'GET /templates - Get available templates',
        create: 'POST /templates - Create template (admin)',
        update: 'PUT /templates/:id - Update template (admin)',
        delete: 'DELETE /templates/:id - Delete template (admin)',
        get: 'GET /templates/:id - Get specific template (admin)'
      },
      chatRooms: {
        list: 'GET /rooms - Get chat rooms',
        create: 'POST /rooms - Create chat room',
        messages: 'GET /rooms/:id/messages - Get room messages',
        sendMessage: 'POST /rooms/:id/messages - Send room message'
      },
      directMessaging: {
        conversations: 'GET /conversations - Get conversations',
        createConversation: 'POST /conversations - Create conversation',
        getConversation: 'GET /conversations/:id - Get conversation',
        sendMessage: 'POST /conversations/:id/messages - Send message'
      },
      calling: {
        videoCall: 'POST /video/initiate - Initiate video call',
        audioCall: 'POST /audio/initiate - Initiate audio call',
        callHistory: 'GET /calls/history - Get call history'
      },
      admin: {
        health: 'GET /health - Check service health (admin)',
        stats: 'GET /stats - Get statistics (admin)',
        config: 'GET /config - Get configuration (admin)',
        test: 'POST /test - Test services (admin)',
        emailLogs: 'GET /logs/email - Get email logs (admin)',
        smsLogs: 'GET /logs/sms - Get SMS logs (admin)',
        bulkLogs: 'GET /logs/bulk - Get bulk operation logs (admin)'
      },
      testing: {
        test: 'GET /test - Communication system test'
      }
    },
    
    architecture: {
      structure: 'Routes → Controllers → Services',
      database: 'Comprehensive logging in email_logs, sms_logs, bulk_*_logs',
      templates: 'Database-driven with fallback to predefined templates',
      futureReady: 'Architecture prepared for video/audio calling, chat rooms'
    },
    
    help: {
      documentation: '/api/info',
      testEndpoint: '/api/communication/test',
      healthCheck: '/api/communication/health (admin)',
      configInfo: '/api/communication/config (admin)'
    },
    
    timestamp: new Date().toISOString()
  });
});

// Communication-specific error handler
router.use((error, req, res, next) => {
  const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  const isAdminRoute = req.originalUrl.includes('/admin/') || 
                      req.originalUrl.includes('/health') || 
                      req.originalUrl.includes('/stats') ||
                      req.originalUrl.includes('/config') ||
                      req.originalUrl.includes('/logs/');
  
  console.error('🚨 Communication Route Error:', {
    errorId,
    error: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    path: req.originalUrl,
    method: req.method,
    user: req.user?.username || 'unauthenticated',
    isAdminRoute,
    timestamp: new Date().toISOString()
  });
  
  let statusCode = error.statusCode || error.status || 500;
  let errorType = 'communication_error';
  
  // Enhanced error categorization for communication
  if (error.message.includes('email') || error.message.includes('SMTP')) {
    errorType = 'email_service_error';
  } else if (error.message.includes('SMS') || error.message.includes('Twilio')) {
    errorType = 'sms_service_error';
  } else if (error.message.includes('template')) {
    errorType = 'template_error';
  } else if (error.message.includes('notification')) {
    errorType = 'notification_error';
  } else if (error.message.includes('bulk')) {
    errorType = 'bulk_operation_error';
  } else if (error.message.includes('rate limit')) {
    statusCode = 429;
    errorType = 'rate_limit_error';
  } else if (error.message.includes('validation') || error.message.includes('required')) {
    statusCode = 400;
    errorType = 'validation_error';
  } else if (error.message.includes('authentication') || error.message.includes('token')) {
    statusCode = 401;
    errorType = 'authentication_error';
  } else if (error.message.includes('permission') || error.message.includes('access denied')) {
    statusCode = 403;
    errorType = 'authorization_error';
  }
  
  const errorResponse = {
    success: false,
    error: error.message || 'Communication operation failed',
    errorType,
    errorId,
    path: req.originalUrl,
    method: req.method,
    service: 'communication',
    isAdminRoute,
    timestamp: new Date().toISOString()
  };
  
  // Add debug info in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.debug = {
      stack: error.stack,
      details: error
    };
  }
  
  // Add contextual help based on error type
  if (statusCode === 401) {
    errorResponse.help = {
      message: 'Authentication required for communication operations',
      endpoint: '/api/auth/login'
    };
  } else if (statusCode === 403) {
    errorResponse.help = {
      message: isAdminRoute ? 
        'Admin privileges required for this communication operation' : 
        'Insufficient permissions for this communication operation'
    };
  } else if (statusCode === 429) {
    errorResponse.help = {
      message: 'Rate limit exceeded for communication operations',
      suggestion: 'Please wait before making more requests',
      limits: {
        general: '100 requests per 15 minutes',
        sms: '50 SMS per 15 minutes',
        bulk: '10 bulk operations per hour'
      }
    };
  } else if (errorType === 'email_service_error') {
    errorResponse.help = {
      message: 'Email service configuration issue',
      adminAction: 'Check email service health at /api/communication/health',
      commonCauses: [
        'Invalid email credentials',
        'SMTP connection blocked',
        'Network connectivity issues'
      ]
    };
  } else if (errorType === 'sms_service_error') {
    errorResponse.help = {
      message: 'SMS service configuration issue',
      adminAction: 'Check SMS service health at /api/communication/health',
      commonCauses: [
        'Invalid Twilio credentials',
        'Insufficient Twilio balance',
        'Network connectivity issues'
      ]
    };
  } else if (errorType === 'template_error') {
    errorResponse.help = {
      message: 'Template operation failed',
      availableTemplates: '/api/communication/templates',
      suggestion: 'Verify template name and required variables'
    };
  }
  
  res.status(statusCode).json(errorResponse);
});

// ===============================================
// DEVELOPMENT LOGGING & STARTUP INFO
// ===============================================

if (process.env.NODE_ENV === 'development') {
  console.log('\n💬 COMMUNICATION ROUTES - ENHANCED ARCHITECTURE');
  console.log('================================================================================');
  console.log('✅ COMPLETE IMPLEMENTATION: Email, SMS, notifications with database integration');
  console.log('✅ TEMPLATE SYSTEM: Database-driven templates with predefined fallbacks');
  console.log('✅ BULK OPERATIONS: Admin bulk email/SMS with rate limiting and logging');
  console.log('✅ USER PREFERENCES: Communication settings management');
  console.log('✅ COMPREHENSIVE LOGGING: All operations logged with detailed tracking');
  console.log('✅ FUTURE READY: Architecture prepared for video/audio, chat rooms');
  console.log('================================================================================');
  
  console.log('\n📧 EMAIL CAPABILITIES:');
  console.log('   • Single email sending with template support');
  console.log('   • Bulk email operations (admin only, max 1000 recipients)');
  console.log('   • Membership feedback emails');
  console.log('   • Template-based emails with variable substitution');
  console.log('   • HTML and text email formats');
  console.log('   • Comprehensive email logging');
  
  console.log('\n📱 SMS CAPABILITIES:');
  console.log('   • Single SMS sending with template support');
  console.log('   • Bulk SMS operations (admin only, max 500 recipients)');
  console.log('   • Phone number validation and formatting');
  console.log('   • Template-based SMS with variable substitution');
  console.log('   • Twilio integration with error handling');
  console.log('   • Comprehensive SMS logging');
  
  console.log('\n🔔 NOTIFICATION SYSTEM:');
  console.log('   • Combined email + SMS notifications');
  console.log('   • User preference-based channel selection');
  console.log('   • Bulk notification operations (admin)');
  console.log('   • Template-driven notification content');
  console.log('   • Critical notification override (admin alerts)');
  
  console.log('\n📋 TEMPLATE MANAGEMENT:');
  console.log('   • Database-driven template system');
  console.log('   • Predefined template fallbacks');
  console.log('   • Variable substitution support');
  console.log('   • Admin template CRUD operations');
  console.log('   • Template usage analytics');
  
  console.log('\n🛡️ SECURITY & RATE LIMITING:');
  console.log('   • General: 100 requests per 15 minutes');
  console.log('   • SMS: 50 requests per 15 minutes');
  console.log('   • Bulk operations: 10 per hour');
  console.log('   • Admin-only bulk operations');
  console.log('   • Comprehensive audit logging');
  
  console.log('\n🚀 FUTURE EXPANSION READY:');
  console.log('   • Real-time chat rooms with Socket.IO');
  console.log('   • Direct messaging system');
  console.log('   • Video calling (WebRTC integration)');
  console.log('   • Audio calling capabilities');
  console.log('   • Call history and quality metrics');
  console.log('   • Advanced notification scheduling');
  
  console.log('\n📊 ADMIN CAPABILITIES:');
  console.log('   • Communication service health monitoring');
  console.log('   • Detailed analytics and statistics');
  console.log('   • Email and SMS log viewing');
  console.log('   • Bulk operation tracking');
  console.log('   • Service configuration monitoring');
  console.log('   • Template management and analytics');
  
  console.log('================================================================================');
  console.log('🌟 COMMUNICATION SYSTEM FULLY OPERATIONAL');
  console.log('🔗 Test Endpoint: http://localhost:3000/api/communication/test');
  console.log('🔧 Health Check: http://localhost:3000/api/communication/health (admin)');
  console.log('📊 Statistics: http://localhost:3000/api/communication/stats (admin)');
  console.log('================================================================================\n');
}

export default router;