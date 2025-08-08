// ikootaapi/controllers/communicationControllers.js
// REORGANIZED COMMUNICATION CONTROLLERS
// Complete controller layer for email, SMS, notifications with enhanced features

import {
  sendEmailService,
  sendSMSService,
  sendBulkEmailService,
  sendBulkSMSService,
  sendNotificationService,
  checkCommunicationHealthService,
  getCommunicationStatsService,
  getAvailableTemplatesService,
  getCommunicationSettingsService,
  updateCommunicationSettingsService,
  createCommunicationTemplateService,
  sendMembershipFeedbackEmailService
} from '../services/communicationServices.js';

// ===============================================
// EMAIL CONTROLLERS
// ===============================================

// Send single email
export const sendEmailHandler = async (req, res) => {
  try {
    const { 
      email, 
      subject, 
      content, 
      template, 
      customData = {},
      options = {}
    } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email recipient is required',
        field: 'email'
      });
    }

    if (!subject && !template) {
      return res.status(400).json({
        success: false,
        error: 'Email subject or template is required',
        fields: ['subject', 'template']
      });
    }

    // Check authorization for admin templates
    const adminTemplates = ['adminNotification', 'bulkAnnouncement', 'systemAlert'];
    if (adminTemplates.includes(template) && !['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions for admin email templates'
      });
    }

    const emailData = {
      to: email,
      subject,
      content,
      template,
      customData: {
        ...customData,
        senderName: req.user.username,
        senderId: req.user.id
      },
      options,
      requestingUser: req.user
    };

    const result = await sendEmailService(emailData);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Email sent successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in sendEmailHandler:', error);
    
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      errorType: 'email_send_error'
    });
  }
};

// Send bulk emails (admin only)
export const sendBulkEmailHandler = async (req, res) => {
  try {
    // Admin authorization check
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied - admin privileges required for bulk email operations'
      });
    }

    const { 
      recipients, 
      subject, 
      content, 
      template, 
      customData = {},
      options = {}
    } = req.body;

    // Validation
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Recipients array is required',
        field: 'recipients'
      });
    }

    if (recipients.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 1000 recipients allowed per bulk email operation'
      });
    }

    const bulkEmailData = {
      recipients,
      subject,
      content,
      template,
      customData: {
        ...customData,
        senderName: req.user.username,
        senderId: req.user.id
      },
      options: {
        batchSize: Math.min(options.batchSize || 50, 100),
        delay: Math.max(options.delay || 1000, 500),
        ...options
      },
      requestingUser: req.user
    };

    const result = await sendBulkEmailService(bulkEmailData);

    res.status(200).json({
      success: true,
      data: result,
      message: `Bulk email operation completed: ${result.successful}/${result.total} successful`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in sendBulkEmailHandler:', error);
    
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      errorType: 'bulk_email_error'
    });
  }
};

// Send membership feedback email (special endpoint)
export const sendMembershipFeedbackEmail = async (req, res) => {
  try {
    const { 
      recipientEmail, 
      applicantName, 
      feedbackMessage, 
      applicationStatus,
      membershipTicket
    } = req.body;

    // Validation
    if (!recipientEmail || !applicantName || !feedbackMessage) {
      return res.status(400).json({
        success: false,
        error: 'Recipient email, applicant name, and feedback message are required',
        fields: ['recipientEmail', 'applicantName', 'feedbackMessage']
      });
    }

    const feedbackData = {
      recipientEmail,
      applicantName,
      feedbackMessage,
      applicationStatus: applicationStatus || 'reviewed',
      membershipTicket,
      senderName: req.user.username,
      senderId: req.user.id
    };

    const result = await sendMembershipFeedbackEmailService(feedbackData);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Membership feedback email sent successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in sendMembershipFeedbackEmail:', error);
    
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      errorType: 'membership_feedback_error'
    });
  }
};

// ===============================================
// SMS CONTROLLERS
// ===============================================

// Send single SMS
export const sendSMSHandler = async (req, res) => {
  try {
    const { 
      phone, 
      message, 
      template, 
      customData = {},
      options = {}
    } = req.body;

    // Validation
    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required',
        field: 'phone'
      });
    }

    if (!message && !template) {
      return res.status(400).json({
        success: false,
        error: 'SMS message or template is required',
        fields: ['message', 'template']
      });
    }

    // Check authorization for admin SMS
    const adminTemplates = ['adminAlert', 'systemMaintenance', 'emergencyAlert'];
    if (adminTemplates.includes(template) && !['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions for admin SMS templates'
      });
    }

    const smsData = {
      to: phone,
      message,
      template,
      customData: {
        ...customData,
        senderName: req.user.username,
        senderId: req.user.id
      },
      options,
      requestingUser: req.user
    };

    const result = await sendSMSService(smsData);

    res.status(200).json({
      success: true,
      data: result,
      message: 'SMS sent successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in sendSMSHandler:', error);
    
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      errorType: 'sms_send_error'
    });
  }
};

// Send bulk SMS (admin only)
export const sendBulkSMSHandler = async (req, res) => {
  try {
    // Admin authorization check
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied - admin privileges required for bulk SMS operations'
      });
    }

    const { 
      recipients, 
      message, 
      template, 
      customData = {},
      options = {}
    } = req.body;

    // Validation
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Recipients array is required',
        field: 'recipients'
      });
    }

    if (recipients.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 500 recipients allowed per bulk SMS operation'
      });
    }

    const bulkSMSData = {
      recipients,
      message,
      template,
      customData: {
        ...customData,
        senderName: req.user.username,
        senderId: req.user.id
      },
      options: {
        batchSize: Math.min(options.batchSize || 20, 50),
        delay: Math.max(options.delay || 2000, 1000),
        ...options
      },
      requestingUser: req.user
    };

    const result = await sendBulkSMSService(bulkSMSData);

    res.status(200).json({
      success: true,
      data: result,
      message: `Bulk SMS operation completed: ${result.successful}/${result.total} successful`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in sendBulkSMSHandler:', error);
    
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      errorType: 'bulk_sms_error'
    });
  }
};

// ===============================================
// NOTIFICATION CONTROLLERS
// ===============================================

// Send combined notification (email + SMS)
export const sendNotificationHandler = async (req, res) => {
  try {
    const { 
      userId, 
      userEmail, 
      userPhone,
      username,
      template, 
      customData = {},
      channels = ['email'],
      options = {}
    } = req.body;

    // Validation
    if (!userId && !userEmail && !userPhone) {
      return res.status(400).json({
        success: false,
        error: 'User identification required',
        fields: ['userId', 'userEmail', 'userPhone']
      });
    }

    if (!template) {
      return res.status(400).json({
        success: false,
        error: 'Notification template is required',
        field: 'template'
      });
    }

    // Check authorization for admin notifications
    const adminTemplates = ['adminNotification', 'adminAlert', 'systemMaintenance', 'emergencyAlert'];
    if (adminTemplates.includes(template) && !['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions for admin notification templates'
      });
    }

    const notificationData = {
      userId,
      userEmail,
      userPhone,
      username,
      template,
      customData: {
        ...customData,
        senderName: req.user.username,
        senderId: req.user.id
      },
      channels,
      options,
      requestingUser: req.user
    };

    const result = await sendNotificationService(notificationData);

    res.status(200).json({
      success: true,
      data: result,
      message: `Notification sent via ${result.channels?.join(', ') || 'specified channels'}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in sendNotificationHandler:', error);
    
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      errorType: 'notification_error'
    });
  }
};

// Send bulk notifications (admin only)
export const sendBulkNotificationHandler = async (req, res) => {
  try {
    // Admin authorization check
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied - admin privileges required for bulk notification operations'
      });
    }

    const { 
      recipients, 
      template, 
      customData = {},
      channels = ['email'],
      options = {}
    } = req.body;

    // Validation
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Recipients array is required',
        field: 'recipients'
      });
    }

    if (recipients.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 1000 recipients allowed per bulk notification operation'
      });
    }

    const bulkNotificationData = {
      recipients,
      template,
      customData: {
        ...customData,
        senderName: req.user.username,
        senderId: req.user.id
      },
      channels,
      options: {
        batchSize: Math.min(options.batchSize || 25, 50),
        delay: Math.max(options.delay || 1500, 1000),
        ...options
      },
      requestingUser: req.user
    };

    const result = await sendBulkNotificationService(bulkNotificationData);

    res.status(200).json({
      success: true,
      data: result,
      message: `Bulk notification completed: ${result.successful}/${result.total} successful`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in sendBulkNotificationHandler:', error);
    
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      errorType: 'bulk_notification_error'
    });
  }
};

// ===============================================
// COMMUNICATION SETTINGS CONTROLLERS
// ===============================================

// Get user communication settings
export const getCommunicationSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await getCommunicationSettingsService(userId);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Communication settings retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error in getCommunicationSettings:', error);
    
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      errorType: 'settings_retrieval_error'
    });
  }
};

// Update user communication settings
export const updateCommunicationSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const settingsData = req.body;

    // Basic validation
    const allowedFields = [
      'email_notifications',
      'sms_notifications', 
      'marketing_emails',
      'marketing_sms',
      'survey_notifications',
      'content_notifications',
      'admin_notifications',
      'preferred_language',
      'timezone'
    ];

    const updateData = {};
    Object.keys(settingsData).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = settingsData[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid settings provided',
        allowedFields
      });
    }

    const result = await updateCommunicationSettingsService(userId, updateData);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Communication settings updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in updateCommunicationSettings:', error);
    
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      errorType: 'settings_update_error'
    });
  }
};

// ===============================================
// TEMPLATE MANAGEMENT CONTROLLERS
// ===============================================

// Get available communication templates
export const getCommunicationTemplates = async (req, res) => {
  try {
    const { type } = req.query; // 'email', 'sms', or 'all'
    
    const result = await getAvailableTemplatesService(type);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Communication templates retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error in getCommunicationTemplates:', error);
    
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      errorType: 'template_retrieval_error'
    });
  }
};

// Create communication template (admin only)
export const createCommunicationTemplate = async (req, res) => {
  try {
    // Admin authorization check
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied - admin privileges required for template management'
      });
    }

    const { 
      templateName, 
      templateType, 
      subject, 
      emailBody, 
      smsMessage,
      variables = [],
      isActive = true
    } = req.body;

    // Validation
    if (!templateName || !templateType) {
      return res.status(400).json({
        success: false,
        error: 'Template name and type are required',
        fields: ['templateName', 'templateType']
      });
    }

    if (templateType === 'email' && (!subject || !emailBody)) {
      return res.status(400).json({
        success: false,
        error: 'Subject and email body are required for email templates',
        fields: ['subject', 'emailBody']
      });
    }

    if (templateType === 'sms' && !smsMessage) {
      return res.status(400).json({
        success: false,
        error: 'SMS message is required for SMS templates',
        field: 'smsMessage'
      });
    }

    const templateData = {
      templateName,
      templateType,
      subject,
      emailBody,
      smsMessage,
      variables,
      isActive,
      createdBy: req.user.id
    };

    const result = await createCommunicationTemplateService(templateData);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Communication template created successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in createCommunicationTemplate:', error);
    
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      errorType: 'template_creation_error'
    });
  }
};

// ===============================================
// SYSTEM HEALTH & STATISTICS CONTROLLERS
// ===============================================

// Check communication system health (admin only)
export const checkCommunicationHealth = async (req, res) => {
  try {
    // Admin authorization check
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied - admin privileges required for health checks'
      });
    }

    const result = await checkCommunicationHealthService();

    const statusCode = result.services.email?.success && result.services.sms?.success ? 200 : 206;

    res.status(statusCode).json({
      success: true,
      data: result,
      overall_health: statusCode === 200 ? 'healthy' : 'partially_degraded',
      message: 'Communication health check completed',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in checkCommunicationHealth:', error);
    
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      errorType: 'health_check_error'
    });
  }
};

// Get communication statistics (admin only)
export const getCommunicationStats = async (req, res) => {
  try {
    // Admin authorization check
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied - admin privileges required for communication statistics'
      });
    }

    const { 
      startDate, 
      endDate, 
      type, 
      granularity = 'day' 
    } = req.query;

    // Validate date range if provided
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        success: false,
        error: 'Start date must be before end date'
      });
    }

    const filters = {
      startDate,
      endDate,
      type,
      granularity
    };

    const result = await getCommunicationStatsService(filters);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Communication statistics retrieved successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in getCommunicationStats:', error);
    
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      errorType: 'stats_retrieval_error'
    });
  }
};

// ===============================================
// TESTING & DEBUGGING CONTROLLERS
// ===============================================

// Test communication services
export const testCommunicationServices = async (req, res) => {
  try {
    // Admin authorization check for comprehensive testing
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied - admin privileges required for service testing'
      });
    }

    const { services = ['email', 'sms'] } = req.body;

    const result = await checkCommunicationHealthService();

    // Add additional test information
    const testResults = {
      ...result,
      requestedTests: services,
      testTime: new Date().toISOString(),
      tester: req.user.username
    };

    res.status(200).json({
      success: true,
      data: testResults,
      message: 'Communication services tested successfully'
    });

  } catch (error) {
    console.error('❌ Error in testCommunicationServices:', error);
    
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      errorType: 'service_test_error'
    });
  }
};

// Get communication configuration (admin only)
export const getCommunicationConfig = async (req, res) => {
  try {
    // Admin authorization check
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied - admin privileges required for configuration access'
      });
    }

    const { getEmailConfig } = await import('../utils/email.js');
    const { getSMSConfig } = await import('../utils/sms.js');

    const config = {
      email: getEmailConfig(),
      sms: getSMSConfig(),
      features: {
        bulkEmail: true,
        bulkSMS: true,
        templates: true,
        userPreferences: true,
        auditLogging: true
      },
      limits: {
        bulkEmailMaxRecipients: 1000,
        bulkSMSMaxRecipients: 500,
        emailBatchSize: 50,
        smsBatchSize: 20
      }
    };

    res.status(200).json({
      success: true,
      data: config,
      message: 'Communication configuration retrieved successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in getCommunicationConfig:', error);
    
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      errorType: 'config_retrieval_error'
    });
  }
};