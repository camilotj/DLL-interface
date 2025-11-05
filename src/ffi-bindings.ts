/**
 * FFI Bindings for TMG IO-Link DLL
 * Type-safe FFI declarations and struct definitions
 */

import ffi from 'ffi-napi';
import ref from 'ref-napi';
import StructType from 'ref-struct-napi';
import ArrayType from 'ref-array-napi';
import * as path from 'path';
import type { IOLinkDLL } from './types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export const BYTE = ref.types.uint8;
export const WORD = ref.types.uint16;
export const LONG = ref.types.int32;
export const DWORD = ref.types.uint32;

// ============================================================================
// STRUCT DEFINITIONS
// ============================================================================

export const TBLOBStatus = StructType({
  executedState: BYTE,
  errorCode: BYTE,
  additionalCode: BYTE,
  dllReturnValue: LONG,
  Position: DWORD,
  PercentComplete: BYTE,
  nextState: BYTE,
});

export const TDeviceIdentification = StructType({
  Name: ArrayType(BYTE, 8),
  ProductCode: ArrayType(BYTE, 16),
  ViewName: ArrayType(BYTE, 100),
});

export const TInfoEx = StructType({
  COM: ArrayType(BYTE, 10),
  DirectParameterPage: ArrayType(BYTE, 16),
  ActualMode: BYTE,
  SensorStatus: BYTE,
  CurrentBaudrate: BYTE,
});

export const TParameter = StructType({
  Result: ArrayType(BYTE, 256),
  Index: WORD,
  SubIndex: BYTE,
  Length: BYTE,
  ErrorCode: BYTE,
  AdditionalCode: BYTE,
});

export const TPortConfiguration = StructType({
  PortModeDetails: BYTE,
  TargetMode: BYTE,
  CRID: BYTE,
  DSConfigure: BYTE,
  Synchronisation: BYTE,
  FunctionID: ArrayType(BYTE, 2),
  InspectionLevel: BYTE,
  VendorID: ArrayType(BYTE, 2),
  DeviceID: ArrayType(BYTE, 3),
  SerialNumber: ArrayType(BYTE, 16),
  InputLength: BYTE,
  OutputLength: BYTE,
});

// ============================================================================
// DLL LOADING
// ============================================================================

const dllPath = path.join(
  __dirname,
  '../TMG_USB_IO-Link_Interface_V2_DLL/Sample_x64/Sample_C/SimpleApplication/TMGIOLUSBIF20_64.dll'
);

export const iolinkDll = ffi.Library(dllPath, {
  IOL_GetUSBDevices: [LONG, [ref.refType(TDeviceIdentification), LONG]],
  IOL_Create: [LONG, [ref.types.CString]],
  IOL_Destroy: [LONG, [LONG]],
  IOL_GetModeEx: [LONG, [LONG, DWORD, ref.refType(TInfoEx), ref.types.bool]],
  IOL_GetSensorStatus: [LONG, [LONG, DWORD, ref.refType(DWORD)]],
  IOL_GetPortConfig: [LONG, [LONG, DWORD, ref.refType(TPortConfiguration)]],
  IOL_SetPortConfig: [LONG, [LONG, DWORD, ref.refType(TPortConfiguration)]],
  IOL_ReadReq: [LONG, [LONG, DWORD, ref.refType(TParameter)]],
  IOL_WriteReq: [LONG, [LONG, DWORD, ref.refType(TParameter)]],
  IOL_ReadInputs: [LONG, [LONG, DWORD, ref.refType(BYTE), ref.refType(DWORD), ref.refType(DWORD)]],
  IOL_WriteOutputs: [LONG, [LONG, DWORD, ref.refType(BYTE), DWORD]],
  BLOB_uploadBLOB: [LONG, [LONG, DWORD, LONG, DWORD, ref.refType(BYTE), ref.refType(DWORD), ref.refType(TBLOBStatus)]],
  BLOB_downloadBLOB: [LONG, [LONG, DWORD, LONG, DWORD, ref.refType(BYTE), ref.refType(TBLOBStatus)]],
  BLOB_Continue: [LONG, [LONG, DWORD, ref.refType(TBLOBStatus)]],
  BLOB_ReadBlobID: [LONG, [LONG, DWORD, ref.refType(LONG), ref.refType(TBLOBStatus)]],
}) as IOLinkDLL;

export { ref };