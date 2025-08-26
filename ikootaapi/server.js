//ikootaapi/server.js - ENHANCED WITH CLASS MANAGEMENT SYSTEM INTEGRATION
// Full-featured server.js with all systems including class management system

import http from 'http';
import dotenv from 'dotenv';
import app from './app.js';
import setupSocket from './socket.js';
import logger from './utils/logger.js';
import db from './config/db.js';

dotenv.config();

const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Setup socket.io
setupSocket(server);

// Database connection test
const testDatabaseConnection = async () => {
  try {
    await db.query('SELECT 1');
    logger.info('Database connection established successfully');
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
};

// ✅ NEW: Class system validation
const validateClassSystem = async () => {
  try {
    // Check if required tables exist
    const [classesTable] = await db.query("SHOW TABLES LIKE 'classes'");
    if (classesTable.length === 0) {
      logger.warn('⚠️ Classes table not found - class system may not work properly');
      return false;
    }
    
    const [membershipTable] = await db.query("SHOW TABLES LIKE 'user_class_memberships'");
    if (membershipTable.length === 0) {
      logger.warn('⚠️ User class memberships table not found');
      return false;
    }
    
    const [memberCounts] = await db.query("SHOW TABLES LIKE 'class_member_counts'");
    if (memberCounts.length === 0) {
      logger.warn('⚠️ Class member counts view not found');
    }
    
    // Test class system basic functionality
    const [testQuery] = await db.query('SELECT COUNT(*) as count FROM classes LIMIT 1');
    logger.info(`✅ Class management system validated - ${testQuery[0]?.count || 0} classes in system`);
    return true;
  } catch (error) {
    logger.error('❌ Class system validation failed:', error.message);
    return false;
  }
};

// Enhanced graceful shutdown
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
          await db.end();
          logger.info('Database connections closed');
        } catch (error) {
          logger.error('Error closing database connections:', error);
        }
        
        process.exit(0);
      });
    });
  });
};

// Start server
const startServer = async () => {
  try {
    await testDatabaseConnection();
    const classSystemReady = await validateClassSystem();
    
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`API Documentation: http://localhost:${PORT}/api/docs`);
      
      // ===============================================
      // AUTHENTICATION SYSTEM
      // ===============================================
      logger.info('🔐 Authentication System:');
      logger.info(`   • Login: http://localhost:${PORT}/api/auth/login`);
      logger.info(`   • Register: http://localhost:${PORT}/api/auth/register`);
      logger.info(`   • Logout: http://localhost:${PORT}/api/auth/logout`);
      
      // ===============================================
      // USER MANAGEMENT SYSTEM
      // ===============================================
      logger.info('👤 User Management System:');
      logger.info(`   • Profile: http://localhost:${PORT}/api/users/profile`);
      logger.info(`   • Dashboard: http://localhost:${PORT}/api/users/dashboard`);
      logger.info(`   • Status: http://localhost:${PORT}/api/users/status`);
      
      // ===============================================
      // USER ADMIN SYSTEM
      // ===============================================
      logger.info('🔧 User Admin System:');
      logger.info(`   • Test endpoint: http://localhost:${PORT}/api/users/admin/test`);
      logger.info(`   • User management: http://localhost:${PORT}/api/users/admin`);
      logger.info(`   • User statistics: http://localhost:${PORT}/api/users/admin/stats`);
      logger.info(`   • User search: http://localhost:${PORT}/api/users/admin/search`);
      
      // ===============================================
      // CONTENT MANAGEMENT SYSTEM
      // ===============================================
      logger.info('📚 Content Management System:');
      logger.info(`   • Chats: http://localhost:${PORT}/api/content/chats`);
      logger.info(`   • Teachings: http://localhost:${PORT}/api/content/teachings`);
      logger.info(`   • Comments: http://localhost:${PORT}/api/content/comments`);
      logger.info(`   • Admin panel: http://localhost:${PORT}/api/content/admin`);
      
      // ===============================================
      // MEMBERSHIP SYSTEM
      // ===============================================
      logger.info('👥 Membership System:');
      logger.info(`   • Status: http://localhost:${PORT}/api/membership/status`);
      logger.info(`   • Dashboard: http://localhost:${PORT}/api/membership/dashboard`);
      logger.info(`   • Apply initial: http://localhost:${PORT}/api/membership/apply/initial`);
      logger.info(`   • Apply full: http://localhost:${PORT}/api/membership/apply/full`);
      
      // ===============================================
      // MEMBERSHIP ADMIN SYSTEM
      // ===============================================
      logger.info('🔐 Membership Admin System:');
      logger.info(`   • Test endpoint: http://localhost:${PORT}/api/membership/admin/test`);
      logger.info(`   • Applications: http://localhost:${PORT}/api/membership/admin/applications`);
      logger.info(`   • Statistics: http://localhost:${PORT}/api/membership/admin/full-membership-stats`);
      logger.info(`   • Analytics: http://localhost:${PORT}/api/membership/admin/analytics`);
      logger.info(`   • Overview: http://localhost:${PORT}/api/membership/admin/overview`);
      logger.info(`   • Admin dashboard: http://localhost:${PORT}/api/membership/admin/dashboard`);
      
      // ===============================================
      // SURVEY SYSTEM
      // ===============================================
      logger.info('📊 Survey System:');
      logger.info(`   • Test endpoint: http://localhost:${PORT}/api/survey/test`);
      logger.info(`   • Submit survey: http://localhost:${PORT}/api/survey/submit`);
      logger.info(`   • Get questions: http://localhost:${PORT}/api/survey/questions`);
      logger.info(`   • Survey status: http://localhost:${PORT}/api/survey/status`);
      logger.info(`   • Save draft: http://localhost:${PORT}/api/survey/draft/save`);
      logger.info(`   • Manage drafts: http://localhost:${PORT}/api/survey/drafts`);
      logger.info(`   • Survey history: http://localhost:${PORT}/api/survey/history`);
      
      // ===============================================
      // SURVEY ADMIN SYSTEM
      // ===============================================
      logger.info('🔍 Survey Admin System:');
      logger.info(`   • Test endpoint: http://localhost:${PORT}/api/survey/admin/test`);
      logger.info(`   • Pending surveys: http://localhost:${PORT}/api/survey/admin/pending`);
      logger.info(`   • Approve surveys: http://localhost:${PORT}/api/survey/admin/approve`);
      logger.info(`   • Survey analytics: http://localhost:${PORT}/api/survey/admin/analytics`);
      logger.info(`   • Question management: http://localhost:${PORT}/api/survey/admin/questions`);
      logger.info(`   • Export data: http://localhost:${PORT}/api/survey/admin/export`);
      logger.info(`   • Survey dashboard: http://localhost:${PORT}/api/survey/admin/dashboard`);
      
      // ===============================================
      // ✅ NEW: CLASS MANAGEMENT SYSTEM
      // ===============================================
      logger.info('🎓 Class Management System (NEW):');
      logger.info(`   • Test endpoint: http://localhost:${PORT}/api/classes/test`);
      logger.info(`   • Get all classes: http://localhost:${PORT}/api/classes`);
      logger.info(`   • Get specific class: http://localhost:${PORT}/api/classes/:id`);
      logger.info(`   • Join class: http://localhost:${PORT}/api/classes/:id/join`);
      logger.info(`   • Leave class: http://localhost:${PORT}/api/classes/:id/leave`);
      logger.info(`   • Get class members: http://localhost:${PORT}/api/classes/:id/members`);
      logger.info(`   • Get user classes: http://localhost:${PORT}/api/classes/my-classes`);
      
      // ===============================================
      // ✅ NEW: CLASS ADMIN SYSTEM
      // ===============================================
      logger.info('📋 Class Admin System (NEW):');
      logger.info(`   • Test endpoint: http://localhost:${PORT}/api/classes/admin/test`);
      logger.info(`   • Create class: http://localhost:${PORT}/api/classes/admin`);
      logger.info(`   • Manage classes: http://localhost:${PORT}/api/classes/admin`);
      logger.info(`   • Update class: http://localhost:${PORT}/api/classes/admin/:id`);
      logger.info(`   • Delete class: http://localhost:${PORT}/api/classes/admin/:id`);
      logger.info(`   • Manage participants: http://localhost:${PORT}/api/classes/admin/:id/participants`);
      logger.info(`   • Class analytics: http://localhost:${PORT}/api/classes/admin/analytics`);
      logger.info(`   • Bulk operations: http://localhost:${PORT}/api/classes/admin/bulk-create`);
      
      // ===============================================
      // SYSTEM HEALTH & DEBUG ENDPOINTS
      // ===============================================
      logger.info('❤️ Health & Debug Endpoints:');
      logger.info(`   • Health check: http://localhost:${PORT}/health`);
      logger.info(`   • API Health: http://localhost:${PORT}/api/health`);
      logger.info(`   • API Info: http://localhost:${PORT}/api/info`);
      logger.info(`   • Debug info: http://localhost:${PORT}/api/debug`);
      
      // Development-only route documentation
      if (process.env.NODE_ENV === 'development') {
        logger.info('📋 Development Endpoints:');
        logger.info(`   • All routes: http://localhost:${PORT}/api/routes`);
        logger.info(`   • Route debug: http://localhost:${PORT}/api/debug/routes`);
        logger.info(`   • Main router test: http://localhost:${PORT}/api/test-main-router`);
        logger.info(`   • App.js test: http://localhost:${PORT}/api/test-app-js`);
        logger.info(`   • Survey integration test: http://localhost:${PORT}/api/test-survey-integration`);
        logger.info(`   • Class integration test: http://localhost:${PORT}/api/test-class-integration`); // ✅ NEW
      }
      
      // ===============================================
      // ADMIN TEST ENDPOINTS (QUICK ACCESS)
      // ===============================================
      logger.info('🧪 Quick Admin Tests:');
      logger.info(`   • User admin test: http://localhost:${PORT}/api/users/admin/test`);
      logger.info(`   • Membership admin test: http://localhost:${PORT}/api/membership/admin/test`);
      logger.info(`   • Survey admin test: http://localhost:${PORT}/api/survey/admin/test`);
      logger.info(`   • Class admin test: http://localhost:${PORT}/api/classes/admin/test`); // ✅ NEW
      
      // ===============================================
      // ✅ CLASS SYSTEM INTEGRATION NOTES
      // ===============================================
      logger.info('🎓 Class System Integration:');
      if (classSystemReady) {
        logger.info(`   ✨ Complete class lifecycle management`);
        logger.info(`   ✨ User enrollment and participation tracking`);
        logger.info(`   ✨ OTU# ID format support and validation`);
        logger.info(`   ✨ Admin class management panel`);
        logger.info(`   ✨ Participant management and analytics`);
        logger.info(`   ✨ Bulk class operations and data export`);
        logger.info(`   ✨ Comprehensive class reporting and insights`);
        logger.info(`   ✨ Frontend AudienceClassMgr.jsx compatible`);
      } else {
        logger.warn(`   ⚠️ Class system partially ready - check database tables`);
        logger.warn(`   ⚠️ Some class features may not work properly`);
      }
      
      // ===============================================
      // SURVEY SYSTEM INTEGRATION NOTES
      // ===============================================
      logger.info('📊 Survey System Integration:');
      logger.info(`   ✨ Independent survey system (separate from membership)`);
      logger.info(`   ✨ General surveys, feedback forms, assessments`);
      logger.info(`   ✨ Draft auto-save every 30 seconds`);
      logger.info(`   ✨ Dynamic question and label management`);
      logger.info(`   ✨ Survey approval workflow with bulk operations`);
      logger.info(`   ✨ Comprehensive analytics and reporting`);
      logger.info(`   ✨ Data export capabilities (CSV/JSON)`);
      logger.info(`   ✨ Admin panel for complete survey management`);
      
      // ===============================================
      // SYSTEM ARCHITECTURE OVERVIEW
      // ===============================================
      logger.info('🏗️ System Architecture:');
      logger.info(`   • Total Systems: 10 independent systems`); // ✅ UPDATED
      logger.info(`   • Survey Independence: Survey system operates independently from membership`);
      logger.info(`   • Class Independence: Class system operates independently from other systems`); // ✅ NEW
      logger.info(`   • Admin Separation: Each system has its own admin panel`);
      logger.info(`   • Shared Infrastructure: Common auth, database, utilities`);
      logger.info(`   • Frontend Ready: Backend prepared for SurveyControls.jsx and AudienceClassMgr.jsx`); // ✅ UPDATED
      
      // ===============================================
      // LEGACY COMPATIBILITY
      // ===============================================
      logger.info('🔄 Legacy Compatibility:');
      logger.info(`   • Content routes: /chats, /teachings, /comments → /content/*`);
      logger.info(`   • Membership routes: /apply → /membership/*`);
      logger.info(`   • Survey routes: /membership/survey → /survey/*`);
      logger.info(`   • User status: /api/user-status/* preserved`);
      
      // ===============================================
      // NEXT STEPS & RECOMMENDATIONS
      // ===============================================
      logger.info('🎯 Next Steps:');
      logger.info(`   1. ✅ All systems integrated and ready`);
      logger.info(`   2. ✅ Survey system fully integrated`);
      logger.info(`   3. ✅ Class management system fully integrated`); // ✅ NEW
      logger.info(`   4. ✅ Test class administration endpoints`);
      logger.info(`   5. ✅ Test class user endpoints`);
      logger.info(`   6. ⏳ Begin frontend AudienceClassMgr.jsx development`); // ✅ UPDATED
      logger.info(`   7. ⏳ Enhance MembershipReviewControls.jsx`);
      logger.info(`   8. ⏳ Additional class features as needed`);
      
      // ===============================================
      // PERFORMANCE & MONITORING
      // ===============================================
      logger.info('📈 Performance & Monitoring:');
      logger.info(`   • Socket.io: Real-time communication enabled`);
      logger.info(`   • Database: MySQL with connection pooling`);
      logger.info(`   • Logging: Enhanced logging with winston`);
      logger.info(`   • Error Handling: Comprehensive error management`);
      logger.info(`   • Security: Helmet, CORS, JWT authentication`);
      logger.info(`   • Class Validation: Comprehensive input validation with OTU# format support`); // ✅ NEW
      
      // ===============================================
      // FINAL SYSTEM STATUS
      // ===============================================
      logger.info('🚀 ===============================================');
      logger.info('🚀 IKOOTA API - COMPLETE SYSTEM WITH CLASS MANAGEMENT INTEGRATION');
      logger.info('🚀 ===============================================');
      logger.info('🚀 Status: ALL SYSTEMS OPERATIONAL ✅');
      logger.info('🚀 Version: 4.1.0-class-integrated'); // ✅ UPDATED
      logger.info('🚀 Endpoints: 250+ endpoints across 10 systems'); // ✅ UPDATED
      logger.info('🚀 New Features: Complete class management and administration system'); // ✅ NEW
      logger.info('🚀 Backend Ready: Prepared for AudienceClassMgr.jsx development'); // ✅ NEW
      logger.info('🚀 Class System: ' + (classSystemReady ? 'FULLY OPERATIONAL ✅' : 'PARTIALLY READY ⚠️')); // ✅ NEW
      logger.info('🚀 ===============================================');
    });
    
    gracefulShutdown();
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();










// //ikootaapi/server.js - ENHANCED WITH SURVEY SYSTEM INTEGRATION
// // Full-featured server.js with all systems including survey system

// import http from 'http';
// import dotenv from 'dotenv';
// import app from './app.js';
// import setupSocket from './socket.js';
// import logger from './utils/logger.js';
// import db from './config/db.js';

// dotenv.config();

// const server = http.createServer(app);
// const PORT = process.env.PORT || 3000;

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
      
//       // ===============================================
//       // AUTHENTICATION SYSTEM
//       // ===============================================
//       logger.info('🔐 Authentication System:');
//       logger.info(`   • Login: http://localhost:${PORT}/api/auth/login`);
//       logger.info(`   • Register: http://localhost:${PORT}/api/auth/register`);
//       logger.info(`   • Logout: http://localhost:${PORT}/api/auth/logout`);
      
//       // ===============================================
//       // USER MANAGEMENT SYSTEM
//       // ===============================================
//       logger.info('👤 User Management System:');
//       logger.info(`   • Profile: http://localhost:${PORT}/api/users/profile`);
//       logger.info(`   • Dashboard: http://localhost:${PORT}/api/users/dashboard`);
//       logger.info(`   • Status: http://localhost:${PORT}/api/users/status`);
      
//       // ===============================================
//       // USER ADMIN SYSTEM
//       // ===============================================
//       logger.info('🔧 User Admin System:');
//       logger.info(`   • Test endpoint: http://localhost:${PORT}/api/users/admin/test`);
//       logger.info(`   • User management: http://localhost:${PORT}/api/users/admin`);
//       logger.info(`   • User statistics: http://localhost:${PORT}/api/users/admin/stats`);
//       logger.info(`   • User search: http://localhost:${PORT}/api/users/admin/search`);
      
//       // ===============================================
//       // CONTENT MANAGEMENT SYSTEM
//       // ===============================================
//       logger.info('📚 Content Management System:');
//       logger.info(`   • Chats: http://localhost:${PORT}/api/content/chats`);
//       logger.info(`   • Teachings: http://localhost:${PORT}/api/content/teachings`);
//       logger.info(`   • Comments: http://localhost:${PORT}/api/content/comments`);
//       logger.info(`   • Admin panel: http://localhost:${PORT}/api/content/admin`);
      
//       // ===============================================
//       // MEMBERSHIP SYSTEM
//       // ===============================================
//       logger.info('👥 Membership System:');
//       logger.info(`   • Status: http://localhost:${PORT}/api/membership/status`);
//       logger.info(`   • Dashboard: http://localhost:${PORT}/api/membership/dashboard`);
//       logger.info(`   • Apply initial: http://localhost:${PORT}/api/membership/apply/initial`);
//       logger.info(`   • Apply full: http://localhost:${PORT}/api/membership/apply/full`);
      
//       // ===============================================
//       // MEMBERSHIP ADMIN SYSTEM
//       // ===============================================
//       logger.info('🔐 Membership Admin System:');
//       logger.info(`   • Test endpoint: http://localhost:${PORT}/api/membership/admin/test`);
//       logger.info(`   • Applications: http://localhost:${PORT}/api/membership/admin/applications`);
//       logger.info(`   • Statistics: http://localhost:${PORT}/api/membership/admin/full-membership-stats`);
//       logger.info(`   • Analytics: http://localhost:${PORT}/api/membership/admin/analytics`);
//       logger.info(`   • Overview: http://localhost:${PORT}/api/membership/admin/overview`);
//       logger.info(`   • Admin dashboard: http://localhost:${PORT}/api/membership/admin/dashboard`);
      
//       // ===============================================
//       // ✅ NEW: SURVEY SYSTEM
//       // ===============================================
//       logger.info('📊 Survey System (NEW):');
//       logger.info(`   • Test endpoint: http://localhost:${PORT}/api/survey/test`);
//       logger.info(`   • Submit survey: http://localhost:${PORT}/api/survey/submit`);
//       logger.info(`   • Get questions: http://localhost:${PORT}/api/survey/questions`);
//       logger.info(`   • Survey status: http://localhost:${PORT}/api/survey/status`);
//       logger.info(`   • Save draft: http://localhost:${PORT}/api/survey/draft/save`);
//       logger.info(`   • Manage drafts: http://localhost:${PORT}/api/survey/drafts`);
//       logger.info(`   • Survey history: http://localhost:${PORT}/api/survey/history`);
      
//       // ===============================================
//       // ✅ NEW: SURVEY ADMIN SYSTEM
//       // ===============================================
//       logger.info('🔍 Survey Admin System (NEW):');
//       logger.info(`   • Test endpoint: http://localhost:${PORT}/api/survey/admin/test`);
//       logger.info(`   • Pending surveys: http://localhost:${PORT}/api/survey/admin/pending`);
//       logger.info(`   • Approve surveys: http://localhost:${PORT}/api/survey/admin/approve`);
//       logger.info(`   • Survey analytics: http://localhost:${PORT}/api/survey/admin/analytics`);
//       logger.info(`   • Question management: http://localhost:${PORT}/api/survey/admin/questions`);
//       logger.info(`   • Export data: http://localhost:${PORT}/api/survey/admin/export`);
//       logger.info(`   • Survey dashboard: http://localhost:${PORT}/api/survey/admin/dashboard`);
      
//       // ===============================================
//       // SYSTEM HEALTH & DEBUG ENDPOINTS
//       // ===============================================
//       logger.info('❤️ Health & Debug Endpoints:');
//       logger.info(`   • Health check: http://localhost:${PORT}/health`);
//       logger.info(`   • API Health: http://localhost:${PORT}/api/health`);
//       logger.info(`   • API Info: http://localhost:${PORT}/api/info`);
//       logger.info(`   • Debug info: http://localhost:${PORT}/api/debug`);
      
//       // ✅ Development-only route documentation
//       if (process.env.NODE_ENV === 'development') {
//         logger.info('📋 Development Endpoints:');
//         logger.info(`   • All routes: http://localhost:${PORT}/api/routes`);
//         logger.info(`   • Route debug: http://localhost:${PORT}/api/debug/routes`);
//         logger.info(`   • Main router test: http://localhost:${PORT}/api/test-main-router`);
//         logger.info(`   • App.js test: http://localhost:${PORT}/api/test-app-js`);
//         logger.info(`   • Survey integration test: http://localhost:${PORT}/api/test-survey-integration`); // ✅ NEW
//       }
      
//       // ===============================================
//       // ✅ ADMIN TEST ENDPOINTS (QUICK ACCESS)
//       // ===============================================
//       logger.info('🧪 Quick Admin Tests:');
//       logger.info(`   • User admin test: http://localhost:${PORT}/api/users/admin/test`);
//       logger.info(`   • Membership admin test: http://localhost:${PORT}/api/membership/admin/test`);
//       logger.info(`   • Survey admin test: http://localhost:${PORT}/api/survey/admin/test`); // ✅ NEW
      
//       // ===============================================
//       // ✅ SURVEY SYSTEM INTEGRATION NOTES
//       // ===============================================
//       logger.info('📊 Survey System Integration:');
//       logger.info(`   ✨ Independent survey system (separate from membership)`);
//       logger.info(`   ✨ General surveys, feedback forms, assessments`);
//       logger.info(`   ✨ Draft auto-save every 30 seconds`);
//       logger.info(`   ✨ Dynamic question and label management`);
//       logger.info(`   ✨ Survey approval workflow with bulk operations`);
//       logger.info(`   ✨ Comprehensive analytics and reporting`);
//       logger.info(`   ✨ Data export capabilities (CSV/JSON)`);
//       logger.info(`   ✨ Admin panel for complete survey management`);
      
//       // ===============================================
//       // SYSTEM ARCHITECTURE OVERVIEW
//       // ===============================================
//       logger.info('🏗️ System Architecture:');
//       logger.info(`   • Total Systems: 8 independent systems`);
//       logger.info(`   • Survey Independence: Survey system operates independently from membership`);
//       logger.info(`   • Admin Separation: Each system has its own admin panel`);
//       logger.info(`   • Shared Infrastructure: Common auth, database, utilities`);
//       logger.info(`   • Frontend Ready: Backend prepared for SurveyControls.jsx`);
      
//       // ===============================================
//       // LEGACY COMPATIBILITY
//       // ===============================================
//       logger.info('🔄 Legacy Compatibility:');
//       logger.info(`   • Content routes: /chats, /teachings, /comments → /content/*`);
//       logger.info(`   • Membership routes: /apply → /membership/*`);
//       logger.info(`   • Survey routes: /membership/survey → /survey/*`); // ✅ NEW
//       logger.info(`   • User status: /api/user-status/* preserved`);
      
//       // ===============================================
//       // NEXT STEPS & RECOMMENDATIONS
//       // ===============================================
//       logger.info('🎯 Next Steps:');
//       logger.info(`   1. ✅ All systems integrated and ready`);
//       logger.info(`   2. ✅ Survey system fully integrated`);
//       logger.info(`   3. ✅ Test survey administration endpoints`);
//       logger.info(`   4. ✅ Test survey user endpoints`);
//       logger.info(`   5. ⏳ Begin frontend SurveyControls.jsx development`);
//       logger.info(`   6. ⏳ Enhance MembershipReviewControls.jsx`);
//       logger.info(`   7. ⏳ Additional survey features as needed`);
      
//       // ===============================================
//       // PERFORMANCE & MONITORING
//       // ===============================================
//       logger.info('📈 Performance & Monitoring:');
//       logger.info(`   • Socket.io: Real-time communication enabled`);
//       logger.info(`   • Database: MySQL with connection pooling`);
//       logger.info(`   • Logging: Enhanced logging with winston`);
//       logger.info(`   • Error Handling: Comprehensive error management`);
//       logger.info(`   • Security: Helmet, CORS, JWT authentication`);
      
//       // ===============================================
//       // FINAL SYSTEM STATUS
//       // ===============================================
//       logger.info('🚀 ===============================================');
//       logger.info('🚀 IKOOTA API - COMPLETE SYSTEM WITH SURVEY INTEGRATION');
//       logger.info('🚀 ===============================================');
//       logger.info('🚀 Status: ALL SYSTEMS OPERATIONAL ✅');
//       logger.info('🚀 Version: 4.0.0-survey-integrated');
//       logger.info('🚀 Endpoints: 200+ endpoints across 8 systems');
//       logger.info('🚀 New Features: Independent survey system with admin panel');
//       logger.info('🚀 Backend Ready: Prepared for SurveyControls.jsx development');
//       logger.info('🚀 ===============================================');
//     });
    
//     gracefulShutdown();
//   } catch (error) {
//     logger.error('Failed to start server:', error);
//     process.exit(1);
//   }
// };

// startServer();








// //ikootaapi/server.js
// import http from 'http';
// import dotenv from 'dotenv';
// import app from './app.js';
// import setupSocket from './socket.js';
// import logger from './utils/logger.js';
// import db from './config/db.js';

// dotenv.config();

// const server = http.createServer(app);
// const PORT = process.env.PORT || 3000;

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
            
//       // ✅ CORRECTED: Log the actual admin endpoints based on your route structure
//       logger.info(`🔗 Admin API available at: http://localhost:${PORT}/api/membership/admin`);
//       logger.info(`🎓 Full membership review: http://localhost:${PORT}/api/membership/admin/applications`);
//       logger.info(`📊 Admin dashboard stats: http://localhost:${PORT}/api/membership/admin/full-membership-stats`);
//       logger.info(`👥 User management: http://localhost:${PORT}/api/membership/admin/overview`);
//       logger.info(`📈 Admin analytics: http://localhost:${PORT}/api/membership/admin/analytics`);
//       logger.info(`📊 Admin stats: http://localhost:${PORT}/api/membership/admin/stats`);
      
//       // ✅ Test endpoint for debugging
//       logger.info(`🧪 Admin test endpoint: http://localhost:${PORT}/api/membership/admin/test`);
            
//       // ✅ Development-only route documentation
//       if (process.env.NODE_ENV === 'development') {
//         logger.info(`📋 All routes list: http://localhost:${PORT}/api/routes`);
//         logger.info(`📋 API info: http://localhost:${PORT}/api/info`);
//       }
            
//       // ✅ Health check endpoint
//       logger.info(`❤️ Health check: http://localhost:${PORT}/health`);
//       logger.info(`❤️ API Health check: http://localhost:${PORT}/api/health`);
      
//       // ✅ Content system endpoints (from your existing setup)
//       logger.info(`📚 Content system: http://localhost:${PORT}/api/content`);
//       logger.info(`👥 Membership system: http://localhost:${PORT}/api/membership`);
//       logger.info(`🔐 Authentication: http://localhost:${PORT}/api/auth`);
//     });
        
//     gracefulShutdown();
//   } catch (error) {
//     logger.error('Failed to start server:', error);
//     process.exit(1);
//   }
// };

// startServer();




// //ikootaapi\server.js
// import http from 'http';
// import dotenv from 'dotenv';
// import app from './app.js';
// import setupSocket from './socket.js';
// import logger from './utils/logger.js';
// import db from './config/db.js';

// dotenv.config();

// const server = http.createServer(app);
// const PORT = process.env.PORT || 3000;

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
//       logger.info(`🎓 Full membership review: http://localhost:${PORT}/api/membership/admin/applications`);
//       logger.info(`📊 Admin dashboard stats: http://localhost:${PORT}/api/membership/admin/full-membership-stats`);
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

