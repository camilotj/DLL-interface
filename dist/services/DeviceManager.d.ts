/**
 * Device Manager Service - TypeScript Port
 * Manages device lifecycle, state, and high-level operations
 *
 * CRITICAL: Maintains exact behavior and device management logic from JavaScript version
 */
import Device from '../models/Device';
import Parameter from '../models/Parameter';
interface PortStatus {
    connected: boolean;
    mode: string;
    actualMode: number;
    sensorStatus: number;
    baudrate: number;
    directParameterPage: Buffer;
    timestamp: Date;
}
declare class DeviceManager {
    private iolinkService;
    private connectedMasters;
    private devices;
    private deviceSubscriptions;
    parameters: Map<string, Map<string, Parameter>>;
    private scanIntervals;
    private monitoringEnabled;
    private monitoringInterval;
    constructor();
    discoverMasters(): Promise<any[]>;
    connectMaster(deviceName: string): Promise<number>;
    disconnectMaster(handle: number): Promise<boolean>;
    getConnectedMasters(): any[];
    startDeviceScanning(masterHandle: number, intervalMs?: number): Promise<void>;
    stopDeviceScanning(masterHandle: number): void;
    scanDevicesOnMaster(masterHandle: number): Promise<void>;
    handleNewDeviceDetected(masterHandle: number, port: number, status: PortStatus): Promise<Device | undefined>;
    handleDeviceDisconnected(deviceKey: string, device: Device): Promise<void>;
    initializeDeviceParameters(deviceKey: string, device: Device): Promise<void>;
    readDeviceMetadata(deviceKey: string, device: Device): Promise<void>;
    getDevices(): any[];
    getDevice(masterHandle: number, port: number): Device;
    getDeviceByKey(deviceKey: string): Device;
    getDeviceStatus(masterHandle: number, port: number): Promise<any>;
    readProcessData(masterHandle: number, port: number): Promise<any>;
    writeProcessData(masterHandle: number, port: number, data: Buffer | number[]): Promise<any>;
    readDeviceParameter(deviceKey: string, index: number, subIndex?: number): Promise<any>;
    writeDeviceParameter(deviceKey: string, index: number, subIndex: number | undefined, value: any): Promise<any>;
    getDeviceParameters(deviceKey: string): any[];
    validateDeviceConnection(masterHandle: number, port: number): Promise<Device>;
    getDeviceCount(): number;
    getConnectedDeviceCount(): number;
    cleanup(): Promise<void>;
}
export default DeviceManager;
//# sourceMappingURL=DeviceManager.d.ts.map