/**
 * Authentication Middleware (DISABLED)
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
export declare function authenticateApiKey(req: Request, res: Response, next: NextFunction): void;
export declare const ROLES: {
    readonly READ_ONLY: "read_only";
    readonly OPERATOR: "operator";
    readonly ADMIN: "admin";
};
export type RoleType = typeof ROLES[keyof typeof ROLES];
export declare function getUserRole(req: Request): RoleType;
export declare function hasPermission(userRole: RoleType, requiredPermission: string): boolean;
export declare function requirePermission(permission: string): (req: Request, res: Response, next: NextFunction) => void;
export declare const requireReadAccess: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireWriteAccess: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireOperatorAccess: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireAdminAccess: (req: Request, res: Response, next: NextFunction) => void;
export declare function authorizeDeviceAccess(req: Request, res: Response, next: NextFunction): void;
export declare function logAuthenticatedRequest(req: Request, res: Response, next: NextFunction): void;
export declare function addSecurityHeaders(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map