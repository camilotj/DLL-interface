/**
 * Constants
 * All IO-Link related constants and enumerations
 *
 */
export declare const RETURN_CODES: {
    readonly RETURN_OK: 0;
    readonly RETURN_INTERNAL_ERROR: -1;
    readonly RETURN_DEVICE_NOT_AVAILABLE: -2;
    readonly RETURN_UNKNOWN_HANDLE: -7;
    readonly RETURN_WRONG_PARAMETER: -10;
};
export type ReturnCode = typeof RETURN_CODES[keyof typeof RETURN_CODES];
export declare const RETURN_CODE_MESSAGES: Record<number, string>;
export declare const PORT_MODES: {
    readonly SM_MODE_RESET: 0;
    readonly SM_MODE_IOLINK_PREOP: 1;
    readonly SM_MODE_SIO_INPUT: 3;
    readonly SM_MODE_SIO_OUTPUT: 4;
    readonly SM_MODE_IOLINK_OPERATE: 12;
};
export type PortMode = typeof PORT_MODES[keyof typeof PORT_MODES];
export declare const PORT_MODE_NAMES: Record<number, string>;
export declare const SENSOR_STATUS: {
    readonly BIT_CONNECTED: 1;
    readonly BIT_PREOPERATE: 2;
    readonly BIT_EVENTAVAILABLE: 4;
    readonly BIT_PDVALID: 8;
    readonly BIT_WRONGSENSOR: 16;
    readonly BIT_SENSORSTATEKNOWN: 128;
};
export type SensorStatus = typeof SENSOR_STATUS[keyof typeof SENSOR_STATUS];
export declare const SENSOR_STATUS_NAMES: Record<number, string>;
export declare const VALIDATION_MODES: {
    readonly SM_VALIDATION_MODE_NONE: 0;
    readonly SM_VALIDATION_MODE_COMPATIBLE: 1;
    readonly SM_VALIDATION_MODE_IDENTICAL: 2;
};
export type ValidationMode = typeof VALIDATION_MODES[keyof typeof VALIDATION_MODES];
export declare const VALIDATION_MODE_NAMES: Record<number, string>;
export declare const PARAMETER_INDEX: {
    readonly DIRECT_PARAMETER_PAGE: 0;
    readonly DEVICE_ACCESS_LOCKS: 1;
    readonly MIN_CYCLE_TIME: 2;
    readonly MSEQUENCE_CAPABILITY: 3;
    readonly REVISION_ID: 4;
    readonly TRANSMISSION_RATE: 5;
    readonly MASTER_COMMAND: 6;
    readonly MASTER_CYCLE_TIME: 7;
    readonly DATA_STORAGE: 8;
    readonly ALARM_MASK: 9;
    readonly VENDOR_NAME: 10;
    readonly VENDOR_TEXT: 11;
    readonly PRODUCT_NAME: 12;
    readonly PRODUCT_ID: 13;
    readonly PRODUCT_TEXT: 14;
    readonly SERIAL_NUMBER: 15;
    readonly HARDWARE_REVISION: 16;
    readonly FIRMWARE_REVISION: 17;
    readonly APPLICATION_SPECIFIC_NAME: 18;
    readonly FUNCTION_TAG: 19;
    readonly LOCATION_TAG: 20;
};
export type ParameterIndex = typeof PARAMETER_INDEX[keyof typeof PARAMETER_INDEX];
export interface ParameterDefinition {
    name: string;
    description: string;
    dataType: string;
    access: 'r' | 'w' | 'rw';
    length: number;
    unit?: string;
}
export declare const STANDARD_PARAMETERS: Record<number, ParameterDefinition>;
export declare const VENDOR_IDS: Record<number, string>;
export declare const CONNECTION_STATES: {
    readonly DISCONNECTED: "DISCONNECTED";
    readonly DETECTED: "DETECTED";
    readonly PREOPERATE: "PREOPERATE";
    readonly OPERATE: "OPERATE";
    readonly WRONG_DEVICE: "WRONG_DEVICE";
    readonly ERROR: "ERROR";
};
export type ConnectionState = typeof CONNECTION_STATES[keyof typeof CONNECTION_STATES];
export declare const API_ERROR_CODES: {
    readonly INVALID_REQUEST: "INVALID_REQUEST";
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
    readonly DEVICE_NOT_FOUND: "DEVICE_NOT_FOUND";
    readonly DEVICE_NOT_CONNECTED: "DEVICE_NOT_CONNECTED";
    readonly DEVICE_COMMUNICATION_ERROR: "DEVICE_COMMUNICATION_ERROR";
    readonly MASTER_NOT_FOUND: "MASTER_NOT_FOUND";
    readonly MASTER_CONNECTION_ERROR: "MASTER_CONNECTION_ERROR";
    readonly MASTER_NOT_INITIALIZED: "MASTER_NOT_INITIALIZED";
    readonly PARAMETER_NOT_FOUND: "PARAMETER_NOT_FOUND";
    readonly PARAMETER_READ_ONLY: "PARAMETER_READ_ONLY";
    readonly PARAMETER_WRITE_ONLY: "PARAMETER_WRITE_ONLY";
    readonly PARAMETER_VALUE_ERROR: "PARAMETER_VALUE_ERROR";
    readonly PROCESS_DATA_ERROR: "PROCESS_DATA_ERROR";
    readonly PROCESS_DATA_SIZE_MISMATCH: "PROCESS_DATA_SIZE_MISMATCH";
    readonly INVALID_PORT: "INVALID_PORT";
    readonly PORT_NOT_CONFIGURED: "PORT_NOT_CONFIGURED";
};
export type ApiErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES];
export declare const LIMITS: {
    readonly MAX_PORTS: 8;
    readonly MIN_PORT: 1;
    readonly MAX_PROCESS_DATA_LENGTH: 32;
    readonly MAX_PARAMETER_LENGTH: 256;
    readonly DEFAULT_TIMEOUT: 5000;
    readonly MAX_RETRY_ATTEMPTS: 3;
    readonly CACHE_TTL_PROCESS_DATA: 1000;
    readonly CACHE_TTL_PARAMETERS: 30000;
    readonly STREAM_INTERVAL_MIN: 100;
    readonly STREAM_INTERVAL_DEFAULT: 1000;
    readonly STREAM_INTERVAL_MAX: 60000;
};
export declare const DATA_TYPES: {
    readonly UINT8: "uint8";
    readonly UINT16: "uint16";
    readonly UINT32: "uint32";
    readonly INT8: "int8";
    readonly INT16: "int16";
    readonly INT32: "int32";
    readonly FLOAT32: "float32";
    readonly FLOAT64: "float64";
    readonly STRING: "string";
    readonly BYTES: "bytes";
    readonly BOOLEAN: "boolean";
};
export type DataType = typeof DATA_TYPES[keyof typeof DATA_TYPES];
export declare const DATA_TYPE_SIZES: Record<string, number>;
export declare function getReturnCodeMessage(code: number): string;
export declare function getPortModeName(mode: number): string;
export declare function getVendorName(vendorId: number): string;
export declare function parseSensorStatus(status: number): string[];
export declare function isValidPort(port: number): boolean;
export declare function isValidDataType(dataType: string): boolean;
//# sourceMappingURL=constants.d.ts.map