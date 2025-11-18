/**
 * Express Application Configuration
 * Main Express app setup with middleware and route configuration
 * 
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { Server } from 'http';

// Import custom middleware
import {
  errorHandler,
  notFoundHandler,
  timeoutHandler,
} from './middleware/errorHandler';
import {
  authenticateApiKey,
  addSecurityHeaders,
  logAuthenticatedRequest,
} from './middleware/auth';

// Import routes
import deviceRoutes from './routes/devices';
import dataRoutes from './routes/data';
import streamRoutes from './routes/stream';

// Import utils
import logger from './utils/logger';

// Create Express application
const app: Application = express();

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow Socket.IO
  })
);

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-API-Key',
      'X-User-Role',
    ],
    exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining'],
    credentials: true,
  })
);

// Additional security headers
app.use(addSecurityHeaders);

// ============================================================================
// GENERAL MIDDLEWARE
// ============================================================================

// Request timeout (30 seconds)
app.use(timeoutHandler(30000));

// Body parsing
app.use(
  express.json({
    limit: '10mb',
    type: ['application/json', 'text/plain'],
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb',
    parameterLimit: 1000,
  })
);

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(
    morgan('combined', {
      stream: {
        write: (message: string) => logger.info(message.trim()),
      },
    })
  );
}

// Enhanced request logging with authentication context
app.use(logAuthenticatedRequest);

// ============================================================================
// RATE LIMITING
// ============================================================================

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req: Request) => {
    // Different limits based on user role (implemented in auth middleware)
    const userRole = req.headers['x-user-role'];
    switch (userRole) {
      case 'admin':
        return 1000;
      case 'operator':
        return 500;
      case 'read_only':
      default:
        return 200;
    }
  },
  message: {
    success: false,
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many requests, please try again later',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health checks
  skip: (req: Request) =>
    req.path === '/api/v1/health' || req.path === '/api/v1/devices/health',
});

app.use('/api/', globalLimiter);

// Stricter rate limiting for write operations
const writeLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // Limit write operations
  message: {
    success: false,
    error: 'WRITE_RATE_LIMIT_EXCEEDED',
    message: 'Too many write operations, please try again later',
  },
});

// Apply write limiter to POST/PUT/DELETE routes
app.use('/api/v1/data', (req: Request, res: Response, next: NextFunction) => {
  // Apply write limiter to process data and parameter write operations
  if (
    req.method === 'POST' &&
    (req.path.includes('/process') || req.path.includes('/parameters'))
  ) {
    return writeLimiter(req, res, next);
  }
  next();
});

// ============================================================================
// AUTHENTICATION
// ============================================================================

// API key authentication for all API routes
app.use('/api/', authenticateApiKey);

// ============================================================================
// API ROUTES
// ============================================================================

// Health check endpoint (before authentication)
app.get('/api/v1/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    },
  });
});

// API documentation endpoint
app.get('/api/v1/docs', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      title: 'IO-Link Backend API',
      version: '1.0.0',
      description:
        'RESTful API for IO-Link device communication and management',
      baseUrl: `${req.protocol}://${req.get('host')}/api/v1`,
      websocketUrl: `ws://${req.get('host')}/socket.io`,
      endpoints: {
        masters: {
          discover: 'GET /masters',
          connected: 'GET /masters/connected',
          connect: 'POST /masters/connect',
          disconnect: 'DELETE /masters/:handle',
        },
        devices: {
          list: 'GET /devices',
          get: 'GET /devices/:master/:port',
          status: 'GET /devices/:master/:port/status',
          info: 'GET /devices/:master/:port/info',
          summary: 'GET /devices/summary',
          scan: 'POST /devices/scan',
        },
        data: {
          processDataRead: 'GET /data/:master/:port/process',
          processDataWrite: 'POST /data/:master/:port/process',
          processDataStream: 'GET /data/:master/:port/process/stream',
          parameterRead: 'GET /data/:master/:port/parameters/:index',
          parameterWrite: 'POST /data/:master/:port/parameters/:index',
          parameterList: 'GET /data/:master/:port/parameters',
          standardParameters: 'GET /data/:master/:port/parameters/standard',
          batchOperations: 'POST /data/:master/:port/parameters/batch',
        },
        streaming: {
          status: 'GET /stream/status',
          active: 'GET /stream/active',
          documentation: 'GET /stream/documentation',
          examples: 'GET /stream/examples',
        },
      },
      authentication: {
        method: 'API Key',
        header: 'X-API-Key or Authorization: Bearer <key>',
        roles: ['read_only', 'operator', 'admin'],
      },
    },
  });
});

// Main API routes
app.use('/api/v1', deviceRoutes);
app.use('/api/v1/data', dataRoutes);
app.use('/api/v1/stream', streamRoutes);

// Root redirect
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'IO-Link Backend API',
    documentation: `${req.protocol}://${req.get('host')}/api/v1/docs`,
    health: `${req.protocol}://${req.get('host')}/api/v1/health`,
    version: '1.0.0',
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler for unknown routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ============================================================================
// GRACEFUL SHUTDOWN HANDLING
// ============================================================================

// Graceful shutdown handler
let server: Server | null = null;

function gracefulShutdown(signal: string): void {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  if (server) {
    server.close((err?: Error) => {
      if (err) {
        logger.error('Error during server shutdown:', err);
        process.exit(1);
      }

      logger.info('HTTP server closed.');

      // Additional cleanup can be added here
      // (database connections, active streams, etc.)

      process.exit(0);
    });

    // Force close after timeout
    setTimeout(() => {
      logger.error('Forced shutdown due to timeout');
      process.exit(1);
    }, 10000); // 10 seconds timeout
  } else {
    process.exit(0);
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception:', err);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Export app and setter for server instance
export { app };

export function setServer(serverInstance: Server): void {
  server = serverInstance;
}
