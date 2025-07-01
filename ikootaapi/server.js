import http from 'http';
import dotenv from 'dotenv';
import app from './app.js';
import setupSocket from './socket.js';
import logger from './utils/logger.js';
import db from './config/db.js';

// Load environment variables
dotenv.config();

const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

// Setup socket.io
setupSocket(server);

// Graceful shutdown handler
const gracefulShutdown = (server) => {
  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        logger.info('HTTP server closed');
    });
  });
  process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server');
    server.close(() => {
        logger.info('HTTP server closed');
    });
  });
};

// Start the server
server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});

gracefulShutdown(server);