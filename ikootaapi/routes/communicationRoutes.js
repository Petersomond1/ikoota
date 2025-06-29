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

const router = express.Router();

// GET /communication/templates - Get available email and SMS templates
router.get('/templates', authenticate, getAvailableTemplatesHandler);

// GET /communication/health - Check communication services health (admin only)
router.get('/health', authenticate, checkCommunicationHealthHandler);

// GET /communication/stats - Get communication statistics (admin only)
router.get('/stats', authenticate, getCommunicationStatsHandler);

// POST /communication/email/send - Send single email
router.post('/email/send', authenticate, sendEmailHandler);

// POST /communication/email/bulk - Send bulk emails (admin only)
router.post('/email/bulk', authenticate, sendBulkEmailHandler);

// POST /communication/sms/send - Send single SMS
router.post('/sms/send', authenticate, sendSMSHandler);

// POST /communication/sms/bulk - Send bulk SMS (admin only)
router.post('/sms/bulk', authenticate, sendBulkSMSHandler);

// POST /communication/notification - Send combined notification (email + SMS)
router.post('/notification', authenticate, sendNotificationHandler);

// Legacy route support for backward compatibility
router.post('/send', authenticate, sendEmailHandler);

export default router;