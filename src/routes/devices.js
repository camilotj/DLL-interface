/**
 * Device Routes
 * Express routes for device and master management operations
 */

const express = require("express");
const router = express.Router();

// Import controllers
const deviceController = require("../controllers/deviceController");

// Import middleware
const {
  validateMasterConnection,
  validateMasterHandle,
  validateDeviceId,
  validateQueryParams,
} = require("../middleware/validation");
const {
  requireReadAccess,
  requireAdminAccess,
  authorizeDeviceAccess,
} = require("../middleware/auth");

// ============================================================================
// MASTER MANAGEMENT ROUTES
// ============================================================================

/**
 * GET /api/v1/masters
 * Discover available IO-Link masters
 */
router.get("/masters", requireReadAccess, deviceController.discoverMasters);

/**
 * GET /api/v1/masters/connected
 * Get list of connected masters
 */
router.get(
  "/masters/connected",
  requireReadAccess,
  deviceController.getConnectedMasters
);

/**
 * POST /api/v1/masters/connect
 * Connect to a specific master
 * Body: { deviceName: "TMG USB IO-Link Master V2" }
 */
router.post(
  "/masters/connect",
  requireAdminAccess,
  validateMasterConnection,
  deviceController.connectMaster
);

/**
 * DELETE /api/v1/masters/:masterHandle
 * Disconnect from a specific master
 */
router.delete(
  "/masters/:masterHandle",
  requireAdminAccess,
  validateMasterHandle,
  deviceController.disconnectMaster
);

// ============================================================================
// DEVICE DISCOVERY AND LISTING ROUTES
// ============================================================================

/**
 * GET /api/v1/devices
 * Get list of all discovered devices
 * Query params: ?includeDisconnected=true&limit=50&offset=0
 */
router.get(
  "/devices",
  requireReadAccess,
  validateQueryParams,
  deviceController.listDevices
);

/**
 * GET /api/v1/devices/summary
 * Get system-wide device summary
 */
router.get(
  "/devices/summary",
  requireReadAccess,
  deviceController.getDeviceSummary
);

/**
 * GET /api/v1/devices/health
 * Get system health information
 */
router.get(
  "/devices/health",
  requireReadAccess,
  deviceController.getSystemHealth
);

/**
 * POST /api/v1/devices/scan
 * Trigger manual device scan on all connected masters
 */
router.post("/devices/scan", requireReadAccess, deviceController.scanDevices);

// ============================================================================
// SPECIFIC DEVICE ROUTES
// ============================================================================

/**
 * GET /api/v1/devices/:masterHandle/:deviceId
 * Get specific device information
 */
router.get(
  "/devices/:masterHandle/:deviceId",
  requireReadAccess,
  validateMasterHandle,
  validateDeviceId,
  authorizeDeviceAccess,
  deviceController.getDevice
);

/**
 * GET /api/v1/devices/:masterHandle/:deviceId/status
 * Get device connection status
 */
router.get(
  "/devices/:masterHandle/:deviceId/status",
  requireReadAccess,
  validateMasterHandle,
  validateDeviceId,
  authorizeDeviceAccess,
  deviceController.getDeviceStatus
);

/**
 * GET /api/v1/devices/:masterHandle/:deviceId/info
 * Get detailed device information including metadata
 */
router.get(
  "/devices/:masterHandle/:deviceId/info",
  requireReadAccess,
  validateMasterHandle,
  validateDeviceId,
  authorizeDeviceAccess,
  deviceController.getDeviceInfo
);

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = router;
