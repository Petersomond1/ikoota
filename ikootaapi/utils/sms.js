//ikootaapi\utils\sms.js
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

// Enhanced Twilio client with error handling
const createTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    console.warn('Twilio credentials not configured. SMS functionality will be disabled.');
    return null;
  }

  try {
    return twilio(accountSid, authToken);
  } catch (error) {
    console.error('Failed to initialize Twilio client:', error);
    return null;
  }
};

const client = createTwilioClient();

// Enhanced sendSMS function with validation and templates
export const sendSMS = async (to, message, options = {}) => {
  try {
    if (!client) {
      throw new Error('SMS service not configured. Please check Twilio credentials.');
    }

    if (!to || !message) {
      throw new Error('Phone number and message are required');
    }

    // Validate and format phone number
    const formattedPhone = formatPhoneNumber(to);
    
    // Validate message length (Twilio limit is 1600 characters)
    if (message.length > 1600) {
      throw new Error('Message too long. Maximum 1600 characters allowed.');
    }

    const messageOptions = {
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
      ...options.customOptions
    };

    // Add media URL if provided
    if (options.mediaUrl) {
      messageOptions.mediaUrl = Array.isArray(options.mediaUrl) ? options.mediaUrl : [options.mediaUrl];
    }

    console.log(`Sending SMS to: ${formattedPhone}`);
    
    const response = await client.messages.create(messageOptions);
    
    console.log('SMS sent successfully:', {
      sid: response.sid,
      recipient: formattedPhone,
      status: response.status,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      sid: response.sid,
      status: response.status,
      recipient: formattedPhone
    };

  } catch (error) {
    console.error('Error sending SMS:', {
      error: error.message,
      recipient: to,
      timestamp: new Date().toISOString()
    });
    
    throw new Error(`SMS sending failed: ${error.message}`);
  }
};

// Enhanced sendBulkSMS function
export const sendBulkSMS = async (recipients, message, options = {}) => {
  try {
    if (!client) {
      throw new Error('SMS service not configured. Please check Twilio credentials.');
    }

    if (!Array.isArray(recipients) || recipients.length === 0) {
      throw new Error('Recipients must be a non-empty array');
    }

    // Validate all phone numbers
    const validatedRecipients = recipients.map(phone => {
      try {
        return formatPhoneNumber(phone);
      } catch (error) {
        throw new Error(`Invalid phone number: ${phone}`);
      }
    });

    const results = [];
    const batchSize = options.batchSize || 5; // Smaller batch size for SMS
    const delay = options.delay || 2000; // 2 second delay between batches

    for (let i = 0; i < validatedRecipients.length; i += batchSize) {
      const batch = validatedRecipients.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (recipient) => {
        try {
          const result = await sendSMS(recipient, message, options);
          return { recipient, success: true, result };
        } catch (error) {
          return { recipient, success: false, error: error.message };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map(r => r.value));

      // Add delay between batches to avoid rate limiting
      if (i + batchSize < validatedRecipients.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`Bulk SMS completed: ${successful} successful, ${failed} failed`);

    return {
      success: true,
      total: recipients.length,
      successful,
      failed,
      results
    };

  } catch (error) {
    console.error('Error in bulk SMS sending:', error);
    throw new Error(`Bulk SMS sending failed: ${error.message}`);
  }
};

// Phone number formatting and validation
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) {
    throw new Error('Phone number is required');
  }

  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check if it's already in international format
  if (cleaned.startsWith('1') && cleaned.length === 11) {
    return `+${cleaned}`;
  }
  
  // Check if it's a 10-digit US number
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  
  // Check if it's already a valid international number
  if (cleaned.length >= 10 && cleaned.length <= 15) {
    return `+${cleaned}`;
  }
  
  throw new Error('Invalid phone number format');
};

// SMS template functions
export const smsTemplates = {
  // Welcome SMS
  welcome: (username) => 
    `Welcome to Ikoota, ${username}! Your account has been activated. Start exploring our platform today.`,

  // Survey approval SMS
  surveyApproval: (username, status) => 
    `Hello ${username}, your membership application has been ${status}. Check your email for details.`,

  // Verification code SMS
  verificationCode: (code) => 
    `Your Ikoota verification code is: ${code}. This code expires in 10 minutes.`,

  // Password reset SMS
  passwordReset: (username) => 
    `Hello ${username}, a password reset was requested for your Ikoota account. Check your email for the reset link.`,

  // Content notification SMS
  contentNotification: (username, contentType, action) => 
    `Hello ${username}, your ${contentType} has been ${action}. Check the app for details.`,

  // Admin alert SMS
  adminAlert: (message) => 
    `Ikoota Admin Alert: ${message}`,

  // Maintenance notification
  maintenanceNotification: (startTime, duration) => 
    `Ikoota will undergo maintenance starting ${startTime} for approximately ${duration}. We apologize for any inconvenience.`
};

// Get SMS status
export const getSMSStatus = async (messageSid) => {
  try {
    if (!client) {
      throw new Error('SMS service not configured');
    }

    const message = await client.messages(messageSid).fetch();
    
    return {
      success: true,
      sid: message.sid,
      status: message.status,
      direction: message.direction,
      from: message.from,
      to: message.to,
      body: message.body,
      dateCreated: message.dateCreated,
      dateUpdated: message.dateUpdated,
      dateSent: message.dateSent,
      errorCode: message.errorCode,
      errorMessage: message.errorMessage
    };

  } catch (error) {
    console.error('Error fetching SMS status:', error);
    throw new Error(`Failed to get SMS status: ${error.message}`);
  }
};

// Get SMS usage statistics
export const getSMSUsage = async (startDate, endDate) => {
  try {
    if (!client) {
      throw new Error('SMS service not configured');
    }

    const usage = await client.usage.records.list({
      category: 'sms',
      startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      endDate: endDate || new Date()
    });

    return {
      success: true,
      usage: usage.map(record => ({
        category: record.category,
        description: record.description,
        count: record.count,
        usage: record.usage,
        usageUnit: record.usageUnit,
        price: record.price,
        priceUnit: record.priceUnit,
        startDate: record.startDate,
        endDate: record.endDate
      }))
    };

  } catch (error) {
    console.error('Error fetching SMS usage:', error);
    throw new Error(`Failed to get SMS usage: ${error.message}`);
  }
};

// Test SMS connection
export const testSMSConnection = async () => {
  try {
    if (!client) {
      return { success: false, error: 'SMS service not configured' };
    }

    // Test by fetching account info
    const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    
    console.log('SMS service connection verified successfully');
    return { 
      success: true, 
      message: 'SMS service connection verified',
      accountStatus: account.status
    };

  } catch (error) {
    console.error('SMS service connection failed:', error);
    return { success: false, error: error.message };
  }
};

// Get SMS configuration info (without sensitive data)
export const getSMSConfig = () => {
  return {
    provider: 'Twilio',
    accountSid: process.env.TWILIO_ACCOUNT_SID ? 
      process.env.TWILIO_ACCOUNT_SID.replace(/(.{8}).*/, '$1***') : 'Not configured',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || 'Not configured',
    configured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER)
  };
};