/**
 * Device Controller
 * Handles HTTP requests for device management operations
 *
 */

import { Request, Response } from "express";
import DeviceManager from "../services/DeviceManager";
import logger from "../utils/logger";
import { asyncHandler } from "../middleware/errorHandler";

// Singleton DeviceManager instance
export const deviceManager = new DeviceManager();

// ============================================================================
// MASTER MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * GET /api/v1/masters
 * Discover available IO-Link masters
 */
export const discoverMasters = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info("Discovering IO-Link masters");

    const masters = await deviceManager.discoverMasters();

    res.json({
      success: true,
      data: masters,
      count: masters.length,
      message: `Found ${masters.length} IO-Link master(s)`,
    });
  }
);

/**
 * GET /api/v1/masters/connected
 * Get list of connected masters
 */
export const getConnectedMasters = asyncHandler(
  async (req: Request, res: Response) => {
    const masters = deviceManager.getConnectedMasters();

    res.json({
      success: true,
      data: masters,
      count: masters.length,
    });
  }
);

/**
 * POST /api/v1/masters/connect
 * Connect to a specific master
 * Body: { deviceName: "TMG USB IO-Link Master V2" }
 */
export const connectMaster = asyncHandler(
  async (req: Request, res: Response) => {
    const { deviceName } = req.body;

    logger.info(`Connecting to master: ${deviceName}`);

    const handle = await deviceManager.connectMaster(deviceName);

    res.status(201).json({
      success: true,
      data: {
        handle: handle,
        deviceName: deviceName,
        connectedAt: new Date().toISOString(),
      },
      message: `Successfully connected to master: ${deviceName}`,
    });
  }
);

/**
 * DELETE /api/v1/masters/:masterHandle
 * Disconnect from a specific master
 */
export const disconnectMaster = asyncHandler(
  async (req: Request, res: Response) => {
    const { masterHandle } = req.params;
    const handle = parseInt(masterHandle);

    logger.info(`Disconnecting from master handle: ${handle}`);

    await deviceManager.disconnectMaster(handle);

    res.json({
      success: true,
      message: `Successfully disconnected from master handle: ${handle}`,
    });
  }
);

// ============================================================================
// DEVICE DISCOVERY AND LISTING ENDPOINTS
// ============================================================================

/**
 * GET /api/v1/devices
 * Get list of all discovered devices
 * Query params: ?includeDisconnected=true&limit=50&offset=0
 */
export const listDevices = asyncHandler(async (req: Request, res: Response) => {
  logger.info("listDevices called - start");
  const includeDisconnected = req.query.includeDisconnected;
  const limit = req.query.limit;
  const offset = req.query.offset;

  logger.info("About to call deviceManager.getDevices()");
  let devices = deviceManager.getDevices();
  logger.info(`Got ${devices.length} devices`);

  // Filter disconnected devices if requested
  if (!includeDisconnected) {
    devices = devices.filter((device) => device.connected);
  }

  // Apply pagination
  const total = devices.length;
  const limitNum = parseInt(limit as string) || 50;
  const offsetNum = parseInt(offset as string) || 0;
  const paginatedDevices = devices.slice(offsetNum, offsetNum + limitNum);

  res.json({
    success: true,
    data: paginatedDevices,
    pagination: {
      total: total,
      count: paginatedDevices.length,
      limit: limitNum,
      offset: offsetNum,
      hasMore: offsetNum + limitNum < total,
    },
  });
});

/**
 * GET /api/v1/devices/:masterHandle/:deviceId
 * Get specific device information
 */
export const getDevice = asyncHandler(async (req: Request, res: Response) => {
  const { masterHandle, deviceId } = req.params;
  const handle = parseInt(masterHandle);
  const port = parseInt(deviceId);

  const device = deviceManager.getDevice(handle, port);

  res.json({
    success: true,
    data: device.toJSON(),
  });
});

/**
 * GET /api/v1/devices/:masterHandle/:deviceId/status
 * Get device connection status
 */
export const getDeviceStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { masterHandle, deviceId } = req.params;
    const handle = parseInt(masterHandle);
    const port = parseInt(deviceId);

    const status = await deviceManager.getDeviceStatus(handle, port);

    res.json({
      success: true,
      data: status,
    });
  }
);

// ============================================================================
// DEVICE INFORMATION ENDPOINTS
// ============================================================================

/**
 * GET /api/v1/devices/:masterHandle/:deviceId/info
 * Get detailed device information including metadata
 */
export const getDeviceInfo = asyncHandler(
  async (req: Request, res: Response) => {
    const { masterHandle, deviceId } = req.params;
    const handle = parseInt(masterHandle);
    const port = parseInt(deviceId);

    const device = deviceManager.getDevice(handle, port);
    const deviceKey = `${handle}:${port}`;

    // Get device parameters
    let parameters: any[] = [];
    try {
      parameters = deviceManager.getDeviceParameters(deviceKey);
    } catch (error: any) {
      logger.debug(
        `Could not get parameters for device ${deviceKey}: ${error.message}`
      );
    }

    const deviceInfo = device.toJSON();

    res.json({
      success: true,
      data: {
        ...deviceInfo,
        parameters: parameters,
        capabilities: {
          supportsProcessData:
            device.processDataInputLength > 0 ||
            device.processDataOutputLength > 0,
          processDataInputLength: device.processDataInputLength,
          processDataOutputLength: device.processDataOutputLength,
          parameterCount: parameters.length,
        },
      },
    });
  }
);

/**
 * GET /api/v1/devices/summary
 * Get system-wide device summary
 */
export const getDeviceSummary = asyncHandler(
  async (req: Request, res: Response) => {
    const devices = deviceManager.getDevices();
    const connectedCount = deviceManager.getConnectedDeviceCount();
    const totalCount = deviceManager.getDeviceCount();
    const masters = deviceManager.getConnectedMasters();

    // Group devices by vendor
    const devicesByVendor = devices.reduce(
      (acc: Record<string, any[]>, device) => {
        const vendor = device.vendorName || "Unknown";
        if (!acc[vendor]) acc[vendor] = [];
        acc[vendor].push(device);
        return acc;
      },
      {}
    );

    // Group devices by connection state
    const devicesByState = devices.reduce(
      (acc: Record<string, number>, device) => {
        const state = device.connectionState || "UNKNOWN";
        if (!acc[state]) acc[state] = 0;
        acc[state]++;
        return acc;
      },
      {}
    );

    res.json({
      success: true,
      data: {
        summary: {
          totalDevices: totalCount,
          connectedDevices: connectedCount,
          disconnectedDevices: totalCount - connectedCount,
          connectedMasters: masters.length,
        },
        devicesByVendor: Object.keys(devicesByVendor).map((vendor) => ({
          vendor: vendor,
          count: devicesByVendor[vendor].length,
          connectedCount: devicesByVendor[vendor].filter((d) => d.connected)
            .length,
        })),
        devicesByState: devicesByState,
        masters: masters,
      },
    });
  }
);

// ============================================================================
// UTILITY ENDPOINTS
// ============================================================================

/**
 * POST /api/v1/devices/scan
 * Trigger manual device scan on all connected masters
 */
export const scanDevices = asyncHandler(async (req: Request, res: Response) => {
  logger.info("Triggering manual device scan");

  const masters = deviceManager.getConnectedMasters();
  const scanPromises = masters.map((master) =>
    deviceManager.scanDevicesOnMaster(master.handle)
  );

  await Promise.allSettled(scanPromises);

  const devices = deviceManager.getDevices();

  res.json({
    success: true,
    data: devices,
    message: `Scan completed. Found ${devices.length} devices across ${masters.length} masters.`,
  });
});

/**
 * GET /api/v1/devices/health
 * Get system health information
 */
export const getSystemHealth = asyncHandler(
  async (req: Request, res: Response) => {
    const masters = deviceManager.getConnectedMasters();
    const devices = deviceManager.getDevices();
    const connectedDevices = devices.filter((d) => d.connected);

    // Calculate uptime for connected devices
    const now = new Date();
    const deviceUptimes = connectedDevices.map((device) => ({
      deviceId: `${device.vendorName}_${device.deviceName}_Port${device.port}`,
      uptime: device.connectedAt
        ? now.getTime() - new Date(device.connectedAt).getTime()
        : 0,
      lastSeen: device.lastSeen,
    }));

    const health = {
      status: masters.length > 0 ? "healthy" : "warning",
      timestamp: now.toISOString(),
      masters: {
        connected: masters.length,
        details: masters.map((master) => ({
          handle: master.handle,
          deviceName: master.deviceName,
          uptime: now.getTime() - new Date(master.connectedAt).getTime(),
          deviceCount: devices.filter((d) => d.masterHandle === master.handle)
            .length,
        })),
      },
      devices: {
        total: devices.length,
        connected: connectedDevices.length,
        uptimes: deviceUptimes,
      },
    };

    res.json({
      success: true,
      data: health,
    });
  }
);
