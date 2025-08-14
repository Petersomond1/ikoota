// ikootaapi/scripts/check-env.js
// Run this to verify your environment setup

import dotenv from 'dotenv';
dotenv.config();

console.log('🔍 Environment Configuration Check');
console.log('=====================================');

const requiredEnvVars = [
  'DB_HOST',
  'DB_USER', 
  'DB_PASSWORD',
  'DB_NAME',
  'JWT_SECRET',
  'MAIL_USER',
  'MAIL_PASS'
];

const optionalEnvVars = [
  'PORT',
  'NODE_ENV',
  'FRONTEND_URL',
  'SUPPORT_EMAIL'
];

console.log('\n✅ Required Environment Variables:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  const displayValue = varName.includes('PASSWORD') || varName.includes('SECRET') || varName.includes('PASS') 
    ? (value ? '***HIDDEN***' : 'NOT SET') 
    : (value || 'NOT SET');
  
  console.log(`${status} ${varName}: ${displayValue}`);
});

console.log('\n⚙️ Optional Environment Variables:');
optionalEnvVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '⚠️';
  console.log(`${status} ${varName}: ${value || 'NOT SET (using default)'}`);
});

console.log('\n🔗 Computed URLs:');
console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
console.log(`API Port: ${process.env.PORT || 3000}`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

// Test JWT Secret
if (process.env.JWT_SECRET) {
  console.log(`\n🔐 JWT Secret Length: ${process.env.JWT_SECRET.length} characters`);
  if (process.env.JWT_SECRET.length < 32) {
    console.log('⚠️ JWT Secret should be at least 32 characters for security');
  }
} else {
  console.log('\n❌ JWT_SECRET is required for authentication!');
}

// Database connection test
if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME) {
  console.log('\n📊 Database Configuration appears complete');
} else {
  console.log('\n❌ Database configuration incomplete');
}

// Email configuration test
if (process.env.MAIL_USER && process.env.MAIL_PASS) {
  console.log('\n📧 Email Configuration appears complete');
} else {
  console.log('\n⚠️ Email configuration incomplete - verification emails may fail');
}