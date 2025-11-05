/**
 * Device Controller
 * Handles HTTP requests for device management operations
 */

const DeviceManager = require("../services/DeviceManager");
const logger = require("../utils/logger");
const { asyncHandler } = require("../middleware/errorHandler");

// Singleton DeviceManager instance
const deviceManager = new DeviceManager();

// ============================================================================
// MASTER MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * GET /api/v1/masters
 * Discover available IO-Link masters
 */
const discoverMasters = asyncHandler(async (req, res) => {
  logger.info("Discovering IO-Link masters");

  const masters = await deviceManager.discoverMasters();

  res.json({
    success: true,
    data: masters,
    count: masters.length,
    message: `Found ${masters.length} IO-Link master(s)`,
  });
});

/**
 * GET /api/v1/masters/connected
 * Get list of connected masters
 */
const getConnectedMasters = asyncHandler(async (req, res) => {
  const masters = deviceManager.getConnectedMasters();

  res.json({
    success: true,
    data: masters,
    count: masters.length,
  });
});

/**
 * POST /api/v1/masters/connect
 * Connect to a specific master
 * Body: { deviceName: "TMG USB IO-Link Master V2" }
 */
const connectMaster = asyncHandler(async (req, res) => {
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
});

/**
 * DELETE /api/v1/masters/:masterHandle
 * Disconnect from a specific master
 */
const disconnectMaster = asyncHandler(async (req, res) => {
  const { masterHandle } = req.params;
  const handle = parseInt(masterHandle);

  logger.info(`Disconnecting from master handle: ${handle}`);

  await deviceManager.disconnectMaster(handle);

  res.json({
    success: true,
    message: `Successfully disconnected from master handle: ${handle}`,
  });
});

// ============================================================================
// DEVICE DISCOVERY AND LISTING ENDPOINTS
// ============================================================================

/**
 * GET /api/v1/devices
 * Get list of all discovered devices
 * Query params: ?includeDisconnected=true&limit=50&offset=0
 */
const listDevices = asyncHandler(async (req, res) => {
  const { includeDisconnected, limit, offset } = req.query;

  let devices = deviceManager.getDevices();

  // Filter disconnected devices if requested
  if (!includeDisconnected) {
    devices = devices.filter((device) => device.connected);
  }

  // Apply pagination
  const total = devices.length;
  const paginatedDevices = devices.slice(offset, offset + limit);

  res.json({
    success: true,
    data: paginatedDevices,
    pagination: {
      total: total,
      count: paginatedDevices.length,
      limit: limit,
      offset: offset,
      hasMore: offset + limit < total,
    },
  });
});

/**
 * GET /api/v1/devices/:masterHandle/:deviceId
 * Get specific device information
 */
const getDevice = asyncHandler(async (req, res) => {
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
const getDeviceStatus = asyncHandler(async (req, res) => {
  const { masterHandle, deviceId } = req.params;
  const handle = parseInt(masterHandle);
  const port = parseInt(deviceId);

  const status = await deviceManager.getDeviceStatus(handle, port);

  res.json({
    success: true,
    data: status,
  });
});

// ============================================================================
// DEVICE INFORMATION ENDPOINTS
// ============================================================================

/**
 * GET /api/v1/devices/:masterHandle/:deviceId/info
 * Get detailed device information including metadata
 */
const getDeviceInfo = asyncHandler(async (req, res) => {
  const { masterHandle, deviceId } = req.params;
  const handle = parseInt(masterHandle);
  const port = parseInt(deviceId);

  const device = deviceManager.getDevice(handle, port);
  const deviceKey = `${handle}:${port}`;

  // Get device parameters
  let parameters = [];
  try {
    parameters = deviceManager.getDeviceParameters(deviceKey);
  } catch (error) {
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
});

/**
 * GET /api/v1/devices/summary
 * Get system-wide device summary
 */
const getDeviceSummary = asyncHandler(async (req, res) => {
  const devices = deviceManager.getDevices();
  const connectedCount = deviceManager.getConnectedDeviceCount();
  const totalCount = deviceManager.getDeviceCount();
  const masters = deviceManager.getConnectedMasters();

  // Group devices by vendor
  const devicesByVendor = devices.reduce((acc, device) => {
    const vendor = device.vendorName || "Unknown";
    if (!acc[vendor]) acc[vendor] = [];
    acc[vendor].push(device);
    return acc;
  }, {});

  // Group devices by connection state
  const devicesByState = devices.reduce((acc, device) => {
    const state = device.connectionState || "UNKNOWN";
    if (!acc[state]) acc[state] = 0;
    acc[state]++;
    return acc;
  }, {});

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
});

// ============================================================================
// UTILITY ENDPOINTS
// ============================================================================

/**
 * POST /api/v1/devices/scan
 * Trigger manual device scan on all connected masters
 */
const scanDevices = asyncHandler(async (req, res) => {
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
const getSystemHealth = asyncHandler(async (req, res) => {
  const masters = deviceManager.getConnectedMasters();
  const devices = deviceManager.getDevices();
  const connectedDevices = devices.filter((d) => d.connected);

  // Calculate uptime for connected devices
  const now = new Date();
  const deviceUptimes = connectedDevices.map((device) => ({
    deviceId: `${device.vendorName}_${device.deviceName}_Port${device.port}`,
    uptime: device.connectedAt ? now - new Date(device.connectedAt) : 0,
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
        uptime: now - new Date(master.connectedAt),
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
});

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Master management
  discoverMasters,
  getConnectedMasters,
  connectMaster,
  disconnectMaster,

  // Device listing and info
  listDevices,
  getDevice,
  getDeviceStatus,
  getDeviceInfo,
  getDeviceSummary,

  // Utility
  scanDevices,
  getSystemHealth,

  // DeviceManager instance for other controllers
  deviceManager,
};
