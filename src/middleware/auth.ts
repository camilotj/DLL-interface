/**
 * Authentication Middleware
 * Basic authentication and authorization for IO-Link API
 * 
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { createApiError } from './errorHandler';
import { API_ERROR_CODES } from '../utils/constants';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// Extend Express Request with custom auth properties
declare global {
  namespace Express {
    interface Request {
      apiKey?: string;
      userRole?: string;
      startTime?: number;
    }
  }
}

// ============================================================================
// BASIC API KEY AUTHENTICATION
// ============================================================================

/**
 * Simple API key authentication middleware
 * In production, this should be replaced with proper JWT or OAuth
 */
export function authenticateApiKey(req: Request, res: Response, next: NextFunction): void {
  // Skip authentication in development if no API key is set
  if (process.env.NODE_ENV === 'development' && !process.env.API_KEY) {
    logger.debug('API key authentication skipped in development mode');
    return next();
  }

  const apiKey =
    req.headers['x-api-key'] ||
    (req.headers['authorization'] as string)?.replace('Bearer ', '');

  if (!apiKey) {
    const error = createApiError(
      'API key required. Provide X-API-Key header or Authorization: Bearer <key>',
      'AUTHENTICATION_REQUIRED',
      401
    );
    return next(error);
  }

  // In production, compare with environment variable or database
  const validApiKey = process.env.API_KEY || 'dev-api-key-12345';

  if (apiKey !== validApiKey) {
    const apiKeyStr = Array.isArray(apiKey) ? apiKey[0] : apiKey;
    logger.warn(
      `Invalid API key attempt from ${req.ip}: ${apiKeyStr.substring(0, 8)}...`
    );
    const error = createApiError(
      'Invalid API key',
      'AUTHENTICATION_FAILED',
      401
    );
    return next(error);
  }

  // Attach API key info to request for logging
  req.apiKey = apiKey.substring(0, 8) + '...';
  logger.debug(`API request authenticated with key: ${req.apiKey}`);

  next();
}

// ============================================================================
// ROLE-BASED AUTHORIZATION
// ============================================================================

/**
 * Authorization levels for IO-Link operations
 */
export const ROLES = {
  READ_ONLY: 'read_only',
  OPERATOR: 'operator',
  ADMIN: 'admin',
} as const;

export type RoleType = typeof ROLES[keyof typeof ROLES];

export const ROLE_PERMISSIONS: Record<RoleType, string[]> = {
  [ROLES.READ_ONLY]: [
    'read_devices',
    'read_process_data',
    'read_parameters',
    'get_device_status',
  ],
  [ROLES.OPERATOR]: [
    'read_devices',
    'read_process_data',
    'read_parameters',
    'get_device_status',
    'write_process_data',
    'write_parameters',
  ],
  [ROLES.ADMIN]: [
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
export function getUserRole(req: Request): RoleType {
  // Check for role in headers (for development/testing)
  const headerRole = req.headers['x-user-role'] as string;
  if (headerRole && Object.values(ROLES).includes(headerRole as RoleType)) {
    return headerRole as RoleType;
  }

  // Default role based on API key or environment
  if (process.env.NODE_ENV === 'development') {
    return ROLES.ADMIN; // Full access in development
  }

  // In production, map API keys to roles
  // This is a simplified example - use proper user management
  const apiKey = req.headers['x-api-key'] as string;
  if (apiKey) {
    // Example: admin keys start with 'admin_', operator keys with 'op_'
    if (apiKey.startsWith('admin_')) return ROLES.ADMIN;
    if (apiKey.startsWith('op_')) return ROLES.OPERATOR;
    return ROLES.READ_ONLY; // Default to read-only
  }

  return ROLES.READ_ONLY;
}

/**
 * Check if user has required permission
 */
export function hasPermission(userRole: RoleType, requiredPermission: string): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(requiredPermission);
}

/**
 * Authorization middleware factory
 */
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = getUserRole(req);

    if (!hasPermission(userRole, permission)) {
      logger.warn(
        `Access denied for role ${userRole} to ${permission} on ${req.path}`
      );
      const error = createApiError(
        `Insufficient permissions. Required: ${permission}, User role: ${userRole}`,
        'AUTHORIZATION_FAILED',
        403
      );
      return next(error);
    }

    // Attach user role to request for logging
    req.userRole = userRole;
    logger.debug(`Authorized ${userRole} for ${permission} on ${req.path}`);

    next();
  };
}

// ============================================================================
// SPECIFIC PERMISSION MIDDLEWARE
// ============================================================================

export const requireReadAccess = requirePermission('read_devices');
export const requireWriteAccess = requirePermission('write_parameters');
export const requireOperatorAccess = requirePermission('write_process_data');
export const requireAdminAccess = requirePermission('connect_master');

// ============================================================================
// RATE LIMITING BY ROLE
// ============================================================================

interface RateLimit {
  windowMs: number;
  max: number;
}

/**
 * Get rate limit based on user role
 */
export function getRoleRateLimit(req: Request): RateLimit {
  const userRole = getUserRole(req);

  switch (userRole) {
    case ROLES.ADMIN:
      return { windowMs: 15 * 60 * 1000, max: 1000 }; // 1000 requests per 15 minutes
    case ROLES.OPERATOR:
      return { windowMs: 15 * 60 * 1000, max: 500 }; // 500 requests per 15 minutes
    case ROLES.READ_ONLY:
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
export function authorizeDeviceAccess(req: Request, res: Response, next: NextFunction): void {
  const userRole = getUserRole(req);
  const deviceId = req.params.deviceId;
  const port = parseInt(deviceId);

  // Example: Restrict access to certain ports based on role
  if (userRole === ROLES.READ_ONLY && port > 4) {
    logger.warn(`Read-only user attempted access to restricted port ${port}`);
    const error = createApiError(
      `Access denied to port ${port}. Read-only users can only access ports 1-4.`,
      'DEVICE_ACCESS_DENIED',
      403
    );
    return next(error);
  }

  // Log device access
  logger.debug(`Device access authorized: role=${userRole}, port=${port}`);
  next();
}

// ============================================================================
// REQUEST LOGGING WITH USER CONTEXT
// ============================================================================

/**
 * Enhanced request logging with authentication context
 */
export function logAuthenticatedRequest(req: Request, res: Response, next: NextFunction): void {
  const userRole = getUserRole(req);
  const apiKey = req.apiKey || 'none';
  const userAgent = req.headers['user-agent'] || 'unknown';
  const clientIp = req.ip || (req.connection as any).remoteAddress;

  // Enhanced logging with user context
  logger.info(`API Request: ${req.method} ${req.path}`, {
    userRole,
    apiKey,
    clientIp,
    userAgent,
    timestamp: new Date().toISOString(),
  });

  // Log response when request completes
  const originalSend = res.send;
  res.send = function (data: any) {
    logger.info(`API Response: ${req.method} ${req.path} - ${res.statusCode}`, {
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
export function addSecurityHeaders(req: Request, res: Response, next: NextFunction): void {
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
