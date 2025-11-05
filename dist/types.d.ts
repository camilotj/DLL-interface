/**
 * Type definitions for IO-Link Interface
 * Consolidated types for FFI bindings, structs, and application data
 */
import { Pointer } from 'ref-napi';
export type BYTE = number;
export type WORD = number;
export type LONG = number;
export type DWORD = number;
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
export declare const RETURN_CODES: {
    readonly RETURN_OK: 0;
    readonly RETURN_INTERNAL_ERROR: -1;
    readonly RETURN_DEVICE_NOT_AVAILABLE: -2;
    readonly RETURN_UNKNOWN_HANDLE: -7;
    readonly RETURN_WRONG_PARAMETER: -10;
};
export declare const PORT_MODES: {
    readonly SM_MODE_RESET: 0;
    readonly SM_MODE_IOLINK_PREOP: 1;
    readonly SM_MODE_SIO_INPUT: 3;
    readonly SM_MODE_SIO_OUTPUT: 4;
    readonly SM_MODE_IOLINK_OPERATE: 12;
};
export declare const SENSOR_STATUS: {
    readonly BIT_CONNECTED: 1;
    readonly BIT_PREOPERATE: 2;
    readonly BIT_WRONGSENSOR: 16;
    readonly BIT_EVENTAVAILABLE: 4;
    readonly BIT_PDVALID: 8;
    readonly BIT_SENSORSTATEKNOWN: 128;
};
export declare const VALIDATION_MODES: {
    readonly SM_VALIDATION_MODE_NONE: 0;
    readonly SM_VALIDATION_MODE_COMPATIBLE: 1;
    readonly SM_VALIDATION_MODE_IDENTICAL: 2;
};
export declare const PARAMETER_INDEX: {
    readonly DIRECT_PARAMETER_PAGE: 0;
    readonly MIN_CYCLE_TIME: 2;
    readonly MSEQUENCE_CAPABILITY: 3;
    readonly VENDOR_NAME: 10;
    readonly VENDOR_TEXT: 11;
    readonly PRODUCT_NAME: 12;
    readonly PRODUCT_ID: 13;
    readonly PRODUCT_TEXT: 14;
    readonly SERIAL_NUMBER: 15;
    readonly HARDWARE_REVISION: 16;
    readonly FIRMWARE_REVISION: 17;
    readonly APPLICATION_SPECIFIC_NAME: 18;
};
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
export declare class PortState {
    portNumber: number;
    configured: boolean;
    targetMode: number;
    actualMode: number;
    deviceInfo: DeviceInfo | null;
    lastStatusCheck: number;
    configurationTimestamp: number;
    configurationAttempts: number;
    lastConfigurationHash: string | null;
    sessionId: number;
    constructor(portNumber: number);
    needsReconfiguration(targetMode: number, crid: number, inspectionLevel: number): boolean;
    markConfigured(targetMode: number, crid: number, inspectionLevel: number): void;
}
export declare class MasterState {
    handle: number;
    deviceName: string;
    ports: Map<number, PortState>;
    initialized: boolean;
    configurationComplete: boolean;
    constructor(handle: number, deviceName: string);
}
export interface MasterRegistryEntry {
    configured: boolean;
    lastConfigTime: number;
}
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
//# sourceMappingURL=types.d.ts.map