/**
 * Type declarations for IO-Link Interface FFI bindings
 */
import { Buffer } from 'node:buffer';
import * as bindings from './ffi-bindings';

// Generic FFI type instance interface
export interface StructBase {
  /** Get a Buffer reference to this struct instance */
  ref(): Buffer;
  /** Get the JavaScript object representation of this struct */
  deref(): any;
}

export type StructInstance<T> = T & StructBase;

// Re-export basic types
export const BYTE = bindings.BYTE;
export const WORD = bindings.WORD;
export const LONG = bindings.LONG;
export const DWORD = bindings.DWORD;

// Re-export array types
export const ByteArray8 = bindings.ByteArray8;
export const ByteArray16 = bindings.ByteArray16;
export const ByteArray100 = bindings.ByteArray100;
export const ByteArray256 = bindings.ByteArray256;
export const ByteArray2 = bindings.ByteArray2;
export const ByteArray3 = bindings.ByteArray3;
export const ByteArray10 = bindings.ByteArray10;

// Re-export struct types
export const TBLOBStatus = bindings.TBLOBStatus;
export const TDeviceIdentification = bindings.TDeviceIdentification;
export const TInfoEx = bindings.TInfoEx;
export const TParameter = bindings.TParameter;
export const TPortConfiguration = bindings.TPortConfiguration;

// Re-export constants
export const RETURN_CODES = bindings.RETURN_CODES;
export const PORT_MODES = bindings.PORT_MODES;
export const SENSOR_STATUS = bindings.SENSOR_STATUS;
export const VALIDATION_MODES = bindings.VALIDATION_MODES;
export const PARAMETER_INDEX = bindings.PARAMETER_INDEX;

// Type definitions for FFI structs
// These types map to the FFI struct field types
export type TBLOBStatusData = {
  executedState: number;
  errorCode: number;
  additionalCode: number;
  dllReturnValue: number;
  Position: number;
  PercentComplete: number;
  nextState: number;
};

export type TDeviceIdentificationData = {
  Name: Buffer;
  ProductCode: Buffer;
  ViewName: Buffer;
};

export type TInfoExData = {
  COM: Buffer;
  DirectParameterPage: Buffer;
  ActualMode: number;
  SensorStatus: number;
  CurrentBaudrate: number;
};

export type TParameterData = {
  Result: Buffer;
  Index: number;
  SubIndex: number;
  Length: number;
  ErrorCode: number;
  AdditionalCode: number;
};

export type TPortConfigurationData = {
  PortModeDetails: number;
  TargetMode: number;
  CRID: number;
  DSConfigure: number;
  Synchronisation: number;
  FunctionID: Buffer;
  InspectionLevel: number;
  VendorID: Buffer;
  DeviceID: Buffer;
  SerialNumber: Buffer;
  InputLength: number;
  OutputLength: number;
};

// FFI Struct instance interfaces
export type IBLOBStatus = StructInstance<TBLOBStatusData>;
export type IDeviceIdentification = StructInstance<TDeviceIdentificationData>;
export type IInfoEx = StructInstance<TInfoExData>;
export type IParameter = StructInstance<TParameterData>;
export type IPortConfiguration = StructInstance<TPortConfigurationData>;

// DLL Function interface
export interface IOLinkDLL {
    IOL_GetUSBDevices: (deviceId: Buffer, count: number) => number;
    IOL_Create: (deviceName: string) => number;
    IOL_Destroy: (handle: number) => number;
    IOL_GetModeEx: (handle: number, port: number, infoEx: Buffer, clear: boolean) => number;
    IOL_GetSensorStatus: (handle: number, port: number, status: Buffer) => number;
    IOL_GetPortConfig: (handle: number, port: number, config: Buffer) => number;
    IOL_SetPortConfig: (handle: number, port: number, config: Buffer) => number;
    IOL_ReadReq: (handle: number, port: number, param: Buffer) => number;
    IOL_WriteReq: (handle: number, port: number, param: Buffer) => number;
    IOL_ReadInputs: (handle: number, port: number, data: Buffer, length: Buffer, valid: Buffer) => number;
    IOL_WriteOutputs: (handle: number, port: number, data: Buffer, length: number) => number;
    BLOB_uploadBLOB: (handle: number, port: number, blobId: number, size: number, data: Buffer, actual: Buffer, status: Buffer) => number;
    BLOB_downloadBLOB: (handle: number, port: number, blobId: number, size: number, data: Buffer, status: Buffer) => number;
    BLOB_Continue: (handle: number, port: number, status: Buffer) => number;
    BLOB_ReadBlobID: (handle: number, port: number, blobId: Buffer, status: Buffer) => number;
}

