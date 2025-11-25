/**
 * HTTP and WebSocket Server
 * Main server entry point
 */

import { Server, createServer } from 'http';
import { app, setServer } from './app';
import { initializeWebSocket } from './controllers/streamController';
import logger from './utils/logger';

// Configuration
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Create HTTP server
const server: Server = createServer(app);

// Set server instance for graceful shutdown
setServer(server);

// Initialize WebSocket server
const io = initializeWebSocket(server);

// Start server
server.listen(PORT, HOST, () => {
  logger.info('IO-Link Backend Server started');
  logger.info(`HTTP Server: http://${HOST}:${PORT}`);
  logger.info(`WebSocket Server: ws://${HOST}:${PORT}/socket.io`);
  logger.info(`API Documentation: http://${HOST}:${PORT}/api/v1/docs`);
  logger.info(`Health Check: http://${HOST}:${PORT}/api/v1/health`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  logger.info('Available API endpoints:');
  logger.info('   GET  /api/v1/health                     - Health check');
  logger.info('   GET  /api/v1/docs                       - API documentation');
  logger.info('   GET  /api/v1/masters                    - Discover masters');
  logger.info('   POST /api/v1/masters/connect            - Connect to master');
  logger.info('   GET  /api/v1/devices                    - List devices');
  logger.info('   GET  /api/v1/devices/summary            - Device summary');
  logger.info('   GET  /api/v1/data/:master/:port/process - Read process data');
  logger.info('   GET  /api/v1/stream/documentation       - WebSocket documentation');
});

// Error handling
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use`);
  } else {
    logger.error('Server error:', error);
  }
  
  // Don't exit in Electron - just log the error
  if (!process.versions.electron) {
    process.exit(1);
  }
});

// Export for use in Electron (single export statement)
export { server, app, io };