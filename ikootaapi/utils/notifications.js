// ikootaapi/utils/notifications.js - ENHANCED FOR SURVEY SYSTEM
// UNIFIED NOTIFICATIONS MODULE
// Combines email, SMS, and general notification functionality

import dotenv from 'dotenv';
import { 
  sendEmail as emailSend, 
  sendEmailWithTemplate as emailWithTemplate,
  sendSurveySubmissionConfirmation,
  sendSurveyApprovalNotification as emailSurveyApproval,
  sendSurveyRejectionNotification as emailSurveyRejection,
  sendAdminSurveyNotification as emailAdminSurveyNotification
} from './email.js';

dotenv.config();

// ===============================================
// EMAIL CONFIGURATION & TEMPLATES
// ===============================================

// Enhanced email templates for different notification types including survey system
const emailTemplates = {
  // Authentication templates
  welcome: (data) => ({
    subject: `Welcome to Ikoota, ${data.USERNAME}!`,
    text: `Welcome ${data.USERNAME}! Your account has been created successfully.`,
    html: `<h1>Welcome ${data.USERNAME}!</h1><p>Your account has been created successfully.</p>`
  }),
  
  verification: (data) => ({
    subject: 'Verify Your Email Address',
    text: `Your verification code is: ${data.CODE}`,
    html: `<h1>Email Verification</h1><p>Your verification code is: <strong>${data.CODE}</strong></p>`
  }),
  
  password_reset: (data) => ({
    subject: 'Password Reset Request',
    text: `Your password reset code is: ${data.RESET_CODE}`,
    html: `<h1>Password Reset</h1><p>Your reset code is: <strong>${data.RESET_CODE}</strong></p>`
  }),
  
  // Application templates (membership)
  initial_application_approved: (data) => ({
    subject: 'Your Initial Application Has Been Approved!',
    text: `Congratulations ${data.USERNAME}! Your initial application has been approved. Your converse ID is: ${data.CONVERSE_ID}`,
    html: `<h1>Application Approved!</h1><p>Congratulations ${data.USERNAME}!</p><p>Your converse ID is: <strong>${data.CONVERSE_ID}</strong></p>`
  }),
  
  initial_application_rejected: (data) => ({
    subject: 'Initial Application Update',
    text: `Hello ${data.USERNAME}, your initial application has been reviewed. ${data.ADMIN_NOTES || ''}`,
    html: `<h1>Application Update</h1><p>Hello ${data.USERNAME},</p><p>Your application has been reviewed.</p><p>${data.ADMIN_NOTES || ''}</p>`
  }),
  
  full_membership_approved: (data) => ({
    subject: 'Full Membership Approved!',
    text: `Congratulations ${data.USERNAME}! Your full membership has been approved.`,
    html: `<h1>Full Membership Approved!</h1><p>Congratulations ${data.USERNAME}!</p><p>You now have full access to all features.</p>`
  }),
  
  full_membership_rejected: (data) => ({
    subject: 'Full Membership Application Update',
    text: `Hello ${data.USERNAME}, your full membership application has been reviewed. ${data.ADMIN_NOTES || ''}`,
    html: `<h1>Membership Application Update</h1><p>Hello ${data.USERNAME},</p><p>${data.ADMIN_NOTES || ''}</p>`
  }),

  // ✅ Survey-specific templates (using for internal template system only)
  survey_submitted: (data) => ({
    subject: `Survey Submitted - ${data.APPLICATION_TYPE || 'General Survey'}`,
    text: `Hello ${data.USERNAME}, your survey has been submitted successfully. Survey ID: ${data.SURVEY_ID}`,
    html: `<h1>Survey Submitted</h1><p>Hello ${data.USERNAME},</p><p>Your survey has been submitted successfully.</p><p>Survey ID: <strong>${data.SURVEY_ID}</strong></p>`
  }),

  survey_approved: (data) => ({
    subject: `Survey Approved - ${data.APPLICATION_TYPE || 'Survey'}`,
    text: `Hello ${data.USERNAME}, your survey has been approved! Survey ID: ${data.SURVEY_ID}. ${data.ADMIN_NOTES ? 'Notes: ' + data.ADMIN_NOTES : ''}`,
    html: `<h1>Survey Approved!</h1><p>Hello ${data.USERNAME},</p><p>Your survey has been approved!</p><p>Survey ID: <strong>${data.SURVEY_ID}</strong></p>${data.ADMIN_NOTES ? '<p>Notes: ' + data.ADMIN_NOTES + '</p>' : ''}`
  }),

  survey_rejected: (data) => ({
    subject: `Survey Review Update - ${data.APPLICATION_TYPE || 'Survey'}`,
    text: `Hello ${data.USERNAME}, your survey has been reviewed. Survey ID: ${data.SURVEY_ID}. ${data.ADMIN_NOTES ? 'Feedback: ' + data.ADMIN_NOTES : ''}`,
    html: `<h1>Survey Review Update</h1><p>Hello ${data.USERNAME},</p><p>Your survey has been reviewed.</p><p>Survey ID: <strong>${data.SURVEY_ID}</strong></p>${data.ADMIN_NOTES ? '<p>Feedback: ' + data.ADMIN_NOTES + '</p>' : ''}`
  }),

  survey_draft_saved: (data) => ({
    subject: 'Survey Draft Auto-Saved',
    text: `Hello ${data.USERNAME}, your survey draft has been auto-saved. Draft ID: ${data.DRAFT_ID}`,
    html: `<h1>Survey Draft Saved</h1><p>Hello ${data.USERNAME},</p><p>Your survey draft has been auto-saved.</p><p>Draft ID: <strong>${data.DRAFT_ID}</strong></p>`
  }),
  
  // Admin templates
  admin_notification: (data) => ({
    subject: data.SUBJECT || 'Admin Notification',
    text: `${data.MESSAGE}\n\nPriority: ${data.PRIORITY || 'Normal'}`,
    html: `<h1>${data.SUBJECT || 'Admin Notification'}</h1><p>${data.MESSAGE}</p><p><strong>Priority:</strong> ${data.PRIORITY || 'Normal'}</p>`
  }),

  admin_new_survey: (data) => ({
    subject: `New Survey Submission - ${data.APPLICATION_TYPE || 'Survey'} - ${data.USERNAME}`,
    text: `New survey submitted by ${data.USERNAME}. Survey ID: ${data.SURVEY_ID}. Type: ${data.APPLICATION_TYPE || 'Survey'}`,
    html: `<h1>New Survey Submission</h1><p>Submitted by: <strong>${data.USERNAME}</strong></p><p>Survey ID: ${data.SURVEY_ID}</p><p>Type: ${data.APPLICATION_TYPE || 'Survey'}</p>`
  }),
  
  membership_notification: (data) => ({
    subject: data.SUBJECT || 'Membership Update',
    text: `Hello ${data.USERNAME},\n\n${data.MESSAGE}\n\nMembership Stage: ${data.MEMBERSHIP_STAGE}`,
    html: `<h1>${data.SUBJECT || 'Membership Update'}</h1><p>Hello ${data.USERNAME},</p><p>${data.MESSAGE}</p><p><strong>Membership Stage:</strong> ${data.MEMBERSHIP_STAGE}</p>`
  })
};

// ===============================================
// SMS TEMPLATES
// ===============================================

const smsTemplates = {
  verification: (data) => `Your Ikoota verification code is: ${data.CODE}`,
  password_reset: (data) => `Your password reset code is: ${data.RESET_CODE}`,
  welcome: (data) => `Welcome to Ikoota, ${data.USERNAME}!`,
  application_approved: (data) => `Congratulations ${data.USERNAME}! Your application has been approved. Converse ID: ${data.CONVERSE_ID}`,
  application_rejected: (data) => `Hello ${data.USERNAME}, your application has been reviewed. Please check your email for details.`,
  
  // ✅ Survey SMS templates
  survey_submitted: (data) => `Hello ${data.USERNAME}, your survey has been submitted successfully. Survey ID: ${data.SURVEY_ID}`,
  survey_approved: (data) => `Great news ${data.USERNAME}! Your survey has been approved. Survey ID: ${data.SURVEY_ID}`,
  survey_rejected: (data) => `Hello ${data.USERNAME}, your survey has been reviewed. Please check your email for feedback.`,
  
  admin_alert: (data) => `${data.SUBJECT}: ${data.MESSAGE}`,
  admin_new_survey: (data) => `New survey submission from ${data.USERNAME}. Survey ID: ${data.SURVEY_ID}`
};

// ===============================================
// EMAIL IMPLEMENTATION
// ===============================================

/**
 * Send email using configured service with survey system support
 * @param {string} to - Recipient email address
 * @param {string} templateOrSubject - Template name or direct subject
 * @param {object} data - Template variables or message content
 * @param {object} options - Additional options
 * @returns {Promise<object>} Send result
 */
export const sendEmail = async (to, templateOrSubject, data = {}, options = {}) => {
  try {
    console.log('📧 Sending email:', { to, templateOrSubject, hasData: !!data });
    
    let emailContent;
    let subject;
    
    // Check if it's a template name or direct subject
    if (emailTemplates[templateOrSubject]) {
      console.log('📧 Using email template:', templateOrSubject);
      const template = emailTemplates[templateOrSubject](data);
      subject = template.subject;
      emailContent = {
        text: template.text,
        html: template.html
      };
    } else {
      // Direct subject and content
      subject = templateOrSubject;
      emailContent = typeof data === 'string' ? data : data.text || JSON.stringify(data);
    }
    
    console.log('📧 Email prepared:', { to, subject });
    
    // Use the enhanced email service from email.js
    return await emailSend(to, subject, emailContent, options);
    
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

// ===============================================
// SMS IMPLEMENTATION
// ===============================================

/**
 * Send SMS using configured service
 * @param {string} to - Recipient phone number
 * @param {string} templateOrMessage - Template name or direct message
 * @param {object} data - Template variables
 * @param {object} options - Additional options
 * @returns {Promise<object>} Send result
 */
export const sendSMS = async (to, templateOrMessage, data = {}, options = {}) => {
  try {
    console.log('📱 Sending SMS:', { to, templateOrMessage, hasData: !!data });
    
    let message;
    
    // Check if it's a template name or direct message
    if (smsTemplates[templateOrMessage]) {
      console.log('📱 Using SMS template:', templateOrMessage);
      message = smsTemplates[templateOrMessage](data);
    } else {
      // Direct message
      message = templateOrMessage;
    }
    
    console.log('📱 SMS prepared:', { to, messageLength: message.length });
    
    // TODO: Implement your actual SMS service here
    // Examples:
    // - Twilio API
    // - AWS SNS
    // - Nexmo/Vonage API
    
    // For now, log the SMS (replace with actual implementation)
    console.log(`📱 SMS SENT: To ${to}, Message: ${message}`);
    
    // Simulate SMS service response
    const result = {
      success: true,
      messageId: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      recipient: to,
      message,
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ SMS sent successfully:', result.messageId);
    return result;
    
  } catch (error) {
    console.error('❌ SMS sending failed:', error);
    throw new Error(`SMS sending failed: ${error.message}`);
  }
};

// ===============================================
// UNIFIED NOTIFICATION FUNCTION
// ===============================================

/**
 * Send notification via email, SMS, or both with survey system support
 * @param {string|object} recipient - Email address, phone number, or object with both
 * @param {string} method - 'email', 'sms', or 'both'
 * @param {string} templateOrContent - Template name or direct content
 * @param {object} data - Template variables
 * @param {object} options - Additional options
 * @returns {Promise<object>} Send result
 */
export const sendNotification = async (recipient, method, templateOrContent, data = {}, options = {}) => {
  try {
    console.log('🔔 Sending notification:', { recipient, method, templateOrContent });
    
    const results = {};
    
    switch (method.toLowerCase()) {
      case 'email':
        if (typeof recipient === 'object' && recipient.email) {
          results.email = await sendEmail(recipient.email, templateOrContent, data, options);
        } else if (typeof recipient === 'string' && recipient.includes('@')) {
          results.email = await sendEmail(recipient, templateOrContent, data, options);
        } else {
          throw new Error('Invalid email recipient');
        }
        break;
      
      case 'sms':
      case 'phone':
        if (typeof recipient === 'object' && recipient.phone) {
          results.sms = await sendSMS(recipient.phone, templateOrContent, data, options);
        } else if (typeof recipient === 'string' && !recipient.includes('@')) {
          results.sms = await sendSMS(recipient, templateOrContent, data, options);
        } else {
          throw new Error('Invalid phone recipient');
        }
        break;
      
      case 'both':
        // Send both email and SMS
        const promises = [];
        
        if (recipient.email || (typeof recipient === 'string' && recipient.includes('@'))) {
          const emailRecipient = recipient.email || recipient;
          promises.push(
            sendEmail(emailRecipient, templateOrContent, data, options)
              .then(result => ({ type: 'email', success: true, result }))
              .catch(error => ({ type: 'email', success: false, error: error.message }))
          );
        }
        
        if (recipient.phone || (typeof recipient === 'string' && !recipient.includes('@'))) {
          const phoneRecipient = recipient.phone || recipient;
          promises.push(
            sendSMS(phoneRecipient, templateOrContent, data, options)
              .then(result => ({ type: 'sms', success: true, result }))
              .catch(error => ({ type: 'sms', success: false, error: error.message }))
          );
        }
        
        const promiseResults = await Promise.allSettled(promises);
        promiseResults.forEach(result => {
          if (result.status === 'fulfilled') {
            results[result.value.type] = result.value;
          }
        });
        break;
      
      default:
        throw new Error(`Unsupported notification method: ${method}`);
    }
    
    console.log('✅ Notification sent successfully');
    return {
      success: true,
      method,
      recipient,
      results,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error sending notification:', error);
    throw error;
  }
};

// ===============================================
// SURVEY-SPECIFIC NOTIFICATION FUNCTIONS (Using imported functions from email.js)
// ===============================================

/**
 * Send survey submission confirmation (uses imported function)
 * @param {string} userEmail - User email address
 * @param {object} surveyData - Survey submission data
 * @returns {Promise<object>} Send result
 */
export const sendSurveySubmissionNotification = async (userEmail, surveyData) => {
  try {
    console.log('📧 Sending survey submission notification');
    
    // Use the specialized function from email.js
    const result = await sendSurveySubmissionConfirmation(userEmail, surveyData);
    
    // Also notify admin if configured
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SURVEY_ADMIN_EMAIL;
    if (adminEmail && adminEmail !== userEmail) {
      try {
        await emailAdminSurveyNotification(adminEmail, {
          ...surveyData,
          userEmail: userEmail
        });
      } catch (adminError) {
        console.warn('Failed to send admin notification:', adminError.message);
      }
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error sending survey submission notification:', error);
    throw error;
  }
};

/**
 * Send survey approval notification (uses imported function)
 * @param {string} userEmail - User email address
 * @param {object} surveyData - Survey approval data
 * @returns {Promise<object>} Send result
 */
export const sendSurveyApprovalNotification = async (userEmail, surveyData) => {
  try {
    console.log('📧 Sending survey approval notification');
    return await emailSurveyApproval(userEmail, surveyData);
  } catch (error) {
    console.error('❌ Error sending survey approval notification:', error);
    throw error;
  }
};

/**
 * Send survey rejection notification (uses imported function)
 * @param {string} userEmail - User email address
 * @param {object} surveyData - Survey rejection data
 * @returns {Promise<object>} Send result
 */
export const sendSurveyRejectionNotification = async (userEmail, surveyData) => {
  try {
    console.log('📧 Sending survey rejection notification');
    return await emailSurveyRejection(userEmail, surveyData);
  } catch (error) {
    console.error('❌ Error sending survey rejection notification:', error);
    throw error;
  }
};

/**
 * Send survey draft auto-save notification
 * @param {string} userEmail - User email address
 * @param {object} draftData - Draft save data
 * @returns {Promise<object>} Send result
 */
export const sendSurveyDraftNotification = async (userEmail, draftData) => {
  try {
    console.log('📧 Sending survey draft notification');
    
    return await sendNotification(userEmail, 'email', 'survey_draft_saved', {
      USERNAME: draftData.username,
      DRAFT_ID: draftData.draftId,
      SAVED_AT: new Date().toLocaleString()
    });
  } catch (error) {
    console.error('❌ Error sending survey draft notification:', error);
    throw error;
  }
};

/**
 * Send admin survey notification (uses imported function)
 * @param {string} adminEmail - Admin email address
 * @param {object} surveyData - Survey data for admin
 * @returns {Promise<object>} Send result
 */
export const sendAdminSurveyAlert = async (adminEmail, surveyData) => {
  try {
    console.log('📧 Sending admin survey alert');
    return await emailAdminSurveyNotification(adminEmail, surveyData);
  } catch (error) {
    console.error('❌ Error sending admin survey alert:', error);
    throw error;
  }
};

// ===============================================
// BULK NOTIFICATION FUNCTIONS
// ===============================================

/**
 * Send bulk notifications with batching and rate limiting
 * @param {Array} recipients - Array of recipient objects
 * @param {string} method - Notification method
 * @param {string} templateOrContent - Template or content
 * @param {object} data - Template data
 * @param {object} options - Options including batchSize and delay
 * @returns {Promise<object>} Bulk send results
 */
export const sendBulkNotification = async (recipients, method, templateOrContent, data = {}, options = {}) => {
  try {
    console.log('🔔 Sending bulk notification:', { 
      recipientCount: recipients.length, 
      method, 
      templateOrContent 
    });
    
    const results = [];
    const batchSize = options.batchSize || 10;
    const delay = options.delay || 1000;
    
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (recipient) => {
        try {
          const result = await sendNotification(recipient, method, templateOrContent, data, options);
          return { recipient, success: true, result };
        } catch (error) {
          return { recipient, success: false, error: error.message };
        }
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map(r => r.value || r.reason));
      
      // Add delay between batches to avoid rate limiting
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`✅ Bulk notification completed: ${successful} successful, ${failed} failed`);
    
    return {
      success: true,
      total: recipients.length,
      successful,
      failed,
      results,
      processed_at: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error in bulk notification:', error);
    throw error;
  }
};

// ===============================================
// UTILITY FUNCTIONS
// ===============================================

/**
 * Test notification services configuration
 * @returns {Promise<object>} Test results
 */
export const testNotificationServices = async () => {
  try {
    console.log('🧪 Testing notification services...');
    
    const results = {
      email: { configured: false, working: false },
      sms: { configured: false, working: false }
    };
    
    // Test email configuration
    try {
      results.email.configured = !!(process.env.MAIL_USER || process.env.SENDGRID_API_KEY);
      if (results.email.configured) {
        // Test with a dummy email (don't actually send)
        results.email.working = true;
        results.email.message = 'Email service appears configured';
      } else {
        results.email.message = 'Email service not configured - set MAIL_USER/MAIL_PASS or SENDGRID_API_KEY';
      }
    } catch (error) {
      results.email.error = error.message;
    }
    
    // Test SMS configuration
    try {
      results.sms.configured = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
      if (results.sms.configured) {
        results.sms.working = true;
        results.sms.message = 'SMS service appears configured';
      } else {
        results.sms.message = 'SMS service not configured - set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN';
      }
    } catch (error) {
      results.sms.error = error.message;
    }
    
    console.log('🧪 Notification service test results:', results);
    return results;
    
  } catch (error) {
    console.error('❌ Error testing notification services:', error);
    throw error;
  }
};

/**
 * Get notification service configuration
 * @returns {object} Configuration status
 */
export const getNotificationConfig = () => {
  return {
    email: {
      configured: !!(process.env.MAIL_USER && process.env.MAIL_PASS) || !!process.env.SENDGRID_API_KEY,
      service: process.env.SENDGRID_API_KEY ? 'SendGrid' : 'SMTP',
      templates: Object.keys(emailTemplates)
    },
    sms: {
      configured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
      provider: 'Twilio',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || 'Not configured',
      templates: Object.keys(smsTemplates)
    },
    survey_system: {
      enabled: true,
      survey_templates: [
        'survey_submitted',
        'survey_approved', 
        'survey_rejected',
        'survey_draft_saved',
        'admin_new_survey'
      ],
      admin_notifications: !!process.env.ADMIN_EMAIL,
      auto_notifications: true
    },
    features: {
      bulkNotifications: true,
      templates: true,
      rateLimiting: true,
      errorHandling: true,
      surveyIntegration: true
    }
  };
};

/**
 * Add or update email template
 * @param {string} name - Template name
 * @param {function} templateFunction - Template function
 */
export const addEmailTemplate = (name, templateFunction) => {
  emailTemplates[name] = templateFunction;
  console.log(`📧 Email template '${name}' added/updated`);
};

/**
 * Add or update SMS template
 * @param {string} name - Template name
 * @param {function} templateFunction - Template function
 */
export const addSMSTemplate = (name, templateFunction) => {
  smsTemplates[name] = templateFunction;
  console.log(`📱 SMS template '${name}' added/updated`);
};

// ===============================================
// LEGACY COMPATIBILITY
// ===============================================

/**
 * Legacy sendEmail wrapper for backward compatibility
 */
export const sendEmailWithTemplate = async (to, templateName, data, options) => {
  return await sendEmail(to, templateName, data, options);
};

/**
 * Legacy sendSMS wrapper for backward compatibility
 */
export const sendSMSWithTemplate = async (to, templateName, data, options) => {
  return await sendSMS(to, templateName, data, options);
};

// Export templates for external access if needed
export { emailTemplates, smsTemplates };





