/**
 * Server Entry Point - TypeScript Port
 * HTTP server startup with Socket.IO integration
 * 
 * CRITICAL: Maintains exact server behavior from JavaScript version
 */

import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { app, setServer } from './app';
import * as streamController from './controllers/streamController';
import logger from './utils/logger';

// ============================================================================
// SERVER CONFIGURATION
// ============================================================================

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Create HTTP server
const server = http.createServer(app);

// Set server instance for graceful shutdown
setServer(server);

// ============================================================================
// SOCKET.IO CONFIGURATION
// ============================================================================

const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token =
    socket.handshake.auth.token || socket.handshake.headers['x-api-key'];

  // Skip authentication in development if no API key is set
  if (process.env.NODE_ENV === 'development' && !process.env.API_KEY) {
    logger.debug(
      `WebSocket connection allowed in development mode: ${socket.id}`
    );
    return next();
  }

  const validApiKey = process.env.API_KEY || 'dev-api-key-12345';

  if (!token) {
    logger.warn(`WebSocket connection rejected - no API key: ${socket.id}`);
    return next(new Error('Authentication required'));
  }

  if (token !== validApiKey) {
    logger.warn(
      `WebSocket connection rejected - invalid API key: ${socket.id}`
    );
    return next(new Error('Invalid API key'));
  }

  logger.debug(`WebSocket connection authenticated: ${socket.id}`);
  next();
});

// Handle WebSocket connections
io.on('connection', (socket) => {
  streamController.handleConnection(socket, io);
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

// Start server
server.listen(PORT, HOST, () => {
  logger.info(`IO-Link Backend Server started`);
  logger.info(`HTTP Server: http://${HOST}:${PORT}`);
  logger.info(`WebSocket Server: ws://${HOST}:${PORT}/socket.io`);
  logger.info(`API Documentation: http://${HOST}:${PORT}/api/v1/docs`);
  logger.info(`Health Check: http://${HOST}:${PORT}/api/v1/health`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);

  if (process.env.NODE_ENV === 'development') {
    logger.info(`Development Mode: API authentication is relaxed`);
    logger.info(`Test the API with: curl http://${HOST}:${PORT}/api/v1/health`);
  }

  // Log available endpoints
  logger.info('Available API endpoints:');
  logger.info('   GET  /api/v1/health                     - Health check');
  logger.info('   GET  /api/v1/docs                       - API documentation');
  logger.info('   GET  /api/v1/masters                    - Discover masters');
  logger.info('   POST /api/v1/masters/connect            - Connect to master');
  logger.info('   GET  /api/v1/devices                    - List devices');
  logger.info('   GET  /api/v1/devices/summary            - Device summary');
  logger.info('   GET  /api/v1/data/:master/:port/process - Read process data');
  logger.info(
    '   GET  /api/v1/stream/documentation       - WebSocket documentation'
  );
});

// Handle server errors
server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    logger.error('Server error:', err);
    process.exit(1);
  }
});

// Handle Socket.IO errors
io.on('error', (err: Error) => {
  logger.error('Socket.IO error:', err);
});

// Log Socket.IO connection events
io.on('connection', (socket) => {
  const clientInfo = {
    id: socket.id,
    address: socket.handshake.address,
    userAgent: socket.handshake.headers['user-agent'],
    timestamp: new Date().toISOString(),
  };

  logger.info(`WebSocket client connected: ${JSON.stringify(clientInfo)}`);

  socket.on('disconnect', (reason) => {
    logger.info(`WebSocket client disconnected: ${socket.id} (${reason})`);
  });
});

// ============================================================================
// DEVELOPMENT HELPERS
// ============================================================================

if (process.env.NODE_ENV === 'development') {
  // Log all available routes in development
  setTimeout(() => {
    logger.info('Development mode - All registered routes:');

    function printRoutes(routes: any[], prefix = ''): void {
      routes.forEach((route) => {
        if (route.route) {
          const methods = Object.keys(route.route.methods)
            .map((m) => m.toUpperCase())
            .join(', ');
          logger.info(`   ${methods.padEnd(8)} ${prefix}${route.route.path}`);
        }
      });
    }

    (app as any)._router.stack.forEach((layer: any) => {
      if (layer.route) {
        printRoutes([layer]);
      } else if (layer.name === 'router' && layer.regexp) {
        const match = layer.regexp.source.match(/^\^\\?(.*?)\\\?\(\?\=/);
        const prefix = match ? match[1].replace(/\\\//g, '/') : '';
        if (layer.handle.stack) {
          printRoutes(layer.handle.stack, prefix);
        }
      }
    });
  }, 1000);
}

// ============================================================================
// EXPORTS
// ============================================================================

export { server, io, app };
