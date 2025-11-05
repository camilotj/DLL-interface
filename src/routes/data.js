/**
 * Data Routes
 * Express routes for process data and parameter operations
 */

const express = require("express");
const router = express.Router();

// Import controllers
const dataController = require("../controllers/dataController");

// Import middleware
const {
  validateMasterHandle,
  validateDeviceId,
  validateParameterIndex,
  validateParameterWrite,
  validateProcessDataWrite,
  validateParameterValue,
  validateProcessDataLength,
} = require("../middleware/validation");
const {
  requireReadAccess,
  requireWriteAccess,
  requireOperatorAccess,
  authorizeDeviceAccess,
} = require("../middleware/auth");

// ============================================================================
// PROCESS DATA ROUTES
// ============================================================================

/**
 * GET /api/v1/data/:masterHandle/:deviceId/process
 * Read process data from device
 */
router.get(
  "/:masterHandle/:deviceId/process",
  requireReadAccess,
  validateMasterHandle,
  validateDeviceId,
  authorizeDeviceAccess,
  dataController.readProcessData
);

/**
 * POST /api/v1/data/:masterHandle/:deviceId/process
 * Write process data to device
 * Body: { data: [1, 2, 3] } or { data: "hello" }
 */
router.post(
  "/:masterHandle/:deviceId/process",
  requireOperatorAccess,
  validateMasterHandle,
  validateDeviceId,
  validateProcessDataWrite,
  validateProcessDataLength,
  authorizeDeviceAccess,
  dataController.writeProcessData
);

/**
 * GET /api/v1/data/:masterHandle/:deviceId/process/stream
 * Get continuous process data stream (Server-Sent Events)
 * Query params: ?interval=1000
 */
router.get(
  "/:masterHandle/:deviceId/process/stream",
  requireReadAccess,
  validateMasterHandle,
  validateDeviceId,
  authorizeDeviceAccess,
  dataController.streamProcessData
);

// ============================================================================
// PARAMETER MANAGEMENT ROUTES
// ============================================================================

/**
 * GET /api/v1/data/:masterHandle/:deviceId/parameters
 * Get list of available parameters for device
 */
router.get(
  "/:masterHandle/:deviceId/parameters",
  requireReadAccess,
  validateMasterHandle,
  validateDeviceId,
  authorizeDeviceAccess,
  dataController.getParameters
);

/**
 * GET /api/v1/data/:masterHandle/:deviceId/parameters/standard
 * Read all standard IO-Link parameters
 */
router.get(
  "/:masterHandle/:deviceId/parameters/standard",
  requireReadAccess,
  validateMasterHandle,
  validateDeviceId,
  authorizeDeviceAccess,
  dataController.readStandardParameters
);

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
router.post(
  "/:masterHandle/:deviceId/parameters/batch",
  requireWriteAccess,
  validateMasterHandle,
  validateDeviceId,
  authorizeDeviceAccess,
  dataController.batchParameterOperations
);

// ============================================================================
// SPECIFIC PARAMETER ROUTES
// ============================================================================

/**
 * GET /api/v1/data/:masterHandle/:deviceId/parameters/:index
 * Read specific parameter
 * Query params: ?subIndex=0
 */
router.get(
  "/:masterHandle/:deviceId/parameters/:index",
  requireReadAccess,
  validateMasterHandle,
  validateDeviceId,
  validateParameterIndex,
  authorizeDeviceAccess,
  dataController.readParameter
);

/**
 * POST /api/v1/data/:masterHandle/:deviceId/parameters/:index
 * Write parameter value
 * Body: { value: 123, dataType: "uint16", subIndex: 0 }
 */
router.post(
  "/:masterHandle/:deviceId/parameters/:index",
  requireWriteAccess,
  validateMasterHandle,
  validateDeviceId,
  validateParameterIndex,
  validateParameterWrite,
  validateParameterValue,
  authorizeDeviceAccess,
  dataController.writeParameter
);

// ============================================================================
// DEVICE INFORMATION ROUTES
// ============================================================================

/**
 * GET /api/v1/data/:masterHandle/:deviceId/device-info
 * Get comprehensive device information from parameters
 */
router.get(
  "/:masterHandle/:deviceId/device-info",
  requireReadAccess,
  validateMasterHandle,
  validateDeviceId,
  authorizeDeviceAccess,
  dataController.getDeviceInformation
);

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = router;
