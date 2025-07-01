import db from '../config/db.js';
import {
  sendEmail,
  sendSMSService,
  sendBulkEmailService,
  sendBulkSMSService,
  sendNotification,
  checkCommunicationHealth,
  getCommunicationStats,
  getAvailableTemplates
} from '../services/communicationServices.js';

// Enhanced sendEmailHandler with validation and authorization
export const sendEmailHandler = async (req, res) => {
  try {
    const requestingUser = req.user;
    const { 
      email, 
      subject, 
      content, 
      template, 
      status, 
      customData = {},
      options = {}
    } = req.body;

    // Basic validation
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email recipient is required',
        message: 'Please provide a valid email address'
      });
    }

    if (!subject && !template) {
      return res.status(400).json({
        success: false,
        error: 'Email subject or template is required',
        message: 'Please provide either a subject or a template'
      });
    }

    // Authorization check for bulk operations or admin templates
    const adminTemplates = ['adminNotification', 'bulk'];
    if (adminTemplates.some(t => template?.includes(t)) && !['admin', 'super_admin'].includes(requestingUser.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only administrators can send admin emails'
      });
    }

    // Prepare email data
    const emailData = {
      to: email,
      subject,
      content,
      template,
      status,
      customData: {
        ...customData,
        senderName: requestingUser.username,
        senderId: requestingUser.user_id
      },
      options
    };

    const result = await sendEmail(emailData);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Email sent successfully'
    });

  } catch (error) {
    console.error('Error in sendEmailHandler:', error);
    
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: error.message,
      message: 'Failed to send email'
    });
  }
};

// Enhanced sendSMSHandler
export const sendSMSHandler = async (req, res) => {
  try {
    const requestingUser = req.user;
    const { 
      phone, 
      message, 
      template, 
      customData = {},
      options = {}
    } = req.body;

    // Basic validation
    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required',
        message: 'Please provide a valid phone number'
      });
    }

    if (!message && !template) {
      return res.status(400).json({
        success: false,
        error: 'SMS message or template is required',
        message: 'Please provide either a message or a template'
      });
    }

    // Authorization check for admin SMS
    const adminTemplates = ['adminAlert', 'maintenance'];
    if (adminTemplates.includes(template) && !['admin', 'super_admin'].includes(requestingUser.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only administrators can send admin SMS'
      });
    }

    // Prepare SMS data
    const smsData = {
      to: phone,
      message,
      template,
      customData: {
        ...customData,
        senderName: requestingUser.username,
        senderId: requestingUser.user_id
      },
      options
    };

    const result = await sendSMSService(smsData);

    res.status(200).json({
      success: true,
      data: result,
      message: 'SMS sent successfully'
    });

  } catch (error) {
    console.error('Error in sendSMSHandler:', error);
    
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: error.message,
      message: 'Failed to send SMS'
    });
  }
};

// Bulk email handler
export const sendBulkEmailHandler = async (req, res) => {
  try {
    const requestingUser = req.user;

    // Authorization check - only admins can send bulk emails
    if (!['admin', 'super_admin'].includes(requestingUser.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only administrators can send bulk emails'
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

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Recipients array is required',
        message: 'Please provide an array of email addresses'
      });
    }

    if (recipients.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Too many recipients',
        message: 'Maximum 1000 recipients allowed per bulk email'
      });
    }

    const bulkEmailData = {
      recipients,
      subject,
      content,
      template,
      customData: {
        ...customData,
        senderName: requestingUser.username,
        senderId: requestingUser.user_id
      },
      options: {
        ...options,
        batchSize: options.batchSize || 50,
        delay: options.delay || 1000
      }
    };

    const result = await sendBulkEmailService(bulkEmailData);

    res.status(200).json({
      success: true,
      data: result,
      message: `Bulk email completed: ${result.successful} successful, ${result.failed} failed`
    });

  } catch (error) {
    console.error('Error in sendBulkEmailHandler:', error);
    
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: error.message,
      message: 'Failed to send bulk emails'
    });
  }
};

// Bulk SMS handler
export const sendBulkSMSHandler = async (req, res) => {
  try {
    const requestingUser = req.user;

    // Authorization check - only admins can send bulk SMS
    if (!['admin', 'super_admin'].includes(requestingUser.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only administrators can send bulk SMS'
      });
    }

    const { 
      recipients, 
      message, 
      template, 
      customData = {},
      options = {}
    } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Recipients array is required',
        message: 'Please provide an array of phone numbers'
      });
    }

    if (recipients.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Too many recipients',
        message: 'Maximum 500 recipients allowed per bulk SMS'
      });
    }

    const bulkSMSData = {
      recipients,
      message,
      template,
      customData: {
        ...customData,
        senderName: requestingUser.username,
        senderId: requestingUser.user_id
      },
      options: {
        ...options,
        batchSize: options.batchSize || 20,
        delay: options.delay || 2000
      }
    };

    const result = await sendBulkSMSService(bulkSMSData);

    res.status(200).json({
      success: true,
      data: result,
      message: `Bulk SMS completed: ${result.successful} successful, ${result.failed} failed`
    });

  } catch (error) {
    console.error('Error in sendBulkSMSHandler:', error);
    
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: error.message,
      message: 'Failed to send bulk SMS'
    });
  }
};

// Combined notification handler
export const sendNotificationHandler = async (req, res) => {
  try {
    const requestingUser = req.user;
    const { 
      userId, 
      userEmail, 
      userPhone,
      template, 
      customData = {},
      channels = ['email'],
      options = {}
    } = req.body;

    // Get user data
    let user;
    if (userId) {
      // Fetch user from database
      const [users] = await db.query('SELECT username, email, phone FROM users WHERE id = ?', [userId]);
      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
          message: 'No user found with the provided ID'
        });
      }
      user = users[0];
    } else if (userEmail || userPhone) {
      // Use provided contact info
      user = {
        username: customData.username || 'User',
        email: userEmail,
        phone: userPhone
      };
    } else {
      return res.status(400).json({
        success: false,
        error: 'User identification required',
        message: 'Please provide userId, userEmail, or userPhone'
      });
    }

    if (!template) {
      return res.status(400).json({
        success: false,
        error: 'Template is required',
        message: 'Please specify a notification template'
      });
    }

    // Authorization check for admin notifications
    const adminTemplates = ['adminNotification', 'adminAlert', 'maintenance'];
    if (adminTemplates.includes(template) && !['admin', 'super_admin'].includes(requestingUser.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only administrators can send admin notifications'
      });
    }

    const notificationData = {
      user,
      template,
      customData: {
        ...customData,
        senderName: requestingUser.username,
        senderId: requestingUser.user_id
      },
      channels,
      options
    };

    const result = await sendNotification(notificationData);

    res.status(200).json({
      success: true,
      data: result,
      message: `Notification sent via ${result.channels.join(', ')}`
    });

  } catch (error) {
    console.error('Error in sendNotificationHandler:', error);
    
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: error.message,
      message: 'Failed to send notification'
    });
  }
};

// Communication health check handler
export const checkCommunicationHealthHandler = async (req, res) => {
  try {
    const requestingUser = req.user;

    // Authorization check - only admins can check health
    if (!['admin', 'super_admin'].includes(requestingUser.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only administrators can check communication health'
      });
    }

    const result = await checkCommunicationHealth();

    const overallHealth = result.services.email?.success && result.services.sms?.success;

    res.status(200).json({
      success: true,
      data: result,
      overall_health: overallHealth ? 'healthy' : 'degraded',
      message: 'Communication health check completed'
    });

  } catch (error) {
    console.error('Error in checkCommunicationHealthHandler:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to check communication health'
    });
  }
};

// Communication statistics handler
export const getCommunicationStatsHandler = async (req, res) => {
  try {
    const requestingUser = req.user;

    // Authorization check - only admins can view stats
    if (!['admin', 'super_admin'].includes(requestingUser.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only administrators can view communication statistics'
      });
    }

    const { startDate, endDate, type } = req.query;

    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (type) filters.type = type;

    const result = await getCommunicationStats(filters);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Communication statistics retrieved successfully'
    });

  } catch (error) {
    console.error('Error in getCommunicationStatsHandler:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to get communication statistics'
    });
  }
};

// Get available templates handler
export const getAvailableTemplatesHandler = async (req, res) => {
  try {
    const templates = getAvailableTemplates();

    res.status(200).json({
      success: true,
      data: templates,
      message: 'Available templates retrieved successfully'
    });

  } catch (error) {
    console.error('Error in getAvailableTemplatesHandler:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to get available templates'
    });
  }
};