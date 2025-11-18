/**
 * Error Handler Middleware
 * Centralized error handling for Express application
 * 
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { API_ERROR_CODES, RETURN_CODES } from '../utils/constants';

interface CustomError extends Error {
  code?: number;
  isJoi?: boolean;
  details?: any;
  apiErrorCode?: string;
  statusCode?: number;
}

/**
 * Async wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Main error handling middleware
 */
export const errorHandler = (err: CustomError, req: Request, res: Response, next: NextFunction): void => {
  const error: CustomError = { ...err };
  error.message = err.message;

  // Log the error
  logger.apiError(req.method, req.path, error, res.statusCode || 500);

  // Default error response
  let response: any = {
    success: false,
    error: 'Internal Server Error',
    message:
      process.env.NODE_ENV === 'production'
        ? 'Something went wrong'
        : error.message,
  };

  // Handle different error types

  // 1. TMG DLL errors
  if (error.code && error.code < 0) {
    const statusCode = mapDllErrorToHttpStatus(error.code);
    response = {
      success: false,
      error: API_ERROR_CODES.DEVICE_COMMUNICATION_ERROR,
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
      error: API_ERROR_CODES.VALIDATION_ERROR,
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
      error: API_ERROR_CODES.DEVICE_NOT_FOUND,
      message: error.message,
    };
    res.status(404).json(response);
    return;
  }

  // 4. Device not connected errors
  if (error.message && error.message.includes('not connected')) {
    response = {
      success: false,
      error: API_ERROR_CODES.DEVICE_NOT_CONNECTED,
      message: error.message,
    };
    res.status(409).json(response);
    return;
  }

  // 5. Master not found errors
  if (
    error.message &&
    error.message.includes('Master') &&
    error.message.includes('not found')
  ) {
    response = {
      success: false,
      error: API_ERROR_CODES.MASTER_NOT_FOUND,
      message: error.message,
    };
    res.status(404).json(response);
    return;
  }

  // 6. Parameter errors
  if (error.message && error.message.includes('parameter')) {
    let errorCode: string = API_ERROR_CODES.PARAMETER_NOT_FOUND;
    let statusCode = 404;

    if (error.message.includes('read-only')) {
      errorCode = API_ERROR_CODES.PARAMETER_READ_ONLY as string;
      statusCode = 403;
    } else if (error.message.includes('write-only')) {
      errorCode = API_ERROR_CODES.PARAMETER_WRITE_ONLY as string;
      statusCode = 403;
    } else if (error.message.includes('validation')) {
      errorCode = API_ERROR_CODES.PARAMETER_VALUE_ERROR as string;
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
      error: API_ERROR_CODES.INVALID_PORT,
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

/**
 * Map TMG DLL error codes to appropriate HTTP status codes
 */
export function mapDllErrorToHttpStatus(dllCode: number): number {
  switch (dllCode) {
    case RETURN_CODES.RETURN_DEVICE_NOT_AVAILABLE:
      return 404;
    case RETURN_CODES.RETURN_UNKNOWN_HANDLE:
      return 404;
    case RETURN_CODES.RETURN_WRONG_PARAMETER:
      return 400;
    case RETURN_CODES.RETURN_INTERNAL_ERROR:
    default:
      return 500;
  }
}

/**
 * Create custom API error
 */
export function createApiError(message: string, apiErrorCode: string, statusCode: number = 400): CustomError {
  const error: CustomError = new Error(message);
  error.apiErrorCode = apiErrorCode;
  error.statusCode = statusCode;
  return error;
}

/**
 * 404 handler for unknown routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = createApiError(
    `Route not found: ${req.method} ${req.path}`,
    API_ERROR_CODES.INVALID_REQUEST,
    404
  );
  next(error);
};

/**
 * Request timeout handler
 */
export const timeoutHandler =
  (timeoutMs: number = 30000) =>
  (req: Request, res: Response, next: NextFunction): void => {
    req.setTimeout(timeoutMs, () => {
      const error = createApiError(
        'Request timeout',
        API_ERROR_CODES.INTERNAL_ERROR,
        408
      );
      next(error);
    });
    next();
  };
