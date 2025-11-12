"use strict";
/**
 * Error Handler Middleware - TypeScript Port
 * Centralized error handling for Express application
 *
 * CRITICAL: Maintains exact error handling behavior from JavaScript version
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeoutHandler = exports.notFoundHandler = exports.errorHandler = exports.asyncHandler = void 0;
exports.mapDllErrorToHttpStatus = mapDllErrorToHttpStatus;
exports.createApiError = createApiError;
const logger_1 = __importDefault(require("../utils/logger"));
const constants_1 = require("../utils/constants");
/**
 * Async wrapper to catch errors in async route handlers
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
exports.asyncHandler = asyncHandler;
/**
 * Main error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    const error = { ...err };
    error.message = err.message;
    // Log the error
    logger_1.default.apiError(req.method, req.path, error, res.statusCode || 500);
    // Default error response
    let response = {
        success: false,
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production'
            ? 'Something went wrong'
            : error.message,
    };
    // Handle different error types
    // 1. TMG DLL errors
    if (error.code && error.code < 0) {
        const statusCode = mapDllErrorToHttpStatus(error.code);
        response = {
            success: false,
            error: constants_1.API_ERROR_CODES.DEVICE_COMMUNICATION_ERROR,
            message: `IO-Link operation failed: ${error.message}`,
            code: error.code,
        };
        res.status(statusCode).json(response);
        return;
    }
    // 2. Validation errors (Joi)
    if (error.name === 'ValidationError' || error.isJoi) {
        response = {
            success: false,
            error: constants_1.API_ERROR_CODES.VALIDATION_ERROR,
            message: 'Validation failed',
            details: error.details || error.message,
        };
        res.status(400).json(response);
        return;
    }
    // 3. Device not found errors
    if (error.message && error.message.includes('Device not found')) {
        response = {
            success: false,
            error: constants_1.API_ERROR_CODES.DEVICE_NOT_FOUND,
            message: error.message,
        };
        res.status(404).json(response);
        return;
    }
    // 4. Device not connected errors
    if (error.message && error.message.includes('not connected')) {
        response = {
            success: false,
            error: constants_1.API_ERROR_CODES.DEVICE_NOT_CONNECTED,
            message: error.message,
        };
        res.status(409).json(response);
        return;
    }
    // 5. Master not found errors
    if (error.message &&
        error.message.includes('Master') &&
        error.message.includes('not found')) {
        response = {
            success: false,
            error: constants_1.API_ERROR_CODES.MASTER_NOT_FOUND,
            message: error.message,
        };
        res.status(404).json(response);
        return;
    }
    // 6. Parameter errors
    if (error.message && error.message.includes('parameter')) {
        let errorCode = constants_1.API_ERROR_CODES.PARAMETER_NOT_FOUND;
        let statusCode = 404;
        if (error.message.includes('read-only')) {
            errorCode = constants_1.API_ERROR_CODES.PARAMETER_READ_ONLY;
            statusCode = 403;
        }
        else if (error.message.includes('write-only')) {
            errorCode = constants_1.API_ERROR_CODES.PARAMETER_WRITE_ONLY;
            statusCode = 403;
        }
        else if (error.message.includes('validation')) {
            errorCode = constants_1.API_ERROR_CODES.PARAMETER_VALUE_ERROR;
            statusCode = 400;
        }
        response = {
            success: false,
            error: errorCode,
            message: error.message,
        };
        res.status(statusCode).json(response);
        return;
    }
    // 7. Port validation errors
    if (error.message && error.message.includes('Invalid port')) {
        response = {
            success: false,
            error: constants_1.API_ERROR_CODES.INVALID_PORT,
            message: error.message,
        };
        res.status(400).json(response);
        return;
    }
    // 8. Custom API errors
    if (error.apiErrorCode) {
        response = {
            success: false,
            error: error.apiErrorCode,
            message: error.message,
        };
        res.status(error.statusCode || 400).json(response);
        return;
    }
    // 9. Default server error
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json(response);
};
exports.errorHandler = errorHandler;
/**
 * Map TMG DLL error codes to appropriate HTTP status codes
 */
function mapDllErrorToHttpStatus(dllCode) {
    switch (dllCode) {
        case constants_1.RETURN_CODES.RETURN_DEVICE_NOT_AVAILABLE:
            return 404;
        case constants_1.RETURN_CODES.RETURN_UNKNOWN_HANDLE:
            return 404;
        case constants_1.RETURN_CODES.RETURN_WRONG_PARAMETER:
            return 400;
        case constants_1.RETURN_CODES.RETURN_INTERNAL_ERROR:
        default:
            return 500;
    }
}
/**
 * Create custom API error
 */
function createApiError(message, apiErrorCode, statusCode = 400) {
    const error = new Error(message);
    error.apiErrorCode = apiErrorCode;
    error.statusCode = statusCode;
    return error;
}
/**
 * 404 handler for unknown routes
 */
const notFoundHandler = (req, res, next) => {
    const error = createApiError(`Route not found: ${req.method} ${req.path}`, constants_1.API_ERROR_CODES.INVALID_REQUEST, 404);
    next(error);
};
exports.notFoundHandler = notFoundHandler;
/**
 * Request timeout handler
 */
const timeoutHandler = (timeoutMs = 30000) => (req, res, next) => {
    req.setTimeout(timeoutMs, () => {
        const error = createApiError('Request timeout', constants_1.API_ERROR_CODES.INTERNAL_ERROR, 408);
        next(error);
    });
    next();
};
exports.timeoutHandler = timeoutHandler;
//# sourceMappingURL=errorHandler.js.map