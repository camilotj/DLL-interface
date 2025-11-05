/**
 * IO-Link Interface Library - TypeScript Implementation
 * Provides complete IO-Link Master and Device communication functionality
 * Following IEC 61131-9 specifications
 */
import { MasterState, MasterDevice, PortStatus, DeviceInfo, ProcessDataResult, WriteResult, ParameterResult, ParameterWriteResult, BlobResult, BlobWriteResult, StreamCallback, StopStreamingFunction, NetworkTopology } from './types';
export declare function discoverMasters(): MasterDevice[];
export declare function connect(deviceName: string): number;
export declare function disconnect(handle: number): void;
export declare function resetMaster(handle: number): boolean;
export declare function initializeMaster(handle: number, deviceName: string, maxPorts?: number): Promise<MasterState>;
export declare function checkPortStatus(handle: number, port: number): PortStatus;
export declare function scanMasterPorts(handle: number): DeviceInfo[];
export declare function readProcessData(handle: number, port: number, maxLength?: number): ProcessDataResult;
export declare function writeProcessData(handle: number, port: number, data: Buffer | number[]): WriteResult;
export declare function readDeviceParameter(handle: number, port: number, index: number, subIndex?: number): ParameterResult;
export declare function writeDeviceParameter(handle: number, port: number, index: number, subIndex: number | undefined, data: Buffer | number[]): ParameterWriteResult;
export declare function readDeviceName(handle: number, port: number): string;
export declare function readVendorName(handle: number, port: number): string;
export declare function readProductName(handle: number, port: number): string;
export declare function readSerialNumber(handle: number, port: number): string;
export declare function readBlob(handle: number, port: number, blobId: number, maxSize?: number): BlobResult;
export declare function writeBlob(handle: number, port: number, blobId: number, data: Buffer | number[]): BlobWriteResult;
export declare function streamDeviceData(handle: number, port: number, interval: number, callback: StreamCallback): StopStreamingFunction;
export declare function discoverAllDevices(): Promise<NetworkTopology>;
export declare function disconnectAllMasters(topology: NetworkTopology): void;
export declare function getConnectedDeviceInfo(handle: number, port: number): DeviceInfo | null;
export declare function getMasterState(handle: number): MasterState | undefined;
export declare function resetGlobalRegistry(): void;
//# sourceMappingURL=iolink-interface.d.ts.map