/**
 * Data Controller - TypeScript Port
 * Handles HTTP requests for process data and parameter operations
 *
 * CRITICAL: Maintains exact controller behavior from JavaScript version
 */
import { Request, Response } from 'express';
/**
 * GET /api/v1/data/:masterHandle/:deviceId/process
 * Read process data from device
 */
export declare const readProcessData: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * POST /api/v1/data/:masterHandle/:deviceId/process
 * Write process data to device
 * Body: { data: [1, 2, 3] } or { data: "hello" }
 */
export declare const writeProcessData: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * GET /api/v1/data/:masterHandle/:deviceId/process/stream
 * Get continuous process data stream (Server-Sent Events)
 */
export declare const streamProcessData: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * GET /api/v1/data/:masterHandle/:deviceId/parameters
 * Get list of available parameters for device
 */
export declare const getParameters: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * GET /api/v1/data/:masterHandle/:deviceId/parameters/:index
 * Read specific parameter
 * Query params: ?subIndex=0
 */
export declare const readParameter: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * POST /api/v1/data/:masterHandle/:deviceId/parameters/:index
 * Write parameter value
 * Body: { value: 123, dataType: "uint16", subIndex: 0 }
 */
export declare const writeParameter: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * GET /api/v1/data/:masterHandle/:deviceId/parameters/standard
 * Read all standard IO-Link parameters
 */
export declare const readStandardParameters: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * GET /api/v1/data/:masterHandle/:deviceId/device-info
 * Get comprehensive device information from parameters
 */
export declare const getDeviceInformation: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * POST /api/v1/data/:masterHandle/:deviceId/parameters/batch
 * Read or write multiple parameters in one request
 * Body: {
 *   operations: [
 *     { type: "read", index: 15, subIndex: 0 },
 *     { type: "write", index: 18, subIndex: 0, value: "New Name", dataType: "string" }
 *   ]
 * }
 */
export declare const batchParameterOperations: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=dataController.d.ts.map