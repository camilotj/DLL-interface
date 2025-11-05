/**
 * Type definitions for IO-Link Interface
 * Consolidated types for FFI bindings, structs, and application data
 */

import { Pointer } from 'ref-napi';

// ============================================================================
// PRIMITIVE TYPES
// ============================================================================

export type BYTE = number;
export type WORD = number;
export type LONG = number;
export type DWORD = number;

// ============================================================================
// STRUCT INTERFACES
// ============================================================================

export interface TBLOBStatus {
  executedState: BYTE;
  errorCode: BYTE;
  additionalCode: BYTE;
  dllReturnValue: LONG;
  Position: DWORD;
  PercentComplete: BYTE;
  nextState: BYTE;
}

export interface TDeviceIdentification {
  Name: Buffer;
  ProductCode: Buffer;
  ViewName: Buffer;
}

export interface TInfoEx {
  COM: Buffer;
  DirectParameterPage: Buffer;
  ActualMode: BYTE;
  SensorStatus: BYTE;
  CurrentBaudrate: BYTE;
}

export interface TParameter {
  Result: Buffer;
  Index: WORD;
  SubIndex: BYTE;
  Length: BYTE;
  ErrorCode: BYTE;
  AdditionalCode: BYTE;
}

export interface TPortConfiguration {
  PortModeDetails: BYTE;
  TargetMode: BYTE;
  CRID: BYTE;
  DSConfigure: BYTE;
  Synchronisation: BYTE;
  FunctionID: Buffer;
  InspectionLevel: BYTE;
  VendorID: Buffer;
  DeviceID: Buffer;
  SerialNumber: Buffer;
  InputLength: BYTE;
  OutputLength: BYTE;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const RETURN_CODES = {
  RETURN_OK: 0,
  RETURN_INTERNAL_ERROR: -1,
  RETURN_DEVICE_NOT_AVAILABLE: -2,
  RETURN_UNKNOWN_HANDLE: -7,
  RETURN_WRONG_PARAMETER: -10,
} as const;

export const PORT_MODES = {
  SM_MODE_RESET: 0,
  SM_MODE_IOLINK_PREOP: 1,
  SM_MODE_SIO_INPUT: 3,
  SM_MODE_SIO_OUTPUT: 4,
  SM_MODE_IOLINK_OPERATE: 12,
} as const;

export const SENSOR_STATUS = {
  BIT_CONNECTED: 0x01,
  BIT_PREOPERATE: 0x02,
  BIT_WRONGSENSOR: 0x10,
  BIT_EVENTAVAILABLE: 0x04,
  BIT_PDVALID: 0x08,
  BIT_SENSORSTATEKNOWN: 0x80,
} as const;

export const VALIDATION_MODES = {
  SM_VALIDATION_MODE_NONE: 0,
  SM_VALIDATION_MODE_COMPATIBLE: 1,
  SM_VALIDATION_MODE_IDENTICAL: 2,
} as const;

export const PARAMETER_INDEX = {
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
} as const;

// ============================================================================
// APPLICATION DATA TYPES
// ============================================================================

export interface MasterDevice {
  name: string;
  productCode: string;
  viewName: string;
}

export interface PortStatus {
  port: number;
  connected: boolean;
  mode: string;
  actualMode?: number;
  targetMode?: number;
  sensorStatus?: number;
  baudrate?: number;
  directParameterPage?: Buffer;
  configuredAt?: number;
  lastChecked?: number;
  error?: string;
}

export interface DeviceInfo {
  port: number;
  vendorId: string;
  deviceId: string;
  functionId?: string;
  revisionId?: string;
  vendorName: string;
  deviceName: string;
  serialNumber?: string;
  processDataInputLength: number;
  processDataOutputLength: number;
  vendorSpecific?: Buffer;
  status?: PortStatus;
}

export interface ProcessDataResult {
  data: Buffer;
  status: number;
  port: number;
  timestamp: Date;
}

export interface WriteResult {
  success: boolean;
  bytesWritten: number;
  port: number;
  timestamp: Date;
}

export interface ParameterResult {
  index: number;
  subIndex: number;
  length: number;
  data: Buffer;
  errorCode: number;
  additionalCode: number;
  port: number;
  timestamp: Date;
}

export interface ParameterWriteResult {
  index: number;
  subIndex: number;
  length: number;
  errorCode: number;
  additionalCode: number;
  port: number;
  timestamp: Date;
  success: boolean;
}

export interface BlobResult {
  data: Buffer;
  blobId: number;
  port: number;
  timestamp: Date;
}

export interface BlobWriteResult {
  success: boolean;
  blobId: number;
  bytesWritten: number;
  port: number;
  timestamp: Date;
}

export interface StreamData {
  data: Buffer;
  status: number;
  port: number;
  timestamp: Date;
  deviceInfo: DeviceInfo | null;
}

export type StreamCallback = (error: Error | null, data?: StreamData) => void;
export type StopStreamingFunction = () => void;

export interface MasterTopology {
  name: string;
  productCode: string;
  viewName: string;
  handle: number;
  connectedDevices: DeviceInfo[];
  totalDevices: number;
  initialized: boolean;
  ports?: number[];
  error?: string;
}

export interface NetworkTopology {
  masters: MasterTopology[];
}

// ============================================================================
// STATE MANAGEMENT TYPES
// ============================================================================

export class PortState {
  portNumber: number;
  configured: boolean = false;
  targetMode: number = PORT_MODES.SM_MODE_RESET;
  actualMode: number = PORT_MODES.SM_MODE_RESET;
  deviceInfo: DeviceInfo | null = null;
  lastStatusCheck: number = 0;
  configurationTimestamp: number = 0;
  configurationAttempts: number = 0;
  lastConfigurationHash: string | null = null;
  sessionId: number = Date.now();

  constructor(portNumber: number) {
    this.portNumber = portNumber;
  }

  needsReconfiguration(targetMode: number, crid: number, inspectionLevel: number): boolean {
    const configHash = `${targetMode}-${crid}-${inspectionLevel}`;
    return (
      !this.configured ||
      this.lastConfigurationHash !== configHash ||
      this.configurationAttempts === 0
    );
  }

  markConfigured(targetMode: number, crid: number, inspectionLevel: number): void {
    this.configured = true;
    this.targetMode = targetMode;
    this.configurationTimestamp = Date.now();
    this.configurationAttempts++;
    this.lastConfigurationHash = `${targetMode}-${crid}-${inspectionLevel}`;
  }
}

export class MasterState {
  handle: number;
  deviceName: string;
  ports: Map<number, PortState> = new Map();
  initialized: boolean = false;
  configurationComplete: boolean = false;

  constructor(handle: number, deviceName: string) {
    this.handle = handle;
    this.deviceName = deviceName;
  }
}

export interface MasterRegistryEntry {
  configured: boolean;
  lastConfigTime: number;
}

// ============================================================================
// FFI FUNCTION SIGNATURES
// ============================================================================

export interface IOLinkDLL {
  IOL_GetUSBDevices: (devices: Pointer<TDeviceIdentification>, maxDevices: LONG) => LONG;
  IOL_Create: (deviceName: string) => LONG;
  IOL_Destroy: (handle: LONG) => LONG;
  IOL_GetModeEx: (handle: LONG, port: DWORD, infoEx: Pointer<TInfoEx>, flag: boolean) => LONG;
  IOL_GetSensorStatus: (handle: LONG, port: DWORD, status: Pointer<DWORD>) => LONG;
  IOL_GetPortConfig: (handle: LONG, port: DWORD, config: Pointer<TPortConfiguration>) => LONG;
  IOL_SetPortConfig: (handle: LONG, port: DWORD, config: Pointer<TPortConfiguration>) => LONG;
  IOL_ReadReq: (handle: LONG, port: DWORD, parameter: Pointer<TParameter>) => LONG;
  IOL_WriteReq: (handle: LONG, port: DWORD, parameter: Pointer<TParameter>) => LONG;
  IOL_ReadInputs: (handle: LONG, port: DWORD, buffer: Pointer<BYTE>, length: Pointer<DWORD>, status: Pointer<DWORD>) => LONG;
  IOL_WriteOutputs: (handle: LONG, port: DWORD, buffer: Pointer<BYTE>, length: DWORD) => LONG;
  BLOB_uploadBLOB: (handle: LONG, port: DWORD, blobId: LONG, maxSize: DWORD, buffer: Pointer<BYTE>, lengthRead: Pointer<DWORD>, status: Pointer<TBLOBStatus>) => LONG;
  BLOB_downloadBLOB: (handle: LONG, port: DWORD, blobId: LONG, length: DWORD, buffer: Pointer<BYTE>, status: Pointer<TBLOBStatus>) => LONG;
  BLOB_Continue: (handle: LONG, port: DWORD, status: Pointer<TBLOBStatus>) => LONG;
  BLOB_ReadBlobID: (handle: LONG, port: DWORD, blobId: Pointer<LONG>, status: Pointer<TBLOBStatus>) => LONG;
}