/**
 * Device Model
 * Represents an IO-Link device with its properties and state
 *
 */
interface DeviceConstructorParams {
    port: number;
    vendorId: string;
    deviceId: string;
    functionId: string;
    revisionId: string;
    vendorName: string;
    deviceName: string;
    processDataInputLength?: number;
    processDataOutputLength?: number;
    masterHandle?: number | null;
}
interface ConnectionStatus {
    connected: boolean;
    mode: string;
    actualMode: number;
    sensorStatus: number;
    baudrate: number;
    timestamp?: Date;
}
interface ProcessDataCache {
    data: Buffer;
    status: number;
    timestamp: Date;
}
interface ParameterCache {
    index: number;
    subIndex: number;
    length: number;
    data: Buffer;
    errorCode: number;
    additionalCode: number;
    port: number;
    timestamp: Date;
    cachedAt: Date;
}
interface DeviceMetadata {
    serialNumber?: string | null;
    firmwareVersion?: string | null;
    hardwareVersion?: string | null;
    applicationName?: string | null;
}
declare class Device {
    port: number;
    vendorId: string;
    deviceId: string;
    functionId: string;
    revisionId: string;
    vendorName: string;
    deviceName: string;
    processDataInputLength: number;
    processDataOutputLength: number;
    masterHandle: number | null;
    connected: boolean;
    connectionState: string;
    actualMode: number;
    sensorStatus: number;
    baudrate: number;
    connectedAt: Date | null;
    lastSeen: Date | null;
    lastDataRead: Date | null;
    lastParameterRead: Date | null;
    supportedParameters: Map<number, any>;
    processDataCache: ProcessDataCache | null;
    parameterCache: Map<string, ParameterCache>;
    serialNumber: string | null;
    firmwareVersion: string | null;
    hardwareVersion: string | null;
    applicationName: string | null;
    constructor({ port, vendorId, deviceId, functionId, revisionId, vendorName, deviceName, processDataInputLength, processDataOutputLength, masterHandle, }: DeviceConstructorParams);
    /**
     * Update device connection status
     */
    updateConnectionStatus(status: ConnectionStatus): void;
    /**
     * Cache process data
     */
    cacheProcessData(data: ProcessDataCache): void;
    /**
     * Cache parameter value
     */
    cacheParameter(index: number, subIndex: number, parameterData: Omit<ParameterCache, 'cachedAt'>): void;
    /**
     * Get cached parameter value
     */
    getCachedParameter(index: number, subIndex: number): ParameterCache | undefined;
    /**
     * Check if parameter cache is still valid (within specified time)
     */
    isParameterCacheValid(index: number, subIndex: number, maxAgeMs?: number): boolean;
    /**
     * Check if process data cache is still valid
     */
    isProcessDataCacheValid(maxAgeMs?: number): boolean;
    /**
     * Get device summary for API responses
     */
    toJSON(): Record<string, any>;
    /**
     * Get device info suitable for device listing
     */
    getDeviceInfo(): Record<string, any>;
    /**
     * Get connection status
     */
    getConnectionStatus(): Record<string, any>;
    /**
     * Clear all cached data
     */
    clearCache(): void;
    /**
     * Update device metadata from parameters
     */
    updateMetadata(metadata: DeviceMetadata): void;
    /**
     * Check if device is ready for operations
     */
    isReady(): boolean;
    /**
     * Check if device is in communication
     */
    isInCommunication(): boolean;
    /**
     * Get device identifier string
     */
    getIdentifier(): string;
}
export default Device;
//# sourceMappingURL=Device.d.ts.map