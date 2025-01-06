import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import routes from './routes/index.js';
import { errorHandler } from './utils/errorHandler.js';
import morgan from 'morgan';
import logger from './utils/logger.js';
import pool from './config/db.js'

// Initialize the Express app
const app = express();

// Middleware: Secure HTTP headers
app.use(helmet());

// Middleware: CORS
app.use(cors({
  origin: "http://localhost:5173" || '*', // Adjust as needed for your client
  methods: ["POST", "GET", "OPTIONS"],
  credentials: true, // Enable credentials if cookies are used
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Middleware: Rate limiting to prevent abuse
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({ message: "Too many requests, please try again later." });
  },
});
app.use('/api', apiLimiter);

// Middleware: Cookie parser for reading cookies
app.use(cookieParser());

// Middleware: JSON parser
app.use(express.json({ limit: '10mb' })); // Increase limit if handling large payloads

// Middleware: URL-encoded parser
app.use(express.urlencoded({ extended: true }));

// Middleware: Logging for development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Route handler
app.use('/api', routes);

// Middleware: 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Resource not found' });
});

// Middleware: Centralized error handler
app.use(errorHandler);

export default app;