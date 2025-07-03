// ikootaapi/utils/notifications.js
// Unified notifications module combining email and SMS functionality

import { sendEmail as emailSender, emailTemplates } from './email.js';
import { sendSMS as smsSender, smsTemplates } from './sms.js';
import dotenv from 'dotenv';

dotenv.config();

// Unified sendEmail function with template support
export const sendEmail = async (to, templateOrSubject, templateData = {}, options = {}) => {
  try {
    let emailContent;
    let subject;

    // Check if it's a template name or direct subject
    if (getEmailTemplate(templateOrSubject)) {
      const template = getEmailTemplate(templateOrSubject);
      emailContent = template(templateData);
      subject = emailContent.subject;
    } else {
      // Direct subject and content
      subject = templateOrSubject;
      emailContent = {
        text: templateData.text || '',
        html: templateData.html || templateData.text || ''
      };
    }

    return await emailSender(to, subject, emailContent, options);
  } catch (error) {
    console.error('Error in unified sendEmail:', error);
    throw error;
  }
};

// Unified sendSMS function with template support
export const sendSMS = async (to, templateOrMessage, templateData = {}, options = {}) => {
  try {
    let message;

    // Check if it's a template name or direct message
    if (getSMSTemplate(templateOrMessage)) {
      const template = getSMSTemplate(templateOrMessage);
      message = template(templateData);
    } else {
      // Direct message
      message = templateOrMessage;
    }

    return await smsSender(to, message, options);
  } catch (error) {
    console.error('Error in unified sendSMS:', error);
    throw error;
  }
};

// Enhanced email templates for membership system
const membershipEmailTemplates = {
  // Verification code email
  verification_code: (data) => ({
    subject: 'Your Ikoota Verification Code',
    text: `Your verification code is: ${data.VERIFICATION_CODE}\n\nThis code expires in ${data.EXPIRES_IN || '10 minutes'}.\n\nBest regards,\nThe Ikoota Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Your Verification Code</h2>
        <p>Your verification code is:</p>
        <div style="background-color: #f8f9fa; border: 2px dashed #007bff; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #007bff; margin: 0; font-size: 2em; letter-spacing: 3px;">${data.VERIFICATION_CODE}</h1>
        </div>
        <p style="color: #666;">This code expires in ${data.EXPIRES_IN || '10 minutes'}.</p>
        <p>Best regards,<br>The Ikoota Team</p>
      </div>
    `
  }),

  // Welcome registration email
  welcome_registration: (data) => ({
    subject: 'Welcome to Ikoota Platform!',
    text: `Hello ${data.USERNAME},\n\nWelcome to the Ikoota platform! Your account has been created successfully.\n\nYour application ticket: ${data.APPLICATION_TICKET}\n\nNext steps:\n- Complete your membership application\n- Wait for admin approval\n- Start exploring our community\n\nBest regards,\nThe Ikoota Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Welcome to Ikoota Platform!</h2>
        <p>Hello <strong>${data.USERNAME}</strong>,</p>
        <p>Welcome to the Ikoota platform! Your account has been created successfully.</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
          <p><strong>Application Ticket:</strong> ${data.APPLICATION_TICKET}</p>
        </div>
        <h3>Next Steps:</h3>
        <ul>
          <li>Complete your membership application</li>
          <li>Wait for admin approval</li>
          <li>Start exploring our community</li>
        </ul>
        <p>Best regards,<br>The Ikoota Team</p>
      </div>
    `
  }),

  // Initial application submitted
  initial_application_submitted: (data) => ({
    subject: 'Application Submitted Successfully',
    text: `Hello ${data.USERNAME},\n\nYour membership application has been submitted successfully.\n\nApplication Ticket: ${data.APPLICATION_TICKET}\nSubmission Date: ${data.SUBMISSION_DATE}\n\nWe will review your application within 3-5 business days and notify you of the decision.\n\nBest regards,\nThe Ikoota Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #007bff;">Application Submitted Successfully</h2>
        <p>Hello <strong>${data.USERNAME}</strong>,</p>
        <p>Your membership application has been submitted successfully.</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Application Ticket:</strong> ${data.APPLICATION_TICKET}</p>
          <p><strong>Submission Date:</strong> ${data.SUBMISSION_DATE}</p>
        </div>
        <p>We will review your application within <strong>3-5 business days</strong> and notify you of the decision.</p>
        <p>Best regards,<br>The Ikoota Team</p>
      </div>
    `
  }),

  // Initial application approved
  initial_application_approved: (data) => ({
    subject: 'Congratulations! Your Application Has Been Approved',
    text: `Hello ${data.USERNAME},\n\nCongratulations! Your membership application has been approved.\n\nReview Date: ${data.REVIEW_DATE}\n${data.ADMIN_NOTES ? `Admin Notes: ${data.ADMIN_NOTES}\n` : ''}\nYou can now access pre-member benefits and apply for full membership when ready.\n\nBest regards,\nThe Ikoota Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">🎉 Congratulations! Your Application Has Been Approved</h2>
        <p>Hello <strong>${data.USERNAME}</strong>,</p>
        <p>Congratulations! Your membership application has been approved.</p>
        <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Review Date:</strong> ${data.REVIEW_DATE}</p>
          ${data.ADMIN_NOTES ? `<p><strong>Admin Notes:</strong> ${data.ADMIN_NOTES}</p>` : ''}
        </div>
        <p>You can now access pre-member benefits and apply for full membership when ready.</p>
        <p>Best regards,<br>The Ikoota Team</p>
      </div>
    `
  }),

  // Initial application rejected
  initial_application_rejected: (data) => ({
    subject: 'Application Update Required',
    text: `Hello ${data.USERNAME},\n\nWe have reviewed your membership application and it requires some updates before approval.\n\nReview Date: ${data.REVIEW_DATE}\n${data.ADMIN_NOTES ? `Feedback: ${data.ADMIN_NOTES}\n` : ''}\nPlease review the feedback and resubmit your application.\n\nBest regards,\nThe Ikoota Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Application Update Required</h2>
        <p>Hello <strong>${data.USERNAME}</strong>,</p>
        <p>We have reviewed your membership application and it requires some updates before approval.</p>
        <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Review Date:</strong> ${data.REVIEW_DATE}</p>
          ${data.ADMIN_NOTES ? `<p><strong>Feedback:</strong> ${data.ADMIN_NOTES}</p>` : ''}
        </div>
        <p>Please review the feedback and resubmit your application.</p>
        <p>Best regards,<br>The Ikoota Team</p>
      </div>
    `
  }),

  // Full membership application submitted
  full_membership_application_submitted: (data) => ({
    subject: 'Full Membership Application Received',
    text: `Hello ${data.USERNAME},\n\nYour full membership application has been received and is under review.\n\nApplication Ticket: ${data.APPLICATION_TICKET}\nSubmission Date: ${data.SUBMISSION_DATE}\n\nWe will review your application within 5-7 business days.\n\nBest regards,\nThe Ikoota Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #007bff;">Full Membership Application Received</h2>
        <p>Hello <strong>${data.USERNAME}</strong>,</p>
        <p>Your full membership application has been received and is under review.</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Application Ticket:</strong> ${data.APPLICATION_TICKET}</p>
          <p><strong>Submission Date:</strong> ${data.SUBMISSION_DATE}</p>
        </div>
        <p>We will review your application within <strong>5-7 business days</strong>.</p>
        <p>Best regards,<br>The Ikoota Team</p>
      </div>
    `
  }),

  // Full membership approved
  full_membership_approved: (data) => ({
    subject: 'Welcome to Full Membership!',
    text: `Hello ${data.USERNAME},\n\nCongratulations! Your full membership application has been approved.\n\nReview Date: ${data.REVIEW_DATE}\n${data.ADMIN_NOTES ? `Admin Notes: ${data.ADMIN_NOTES}\n` : ''}\nYou now have access to all member benefits and privileges.\n\nWelcome to the Ikoota community!\n\nBest regards,\nThe Ikoota Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">🎉 Welcome to Full Membership!</h2>
        <p>Hello <strong>${data.USERNAME}</strong>,</p>
        <p>Congratulations! Your full membership application has been approved.</p>
        <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Review Date:</strong> ${data.REVIEW_DATE}</p>
          ${data.ADMIN_NOTES ? `<p><strong>Admin Notes:</strong> ${data.ADMIN_NOTES}</p>` : ''}
        </div>
        <p>You now have access to all member benefits and privileges.</p>
        <p><strong>Welcome to the Ikoota community!</strong></p>
        <p>Best regards,<br>The Ikoota Team</p>
      </div>
    `
  }),

  // Full membership rejected
  full_membership_rejected: (data) => ({
    subject: 'Full Membership Application Update',
    text: `Hello ${data.USERNAME},\n\nWe have reviewed your full membership application and it requires attention before approval.\n\nReview Date: ${data.REVIEW_DATE}\n${data.ADMIN_NOTES ? `Feedback: ${data.ADMIN_NOTES}\n` : ''}\nPlease review the feedback and contact us if you have questions.\n\nBest regards,\nThe Ikoota Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Full Membership Application Update</h2>
        <p>Hello <strong>${data.USERNAME}</strong>,</p>
        <p>We have reviewed your full membership application and it requires attention before approval.</p>
        <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Review Date:</strong> ${data.REVIEW_DATE}</p>
          ${data.ADMIN_NOTES ? `<p><strong>Feedback:</strong> ${data.ADMIN_NOTES}</p>` : ''}
        </div>
        <p>Please review the feedback and contact us if you have questions.</p>
        <p>Best regards,<br>The Ikoota Team</p>
      </div>
    `
  }),

  // Admin notification
  admin_notification: (data) => ({
    subject: data.SUBJECT,
    text: `Hello ${data.USERNAME},\n\n${data.MESSAGE}\n\nPriority: ${data.PRIORITY}\n\nBest regards,\nThe Ikoota Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #007bff;">Admin Notification</h2>
        <p>Hello <strong>${data.USERNAME}</strong>,</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
          <p>${data.MESSAGE}</p>
        </div>
        <p><small>Priority: ${data.PRIORITY}</small></p>
        <p>Best regards,<br>The Ikoota Team</p>
      </div>
    `
  }),

  // Membership notification
  membership_notification: (data) => ({
    subject: data.SUBJECT,
    text: `Hello ${data.USERNAME},\n\n${data.MESSAGE}\n\nThis message is for ${data.MEMBERSHIP_STAGE}s.\n\nBest regards,\nThe Ikoota Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Membership Update</h2>
        <p>Hello <strong>${data.USERNAME}</strong>,</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p>${data.MESSAGE}</p>
        </div>
        <p><small>This message is for ${data.MEMBERSHIP_STAGE}s.</small></p>
        <p>Best regards,<br>The Ikoota Team</p>
      </div>
    `
  })
};

// Enhanced SMS templates for membership system
const membershipSMSTemplates = {
  verification_code: (data) => 
    `Your Ikoota verification code is: ${data.VERIFICATION_CODE}. Valid for ${data.EXPIRES_IN || '10 minutes'}.`,
  
  application_submitted: (data) => 
    `Hello ${data.USERNAME}, your membership application has been submitted successfully. Ticket: ${data.APPLICATION_TICKET}`,
  
  application_approved: (data) => 
    `Congratulations ${data.USERNAME}! Your membership application has been approved. Welcome to Ikoota!`,
  
  application_rejected: (data) => 
    `Hello ${data.USERNAME}, your membership application needs revision. Please check your email for details.`,
  
  full_membership_approved: (data) => 
    `Congratulations ${data.USERNAME}! You are now a full member of Ikoota. Welcome!`,
  
  admin_notification: (data) => 
    `Ikoota: ${data.MESSAGE}`,
  
  membership_notification: (data) => 
    `Hello ${data.USERNAME}, ${data.MESSAGE}`
};

// Helper function to get email template
const getEmailTemplate = (templateName) => {
  return membershipEmailTemplates[templateName] || emailTemplates[templateName];
};

// Helper function to get SMS template
const getSMSTemplate = (templateName) => {
  return membershipSMSTemplates[templateName] || smsTemplates[templateName];
};

// Send notification to both email and SMS
export const sendNotification = async (recipient, templateName, templateData = {}, options = {}) => {
  const results = {
    email: null,
    sms: null,
    success: false
  };

  try {
    // Send email if email address provided
    if (recipient.email && (options.channels?.includes('email') || !options.channels)) {
      try {
        results.email = await sendEmail(recipient.email, templateName, templateData, options.emailOptions);
        console.log(`Email sent successfully to ${recipient.email}`);
      } catch (error) {
        console.error(`Failed to send email to ${recipient.email}:`, error.message);
        results.email = { success: false, error: error.message };
      }
    }

    // Send SMS if phone number provided
    if (recipient.phone && (options.channels?.includes('sms') || !options.channels)) {
      try {
        results.sms = await sendSMS(recipient.phone, templateName, templateData, options.smsOptions);
        console.log(`SMS sent successfully to ${recipient.phone}`);
      } catch (error) {
        console.error(`Failed to send SMS to ${recipient.phone}:`, error.message);
        results.sms = { success: false, error: error.message };
      }
    }

    // Consider successful if at least one channel succeeded
    results.success = (results.email?.success !== false) || (results.sms?.success !== false);

    return results;
  } catch (error) {
    console.error('Error in sendNotification:', error);
    throw error;
  }
};

// Bulk notification function
export const sendBulkNotification = async (recipients, templateName, templateData = {}, options = {}) => {
  const results = [];
  const batchSize = options.batchSize || 10;
  const delay = options.delay || 1000;

  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (recipient) => {
      try {
        const result = await sendNotification(recipient, templateName, {
          ...templateData,
          USERNAME: recipient.username || templateData.USERNAME
        }, options);
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

  console.log(`Bulk notification completed: ${successful} successful, ${failed} failed`);

  return {
    success: true,
    total: recipients.length,
    successful,
    failed,
    results
  };
};

// Test notification system
export const testNotificationSystem = async () => {
  try {
    // Test email
    const emailTest = await emailSender(
      process.env.TEST_EMAIL || process.env.MAIL_USER,
      'Notification System Test',
      { text: 'Email system working correctly', html: '<p>Email system working correctly</p>' }
    );

    // Test SMS (if configured)
    let smsTest = null;
    if (process.env.TEST_PHONE && process.env.TWILIO_ACCOUNT_SID) {
      smsTest = await smsSender(process.env.TEST_PHONE, 'SMS system test - Ikoota');
    }

    return {
      success: true,
      email: emailTest,
      sms: smsTest,
      message: 'Notification system test completed'
    };
  } catch (error) {
    console.error('Notification system test failed:', error);
    return {
      success: false,
      error: error.message
    };
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
      email: Object.keys(membershipEmailTemplates),
      sms: Object.keys(membershipSMSTemplates)
    }
  };
};

// Export individual template functions for backward compatibility
export { membershipEmailTemplates as emailTemplates, membershipSMSTemplates as smsTemplates };