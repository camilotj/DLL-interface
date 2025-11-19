/**
 * Device Controller
 * Handles HTTP requests for device management operations
 *
 */
import { Request, Response } from "express";
import DeviceManager from "../services/DeviceManager";
export declare const deviceManager: DeviceManager;
/**
 * GET /api/v1/masters
 * Discover available IO-Link masters
 */
export declare const discoverMasters: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * GET /api/v1/masters/connected
 * Get list of connected masters
 */
export declare const getConnectedMasters: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * POST /api/v1/masters/connect
 * Connect to a specific master
 * Body: { deviceName: "TMG USB IO-Link Master V2" }
 */
export declare const connectMaster: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * DELETE /api/v1/masters/:masterHandle
 * Disconnect from a specific master
 */
export declare const disconnectMaster: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * GET /api/v1/devices
 * Get list of all discovered devices
 * Query params: ?includeDisconnected=true&limit=50&offset=0
 */
export declare const listDevices: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * GET /api/v1/devices/:masterHandle/:deviceId
 * Get specific device information
 */
export declare const getDevice: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * GET /api/v1/devices/:masterHandle/:deviceId/status
 * Get device connection status
 */
export declare const getDeviceStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * GET /api/v1/devices/:masterHandle/:deviceId/info
 * Get detailed device information including metadata
 */
export declare const getDeviceInfo: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * GET /api/v1/devices/summary
 * Get system-wide device summary
 */
export declare const getDeviceSummary: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * POST /api/v1/devices/scan
 * Trigger manual device scan on all connected masters
 */
export declare const scanDevices: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * GET /api/v1/devices/health
 * Get system health information
 */
export declare const getSystemHealth: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=deviceController.d.ts.map