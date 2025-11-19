"use strict";
/**
 * Device Manager Service
 * Manages device lifecycle, state, and high-level operations
 *
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const IOLinkService_1 = __importDefault(require("./IOLinkService"));
const Device_1 = __importDefault(require("../models/Device"));
const Parameter_1 = __importDefault(require("../models/Parameter"));
const logger_1 = __importDefault(require("../utils/logger"));
const constants_1 = require("../utils/constants");
class DeviceManager {
    constructor() {
        this.iolinkService = new IOLinkService_1.default();
        this.connectedMasters = new Map();
        this.devices = new Map();
        this.deviceSubscriptions = new Map();
        this.parameters = new Map();
        this.scanIntervals = new Map();
        this.monitoringEnabled = false;
        this.monitoringInterval = null;
    }
    // ============================================================================
    // MASTER MANAGEMENT
    // ============================================================================
    async discoverMasters() {
        try {
            logger_1.default.info("Discovering IO-Link masters...");
            const masters = await this.iolinkService.discoverMasters();
            logger_1.default.info(`Found ${masters.length} IO-Link masters`);
            return masters;
        }
        catch (error) {
            logger_1.default.error("Failed to discover masters:", error.message);
            throw error;
        }
    }
    async connectMaster(deviceName) {
        try {
            logger_1.default.info(`Connecting to master: ${deviceName}`);
            // Check if already connected
            for (const [handle, master] of this.connectedMasters) {
                if (master.deviceName === deviceName) {
                    logger_1.default.warn(`Master ${deviceName} already connected with handle ${handle}`);
                    return handle;
                }
            }
            const handle = await this.iolinkService.connectToMaster(deviceName);
            const masterInfo = {
                handle: handle,
                deviceName: deviceName,
                connectedAt: new Date(),
                ports: new Map(),
            };
            this.connectedMasters.set(handle, masterInfo);
            // Start device scanning for this master
            await this.startDeviceScanning(handle);
            logger_1.default.info(`Master ${deviceName} connected successfully with handle ${handle}`);
            return handle;
        }
        catch (error) {
            logger_1.default.error(`Failed to connect master ${deviceName}:`, error.message);
            throw error;
        }
    }
    async disconnectMaster(handle) {
        try {
            const masterInfo = this.connectedMasters.get(handle);
            if (!masterInfo) {
                throw new Error(`Master with handle ${handle} not found`);
            }
            logger_1.default.info(`Disconnecting master: ${masterInfo.deviceName}`);
            // Stop device scanning
            this.stopDeviceScanning(handle);
            // Remove all devices for this master
            const devicesToRemove = [];
            for (const [deviceKey, device] of this.devices) {
                if (device.masterHandle === handle) {
                    devicesToRemove.push(deviceKey);
                }
            }
            for (const deviceKey of devicesToRemove) {
                this.devices.delete(deviceKey);
                this.parameters.delete(deviceKey);
            }
            // Disconnect from master
            await this.iolinkService.disconnectFromMaster(handle);
            this.connectedMasters.delete(handle);
            logger_1.default.info(`Master ${masterInfo.deviceName} disconnected successfully`);
            return true;
        }
        catch (error) {
            logger_1.default.error(`Failed to disconnect master:`, error.message);
            throw error;
        }
    }
    getConnectedMasters() {
        const masters = [];
        for (const [handle, masterInfo] of this.connectedMasters) {
            masters.push({
                handle: handle,
                deviceName: masterInfo.deviceName,
                connectedAt: masterInfo.connectedAt,
                deviceCount: Array.from(this.devices.values()).filter((d) => d.masterHandle === handle).length,
            });
        }
        return masters;
    }
    // ============================================================================
    // DEVICE DISCOVERY AND MANAGEMENT
    // ============================================================================
    async startDeviceScanning(masterHandle, intervalMs = 10000) {
        // Stop existing scanning
        this.stopDeviceScanning(masterHandle);
        const scanDevices = async () => {
            try {
                await this.scanDevicesOnMaster(masterHandle);
            }
            catch (error) {
                logger_1.default.error(`Device scanning error for master ${masterHandle}:`, error.message);
            }
        };
        // Initial scan
        await scanDevices();
        // Schedule periodic scanning
        const intervalId = setInterval(scanDevices, intervalMs);
        this.scanIntervals.set(masterHandle, intervalId);
        logger_1.default.info(`Started device scanning for master ${masterHandle} (interval: ${intervalMs}ms)`);
    }
    stopDeviceScanning(masterHandle) {
        const intervalId = this.scanIntervals.get(masterHandle);
        if (intervalId) {
            clearInterval(intervalId);
            this.scanIntervals.delete(masterHandle);
            logger_1.default.info(`Stopped device scanning for master ${masterHandle}`);
        }
    }
    async scanDevicesOnMaster(masterHandle) {
        const masterInfo = this.connectedMasters.get(masterHandle);
        if (!masterInfo) {
            throw new Error(`Master with handle ${masterHandle} not connected`);
        }
        logger_1.default.debug(`Scanning devices on master ${masterInfo.deviceName}`);
        for (let port = 1; port <= constants_1.LIMITS.MAX_PORTS; port++) {
            try {
                const status = await this.iolinkService.checkPortStatus(masterHandle, port);
                const deviceKey = `${masterHandle}:${port}`;
                const existingDevice = this.devices.get(deviceKey);
                if (status.connected) {
                    if (!existingDevice) {
                        // New device detected
                        await this.handleNewDeviceDetected(masterHandle, port, status);
                    }
                    else {
                        // Update existing device status
                        existingDevice.updateConnectionStatus(status);
                        logger_1.default.debug(`Updated device status for port ${port}: ${status.mode}`);
                    }
                }
                else {
                    if (existingDevice) {
                        // Device disconnected
                        await this.handleDeviceDisconnected(deviceKey, existingDevice);
                    }
                }
            }
            catch (error) {
                logger_1.default.debug(`Error checking port ${port} on master ${masterHandle}:`, error.message);
            }
        }
    }
    async handleNewDeviceDetected(masterHandle, port, status) {
        try {
            logger_1.default.info(`New device detected on master ${masterHandle} port ${port}`);
            // Parse device info from direct parameter page
            const deviceInfo = this.iolinkService.parseDeviceInfoFromDPP(status.directParameterPage, port);
            if (!deviceInfo) {
                logger_1.default.warn(`Could not parse device info for port ${port}`);
                return;
            }
            // Create device instance
            const device = new Device_1.default({
                ...deviceInfo,
                masterHandle: masterHandle,
            });
            device.updateConnectionStatus(status);
            const deviceKey = `${masterHandle}:${port}`;
            this.devices.set(deviceKey, device);
            // Initialize standard parameters for this device
            await this.initializeDeviceParameters(deviceKey, device);
            // Try to read basic device information
            await this.readDeviceMetadata(deviceKey, device);
            logger_1.default.info(`Device registered: ${device.vendorName} ${device.deviceName} on port ${port}`);
            return device;
        }
        catch (error) {
            logger_1.default.error(`Error handling new device on port ${port}:`, error.message);
        }
    }
    async handleDeviceDisconnected(deviceKey, device) {
        logger_1.default.info(`Device disconnected: ${device.vendorName} ${device.deviceName} on port ${device.port}`);
        device.connected = false;
        device.connectionState = constants_1.CONNECTION_STATES.DISCONNECTED;
        device.connectedAt = null;
        device.clearCache();
        // Keep device in registry for potential reconnection
        setTimeout(() => {
            if (!device.connected) {
                this.devices.delete(deviceKey);
                this.parameters.delete(deviceKey);
                logger_1.default.debug(`Removed disconnected device from registry: ${deviceKey}`);
            }
        }, 30000);
    }
    async initializeDeviceParameters(deviceKey, device) {
        const parameterMap = new Map();
        // Add standard IO-Link parameters
        for (const [index, definition] of Object.entries(constants_1.STANDARD_PARAMETERS)) {
            const parameter = Parameter_1.default.createStandardParameter(parseInt(index), definition);
            parameterMap.set(parameter.getId(), parameter);
        }
        this.parameters.set(deviceKey, parameterMap);
        logger_1.default.debug(`Initialized ${parameterMap.size} standard parameters for device ${deviceKey}`);
    }
    async readDeviceMetadata(deviceKey, device) {
        try {
            const tasks = [
                this.readDeviceParameter(deviceKey, constants_1.PARAMETER_INDEX.SERIAL_NUMBER),
                this.readDeviceParameter(deviceKey, constants_1.PARAMETER_INDEX.FIRMWARE_REVISION),
                this.readDeviceParameter(deviceKey, constants_1.PARAMETER_INDEX.HARDWARE_REVISION),
                this.readDeviceParameter(deviceKey, constants_1.PARAMETER_INDEX.APPLICATION_SPECIFIC_NAME),
            ];
            const results = await Promise.allSettled(tasks);
            const metadata = {};
            if (results[0].status === "fulfilled") {
                metadata.serialNumber = results[0].value.data
                    .toString("ascii")
                    .replace(/\0/g, "")
                    .trim();
            }
            if (results[1].status === "fulfilled") {
                metadata.firmwareVersion = results[1].value.data
                    .toString("ascii")
                    .replace(/\0/g, "")
                    .trim();
            }
            if (results[2].status === "fulfilled") {
                metadata.hardwareVersion = results[2].value.data
                    .toString("ascii")
                    .replace(/\0/g, "")
                    .trim();
            }
            if (results[3].status === "fulfilled") {
                metadata.applicationName = results[3].value.data
                    .toString("ascii")
                    .replace(/\0/g, "")
                    .trim();
            }
            device.updateMetadata(metadata);
            logger_1.default.debug(`Updated metadata for device ${deviceKey}`);
        }
        catch (error) {
            logger_1.default.debug(`Could not read all metadata for device ${deviceKey}:`, error.message);
        }
    }
    // ============================================================================
    // DEVICE ACCESS METHODS
    // ============================================================================
    getDevices() {
        return Array.from(this.devices.values()).map((device) => device.getDeviceInfo());
    }
    getDevice(masterHandle, port) {
        if (!(0, constants_1.isValidPort)(port)) {
            throw new Error(`Invalid port number: ${port}`);
        }
        const deviceKey = `${masterHandle}:${port}`;
        const device = this.devices.get(deviceKey);
        if (!device) {
            throw new Error(`No device found on master ${masterHandle} port ${port}`);
        }
        return device;
    }
    getDeviceByKey(deviceKey) {
        const device = this.devices.get(deviceKey);
        if (!device) {
            throw new Error(`Device not found: ${deviceKey}`);
        }
        return device;
    }
    async getDeviceStatus(masterHandle, port) {
        const device = this.getDevice(masterHandle, port);
        const status = await this.iolinkService.checkPortStatus(masterHandle, port);
        device.updateConnectionStatus(status);
        return device.getConnectionStatus();
    }
    // ============================================================================
    // PROCESS DATA OPERATIONS
    // ============================================================================
    async readProcessData(masterHandle, port) {
        const device = this.getDevice(masterHandle, port);
        if (!device.isReady()) {
            throw new Error(`Device on port ${port} is not ready for process data operations`);
        }
        // Check cache first
        if (device.isProcessDataCacheValid(constants_1.LIMITS.CACHE_TTL_PROCESS_DATA)) {
            logger_1.default.debug(`Returning cached process data for port ${port}`);
            return device.processDataCache;
        }
        const result = await this.iolinkService.readProcessData(masterHandle, port);
        device.cacheProcessData(result);
        logger_1.default.debug(`Read process data from port ${port}: ${result.data.length} bytes`);
        return result;
    }
    async writeProcessData(masterHandle, port, data) {
        const device = this.getDevice(masterHandle, port);
        if (!device.isReady()) {
            throw new Error(`Device on port ${port} is not ready for process data operations`);
        }
        const result = await this.iolinkService.writeProcessData(masterHandle, port, data);
        logger_1.default.debug(`Wrote process data to port ${port}: ${result.bytesWritten} bytes`);
        return result;
    }
    // ============================================================================
    // PARAMETER OPERATIONS
    // ============================================================================
    async readDeviceParameter(deviceKey, index, subIndex = 0) {
        const device = this.getDeviceByKey(deviceKey);
        const parameterMap = this.parameters.get(deviceKey);
        if (!device.isInCommunication()) {
            throw new Error(`Device ${deviceKey} is not in communication`);
        }
        const parameterId = `${index}.${subIndex}`;
        const parameter = parameterMap?.get(parameterId);
        // Check cache if parameter exists
        if (parameter &&
            device.isParameterCacheValid(index, subIndex, constants_1.LIMITS.CACHE_TTL_PARAMETERS)) {
            logger_1.default.debug(`Returning cached parameter ${parameterId} for device ${deviceKey}`);
            return device.getCachedParameter(index, subIndex);
        }
        const result = await this.iolinkService.readParameter(device.masterHandle, device.port, index, subIndex);
        // Cache the result
        if (parameter) {
            const parsedValue = parameter.parseValue(result.data);
            parameter.updateValue(parsedValue, result.timestamp);
            device.cacheParameter(index, subIndex, result);
        }
        logger_1.default.debug(`Read parameter ${parameterId} from device ${deviceKey}`);
        return result;
    }
    async writeDeviceParameter(deviceKey, index, subIndex = 0, value) {
        const device = this.getDeviceByKey(deviceKey);
        const parameterMap = this.parameters.get(deviceKey);
        if (!device.isInCommunication()) {
            throw new Error(`Device ${deviceKey} is not in communication`);
        }
        const parameterId = `${index}.${subIndex}`;
        const parameter = parameterMap?.get(parameterId);
        // Validate parameter if it exists
        if (parameter) {
            if (!parameter.isWritable()) {
                throw new Error(`Parameter ${parameterId} is read-only`);
            }
            const validation = parameter.validateValue(value);
            if (!validation.valid) {
                throw new Error(`Parameter validation failed: ${validation.errors.join(", ")}`);
            }
            // Format value for transmission
            value = parameter.formatValue(value);
        }
        const result = await this.iolinkService.writeParameter(device.masterHandle, device.port, index, subIndex, value);
        // Update parameter cache
        if (parameter) {
            parameter.recordWrite(result.timestamp);
        }
        logger_1.default.debug(`Wrote parameter ${parameterId} to device ${deviceKey}`);
        return result;
    }
    getDeviceParameters(deviceKey) {
        const parameterMap = this.parameters.get(deviceKey);
        if (!parameterMap) {
            throw new Error(`No parameters found for device ${deviceKey}`);
        }
        return Array.from(parameterMap.values()).map((param) => param.getSummary());
    }
    // ============================================================================
    // UTILITY METHODS
    // ============================================================================
    async validateDeviceConnection(masterHandle, port) {
        const device = this.getDevice(masterHandle, port);
        if (!device.isInCommunication()) {
            throw new Error(`Device on master ${masterHandle} port ${port} is not connected`);
        }
        return device;
    }
    getDeviceCount() {
        return this.devices.size;
    }
    getConnectedDeviceCount() {
        return Array.from(this.devices.values()).filter((device) => device.connected).length;
    }
    async cleanup() {
        logger_1.default.info("Cleaning up DeviceManager...");
        // Stop all scanning intervals
        for (const [masterHandle, intervalId] of this.scanIntervals) {
            clearInterval(intervalId);
        }
        this.scanIntervals.clear();
        // Disconnect all masters
        for (const [handle, masterInfo] of this.connectedMasters) {
            try {
                await this.disconnectMaster(handle);
            }
            catch (error) {
                logger_1.default.error(`Error disconnecting master ${masterInfo.deviceName}:`, error.message);
            }
        }
        // Clear all data
        this.devices.clear();
        this.parameters.clear();
        this.connectedMasters.clear();
        logger_1.default.info("DeviceManager cleanup completed");
    }
}
exports.default = DeviceManager;
//# sourceMappingURL=DeviceManager.js.map