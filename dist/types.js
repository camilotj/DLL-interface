"use strict";
/**
 * Type definitions for IO-Link Interface
 * Consolidated types for FFI bindings, structs, and application data
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MasterState = exports.PortState = exports.PARAMETER_INDEX = exports.VALIDATION_MODES = exports.SENSOR_STATUS = exports.PORT_MODES = exports.RETURN_CODES = void 0;
// ============================================================================
// CONSTANTS
// ============================================================================
exports.RETURN_CODES = {
    RETURN_OK: 0,
    RETURN_INTERNAL_ERROR: -1,
    RETURN_DEVICE_NOT_AVAILABLE: -2,
    RETURN_UNKNOWN_HANDLE: -7,
    RETURN_WRONG_PARAMETER: -10,
};
exports.PORT_MODES = {
    SM_MODE_RESET: 0,
    SM_MODE_IOLINK_PREOP: 1,
    SM_MODE_SIO_INPUT: 3,
    SM_MODE_SIO_OUTPUT: 4,
    SM_MODE_IOLINK_OPERATE: 12,
};
exports.SENSOR_STATUS = {
    BIT_CONNECTED: 0x01,
    BIT_PREOPERATE: 0x02,
    BIT_WRONGSENSOR: 0x10,
    BIT_EVENTAVAILABLE: 0x04,
    BIT_PDVALID: 0x08,
    BIT_SENSORSTATEKNOWN: 0x80,
};
exports.VALIDATION_MODES = {
    SM_VALIDATION_MODE_NONE: 0,
    SM_VALIDATION_MODE_COMPATIBLE: 1,
    SM_VALIDATION_MODE_IDENTICAL: 2,
};
exports.PARAMETER_INDEX = {
    DIRECT_PARAMETER_PAGE: 0,
    MIN_CYCLE_TIME: 2,
    MSEQUENCE_CAPABILITY: 3,
    VENDOR_NAME: 10,
    VENDOR_TEXT: 11,
    PRODUCT_NAME: 12,
    PRODUCT_ID: 13,
    PRODUCT_TEXT: 14,
    SERIAL_NUMBER: 15,
    HARDWARE_REVISION: 16,
    FIRMWARE_REVISION: 17,
    APPLICATION_SPECIFIC_NAME: 18,
};
// ============================================================================
// STATE MANAGEMENT TYPES
// ============================================================================
class PortState {
    constructor(portNumber) {
        this.configured = false;
        this.targetMode = exports.PORT_MODES.SM_MODE_RESET;
        this.actualMode = exports.PORT_MODES.SM_MODE_RESET;
        this.deviceInfo = null;
        this.lastStatusCheck = 0;
        this.configurationTimestamp = 0;
        this.configurationAttempts = 0;
        this.lastConfigurationHash = null;
        this.sessionId = Date.now();
        this.portNumber = portNumber;
    }
    needsReconfiguration(targetMode, crid, inspectionLevel) {
        const configHash = `${targetMode}-${crid}-${inspectionLevel}`;
        return (!this.configured ||
            this.lastConfigurationHash !== configHash ||
            this.configurationAttempts === 0);
    }
    markConfigured(targetMode, crid, inspectionLevel) {
        this.configured = true;
        this.targetMode = targetMode;
        this.configurationTimestamp = Date.now();
        this.configurationAttempts++;
        this.lastConfigurationHash = `${targetMode}-${crid}-${inspectionLevel}`;
    }
}
exports.PortState = PortState;
class MasterState {
    constructor(handle, deviceName) {
        this.ports = new Map();
        this.initialized = false;
        this.configurationComplete = false;
        this.handle = handle;
        this.deviceName = deviceName;
    }
}
exports.MasterState = MasterState;
//# sourceMappingURL=types.js.map