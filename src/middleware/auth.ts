/**
 * Authentication Middleware (DISABLED)
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

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
// DISABLED AUTHENTICATION
// ============================================================================

export function authenticateApiKey(req: Request, res: Response, next: NextFunction): void {
  // Authentication disabled
  next();
}

// ============================================================================
// DISABLED AUTHORIZATION
// ============================================================================

export const ROLES = {
  READ_ONLY: 'read_only',
  OPERATOR: 'operator',
  ADMIN: 'admin',
} as const;

export type RoleType = typeof ROLES[keyof typeof ROLES];

export function getUserRole(req: Request): RoleType {
  return ROLES.ADMIN; // Always admin when auth is disabled
}

export function hasPermission(userRole: RoleType, requiredPermission: string): boolean {
  return true; // All permissions granted
}

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    next(); // Pass through
  };
}

// ============================================================================
// PASS-THROUGH MIDDLEWARE
// ============================================================================

export const requireReadAccess = (req: Request, res: Response, next: NextFunction) => next();
export const requireWriteAccess = (req: Request, res: Response, next: NextFunction) => next();
export const requireOperatorAccess = (req: Request, res: Response, next: NextFunction) => next();
export const requireAdminAccess = (req: Request, res: Response, next: NextFunction) => next();

export function authorizeDeviceAccess(req: Request, res: Response, next: NextFunction): void {
  next(); // Pass through
}

// ============================================================================
// SIMPLIFIED REQUEST LOGGING
// ============================================================================

export function logAuthenticatedRequest(req: Request, res: Response, next: NextFunction): void {
  const userAgent = req.headers['user-agent'] || 'unknown';
  const clientIp = req.ip || (req.connection as any).remoteAddress;

  logger.info(`API Request: ${req.method} ${req.path}`, {
    clientIp,
    userAgent,
    timestamp: new Date().toISOString(),
  });

  const originalSend = res.send;
  res.send = function (data: any) {
    logger.info(`API Response: ${req.method} ${req.path} - ${res.statusCode}`, {
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

export function addSecurityHeaders(req: Request, res: Response, next: NextFunction): void {
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