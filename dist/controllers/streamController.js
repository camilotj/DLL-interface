"use strict";
/**
 * Stream Controller
 * Handles real-time streaming operations via WebSocket
 *
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamIntervals = exports.deviceStreams = exports.activeStreams = void 0;
exports.handleConnection = handleConnection;
const deviceController_1 = require("./deviceController");
const logger_1 = __importDefault(require("../utils/logger"));
const constants_1 = require("../utils/constants");
// Active streams tracking
exports.activeStreams = new Map();
exports.deviceStreams = new Map();
exports.streamIntervals = new Map();
// ============================================================================
// WEBSOCKET EVENT HANDLERS
// ============================================================================
/**
 * Handle new WebSocket connection
 */
function handleConnection(socket, io) {
    logger_1.default.info(`WebSocket client connected: ${socket.id}`);
    // Send welcome message
    socket.emit('connected', {
        socketId: socket.id,
        timestamp: new Date().toISOString(),
        message: 'Connected to IO-Link streaming service',
    });
    // Handle device data subscription
    socket.on('subscribe:device', (data) => {
        handleDeviceSubscription(socket, io, data);
    });
    // Handle parameter subscription
    socket.on('subscribe:parameter', (data) => {
        handleParameterSubscription(socket, io, data);
    });
    // Handle process data subscription
    socket.on('subscribe:process-data', (data) => {
        handleProcessDataSubscription(socket, io, data);
    });
    // Handle unsubscription
    socket.on('unsubscribe', (data) => {
        handleUnsubscription(socket, data);
    });
    // Handle unsubscribe all
    socket.on('unsubscribe:all', () => {
        handleUnsubscribeAll(socket);
    });
    // Handle get active subscriptions
    socket.on('get:subscriptions', () => {
        handleGetSubscriptions(socket);
    });
    // Handle disconnection
    socket.on('disconnect', () => {
        handleDisconnection(socket);
    });
}
// ============================================================================
// SUBSCRIPTION HANDLERS
// ============================================================================
/**
 * Handle device subscription (all data from a device)
 */
function handleDeviceSubscription(socket, io, data) {
    try {
        const { masterHandle, deviceId, interval = 1000 } = data;
        if (!masterHandle || !deviceId) {
            socket.emit('error', {
                message: 'masterHandle and deviceId are required',
                timestamp: new Date().toISOString(),
            });
            return;
        }
        const handle = parseInt(masterHandle.toString());
        const port = parseInt(deviceId.toString());
        const deviceKey = `${handle}:${port}`;
        const streamId = `device:${deviceKey}:${socket.id}`;
        // Validate device exists
        try {
            deviceController_1.deviceManager.getDevice(handle, port);
        }
        catch (error) {
            socket.emit('error', {
                message: `Device not found: ${error.message}`,
                timestamp: new Date().toISOString(),
            });
            return;
        }
        // Validate interval
        const validInterval = Math.max(constants_1.LIMITS.STREAM_INTERVAL_MIN, Math.min(interval, constants_1.LIMITS.STREAM_INTERVAL_MAX));
        // Join device room
        socket.join(`device:${deviceKey}`);
        // Store stream info
        const streamInfo = {
            type: 'device',
            socketId: socket.id,
            deviceKey: deviceKey,
            masterHandle: handle,
            deviceId: port,
            interval: validInterval,
            startedAt: new Date(),
        };
        exports.activeStreams.set(streamId, streamInfo);
        // Add socket to device streams
        if (!exports.deviceStreams.has(deviceKey)) {
            exports.deviceStreams.set(deviceKey, new Set());
        }
        exports.deviceStreams.get(deviceKey).add(socket.id);
        // Start streaming if not already active for this device
        if (!exports.streamIntervals.has(`device:${deviceKey}`)) {
            startDeviceStreaming(deviceKey, handle, port, validInterval, io);
        }
        socket.emit('subscribed', {
            type: 'device',
            deviceKey: deviceKey,
            interval: validInterval,
            timestamp: new Date().toISOString(),
        });
        logger_1.default.info(`WebSocket ${socket.id} subscribed to device ${deviceKey} (${validInterval}ms)`);
    }
    catch (error) {
        logger_1.default.error(`Device subscription error for ${socket.id}:`, error.message);
        socket.emit('error', {
            message: `Subscription failed: ${error.message}`,
            timestamp: new Date().toISOString(),
        });
    }
}
/**
 * Handle parameter subscription
 */
function handleParameterSubscription(socket, io, data) {
    try {
        const { masterHandle, deviceId, parameterIndex, subIndex = 0, interval = 5000, } = data;
        if (!masterHandle || !deviceId || parameterIndex === undefined) {
            socket.emit('error', {
                message: 'masterHandle, deviceId, and parameterIndex are required',
                timestamp: new Date().toISOString(),
            });
            return;
        }
        const handle = parseInt(masterHandle.toString());
        const port = parseInt(deviceId.toString());
        const index = parseInt(parameterIndex.toString());
        const sub = parseInt(subIndex.toString());
        const deviceKey = `${handle}:${port}`;
        const paramKey = `${index}.${sub}`;
        const streamId = `param:${deviceKey}:${paramKey}:${socket.id}`;
        // Validate device exists
        try {
            deviceController_1.deviceManager.getDevice(handle, port);
        }
        catch (error) {
            socket.emit('error', {
                message: `Device not found: ${error.message}`,
                timestamp: new Date().toISOString(),
            });
            return;
        }
        const validInterval = Math.max(constants_1.LIMITS.STREAM_INTERVAL_MIN, Math.min(interval, constants_1.LIMITS.STREAM_INTERVAL_MAX));
        // Join parameter room
        const roomName = `param:${deviceKey}:${paramKey}`;
        socket.join(roomName);
        // Store stream info
        const streamInfo = {
            type: 'parameter',
            socketId: socket.id,
            deviceKey: deviceKey,
            masterHandle: handle,
            deviceId: port,
            parameterIndex: index,
            subIndex: sub,
            interval: validInterval,
            startedAt: new Date(),
        };
        exports.activeStreams.set(streamId, streamInfo);
        // Start parameter streaming
        if (!exports.streamIntervals.has(roomName)) {
            startParameterStreaming(deviceKey, handle, port, index, sub, validInterval, io, roomName);
        }
        socket.emit('subscribed', {
            type: 'parameter',
            deviceKey: deviceKey,
            parameterIndex: index,
            subIndex: sub,
            interval: validInterval,
            timestamp: new Date().toISOString(),
        });
        logger_1.default.info(`WebSocket ${socket.id} subscribed to parameter ${index}.${sub} on device ${deviceKey}`);
    }
    catch (error) {
        logger_1.default.error(`Parameter subscription error for ${socket.id}:`, error.message);
        socket.emit('error', {
            message: `Parameter subscription failed: ${error.message}`,
            timestamp: new Date().toISOString(),
        });
    }
}
/**
 * Handle process data subscription
 */
function handleProcessDataSubscription(socket, io, data) {
    try {
        const { masterHandle, deviceId, interval = 1000 } = data;
        if (!masterHandle || !deviceId) {
            socket.emit('error', {
                message: 'masterHandle and deviceId are required',
                timestamp: new Date().toISOString(),
            });
            return;
        }
        const handle = parseInt(masterHandle.toString());
        const port = parseInt(deviceId.toString());
        const deviceKey = `${handle}:${port}`;
        const streamId = `process:${deviceKey}:${socket.id}`;
        // Validate device exists
        try {
            const device = deviceController_1.deviceManager.getDevice(handle, port);
            if (!device.isReady()) {
                socket.emit('error', {
                    message: 'Device is not ready for process data operations',
                    timestamp: new Date().toISOString(),
                });
                return;
            }
        }
        catch (error) {
            socket.emit('error', {
                message: `Device not found: ${error.message}`,
                timestamp: new Date().toISOString(),
            });
            return;
        }
        const validInterval = Math.max(constants_1.LIMITS.STREAM_INTERVAL_MIN, Math.min(interval, constants_1.LIMITS.STREAM_INTERVAL_MAX));
        // Join process data room
        const roomName = `process:${deviceKey}`;
        socket.join(roomName);
        // Store stream info
        const streamInfo = {
            type: 'process-data',
            socketId: socket.id,
            deviceKey: deviceKey,
            masterHandle: handle,
            deviceId: port,
            interval: validInterval,
            startedAt: new Date(),
        };
        exports.activeStreams.set(streamId, streamInfo);
        // Start process data streaming
        if (!exports.streamIntervals.has(roomName)) {
            startProcessDataStreaming(deviceKey, handle, port, validInterval, io, roomName);
        }
        socket.emit('subscribed', {
            type: 'process-data',
            deviceKey: deviceKey,
            interval: validInterval,
            timestamp: new Date().toISOString(),
        });
        logger_1.default.info(`WebSocket ${socket.id} subscribed to process data on device ${deviceKey} (${validInterval}ms)`);
    }
    catch (error) {
        logger_1.default.error(`Process data subscription error for ${socket.id}:`, error.message);
        socket.emit('error', {
            message: `Process data subscription failed: ${error.message}`,
            timestamp: new Date().toISOString(),
        });
    }
}
// ============================================================================
// STREAMING FUNCTIONS
// ============================================================================
function startDeviceStreaming(deviceKey, handle, port, interval, io) {
    const roomName = `device:${deviceKey}`;
    const intervalId = setInterval(async () => {
        try {
            // Read process data
            let processData = null;
            try {
                const result = await deviceController_1.deviceManager.readProcessData(handle, port);
                processData = {
                    data: Array.from(result.data),
                    dataHex: result.data.toString('hex').toUpperCase(),
                    length: result.data.length,
                    status: result.status,
                    timestamp: result.timestamp,
                };
            }
            catch (error) {
                logger_1.default.debug(`Process data read error for ${deviceKey}: ${error.message}`);
            }
            // Get device status
            let deviceStatus = null;
            try {
                deviceStatus = await deviceController_1.deviceManager.getDeviceStatus(handle, port);
            }
            catch (error) {
                logger_1.default.debug(`Device status error for ${deviceKey}: ${error.message}`);
            }
            // Emit combined data
            io.to(roomName).emit('device:data', {
                deviceKey: deviceKey,
                processData: processData,
                deviceStatus: deviceStatus,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.default.error(`Device streaming error for ${deviceKey}:`, error.message);
            io.to(roomName).emit('device:error', {
                deviceKey: deviceKey,
                error: error.message,
                timestamp: new Date().toISOString(),
            });
        }
    }, interval);
    exports.streamIntervals.set(roomName, intervalId);
    logger_1.default.info(`Started device streaming for ${deviceKey} (${interval}ms)`);
}
function startParameterStreaming(deviceKey, handle, port, index, subIndex, interval, io, roomName) {
    const intervalId = setInterval(async () => {
        try {
            const result = await deviceController_1.deviceManager.readDeviceParameter(deviceKey, index, subIndex);
            // Try to parse the value
            let parsedValue = result.data;
            try {
                const parameterMap = deviceController_1.deviceManager.parameters.get(deviceKey);
                const parameter = parameterMap?.get(`${index}.${subIndex}`);
                if (parameter) {
                    parsedValue = parameter.parseValue(result.data);
                }
            }
            catch (error) {
                logger_1.default.debug(`Could not parse parameter value: ${error.message}`);
            }
            io.to(roomName).emit('parameter:value', {
                deviceKey: deviceKey,
                index: index,
                subIndex: subIndex,
                rawData: Array.from(result.data),
                rawDataHex: result.data.toString('hex').toUpperCase(),
                parsedValue: parsedValue,
                timestamp: result.timestamp,
            });
        }
        catch (error) {
            logger_1.default.error(`Parameter streaming error for ${deviceKey} param ${index}.${subIndex}:`, error.message);
            io.to(roomName).emit('parameter:error', {
                deviceKey: deviceKey,
                index: index,
                subIndex: subIndex,
                error: error.message,
                timestamp: new Date().toISOString(),
            });
        }
    }, interval);
    exports.streamIntervals.set(roomName, intervalId);
    logger_1.default.info(`Started parameter streaming for ${deviceKey} param ${index}.${subIndex} (${interval}ms)`);
}
function startProcessDataStreaming(deviceKey, handle, port, interval, io, roomName) {
    const intervalId = setInterval(async () => {
        try {
            const result = await deviceController_1.deviceManager.readProcessData(handle, port);
            io.to(roomName).emit('process-data:value', {
                deviceKey: deviceKey,
                data: Array.from(result.data),
                dataHex: result.data.toString('hex').toUpperCase(),
                length: result.data.length,
                status: result.status,
                timestamp: result.timestamp,
            });
        }
        catch (error) {
            logger_1.default.error(`Process data streaming error for ${deviceKey}:`, error.message);
            io.to(roomName).emit('process-data:error', {
                deviceKey: deviceKey,
                error: error.message,
                timestamp: new Date().toISOString(),
            });
        }
    }, interval);
    exports.streamIntervals.set(roomName, intervalId);
    logger_1.default.info(`Started process data streaming for ${deviceKey} (${interval}ms)`);
}
// ============================================================================
// UNSUBSCRIPTION HANDLERS
// ============================================================================
function handleUnsubscription(socket, data) {
    const { type, deviceKey, parameterIndex, subIndex } = data;
    if (type === 'device' && deviceKey) {
        const streamId = `device:${deviceKey}:${socket.id}`;
        unsubscribeStream(socket, streamId, deviceKey);
    }
    else if (type === 'parameter' &&
        deviceKey &&
        parameterIndex !== undefined) {
        const paramKey = `${parameterIndex}.${subIndex || 0}`;
        const streamId = `param:${deviceKey}:${paramKey}:${socket.id}`;
        const roomName = `param:${deviceKey}:${paramKey}`;
        unsubscribeStream(socket, streamId, roomName);
    }
    else if (type === 'process-data' && deviceKey) {
        const streamId = `process:${deviceKey}:${socket.id}`;
        const roomName = `process:${deviceKey}`;
        unsubscribeStream(socket, streamId, roomName);
    }
}
function handleUnsubscribeAll(socket) {
    const socketStreams = Array.from(exports.activeStreams.entries()).filter(([_, info]) => info.socketId === socket.id);
    for (const [streamId, streamInfo] of socketStreams) {
        if (streamInfo.type === 'device') {
            unsubscribeStream(socket, streamId, streamInfo.deviceKey);
        }
        else if (streamInfo.type === 'parameter') {
            const roomName = `param:${streamInfo.deviceKey}:${streamInfo.parameterIndex}.${streamInfo.subIndex}`;
            unsubscribeStream(socket, streamId, roomName);
        }
        else if (streamInfo.type === 'process-data') {
            const roomName = `process:${streamInfo.deviceKey}`;
            unsubscribeStream(socket, streamId, roomName);
        }
    }
    socket.emit('unsubscribed:all', {
        count: socketStreams.length,
        timestamp: new Date().toISOString(),
    });
}
function unsubscribeStream(socket, streamId, roomOrDeviceKey) {
    const streamInfo = exports.activeStreams.get(streamId);
    if (!streamInfo)
        return;
    // Remove from active streams
    exports.activeStreams.delete(streamId);
    // Leave room
    socket.leave(roomOrDeviceKey);
    // Remove from device streams if it's a device subscription
    if (streamInfo.type === 'device') {
        const deviceSockets = exports.deviceStreams.get(streamInfo.deviceKey);
        if (deviceSockets) {
            deviceSockets.delete(socket.id);
            if (deviceSockets.size === 0) {
                exports.deviceStreams.delete(streamInfo.deviceKey);
                // Stop streaming if no more subscribers
                const intervalId = exports.streamIntervals.get(`device:${streamInfo.deviceKey}`);
                if (intervalId) {
                    clearInterval(intervalId);
                    exports.streamIntervals.delete(`device:${streamInfo.deviceKey}`);
                    logger_1.default.info(`Stopped device streaming for ${streamInfo.deviceKey}`);
                }
            }
        }
    }
    else {
        // Check if there are other subscribers to this room
        const room = socket.adapter.rooms.get(roomOrDeviceKey);
        if (!room || room.size === 0) {
            const intervalId = exports.streamIntervals.get(roomOrDeviceKey);
            if (intervalId) {
                clearInterval(intervalId);
                exports.streamIntervals.delete(roomOrDeviceKey);
                logger_1.default.info(`Stopped streaming for ${roomOrDeviceKey}`);
            }
        }
    }
    socket.emit('unsubscribed', {
        type: streamInfo.type,
        streamId: streamId,
        timestamp: new Date().toISOString(),
    });
    logger_1.default.info(`WebSocket ${socket.id} unsubscribed from ${streamId}`);
}
function handleGetSubscriptions(socket) {
    const socketStreams = Array.from(exports.activeStreams.entries())
        .filter(([_, info]) => info.socketId === socket.id)
        .map(([streamId, info]) => ({
        streamId,
        type: info.type,
        deviceKey: info.deviceKey,
        interval: info.interval,
        startedAt: info.startedAt,
        parameterIndex: info.parameterIndex,
        subIndex: info.subIndex,
    }));
    socket.emit('subscriptions', {
        subscriptions: socketStreams,
        count: socketStreams.length,
        timestamp: new Date().toISOString(),
    });
}
function handleDisconnection(socket) {
    logger_1.default.info(`WebSocket client disconnected: ${socket.id}`);
    // Clean up all streams for this socket
    handleUnsubscribeAll(socket);
}
//# sourceMappingURL=streamController.js.map