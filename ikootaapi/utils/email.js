//ikootaapi/utils/email.js - FIXED NODEMAILER FUNCTION
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import db from '../config/db.js';

dotenv.config();

// ✅ FIXED: Enhanced email transporter with CORRECT function name
const createTransporter = () => {
  // ✅ PRIMARY: Gmail configuration (recommended)
  const gmailConfig = {
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use STARTTLS
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS // This should be an App Password, not your Gmail password
    },
    tls: {
      rejectUnauthorized: false
    }
  };

  console.log('📧 Email config:', {
    service: 'gmail',
    user: process.env.MAIL_USER ? process.env.MAIL_USER.replace(/(.{3}).*(@.*)/, '$1***$2') : 'Not set',
    hasPassword: !!process.env.MAIL_PASS,
    host: 'smtp.gmail.com',
    port: 587
  });

  // ✅ FIXED: Use createTransport instead of createTransporter
  return nodemailer.createTransport(gmailConfig);
};

// ✅ ENHANCED: Test email configuration on startup
const transporter = createTransporter();

// Test connection immediately but don't crash if it fails
if (process.env.NODE_ENV === 'development') {
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Email configuration error:', error.message);
      console.log('🔧 Email setup instructions:');
      console.log('   1. Enable 2FA on your Gmail account');
      console.log('   2. Generate an App Password (not your Gmail password)');
      console.log('   3. Set MAIL_USER=your-email@gmail.com');
      console.log('   4. Set MAIL_PASS=your-16-character-app-password');
    } else {
      console.log('✅ Email server connection verified successfully');
    }
  });
}

// ✅ ENHANCED: sendEmail function with better error handling
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

    // Check if email service is configured
    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
      throw new Error('Email service not configured. Please set MAIL_USER and MAIL_PASS environment variables.');
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

    console.log(`📧 Sending email to: ${to}, Subject: ${subject}`);
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully:', {
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
    console.error('❌ Error sending email:', {
      error: error.message,
      recipient: to,
      subject: subject,
      timestamp: new Date().toISOString()
    });
    
    // ✅ ENHANCED: Better error messages for common issues
    let enhancedError = error.message;
    
    if (error.message.includes('Invalid login')) {
      enhancedError = 'Gmail authentication failed. Please check your App Password and ensure 2FA is enabled.';
    } else if (error.message.includes('Cannot connect to SMTP server')) {
      enhancedError = 'Cannot connect to Gmail SMTP server. Please check your internet connection and firewall settings.';
    } else if (error.message.includes('Invalid greeting')) {
      enhancedError = 'SMTP connection error. This might be a network or firewall issue preventing connection to Gmail.';
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      enhancedError = 'Network connection failed. Check your internet connection and firewall settings.';
    }
    
    throw new Error(`Email sending failed: ${enhancedError}`);
  }
};


// ✅ NEW: Add template system functionality to your existing file
export const sendEmailWithTemplate = async (to, templateName, variables = {}) => {
  try {
    console.log(`📧 Sending email template "${templateName}" to ${to}`);
    
    // Get email template from database
    const [template] = await db.execute(
      'SELECT subject, email_body FROM notification_templates WHERE template_name = ? AND is_active = TRUE',
      [templateName]
    );
    
    if (template.length === 0) {
      throw new Error(`Email template "${templateName}" not found`);
    }
    
    let { subject, email_body } = template[0];
    
    // Replace variables in template
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), value || '');
      email_body = email_body.replace(new RegExp(placeholder, 'g'), value || '');
    });
    
    // Use your existing sendEmail function with enhanced formatting
    const result = await sendEmail(to, subject, {
      text: email_body,
      html: formatEmailHTML(email_body)
    });
    
    // Log email in database
    try {
      await db.execute(`
        INSERT INTO email_logs (recipient, template_name, subject, status, sent_at)
        VALUES (?, ?, ?, 'sent', NOW())
      `, [to, templateName, subject]);
    } catch (logError) {
      console.warn('Failed to log email to database:', logError.message);
      // Don't fail the email send if logging fails
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Template email sending failed:', error);
    
    // Log failed email
    try {
      await db.execute(`
        INSERT INTO email_logs (recipient, template_name, subject, status, error_message, sent_at)
        VALUES (?, ?, ?, 'failed', ?, NOW())
      `, [to, templateName, subject || 'Unknown', error.message]);
    } catch (logError) {
      console.warn('Failed to log email error to database:', logError.message);
    }
    
    throw error;
  }
};

// ✅ NEW: Add HTML formatting function
const formatEmailHTML = (textBody) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ikoota Platform</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px; 
        }
        .header { 
          background: #2563eb; 
          color: white; 
          padding: 20px; 
          text-align: center; 
          margin-bottom: 20px; 
          border-radius: 8px 8px 0 0;
        }
        .content { 
          background: #f9fafb; 
          padding: 20px; 
          border-radius: 0 0 8px 8px; 
          border: 1px solid #e5e7eb;
        }
        .footer { 
          text-align: center; 
          margin-top: 20px; 
          font-size: 12px; 
          color: #666; 
        }
        a { color: #2563eb; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .highlight { 
          background: #dbeafe; 
          padding: 10px; 
          border-radius: 4px; 
          margin: 10px 0; 
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Ikoota Platform</h1>
      </div>
      <div class="content">
        ${textBody.replace(/\n/g, '<br>')}
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Ikoota Platform. All rights reserved.</p>
        <p>This is an automated message, please do not reply.</p>
      </div>
    </body>
    </html>
  `;
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

// ✅ FIXED: Email template functions
export const emailTemplates = {
  // Verification code template
  verification_code: (data) => ({
    subject: 'Your Ikoota Verification Code',
    text: `Your Ikoota verification code is: ${data.VERIFICATION_CODE}\n\nThis code expires in ${data.EXPIRES_IN}.\n\nIf you didn't request this code, please ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #3498db; text-align: center;">Ikoota Verification Code</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h1 style="color: #2c3e50; font-size: 32px; letter-spacing: 4px; margin: 0;">${data.VERIFICATION_CODE}</h1>
        </div>
        <p>Your verification code is: <strong>${data.VERIFICATION_CODE}</strong></p>
        <p>This code expires in <strong>${data.EXPIRES_IN}</strong>.</p>
        <p>If you didn't request this code, please ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ecf0f1;">
        <p style="color: #7f8c8d; font-size: 12px; text-align: center;">
          This is an automated message from Ikoota Platform. Please do not reply to this email.
        </p>
      </div>
    `
  }),

  // Welcome email template
  welcome_registration: (data) => ({
    subject: 'Welcome to Ikoota Platform!',
    text: `Hello ${data.USERNAME},\n\nWelcome to Ikoota! Your account has been created successfully.\n\nApplication Ticket: ${data.APPLICATION_TICKET}\n\nNext steps:\n1. Complete your membership application survey\n2. Wait for application review\n3. Start exploring our educational content\n\nBest regards,\nThe Ikoota Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #3498db; text-align: center;">Welcome to Ikoota Platform!</h2>
        <p>Hello <strong>${data.USERNAME}</strong>,</p>
        <p>Welcome to Ikoota! Your account has been created successfully.</p>
        <div style="background: #e8f4f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Application Ticket:</strong> ${data.APPLICATION_TICKET}</p>
        </div>
        <h3>Next Steps:</h3>
        <ol>
          <li>Complete your membership application survey</li>
          <li>Wait for application review</li>
          <li>Start exploring our educational content</li>
        </ol>
        <p>Best regards,<br>The Ikoota Team</p>
      </div>
    `
  })
};

// ✅ ENHANCED: Test email connection with detailed feedback
export const testEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email server connection verified successfully');
    return { success: true, message: 'Email server connection verified' };
  } catch (error) {
    console.error('❌ Email server connection failed:', error);
    
    let helpMessage = 'Check your email configuration.';
    if (error.message.includes('Invalid login')) {
      helpMessage = 'Gmail authentication failed. Use an App Password instead of your Gmail password.';
    } else if (error.message.includes('connect')) {
      helpMessage = 'Network connection issue. Check firewall and internet connection.';
    }
    
    return { 
      success: false, 
      error: error.message,
      help: helpMessage
    };
  }
};

// Get email configuration info (without sensitive data)
export const getEmailConfig = () => {
  return {
    service: 'gmail',
    user: process.env.MAIL_USER ? process.env.MAIL_USER.replace(/(.{3}).*(@.*)/, '$1***$2') : 'Not configured',
    configured: !!(process.env.MAIL_USER && process.env.MAIL_PASS),
    host: 'smtp.gmail.com',
    port: 587
  };
};