/**
 * Data Controller
 * Handles HTTP requests for process data and parameter operations
 * 
 */

import { Request, Response } from 'express';
import { deviceManager } from './deviceController';
import logger from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { PARAMETER_INDEX } from '../utils/constants';

// ============================================================================
// PROCESS DATA ENDPOINTS
// ============================================================================

/**
 * GET /api/v1/data/:masterHandle/:deviceId/process
 * Read process data from device
 */
export const readProcessData = asyncHandler(async (req: Request, res: Response) => {
  const { masterHandle, deviceId } = req.params;
  const handle = parseInt(masterHandle);
  const port = parseInt(deviceId);

  logger.debug(`Reading process data from master ${handle} port ${port}`);

  const result = await deviceManager.readProcessData(handle, port);

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
export const writeProcessData = asyncHandler(async (req: Request, res: Response) => {
  const { masterHandle, deviceId } = req.params;
  const { data } = req.body;
  const handle = parseInt(masterHandle);
  const port = parseInt(deviceId);

  logger.debug(`Writing process data to master ${handle} port ${port}`);

  // Convert data to buffer
  let buffer: Buffer;
  if (Array.isArray(data)) {
    buffer = Buffer.from(data);
  } else if (typeof data === 'string') {
    buffer = Buffer.from(data, 'utf8');
  } else if (Buffer.isBuffer(data)) {
    buffer = data;
  } else {
    throw new Error('Invalid data format. Expected array, string, or buffer.');
  }

  const result = await deviceManager.writeProcessData(handle, port, buffer);

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
export const streamProcessData = asyncHandler(async (req: Request, res: Response) => {
  const { masterHandle, deviceId } = req.params;
  const handle = parseInt(masterHandle);
  const port = parseInt(deviceId);
  const interval = parseInt(req.query.interval as string) || 1000;

  logger.info(
    `Starting process data stream for master ${handle} port ${port} (${interval}ms)`
  );

  // Set headers for Server-Sent Events
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  });

  // Send initial connection event
  res.write(
    `data: ${JSON.stringify({ type: 'connected', port, interval })}\n\n`
  );

  const streamInterval = setInterval(async () => {
    try {
      const result = await deviceManager.readProcessData(handle, port);
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
    } catch (error: any) {
      logger.error(
        `Process data stream error for port ${port}:`,
        error.message
      );
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
    logger.info(`Process data stream ended for master ${handle} port ${port}`);
  });
});

// ============================================================================
// PARAMETER ENDPOINTS
// ============================================================================

/**
 * GET /api/v1/data/:masterHandle/:deviceId/parameters
 * Get list of available parameters for device
 */
export const getParameters = asyncHandler(async (req: Request, res: Response) => {
  const { masterHandle, deviceId } = req.params;
  const handle = parseInt(masterHandle);
  const port = parseInt(deviceId);
  const deviceKey = `${handle}:${port}`;

  const parameters = deviceManager.getDeviceParameters(deviceKey);

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
export const readParameter = asyncHandler(async (req: Request, res: Response) => {
  const { masterHandle, deviceId, index } = req.params;
  const subIndex = parseInt(req.query.subIndex as string) || 0;
  const handle = parseInt(masterHandle);
  const port = parseInt(deviceId);
  const paramIndex = parseInt(index);
  const deviceKey = `${handle}:${port}`;

  logger.debug(
    `Reading parameter ${paramIndex}.${subIndex} from device ${deviceKey}`
  );

  const result = await deviceManager.readDeviceParameter(
    deviceKey,
    paramIndex,
    subIndex
  );

  // Try to parse the value based on parameter definition
  let parsedValue: any = result.data;
  try {
    const parameterMap = deviceManager.parameters.get(deviceKey);
    const parameter = parameterMap?.get(`${paramIndex}.${subIndex}`);
    if (parameter) {
      parsedValue = parameter.parseValue(result.data);
    }
  } catch (error: any) {
    logger.debug(`Could not parse parameter value: ${error.message}`);
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
export const writeParameter = asyncHandler(async (req: Request, res: Response) => {
  const { masterHandle, deviceId, index } = req.params;
  const { value, dataType, subIndex = 0 } = req.body;
  const handle = parseInt(masterHandle);
  const port = parseInt(deviceId);
  const paramIndex = parseInt(index);
  const deviceKey = `${handle}:${port}`;

  logger.debug(
    `Writing parameter ${paramIndex}.${subIndex} to device ${deviceKey}:`,
    value
  );

  const result = await deviceManager.writeDeviceParameter(
    deviceKey,
    paramIndex,
    subIndex,
    value
  );

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
export const readStandardParameters = asyncHandler(async (req: Request, res: Response) => {
  const { masterHandle, deviceId } = req.params;
  const handle = parseInt(masterHandle);
  const port = parseInt(deviceId);
  const deviceKey = `${handle}:${port}`;

  // Standard parameters to read
  const standardParams = [
    { index: PARAMETER_INDEX.VENDOR_NAME, name: 'vendorName' },
    { index: PARAMETER_INDEX.PRODUCT_NAME, name: 'productName' },
    { index: PARAMETER_INDEX.SERIAL_NUMBER, name: 'serialNumber' },
    { index: PARAMETER_INDEX.FIRMWARE_REVISION, name: 'firmwareRevision' },
    { index: PARAMETER_INDEX.HARDWARE_REVISION, name: 'hardwareRevision' },
    {
      index: PARAMETER_INDEX.APPLICATION_SPECIFIC_NAME,
      name: 'applicationName',
    },
  ];

  const results: Record<string, any> = {};
  const errors: Record<string, any> = {};

  // Read each parameter
  for (const param of standardParams) {
    try {
      const result = await deviceManager.readDeviceParameter(
        deviceKey,
        param.index
      );
      results[param.name] = {
        index: param.index,
        value: result.data.toString('ascii').replace(/\0/g, '').trim(),
        rawData: Array.from(result.data),
        timestamp: result.timestamp,
      };
    } catch (error: any) {
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
export const getDeviceInformation = asyncHandler(async (req: Request, res: Response) => {
  const { masterHandle, deviceId } = req.params;
  const handle = parseInt(masterHandle);
  const port = parseInt(deviceId);
  const deviceKey = `${handle}:${port}`;

  // Get device model info
  const device = deviceManager.getDevice(handle, port);

  // Read device identification parameters
  const deviceInfo: any = {
    basic: device.getDeviceInfo(),
    identification: {},
    capabilities: {},
    status: device.getConnectionStatus(),
  };

  try {
    // Read identification parameters
    const identificationParams = [
      { index: PARAMETER_INDEX.VENDOR_NAME, key: 'vendorName' },
      { index: PARAMETER_INDEX.PRODUCT_NAME, key: 'productName' },
      { index: PARAMETER_INDEX.PRODUCT_ID, key: 'productId' },
      { index: PARAMETER_INDEX.SERIAL_NUMBER, key: 'serialNumber' },
      { index: PARAMETER_INDEX.FIRMWARE_REVISION, key: 'firmwareVersion' },
      { index: PARAMETER_INDEX.HARDWARE_REVISION, key: 'hardwareVersion' },
      {
        index: PARAMETER_INDEX.APPLICATION_SPECIFIC_NAME,
        key: 'applicationName',
      },
    ];

    for (const param of identificationParams) {
      try {
        const result = await deviceManager.readDeviceParameter(
          deviceKey,
          param.index
        );
        if (param.index === PARAMETER_INDEX.PRODUCT_ID) {
          // Product ID is typically a 32-bit number
          deviceInfo.identification[param.key] = result.data.readUInt32LE(0);
        } else {
          // String parameters
          deviceInfo.identification[param.key] = result.data
            .toString('ascii')
            .replace(/\0/g, '')
            .trim();
        }
      } catch (error: any) {
        logger.debug(`Could not read ${param.key}: ${error.message}`);
      }
    }

    // Read capability parameters
    try {
      const minCycleResult = await deviceManager.readDeviceParameter(
        deviceKey,
        PARAMETER_INDEX.MIN_CYCLE_TIME
      );
      deviceInfo.capabilities.minCycleTime =
        minCycleResult.data.readUInt8(0) * 0.1; // Convert to ms
    } catch (error: any) {
      logger.debug(`Could not read min cycle time: ${error.message}`);
    }
  } catch (error: any) {
    logger.error(
      `Error reading device information for ${deviceKey}:`,
      error.message
    );
  }

  res.json({
    success: true,
    data: deviceInfo,
  });
});

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

interface BatchOperation {
  type: 'read' | 'write';
  index: number;
  subIndex?: number;
  value?: any;
  dataType?: string;
}

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
export const batchParameterOperations = asyncHandler(async (req: Request, res: Response) => {
  const { masterHandle, deviceId } = req.params;
  const { operations } = req.body;
  const handle = parseInt(masterHandle);
  const port = parseInt(deviceId);
  const deviceKey = `${handle}:${port}`;

  if (!Array.isArray(operations) || operations.length === 0) {
    throw new Error('Operations array is required and cannot be empty');
  }

  const results: any[] = [];
  const errors: any[] = [];

  // Process each operation
  for (let i = 0; i < operations.length; i++) {
    const operation: BatchOperation = operations[i];
    const opId = `${operation.type}_${operation.index}_${
      operation.subIndex || 0
    }`;

    try {
      if (operation.type === 'read') {
        const result = await deviceManager.readDeviceParameter(
          deviceKey,
          operation.index,
          operation.subIndex || 0
        );
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
      } else if (operation.type === 'write') {
        if (operation.value === undefined) {
          throw new Error('Value is required for write operations');
        }

        const result = await deviceManager.writeDeviceParameter(
          deviceKey,
          operation.index,
          operation.subIndex || 0,
          operation.value
        );
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
      } else {
        throw new Error(`Unknown operation type: ${operation.type}`);
      }
    } catch (error: any) {
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
