// ikootaapi/services/communicationServices.js
// REORGANIZED COMMUNICATION SERVICES
// Complete service layer for email, SMS, notifications with database integration

import { sendEmail as sendEmailUtil, sendBulkEmail, testEmailConnection, getEmailConfig } from '../utils/email.js';
import { sendSMS, sendBulkSMS, testSMSConnection, getSMSConfig } from '../utils/sms.js';
import db from '../config/db.js';
import CustomError from '../utils/CustomError.js';

// ===============================================
// EMAIL SERVICES
// ===============================================

// Enhanced email service with comprehensive logging
export const sendEmailService = async (emailData) => {
  try {
    const { to, subject, content, template, customData = {}, options = {}, requestingUser } = emailData;

    if (!to) {
      throw new CustomError('Recipient email is required', 400);
    }

    let emailSubject, emailContent;

    // Handle template-based emails
    if (template) {
      const templateData = await getEmailTemplateData(template, customData);
      emailSubject = templateData.subject;
      emailContent = templateData.content;
    } else {
      emailSubject = subject;
      emailContent = content;
    }

    if (!emailSubject || !emailContent) {
      throw new CustomError('Email subject and content are required', 400);
    }

    // Send email using utility
    const result = await sendEmailUtil(to, emailSubject, emailContent, options);

    // Log email activity in database
    await logEmailActivity({
      recipient: to,
      subject: emailSubject,
      template: template || 'custom',
      status: 'sent',
      messageId: result.messageId,
      senderId: requestingUser?.id
    });

    // Update user communication stats if applicable
    if (requestingUser) {
      await updateUserCommunicationStats(requestingUser.id, 'email', 'sent');
    }

    return {
      success: true,
      messageId: result.messageId,
      recipient: to,
      template: template || 'custom',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error in sendEmailService:', error);

    // Log failed email
    if (emailData.to) {
      await logEmailActivity({
        recipient: emailData.to,
        subject: emailData.subject || 'Unknown',
        template: emailData.template || 'custom',
        status: 'failed',
        errorMessage: error.message,
        senderId: emailData.requestingUser?.id
      });
    }

    throw new CustomError(error.message || 'Failed to send email', error.statusCode || 500);
  }
};

// Bulk email service
export const sendBulkEmailService = async (bulkEmailData) => {
  try {
    const { recipients, subject, content, template, customData = {}, options = {}, requestingUser } = bulkEmailData;

    if (!Array.isArray(recipients) || recipients.length === 0) {
      throw new CustomError('Recipients array is required and cannot be empty', 400);
    }

    if (recipients.length > 1000) {
      throw new CustomError('Maximum 1000 recipients allowed per bulk operation', 400);
    }

    let emailSubject, emailContent;

    // Handle template-based bulk emails
    if (template) {
      const templateData = await getEmailTemplateData(template, customData);
      emailSubject = templateData.subject;
      emailContent = templateData.content;
    } else {
      emailSubject = subject;
      emailContent = content;
    }

    // Send bulk email using utility
    const result = await sendBulkEmail(recipients, emailSubject, emailContent, {
      batchSize: Math.min(options.batchSize || 50, 100),
      delay: Math.max(options.delay || 1000, 500),
      ...options
    });

    // Log bulk email activity
    await logBulkEmailActivity({
      recipientsCount: recipients.length,
      subject: emailSubject,
      template: template || 'custom',
      successfulCount: result.successful,
      failedCount: result.failed,
      senderId: requestingUser?.id
    });

    // Update admin communication stats
    if (requestingUser) {
      await updateUserCommunicationStats(requestingUser.id, 'bulk_email', 'sent', result.successful);
    }

    return {
      success: true,
      total: recipients.length,
      successful: result.successful,
      failed: result.failed,
      template: template || 'custom',
      results: result.results,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error in sendBulkEmailService:', error);

    // Log failed bulk email operation
    await logBulkEmailActivity({
      recipientsCount: bulkEmailData.recipients?.length || 0,
      subject: bulkEmailData.subject || 'Unknown',
      template: bulkEmailData.template || 'custom',
      successfulCount: 0,
      failedCount: bulkEmailData.recipients?.length || 0,
      senderId: bulkEmailData.requestingUser?.id,
      errorMessage: error.message
    });

    throw new CustomError(error.message || 'Failed to send bulk emails', error.statusCode || 500);
  }
};

// Special membership feedback email service
export const sendMembershipFeedbackEmailService = async (feedbackData) => {
  try {
    const { 
      recipientEmail, 
      applicantName, 
      feedbackMessage, 
      applicationStatus,
      membershipTicket,
      senderName,
      senderId
    } = feedbackData;

    // Create membership feedback email content
    const subject = `Membership Application Feedback - ${applicationStatus || 'Update'}`;
    
    const content = {
      text: `Dear ${applicantName},\n\n${feedbackMessage}\n\n${membershipTicket ? `Application Ticket: ${membershipTicket}\n\n` : ''}Best regards,\n${senderName || 'Ikoota Team'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h2>Membership Application Feedback</h2>
          </div>
          <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
            <p>Dear <strong>${applicantName}</strong>,</p>
            <div style="background: white; padding: 15px; border-radius: 4px; margin: 15px 0;">
              <p>${feedbackMessage.replace(/\n/g, '<br>')}</p>
            </div>
            ${membershipTicket ? `<p><strong>Application Ticket:</strong> ${membershipTicket}</p>` : ''}
            <p>Best regards,<br><strong>${senderName || 'Ikoota Team'}</strong></p>
          </div>
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #666;">
            <p>© ${new Date().getFullYear()} Ikoota Platform. All rights reserved.</p>
          </div>
        </div>
      `
    };

    // Send the email
    const result = await sendEmailUtil(recipientEmail, subject, content);

    // Log membership feedback email
    await logEmailActivity({
      recipient: recipientEmail,
      subject,
      template: 'membership_feedback',
      status: 'sent',
      messageId: result.messageId,
      senderId: senderId,
      specialNote: `Feedback for ${applicantName} - ${applicationStatus || 'Update'}`
    });

    return {
      success: true,
      messageId: result.messageId,
      recipient: recipientEmail,
      applicant: applicantName,
      status: applicationStatus,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error in sendMembershipFeedbackEmailService:', error);

    // Log failed membership feedback email
    await logEmailActivity({
      recipient: feedbackData.recipientEmail,
      subject: 'Membership Feedback Email',
      template: 'membership_feedback',
      status: 'failed',
      errorMessage: error.message,
      senderId: feedbackData.senderId
    });

    throw new CustomError(error.message || 'Failed to send membership feedback email', error.statusCode || 500);
  }
};

// ===============================================
// SMS SERVICES
// ===============================================

// Enhanced SMS service
export const sendSMSService = async (smsData) => {
  try {
    const { to, message, template, customData = {}, options = {}, requestingUser } = smsData;

    if (!to) {
      throw new CustomError('Recipient phone number is required', 400);
    }

    let smsMessage;

    // Handle template-based SMS
    if (template) {
      smsMessage = await getSMSTemplateData(template, customData);
    } else {
      smsMessage = message;
    }

    if (!smsMessage) {
      throw new CustomError('SMS message is required', 400);
    }

    // Send SMS using utility
    const result = await sendSMS(to, smsMessage, options);

    // Log SMS activity
    await logSMSActivity({
      recipient: to,
      message: smsMessage.substring(0, 100) + (smsMessage.length > 100 ? '...' : ''),
      template: template || 'custom',
      status: 'sent',
      sid: result.sid,
      senderId: requestingUser?.id
    });

    // Update user communication stats
    if (requestingUser) {
      await updateUserCommunicationStats(requestingUser.id, 'sms', 'sent');
    }

    return {
      success: true,
      sid: result.sid,
      recipient: to,
      template: template || 'custom',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error in sendSMSService:', error);

    // Log failed SMS
    if (smsData.to) {
      await logSMSActivity({
        recipient: smsData.to,
        message: smsData.message || 'Unknown',
        template: smsData.template || 'custom',
        status: 'failed',
        errorMessage: error.message,
        senderId: smsData.requestingUser?.id
      });
    }

    throw new CustomError(error.message || 'Failed to send SMS', error.statusCode || 500);
  }
};

// Bulk SMS service
export const sendBulkSMSService = async (bulkSMSData) => {
  try {
    const { recipients, message, template, customData = {}, options = {}, requestingUser } = bulkSMSData;

    if (!Array.isArray(recipients) || recipients.length === 0) {
      throw new CustomError('Recipients array is required and cannot be empty', 400);
    }

    if (recipients.length > 500) {
      throw new CustomError('Maximum 500 recipients allowed per bulk SMS operation', 400);
    }

    let smsMessage;

    // Handle template-based bulk SMS
    if (template) {
      smsMessage = await getSMSTemplateData(template, customData);
    } else {
      smsMessage = message;
    }

    // Send bulk SMS using utility
    const result = await sendBulkSMS(recipients, smsMessage, {
      batchSize: Math.min(options.batchSize || 20, 50),
      delay: Math.max(options.delay || 2000, 1000),
      ...options
    });

    // Log bulk SMS activity
    await logBulkSMSActivity({
      recipientsCount: recipients.length,
      message: smsMessage.substring(0, 100) + (smsMessage.length > 100 ? '...' : ''),
      template: template || 'custom',
      successfulCount: result.successful,
      failedCount: result.failed,
      senderId: requestingUser?.id
    });

    // Update admin communication stats
    if (requestingUser) {
      await updateUserCommunicationStats(requestingUser.id, 'bulk_sms', 'sent', result.successful);
    }

    return {
      success: true,
      total: recipients.length,
      successful: result.successful,
      failed: result.failed,
      template: template || 'custom',
      results: result.results,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error in sendBulkSMSService:', error);

    // Log failed bulk SMS operation
    await logBulkSMSActivity({
      recipientsCount: bulkSMSData.recipients?.length || 0,
      message: bulkSMSData.message || 'Unknown',
      template: bulkSMSData.template || 'custom',
      successfulCount: 0,
      failedCount: bulkSMSData.recipients?.length || 0,
      senderId: bulkSMSData.requestingUser?.id,
      errorMessage: error.message
    });

    throw new CustomError(error.message || 'Failed to send bulk SMS', error.statusCode || 500);
  }
};

// ===============================================
// NOTIFICATION SERVICES
// ===============================================

// Combined notification service (email + SMS based on user preferences)
export const sendNotificationService = async (notificationData) => {
  try {
    const { 
      userId, 
      userEmail, 
      userPhone, 
      username,
      template, 
      customData = {}, 
      channels = ['email'], 
      options = {},
      requestingUser
    } = notificationData;

    // Get user data and preferences
    let user;
    let userPreferences;

    if (userId) {
      // Fetch user from database
      const [users] = await db.query(`
        SELECT u.id, u.username, u.email, u.phone, u.converse_id,
               ucp.email_notifications, ucp.sms_notifications, ucp.marketing_emails, 
               ucp.marketing_sms, ucp.survey_notifications, ucp.content_notifications,
               ucp.admin_notifications, ucp.preferred_language, ucp.timezone
        FROM users u
        LEFT JOIN user_communication_preferences ucp ON u.id = ucp.user_id
        WHERE u.id = ?
      `, [userId]);

      if (users.length === 0) {
        throw new CustomError('User not found', 404);
      }

      user = users[0];
      userPreferences = {
        email_notifications: user.email_notifications,
        sms_notifications: user.sms_notifications,
        marketing_emails: user.marketing_emails,
        marketing_sms: user.marketing_sms,
        survey_notifications: user.survey_notifications,
        content_notifications: user.content_notifications,
        admin_notifications: user.admin_notifications,
        preferred_language: user.preferred_language || 'en',
        timezone: user.timezone || 'UTC'
      };
    } else {
      // Use provided contact info
      user = {
        username: username || 'User',
        email: userEmail,
        phone: userPhone
      };
      // Default preferences for external users
      userPreferences = {
        email_notifications: true,
        sms_notifications: false,
        marketing_emails: true,
        marketing_sms: false
      };
    }

    const results = {};
    const attemptedChannels = [];

    // Determine which channels to use based on template type and user preferences
    const effectiveChannels = determineEffectiveChannels(template, channels, userPreferences);

    // Send email if requested and user has email
    if (effectiveChannels.includes('email') && user.email) {
      attemptedChannels.push('email');
      try {
        const emailResult = await sendEmailService({
          to: user.email,
          template,
          customData: { 
            ...customData, 
            username: user.username,
            recipientId: user.id || userId
          },
          options: options.email || {},
          requestingUser
        });
        results.email = emailResult;
      } catch (error) {
        results.email = { success: false, error: error.message };
      }
    }

    // Send SMS if requested and user has phone
    if (effectiveChannels.includes('sms') && user.phone) {
      attemptedChannels.push('sms');
      try {
        const smsResult = await sendSMSService({
          to: user.phone,
          template,
          customData: { 
            ...customData, 
            username: user.username,
            recipientId: user.id || userId
          },
          options: options.sms || {},
          requestingUser
        });
        results.sms = smsResult;
      } catch (error) {
        results.sms = { success: false, error: error.message };
      }
    }

    // Check if at least one notification was successful
    const successfulChannels = Object.keys(results).filter(channel => results[channel].success);

    return {
      success: successfulChannels.length > 0,
      results,
      channels: attemptedChannels,
      successfulChannels,
      recipient: {
        username: user.username,
        email: user.email,
        phone: user.phone
      },
      template,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error in sendNotificationService:', error);
    throw new CustomError(error.message || 'Failed to send notification', error.statusCode || 500);
  }
};

// Bulk notification service
export const sendBulkNotificationService = async (bulkNotificationData) => {
  try {
    const { recipients, template, customData = {}, channels = ['email'], options = {}, requestingUser } = bulkNotificationData;

    if (!Array.isArray(recipients) || recipients.length === 0) {
      throw new CustomError('Recipients array is required and cannot be empty', 400);
    }

    if (recipients.length > 1000) {
      throw new CustomError('Maximum 1000 recipients allowed per bulk notification operation', 400);
    }

    const results = [];
    const batchSize = Math.min(options.batchSize || 25, 50);
    const delay = Math.max(options.delay || 1500, 1000);

    // Process recipients in batches
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (recipient) => {
        try {
          const result = await sendNotificationService({
            userId: recipient.userId,
            userEmail: recipient.email,
            userPhone: recipient.phone,
            username: recipient.username,
            template,
            customData: { 
              ...customData,
              recipientSpecificData: recipient.customData || {}
            },
            channels,
            options,
            requestingUser
          });
          return { recipient, success: true, result };
        } catch (error) {
          return { recipient, success: false, error: error.message };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map(r => r.value));

      // Add delay between batches
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    // Log bulk notification operation
    await logBulkNotificationActivity({
      recipientsCount: recipients.length,
      template,
      channels: channels.join(','),
      successfulCount: successful,
      failedCount: failed,
      senderId: requestingUser?.id
    });

    return {
      success: true,
      total: recipients.length,
      successful,
      failed,
      channels,
      template,
      results,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error in sendBulkNotificationService:', error);
    throw new CustomError(error.message || 'Failed to send bulk notifications', error.statusCode || 500);
  }
};

// ===============================================
// TEMPLATE MANAGEMENT SERVICES
// ===============================================

// Get email template data from database or predefined templates
const getEmailTemplateData = async (templateName, customData) => {
  try {
    // First try to get from database
    const [dbTemplates] = await db.query(
      'SELECT subject, body_html, body_text, variables FROM email_templates WHERE name = ? AND is_active = TRUE',
      [templateName]
    );

    if (dbTemplates.length > 0) {
      const template = dbTemplates[0];
      let { subject, body_html, body_text } = template;

      // Replace variables in template
      Object.entries(customData).forEach(([key, value]) => {
        const placeholder = new RegExp(`{{${key}}}`, 'g');
        subject = subject?.replace(placeholder, value || '') || subject;
        body_html = body_html?.replace(placeholder, value || '') || body_html;
        body_text = body_text?.replace(placeholder, value || '') || body_text;
      });

      return {
        subject,
        content: {
          text: body_text,
          html: body_html
        }
      };
    }

    // Fallback to predefined templates
    return getPredefinedEmailTemplate(templateName, customData);

  } catch (error) {
    console.error('❌ Error getting email template:', error);
    throw new CustomError(`Failed to get email template: ${templateName}`, 400);
  }
};

// Get SMS template data
const getSMSTemplateData = async (templateName, customData) => {
  try {
    // First try to get from database
    const [dbTemplates] = await db.query(
      'SELECT message, variables FROM sms_templates WHERE name = ? AND is_active = TRUE',
      [templateName]
    );

    if (dbTemplates.length > 0) {
      const template = dbTemplates[0];
      let { message } = template;

      // Replace variables in template
      Object.entries(customData).forEach(([key, value]) => {
        const placeholder = new RegExp(`{{${key}}}`, 'g');
        message = message?.replace(placeholder, value || '') || message;
      });

      return message;
    }

    // Fallback to predefined templates
    return getPredefinedSMSTemplate(templateName, customData);

  } catch (error) {
    console.error('❌ Error getting SMS template:', error);
    throw new CustomError(`Failed to get SMS template: ${templateName}`, 400);
  }
};

// Predefined email templates (fallback)
const getPredefinedEmailTemplate = (templateName, data) => {
  const templates = {
    welcome: {
      subject: `Welcome to Ikoota, ${data.username}!`,
      content: {
        text: `Hello ${data.username},\n\nWelcome to Ikoota Platform! Your account has been created successfully.\n\nApplication Ticket: ${data.applicationTicket || 'N/A'}\n\nNext steps:\n1. Complete your membership application\n2. Wait for application review\n3. Start exploring our content\n\nBest regards,\nThe Ikoota Team`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">Welcome to Ikoota Platform!</h2>
            <p>Hello <strong>${data.username}</strong>,</p>
            <p>Welcome to Ikoota Platform! Your account has been created successfully.</p>
            ${data.applicationTicket ? `<div style="background: #e8f4f8; padding: 15px; border-radius: 8px;"><strong>Application Ticket:</strong> ${data.applicationTicket}</div>` : ''}
            <h3>Next Steps:</h3>
            <ol><li>Complete your membership application</li><li>Wait for application review</li><li>Start exploring our content</li></ol>
            <p>Best regards,<br>The Ikoota Team</p>
          </div>
        `
      }
    },
    
    surveyApproval: {
      subject: `Membership Application ${data.status === 'approved' ? 'Approved' : 'Update'} - ${data.username}`,
      content: {
        text: `Hello ${data.username},\n\nYour membership application has been ${data.status}.\n\n${data.remarks || 'Thank you for your patience during the review process.'}\n\nBest regards,\nThe Ikoota Team`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: ${data.status === 'approved' ? '#10b981' : '#f59e0b'};">Membership Application ${data.status === 'approved' ? 'Approved' : 'Update'}</h2>
            <p>Hello <strong>${data.username}</strong>,</p>
            <p>Your membership application has been <strong>${data.status}</strong>.</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p>${data.remarks || 'Thank you for your patience during the review process.'}</p>
            </div>
            <p>Best regards,<br>The Ikoota Team</p>
          </div>
        `
      }
    },

    contentNotification: {
      subject: `Content Update: ${data.contentTitle || 'Your Content'}`,
      content: {
        text: `Hello ${data.username},\n\nYour ${data.contentType || 'content'} "${data.contentTitle || 'submission'}" has been ${data.status}.\n\nThank you for your contribution to Ikoota!\n\nBest regards,\nThe Ikoota Team`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">Content Update</h2>
            <p>Hello <strong>${data.username}</strong>,</p>
            <p>Your ${data.contentType || 'content'} "<strong>${data.contentTitle || 'submission'}</strong>" has been <strong>${data.status}</strong>.</p>
            <p>Thank you for your contribution to Ikoota!</p>
            <p>Best regards,<br>The Ikoota Team</p>
          </div>
        `
      }
    },

    passwordReset: {
      subject: 'Password Reset Request - Ikoota Platform',
      content: {
        text: `Hello ${data.username},\n\nA password reset was requested for your account.\n\nClick the link below to reset your password:\n${data.resetLink}\n\nThis link expires in 1 hour.\n\nIf you didn't request this reset, please ignore this email.\n\nBest regards,\nThe Ikoota Team`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #dc2626;">Password Reset Request</h2>
            <p>Hello <strong>${data.username}</strong>,</p>
            <p>A password reset was requested for your account.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.resetLink}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
            </div>
            <p><strong>This link expires in 1 hour.</strong></p>
            <p>If you didn't request this reset, please ignore this email.</p>
            <p>Best regards,<br>The Ikoota Team</p>
          </div>
        `
      }
    },

    adminNotification: {
      subject: `Admin Alert: ${data.title || 'System Notification'}`,
      content: {
        text: `ADMIN NOTIFICATION\n\n${data.title || 'System Alert'}\n\n${data.message}\n\n${data.actionUrl ? `Action Required: ${data.actionUrl}` : ''}\n\nTimestamp: ${new Date().toISOString()}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #dc2626;">
            <h2 style="color: #dc2626; text-align: center;">🚨 ADMIN NOTIFICATION</h2>
            <h3>${data.title || 'System Alert'}</h3>
            <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px;">
              <p>${data.message}</p>
            </div>
            ${data.actionUrl ? `<div style="text-align: center; margin: 20px 0;"><a href="${data.actionUrl}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Take Action</a></div>` : ''}
            <p style="font-size: 12px; color: #666;">Timestamp: ${new Date().toISOString()}</p>
          </div>
        `
      }
    }
  };

  if (!templates[templateName]) {
    throw new CustomError(`Unknown email template: ${templateName}`, 400);
  }

  return templates[templateName];
};

// Predefined SMS templates (fallback)
const getPredefinedSMSTemplate = (templateName, data) => {
  const templates = {
    welcome: `Welcome to Ikoota, ${data.username}! Your account is ready. Check your email for next steps.`,
    
    surveyApproval: `Hello ${data.username}, your membership application has been ${data.status}. Check your email for details.`,
    
    verificationCode: `Your Ikoota verification code: ${data.code}. Expires in ${data.expiresIn || '10 minutes'}.`,
    
    passwordReset: `Password reset requested for your Ikoota account. Check your email for the reset link.`,
    
    contentNotification: `Your ${data.contentType || 'content'} has been ${data.status}. Check the app for details.`,
    
    adminAlert: `Ikoota Admin Alert: ${data.message}`,
    
    systemMaintenance: `Ikoota maintenance starting ${data.startTime} for ${data.duration}. We apologize for any inconvenience.`,
    
    emergencyAlert: `🚨 Ikoota Emergency: ${data.message}. Please check your email immediately.`
  };

  if (!templates[templateName]) {
    throw new CustomError(`Unknown SMS template: ${templateName}`, 400);
  }

  return templates[templateName];
};

// Determine effective channels based on template type and user preferences
const determineEffectiveChannels = (template, requestedChannels, userPreferences) => {
  const effectiveChannels = [];

  // Admin and emergency notifications override user preferences
  const criticalTemplates = ['adminNotification', 'adminAlert', 'emergencyAlert', 'systemMaintenance'];
  const isCritical = criticalTemplates.includes(template);

  // Check email channel
  if (requestedChannels.includes('email')) {
    if (isCritical || userPreferences.email_notifications || template === 'passwordReset') {
      effectiveChannels.push('email');
    }
  }

  // Check SMS channel
  if (requestedChannels.includes('sms')) {
    if (isCritical || userPreferences.sms_notifications) {
      effectiveChannels.push('sms');
    }
  }

  return effectiveChannels;
};

// ===============================================
// SETTINGS & CONFIGURATION SERVICES
// ===============================================

// Get user communication settings
export const getCommunicationSettingsService = async (userId) => {
  try {
    const [settings] = await db.query(`
      SELECT ucp.*, u.email, u.phone, u.username
      FROM user_communication_preferences ucp
      JOIN users u ON ucp.user_id = u.id
      WHERE ucp.user_id = ?
    `, [userId]);

    if (settings.length === 0) {
      // Create default settings if they don't exist
      await db.query(`
        INSERT INTO user_communication_preferences (
          user_id, email_notifications, sms_notifications, marketing_emails,
          marketing_sms, survey_notifications, content_notifications, admin_notifications
        ) VALUES (?, TRUE, FALSE, TRUE, FALSE, TRUE, TRUE, TRUE)
      `, [userId]);

      // Fetch the newly created settings
      const [newSettings] = await db.query(`
        SELECT ucp.*, u.email, u.phone, u.username
        FROM user_communication_preferences ucp
        JOIN users u ON ucp.user_id = u.id
        WHERE ucp.user_id = ?
      `, [userId]);

      return newSettings[0];
    }

    return settings[0];

  } catch (error) {
    console.error('❌ Error in getCommunicationSettingsService:', error);
    throw new CustomError('Failed to get communication settings', 500);
  }
};

// Update user communication settings
export const updateCommunicationSettingsService = async (userId, updateData) => {
  try {
    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    Object.entries(updateData).forEach(([key, value]) => {
      updateFields.push(`${key} = ?`);
      updateValues.push(value);
    });

    if (updateFields.length === 0) {
      throw new CustomError('No valid settings to update', 400);
    }

    updateValues.push(userId);

    const query = `
      UPDATE user_communication_preferences 
      SET ${updateFields.join(', ')}, updatedAt = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `;

    const [result] = await db.query(query, updateValues);

    if (result.affectedRows === 0) {
      throw new CustomError('User communication settings not found', 404);
    }

    // Return updated settings
    const updatedSettings = await getCommunicationSettingsService(userId);

    return {
      success: true,
      data: updatedSettings,
      updatedFields: Object.keys(updateData),
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error in updateCommunicationSettingsService:', error);
    throw new CustomError(error.message || 'Failed to update communication settings', error.statusCode || 500);
  }
};

// Get available templates service
export const getAvailableTemplatesService = async (type = 'all') => {
  try {
    const templates = {};

    // Get email templates from database
    if (type === 'all' || type === 'email') {
      const [emailTemplates] = await db.query(`
        SELECT id, name, subject, variables, is_active, created_by, createdAt
        FROM email_templates 
        WHERE is_active = TRUE
        ORDER BY name
      `);

      templates.email = {
        database: emailTemplates,
        predefined: [
          { name: 'welcome', description: 'Welcome email for new users' },
          { name: 'surveyApproval', description: 'Survey approval/rejection notification' },
          { name: 'contentNotification', description: 'Content status update notification' },
          { name: 'passwordReset', description: 'Password reset instructions' },
          { name: 'adminNotification', description: 'Admin alert notification' }
        ]
      };
    }

    // Get SMS templates from database
    if (type === 'all' || type === 'sms') {
      const [smsTemplates] = await db.query(`
        SELECT id, name, message, variables, is_active, created_by, createdAt
        FROM sms_templates 
        WHERE is_active = TRUE
        ORDER BY name
      `);

      templates.sms = {
        database: smsTemplates,
        predefined: [
          { name: 'welcome', description: 'Welcome SMS for new users' },
          { name: 'surveyApproval', description: 'Survey approval/rejection SMS' },
          { name: 'verificationCode', description: 'Verification code SMS' },
          { name: 'passwordReset', description: 'Password reset alert SMS' },
          { name: 'contentNotification', description: 'Content status update SMS' },
          { name: 'adminAlert', description: 'Admin alert SMS' },
          { name: 'systemMaintenance', description: 'Maintenance notification SMS' },
          { name: 'emergencyAlert', description: 'Emergency alert SMS' }
        ]
      };
    }

    return {
      success: true,
      templates,
      count: {
        email: templates.email ? templates.email.database.length + templates.email.predefined.length : 0,
        sms: templates.sms ? templates.sms.database.length + templates.sms.predefined.length : 0
      },
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error in getAvailableTemplatesService:', error);
    throw new CustomError('Failed to get available templates', 500);
  }
};

// Create communication template service
export const createCommunicationTemplateService = async (templateData) => {
  try {
    const { 
      templateName, 
      templateType, 
      subject, 
      emailBody, 
      smsMessage,
      variables = [],
      isActive = true,
      createdBy
    } = templateData;

    // Check if template name already exists
    const tableName = templateType === 'email' ? 'email_templates' : 'sms_templates';
    const [existing] = await db.query(`SELECT id FROM ${tableName} WHERE name = ?`, [templateName]);

    if (existing.length > 0) {
      throw new CustomError(`Template with name "${templateName}" already exists`, 409);
    }

    let result;

    if (templateType === 'email') {
      // Create email template
      const [emailResult] = await db.query(`
        INSERT INTO email_templates (name, subject, body_text, body_html, variables, is_active, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        templateName,
        subject,
        emailBody,
        emailBody, // For now, use same content for HTML (could be enhanced)
        JSON.stringify(variables),
        isActive,
        createdBy
      ]);

      result = { id: emailResult.insertId, type: 'email' };

    } else if (templateType === 'sms') {
      // Create SMS template
      const [smsResult] = await db.query(`
        INSERT INTO sms_templates (name, message, variables, is_active, created_by)
        VALUES (?, ?, ?, ?, ?)
      `, [
        templateName,
        smsMessage,
        JSON.stringify(variables),
        isActive,
        createdBy
      ]);

      result = { id: smsResult.insertId, type: 'sms' };

    } else {
      throw new CustomError('Template type must be either "email" or "sms"', 400);
    }

    return {
      success: true,
      template: {
        id: result.id,
        name: templateName,
        type: templateType,
        isActive,
        createdBy
      },
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error in createCommunicationTemplateService:', error);
    throw new CustomError(error.message || 'Failed to create communication template', error.statusCode || 500);
  }
};

// ===============================================
// SYSTEM HEALTH & STATISTICS SERVICES
// ===============================================

// Communication health check service
export const checkCommunicationHealthService = async () => {
  try {
    const healthResults = {
      email: { configured: false, connected: false },
      sms: { configured: false, connected: false },
      database: { connected: false },
      timestamp: new Date().toISOString()
    };

    // Test email connection
    try {
      const emailConfig = getEmailConfig();
      healthResults.email.configured = emailConfig.configured;
      
      if (emailConfig.configured) {
        const emailTest = await testEmailConnection();
        healthResults.email.connected = emailTest.success;
        healthResults.email.details = emailTest;
      }
    } catch (error) {
      healthResults.email.error = error.message;
    }

    // Test SMS connection
    try {
      const smsConfig = getSMSConfig();
      healthResults.sms.configured = smsConfig.configured;
      
      if (smsConfig.configured) {
        const smsTest = await testSMSConnection();
        healthResults.sms.connected = smsTest.success;
        healthResults.sms.details = smsTest;
      }
    } catch (error) {
      healthResults.sms.error = error.message;
    }

    // Test database connection for communication tables
    try {
      await db.query('SELECT COUNT(*) as count FROM email_logs LIMIT 1');
      await db.query('SELECT COUNT(*) as count FROM sms_logs LIMIT 1');
      healthResults.database.connected = true;
    } catch (error) {
      healthResults.database.connected = false;
      healthResults.database.error = error.message;
    }

    // Calculate overall health score
    const services = [healthResults.email, healthResults.sms, healthResults.database];
    const healthyServices = services.filter(service => 
      service.configured !== false && service.connected === true
    ).length;
    
    const overallHealth = healthyServices === services.length ? 'healthy' : 
                         healthyServices > 0 ? 'degraded' : 'unhealthy';

    return {
      success: true,
      overallHealth,
      services: healthResults,
      healthScore: Math.round((healthyServices / services.length) * 100),
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error in checkCommunicationHealthService:', error);
    throw new CustomError('Failed to check communication health', 500);
  }
};

// Get communication statistics service
export const getCommunicationStatsService = async (filters = {}) => {
  try {
    const { startDate, endDate, type, granularity = 'day' } = filters;
    
    // Build date filter
    let dateFilter = '';
    let dateParams = [];
    
    if (startDate && endDate) {
      dateFilter = 'WHERE createdAt BETWEEN ? AND ?';
      dateParams = [startDate, endDate];
    } else if (startDate || endDate) {
      dateFilter = startDate ? 'WHERE createdAt >= ?' : 'WHERE createdAt <= ?';
      dateParams = [startDate || endDate];
    }

    const stats = {};

    // Get email statistics
    if (!type || type === 'email') {
      const emailSql = `
        SELECT 
          COUNT(*) as total_emails,
          SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as successful_emails,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_emails,
          COUNT(DISTINCT template) as unique_templates,
          COUNT(DISTINCT recipient) as unique_recipients,
          DATE(createdAt) as date
        FROM email_logs
        ${dateFilter}
        ${granularity === 'day' ? 'GROUP BY DATE(createdAt)' : ''}
        ORDER BY date DESC
      `;

      const [emailRows] = await db.query(emailSql, dateParams);
      stats.email = {
        summary: emailRows.length > 0 ? emailRows[0] : {},
        daily: granularity === 'day' ? emailRows : [],
        success_rate: emailRows.length > 0 ? 
          Math.round((emailRows[0].successful_emails / emailRows[0].total_emails) * 100) : 0
      };

      // Get bulk email statistics
      const bulkEmailSql = `
        SELECT 
          COUNT(*) as total_bulk_operations,
          SUM(recipients_count) as total_bulk_recipients,
          SUM(successful_count) as total_bulk_successful,
          SUM(failed_count) as total_bulk_failed
        FROM bulk_email_logs
        ${dateFilter}
      `;

      const [bulkEmailRows] = await db.query(bulkEmailSql, dateParams);
      stats.email.bulk = bulkEmailRows[0] || {};
    }

    // Get SMS statistics
    if (!type || type === 'sms') {
      const smsSql = `
        SELECT 
          COUNT(*) as total_sms,
          SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as successful_sms,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_sms,
          COUNT(DISTINCT template) as unique_templates,
          COUNT(DISTINCT recipient) as unique_recipients,
          DATE(createdAt) as date
        FROM sms_logs
        ${dateFilter}
        ${granularity === 'day' ? 'GROUP BY DATE(createdAt)' : ''}
        ORDER BY date DESC
      `;

      const [smsRows] = await db.query(smsSql, dateParams);
      stats.sms = {
        summary: smsRows.length > 0 ? smsRows[0] : {},
        daily: granularity === 'day' ? smsRows : [],
        success_rate: smsRows.length > 0 ? 
          Math.round((smsRows[0].successful_sms / smsRows[0].total_sms) * 100) : 0
      };

      // Get bulk SMS statistics
      const bulkSMSSql = `
        SELECT 
          COUNT(*) as total_bulk_operations,
          SUM(recipients_count) as total_bulk_recipients,
          SUM(successful_count) as total_bulk_successful,
          SUM(failed_count) as total_bulk_failed
        FROM bulk_sms_logs
        ${dateFilter}
      `;

      const [bulkSMSRows] = await db.query(bulkSMSSql, dateParams);
      stats.sms.bulk = bulkSMSRows[0] || {};
    }

    // Get template usage statistics
    const templateStats = await getTemplateUsageStats(dateFilter, dateParams);
    stats.templates = templateStats;

    return {
      success: true,
      period: { startDate, endDate },
      granularity,
      stats,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error in getCommunicationStatsService:', error);
    throw new CustomError('Failed to get communication statistics', 500);
  }
};

// ===============================================
// DATABASE LOGGING FUNCTIONS
// ===============================================

// Log email activity
const logEmailActivity = async (activityData) => {
  try {
    const sql = `
      INSERT INTO email_logs (
        recipient, subject, template, status, message_id, 
        error_message, sender_id, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    
    await db.query(sql, [
      activityData.recipient,
      activityData.subject,
      activityData.template,
      activityData.status,
      activityData.messageId || null,
      activityData.errorMessage || null,
      activityData.senderId || null
    ]);

    console.log(`📧 Email activity logged: ${activityData.status} to ${activityData.recipient}`);

  } catch (error) {
    console.error('❌ Failed to log email activity:', error);
    // Don't throw error to avoid breaking the main flow
  }
};

// Log SMS activity
const logSMSActivity = async (activityData) => {
  try {
    const sql = `
      INSERT INTO sms_logs (
        recipient, message, template, status, sid, 
        error_message, sender_id, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    
    await db.query(sql, [
      activityData.recipient,
      activityData.message,
      activityData.template,
      activityData.status,
      activityData.sid || null,
      activityData.errorMessage || null,
      activityData.senderId || null
    ]);

    console.log(`📱 SMS activity logged: ${activityData.status} to ${activityData.recipient}`);

  } catch (error) {
    console.error('❌ Failed to log SMS activity:', error);
    // Don't throw error to avoid breaking the main flow
  }
};

// Log bulk email activity
const logBulkEmailActivity = async (activityData) => {
  try {
    const sql = `
      INSERT INTO bulk_email_logs (
        recipients_count, subject, template, successful_count, 
        failed_count, sender_id, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;
    
    await db.query(sql, [
      activityData.recipientsCount,
      activityData.subject,
      activityData.template,
      activityData.successfulCount,
      activityData.failedCount,
      activityData.senderId || null
    ]);

    console.log(`📧 Bulk email activity logged: ${activityData.successfulCount}/${activityData.recipientsCount} successful`);

  } catch (error) {
    console.error('❌ Failed to log bulk email activity:', error);
  }
};

// Log bulk SMS activity
const logBulkSMSActivity = async (activityData) => {
  try {
    const sql = `
      INSERT INTO bulk_sms_logs (
        recipients_count, message, template, successful_count, 
        failed_count, sender_id, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;
    
    await db.query(sql, [
      activityData.recipientsCount,
      activityData.message,
      activityData.template,
      activityData.successfulCount,
      activityData.failedCount,
      activityData.senderId || null
    ]);

    console.log(`📱 Bulk SMS activity logged: ${activityData.successfulCount}/${activityData.recipientsCount} successful`);

  } catch (error) {
    console.error('❌ Failed to log bulk SMS activity:', error);
  }
};

// Log bulk notification activity (custom logging for combined operations)
const logBulkNotificationActivity = async (activityData) => {
  try {
    // Log in audit_logs for admin tracking
    const sql = `
      INSERT INTO audit_logs (user_id, action, resource, details, ip_address, createdAt)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;
    
    const details = {
      operation: 'bulk_notification',
      template: activityData.template,
      channels: activityData.channels,
      recipientsCount: activityData.recipientsCount,
      successfulCount: activityData.successfulCount,
      failedCount: activityData.failedCount,
      errorMessage: activityData.errorMessage || null
    };
    
    await db.query(sql, [
      activityData.senderId,
      'BULK_NOTIFICATION_SENT',
      'communication_system',
      JSON.stringify(details),
      'system_operation'
    ]);

    console.log(`🔔 Bulk notification activity logged: ${activityData.successfulCount}/${activityData.recipientsCount} successful`);

  } catch (error) {
    console.error('❌ Failed to log bulk notification activity:', error);
  }
};

// Update user communication statistics
const updateUserCommunicationStats = async (userId, operation, status, count = 1) => {
  try {
    // This could be implemented with a separate user_communication_stats table
    // For now, we'll log in audit_logs
    const sql = `
      INSERT INTO audit_logs (user_id, action, resource, details, createdAt)
      VALUES (?, ?, ?, ?, NOW())
    `;
    
    const details = {
      operation,
      status,
      count,
      timestamp: new Date().toISOString()
    };
    
    await db.query(sql, [
      userId,
      `COMMUNICATION_${operation.toUpperCase()}_${status.toUpperCase()}`,
      'user_communication_stats',
      JSON.stringify(details)
    ]);

  } catch (error) {
    console.error('❌ Failed to update user communication stats:', error);
    // Don't throw error to avoid breaking the main flow
  }
};

// Get template usage statistics
const getTemplateUsageStats = async (dateFilter, dateParams) => {
  try {
    const templateStats = {};

    // Email template usage
    const emailTemplateSql = `
      SELECT 
        template,
        COUNT(*) as usage_count,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as successful_count,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count
      FROM email_logs
      ${dateFilter}
      GROUP BY template
      ORDER BY usage_count DESC
    `;

    const [emailTemplateRows] = await db.query(emailTemplateSql, dateParams);
    templateStats.email = emailTemplateRows;

    // SMS template usage
    const smsTemplateSql = `
      SELECT 
        template,
        COUNT(*) as usage_count,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as successful_count,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count
      FROM sms_logs
      ${dateFilter}
      GROUP BY template
      ORDER BY usage_count DESC
    `;

    const [smsTemplateRows] = await db.query(smsTemplateSql, dateParams);
    templateStats.sms = smsTemplateRows;

    return templateStats;

  } catch (error) {
    console.error('❌ Error getting template usage stats:', error);
    return { email: [], sms: [] };
  }
};

// ===============================================
// UTILITY FUNCTIONS
// ===============================================

// Validate email format
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number format
export const validatePhone = (phone) => {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  const cleaned = phone.replace(/\D/g, '');
  return phoneRegex.test(phone) && cleaned.length >= 10 && cleaned.length <= 15;
};

// Sanitize template variables
export const sanitizeTemplateVariables = (variables) => {
  const sanitized = {};
  
  Object.entries(variables).forEach(([key, value]) => {
    // Basic XSS prevention
    if (typeof value === 'string') {
      sanitized[key] = value
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    } else {
      sanitized[key] = value;
    }
  });
  
  return sanitized;
};

// Get communication service configuration
export const getCommunicationServiceConfig = () => {
  return {
    email: getEmailConfig(),
    sms: getSMSConfig(),
    features: {
      templates: true,
      bulkOperations: true,
      userPreferences: true,
      logging: true,
      analytics: true
    },
    limits: {
      bulkEmail: {
        maxRecipients: 1000,
        maxBatchSize: 100,
        minDelay: 500
      },
      bulkSMS: {
        maxRecipients: 500,
        maxBatchSize: 50,
        minDelay: 1000
      }
    },
    supportedTemplates: {
      email: ['welcome', 'surveyApproval', 'contentNotification', 'passwordReset', 'adminNotification'],
      sms: ['welcome', 'surveyApproval', 'verificationCode', 'passwordReset', 'contentNotification', 'adminAlert', 'systemMaintenance', 'emergencyAlert']
    }
  };
};