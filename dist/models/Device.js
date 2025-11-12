"use strict";
/**
 * Device Model - TypeScript Port
 * Represents an IO-Link device with its properties and state
 *
 * CRITICAL: Maintains exact behavior and data structure from JavaScript version
 */
Object.defineProperty(exports, "__esModule", { value: true });
class Device {
    constructor({ port, vendorId, deviceId, functionId, revisionId, vendorName, deviceName, processDataInputLength = 0, processDataOutputLength = 0, masterHandle = null, }) {
        this.port = port;
        this.vendorId = vendorId;
        this.deviceId = deviceId;
        this.functionId = functionId;
        this.revisionId = revisionId;
        this.vendorName = vendorName;
        this.deviceName = deviceName;
        this.processDataInputLength = processDataInputLength;
        this.processDataOutputLength = processDataOutputLength;
        this.masterHandle = masterHandle;
        // Connection state
        this.connected = false;
        this.connectionState = 'DISCONNECTED';
        this.actualMode = 0;
        this.sensorStatus = 0;
        this.baudrate = 0;
        // Timestamps
        this.connectedAt = null;
        this.lastSeen = null;
        this.lastDataRead = null;
        this.lastParameterRead = null;
        // Device capabilities
        this.supportedParameters = new Map();
        this.processDataCache = null;
        this.parameterCache = new Map();
        // Metadata
        this.serialNumber = null;
        this.firmwareVersion = null;
        this.hardwareVersion = null;
        this.applicationName = null;
    }
    /**
     * Update device connection status
     */
    updateConnectionStatus(status) {
        this.connected = status.connected;
        this.connectionState = status.mode;
        this.actualMode = status.actualMode;
        this.sensorStatus = status.sensorStatus;
        this.baudrate = status.baudrate;
        this.lastSeen = status.timestamp || new Date();
        if (this.connected && !this.connectedAt) {
            this.connectedAt = new Date();
        }
        else if (!this.connected) {
            this.connectedAt = null;
        }
    }
    /**
     * Cache process data
     */
    cacheProcessData(data) {
        this.processDataCache = {
            data: data.data,
            status: data.status,
            timestamp: data.timestamp,
        };
        this.lastDataRead = data.timestamp;
    }
    /**
     * Cache parameter value
     */
    cacheParameter(index, subIndex, parameterData) {
        const key = `${index}.${subIndex}`;
        this.parameterCache.set(key, {
            ...parameterData,
            cachedAt: new Date(),
        });
        this.lastParameterRead = new Date();
    }
    /**
     * Get cached parameter value
     */
    getCachedParameter(index, subIndex) {
        const key = `${index}.${subIndex}`;
        return this.parameterCache.get(key);
    }
    /**
     * Check if parameter cache is still valid (within specified time)
     */
    isParameterCacheValid(index, subIndex, maxAgeMs = 30000) {
        const cached = this.getCachedParameter(index, subIndex);
        if (!cached)
            return false;
        const age = new Date().getTime() - cached.cachedAt.getTime();
        return age < maxAgeMs;
    }
    /**
     * Check if process data cache is still valid
     */
    isProcessDataCacheValid(maxAgeMs = 1000) {
        if (!this.processDataCache)
            return false;
        const age = new Date().getTime() - this.processDataCache.timestamp.getTime();
        return age < maxAgeMs;
    }
    /**
     * Get device summary for API responses
     */
    toJSON() {
        return {
            port: this.port,
            vendorId: this.vendorId,
            deviceId: this.deviceId,
            functionId: this.functionId,
            revisionId: this.revisionId,
            vendorName: this.vendorName,
            deviceName: this.deviceName,
            processDataInputLength: this.processDataInputLength,
            processDataOutputLength: this.processDataOutputLength,
            connected: this.connected,
            connectionState: this.connectionState,
            actualMode: this.actualMode,
            sensorStatus: this.sensorStatus,
            baudrate: this.baudrate,
            connectedAt: this.connectedAt,
            lastSeen: this.lastSeen,
            lastDataRead: this.lastDataRead,
            lastParameterRead: this.lastParameterRead,
            serialNumber: this.serialNumber,
            firmwareVersion: this.firmwareVersion,
            hardwareVersion: this.hardwareVersion,
            applicationName: this.applicationName,
            supportedParametersCount: this.supportedParameters.size,
            hasProcessDataCache: !!this.processDataCache,
            parameterCacheSize: this.parameterCache.size,
        };
    }
    /**
     * Get device info suitable for device listing
     */
    getDeviceInfo() {
        return {
            port: this.port,
            vendorName: this.vendorName,
            deviceName: this.deviceName,
            vendorId: this.vendorId,
            deviceId: this.deviceId,
            connected: this.connected,
            connectionState: this.connectionState,
            processDataInputLength: this.processDataInputLength,
            processDataOutputLength: this.processDataOutputLength,
            lastSeen: this.lastSeen,
        };
    }
    /**
     * Get connection status
     */
    getConnectionStatus() {
        return {
            port: this.port,
            connected: this.connected,
            connectionState: this.connectionState,
            actualMode: this.actualMode,
            sensorStatus: this.sensorStatus,
            baudrate: this.baudrate,
            connectedAt: this.connectedAt,
            lastSeen: this.lastSeen,
            uptime: this.connectedAt ? new Date().getTime() - this.connectedAt.getTime() : 0,
        };
    }
    /**
     * Clear all cached data
     */
    clearCache() {
        this.processDataCache = null;
        this.parameterCache.clear();
        this.lastDataRead = null;
        this.lastParameterRead = null;
    }
    /**
     * Update device metadata from parameters
     */
    updateMetadata(metadata) {
        if (metadata.serialNumber !== undefined) {
            this.serialNumber = metadata.serialNumber;
        }
        if (metadata.firmwareVersion !== undefined) {
            this.firmwareVersion = metadata.firmwareVersion;
        }
        if (metadata.hardwareVersion !== undefined) {
            this.hardwareVersion = metadata.hardwareVersion;
        }
        if (metadata.applicationName !== undefined) {
            this.applicationName = metadata.applicationName;
        }
    }
    /**
     * Check if device is ready for operations
     */
    isReady() {
        return this.connected && this.connectionState === 'OPERATE';
    }
    /**
     * Check if device is in communication
     */
    isInCommunication() {
        return (this.connected &&
            (this.connectionState === 'OPERATE' ||
                this.connectionState === 'PREOPERATE'));
    }
    /**
     * Get device identifier string
     */
    getIdentifier() {
        return `${this.vendorName}_${this.deviceName}_Port${this.port}`;
    }
}
exports.default = Device;
//# sourceMappingURL=Device.js.map