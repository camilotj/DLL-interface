"use strict";
/**
 * Express Application Configuration
 * Main Express app setup with middleware and route configuration
 *
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
exports.setServer = setServer;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Import custom middleware
const errorHandler_1 = require("./middleware/errorHandler");
const auth_1 = require("./middleware/auth");
// Import routes
const devices_1 = __importDefault(require("./routes/devices"));
const data_1 = __importDefault(require("./routes/data"));
const stream_1 = __importDefault(require("./routes/stream"));
// Import utils
const logger_1 = __importDefault(require("./utils/logger"));
// Create Express application
const app = (0, express_1.default)();
exports.app = app;
// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================
// Security headers
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
        },
    },
    crossOriginEmbedderPolicy: false, // Allow Socket.IO
}));
// CORS configuration
app.use((0, cors_1.default)({
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
}));
// Additional security headers
app.use(auth_1.addSecurityHeaders);
// ============================================================================
// GENERAL MIDDLEWARE
// ============================================================================
// Request timeout (30 seconds)
app.use((0, errorHandler_1.timeoutHandler)(30000));
// Body parsing
app.use(express_1.default.json({
    limit: '10mb',
    type: ['application/json', 'text/plain'],
}));
app.use(express_1.default.urlencoded({
    extended: true,
    limit: '10mb',
    parameterLimit: 1000,
}));
// Request logging
if (process.env.NODE_ENV !== 'test') {
    app.use((0, morgan_1.default)('combined', {
        stream: {
            write: (message) => logger_1.default.info(message.trim()),
        },
    }));
}
// Enhanced request logging with authentication context
app.use(auth_1.logAuthenticatedRequest);
// ============================================================================
// RATE LIMITING
// ============================================================================
// Global rate limiting
const globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: (req) => {
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
    skip: (req) => req.path === '/api/v1/health' || req.path === '/api/v1/devices/health',
});
app.use('/api/', globalLimiter);
// Stricter rate limiting for write operations
const writeLimiter = (0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 100, // Limit write operations
    message: {
        success: false,
        error: 'WRITE_RATE_LIMIT_EXCEEDED',
        message: 'Too many write operations, please try again later',
    },
});
// Apply write limiter to POST/PUT/DELETE routes
app.use('/api/v1/data', (req, res, next) => {
    // Apply write limiter to process data and parameter write operations
    if (req.method === 'POST' &&
        (req.path.includes('/process') || req.path.includes('/parameters'))) {
        return writeLimiter(req, res, next);
    }
    next();
});
// ============================================================================
// AUTHENTICATION
// ============================================================================
// API key authentication for all API routes
app.use('/api/', auth_1.authenticateApiKey);
// ============================================================================
// API ROUTES
// ============================================================================
// Health check endpoint (before authentication)
app.get('/api/v1/health', (req, res) => {
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
app.get('/api/v1/docs', (req, res) => {
    res.json({
        success: true,
        data: {
            title: 'IO-Link Backend API',
            version: '1.0.0',
            description: 'RESTful API for IO-Link device communication and management',
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
app.use('/api/v1', devices_1.default);
app.use('/api/v1/data', data_1.default);
app.use('/api/v1/stream', stream_1.default);
// Root redirect
app.get('/', (req, res) => {
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
app.use(errorHandler_1.notFoundHandler);
// Global error handler (must be last)
app.use(errorHandler_1.errorHandler);
// ============================================================================
// GRACEFUL SHUTDOWN HANDLING
// ============================================================================
// Graceful shutdown handler
let server = null;
function gracefulShutdown(signal) {
    logger_1.default.info(`Received ${signal}. Starting graceful shutdown...`);
    if (server) {
        server.close((err) => {
            if (err) {
                logger_1.default.error('Error during server shutdown:', err);
                process.exit(1);
            }
            logger_1.default.info('HTTP server closed.');
            // Additional cleanup can be added here
            // (database connections, active streams, etc.)
            process.exit(0);
        });
        // Force close after timeout
        setTimeout(() => {
            logger_1.default.error('Forced shutdown due to timeout');
            process.exit(1);
        }, 10000); // 10 seconds timeout
    }
    else {
        process.exit(0);
    }
}
// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger_1.default.error('Uncaught Exception:', err);
    gracefulShutdown('uncaughtException');
});
process.on('unhandledRejection', (reason, promise) => {
    logger_1.default.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
});
function setServer(serverInstance) {
    server = serverInstance;
}
//# sourceMappingURL=app.js.map