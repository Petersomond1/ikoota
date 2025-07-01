import { sendEmail as sendEmailUtil, sendBulkEmail, emailTemplates, testEmailConnection } from '../utils/email.js';
import { sendSMS, sendBulkSMS, smsTemplates, testSMSConnection } from '../utils/sms.js';
import db from '../config/db.js';
import CustomError from '../utils/CustomError.js';

// Enhanced email service with template support
export const sendEmail = async (emailData) => {
  try {
    const { to, template, status, customData = {}, options = {} } = emailData;

    if (!to) {
      throw new CustomError('Recipient email is required', 400);
    }

    let subject, content;

    // Handle template-based emails
    if (template) {
      const templateData = getEmailTemplate(template, status, customData);
      subject = templateData.subject;
      content = templateData;
    } else {
      // Handle custom emails
      subject = emailData.subject;
      content = emailData.content || emailData.text;
    }

    if (!subject || !content) {
      throw new CustomError('Email subject and content are required', 400);
    }

    const result = await sendEmailUtil(to, subject, content, options);

    // Log email activity
    await logEmailActivity({
      recipient: to,
      subject,
      template: template || 'custom',
      status: 'sent',
      messageId: result.messageId
    });

    return result;

  } catch (error) {
    console.error('Error in sendEmail service:', error);
    
    // Log failed email
    if (emailData.to) {
      await logEmailActivity({
        recipient: emailData.to,
        subject: emailData.subject || 'Unknown',
        template: emailData.template || 'custom',
        status: 'failed',
        error: error.message
      });
    }

    throw new CustomError(error.message || 'Failed to send email');
  }
};

// Enhanced SMS service
export const sendSMSService = async (smsData) => {
  try {
    const { to, template, customData = {}, options = {} } = smsData;

    if (!to) {
      throw new CustomError('Recipient phone number is required', 400);
    }

    let message;

    // Handle template-based SMS
    if (template) {
      message = getSMSTemplate(template, customData);
    } else {
      message = smsData.message;
    }

    if (!message) {
      throw new CustomError('SMS message is required', 400);
    }

    const result = await sendSMS(to, message, options);

    // Log SMS activity
    await logSMSActivity({
      recipient: to,
      message: message.substring(0, 100) + '...', // Truncate for logging
      template: template || 'custom',
      status: 'sent',
      sid: result.sid
    });

    return result;

  } catch (error) {
    console.error('Error in sendSMS service:', error);
    
    // Log failed SMS
    if (smsData.to) {
      await logSMSActivity({
        recipient: smsData.to,
        message: smsData.message || 'Unknown',
        template: smsData.template || 'custom',
        status: 'failed',
        error: error.message
      });
    }

    throw new CustomError(error.message || 'Failed to send SMS');
  }
};

// Template resolver for emails
const getEmailTemplate = (template, status, customData) => {
  const { username, contentType, contentTitle, resetLink, actionUrl, remarks } = customData;

  switch (template) {
    case 'welcome':
      return emailTemplates.welcome(username);
    
    case 'surveyApproval':
    case 'approveverifyinfo':
      return emailTemplates.surveyApproval(username, status, remarks);
    
    case 'contentNotification':
      return emailTemplates.contentNotification(username, contentType, contentTitle, status);
    
    case 'passwordReset':
      return emailTemplates.passwordReset(username, resetLink);
    
    case 'adminNotification':
      return emailTemplates.adminNotification(customData.title, customData.message, actionUrl);
    
    default:
      throw new CustomError(`Unknown email template: ${template}`, 400);
  }
};

// Template resolver for SMS
const getSMSTemplate = (template, customData) => {
  const { username, status, code, contentType, message, startTime, duration } = customData;

  switch (template) {
    case 'welcome':
      return smsTemplates.welcome(username);
    
    case 'surveyApproval':
      return smsTemplates.surveyApproval(username, status);
    
    case 'verificationCode':
      return smsTemplates.verificationCode(code);
    
    case 'passwordReset':
      return smsTemplates.passwordReset(username);
    
    case 'contentNotification':
      return smsTemplates.contentNotification(username, contentType, status);
    
    case 'adminAlert':
      return smsTemplates.adminAlert(message);
    
    case 'maintenance':
      return smsTemplates.maintenanceNotification(startTime, duration);
    
    default:
      throw new CustomError(`Unknown SMS template: ${template}`, 400);
  }
};

// Bulk email service
export const sendBulkEmailService = async (bulkEmailData) => {
  try {
    const { recipients, template, customData = {}, options = {} } = bulkEmailData;

    if (!Array.isArray(recipients) || recipients.length === 0) {
      throw new CustomError('Recipients array is required', 400);
    }

    const { subject, content } = template ? 
      getEmailTemplate(template, customData.status, customData) : 
      { subject: bulkEmailData.subject, content: bulkEmailData.content };

    const result = await sendBulkEmail(recipients, subject, content, options);

    // Log bulk email activity
    await logBulkEmailActivity({
      recipients: recipients.length,
      subject,
      template: template || 'custom',
      successful: result.successful,
      failed: result.failed
    });

    return result;

  } catch (error) {
    console.error('Error in sendBulkEmail service:', error);
    throw new CustomError(error.message || 'Failed to send bulk emails');
  }
};

// Bulk SMS service
export const sendBulkSMSService = async (bulkSMSData) => {
  try {
    const { recipients, template, customData = {}, options = {} } = bulkSMSData;

    if (!Array.isArray(recipients) || recipients.length === 0) {
      throw new CustomError('Recipients array is required', 400);
    }

    const message = template ? 
      getSMSTemplate(template, customData) : 
      bulkSMSData.message;

    const result = await sendBulkSMS(recipients, message, options);

    // Log bulk SMS activity
    await logBulkSMSActivity({
      recipients: recipients.length,
      message: message.substring(0, 100) + '...',
      template: template || 'custom',
      successful: result.successful,
      failed: result.failed
    });

    return result;

  } catch (error) {
    console.error('Error in sendBulkSMS service:', error);
    throw new CustomError(error.message || 'Failed to send bulk SMS');
  }
};

// Combined notification service (email + SMS)
export const sendNotification = async (notificationData) => {
  try {
    const { 
      user, 
      template, 
      customData = {}, 
      channels = ['email'], 
      options = {} 
    } = notificationData;

    if (!user || (!user.email && !user.phone)) {
      throw new CustomError('User with email or phone is required', 400);
    }

    const results = {};

    // Send email if requested and user has email
    if (channels.includes('email') && user.email) {
      try {
        results.email = await sendEmail({
          to: user.email,
          template,
          customData: { ...customData, username: user.username },
          options: options.email || {}
        });
      } catch (error) {
        results.email = { success: false, error: error.message };
      }
    }

    // Send SMS if requested and user has phone
    if (channels.includes('sms') && user.phone) {
      try {
        results.sms = await sendSMSService({
          to: user.phone,
          template,
          customData: { ...customData, username: user.username },
          options: options.sms || {}
        });
      } catch (error) {
        results.sms = { success: false, error: error.message };
      }
    }

    return {
      success: true,
      results,
      channels: Object.keys(results)
    };

  } catch (error) {
    console.error('Error in sendNotification service:', error);
    throw new CustomError(error.message || 'Failed to send notification');
  }
};

// Communication health check
export const checkCommunicationHealth = async () => {
  try {
    const results = {};

    // Test email connection
    try {
      results.email = await testEmailConnection();
    } catch (error) {
      results.email = { success: false, error: error.message };
    }

    // Test SMS connection
    try {
      results.sms = await testSMSConnection();
    } catch (error) {
      results.sms = { success: false, error: error.message };
    }

    return {
      success: true,
      services: results,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error in communication health check:', error);
    throw new CustomError('Failed to check communication health');
  }
};

// Activity logging functions
const logEmailActivity = async (activityData) => {
  try {
    const sql = `
      INSERT INTO email_logs (recipient, subject, template, status, message_id, error_message, sender_id, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    
    await db.query(sql, [
      activityData.recipient,
      activityData.subject,
      activityData.template,
      activityData.status,
      activityData.messageId || null,
      activityData.error || null,
      parseInt(activityData.senderId) || null // Convert to INT
    ]);
  } catch (error) {
    console.error('Failed to log email activity:', error);
  }
};

const logSMSActivity = async (activityData) => {
  try {
    const sql = `
      INSERT INTO sms_logs (recipient, message, template, status, sid, error_message, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;
    
    await db.query(sql, [
      activityData.recipient,
      activityData.message,
      activityData.template,
      activityData.status,
      activityData.sid || null,
      activityData.error || null
    ]);
  } catch (error) {
    console.error('Failed to log SMS activity:', error);
    // Don't throw error to avoid breaking the main flow
  }
};

const logBulkEmailActivity = async (activityData) => {
  try {
    const sql = `
      INSERT INTO bulk_email_logs (recipients_count, subject, template, successful_count, failed_count, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;
    
    await db.query(sql, [
      activityData.recipients,
      activityData.subject,
      activityData.template,
      activityData.successful,
      activityData.failed
    ]);
  } catch (error) {
    console.error('Failed to log bulk email activity:', error);
  }
};

const logBulkSMSActivity = async (activityData) => {
  try {
    const sql = `
      INSERT INTO bulk_sms_logs (recipients_count, message, template, successful_count, failed_count, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;
    
    await db.query(sql, [
      activityData.recipients,
      activityData.message,
      activityData.template,
      activityData.successful,
      activityData.failed
    ]);
  } catch (error) {
    console.error('Failed to log bulk SMS activity:', error);
  }
};

// Get communication statistics
export const getCommunicationStats = async (filters = {}) => {
  try {
    const { startDate, endDate, type } = filters;
    
    let emailStats = {};
    let smsStats = {};

    if (!type || type === 'email') {
      try {
        const emailSql = `
          SELECT 
            COUNT(*) as total_emails,
            SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as successful_emails,
            SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_emails,
            COUNT(DISTINCT template) as unique_templates
          FROM email_logs
          ${startDate && endDate ? 'WHERE created_at BETWEEN ? AND ?' : ''}
        `;
        
        const params = startDate && endDate ? [startDate, endDate] : [];
        const emailRows = await db.query(emailSql, params);
        emailStats = emailRows[0] || {};
      } catch (error) {
        console.error('Error fetching email stats:', error);
        emailStats = { error: 'Email logs table not available' };
      }
    }

    if (!type || type === 'sms') {
      try {
        const smsSql = `
          SELECT 
            COUNT(*) as total_sms,
            SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as successful_sms,
            SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_sms,
            COUNT(DISTINCT template) as unique_templates
          FROM sms_logs
          ${startDate && endDate ? 'WHERE created_at BETWEEN ? AND ?' : ''}
        `;
        
        const params = startDate && endDate ? [startDate, endDate] : [];
        const [smsRows] = await db.query(smsSql, params);
        smsStats = smsRows[0] || {};
      } catch (error) {
        console.error('Error fetching SMS stats:', error);
        smsStats = { error: 'SMS logs table not available' };
      }
    }

    return {
      success: true,
      email: emailStats,
      sms: smsStats,
      period: { startDate, endDate },
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error in getCommunicationStats:', error);
    throw new CustomError('Failed to get communication statistics');
  }
};

// Get available email templates
export const getAvailableTemplates = () => {
  return {
    email: {
      welcome: 'Welcome email for new users',
      surveyApproval: 'Survey approval/rejection notification',
      contentNotification: 'Content status update notification',
      passwordReset: 'Password reset instructions',
      adminNotification: 'Admin alert notification'
    },
    sms: {
      welcome: 'Welcome SMS for new users',
      surveyApproval: 'Survey approval/rejection SMS',
      verificationCode: 'Verification code SMS',
      passwordReset: 'Password reset alert SMS',
      contentNotification: 'Content status update SMS',
      adminAlert: 'Admin alert SMS',
      maintenance: 'Maintenance notification SMS'
    }
  };
};