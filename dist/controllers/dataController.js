"use strict";
/**
 * Data Controller
 * Handles HTTP requests for process data and parameter operations
 *
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchParameterOperations = exports.getDeviceInformation = exports.readStandardParameters = exports.writeParameter = exports.readParameter = exports.getParameters = exports.streamProcessData = exports.writeProcessData = exports.readProcessData = void 0;
const deviceController_1 = require("./deviceController");
const logger_1 = __importDefault(require("../utils/logger"));
const errorHandler_1 = require("../middleware/errorHandler");
const constants_1 = require("../utils/constants");
// ============================================================================
// PROCESS DATA ENDPOINTS
// ============================================================================
/**
 * GET /api/v1/data/:masterHandle/:deviceId/process
 * Read process data from device
 */
exports.readProcessData = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { masterHandle, deviceId } = req.params;
    const handle = parseInt(masterHandle);
    const port = parseInt(deviceId);
    logger_1.default.debug(`Reading process data from master ${handle} port ${port}`);
    const result = await deviceController_1.deviceManager.readProcessData(handle, port);
    // Convert buffer to array for JSON response
    const dataArray = Array.from(result.data);
    res.json({
        success: true,
        data: {
            port: result.port,
            data: dataArray,
            dataHex: result.data.toString('hex').toUpperCase(),
            length: result.data.length,
            status: result.status,
            timestamp: result.timestamp,
        },
    });
});
/**
 * POST /api/v1/data/:masterHandle/:deviceId/process
 * Write process data to device
 * Body: { data: [1, 2, 3] } or { data: "hello" }
 */
exports.writeProcessData = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { masterHandle, deviceId } = req.params;
    const { data } = req.body;
    const handle = parseInt(masterHandle);
    const port = parseInt(deviceId);
    logger_1.default.debug(`Writing process data to master ${handle} port ${port}`);
    // Convert data to buffer
    let buffer;
    if (Array.isArray(data)) {
        buffer = Buffer.from(data);
    }
    else if (typeof data === 'string') {
        buffer = Buffer.from(data, 'utf8');
    }
    else if (Buffer.isBuffer(data)) {
        buffer = data;
    }
    else {
        throw new Error('Invalid data format. Expected array, string, or buffer.');
    }
    const result = await deviceController_1.deviceManager.writeProcessData(handle, port, buffer);
    res.json({
        success: true,
        data: {
            port: result.port,
            bytesWritten: result.bytesWritten,
            timestamp: result.timestamp,
        },
        message: `Successfully wrote ${result.bytesWritten} bytes to port ${port}`,
    });
});
/**
 * GET /api/v1/data/:masterHandle/:deviceId/process/stream
 * Get continuous process data stream (Server-Sent Events)
 */
exports.streamProcessData = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { masterHandle, deviceId } = req.params;
    const handle = parseInt(masterHandle);
    const port = parseInt(deviceId);
    const interval = parseInt(req.query.interval) || 1000;
    logger_1.default.info(`Starting process data stream for master ${handle} port ${port} (${interval}ms)`);
    // Set headers for Server-Sent Events
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
    });
    // Send initial connection event
    res.write(`data: ${JSON.stringify({ type: 'connected', port, interval })}\n\n`);
    const streamInterval = setInterval(async () => {
        try {
            const result = await deviceController_1.deviceManager.readProcessData(handle, port);
            const dataArray = Array.from(result.data);
            const eventData = {
                type: 'data',
                port: result.port,
                data: dataArray,
                dataHex: result.data.toString('hex').toUpperCase(),
                length: result.data.length,
                status: result.status,
                timestamp: result.timestamp,
            };
            res.write(`data: ${JSON.stringify(eventData)}\n\n`);
        }
        catch (error) {
            logger_1.default.error(`Process data stream error for port ${port}:`, error.message);
            const errorData = {
                type: 'error',
                port: port,
                error: error.message,
                timestamp: new Date().toISOString(),
            };
            res.write(`data: ${JSON.stringify(errorData)}\n\n`);
        }
    }, interval);
    // Clean up on client disconnect
    req.on('close', () => {
        clearInterval(streamInterval);
        logger_1.default.info(`Process data stream ended for master ${handle} port ${port}`);
    });
});
// ============================================================================
// PARAMETER ENDPOINTS
// ============================================================================
/**
 * GET /api/v1/data/:masterHandle/:deviceId/parameters
 * Get list of available parameters for device
 */
exports.getParameters = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { masterHandle, deviceId } = req.params;
    const handle = parseInt(masterHandle);
    const port = parseInt(deviceId);
    const deviceKey = `${handle}:${port}`;
    const parameters = deviceController_1.deviceManager.getDeviceParameters(deviceKey);
    res.json({
        success: true,
        data: parameters,
        count: parameters.length,
    });
});
/**
 * GET /api/v1/data/:masterHandle/:deviceId/parameters/:index
 * Read specific parameter
 * Query params: ?subIndex=0
 */
exports.readParameter = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { masterHandle, deviceId, index } = req.params;
    const subIndex = parseInt(req.query.subIndex) || 0;
    const handle = parseInt(masterHandle);
    const port = parseInt(deviceId);
    const paramIndex = parseInt(index);
    const deviceKey = `${handle}:${port}`;
    logger_1.default.debug(`Reading parameter ${paramIndex}.${subIndex} from device ${deviceKey}`);
    const result = await deviceController_1.deviceManager.readDeviceParameter(deviceKey, paramIndex, subIndex);
    // Try to parse the value based on parameter definition
    let parsedValue = result.data;
    try {
        const parameterMap = deviceController_1.deviceManager.parameters.get(deviceKey);
        const parameter = parameterMap?.get(`${paramIndex}.${subIndex}`);
        if (parameter) {
            parsedValue = parameter.parseValue(result.data);
        }
    }
    catch (error) {
        logger_1.default.debug(`Could not parse parameter value: ${error.message}`);
    }
    res.json({
        success: true,
        data: {
            index: result.index,
            subIndex: result.subIndex,
            length: result.length,
            rawData: Array.from(result.data),
            rawDataHex: result.data.toString('hex').toUpperCase(),
            parsedValue: parsedValue,
            errorCode: result.errorCode,
            additionalCode: result.additionalCode,
            port: result.port,
            timestamp: result.timestamp,
        },
    });
});
/**
 * POST /api/v1/data/:masterHandle/:deviceId/parameters/:index
 * Write parameter value
 * Body: { value: 123, dataType: "uint16", subIndex: 0 }
 */
exports.writeParameter = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { masterHandle, deviceId, index } = req.params;
    const { value, dataType, subIndex = 0 } = req.body;
    const handle = parseInt(masterHandle);
    const port = parseInt(deviceId);
    const paramIndex = parseInt(index);
    const deviceKey = `${handle}:${port}`;
    logger_1.default.debug(`Writing parameter ${paramIndex}.${subIndex} to device ${deviceKey}:`, value);
    const result = await deviceController_1.deviceManager.writeDeviceParameter(deviceKey, paramIndex, subIndex, value);
    res.json({
        success: true,
        data: {
            index: result.index,
            subIndex: result.subIndex,
            length: result.length,
            errorCode: result.errorCode,
            additionalCode: result.additionalCode,
            port: result.port,
            timestamp: result.timestamp,
        },
        message: `Successfully wrote parameter ${paramIndex}.${subIndex}`,
    });
});
// ============================================================================
// CONVENIENCE PARAMETER ENDPOINTS
// ============================================================================
/**
 * GET /api/v1/data/:masterHandle/:deviceId/parameters/standard
 * Read all standard IO-Link parameters
 */
exports.readStandardParameters = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { masterHandle, deviceId } = req.params;
    const handle = parseInt(masterHandle);
    const port = parseInt(deviceId);
    const deviceKey = `${handle}:${port}`;
    // Standard parameters to read
    const standardParams = [
        { index: constants_1.PARAMETER_INDEX.VENDOR_NAME, name: 'vendorName' },
        { index: constants_1.PARAMETER_INDEX.PRODUCT_NAME, name: 'productName' },
        { index: constants_1.PARAMETER_INDEX.SERIAL_NUMBER, name: 'serialNumber' },
        { index: constants_1.PARAMETER_INDEX.FIRMWARE_REVISION, name: 'firmwareRevision' },
        { index: constants_1.PARAMETER_INDEX.HARDWARE_REVISION, name: 'hardwareRevision' },
        {
            index: constants_1.PARAMETER_INDEX.APPLICATION_SPECIFIC_NAME,
            name: 'applicationName',
        },
    ];
    const results = {};
    const errors = {};
    // Read each parameter
    for (const param of standardParams) {
        try {
            const result = await deviceController_1.deviceManager.readDeviceParameter(deviceKey, param.index);
            results[param.name] = {
                index: param.index,
                value: result.data.toString('ascii').replace(/\0/g, '').trim(),
                rawData: Array.from(result.data),
                timestamp: result.timestamp,
            };
        }
        catch (error) {
            errors[param.name] = {
                index: param.index,
                error: error.message,
            };
        }
    }
    res.json({
        success: true,
        data: results,
        errors: Object.keys(errors).length > 0 ? errors : undefined,
        count: Object.keys(results).length,
    });
});
/**
 * GET /api/v1/data/:masterHandle/:deviceId/device-info
 * Get comprehensive device information from parameters
 */
exports.getDeviceInformation = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { masterHandle, deviceId } = req.params;
    const handle = parseInt(masterHandle);
    const port = parseInt(deviceId);
    const deviceKey = `${handle}:${port}`;
    // Get device model info
    const device = deviceController_1.deviceManager.getDevice(handle, port);
    // Read device identification parameters
    const deviceInfo = {
        basic: device.getDeviceInfo(),
        identification: {},
        capabilities: {},
        status: device.getConnectionStatus(),
    };
    try {
        // Read identification parameters
        const identificationParams = [
            { index: constants_1.PARAMETER_INDEX.VENDOR_NAME, key: 'vendorName' },
            { index: constants_1.PARAMETER_INDEX.PRODUCT_NAME, key: 'productName' },
            { index: constants_1.PARAMETER_INDEX.PRODUCT_ID, key: 'productId' },
            { index: constants_1.PARAMETER_INDEX.SERIAL_NUMBER, key: 'serialNumber' },
            { index: constants_1.PARAMETER_INDEX.FIRMWARE_REVISION, key: 'firmwareVersion' },
            { index: constants_1.PARAMETER_INDEX.HARDWARE_REVISION, key: 'hardwareVersion' },
            {
                index: constants_1.PARAMETER_INDEX.APPLICATION_SPECIFIC_NAME,
                key: 'applicationName',
            },
        ];
        for (const param of identificationParams) {
            try {
                const result = await deviceController_1.deviceManager.readDeviceParameter(deviceKey, param.index);
                if (param.index === constants_1.PARAMETER_INDEX.PRODUCT_ID) {
                    // Product ID is typically a 32-bit number
                    deviceInfo.identification[param.key] = result.data.readUInt32LE(0);
                }
                else {
                    // String parameters
                    deviceInfo.identification[param.key] = result.data
                        .toString('ascii')
                        .replace(/\0/g, '')
                        .trim();
                }
            }
            catch (error) {
                logger_1.default.debug(`Could not read ${param.key}: ${error.message}`);
            }
        }
        // Read capability parameters
        try {
            const minCycleResult = await deviceController_1.deviceManager.readDeviceParameter(deviceKey, constants_1.PARAMETER_INDEX.MIN_CYCLE_TIME);
            deviceInfo.capabilities.minCycleTime =
                minCycleResult.data.readUInt8(0) * 0.1; // Convert to ms
        }
        catch (error) {
            logger_1.default.debug(`Could not read min cycle time: ${error.message}`);
        }
    }
    catch (error) {
        logger_1.default.error(`Error reading device information for ${deviceKey}:`, error.message);
    }
    res.json({
        success: true,
        data: deviceInfo,
    });
});
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
exports.batchParameterOperations = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { masterHandle, deviceId } = req.params;
    const { operations } = req.body;
    const handle = parseInt(masterHandle);
    const port = parseInt(deviceId);
    const deviceKey = `${handle}:${port}`;
    if (!Array.isArray(operations) || operations.length === 0) {
        throw new Error('Operations array is required and cannot be empty');
    }
    const results = [];
    const errors = [];
    // Process each operation
    for (let i = 0; i < operations.length; i++) {
        const operation = operations[i];
        const opId = `${operation.type}_${operation.index}_${operation.subIndex || 0}`;
        try {
            if (operation.type === 'read') {
                const result = await deviceController_1.deviceManager.readDeviceParameter(deviceKey, operation.index, operation.subIndex || 0);
                results.push({
                    operationId: opId,
                    type: 'read',
                    index: operation.index,
                    subIndex: operation.subIndex || 0,
                    success: true,
                    data: {
                        rawData: Array.from(result.data),
                        rawDataHex: result.data.toString('hex').toUpperCase(),
                        length: result.length,
                        timestamp: result.timestamp,
                    },
                });
            }
            else if (operation.type === 'write') {
                if (operation.value === undefined) {
                    throw new Error('Value is required for write operations');
                }
                const result = await deviceController_1.deviceManager.writeDeviceParameter(deviceKey, operation.index, operation.subIndex || 0, operation.value);
                results.push({
                    operationId: opId,
                    type: 'write',
                    index: operation.index,
                    subIndex: operation.subIndex || 0,
                    success: true,
                    data: {
                        timestamp: result.timestamp,
                    },
                });
            }
            else {
                throw new Error(`Unknown operation type: ${operation.type}`);
            }
        }
        catch (error) {
            errors.push({
                operationId: opId,
                type: operation.type,
                index: operation.index,
                subIndex: operation.subIndex || 0,
                error: error.message,
            });
        }
    }
    res.json({
        success: errors.length === 0,
        data: {
            results: results,
            errors: errors,
            summary: {
                total: operations.length,
                successful: results.length,
                failed: errors.length,
            },
        },
    });
});
//# sourceMappingURL=dataController.js.map