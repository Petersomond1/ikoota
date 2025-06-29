import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Enhanced email transporter with CORRECT function name
const createTransporter = () => {
  const config = {
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  };

  // Alternative configuration for custom SMTP
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({ // FIXED: was createTransporter, now createTransport
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || process.env.MAIL_USER,
        pass: process.env.SMTP_PASS || process.env.MAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  return nodemailer.createTransport(config); // FIXED: was createTransporter, now createTransport
};

const transporter = createTransporter();

// Enhanced sendEmail function with template support
export const sendEmail = async (to, subject, content, options = {}) => {
  try {
    if (!to || !subject || !content) {
      throw new Error('Email recipient, subject, and content are required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      throw new Error('Invalid email format');
    }

    const mailOptions = {
      from: {
        name: options.fromName || process.env.MAIL_FROM_NAME || 'Ikoota Platform',
        address: process.env.MAIL_USER
      },
      to,
      subject,
      text: typeof content === 'string' ? content : content.text,
      html: content.html || null,
      attachments: options.attachments || [],
      priority: options.priority || 'normal',
      ...options.customOptions
    };

    console.log(`Sending email to: ${to}, Subject: ${subject}`);
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', {
      messageId: info.messageId,
      recipient: to,
      subject: subject,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      messageId: info.messageId,
      response: info.response
    };

  } catch (error) {
    console.error('Error sending email:', {
      error: error.message,
      recipient: to,
      subject: subject,
      timestamp: new Date().toISOString()
    });
    
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

// Enhanced sendBulkEmail function
export const sendBulkEmail = async (recipients, subject, content, options = {}) => {
  try {
    if (!Array.isArray(recipients) || recipients.length === 0) {
      throw new Error('Recipients must be a non-empty array');
    }

    // Validate all email addresses
    recipients.forEach(email => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error(`Invalid email format: ${email}`);
      }
    });

    const results = [];
    const batchSize = options.batchSize || 10;
    const delay = options.delay || 1000; // 1 second delay between batches

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (recipient) => {
        try {
          const result = await sendEmail(recipient, subject, content, options);
          return { recipient, success: true, result };
        } catch (error) {
          return { recipient, success: false, error: error.message };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map(r => r.value));

      // Add delay between batches to avoid rate limiting
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`Bulk email completed: ${successful} successful, ${failed} failed`);

    return {
      success: true,
      total: recipients.length,
      successful,
      failed,
      results
    };

  } catch (error) {
    console.error('Error in bulk email sending:', error);
    throw new Error(`Bulk email sending failed: ${error.message}`);
  }
};

// Email template functions
export const emailTemplates = {
  // Welcome email template
  welcome: (username) => ({
    subject: 'Welcome to Ikoota Platform!',
    text: `Hello ${username},\n\nWelcome to the Ikoota platform! We're excited to have you join our community.\n\nBest regards,\nThe Ikoota Team`,
    html: `
      <h2>Welcome to Ikoota Platform!</h2>
      <p>Hello <strong>${username}</strong>,</p>
      <p>Welcome to the Ikoota platform! We're excited to have you join our community.</p>
      <p>Best regards,<br>The Ikoota Team</p>
    `
  }),

  // Survey approval template
  surveyApproval: (username, status, remarks = '') => ({
    subject: `Membership Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    text: `Hello ${username},\n\n${status === 'approved' ? 'Congratulations! Your membership application has been approved.' : 'We regret to inform you that your membership application has not been approved at this time.'}\n\n${remarks ? `Remarks: ${remarks}\n\n` : ''}Best regards,\nThe Ikoota Team`,
    html: `
      <h2>Membership Application ${status.charAt(0).toUpperCase() + status.slice(1)}</h2>
      <p>Hello <strong>${username}</strong>,</p>
      <p>${status === 'approved' ? 
        'Congratulations! Your membership application has been approved.' : 
        'We regret to inform you that your membership application has not been approved at this time.'
      }</p>
      ${remarks ? `<p><strong>Remarks:</strong> ${remarks}</p>` : ''}
      <p>Best regards,<br>The Ikoota Team</p>
    `
  }),

  // Content notification template
  contentNotification: (username, contentType, contentTitle, action) => ({
    subject: `Your ${contentType} has been ${action}`,
    text: `Hello ${username},\n\nYour ${contentType} "${contentTitle}" has been ${action}.\n\nBest regards,\nThe Ikoota Team`,
    html: `
      <h2>Content Update Notification</h2>
      <p>Hello <strong>${username}</strong>,</p>
      <p>Your ${contentType} "<strong>${contentTitle}</strong>" has been ${action}.</p>
      <p>Best regards,<br>The Ikoota Team</p>
    `
  }),

  // Password reset template
  passwordReset: (username, resetLink) => ({
    subject: 'Password Reset Request',
    text: `Hello ${username},\n\nYou requested a password reset. Click the link below to reset your password:\n\n${resetLink}\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nThe Ikoota Team`,
    html: `
      <h2>Password Reset Request</h2>
      <p>Hello <strong>${username}</strong>,</p>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <p><a href="${resetLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br>The Ikoota Team</p>
    `
  }),

  // Admin notification template
  adminNotification: (title, message, actionUrl = null) => ({
    subject: `Admin Notification: ${title}`,
    text: `${message}${actionUrl ? `\n\nAction required: ${actionUrl}` : ''}`,
    html: `
      <h2>Admin Notification: ${title}</h2>
      <p>${message}</p>
      ${actionUrl ? `<p><a href="${actionUrl}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Take Action</a></p>` : ''}
    `
  })
};

// Test email connection
export const testEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log('Email server connection verified successfully');
    return { success: true, message: 'Email server connection verified' };
  } catch (error) {
    console.error('Email server connection failed:', error);
    return { success: false, error: error.message };
  }
};

// Get email configuration info (without sensitive data)
export const getEmailConfig = () => {
  return {
    service: 'gmail',
    user: process.env.MAIL_USER ? process.env.MAIL_USER.replace(/(.{3}).*(@.*)/, '$1***$2') : 'Not configured',
    configured: !!(process.env.MAIL_USER && process.env.MAIL_PASS),
    customSMTP: !!process.env.SMTP_HOST
  };
};