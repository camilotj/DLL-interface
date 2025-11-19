"use strict";
/**
 * Authentication Middleware
 * Basic authentication and authorization for IO-Link API
 *
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdminAccess = exports.requireOperatorAccess = exports.requireWriteAccess = exports.requireReadAccess = exports.ROLE_PERMISSIONS = exports.ROLES = void 0;
exports.authenticateApiKey = authenticateApiKey;
exports.getUserRole = getUserRole;
exports.hasPermission = hasPermission;
exports.requirePermission = requirePermission;
exports.getRoleRateLimit = getRoleRateLimit;
exports.authorizeDeviceAccess = authorizeDeviceAccess;
exports.logAuthenticatedRequest = logAuthenticatedRequest;
exports.addSecurityHeaders = addSecurityHeaders;
const logger_1 = __importDefault(require("../utils/logger"));
const errorHandler_1 = require("./errorHandler");
// ============================================================================
// BASIC API KEY AUTHENTICATION
// ============================================================================
/**
 * Simple API key authentication middleware
 * In production, this should be replaced with proper JWT or OAuth
 */
function authenticateApiKey(req, res, next) {
    // Skip authentication in development if no API key is set
    if (process.env.NODE_ENV === 'development' && !process.env.API_KEY) {
        logger_1.default.debug('API key authentication skipped in development mode');
        return next();
    }
    const apiKey = req.headers['x-api-key'] ||
        req.headers['authorization']?.replace('Bearer ', '');
    if (!apiKey) {
        const error = (0, errorHandler_1.createApiError)('API key required. Provide X-API-Key header or Authorization: Bearer <key>', 'AUTHENTICATION_REQUIRED', 401);
        return next(error);
    }
    // In production, compare with environment variable or database
    const validApiKey = process.env.API_KEY || 'dev-api-key-12345';
    if (apiKey !== validApiKey) {
        const apiKeyStr = Array.isArray(apiKey) ? apiKey[0] : apiKey;
        logger_1.default.warn(`Invalid API key attempt from ${req.ip}: ${apiKeyStr.substring(0, 8)}...`);
        const error = (0, errorHandler_1.createApiError)('Invalid API key', 'AUTHENTICATION_FAILED', 401);
        return next(error);
    }
    // Attach API key info to request for logging
    req.apiKey = apiKey.substring(0, 8) + '...';
    logger_1.default.debug(`API request authenticated with key: ${req.apiKey}`);
    next();
}
// ============================================================================
// ROLE-BASED AUTHORIZATION
// ============================================================================
/**
 * Authorization levels for IO-Link operations
 */
exports.ROLES = {
    READ_ONLY: 'read_only',
    OPERATOR: 'operator',
    ADMIN: 'admin',
};
exports.ROLE_PERMISSIONS = {
    [exports.ROLES.READ_ONLY]: [
        'read_devices',
        'read_process_data',
        'read_parameters',
        'get_device_status',
    ],
    [exports.ROLES.OPERATOR]: [
        'read_devices',
        'read_process_data',
        'read_parameters',
        'get_device_status',
        'write_process_data',
        'write_parameters',
    ],
    [exports.ROLES.ADMIN]: [
        'read_devices',
        'read_process_data',
        'read_parameters',
        'get_device_status',
        'write_process_data',
        'write_parameters',
        'connect_master',
        'disconnect_master',
        'device_configuration',
        'system_administration',
    ],
};
/**
 * Get user role from API key or headers
 * In production, this would typically look up the role in a database
 */
function getUserRole(req) {
    // Check for role in headers (for development/testing)
    const headerRole = req.headers['x-user-role'];
    if (headerRole && Object.values(exports.ROLES).includes(headerRole)) {
        return headerRole;
    }
    // Default role based on API key or environment
    if (process.env.NODE_ENV === 'development') {
        return exports.ROLES.ADMIN; // Full access in development
    }
    // In production, map API keys to roles
    // This is a simplified example - use proper user management
    const apiKey = req.headers['x-api-key'];
    if (apiKey) {
        // Example: admin keys start with 'admin_', operator keys with 'op_'
        if (apiKey.startsWith('admin_'))
            return exports.ROLES.ADMIN;
        if (apiKey.startsWith('op_'))
            return exports.ROLES.OPERATOR;
        return exports.ROLES.READ_ONLY; // Default to read-only
    }
    return exports.ROLES.READ_ONLY;
}
/**
 * Check if user has required permission
 */
function hasPermission(userRole, requiredPermission) {
    const permissions = exports.ROLE_PERMISSIONS[userRole] || [];
    return permissions.includes(requiredPermission);
}
/**
 * Authorization middleware factory
 */
function requirePermission(permission) {
    return (req, res, next) => {
        const userRole = getUserRole(req);
        if (!hasPermission(userRole, permission)) {
            logger_1.default.warn(`Access denied for role ${userRole} to ${permission} on ${req.path}`);
            const error = (0, errorHandler_1.createApiError)(`Insufficient permissions. Required: ${permission}, User role: ${userRole}`, 'AUTHORIZATION_FAILED', 403);
            return next(error);
        }
        // Attach user role to request for logging
        req.userRole = userRole;
        logger_1.default.debug(`Authorized ${userRole} for ${permission} on ${req.path}`);
        next();
    };
}
// ============================================================================
// SPECIFIC PERMISSION MIDDLEWARE
// ============================================================================
exports.requireReadAccess = requirePermission('read_devices');
exports.requireWriteAccess = requirePermission('write_parameters');
exports.requireOperatorAccess = requirePermission('write_process_data');
exports.requireAdminAccess = requirePermission('connect_master');
/**
 * Get rate limit based on user role
 */
function getRoleRateLimit(req) {
    const userRole = getUserRole(req);
    switch (userRole) {
        case exports.ROLES.ADMIN:
            return { windowMs: 15 * 60 * 1000, max: 1000 }; // 1000 requests per 15 minutes
        case exports.ROLES.OPERATOR:
            return { windowMs: 15 * 60 * 1000, max: 500 }; // 500 requests per 15 minutes
        case exports.ROLES.READ_ONLY:
        default:
            return { windowMs: 15 * 60 * 1000, max: 200 }; // 200 requests per 15 minutes
    }
}
// ============================================================================
// DEVICE ACCESS CONTROL
// ============================================================================
/**
 * Check if user can access specific device/port
 * This can be extended for port-specific access control
 */
function authorizeDeviceAccess(req, res, next) {
    const userRole = getUserRole(req);
    const deviceId = req.params.deviceId;
    const port = parseInt(deviceId);
    // Example: Restrict access to certain ports based on role
    if (userRole === exports.ROLES.READ_ONLY && port > 4) {
        logger_1.default.warn(`Read-only user attempted access to restricted port ${port}`);
        const error = (0, errorHandler_1.createApiError)(`Access denied to port ${port}. Read-only users can only access ports 1-4.`, 'DEVICE_ACCESS_DENIED', 403);
        return next(error);
    }
    // Log device access
    logger_1.default.debug(`Device access authorized: role=${userRole}, port=${port}`);
    next();
}
// ============================================================================
// REQUEST LOGGING WITH USER CONTEXT
// ============================================================================
/**
 * Enhanced request logging with authentication context
 */
function logAuthenticatedRequest(req, res, next) {
    const userRole = getUserRole(req);
    const apiKey = req.apiKey || 'none';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const clientIp = req.ip || req.connection.remoteAddress;
    // Enhanced logging with user context
    logger_1.default.info(`API Request: ${req.method} ${req.path}`, {
        userRole,
        apiKey,
        clientIp,
        userAgent,
        timestamp: new Date().toISOString(),
    });
    // Log response when request completes
    const originalSend = res.send;
    res.send = function (data) {
        logger_1.default.info(`API Response: ${req.method} ${req.path} - ${res.statusCode}`, {
            userRole,
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
/**
 * Add security headers for API responses
 */
function addSecurityHeaders(req, res, next) {
    // Prevent caching of sensitive data
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