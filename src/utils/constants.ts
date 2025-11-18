/**
 * Constants
 * All IO-Link related constants and enumerations
 * 
 */

// ============================================================================
// DLL RETURN CODES
// ============================================================================

export const RETURN_CODES = {
  RETURN_OK: 0,
  RETURN_INTERNAL_ERROR: -1,
  RETURN_DEVICE_NOT_AVAILABLE: -2,
  RETURN_UNKNOWN_HANDLE: -7,
  RETURN_WRONG_PARAMETER: -10,
} as const;

export type ReturnCode = typeof RETURN_CODES[keyof typeof RETURN_CODES];

export const RETURN_CODE_MESSAGES: Record<number, string> = {
  [RETURN_CODES.RETURN_OK]: 'Operation successful',
  [RETURN_CODES.RETURN_INTERNAL_ERROR]: 'Internal DLL error',
  [RETURN_CODES.RETURN_DEVICE_NOT_AVAILABLE]: 'Device not available',
  [RETURN_CODES.RETURN_UNKNOWN_HANDLE]: 'Unknown handle',
  [RETURN_CODES.RETURN_WRONG_PARAMETER]: 'Wrong parameter',
};

// ============================================================================
// PORT MODES
// ============================================================================

export const PORT_MODES = {
  SM_MODE_RESET: 0,
  SM_MODE_IOLINK_PREOP: 1,
  SM_MODE_SIO_INPUT: 3,
  SM_MODE_SIO_OUTPUT: 4,
  SM_MODE_IOLINK_OPERATE: 12,
} as const;

export type PortMode = typeof PORT_MODES[keyof typeof PORT_MODES];

export const PORT_MODE_NAMES: Record<number, string> = {
  [PORT_MODES.SM_MODE_RESET]: 'RESET',
  [PORT_MODES.SM_MODE_IOLINK_PREOP]: 'IO-LINK_PREOPERATE',
  [PORT_MODES.SM_MODE_SIO_INPUT]: 'SIO_INPUT',
  [PORT_MODES.SM_MODE_SIO_OUTPUT]: 'SIO_OUTPUT',
  [PORT_MODES.SM_MODE_IOLINK_OPERATE]: 'IO-LINK_OPERATE',
};

// ============================================================================
// SENSOR STATUS FLAGS
// ============================================================================

export const SENSOR_STATUS = {
  BIT_CONNECTED: 0x01,
  BIT_PREOPERATE: 0x02,
  BIT_EVENTAVAILABLE: 0x04,
  BIT_PDVALID: 0x08,
  BIT_WRONGSENSOR: 0x10,
  BIT_SENSORSTATEKNOWN: 0x80,
} as const;

export type SensorStatus = typeof SENSOR_STATUS[keyof typeof SENSOR_STATUS];

export const SENSOR_STATUS_NAMES: Record<number, string> = {
  [SENSOR_STATUS.BIT_CONNECTED]: 'CONNECTED',
  [SENSOR_STATUS.BIT_PREOPERATE]: 'PREOPERATE',
  [SENSOR_STATUS.BIT_EVENTAVAILABLE]: 'EVENT_AVAILABLE',
  [SENSOR_STATUS.BIT_PDVALID]: 'PROCESS_DATA_VALID',
  [SENSOR_STATUS.BIT_WRONGSENSOR]: 'WRONG_SENSOR',
  [SENSOR_STATUS.BIT_SENSORSTATEKNOWN]: 'SENSOR_STATE_KNOWN',
};

// ============================================================================
// VALIDATION MODES
// ============================================================================

export const VALIDATION_MODES = {
  SM_VALIDATION_MODE_NONE: 0,
  SM_VALIDATION_MODE_COMPATIBLE: 1,
  SM_VALIDATION_MODE_IDENTICAL: 2,
} as const;

export type ValidationMode = typeof VALIDATION_MODES[keyof typeof VALIDATION_MODES];

export const VALIDATION_MODE_NAMES: Record<number, string> = {
  [VALIDATION_MODES.SM_VALIDATION_MODE_NONE]: 'NONE',
  [VALIDATION_MODES.SM_VALIDATION_MODE_COMPATIBLE]: 'COMPATIBLE',
  [VALIDATION_MODES.SM_VALIDATION_MODE_IDENTICAL]: 'IDENTICAL',
};

// ============================================================================
// STANDARD IO-LINK PARAMETER INDICES
// ============================================================================

export const PARAMETER_INDEX = {
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
} as const;

export type ParameterIndex = typeof PARAMETER_INDEX[keyof typeof PARAMETER_INDEX];

export interface ParameterDefinition {
  name: string;
  description: string;
  dataType: string;
  access: 'r' | 'w' | 'rw';
  length: number;
  unit?: string;
}

export const STANDARD_PARAMETERS: Record<number, ParameterDefinition> = {
  [PARAMETER_INDEX.VENDOR_NAME]: {
    name: 'Vendor Name',
    description: 'Name of the device vendor',
    dataType: 'string',
    access: 'r',
    length: 64,
  },
  [PARAMETER_INDEX.VENDOR_TEXT]: {
    name: 'Vendor Text',
    description: 'Additional vendor information',
    dataType: 'string',
    access: 'r',
    length: 64,
  },
  [PARAMETER_INDEX.PRODUCT_NAME]: {
    name: 'Product Name',
    description: 'Name of the product',
    dataType: 'string',
    access: 'r',
    length: 64,
  },
  [PARAMETER_INDEX.PRODUCT_ID]: {
    name: 'Product ID',
    description: 'Unique product identifier',
    dataType: 'uint32',
    access: 'r',
    length: 4,
  },
  [PARAMETER_INDEX.PRODUCT_TEXT]: {
    name: 'Product Text',
    description: 'Additional product information',
    dataType: 'string',
    access: 'r',
    length: 64,
  },
  [PARAMETER_INDEX.SERIAL_NUMBER]: {
    name: 'Serial Number',
    description: 'Device serial number',
    dataType: 'string',
    access: 'r',
    length: 16,
  },
  [PARAMETER_INDEX.HARDWARE_REVISION]: {
    name: 'Hardware Revision',
    description: 'Hardware revision information',
    dataType: 'string',
    access: 'r',
    length: 16,
  },
  [PARAMETER_INDEX.FIRMWARE_REVISION]: {
    name: 'Firmware Revision',
    description: 'Firmware revision information',
    dataType: 'string',
    access: 'r',
    length: 16,
  },
  [PARAMETER_INDEX.APPLICATION_SPECIFIC_NAME]: {
    name: 'Application Specific Name',
    description: 'Application-specific device name',
    dataType: 'string',
    access: 'rw',
    length: 64,
  },
  [PARAMETER_INDEX.FUNCTION_TAG]: {
    name: 'Function Tag',
    description: 'Function tag for device identification',
    dataType: 'string',
    access: 'rw',
    length: 32,
  },
  [PARAMETER_INDEX.LOCATION_TAG]: {
    name: 'Location Tag',
    description: 'Location tag for device identification',
    dataType: 'string',
    access: 'rw',
    length: 32,
  },
  [PARAMETER_INDEX.MIN_CYCLE_TIME]: {
    name: 'Minimum Cycle Time',
    description: 'Minimum cycle time in 0.1ms units',
    dataType: 'uint8',
    access: 'r',
    length: 1,
    unit: '0.1ms',
  },
  [PARAMETER_INDEX.REVISION_ID]: {
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

export const VENDOR_IDS: Record<number, string> = {
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

export const CONNECTION_STATES = {
  DISCONNECTED: 'DISCONNECTED',
  DETECTED: 'DETECTED',
  PREOPERATE: 'PREOPERATE',
  OPERATE: 'OPERATE',
  WRONG_DEVICE: 'WRONG_DEVICE',
  ERROR: 'ERROR',
} as const;

export type ConnectionState = typeof CONNECTION_STATES[keyof typeof CONNECTION_STATES];

// ============================================================================
// API RESPONSE CODES
// ============================================================================

export const API_ERROR_CODES = {
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
} as const;

export type ApiErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES];

// ============================================================================
// LIMITS AND DEFAULTS
// ============================================================================

export const LIMITS = {
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
} as const;

// ============================================================================
// DATA TYPES
// ============================================================================

export const DATA_TYPES = {
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
} as const;

export type DataType = typeof DATA_TYPES[keyof typeof DATA_TYPES];

export const DATA_TYPE_SIZES: Record<string, number> = {
  [DATA_TYPES.UINT8]: 1,
  [DATA_TYPES.INT8]: 1,
  [DATA_TYPES.UINT16]: 2,
  [DATA_TYPES.INT16]: 2,
  [DATA_TYPES.UINT32]: 4,
  [DATA_TYPES.INT32]: 4,
  [DATA_TYPES.FLOAT32]: 4,
  [DATA_TYPES.FLOAT64]: 8,
  [DATA_TYPES.BOOLEAN]: 1,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getReturnCodeMessage(code: number): string {
  return RETURN_CODE_MESSAGES[code] || `Unknown error code: ${code}`;
}

export function getPortModeName(mode: number): string {
  return PORT_MODE_NAMES[mode] || `Unknown mode: ${mode}`;
}

export function getVendorName(vendorId: number): string {
  return (
    VENDOR_IDS[vendorId] ||
    `Unknown Vendor (0x${vendorId.toString(16).toUpperCase().padStart(4, '0')})`
  );
}

export function parseSensorStatus(status: number): string[] {
  const flags: string[] = [];
  Object.entries(SENSOR_STATUS).forEach(([key, value]) => {
    if (status & value) {
      flags.push(SENSOR_STATUS_NAMES[value] || key);
    }
  });
  return flags;
}

export function isValidPort(port: number): boolean {
  return (
    Number.isInteger(port) &&
    port >= LIMITS.MIN_PORT &&
    port <= LIMITS.MAX_PORTS
  );
}

export function isValidDataType(dataType: string): boolean {
  return Object.values(DATA_TYPES).includes(dataType as any);
}
