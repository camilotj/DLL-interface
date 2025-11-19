"use strict";
/**
 * Server Entry Point
 * HTTP server startup with Socket.IO integration
 *
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = exports.io = exports.server = void 0;
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const app_1 = require("./app");
Object.defineProperty(exports, "app", { enumerable: true, get: function () { return app_1.app; } });
const streamController = __importStar(require("./controllers/streamController"));
const logger_1 = __importDefault(require("./utils/logger"));
// ============================================================================
// SERVER CONFIGURATION
// ============================================================================
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
// Create HTTP server
const server = http_1.default.createServer(app_1.app);
exports.server = server;
// Set server instance for graceful shutdown
(0, app_1.setServer)(server);
// ============================================================================
// SOCKET.IO CONFIGURATION
// ============================================================================
const io = new socket_io_1.Server(server, {
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
exports.io = io;
// Socket.IO authentication middleware
io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers['x-api-key'];
    // Skip authentication in development if no API key is set
    if (process.env.NODE_ENV === 'development' && !process.env.API_KEY) {
        logger_1.default.debug(`WebSocket connection allowed in development mode: ${socket.id}`);
        return next();
    }
    const validApiKey = process.env.API_KEY || 'dev-api-key-12345';
    if (!token) {
        logger_1.default.warn(`WebSocket connection rejected - no API key: ${socket.id}`);
        return next(new Error('Authentication required'));
    }
    if (token !== validApiKey) {
        logger_1.default.warn(`WebSocket connection rejected - invalid API key: ${socket.id}`);
        return next(new Error('Invalid API key'));
    }
    logger_1.default.debug(`WebSocket connection authenticated: ${socket.id}`);
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
    logger_1.default.info(`IO-Link Backend Server started`);
    logger_1.default.info(`HTTP Server: http://${HOST}:${PORT}`);
    logger_1.default.info(`WebSocket Server: ws://${HOST}:${PORT}/socket.io`);
    logger_1.default.info(`API Documentation: http://${HOST}:${PORT}/api/v1/docs`);
    logger_1.default.info(`Health Check: http://${HOST}:${PORT}/api/v1/health`);
    logger_1.default.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    if (process.env.NODE_ENV === 'development') {
        logger_1.default.info(`Development Mode: API authentication is relaxed`);
        logger_1.default.info(`Test the API with: curl http://${HOST}:${PORT}/api/v1/health`);
    }
    // Log available endpoints
    logger_1.default.info('Available API endpoints:');
    logger_1.default.info('   GET  /api/v1/health                     - Health check');
    logger_1.default.info('   GET  /api/v1/docs                       - API documentation');
    logger_1.default.info('   GET  /api/v1/masters                    - Discover masters');
    logger_1.default.info('   POST /api/v1/masters/connect            - Connect to master');
    logger_1.default.info('   GET  /api/v1/devices                    - List devices');
    logger_1.default.info('   GET  /api/v1/devices/summary            - Device summary');
    logger_1.default.info('   GET  /api/v1/data/:master/:port/process - Read process data');
    logger_1.default.info('   GET  /api/v1/stream/documentation       - WebSocket documentation');
});
// Handle server errors
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        logger_1.default.error(`Port ${PORT} is already in use`);
        process.exit(1);
    }
    else {
        logger_1.default.error('Server error:', err);
        process.exit(1);
    }
});
// Handle Socket.IO errors
io.on('error', (err) => {
    logger_1.default.error('Socket.IO error:', err);
});
// Log Socket.IO connection events
io.on('connection', (socket) => {
    const clientInfo = {
        id: socket.id,
        address: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent'],
        timestamp: new Date().toISOString(),
    };
    logger_1.default.info(`WebSocket client connected: ${JSON.stringify(clientInfo)}`);
    socket.on('disconnect', (reason) => {
        logger_1.default.info(`WebSocket client disconnected: ${socket.id} (${reason})`);
    });
});
// ============================================================================
// DEVELOPMENT HELPERS
// ============================================================================
if (process.env.NODE_ENV === 'development') {
    // Log all available routes in development
    setTimeout(() => {
        logger_1.default.info('Development mode - All registered routes:');
        function printRoutes(routes, prefix = '') {
            routes.forEach((route) => {
                if (route.route) {
                    const methods = Object.keys(route.route.methods)
                        .map((m) => m.toUpperCase())
                        .join(', ');
                    logger_1.default.info(`   ${methods.padEnd(8)} ${prefix}${route.route.path}`);
                }
            });
        }
        app_1.app._router.stack.forEach((layer) => {
            if (layer.route) {
                printRoutes([layer]);
            }
            else if (layer.name === 'router' && layer.regexp) {
                const match = layer.regexp.source.match(/^\^\\?(.*?)\\\?\(\?\=/);
                const prefix = match ? match[1].replace(/\\\//g, '/') : '';
                if (layer.handle.stack) {
                    printRoutes(layer.handle.stack, prefix);
                }
            }
        });
    }, 1000);
}
//# sourceMappingURL=server.js.map