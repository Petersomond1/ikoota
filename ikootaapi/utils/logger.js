// utils/logger.js
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info', // Default log level
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} ${level}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(), // Output logs to console
    new winston.transports.File({ filename: 'logs/app.log' }) // Output logs to a file
  ]
});

export default logger;



// //new logger.js file

// // ikootaapi/utils/logger.js
// // Enhanced logging utility

// class Logger {
//   constructor() {
//     this.isDevelopment = process.env.NODE_ENV === 'development';
//   }
  
//   info(message, data = null) {
//     console.log(`ℹ️ ${new Date().toISOString()} - ${message}`, data || '');
//   }
  
//   error(message, error = null) {
//     console.error(`❌ ${new Date().toISOString()} - ${message}`, error || '');
//   }
  
//   warn(message, data = null) {
//     console.warn(`⚠️ ${new Date().toISOString()} - ${message}`, data || '');
//   }
  
//   debug(message, data = null) {
//     if (this.isDevelopment) {
//       console.log(`🐛 ${new Date().toISOString()} - ${message}`, data || '');
//     }
//   }
  
//   success(message, data = null) {
//     console.log(`✅ ${new Date().toISOString()} - ${message}`, data || '');
//   }
  
//   request(req) {
//     if (this.isDevelopment) {
//       console.log(`🌐 ${new Date().toISOString()} - ${req.method} ${req.path}`, {
//         user: req.user?.username || 'anonymous',
//         ip: req.ip
//       });
//     }
//   }
// }

// export default new Logger();