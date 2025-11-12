"use strict";
/**
 * Data Routes - TypeScript Port
 * Express routes for process data and parameter operations
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
const dataController = __importStar(require("../controllers/dataController"));
// Import middleware
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// ============================================================================
// PROCESS DATA ROUTES
// ============================================================================
/**
 * GET /api/v1/data/:masterHandle/:deviceId/process
 * Read process data from device
 */
router.get('/:masterHandle/:deviceId/process', auth_1.requireReadAccess, validation_1.validateMasterHandle, validation_1.validateDeviceId, auth_1.authorizeDeviceAccess, dataController.readProcessData);
/**
 * POST /api/v1/data/:masterHandle/:deviceId/process
 * Write process data to device
 * Body: { data: [1, 2, 3] } or { data: "hello" }
 */
router.post('/:masterHandle/:deviceId/process', auth_1.requireOperatorAccess, validation_1.validateMasterHandle, validation_1.validateDeviceId, validation_1.validateProcessDataWrite, validation_1.validateProcessDataLength, auth_1.authorizeDeviceAccess, dataController.writeProcessData);
/**
 * GET /api/v1/data/:masterHandle/:deviceId/process/stream
 * Get continuous process data stream (Server-Sent Events)
 * Query params: ?interval=1000
 */
router.get('/:masterHandle/:deviceId/process/stream', auth_1.requireReadAccess, validation_1.validateMasterHandle, validation_1.validateDeviceId, auth_1.authorizeDeviceAccess, dataController.streamProcessData);
// ============================================================================
// PARAMETER MANAGEMENT ROUTES
// ============================================================================
/**
 * GET /api/v1/data/:masterHandle/:deviceId/parameters
 * Get list of available parameters for device
 */
router.get('/:masterHandle/:deviceId/parameters', auth_1.requireReadAccess, validation_1.validateMasterHandle, validation_1.validateDeviceId, auth_1.authorizeDeviceAccess, dataController.getParameters);
/**
 * GET /api/v1/data/:masterHandle/:deviceId/parameters/standard
 * Read all standard IO-Link parameters
 */
router.get('/:masterHandle/:deviceId/parameters/standard', auth_1.requireReadAccess, validation_1.validateMasterHandle, validation_1.validateDeviceId, auth_1.authorizeDeviceAccess, dataController.readStandardParameters);
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
router.post('/:masterHandle/:deviceId/parameters/batch', auth_1.requireWriteAccess, validation_1.validateMasterHandle, validation_1.validateDeviceId, auth_1.authorizeDeviceAccess, dataController.batchParameterOperations);
// ============================================================================
// SPECIFIC PARAMETER ROUTES
// ============================================================================
/**
 * GET /api/v1/data/:masterHandle/:deviceId/parameters/:index
 * Read specific parameter
 * Query params: ?subIndex=0
 */
router.get('/:masterHandle/:deviceId/parameters/:index', auth_1.requireReadAccess, validation_1.validateMasterHandle, validation_1.validateDeviceId, validation_1.validateParameterIndex, auth_1.authorizeDeviceAccess, dataController.readParameter);
/**
 * POST /api/v1/data/:masterHandle/:deviceId/parameters/:index
 * Write parameter value
 * Body: { value: 123, dataType: "uint16", subIndex: 0 }
 */
router.post('/:masterHandle/:deviceId/parameters/:index', auth_1.requireWriteAccess, validation_1.validateMasterHandle, validation_1.validateDeviceId, validation_1.validateParameterIndex, validation_1.validateParameterWrite, validation_1.validateParameterValue, auth_1.authorizeDeviceAccess, dataController.writeParameter);
// ============================================================================
// DEVICE INFORMATION ROUTES
// ============================================================================
/**
 * GET /api/v1/data/:masterHandle/:deviceId/device-info
 * Get comprehensive device information from parameters
 */
router.get('/:masterHandle/:deviceId/device-info', auth_1.requireReadAccess, validation_1.validateMasterHandle, validation_1.validateDeviceId, auth_1.authorizeDeviceAccess, dataController.getDeviceInformation);
// ============================================================================
// EXPORTS
// ============================================================================
exports.default = router;
//# sourceMappingURL=data.js.map