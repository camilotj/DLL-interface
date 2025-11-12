/**
 * IO-Link Native Interface - TypeScript Port
 * Provides complete IO-Link Master and Device communication functionality
 * Following IEC 61131-9 specifications
 *
 * CRITICAL: Struct layouts and FFI signatures must remain EXACTLY as in JavaScript version
 * to preserve native DLL communication behavior
 */
import { RETURN_CODES, PORT_MODES, PortMode, SENSOR_STATUS, SensorStatus, MasterState as IMasterState, PortState as IPortState } from '../types/iolink';
declare const VALIDATION_MODES: {
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
declare class MasterState implements IMasterState {
    handle: number;
    deviceName: string;
    connected: boolean;
    ports: Map<number, PortState>;
    initialized: boolean;
    configurationComplete: boolean;
    constructor(handle: number, deviceName: string);
}
declare class PortState implements IPortState {
    portNumber: number;
    mode: PortMode;
    sensorStatus: SensorStatus;
    processDataIn: Buffer | null;
    processDataOut: Buffer | null;
    configured: boolean;
    targetMode: PortMode;
    actualMode: PortMode;
    deviceInfo: any;
    lastStatusCheck: number;
    configurationTimestamp: number;
    configurationAttempts: number;
    lastConfigurationHash: string | null;
    sessionId: number;
    constructor(portNumber: number);
    needsReconfiguration(targetMode: number, crid: number, inspectionLevel: number): boolean;
    markConfigured(targetMode: number, crid: number, inspectionLevel: number): void;
}
export interface MasterDeviceInfo {
    name: string;
    productCode: string;
    viewName: string;
}
export declare function discoverMasters(): MasterDeviceInfo[];
export declare function connect(deviceName: string): number;
export declare function disconnect(handle: number): void;
export declare function initializeMaster(handle: number, deviceName: string, maxPorts?: number): Promise<MasterState>;
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
export declare function checkPortStatus(handle: number, port: number): PortStatus;
export interface ConnectedDevice {
    port: number;
    vendorId: string;
    deviceId: string;
    functionId: string;
    revisionId: string;
    vendorName: string;
    deviceName: string;
    processDataInputLength: number;
    processDataOutputLength: number;
    vendorSpecific: Buffer;
    status: PortStatus;
}
export declare function scanMasterPorts(handle: number): ConnectedDevice[];
export interface ProcessDataRead {
    data: Buffer;
    status: number;
    port: number;
    timestamp: Date;
}
export declare function readProcessData(handle: number, port: number, maxLength?: number): ProcessDataRead;
export interface ProcessDataWrite {
    success: boolean;
    bytesWritten: number;
    port: number;
    timestamp: Date;
}
export declare function writeProcessData(handle: number, port: number, data: Buffer | number[]): ProcessDataWrite;
export interface ParameterRead {
    index: number;
    subIndex: number;
    length: number;
    data: Buffer;
    errorCode: number;
    additionalCode: number;
    port: number;
    timestamp: Date;
}
export declare function readDeviceParameter(handle: number, port: number, index: number, subIndex?: number): ParameterRead;
export interface ParameterWrite {
    index: number;
    subIndex: number;
    length: number;
    errorCode: number;
    additionalCode: number;
    port: number;
    timestamp: Date;
    success: boolean;
}
export declare function writeDeviceParameter(handle: number, port: number, index: number, subIndex: number | undefined, data: Buffer | number[]): ParameterWrite;
export declare function readDeviceName(handle: number, port: number): string;
export declare function readVendorName(handle: number, port: number): string;
export declare function readProductName(handle: number, port: number): string;
export declare function readSerialNumber(handle: number, port: number): string;
export interface BlobRead {
    data: Buffer;
    blobId: number;
    port: number;
    timestamp: Date;
}
export declare function readBlob(handle: number, port: number, blobId: number, maxSize?: number): BlobRead;
export interface BlobWrite {
    success: boolean;
    blobId: number;
    bytesWritten: number;
    port: number;
    timestamp: Date;
}
export declare function writeBlob(handle: number, port: number, blobId: number, data: Buffer | number[]): BlobWrite;
export interface MasterTopology {
    name: string;
    productCode: string;
    viewName: string;
    handle: number;
    connectedDevices: ConnectedDevice[];
    totalDevices: number;
    initialized: boolean;
    ports?: number[];
    error?: string;
}
export interface DiscoveryTopology {
    masters: MasterTopology[];
}
export declare function discoverAllDevices(): Promise<DiscoveryTopology>;
export declare function disconnectAllMasters(topology: DiscoveryTopology): void;
export declare function startNativeStreaming(handle: number, port: number, samplesPerSecond: number, bufferSizeBytes: number): number;
export declare function stopNativeStreaming(handle: number, port: number): number;
export interface StreamingSample {
    timestamp: number;
    inputData: Buffer;
    outputData: Buffer;
    inputLength: number;
    outputLength: number;
    inputValid: boolean;
    rawBuffer: Buffer;
}
export interface StreamingBufferRead {
    data: Buffer | null;
    bytesRead: number;
    samples: StreamingSample[];
    status: {
        isRunning: boolean;
        hasMoreData: boolean;
        overrun: boolean;
    };
}
export declare function readNativeLoggingBuffer(handle: number, port: number, bufferSize?: number): StreamingBufferRead;
export interface ConnectedDeviceInfo {
    port: number;
    vendorId: string;
    deviceId: string;
    functionId: string;
    revisionId: string;
    vendorName: string;
    deviceName: string;
    serialNumber: string;
    processDataInputLength: number;
    processDataOutputLength: number;
    status: PortStatus;
}
export declare function getConnectedDeviceInfo(handle: number, port: number): ConnectedDeviceInfo | null;
export declare function getMasterState(handle: number): MasterState | undefined;
export declare function resetGlobalRegistry(): void;
export { RETURN_CODES, PORT_MODES, SENSOR_STATUS, VALIDATION_MODES, };
//# sourceMappingURL=iolink-native.d.ts.map