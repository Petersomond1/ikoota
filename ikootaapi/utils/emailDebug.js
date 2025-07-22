// ikootaapi/utils/emailDebug.js - Debug Helper for Email Issues
import dotenv from 'dotenv';

dotenv.config();

export const debugEmailConfiguration = () => {
  console.log('🔍 EMAIL CONFIGURATION DEBUG');
  console.log('================================');
  
  // Check environment variables
  console.log('📧 Environment Variables:');
  console.log('   MAIL_USER:', process.env.MAIL_USER ? '✅ Set' : '❌ Missing');
  console.log('   MAIL_PASS:', process.env.MAIL_PASS ? '✅ Set' : '❌ Missing');
  console.log('   NODE_ENV:', process.env.NODE_ENV || 'Not set');
  
  // Check credentials format
  if (process.env.MAIL_USER) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    console.log('   Email format:', emailRegex.test(process.env.MAIL_USER) ? '✅ Valid' : '❌ Invalid');
  }
  
  if (process.env.MAIL_PASS) {
    const passLength = process.env.MAIL_PASS.replace(/\s/g, '').length;
    console.log('   Password length:', passLength, passLength === 16 ? '✅ Correct' : '❌ Should be 16 characters');
  }
  
  // Network troubleshooting tips
  console.log('📊 Troubleshooting Tips:');
  console.log('   1. Ensure 2FA is enabled on Gmail');
  console.log('   2. Generate App Password at: https://myaccount.google.com/apppasswords');
  console.log('   3. Use App Password (16 chars) not Gmail password');
  console.log('   4. Check firewall/antivirus blocking port 587');
  console.log('   5. Try connecting from different network');
  
  // Test connection suggestion
  console.log('🧪 Test Commands:');
  console.log('   POST /api/auth/test-email with { "email": "your-test@email.com" }');
  console.log('   GET /api/auth/test-email-config');
  
  return {
    configured: !!(process.env.MAIL_USER && process.env.MAIL_PASS),
    user: process.env.MAIL_USER,
    hasPassword: !!process.env.MAIL_PASS,
    passwordLength: process.env.MAIL_PASS ? process.env.MAIL_PASS.replace(/\s/g, '').length : 0
  };
};

// Run debug on import in development
if (process.env.NODE_ENV === 'development') {
  debugEmailConfiguration();
}