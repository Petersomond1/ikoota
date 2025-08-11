// ikootaapi/utils/logger.js
// UNIFIED LOGGER - Combines best features from all three versions
// Features: Winston robustness + Custom methods + Visual indicators + File logging

import winston from 'winston';
import fs from 'fs';
import path from 'path';

const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

const LOG_EMOJIS = {
    ERROR: '❌',
    WARN: '⚠️',
    INFO: 'ℹ️',
    DEBUG: '🐛',
    SUCCESS: '✅',
    REQUEST: '🌐',
    AUTH: '🔐',
    DB: '🗄️',
    ADMIN: '👑',
    SECURITY: '🛡️'
};

class UnifiedLogger {
    constructor() {
        this.isDevelopment = process.env.NODE_ENV === 'development';
        this.currentLevel = process.env.LOG_LEVEL 
            ? LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] 
            : LOG_LEVELS.INFO;
        
        this.logDir = path.join(process.cwd(), 'logs');
        this.ensureLogDirectory();
        
        // Initialize Winston for robust file logging
        this.winstonLogger = this.createWinstonLogger();
    }

    ensureLogDirectory() {
        try {
            if (!fs.existsSync(this.logDir)) {
                fs.mkdirSync(this.logDir, { recursive: true });
            }
        } catch (error) {
            console.error('Failed to create log directory:', error);
        }
    }

    createWinstonLogger() {
        const logFormat = winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json()
        );

        const consoleFormat = winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
                const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
                return `${timestamp} ${level}: ${message} ${metaStr}`;
            })
        );

        return winston.createLogger({
            level: process.env.LOG_LEVEL?.toLowerCase() || 'info',
            format: logFormat,
            transports: [
                // File transports
                new winston.transports.File({ 
                    filename: path.join(this.logDir, 'error.log'), 
                    level: 'error' 
                }),
                new winston.transports.File({ 
                    filename: path.join(this.logDir, 'combined.log') 
                }),
                new winston.transports.File({
                    filename: path.join(this.logDir, `${new Date().toISOString().split('T')[0]}.log`)
                })
            ]
        });

        // Add console transport in development
        if (this.isDevelopment) {
            this.winstonLogger.add(new winston.transports.Console({
                format: consoleFormat
            }));
        }
    }

    formatConsoleMessage(level, emoji, message, data = null) {
        const timestamp = new Date().toISOString();
        const dataStr = data ? (typeof data === 'object' ? JSON.stringify(data, null, 2) : data) : '';
        return `${emoji} ${timestamp} - ${message} ${dataStr}`;
    }

    log(level, emoji, message, data = null, useWinston = true) {
        // Console logging with emojis (always in development)
        if (this.isDevelopment) {
            const formatted = this.formatConsoleMessage(level, emoji, message, data);
            
            switch (level.toUpperCase()) {
                case 'ERROR':
                    console.error(formatted);
                    break;
                case 'WARN':
                    console.warn(formatted);
                    break;
                default:
                    console.log(formatted);
            }
        }

        // Winston logging for files and production
        if (useWinston && (process.env.NODE_ENV === 'production' || process.env.ENABLE_FILE_LOGGING === 'true')) {
            const logData = typeof data === 'object' ? data : { data };
            this.winstonLogger.log(level.toLowerCase(), message, logData);
        }
    }

    // ===============================================
    // BASIC LOGGING METHODS (From all three loggers)
    // ===============================================

    error(message, error = null, context = {}) {
        const errorData = {
            error: error?.message,
            stack: error?.stack,
            context,
            timestamp: new Date().toISOString()
        };
        this.log('ERROR', LOG_EMOJIS.ERROR, message, errorData);
    }

    warn(message, data = null) {
        this.log('WARN', LOG_EMOJIS.WARN, message, data);
    }

    info(message, data = null) {
        this.log('INFO', LOG_EMOJIS.INFO, message, data);
    }

    debug(message, data = null) {
        if (LOG_LEVELS.DEBUG <= this.currentLevel) {
            this.log('DEBUG', LOG_EMOJIS.DEBUG, message, data);
        }
    }

    success(message, data = null) {
        this.log('INFO', LOG_EMOJIS.SUCCESS, message, data);
    }

    // ===============================================
    // REQUEST LOGGING (From simple logger)
    // ===============================================

    request(req, res = null) {
        if (this.isDevelopment) {
            const logData = {
                method: req.method,
                path: req.path || req.originalUrl,
                user: req.user?.username || req.user?.email || 'anonymous',
                ip: req.ip || req.connection?.remoteAddress,
                userAgent: req.get('User-Agent')?.substring(0, 50) + '...',
                timestamp: new Date().toISOString()
            };

            if (res) {
                logData.status = res.statusCode;
                logData.duration = Date.now() - (req.startTime || Date.now());
            }

            this.log('INFO', LOG_EMOJIS.REQUEST, `${req.method} ${req.path || req.originalUrl}`, logData);
        }
    }

    // ===============================================
    // AUTHENTICATION LOGGING (From comprehensive logger)
    // ===============================================

    authSuccess(message, userId, email, context = {}) {
        this.log('INFO', LOG_EMOJIS.AUTH, `AUTH SUCCESS: ${message}`, { 
            userId, 
            email, 
            context,
            timestamp: new Date().toISOString() 
        });
    }

    authFailure(message, email, ip, error, context = {}) {
        this.log('WARN', LOG_EMOJIS.AUTH, `AUTH FAILURE: ${message}`, { 
            email, 
            ip, 
            error: error?.message,
            context,
            timestamp: new Date().toISOString() 
        });
    }

    authError(message, error, context = {}) {
        this.log('ERROR', LOG_EMOJIS.AUTH, `AUTH ERROR: ${message}`, { 
            error: error?.message, 
            stack: error?.stack,
            context,
            timestamp: new Date().toISOString() 
        });
    }

    // ===============================================
    // DATABASE LOGGING
    // ===============================================

    dbQuery(query, duration, success = true, context = {}) {
        const level = success ? 'DEBUG' : 'WARN';
        const emoji = success ? LOG_EMOJIS.DB : LOG_EMOJIS.ERROR;
        const message = success ? `DB QUERY: ${query}` : `DB QUERY FAILED: ${query}`;
        
        this.log(level, emoji, message, { 
            duration: `${duration}ms`, 
            success,
            context,
            timestamp: new Date().toISOString()
        });
    }

    dbError(message, error, query = null, context = {}) {
        this.log('ERROR', LOG_EMOJIS.DB, `DB ERROR: ${message}`, {
            error: error?.message,
            stack: error?.stack,
            query,
            context,
            timestamp: new Date().toISOString()
        });
    }

    dbConnection(status, details = {}) {
        const emoji = status === 'connected' ? LOG_EMOJIS.SUCCESS : LOG_EMOJIS.ERROR;
        const level = status === 'connected' ? 'INFO' : 'ERROR';
        this.log(level, emoji, `DATABASE ${status.toUpperCase()}`, details);
    }

    // ===============================================
    // ADMIN ACTIVITY LOGGING
    // ===============================================

    adminActivity(action, adminId, targetId = null, details = {}) {
        this.log('INFO', LOG_EMOJIS.ADMIN, `ADMIN ACTIVITY: ${action}`, {
            adminId,
            targetId,
            details,
            timestamp: new Date().toISOString()
        });
    }

    // ===============================================
    // SECURITY EVENT LOGGING
    // ===============================================

    securityEvent(event, details = {}, level = 'WARN') {
        this.log(level, LOG_EMOJIS.SECURITY, `SECURITY EVENT: ${event}`, {
            details,
            timestamp: new Date().toISOString()
        });
    }

    // ===============================================
    // PERFORMANCE MONITORING
    // ===============================================

    performance(operation, duration, context = {}) {
        const level = duration > 1000 ? 'WARN' : 'DEBUG'; // Warn if > 1 second
        const emoji = duration > 1000 ? LOG_EMOJIS.WARN : LOG_EMOJIS.SUCCESS;
        
        this.log(level, emoji, `PERFORMANCE: ${operation}`, {
            duration: `${duration}ms`,
            context,
            timestamp: new Date().toISOString()
        });
    }

    // ===============================================
    // BUSINESS LOGIC LOGGING
    // ===============================================

    userAction(action, userId, details = {}) {
        this.log('INFO', '👤', `USER ACTION: ${action}`, {
            userId,
            details,
            timestamp: new Date().toISOString()
        });
    }

    apiCall(endpoint, method, status, duration, userId = null) {
        const emoji = status < 400 ? LOG_EMOJIS.SUCCESS : LOG_EMOJIS.ERROR;
        const level = status < 400 ? 'INFO' : 'WARN';
        
        this.log(level, emoji, `API: ${method} ${endpoint}`, {
            status,
            duration: `${duration}ms`,
            userId,
            timestamp: new Date().toISOString()
        });
    }

    // ===============================================
    // SYSTEM EVENTS
    // ===============================================

    systemEvent(event, details = {}, level = 'INFO') {
        this.log(level, '🔧', `SYSTEM: ${event}`, {
            details,
            timestamp: new Date().toISOString()
        });
    }

    startup(service, port = null, details = {}) {
        this.log('INFO', '🚀', `STARTUP: ${service}`, {
            port,
            details,
            timestamp: new Date().toISOString()
        });
    }

    shutdown(service, reason = null) {
        this.log('INFO', '🛑', `SHUTDOWN: ${service}`, {
            reason,
            timestamp: new Date().toISOString()
        });
    }

    // ===============================================
    // UTILITY METHODS
    // ===============================================

    // Get current log level
    getLogLevel() {
        return Object.keys(LOG_LEVELS).find(key => LOG_LEVELS[key] === this.currentLevel);
    }

    // Set log level dynamically
    setLogLevel(level) {
        if (LOG_LEVELS[level.toUpperCase()] !== undefined) {
            this.currentLevel = LOG_LEVELS[level.toUpperCase()];
            this.winstonLogger.level = level.toLowerCase();
        }
    }

    // Health check for logging system
    healthCheck() {
        try {
            this.info('Logger health check', { 
                level: this.getLogLevel(),
                isDevelopment: this.isDevelopment,
                logDir: this.logDir,
                fileLoggingEnabled: process.env.ENABLE_FILE_LOGGING === 'true'
            });
            return { status: 'healthy', timestamp: new Date().toISOString() };
        } catch (error) {
            this.error('Logger health check failed', error);
            return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
        }
    }
}

// Create singleton instance
const logger = new UnifiedLogger();

// Export the instance as default
export default logger;

// Also export individual methods for convenience
export const { 
    error, 
    warn, 
    info, 
    debug, 
    success,
    request,
    authSuccess, 
    authFailure, 
    authError,
    dbQuery,
    dbError,
    dbConnection,
    adminActivity,
    securityEvent,
    performance,
    userAction,
    apiCall,
    systemEvent,
    startup,
    shutdown
} = logger;




// // utils/logger.js
// import winston from 'winston';

// const logger = winston.createLogger({
//   level: 'info', // Default log level
//   format: winston.format.combine(
//     winston.format.timestamp(),
//     winston.format.printf(({ timestamp, level, message }) => {
//       return `${timestamp} ${level}: ${message}`;
//     })
//   ),
//   transports: [
//     new winston.transports.Console(), // Output logs to console
//     new winston.transports.File({ filename: 'logs/app.log' }) // Output logs to a file
//   ]
// });

// export default logger;



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