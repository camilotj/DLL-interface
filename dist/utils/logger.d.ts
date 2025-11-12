/**
 * Logger Utility - TypeScript Port
 * Centralized logging for the IO-Link backend
 *
 * CRITICAL: Maintains exact logging behavior from JavaScript version
 */
declare class Logger {
    private logLevel;
    private levels;
    constructor();
    private _shouldLog;
    private _formatMessage;
    private _log;
    error(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
    apiRequest(method: string, path: string, statusCode?: number | null, duration?: number | null): void;
    apiError(method: string, path: string, error: Error, statusCode?: number): void;
    deviceOperation(operation: string, deviceId: string | number, port: number, result?: string, details?: string | null): void;
    deviceError(operation: string, deviceId: string | number, port: number, error: Error): void;
    masterOperation(operation: string, masterName: string, result?: string, details?: string | null): void;
    streamEvent(deviceId: string | number, port: number, event: string, data?: any): void;
    child(context: string): ChildLogger;
    setLevel(level: string): void;
}
declare class ChildLogger {
    private parent;
    private context;
    constructor(parent: Logger, context: string);
    private _formatWithContext;
    error(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
}
declare const logger: Logger;
export default logger;
//# sourceMappingURL=logger.d.ts.map