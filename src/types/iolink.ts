/**
 * IO-Link Interface Type Definitions
 * Based on TMG USB IO-Link Interface V2 DLL specifications
 * Following IEC 61131-9 specifications
 */

/**
 * BLOB Status Structure (from TMGIOLBlob.h)
 * Used for firmware update and BLOB transfer operations
 */
export interface TBLOBStatus {
  executedState: number;    // Current execution state
  errorCode: number;        // Error code if operation failed
  additionalCode: number;   // Additional error information
  dllReturnValue: number;   // DLL function return value
  Position: number;         // Current position in transfer
  PercentComplete: number;  // Percentage of completion (0-100)
  nextState: number;        // Next state to execute
}

/**
 * Device Identification Structure (from TMGIOLUSBIF20.h)
 * Identifies a USB IO-Link Master device
 */
export interface TDeviceIdentification {
  Name: number[];           // Device name (8 bytes)
  ProductCode: number[];    // Product code (16 bytes)
  ViewName: number[];       // Human-readable name (100 bytes)
}

/**
 * Extended Info Structure (from TMGIOLUSBIF20.h)
 * Provides detailed port status information
 */
export interface TInfoEx {
  COM: number[];            // Communication data (10 bytes)
  DirectParameterPage: number[]; // Direct parameter page (16 bytes)
  ActualMode: number;       // Current port mode
  SensorStatus: number;     // Sensor connection status
  CurrentBaudrate: number;  // Current communication baudrate
}

/**
 * Parameter Structure for ISDU (Indexed Service Data Unit) communication
 * Used for reading/writing device parameters (from TMGIOLUSBIF20.h)
 */
export interface TParameter {
  Result: number[];         // Parameter data (256 bytes)
  Index: number;            // Parameter index (WORD)
  SubIndex: number;         // Parameter sub-index
  Length: number;           // Data length
  ErrorCode: number;        // Error code from operation
  AdditionalCode: number;   // Additional error information
}

/**
 * Port Configuration Structure (from TMGIOLUSBIF20.h)
 * Configures port operating mode and device identification
 */
export interface TPortConfiguration {
  PortModeDetails: number;  // Port mode details
  TargetMode: number;       // Desired mode (12 = IO-Link Operate)
  CRID: number;             // Communication Request ID (0x11)
  DSConfigure: number;      // Device-specific configuration
  Synchronisation: number;  // Synchronization setting
  FunctionID: number[];     // Function ID (2 bytes)
  InspectionLevel: number;  // Inspection level
  VendorID: number[];       // Vendor ID (2 bytes)
  DeviceID: number[];       // Device ID (3 bytes)
  SerialNumber: number[];   // Serial number (16 bytes)
  InputLength: number;      // Process data input length
  OutputLength: number;     // Process data output length
}

/**
 * DLL Return Codes
 */
export const RETURN_CODES = {
  RETURN_OK: 0,
  RETURN_INTERNAL_ERROR: -1,
  RETURN_DEVICE_NOT_AVAILABLE: -2,
  RETURN_UNKNOWN_HANDLE: -7,        // Invalid connection handle
  RETURN_WRONG_PARAMETER: -10,
} as const;

export type ReturnCode = typeof RETURN_CODES[keyof typeof RETURN_CODES];

/**
 * Port Modes
 */
export const PORT_MODES = {
  DEACTIVATED: 0,
  DI: 1,                    // Digital Input
  DO: 2,                    // Digital Output
  IOLINK_AUTOSTART: 11,     // IO-Link Autostart
  IOLINK_OPERATE: 12,       // IO-Link Operate (normal operation)
} as const;

export type PortMode = typeof PORT_MODES[keyof typeof PORT_MODES];

/**
 * Sensor Status Values
 */
export const SENSOR_STATUS = {
  NO_SENSOR: 0,
  SENSOR_CONNECTED: 1,
  SENSOR_OPERATING: 2,
  COMMUNICATION_ERROR: 3,
} as const;

export type SensorStatus = typeof SENSOR_STATUS[keyof typeof SENSOR_STATUS];

/**
 * Master State
 */
export interface MasterState {
  handle: number;           // DLL connection handle
  deviceName: string;       // USB device name
  connected: boolean;       // Connection status
  ports: Map<number, PortState> | PortState[];  // Port states (Map for internal, Array for export)
  initialized?: boolean;    // Initialization flag
  configurationComplete?: boolean;  // Configuration completion flag
}

/**
 * Port State
 */
export interface PortState {
  portNumber: number;       // Port number (1-4)
  mode: PortMode;           // Current operating mode
  sensorStatus: SensorStatus; // Sensor connection status
  processDataIn: Buffer | null; // Last read process data
  processDataOut: Buffer | null; // Last written process data
}

/**
 * Device Information
 */
export interface DeviceInfo {
  vendorId: string;
  deviceId: string;
  serialNumber: string;
  productName: string;
}

/**
 * Parameter Read/Write Options
 */
export interface ParameterOptions {
  index: number;
  subIndex?: number;
  data?: Buffer;
}

/**
 * Streaming Configuration
 */
export interface StreamingConfig {
  portNumber: number;
  intervalMs: number;
  loggingMode?: number;
  bufferSize?: number;
}
