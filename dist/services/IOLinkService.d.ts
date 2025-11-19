/**
 * IO-Link Service
 * Core service class that wraps the TMG DLL functionality
 * Extracted from the original iolink-interface.js
 *
 */
interface DiscoveredMaster {
    name: string;
    productCode: string;
    viewName: string;
    index: number;
}
interface PortStatus {
    port: number;
    connected: boolean;
    mode: string;
    actualMode: number;
    sensorStatus: number;
    baudrate: number;
    directParameterPage: Buffer;
    timestamp: Date;
}
interface ProcessDataRead {
    data: Buffer;
    status: number;
    port: number;
    timestamp: Date;
}
interface ProcessDataWrite {
    success: boolean;
    bytesWritten: number;
    port: number;
    timestamp: Date;
}
interface ParameterRead {
    index: number;
    subIndex: number;
    length: number;
    data: Buffer;
    errorCode: number;
    additionalCode: number;
    port: number;
    timestamp: Date;
}
interface ParameterWrite {
    index: number;
    subIndex: number;
    length: number;
    errorCode: number;
    additionalCode: number;
    port: number;
    timestamp: Date;
    success: boolean;
}
declare class IOLinkService {
    private masterStates;
    private globalMasterRegistry;
    constructor();
    private checkReturnCode;
    private extractString;
    private getVendorName;
    private getDeviceName;
    private parseDeviceInfoFromDPP;
    discoverMasters(): Promise<DiscoveredMaster[]>;
    connectToMaster(deviceName: string): Promise<number>;
    resetMaster(handle: number): Promise<boolean>;
    initializeMaster(handle: number, deviceName: string, maxPorts?: number): Promise<void>;
    configurePortForIOLink(handle: number, port: number): Promise<boolean>;
    disconnectFromMaster(handle: number): Promise<boolean>;
    clearPortConfiguration(handle: number, port: number): Promise<boolean>;
    checkPortStatus(handle: number, port: number): Promise<PortStatus>;
    readProcessData(handle: number, port: number, maxLength?: number): Promise<ProcessDataRead>;
    writeProcessData(handle: number, port: number, data: Buffer | number[]): Promise<ProcessDataWrite>;
    readParameter(handle: number, port: number, index: number, subIndex?: number): Promise<ParameterRead>;
    writeParameter(handle: number, port: number, index: number, subIndex: number | undefined, data: Buffer | number[]): Promise<ParameterWrite>;
}
export default IOLinkService;
//# sourceMappingURL=IOLinkService.d.ts.map