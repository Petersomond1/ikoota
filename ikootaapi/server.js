//ikootaapi/server.js
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
        
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`API Documentation: http://localhost:${PORT}/api/docs`);
            
      // ✅ CORRECTED: Log the actual admin endpoints based on your route structure
      logger.info(`🔗 Admin API available at: http://localhost:${PORT}/api/membership/admin`);
      logger.info(`🎓 Full membership review: http://localhost:${PORT}/api/membership/admin/applications`);
      logger.info(`📊 Admin dashboard stats: http://localhost:${PORT}/api/membership/admin/full-membership-stats`);
      logger.info(`👥 User management: http://localhost:${PORT}/api/membership/admin/overview`);
      logger.info(`📈 Admin analytics: http://localhost:${PORT}/api/membership/admin/analytics`);
      logger.info(`📊 Admin stats: http://localhost:${PORT}/api/membership/admin/stats`);
      
      // ✅ Test endpoint for debugging
      logger.info(`🧪 Admin test endpoint: http://localhost:${PORT}/api/membership/admin/test`);
            
      // ✅ Development-only route documentation
      if (process.env.NODE_ENV === 'development') {
        logger.info(`📋 All routes list: http://localhost:${PORT}/api/routes`);
        logger.info(`📋 API info: http://localhost:${PORT}/api/info`);
      }
            
      // ✅ Health check endpoint
      logger.info(`❤️ Health check: http://localhost:${PORT}/health`);
      logger.info(`❤️ API Health check: http://localhost:${PORT}/api/health`);
      
      // ✅ Content system endpoints (from your existing setup)
      logger.info(`📚 Content system: http://localhost:${PORT}/api/content`);
      logger.info(`👥 Membership system: http://localhost:${PORT}/api/membership`);
      logger.info(`🔐 Authentication: http://localhost:${PORT}/api/auth`);
    });
        
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

