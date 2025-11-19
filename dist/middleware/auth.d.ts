/**
 * Authentication Middleware
 * Basic authentication and authorization for IO-Link API
 *
 */
import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            apiKey?: string;
            userRole?: string;
            startTime?: number;
        }
    }
}
/**
 * Simple API key authentication middleware
 * In production, this should be replaced with proper JWT or OAuth
 */
export declare function authenticateApiKey(req: Request, res: Response, next: NextFunction): void;
/**
 * Authorization levels for IO-Link operations
 */
export declare const ROLES: {
    readonly READ_ONLY: "read_only";
    readonly OPERATOR: "operator";
    readonly ADMIN: "admin";
};
export type RoleType = typeof ROLES[keyof typeof ROLES];
export declare const ROLE_PERMISSIONS: Record<RoleType, string[]>;
/**
 * Get user role from API key or headers
 * In production, this would typically look up the role in a database
 */
export declare function getUserRole(req: Request): RoleType;
/**
 * Check if user has required permission
 */
export declare function hasPermission(userRole: RoleType, requiredPermission: string): boolean;
/**
 * Authorization middleware factory
 */
export declare function requirePermission(permission: string): (req: Request, res: Response, next: NextFunction) => void;
export declare const requireReadAccess: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireWriteAccess: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireOperatorAccess: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireAdminAccess: (req: Request, res: Response, next: NextFunction) => void;
interface RateLimit {
    windowMs: number;
    max: number;
}
/**
 * Get rate limit based on user role
 */
export declare function getRoleRateLimit(req: Request): RateLimit;
/**
 * Check if user can access specific device/port
 * This can be extended for port-specific access control
 */
export declare function authorizeDeviceAccess(req: Request, res: Response, next: NextFunction): void;
/**
 * Enhanced request logging with authentication context
 */
export declare function logAuthenticatedRequest(req: Request, res: Response, next: NextFunction): void;
/**
 * Add security headers for API responses
 */
export declare function addSecurityHeaders(req: Request, res: Response, next: NextFunction): void;
export {};
//# sourceMappingURL=auth.d.ts.map