"use strict";
/**
 * IO-Link Service - TypeScript Port
 * Core service class that wraps the TMG DLL functionality
 * Extracted from the original iolink-interface.js
 *
 * CRITICAL: Maintains exact behavior and method signatures from JavaScript version
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
const ffi = __importStar(require("ffi-napi"));
const ref = __importStar(require("ref-napi"));
const ref_struct_napi_1 = __importDefault(require("ref-struct-napi"));
const ref_array_napi_1 = __importDefault(require("ref-array-napi"));
const logger_1 = __importDefault(require("../utils/logger"));
const constants_1 = require("../utils/constants");
// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
const BYTE = ref.types.uint8;
const WORD = ref.types.uint16;
const LONG = ref.types.int32;
const DWORD = ref.types.uint32;
// Device Identification Structure
const TDeviceIdentification = (0, ref_struct_napi_1.default)({
    Name: (0, ref_array_napi_1.default)(BYTE, 8),
    ProductCode: (0, ref_array_napi_1.default)(BYTE, 16),
    ViewName: (0, ref_array_napi_1.default)(BYTE, 100),
});
// Extended Info Structure
const TInfoEx = (0, ref_struct_napi_1.default)({
    COM: (0, ref_array_napi_1.default)(BYTE, 10),
    DirectParameterPage: (0, ref_array_napi_1.default)(BYTE, 16),
    ActualMode: BYTE,
    SensorStatus: BYTE,
    CurrentBaudrate: BYTE,
});
// Parameter Structure for ISDU
const TParameter = (0, ref_struct_napi_1.default)({
    Result: (0, ref_array_napi_1.default)(BYTE, 256),
    Index: WORD,
    SubIndex: BYTE,
    Length: BYTE,
    ErrorCode: BYTE,
    AdditionalCode: BYTE,
});
// Port Configuration Structure
const TPortConfiguration = (0, ref_struct_napi_1.default)({
    PortModeDetails: BYTE,
    TargetMode: BYTE,
    CRID: BYTE,
    DSConfigure: BYTE,
    Synchronisation: BYTE,
    FunctionID: (0, ref_array_napi_1.default)(BYTE, 2),
    InspectionLevel: BYTE,
    VendorID: (0, ref_array_napi_1.default)(BYTE, 2),
    DeviceID: (0, ref_array_napi_1.default)(BYTE, 3),
    SerialNumber: (0, ref_array_napi_1.default)(BYTE, 16),
    InputLength: BYTE,
    OutputLength: BYTE,
});
// ============================================================================
// DLL LOADING
// ============================================================================
const iolinkDll = ffi.Library(__dirname +
    '/../../TMG_USB_IO-Link_Interface_V2_DLL/Sample_x64/Sample_C/SimpleApplication/TMGIOLUSBIF20_64.dll', {
    // Core master functions
    IOL_GetUSBDevices: [LONG, [ref.refType(TDeviceIdentification), LONG]],
    IOL_Create: [LONG, [ref.types.CString]],
    IOL_Destroy: [LONG, [LONG]],
    // Port configuration and status
    IOL_GetModeEx: [LONG, [LONG, DWORD, ref.refType(TInfoEx), ref.types.bool]],
    IOL_GetSensorStatus: [LONG, [LONG, DWORD, ref.refType(DWORD)]],
    IOL_GetPortConfig: [LONG, [LONG, DWORD, ref.refType(TPortConfiguration)]],
    IOL_SetPortConfig: [LONG, [LONG, DWORD, ref.refType(TPortConfiguration)]],
    // Parameter communication (ISDU)
    IOL_ReadReq: [LONG, [LONG, DWORD, ref.refType(TParameter)]],
    IOL_WriteReq: [LONG, [LONG, DWORD, ref.refType(TParameter)]],
    // Process data communication
    IOL_ReadInputs: [
        LONG,
        [LONG, DWORD, ref.refType(BYTE), ref.refType(DWORD), ref.refType(DWORD)],
    ],
    IOL_WriteOutputs: [LONG, [LONG, DWORD, ref.refType(BYTE), DWORD]],
});
// ============================================================================
// IO-LINK SERVICE CLASS
// ============================================================================
class IOLinkService {
    constructor() {
        this.masterStates = new Map();
        this.globalMasterRegistry = new Map();
    }
    // ============================================================================
    // UTILITY METHODS
    // ============================================================================
    checkReturnCode(returnCode, operation) {
        if (returnCode !== constants_1.RETURN_CODES.RETURN_OK) {
            const error = new Error(`${operation} failed with code: ${returnCode}`);
            error.code = returnCode;
            throw error;
        }
    }
    extractString(arrayField) {
        try {
            if (!arrayField)
                return 'Unknown';
            const buffer = Buffer.isBuffer(arrayField)
                ? arrayField
                : Buffer.from(arrayField);
            let length = 0;
            while (length < buffer.length && buffer[length] !== 0)
                length++;
            return buffer.slice(0, length).toString('utf8').trim() || 'Unknown';
        }
        catch (e) {
            return 'Unknown';
        }
    }
    getVendorName(vendorId) {
        const vendors = {
            0x0001: 'SICK AG',
            0x0002: 'Balluff',
            0x0003: 'ifm electronic',
            0x0004: 'Turck',
            0x0005: 'Pepperl+Fuchs',
            0x0006: 'OMRON',
            0x0007: 'Baumer',
            0x0008: 'Banner Engineering',
            0x0009: 'Leuze electronic',
            0x000a: 'Vendor_A',
        };
        return vendors[vendorId] || `Vendor_${vendorId.toString(16).toUpperCase()}`;
    }
    getDeviceName(vendorId, deviceId) {
        const deviceMappings = {
            '0x000A': {
                '0x0A2B11': 'Temperature Sensor',
            },
        };
        const vendorKey = `0x${vendorId.toString(16).toUpperCase().padStart(4, '0')}`;
        const deviceKey = `0x${deviceId.toString(16).toUpperCase().padStart(6, '0')}`;
        if (deviceMappings[vendorKey] && deviceMappings[vendorKey][deviceKey]) {
            return deviceMappings[vendorKey][deviceKey];
        }
        return `Device_${deviceId.toString(16).toUpperCase()}`;
    }
    parseDeviceInfoFromDPP(dpp, port) {
        try {
            if (!dpp || dpp.length < 16) {
                return null;
            }
            const vendorId = (dpp[0] << 8) | dpp[1];
            const deviceId = (dpp[2] << 16) | (dpp[3] << 8) | dpp[4];
            const functionId = (dpp[5] << 8) | dpp[6];
            const revisionId = dpp[8];
            const pdInLength = dpp[9];
            const pdOutLength = dpp[10];
            return {
                port: port,
                vendorId: `0x${vendorId.toString(16).toUpperCase().padStart(4, '0')}`,
                deviceId: `0x${deviceId.toString(16).toUpperCase().padStart(6, '0')}`,
                functionId: `0x${functionId.toString(16).toUpperCase().padStart(4, '0')}`,
                revisionId: `0x${revisionId.toString(16).toUpperCase().padStart(2, '0')}`,
                vendorName: this.getVendorName(vendorId),
                deviceName: this.getDeviceName(vendorId, deviceId),
                processDataInputLength: pdInLength,
                processDataOutputLength: pdOutLength,
            };
        }
        catch (error) {
            logger_1.default.error(`Error parsing device info from DPP: ${error.message}`);
            return null;
        }
    }
    // ============================================================================
    // MASTER DISCOVERY AND CONNECTION
    // ============================================================================
    async discoverMasters() {
        const maxDevices = 5;
        logger_1.default.info('Searching for IO-Link Master devices...');
        try {
            const structSize = TDeviceIdentification.size;
            const bufferSize = structSize * maxDevices;
            const deviceBuffer = Buffer.alloc(bufferSize);
            const numDevices = iolinkDll.IOL_GetUSBDevices(deviceBuffer, maxDevices);
            logger_1.default.info(`Found ${numDevices} device(s)`);
            if (numDevices <= 0) {
                return [];
            }
            const discoveredMasters = [];
            for (let i = 0; i < numDevices; i++) {
                try {
                    const offset = i * structSize;
                    const deviceSlice = deviceBuffer.slice(offset, offset + structSize);
                    const device = ref.get(deviceSlice, 0, TDeviceIdentification);
                    if (!device)
                        continue;
                    const master = {
                        name: this.extractString(device.Name),
                        productCode: this.extractString(device.ProductCode),
                        viewName: this.extractString(device.ViewName),
                        index: i,
                    };
                    if (master.name &&
                        master.name !== 'Unknown' &&
                        master.name.trim() !== '') {
                        discoveredMasters.push(master);
                        logger_1.default.info(`Found Master: ${master.name} (${master.productCode})`);
                    }
                }
                catch (err) {
                    logger_1.default.error(`Error processing device ${i}:`, err.message);
                }
            }
            return discoveredMasters;
        }
        catch (error) {
            logger_1.default.error(`Error discovering masters: ${error.message}`);
            throw error;
        }
    }
    async connectToMaster(deviceName) {
        try {
            logger_1.default.info(`Connecting to master: ${deviceName}`);
            const handle = iolinkDll.IOL_Create(deviceName);
            if (handle <= 0) {
                throw new Error(`Failed to connect to device: ${deviceName} (handle: ${handle})`);
            }
            const masterState = {
                handle: handle,
                deviceName: deviceName,
                ports: new Map(),
                initialized: true,
                configurationComplete: false,
            };
            this.masterStates.set(handle, masterState);
            this.globalMasterRegistry.set(deviceName, { handle, connected: true });
            logger_1.default.info(`Successfully connected to master ${deviceName} with handle ${handle}`);
            return handle;
        }
        catch (error) {
            logger_1.default.error(`Failed to connect to master ${deviceName}: ${error.message}`);
            throw error;
        }
    }
    async disconnectFromMaster(handle) {
        try {
            const masterState = this.masterStates.get(handle);
            if (!masterState) {
                throw new Error(`No master found with handle ${handle}`);
            }
            logger_1.default.info(`Disconnecting from master: ${masterState.deviceName}`);
            for (const [portNumber] of masterState.ports) {
                await this.clearPortConfiguration(handle, portNumber);
            }
            const result = iolinkDll.IOL_Destroy(handle);
            this.checkReturnCode(result, `Disconnect from master ${masterState.deviceName}`);
            this.globalMasterRegistry.delete(masterState.deviceName);
            this.masterStates.delete(handle);
            logger_1.default.info(`Successfully disconnected from master ${masterState.deviceName}`);
            return true;
        }
        catch (error) {
            logger_1.default.error(`Failed to disconnect from master: ${error.message}`);
            throw error;
        }
    }
    // ============================================================================
    // PORT CONFIGURATION
    // ============================================================================
    async clearPortConfiguration(handle, port) {
        try {
            const clearConfig = new TPortConfiguration();
            clearConfig.PortModeDetails = 0;
            clearConfig.TargetMode = 0;
            clearConfig.CRID = 0;
            clearConfig.DSConfigure = 0;
            clearConfig.Synchronisation = 0;
            clearConfig.FunctionID[0] = 0;
            clearConfig.FunctionID[1] = 0;
            clearConfig.InspectionLevel = 0;
            clearConfig.VendorID[0] = 0;
            clearConfig.VendorID[1] = 0;
            clearConfig.DeviceID[0] = 0;
            clearConfig.DeviceID[1] = 0;
            clearConfig.DeviceID[2] = 0;
            clearConfig.InputLength = 0;
            clearConfig.OutputLength = 0;
            const result = iolinkDll.IOL_SetPortConfig(handle, port - 1, clearConfig.ref());
            this.checkReturnCode(result, `Clear port ${port} configuration`);
            return true;
        }
        catch (error) {
            logger_1.default.error(`Error clearing port ${port} configuration: ${error.message}`);
            throw error;
        }
    }
    async checkPortStatus(handle, port) {
        try {
            const infoEx = new TInfoEx();
            const result = iolinkDll.IOL_GetModeEx(handle, port - 1, infoEx.ref(), true);
            this.checkReturnCode(result, `Get port ${port} status`);
            const isConnected = (infoEx.SensorStatus & constants_1.SENSOR_STATUS.BIT_CONNECTED) !== 0;
            const isPreoperate = (infoEx.SensorStatus & constants_1.SENSOR_STATUS.BIT_PREOPERATE) !== 0;
            const isWrongSensor = (infoEx.SensorStatus & constants_1.SENSOR_STATUS.BIT_WRONGSENSOR) !== 0;
            let connectionState = 'DISCONNECTED';
            if (isConnected)
                connectionState = 'OPERATE';
            else if (isPreoperate)
                connectionState = 'PREOPERATE';
            else if (isWrongSensor)
                connectionState = 'WRONG_DEVICE';
            return {
                port: port,
                connected: isConnected || isPreoperate,
                mode: connectionState,
                actualMode: infoEx.ActualMode,
                sensorStatus: infoEx.SensorStatus,
                baudrate: infoEx.CurrentBaudrate,
                directParameterPage: Buffer.from(infoEx.DirectParameterPage).slice(0, 16),
                timestamp: new Date(),
            };
        }
        catch (error) {
            logger_1.default.error(`Error checking port ${port} status: ${error.message}`);
            throw error;
        }
    }
    // ============================================================================
    // PROCESS DATA COMMUNICATION
    // ============================================================================
    async readProcessData(handle, port, maxLength = 32) {
        try {
            const buffer = Buffer.alloc(maxLength);
            const length = ref.alloc(DWORD, maxLength);
            const status = ref.alloc(DWORD);
            const result = iolinkDll.IOL_ReadInputs(handle, port - 1, buffer, length, status);
            this.checkReturnCode(result, `Read process data from port ${port}`);
            const actualLength = length.deref();
            return {
                data: buffer.slice(0, actualLength),
                status: status.deref(),
                port: port,
                timestamp: new Date(),
            };
        }
        catch (error) {
            logger_1.default.error(`Error reading process data from port ${port}: ${error.message}`);
            throw error;
        }
    }
    async writeProcessData(handle, port, data) {
        try {
            const buffer = data instanceof Buffer ? data : Buffer.from(data);
            const result = iolinkDll.IOL_WriteOutputs(handle, port - 1, buffer, buffer.length);
            this.checkReturnCode(result, `Write process data to port ${port}`);
            return {
                success: true,
                bytesWritten: buffer.length,
                port: port,
                timestamp: new Date(),
            };
        }
        catch (error) {
            logger_1.default.error(`Error writing process data to port ${port}: ${error.message}`);
            throw error;
        }
    }
    // ============================================================================
    // PARAMETER COMMUNICATION (ISDU)
    // ============================================================================
    async readParameter(handle, port, index, subIndex = 0) {
        try {
            const parameter = new TParameter();
            parameter.Index = index;
            parameter.SubIndex = subIndex;
            parameter.Length = 0;
            const result = iolinkDll.IOL_ReadReq(handle, port - 1, parameter.ref());
            this.checkReturnCode(result, `Read parameter ${index}.${subIndex} from port ${port}`);
            if (parameter.ErrorCode !== 0) {
                throw new Error(`IO-Link parameter read error: Code=${parameter.ErrorCode}, Additional=${parameter.AdditionalCode}`);
            }
            return {
                index: parameter.Index,
                subIndex: parameter.SubIndex,
                length: parameter.Length,
                data: Buffer.from(parameter.Result).slice(0, parameter.Length),
                errorCode: parameter.ErrorCode,
                additionalCode: parameter.AdditionalCode,
                port: port,
                timestamp: new Date(),
            };
        }
        catch (error) {
            logger_1.default.error(`Failed to read parameter ${index}.${subIndex} from port ${port}: ${error.message}`);
            throw error;
        }
    }
    async writeParameter(handle, port, index, subIndex = 0, data) {
        try {
            const parameter = new TParameter();
            parameter.Index = index;
            parameter.SubIndex = subIndex;
            parameter.Length = data.length;
            const dataBuffer = data instanceof Buffer ? data : Buffer.from(data);
            dataBuffer.copy(Buffer.from(parameter.Result), 0, 0, Math.min(dataBuffer.length, 256));
            const result = iolinkDll.IOL_WriteReq(handle, port - 1, parameter.ref());
            this.checkReturnCode(result, `Write parameter ${index}.${subIndex} to port ${port}`);
            if (parameter.ErrorCode !== 0) {
                throw new Error(`IO-Link parameter write error: Code=${parameter.ErrorCode}, Additional=${parameter.AdditionalCode}`);
            }
            return {
                index: parameter.Index,
                subIndex: parameter.SubIndex,
                length: parameter.Length,
                errorCode: parameter.ErrorCode,
                additionalCode: parameter.AdditionalCode,
                port: port,
                timestamp: new Date(),
                success: true,
            };
        }
        catch (error) {
            logger_1.default.error(`Failed to write parameter ${index}.${subIndex} to port ${port}: ${error.message}`);
            throw error;
        }
    }
}
exports.default = IOLinkService;
//# sourceMappingURL=IOLinkService.js.map