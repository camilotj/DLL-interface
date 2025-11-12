"use strict";
/**
 * IO-Link Interface Type Definitions
 * Based on TMG USB IO-Link Interface V2 DLL specifications
 * Following IEC 61131-9 specifications
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SENSOR_STATUS = exports.PORT_MODES = exports.RETURN_CODES = void 0;
/**
 * DLL Return Codes
 */
exports.RETURN_CODES = {
    RETURN_OK: 0,
    RETURN_INTERNAL_ERROR: -1,
    RETURN_DEVICE_NOT_AVAILABLE: -2,
    RETURN_UNKNOWN_HANDLE: -7, // Invalid connection handle
    RETURN_WRONG_PARAMETER: -10,
};
/**
 * Port Modes
 */
exports.PORT_MODES = {
    DEACTIVATED: 0,
    DI: 1, // Digital Input
    DO: 2, // Digital Output
    IOLINK_AUTOSTART: 11, // IO-Link Autostart
    IOLINK_OPERATE: 12, // IO-Link Operate (normal operation)
};
/**
 * Sensor Status Values
 */
exports.SENSOR_STATUS = {
    NO_SENSOR: 0,
    SENSOR_CONNECTED: 1,
    SENSOR_OPERATING: 2,
    COMMUNICATION_ERROR: 3,
};
//# sourceMappingURL=iolink.js.map