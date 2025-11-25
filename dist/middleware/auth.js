"use strict";
/**
 * Authentication Middleware (DISABLED)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdminAccess = exports.requireOperatorAccess = exports.requireWriteAccess = exports.requireReadAccess = exports.ROLES = void 0;
exports.authenticateApiKey = authenticateApiKey;
exports.getUserRole = getUserRole;
exports.hasPermission = hasPermission;
exports.requirePermission = requirePermission;
exports.authorizeDeviceAccess = authorizeDeviceAccess;
exports.logAuthenticatedRequest = logAuthenticatedRequest;
exports.addSecurityHeaders = addSecurityHeaders;
const logger_1 = __importDefault(require("../utils/logger"));
// ============================================================================
// DISABLED AUTHENTICATION
// ============================================================================
function authenticateApiKey(req, res, next) {
    // Authentication disabled
    next();
}
// ============================================================================
// DISABLED AUTHORIZATION
// ============================================================================
exports.ROLES = {
    READ_ONLY: 'read_only',
    OPERATOR: 'operator',
    ADMIN: 'admin',
};
function getUserRole(req) {
    return exports.ROLES.ADMIN; // Always admin when auth is disabled
}
function hasPermission(userRole, requiredPermission) {
    return true; // All permissions granted
}
function requirePermission(permission) {
    return (req, res, next) => {
        next(); // Pass through
    };
}
// ============================================================================
// PASS-THROUGH MIDDLEWARE
// ============================================================================
const requireReadAccess = (req, res, next) => next();
exports.requireReadAccess = requireReadAccess;
const requireWriteAccess = (req, res, next) => next();
exports.requireWriteAccess = requireWriteAccess;
const requireOperatorAccess = (req, res, next) => next();
exports.requireOperatorAccess = requireOperatorAccess;
const requireAdminAccess = (req, res, next) => next();
exports.requireAdminAccess = requireAdminAccess;
function authorizeDeviceAccess(req, res, next) {
    next(); // Pass through
}
// ============================================================================
// SIMPLIFIED REQUEST LOGGING
// ============================================================================
function logAuthenticatedRequest(req, res, next) {
    const userAgent = req.headers['user-agent'] || 'unknown';
    const clientIp = req.ip || req.connection.remoteAddress;
    logger_1.default.info(`API Request: ${req.method} ${req.path}`, {
        clientIp,
        userAgent,
        timestamp: new Date().toISOString(),
    });
    const originalSend = res.send;
    res.send = function (data) {
        logger_1.default.info(`API Response: ${req.method} ${req.path} - ${res.statusCode}`, {
            responseSize: data?.length || 0,
            duration: Date.now() - (req.startTime || 0),
        });
        return originalSend.call(this, data);
    };
    req.startTime = Date.now();
    next();
}
// ============================================================================
// SECURITY HEADERS
// ============================================================================
function addSecurityHeaders(req, res, next) {
    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        Pragma: 'no-cache',
        Expires: '0',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
    });
    next();
}
//# sourceMappingURL=auth.js.map