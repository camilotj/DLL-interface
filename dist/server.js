"use strict";
/**
 * HTTP and WebSocket Server
 * Main server entry point
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.app = exports.server = void 0;
const http_1 = require("http");
const app_1 = require("./app");
Object.defineProperty(exports, "app", { enumerable: true, get: function () { return app_1.app; } });
const streamController_1 = require("./controllers/streamController");
const logger_1 = __importDefault(require("./utils/logger"));
// Configuration
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
// Create HTTP server
const server = (0, http_1.createServer)(app_1.app);
exports.server = server;
// Set server instance for graceful shutdown
(0, app_1.setServer)(server);
// Initialize WebSocket server
const io = (0, streamController_1.initializeWebSocket)(server);
exports.io = io;
// Start server
server.listen(PORT, HOST, () => {
    logger_1.default.info('IO-Link Backend Server started');
    logger_1.default.info(`HTTP Server: http://${HOST}:${PORT}`);
    logger_1.default.info(`WebSocket Server: ws://${HOST}:${PORT}/socket.io`);
    logger_1.default.info(`API Documentation: http://${HOST}:${PORT}/api/v1/docs`);
    logger_1.default.info(`Health Check: http://${HOST}:${PORT}/api/v1/health`);
    logger_1.default.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
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
// Error handling
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        logger_1.default.error(`Port ${PORT} is already in use`);
    }
    else {
        logger_1.default.error('Server error:', error);
    }
    // Don't exit in Electron - just log the error
    if (!process.versions.electron) {
        process.exit(1);
    }
});
//# sourceMappingURL=server.js.map