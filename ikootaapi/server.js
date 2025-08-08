// ikootaapi/server.js
// ENHANCED SERVER CONFIGURATION
// Optimized for reorganized architecture with better monitoring

import http from 'http';
import dotenv from 'dotenv';
import setupSocket from './socket.js';
import logger from './utils/logger.js';
import db from './config/db.js';
import app from './app.js';

dotenv.config();

const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// ===============================================
// SOCKET.IO SETUP
// ===============================================
setupSocket(server);

// ===============================================
// DATABASE CONNECTION TEST
// ===============================================
const testDatabaseConnection = async () => {
  try {
    await db.query('SELECT 1');
    logger.info('Database connection established successfully');
    
    // Test critical tables
    const tables = [
      'users', 
      'full_membership_applications', 
      'surveylog', 
      'chats', 
      'teachings', 
      'comments',
      'classes'
    ];
    
    for (const table of tables) {
      try {
        await db.query(`SELECT COUNT(*) as count FROM ${table}`);
        logger.info(`✅ Table ${table}: accessible`);
      } catch (error) {
        logger.warn(`⚠️ Table ${table}: ${error.message}`);
      }
    }
    
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
};

// ===============================================
// GRACEFUL SHUTDOWN
// ===============================================
const gracefulShutdown = () => {
  const signals = ['SIGTERM', 'SIGINT'];
  
  signals.forEach(signal => {
    process.on(signal, async () => {
      logger.info(`${signal} signal received: starting graceful shutdown`);
      
      // Close server
      server.close(async () => {
        logger.info('HTTP server closed');
        
        // Close database connections
        try {
          await db.close();
          logger.info('Database connections closed');
        } catch (error) {
          logger.error('Error closing database connections:', error);
        }
        
        process.exit(0);
      });
    });
  });
};

// ===============================================
// PERFORMANCE MONITORING
// ===============================================
const setupMonitoring = () => {
  // Memory usage monitoring
  setInterval(() => {
    const memoryUsage = process.memoryUsage();
    const memoryMB = Math.round(memoryUsage.rss / 1024 / 1024);
    
    if (memoryMB > 500) { // Alert if memory usage > 500MB
      logger.warn(`High memory usage: ${memoryMB}MB`);
    }
  }, 5 * 60 * 1000); // Check every 5 minutes
  
  // Uptime logging
  setInterval(() => {
    const uptimeHours = Math.floor(process.uptime() / 3600);
    if (uptimeHours > 0 && uptimeHours % 24 === 0) {
      logger.info(`Server uptime: ${uptimeHours} hours`);
    }
  }, 60 * 60 * 1000); // Check every hour
};

// ===============================================
// SERVER STARTUP
// ===============================================
const startServer = async () => {
  try {
    await testDatabaseConnection();
    
    server.listen(PORT, () => {
      console.log('\n🚀 IKOOTA API SERVER - REORGANIZED ARCHITECTURE');
      console.log('================================================================================');
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✅ Database: Connected successfully`);
      console.log(`✅ Architecture: v3.0.0 - Functionally Grouped Routes`);
      console.log('');
      
      console.log('🔐 AUTHENTICATION ENDPOINTS:');
      console.log(`   📧 Send Verification: POST http://localhost:${PORT}/api/auth/send-verification`);
      console.log(`   📝 Register: POST http://localhost:${PORT}/api/auth/register`);
      console.log(`   🔑 Login: POST http://localhost:${PORT}/api/auth/login`);
      console.log(`   🚪 Logout: GET http://localhost:${PORT}/api/auth/logout`);
      console.log('');
      
      console.log('👤 USER MANAGEMENT:');
      console.log(`   📊 User Dashboard: GET http://localhost:${PORT}/api/user-status/dashboard`);
      console.log(`   👤 User Profile: GET http://localhost:${PORT}/api/users/profile`);
      console.log(`   🔧 Admin Users: GET http://localhost:${PORT}/api/admin/users`);
      console.log('');
      
      console.log('📋 MEMBERSHIP SYSTEM:');
      console.log(`   📝 Apply: POST http://localhost:${PORT}/api/membership/application/submit`);
      console.log(`   📊 Status: GET http://localhost:${PORT}/api/membership/status`);
      console.log(`   🔧 Admin Review: GET http://localhost:${PORT}/api/admin/membership/applications`);
      console.log('');
      
      console.log('📚 CONTENT MANAGEMENT:');
      console.log(`   💬 Chats: GET http://localhost:${PORT}/api/content/chats`);
      console.log(`   📖 Teachings: GET http://localhost:${PORT}/api/content/teachings`);
      console.log(`   💭 Comments: GET http://localhost:${PORT}/api/content/comments`);
      console.log(`   🔧 Admin Content: GET http://localhost:${PORT}/api/content/admin`);
      console.log('');
      
      console.log('🎓 CLASS SYSTEM:');
      console.log(`   📚 Classes: GET http://localhost:${PORT}/api/classes`);
      console.log(`   🔧 Admin Classes: GET http://localhost:${PORT}/api/admin/classes`);
      console.log('');
      
      console.log('🆔 IDENTITY MANAGEMENT:');
      console.log(`   🎭 Converse ID: POST http://localhost:${PORT}/api/identity/converse`);
      console.log(`   👨‍🏫 Mentor ID: POST http://localhost:${PORT}/api/identity/mentor`);
      console.log(`   🔧 Admin Identity: GET http://localhost:${PORT}/api/admin/identity`);
      console.log('');
      
      console.log('💬 COMMUNICATION:');
      console.log(`   📧 Email: POST http://localhost:${PORT}/api/communication/email/send`);
      console.log(`   📱 SMS: POST http://localhost:${PORT}/api/communication/sms/send`);
      console.log(`   🔔 Notifications: POST http://localhost:${PORT}/api/communication/notification`);
      console.log('');
      
      console.log('📊 SURVEYS:');
      console.log(`   📝 Submit: POST http://localhost:${PORT}/api/survey/submit`);
      console.log(`   🔧 Admin Survey: GET http://localhost:${PORT}/api/admin/survey`);
      console.log('');
      
      console.log('🔧 SYSTEM ENDPOINTS:');
      console.log(`   ❤️ Health: GET http://localhost:${PORT}/api/health`);
      console.log(`   📚 API Info: GET http://localhost:${PORT}/api/info`);
      console.log(`   📋 Routes: GET http://localhost:${PORT}/api/routes`);
      console.log(`   📊 Metrics: GET http://localhost:${PORT}/api/metrics`);
      console.log('');
      
      console.log('🔄 BACKWARD COMPATIBILITY:');
      console.log(`   💬 Legacy Chats: GET http://localhost:${PORT}/api/chats`);
      console.log(`   📖 Legacy Teachings: GET http://localhost:${PORT}/api/teachings`);
      console.log(`   💭 Legacy Comments: GET http://localhost:${PORT}/api/comments`);
      console.log(`   📨 Legacy Messages: GET http://localhost:${PORT}/api/messages`);
      console.log('');
      
      console.log('🎯 REORGANIZATION ACHIEVEMENTS:');
      console.log('   ✅ 13 functionally grouped route modules');
      console.log('   ✅ Clear admin/user separation with /admin/ prefix');
      console.log('   ✅ Service layer architecture preparation');
      console.log('   ✅ Enhanced rate limiting and security');
      console.log('   ✅ Comprehensive error handling and logging');
      console.log('   ✅ Zero functionality loss from existing system');
      console.log('   ✅ Backward compatibility for seamless migration');
      console.log('');
      
      console.log('📁 NEW FILE STRUCTURE:');
      console.log('   🔗 Routes: Domain-grouped with admin separation');
      console.log('   🎮 Controllers: Function-specific with clear responsibilities');
      console.log('   ⚙️ Services: Business logic layer (to be implemented)');
      console.log('   🛡️ Middleware: Enhanced security and validation');
      console.log('');
      
      console.log('🔍 DEBUGGING INFO:');
      console.log(`   • Frontend compatibility: All existing calls preserved`);
      console.log(`   • New structure: /api/content/*, /api/admin/*, etc.`);
      console.log(`   • Enhanced logging: Admin operations specially tracked`);
      console.log(`   • Rate limiting: Different limits for different route types`);
      console.log('================================================================================');
      
      logger.info(`🚀 Reorganized API server running on port ${PORT}`);
      logger.info(`📁 Architecture: v3.0.0 - Functionally Grouped Routes`);
      logger.info(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`📚 API Documentation: http://localhost:${PORT}/api/info`);
      logger.info(`🔍 Route Discovery: http://localhost:${PORT}/api/routes`);
      logger.info(`❤️ Health Check: http://localhost:${PORT}/api/health`);
    });
    
    // Setup monitoring and graceful shutdown
    setupMonitoring();
    gracefulShutdown();
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();





// //ikootaapi\server.js
// import http from 'http';
// import dotenv from 'dotenv';
// import app from './app.js';
// import setupSocket from './socket.js';
// import logger from './utils/logger.js';
// import db from './config/db.js';

// dotenv.config();

// const server = http.createServer(app);
// const PORT = process.env.PORT || 5000;

// // Setup socket.io
// setupSocket(server);

// // Database connection test
// const testDatabaseConnection = async () => {
//   try {
//     await db.query('SELECT 1');
//     logger.info('Database connection established successfully');
//   } catch (error) {
//     logger.error('Database connection failed:', error);
//     process.exit(1);
//   }
// };

// // Enhanced graceful shutdown
// const gracefulShutdown = () => {
//   const signals = ['SIGTERM', 'SIGINT'];
  
//   signals.forEach(signal => {
//     process.on(signal, async () => {
//       logger.info(`${signal} signal received: starting graceful shutdown`);
      
//       // Close server
//       server.close(async () => {
//         logger.info('HTTP server closed');
        
//         // Close database connections
//         try {
//           await db.end();
//           logger.info('Database connections closed');
//         } catch (error) {
//           logger.error('Error closing database connections:', error);
//         }
        
//         process.exit(0);
//       });
//     });
//   });
// };

// // Start server
// const startServer = async () => {
//   try {
//     await testDatabaseConnection();
    
//     server.listen(PORT, () => {
//       logger.info(`Server running on port ${PORT}`);
//       logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
//       logger.info(`API Documentation: http://localhost:${PORT}/api/docs`);
      
//       // ✅ Log admin-specific endpoints
//       logger.info(`🔗 Admin API available at: http://localhost:${PORT}/api/admin`);
//       logger.info(`🎓 Full membership review: http://localhost:${PORT}/api/admin/membership/applications`);
//       logger.info(`📊 Admin dashboard stats: http://localhost:${PORT}/api/admin/membership/full-membership-stats`);
//       logger.info(`👥 User management: http://localhost:${PORT}/api/admin/applications/stats`);
      
//       // ✅ Development-only route documentation
//       if (process.env.NODE_ENV === 'development') {
//         logger.info(`📋 Admin routes list: http://localhost:${PORT}/api/admin/routes`);
//       }
      
//       // ✅ Health check endpoint
//       logger.info(`❤️ Health check: http://localhost:${PORT}/health`);
//     });
    
//     gracefulShutdown();
//   } catch (error) {
//     logger.error('Failed to start server:', error);
//     process.exit(1);
//   }
// };

// startServer();

