"use strict";
/**
 * Device Routes - TypeScript Port
 * Express routes for device and master management operations
 *
 * CRITICAL: Maintains exact routing behavior from JavaScript version
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// Import controllers
const deviceController = __importStar(require("../controllers/deviceController"));
// Import middleware
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// ============================================================================
// MASTER MANAGEMENT ROUTES
// ============================================================================
/**
 * GET /api/v1/masters
 * Discover available IO-Link masters
 */
router.get('/masters', auth_1.requireReadAccess, deviceController.discoverMasters);
/**
 * GET /api/v1/masters/connected
 * Get list of connected masters
 */
router.get('/masters/connected', auth_1.requireReadAccess, deviceController.getConnectedMasters);
/**
 * POST /api/v1/masters/connect
 * Connect to a specific master
 * Body: { deviceName: "TMG USB IO-Link Master V2" }
 */
router.post('/masters/connect', auth_1.requireAdminAccess, validation_1.validateMasterConnection, deviceController.connectMaster);
/**
 * DELETE /api/v1/masters/:masterHandle
 * Disconnect from a specific master
 */
router.delete('/masters/:masterHandle', auth_1.requireAdminAccess, validation_1.validateMasterHandle, deviceController.disconnectMaster);
// ============================================================================
// DEVICE DISCOVERY AND LISTING ROUTES
// ============================================================================
/**
 * GET /api/v1/devices
 * Get list of all discovered devices
 * Query params: ?includeDisconnected=true&limit=50&offset=0
 */
router.get('/devices', auth_1.requireReadAccess, validation_1.validateQueryParams, deviceController.listDevices);
/**
 * GET /api/v1/devices/summary
 * Get system-wide device summary
 */
router.get('/devices/summary', auth_1.requireReadAccess, deviceController.getDeviceSummary);
/**
 * GET /api/v1/devices/health
 * Get system health information
 */
router.get('/devices/health', auth_1.requireReadAccess, deviceController.getSystemHealth);
/**
 * POST /api/v1/devices/scan
 * Trigger manual device scan on all connected masters
 */
router.post('/devices/scan', auth_1.requireReadAccess, deviceController.scanDevices);
// ============================================================================
// SPECIFIC DEVICE ROUTES
// ============================================================================
/**
 * GET /api/v1/devices/:masterHandle/:deviceId
 * Get specific device information
 */
router.get('/devices/:masterHandle/:deviceId', auth_1.requireReadAccess, validation_1.validateMasterHandle, validation_1.validateDeviceId, auth_1.authorizeDeviceAccess, deviceController.getDevice);
/**
 * GET /api/v1/devices/:masterHandle/:deviceId/status
 * Get device connection status
 */
router.get('/devices/:masterHandle/:deviceId/status', auth_1.requireReadAccess, validation_1.validateMasterHandle, validation_1.validateDeviceId, auth_1.authorizeDeviceAccess, deviceController.getDeviceStatus);
/**
 * GET /api/v1/devices/:masterHandle/:deviceId/info
 * Get detailed device information including metadata
 */
router.get('/devices/:masterHandle/:deviceId/info', auth_1.requireReadAccess, validation_1.validateMasterHandle, validation_1.validateDeviceId, auth_1.authorizeDeviceAccess, deviceController.getDeviceInfo);
// ============================================================================
// EXPORTS
// ============================================================================
exports.default = router;
//# sourceMappingURL=devices.js.map