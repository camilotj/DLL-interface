"use strict";
/**
 * Constants - TypeScript Port
 * All IO-Link related constants and enumerations
 *
 * CRITICAL: Maintains exact constant values from JavaScript version
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DATA_TYPE_SIZES = exports.DATA_TYPES = exports.LIMITS = exports.API_ERROR_CODES = exports.CONNECTION_STATES = exports.VENDOR_IDS = exports.STANDARD_PARAMETERS = exports.PARAMETER_INDEX = exports.VALIDATION_MODE_NAMES = exports.VALIDATION_MODES = exports.SENSOR_STATUS_NAMES = exports.SENSOR_STATUS = exports.PORT_MODE_NAMES = exports.PORT_MODES = exports.RETURN_CODE_MESSAGES = exports.RETURN_CODES = void 0;
exports.getReturnCodeMessage = getReturnCodeMessage;
exports.getPortModeName = getPortModeName;
exports.getVendorName = getVendorName;
exports.parseSensorStatus = parseSensorStatus;
exports.isValidPort = isValidPort;
exports.isValidDataType = isValidDataType;
// ============================================================================
// DLL RETURN CODES
// ============================================================================
exports.RETURN_CODES = {
    RETURN_OK: 0,
    RETURN_INTERNAL_ERROR: -1,
    RETURN_DEVICE_NOT_AVAILABLE: -2,
    RETURN_UNKNOWN_HANDLE: -7,
    RETURN_WRONG_PARAMETER: -10,
};
exports.RETURN_CODE_MESSAGES = {
    [exports.RETURN_CODES.RETURN_OK]: 'Operation successful',
    [exports.RETURN_CODES.RETURN_INTERNAL_ERROR]: 'Internal DLL error',
    [exports.RETURN_CODES.RETURN_DEVICE_NOT_AVAILABLE]: 'Device not available',
    [exports.RETURN_CODES.RETURN_UNKNOWN_HANDLE]: 'Unknown handle',
    [exports.RETURN_CODES.RETURN_WRONG_PARAMETER]: 'Wrong parameter',
};
// ============================================================================
// PORT MODES
// ============================================================================
exports.PORT_MODES = {
    SM_MODE_RESET: 0,
    SM_MODE_IOLINK_PREOP: 1,
    SM_MODE_SIO_INPUT: 3,
    SM_MODE_SIO_OUTPUT: 4,
    SM_MODE_IOLINK_OPERATE: 12,
};
exports.PORT_MODE_NAMES = {
    [exports.PORT_MODES.SM_MODE_RESET]: 'RESET',
    [exports.PORT_MODES.SM_MODE_IOLINK_PREOP]: 'IO-LINK_PREOPERATE',
    [exports.PORT_MODES.SM_MODE_SIO_INPUT]: 'SIO_INPUT',
    [exports.PORT_MODES.SM_MODE_SIO_OUTPUT]: 'SIO_OUTPUT',
    [exports.PORT_MODES.SM_MODE_IOLINK_OPERATE]: 'IO-LINK_OPERATE',
};
// ============================================================================
// SENSOR STATUS FLAGS
// ============================================================================
exports.SENSOR_STATUS = {
    BIT_CONNECTED: 0x01,
    BIT_PREOPERATE: 0x02,
    BIT_EVENTAVAILABLE: 0x04,
    BIT_PDVALID: 0x08,
    BIT_WRONGSENSOR: 0x10,
    BIT_SENSORSTATEKNOWN: 0x80,
};
exports.SENSOR_STATUS_NAMES = {
    [exports.SENSOR_STATUS.BIT_CONNECTED]: 'CONNECTED',
    [exports.SENSOR_STATUS.BIT_PREOPERATE]: 'PREOPERATE',
    [exports.SENSOR_STATUS.BIT_EVENTAVAILABLE]: 'EVENT_AVAILABLE',
    [exports.SENSOR_STATUS.BIT_PDVALID]: 'PROCESS_DATA_VALID',
    [exports.SENSOR_STATUS.BIT_WRONGSENSOR]: 'WRONG_SENSOR',
    [exports.SENSOR_STATUS.BIT_SENSORSTATEKNOWN]: 'SENSOR_STATE_KNOWN',
};
// ============================================================================
// VALIDATION MODES
// ============================================================================
exports.VALIDATION_MODES = {
    SM_VALIDATION_MODE_NONE: 0,
    SM_VALIDATION_MODE_COMPATIBLE: 1,
    SM_VALIDATION_MODE_IDENTICAL: 2,
};
exports.VALIDATION_MODE_NAMES = {
    [exports.VALIDATION_MODES.SM_VALIDATION_MODE_NONE]: 'NONE',
    [exports.VALIDATION_MODES.SM_VALIDATION_MODE_COMPATIBLE]: 'COMPATIBLE',
    [exports.VALIDATION_MODES.SM_VALIDATION_MODE_IDENTICAL]: 'IDENTICAL',
};
// ============================================================================
// STANDARD IO-LINK PARAMETER INDICES
// ============================================================================
exports.PARAMETER_INDEX = {
    DIRECT_PARAMETER_PAGE: 0,
    DEVICE_ACCESS_LOCKS: 1,
    MIN_CYCLE_TIME: 2,
    MSEQUENCE_CAPABILITY: 3,
    REVISION_ID: 4,
    TRANSMISSION_RATE: 5,
    MASTER_COMMAND: 6,
    MASTER_CYCLE_TIME: 7,
    DATA_STORAGE: 8,
    ALARM_MASK: 9,
    VENDOR_NAME: 10,
    VENDOR_TEXT: 11,
    PRODUCT_NAME: 12,
    PRODUCT_ID: 13,
    PRODUCT_TEXT: 14,
    SERIAL_NUMBER: 15,
    HARDWARE_REVISION: 16,
    FIRMWARE_REVISION: 17,
    APPLICATION_SPECIFIC_NAME: 18,
    FUNCTION_TAG: 19,
    LOCATION_TAG: 20,
};
exports.STANDARD_PARAMETERS = {
    [exports.PARAMETER_INDEX.VENDOR_NAME]: {
        name: 'Vendor Name',
        description: 'Name of the device vendor',
        dataType: 'string',
        access: 'r',
        length: 64,
    },
    [exports.PARAMETER_INDEX.VENDOR_TEXT]: {
        name: 'Vendor Text',
        description: 'Additional vendor information',
        dataType: 'string',
        access: 'r',
        length: 64,
    },
    [exports.PARAMETER_INDEX.PRODUCT_NAME]: {
        name: 'Product Name',
        description: 'Name of the product',
        dataType: 'string',
        access: 'r',
        length: 64,
    },
    [exports.PARAMETER_INDEX.PRODUCT_ID]: {
        name: 'Product ID',
        description: 'Unique product identifier',
        dataType: 'uint32',
        access: 'r',
        length: 4,
    },
    [exports.PARAMETER_INDEX.PRODUCT_TEXT]: {
        name: 'Product Text',
        description: 'Additional product information',
        dataType: 'string',
        access: 'r',
        length: 64,
    },
    [exports.PARAMETER_INDEX.SERIAL_NUMBER]: {
        name: 'Serial Number',
        description: 'Device serial number',
        dataType: 'string',
        access: 'r',
        length: 16,
    },
    [exports.PARAMETER_INDEX.HARDWARE_REVISION]: {
        name: 'Hardware Revision',
        description: 'Hardware revision information',
        dataType: 'string',
        access: 'r',
        length: 16,
    },
    [exports.PARAMETER_INDEX.FIRMWARE_REVISION]: {
        name: 'Firmware Revision',
        description: 'Firmware revision information',
        dataType: 'string',
        access: 'r',
        length: 16,
    },
    [exports.PARAMETER_INDEX.APPLICATION_SPECIFIC_NAME]: {
        name: 'Application Specific Name',
        description: 'Application-specific device name',
        dataType: 'string',
        access: 'rw',
        length: 64,
    },
    [exports.PARAMETER_INDEX.FUNCTION_TAG]: {
        name: 'Function Tag',
        description: 'Function tag for device identification',
        dataType: 'string',
        access: 'rw',
        length: 32,
    },
    [exports.PARAMETER_INDEX.LOCATION_TAG]: {
        name: 'Location Tag',
        description: 'Location tag for device identification',
        dataType: 'string',
        access: 'rw',
        length: 32,
    },
    [exports.PARAMETER_INDEX.MIN_CYCLE_TIME]: {
        name: 'Minimum Cycle Time',
        description: 'Minimum cycle time in 0.1ms units',
        dataType: 'uint8',
        access: 'r',
        length: 1,
        unit: '0.1ms',
    },
    [exports.PARAMETER_INDEX.REVISION_ID]: {
        name: 'Revision ID',
        description: 'Device revision identifier',
        dataType: 'uint8',
        access: 'r',
        length: 1,
    },
};
// ============================================================================
// VENDOR IDENTIFIERS
// ============================================================================
exports.VENDOR_IDS = {
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
    0x0010: 'FESTO',
    0x0011: 'Siemens',
    0x0012: 'Phoenix Contact',
    0x0013: 'Weidmüller',
    0x0014: 'Murr Elektronik',
};
// ============================================================================
// CONNECTION STATES
// ============================================================================
exports.CONNECTION_STATES = {
    DISCONNECTED: 'DISCONNECTED',
    DETECTED: 'DETECTED',
    PREOPERATE: 'PREOPERATE',
    OPERATE: 'OPERATE',
    WRONG_DEVICE: 'WRONG_DEVICE',
    ERROR: 'ERROR',
};
// ============================================================================
// API RESPONSE CODES
// ============================================================================
exports.API_ERROR_CODES = {
    // General errors
    INVALID_REQUEST: 'INVALID_REQUEST',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    // Device errors
    DEVICE_NOT_FOUND: 'DEVICE_NOT_FOUND',
    DEVICE_NOT_CONNECTED: 'DEVICE_NOT_CONNECTED',
    DEVICE_COMMUNICATION_ERROR: 'DEVICE_COMMUNICATION_ERROR',
    // Master errors
    MASTER_NOT_FOUND: 'MASTER_NOT_FOUND',
    MASTER_CONNECTION_ERROR: 'MASTER_CONNECTION_ERROR',
    MASTER_NOT_INITIALIZED: 'MASTER_NOT_INITIALIZED',
    // Parameter errors
    PARAMETER_NOT_FOUND: 'PARAMETER_NOT_FOUND',
    PARAMETER_READ_ONLY: 'PARAMETER_READ_ONLY',
    PARAMETER_WRITE_ONLY: 'PARAMETER_WRITE_ONLY',
    PARAMETER_VALUE_ERROR: 'PARAMETER_VALUE_ERROR',
    // Process data errors
    PROCESS_DATA_ERROR: 'PROCESS_DATA_ERROR',
    PROCESS_DATA_SIZE_MISMATCH: 'PROCESS_DATA_SIZE_MISMATCH',
    // Port errors
    INVALID_PORT: 'INVALID_PORT',
    PORT_NOT_CONFIGURED: 'PORT_NOT_CONFIGURED',
};
// ============================================================================
// LIMITS AND DEFAULTS
// ============================================================================
exports.LIMITS = {
    MAX_PORTS: 8,
    MIN_PORT: 1,
    MAX_PROCESS_DATA_LENGTH: 32,
    MAX_PARAMETER_LENGTH: 256,
    DEFAULT_TIMEOUT: 5000,
    MAX_RETRY_ATTEMPTS: 3,
    CACHE_TTL_PROCESS_DATA: 1000,
    CACHE_TTL_PARAMETERS: 30000,
    STREAM_INTERVAL_MIN: 100,
    STREAM_INTERVAL_DEFAULT: 1000,
    STREAM_INTERVAL_MAX: 60000,
};
// ============================================================================
// DATA TYPES
// ============================================================================
exports.DATA_TYPES = {
    UINT8: 'uint8',
    UINT16: 'uint16',
    UINT32: 'uint32',
    INT8: 'int8',
    INT16: 'int16',
    INT32: 'int32',
    FLOAT32: 'float32',
    FLOAT64: 'float64',
    STRING: 'string',
    BYTES: 'bytes',
    BOOLEAN: 'boolean',
};
exports.DATA_TYPE_SIZES = {
    [exports.DATA_TYPES.UINT8]: 1,
    [exports.DATA_TYPES.INT8]: 1,
    [exports.DATA_TYPES.UINT16]: 2,
    [exports.DATA_TYPES.INT16]: 2,
    [exports.DATA_TYPES.UINT32]: 4,
    [exports.DATA_TYPES.INT32]: 4,
    [exports.DATA_TYPES.FLOAT32]: 4,
    [exports.DATA_TYPES.FLOAT64]: 8,
    [exports.DATA_TYPES.BOOLEAN]: 1,
};
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
function getReturnCodeMessage(code) {
    return exports.RETURN_CODE_MESSAGES[code] || `Unknown error code: ${code}`;
}
function getPortModeName(mode) {
    return exports.PORT_MODE_NAMES[mode] || `Unknown mode: ${mode}`;
}
function getVendorName(vendorId) {
    return (exports.VENDOR_IDS[vendorId] ||
        `Unknown Vendor (0x${vendorId.toString(16).toUpperCase().padStart(4, '0')})`);
}
function parseSensorStatus(status) {
    const flags = [];
    Object.entries(exports.SENSOR_STATUS).forEach(([key, value]) => {
        if (status & value) {
            flags.push(exports.SENSOR_STATUS_NAMES[value] || key);
        }
    });
    return flags;
}
function isValidPort(port) {
    return (Number.isInteger(port) &&
        port >= exports.LIMITS.MIN_PORT &&
        port <= exports.LIMITS.MAX_PORTS);
}
function isValidDataType(dataType) {
    return Object.values(exports.DATA_TYPES).includes(dataType);
}
//# sourceMappingURL=constants.js.map