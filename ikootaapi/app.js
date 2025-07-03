import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import routes from './routes/index.js';
import { errorHandler } from './utils/errorHandler.js';
import morgan from 'morgan';
import logger from './utils/logger.js';
import db from './config/db.js';
import index from './routes/index.js'

// Initialize the Express app
const app = express();

// Middleware: Secure HTTP headers
app.use(helmet());

// Middleware: CORS
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      process.env.PUBLIC_CLIENT_URL
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with']
}));

// Middleware: Rate limiting to prevent abuse
const createRateLimit = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({ 
      success: false,
      error: 'Too many requests',
      message,
      retryAfter: Math.ceil(windowMs / 1000)
    });
  }
});

// Different limits for different endpoints
app.use('/api/auth', createRateLimit(15 * 60 * 1000, 10, 'Too many authentication attempts'));
app.use('/api/communication', createRateLimit(60 * 1000, 5, 'Too many communication requests'));
app.use('/api', createRateLimit(15 * 60 * 1000, 100, 'Too many API requests'));


// Middleware: Cookie parser for reading cookies
app.use(cookieParser());

// Middleware: JSON parser
app.use(express.json({ limit: '10mb' })); // Increase limit if handling large payloads

// Middleware: URL-encoded parser
app.use(express.urlencoded({ extended: true }));

// Middleware: Logging for development
//if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
//}

// Route handler
app.use('/api', routes);

// Middleware: 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Resource not found' });
});

// Middleware: Centralized error handler
app.use(errorHandler);

export default app;