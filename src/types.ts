import ffi from 'ffi-napi';
import ref from 'ref-napi';
import createStructType from 'ref-struct-napi';
import createArrayType from 'ref-array-napi';
import type { Type } from 'ref-napi';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

import StructType = require('ref-struct-napi');
import ArrayType = require('ref-array-napi');

// FFI types
export const BYTE = ref.types.uint8;
export const WORD = ref.types.uint16;
export const LONG = ref.types.int32;
export const DWORD = ref.types.uint32;

// FFI structure factories
const ByteArray = ArrayType(BYTE);

// DLL Function interface
// Type definitions for FFI structures
export interface IBLOBStatus {
  executedState: number;
  errorCode: number;
  additionalCode: number;
  dllReturnValue: number;
  Position: number;
  PercentComplete: number;
  nextState: number;
}

interface IDeviceIdentification {
  Name: number[];
  ProductCode: number[];
  ViewName: number[];
}

interface IInfoEx {
  COM: number[];
  DirectParameterPage: number[];
  ActualMode: number;
  SensorStatus: number;
  CurrentBaudrate: number;
}

interface IParameter {
  Result: number[];
  Index: number;
  SubIndex: number;
  Length: number;
  ErrorCode: number;
  AdditionalCode: number;
}

interface IPortConfiguration {
  PortModeDetails: number;
  TargetMode: number;
  CRID: number;
  DSConfigure: number;
  Synchronisation: number;
  FunctionID: number[];
  InspectionLevel: number;
  VendorID: number[];
  DeviceID: number[];
  SerialNumber: number[];
  InputLength: number;
  OutputLength: number;
}

// FFI Structure definitions
const createBLOBStatus = StructType({
    executedState: BYTE,
    errorCode: BYTE,
    additionalCode: BYTE,
    dllReturnValue: LONG,
    Position: DWORD,
    PercentComplete: BYTE,
    nextState: BYTE
  });

const createDeviceIdentification = StructType({
  Name: ArrayType(BYTE, 8),
  ProductCode: ArrayType(BYTE, 16),
  ViewName: ArrayType(BYTE, 100),
});

const createInfoEx = StructType({
  COM: ByteArray,
  DirectParameterPage: ByteArray,
  ActualMode: BYTE,
  SensorStatus: BYTE,
  CurrentBaudrate: BYTE,
});

const createParameter = StructType({
  Result: ByteArray,
  Index: WORD,
  SubIndex: BYTE,
  Length: BYTE,
  ErrorCode: BYTE,
  AdditionalCode: BYTE,
});

const createPortConfiguration = StructType({
  PortModeDetails: BYTE,
  TargetMode: BYTE,
  CRID: BYTE,
  DSConfigure: BYTE,
  Synchronisation: BYTE,
  FunctionID: ByteArray,
  InspectionLevel: BYTE,
  VendorID: ByteArray,
  DeviceID: ByteArray,
  SerialNumber: ByteArray,
  InputLength: BYTE,
  OutputLength: BYTE,
});

// Export struct types
export const TBLOBStatus = createBLOBStatus;
export const TDeviceIdentification = createDeviceIdentification;
export const TInfoEx = createInfoEx;
export const TParameter = createParameter;
export const TPortConfiguration = createPortConfiguration;

// DLL Function interface
export interface IOLinkDLL extends ffi.Library {
  IOL_GetUSBDevices: (deviceId: ref.Pointer<typeof TDeviceIdentification>, count: number) => number;
  IOL_Create: (deviceName: string) => number;
  IOL_Destroy: (handle: number) => number;
  IOL_GetModeEx: (handle: number, port: number, infoEx: ref.Pointer<typeof TInfoEx>, clear: boolean) => number;
  IOL_GetSensorStatus: (handle: number, port: number, status: ref.Pointer<number>) => number;
  IOL_GetPortConfig: (handle: number, port: number, config: ref.Pointer<typeof TPortConfiguration>) => number;
  IOL_SetPortConfig: (handle: number, port: number, config: ref.Pointer<typeof TPortConfiguration>) => number;
  IOL_ReadReq: (handle: number, port: number, param: ref.Pointer<typeof TParameter>) => number;
  IOL_WriteReq: (handle: number, port: number, param: ref.Pointer<typeof TParameter>) => number;
  IOL_ReadInputs: (handle: number, port: number, data: ref.Pointer<number>, length: ref.Pointer<number>, valid: ref.Pointer<number>) => number;
  IOL_WriteOutputs: (handle: number, port: number, data: ref.Pointer<number>, length: number) => number;
  BLOB_uploadBLOB: (handle: number, port: number, blobId: number, size: number, data: ref.Pointer<number>, actual: ref.Pointer<number>, status: ref.Pointer<typeof TBLOBStatus>) => number;
  BLOB_downloadBLOB: (handle: number, port: number, blobId: number, size: number, data: ref.Pointer<number>, status: ref.Pointer<typeof TBLOBStatus>) => number;
  BLOB_Continue: (handle: number, port: number, status: ref.Pointer<typeof TBLOBStatus>) => number;
  BLOB_ReadBlobID: (handle: number, port: number, blobId: ref.Pointer<number>, status: ref.Pointer<typeof TBLOBStatus>) => number;
}

// Enums and Constants
export const RETURN_CODES = {
  RETURN_OK: 0,
  RETURN_INTERNAL_ERROR: -1,
  RETURN_DEVICE_NOT_AVAILABLE: -2,
  RETURN_UNKNOWN_HANDLE: -7, // invalid connection handle
  RETURN_WRONG_PARAMETER: -10,
} as const;

export const PORT_MODES = {
  SM_MODE_RESET: 0,
  SM_MODE_IOLINK_PREOP: 1,
  SM_MODE_SIO_INPUT: 3,
  SM_MODE_SIO_OUTPUT: 4,
  SM_MODE_IOLINK_OPERATE: 12, // target
} as const;

export const SENSOR_STATUS = {
  BIT_CONNECTED: 0x01, // device connetced and operational
  BIT_PREOPERATE: 0x02,
  BIT_WRONGSENSOR: 0x10,
  BIT_EVENTAVAILABLE: 0x04,
  BIT_PDVALID: 0x08, // process data valid
  BIT_SENSORSTATEKNOWN: 0x80,
} as const;

export const VALIDATION_MODES = {
  SM_VALIDATION_MODE_NONE: 0,
  SM_VALIDATION_MODE_COMPATIBLE: 1,
  SM_VALIDATION_MODE_IDENTICAL: 2,
} as const;

export const PARAMETER_INDEX = {
  DIRECT_PARAMETER_PAGE: 0, // Device identification summary
  MIN_CYCLE_TIME: 2,
  MSEQUENCE_CAPABILITY: 3,
  VENDOR_NAME: 10,
  VENDOR_TEXT: 11,
} as const;

