//ikootaapi\server.js
import http from 'http';
import dotenv from 'dotenv';
import app from './app.js';
import setupSocket from './socket.js';
import logger from './utils/logger.js';
import db from './config/db.js';

dotenv.config();

const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

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
      
      // ✅ Log admin-specific endpoints
      logger.info(`🔗 Admin API available at: http://localhost:${PORT}/api/admin`);
      logger.info(`🎓 Full membership review: http://localhost:${PORT}/api/admin/membership/applications`);
      logger.info(`📊 Admin dashboard stats: http://localhost:${PORT}/api/admin/membership/full-membership-stats`);
      logger.info(`👥 User management: http://localhost:${PORT}/api/admin/applications/stats`);
      
      // ✅ Development-only route documentation
      if (process.env.NODE_ENV === 'development') {
        logger.info(`📋 Admin routes list: http://localhost:${PORT}/api/admin/routes`);
      }
      
      // ✅ Health check endpoint
      logger.info(`❤️ Health check: http://localhost:${PORT}/health`);
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
//     });
    
//     gracefulShutdown();
//   } catch (error) {
//     logger.error('Failed to start server:', error);
//     process.exit(1);
//   }
// };

// startServer();




// import http from 'http';
// import dotenv from 'dotenv';
// import app from './app.js';
// import setupSocket from './socket.js';
// import logger from './utils/logger.js';
// import db from './config/db.js';

// // Load environment variables
// dotenv.config();

// const server = http.createServer(app);

// const PORT = process.env.PORT || 5000;

// // Setup socket.io
// setupSocket(server);

// // Graceful shutdown handler
// const gracefulShutdown = (server) => {
//   process.on('SIGTERM', () => {
//     logger.info('SIGTERM signal received: closing HTTP server');
//     server.close(() => {
//         logger.info('HTTP server closed');
//     });
//   });
//   process.on('SIGINT', () => {
//     logger.info('SIGINT signal received: closing HTTP server');
//     server.close(() => {
//         logger.info('HTTP server closed');
//     });
//   });
// };

// // Start the server
// server.listen(PORT, () => {
//     logger.info(`Server running on port ${PORT}`);
// });

// gracefulShutdown(server);