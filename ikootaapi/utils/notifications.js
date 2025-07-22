// ikootaapi/utils/notifications.js - FIXED DUPLICATE EXPORTS
// Unified notifications module combining email and SMS functionality

import { sendEmail as emailUtilSendEmail, emailTemplates } from './email.js';
import { sendSMS as smsUtilSendSMS, smsTemplates } from './sms.js';
import dotenv from 'dotenv';

dotenv.config();

// ✅ FIXED: Unified sendEmail function with template support
export const sendEmail = async (to, templateOrSubject, data = {}, options = {}) => {
  try {
    console.log('📧 Unified sendEmail called:', { to, templateOrSubject, hasData: !!data });
    
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
    
    console.log('📧 Sending email with subject:', subject);
    
    const result = await emailUtilSendEmail(to, subject, emailContent, options);
    
    console.log('✅ Unified email sent successfully');
    return result;
    
  } catch (error) {
    console.error('❌ Error in unified sendEmail:', error);
    throw error;
  }
};

// ✅ FIXED: Unified sendSMS function with template support
export const sendSMS = async (to, templateOrMessage, data = {}, options = {}) => {
  try {
    console.log('📱 Unified sendSMS called:', { to, templateOrMessage, hasData: !!data });
    
    let message;
    
    // Check if it's a template name or direct message
    if (smsTemplates[templateOrMessage]) {
      console.log('📱 Using SMS template:', templateOrMessage);
      message = smsTemplates[templateOrMessage](data);
    } else {
      // Direct message
      message = templateOrMessage;
    }
    
    console.log('📱 Sending SMS with message length:', message.length);
    
    const result = await smsUtilSendSMS(to, message, options);
    
    console.log('✅ Unified SMS sent successfully');
    return result;
    
  } catch (error) {
    console.error('❌ Error in unified sendSMS:', error);
    throw error;
  }
};

// ✅ ENHANCED: Send notification via email or SMS based on preference
export const sendNotification = async (recipient, method, templateOrContent, data = {}, options = {}) => {
  try {
    console.log('🔔 Sending notification:', { recipient, method, templateOrContent });
    
    switch (method.toLowerCase()) {
      case 'email':
        return await sendEmail(recipient, templateOrContent, data, options);
      
      case 'sms':
      case 'phone':
        return await sendSMS(recipient, templateOrContent, data, options);
      
      case 'both':
        // Send both email and SMS
        const results = await Promise.allSettled([
          sendEmail(recipient.email || recipient, templateOrContent, data, options),
          sendSMS(recipient.phone || recipient, templateOrContent, data, options)
        ]);
        
        return {
          success: true,
          email: results[0].status === 'fulfilled' ? results[0].value : { error: results[0].reason },
          sms: results[1].status === 'fulfilled' ? results[1].value : { error: results[1].reason }
        };
      
      default:
        throw new Error(`Unsupported notification method: ${method}`);
    }
    
  } catch (error) {
    console.error('❌ Error sending notification:', error);
    throw error;
  }
};

// ✅ ENHANCED: Bulk notification sending
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
      results.push(...batchResults.map(r => r.value));
      
      // Add delay between batches
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
      results
    };
    
  } catch (error) {
    console.error('❌ Error in bulk notification:', error);
    throw error;
  }
};

// ✅ TEST: Test all notification methods
export const testNotificationServices = async () => {
  try {
    console.log('🧪 Testing notification services...');
    
    const results = {
      email: { configured: false, working: false },
      sms: { configured: false, working: false }
    };
    
    // Test email
    try {
      const { testEmailConnection } = await import('./email.js');
      const emailTest = await testEmailConnection();
      results.email.configured = true;
      results.email.working = emailTest.success;
      results.email.message = emailTest.message || emailTest.error;
    } catch (error) {
      results.email.error = error.message;
    }
    
    // Test SMS
    try {
      const { testSMSConnection } = await import('./sms.js');
      const smsTest = await testSMSConnection();
      results.sms.configured = true;
      results.sms.working = smsTest.success;
      results.sms.message = smsTest.message || smsTest.error;
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

// Get notification configuration
export const getNotificationConfig = () => {
  return {
    email: {
      configured: !!(process.env.MAIL_USER && process.env.MAIL_PASS),
      service: 'gmail',
      customSMTP: !!process.env.SMTP_HOST
    },
    sms: {
      configured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
      provider: 'Twilio',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || 'Not configured'
    },
    templates: {
      email: Object.keys(emailTemplates),
      sms: Object.keys(smsTemplates)
    }
  };
};

// ✅ FIXED: Remove duplicate exports - only export what's not already exported
// Don't re-export emailTemplates and smsTemplates to avoid conflicts