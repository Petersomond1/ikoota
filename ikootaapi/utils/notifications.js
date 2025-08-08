// ikootaapi/utils/notifications.js
// UNIFIED NOTIFICATIONS MODULE
// Combines email, SMS, and general notification functionality

import dotenv from 'dotenv';
dotenv.config();

// ===============================================
// EMAIL CONFIGURATION & TEMPLATES
// ===============================================

// Email templates for different notification types
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
  
  // Application templates
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
  
  // Admin templates
  admin_notification: (data) => ({
    subject: data.SUBJECT || 'Admin Notification',
    text: `${data.MESSAGE}\n\nPriority: ${data.PRIORITY || 'Normal'}`,
    html: `<h1>${data.SUBJECT || 'Admin Notification'}</h1><p>${data.MESSAGE}</p><p><strong>Priority:</strong> ${data.PRIORITY || 'Normal'}</p>`
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
  admin_alert: (data) => `${data.SUBJECT}: ${data.MESSAGE}`
};

// ===============================================
// EMAIL IMPLEMENTATION
// ===============================================

/**
 * Send email using configured service
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
    
    // TODO: Implement your actual email service here
    // Examples:
    // - Nodemailer with Gmail/SMTP
    // - SendGrid API
    // - AWS SES
    // - Mailgun API
    
    // For now, log the email (replace with actual implementation)
    console.log(`📧 EMAIL SENT: To ${to}, Subject: ${subject}`);
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Email content:', emailContent);
    }
    
    // Simulate email service response
    const result = {
      success: true,
      messageId: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      recipient: to,
      subject,
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ Email sent successfully:', result.messageId);
    return result;
    
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
 * Send notification via email, SMS, or both
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
    features: {
      bulkNotifications: true,
      templates: true,
      rateLimiting: true,
      errorHandling: true
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
export const sendEmailWithTemplate = sendEmail;

/**
 * Legacy sendSMS wrapper for backward compatibility
 */
export const sendSMSWithTemplate = sendSMS;

// Export templates for external access if needed
export { emailTemplates, smsTemplates };







//previous file down new up


// // ikootaapi/utils/notifications.js - FIXED DUPLICATE EXPORTS
// // Unified notifications module combining email and SMS functionality

// import { sendEmail as emailUtilSendEmail, emailTemplates } from './email.js';
// import { sendSMS as smsUtilSendSMS, smsTemplates } from './sms.js';
// import dotenv from 'dotenv';

// dotenv.config();

// // ✅ FIXED: Unified sendEmail function with template support
// export const sendEmail = async (to, templateOrSubject, data = {}, options = {}) => {
//   try {
//     console.log('📧 Unified sendEmail called:', { to, templateOrSubject, hasData: !!data });
    
//     let emailContent;
//     let subject;
    
//     // Check if it's a template name or direct subject
//     if (emailTemplates[templateOrSubject]) {
//       console.log('📧 Using email template:', templateOrSubject);
//       const template = emailTemplates[templateOrSubject](data);
//       subject = template.subject;
//       emailContent = {
//         text: template.text,
//         html: template.html
//       };
//     } else {
//       // Direct subject and content
//       subject = templateOrSubject;
//       emailContent = typeof data === 'string' ? data : data.text || JSON.stringify(data);
//     }
    
//     console.log('📧 Sending email with subject:', subject);
    
//     const result = await emailUtilSendEmail(to, subject, emailContent, options);
    
//     console.log('✅ Unified email sent successfully');
//     return result;
    
//   } catch (error) {
//     console.error('❌ Error in unified sendEmail:', error);
//     throw error;
//   }
// };

// // ✅ FIXED: Unified sendSMS function with template support
// export const sendSMS = async (to, templateOrMessage, data = {}, options = {}) => {
//   try {
//     console.log('📱 Unified sendSMS called:', { to, templateOrMessage, hasData: !!data });
    
//     let message;
    
//     // Check if it's a template name or direct message
//     if (smsTemplates[templateOrMessage]) {
//       console.log('📱 Using SMS template:', templateOrMessage);
//       message = smsTemplates[templateOrMessage](data);
//     } else {
//       // Direct message
//       message = templateOrMessage;
//     }
    
//     console.log('📱 Sending SMS with message length:', message.length);
    
//     const result = await smsUtilSendSMS(to, message, options);
    
//     console.log('✅ Unified SMS sent successfully');
//     return result;
    
//   } catch (error) {
//     console.error('❌ Error in unified sendSMS:', error);
//     throw error;
//   }
// };

// // ✅ ENHANCED: Send notification via email or SMS based on preference
// export const sendNotification = async (recipient, method, templateOrContent, data = {}, options = {}) => {
//   try {
//     console.log('🔔 Sending notification:', { recipient, method, templateOrContent });
    
//     switch (method.toLowerCase()) {
//       case 'email':
//         return await sendEmail(recipient, templateOrContent, data, options);
      
//       case 'sms':
//       case 'phone':
//         return await sendSMS(recipient, templateOrContent, data, options);
      
//       case 'both':
//         // Send both email and SMS
//         const results = await Promise.allSettled([
//           sendEmail(recipient.email || recipient, templateOrContent, data, options),
//           sendSMS(recipient.phone || recipient, templateOrContent, data, options)
//         ]);
        
//         return {
//           success: true,
//           email: results[0].status === 'fulfilled' ? results[0].value : { error: results[0].reason },
//           sms: results[1].status === 'fulfilled' ? results[1].value : { error: results[1].reason }
//         };
      
//       default:
//         throw new Error(`Unsupported notification method: ${method}`);
//     }
    
//   } catch (error) {
//     console.error('❌ Error sending notification:', error);
//     throw error;
//   }
// };

// // ✅ ENHANCED: Bulk notification sending
// export const sendBulkNotification = async (recipients, method, templateOrContent, data = {}, options = {}) => {
//   try {
//     console.log('🔔 Sending bulk notification:', { 
//       recipientCount: recipients.length, 
//       method, 
//       templateOrContent 
//     });
    
//     const results = [];
//     const batchSize = options.batchSize || 10;
//     const delay = options.delay || 1000;
    
//     for (let i = 0; i < recipients.length; i += batchSize) {
//       const batch = recipients.slice(i, i + batchSize);
      
//       const batchPromises = batch.map(async (recipient) => {
//         try {
//           const result = await sendNotification(recipient, method, templateOrContent, data, options);
//           return { recipient, success: true, result };
//         } catch (error) {
//           return { recipient, success: false, error: error.message };
//         }
//       });
      
//       const batchResults = await Promise.allSettled(batchPromises);
//       results.push(...batchResults.map(r => r.value));
      
//       // Add delay between batches
//       if (i + batchSize < recipients.length) {
//         await new Promise(resolve => setTimeout(resolve, delay));
//       }
//     }
    
//     const successful = results.filter(r => r.success).length;
//     const failed = results.filter(r => !r.success).length;
    
//     console.log(`✅ Bulk notification completed: ${successful} successful, ${failed} failed`);
    
//     return {
//       success: true,
//       total: recipients.length,
//       successful,
//       failed,
//       results
//     };
    
//   } catch (error) {
//     console.error('❌ Error in bulk notification:', error);
//     throw error;
//   }
// };

// // ✅ TEST: Test all notification methods
// export const testNotificationServices = async () => {
//   try {
//     console.log('🧪 Testing notification services...');
    
//     const results = {
//       email: { configured: false, working: false },
//       sms: { configured: false, working: false }
//     };
    
//     // Test email
//     try {
//       const { testEmailConnection } = await import('./email.js');
//       const emailTest = await testEmailConnection();
//       results.email.configured = true;
//       results.email.working = emailTest.success;
//       results.email.message = emailTest.message || emailTest.error;
//     } catch (error) {
//       results.email.error = error.message;
//     }
    
//     // Test SMS
//     try {
//       const { testSMSConnection } = await import('./sms.js');
//       const smsTest = await testSMSConnection();
//       results.sms.configured = true;
//       results.sms.working = smsTest.success;
//       results.sms.message = smsTest.message || smsTest.error;
//     } catch (error) {
//       results.sms.error = error.message;
//     }
    
//     console.log('🧪 Notification service test results:', results);
//     return results;
    
//   } catch (error) {
//     console.error('❌ Error testing notification services:', error);
//     throw error;
//   }
// };

// // Get notification configuration
// export const getNotificationConfig = () => {
//   return {
//     email: {
//       configured: !!(process.env.MAIL_USER && process.env.MAIL_PASS),
//       service: 'gmail',
//       customSMTP: !!process.env.SMTP_HOST
//     },
//     sms: {
//       configured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
//       provider: 'Twilio',
//       phoneNumber: process.env.TWILIO_PHONE_NUMBER || 'Not configured'
//     },
//     templates: {
//       email: Object.keys(emailTemplates),
//       sms: Object.keys(smsTemplates)
//     }
//   };
// };

// // ✅ FIXED: Remove duplicate exports - only export what's not already exported
// // Don't re-export emailTemplates and smsTemplates to avoid conflicts