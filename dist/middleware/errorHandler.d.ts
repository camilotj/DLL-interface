/**
 * Error Handler Middleware - TypeScript Port
 * Centralized error handling for Express application
 *
 * CRITICAL: Maintains exact error handling behavior from JavaScript version
 */
import { Request, Response, NextFunction } from 'express';
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
export declare const asyncHandler: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Main error handling middleware
 */
export declare const errorHandler: (err: CustomError, req: Request, res: Response, next: NextFunction) => void;
/**
 * Map TMG DLL error codes to appropriate HTTP status codes
 */
export declare function mapDllErrorToHttpStatus(dllCode: number): number;
/**
 * Create custom API error
 */
export declare function createApiError(message: string, apiErrorCode: string, statusCode?: number): CustomError;
/**
 * 404 handler for unknown routes
 */
export declare const notFoundHandler: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Request timeout handler
 */
export declare const timeoutHandler: (timeoutMs?: number) => (req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=errorHandler.d.ts.map