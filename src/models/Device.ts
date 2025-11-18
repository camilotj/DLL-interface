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

class Device {
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

  // Connection state
  connected: boolean;
  connectionState: string;
  actualMode: number;
  sensorStatus: number;
  baudrate: number;

  // Timestamps
  connectedAt: Date | null;
  lastSeen: Date | null;
  lastDataRead: Date | null;
  lastParameterRead: Date | null;

  // Device capabilities
  supportedParameters: Map<number, any>;
  processDataCache: ProcessDataCache | null;
  parameterCache: Map<string, ParameterCache>;

  // Metadata
  serialNumber: string | null;
  firmwareVersion: string | null;
  hardwareVersion: string | null;
  applicationName: string | null;

  constructor({
    port,
    vendorId,
    deviceId,
    functionId,
    revisionId,
    vendorName,
    deviceName,
    processDataInputLength = 0,
    processDataOutputLength = 0,
    masterHandle = null,
  }: DeviceConstructorParams) {
    this.port = port;
    this.vendorId = vendorId;
    this.deviceId = deviceId;
    this.functionId = functionId;
    this.revisionId = revisionId;
    this.vendorName = vendorName;
    this.deviceName = deviceName;
    this.processDataInputLength = processDataInputLength;
    this.processDataOutputLength = processDataOutputLength;
    this.masterHandle = masterHandle;

    // Connection state
    this.connected = false;
    this.connectionState = 'DISCONNECTED';
    this.actualMode = 0;
    this.sensorStatus = 0;
    this.baudrate = 0;

    // Timestamps
    this.connectedAt = null;
    this.lastSeen = null;
    this.lastDataRead = null;
    this.lastParameterRead = null;

    // Device capabilities
    this.supportedParameters = new Map();
    this.processDataCache = null;
    this.parameterCache = new Map();

    // Metadata
    this.serialNumber = null;
    this.firmwareVersion = null;
    this.hardwareVersion = null;
    this.applicationName = null;
  }

  /**
   * Update device connection status
   */
  updateConnectionStatus(status: ConnectionStatus): void {
    this.connected = status.connected;
    this.connectionState = status.mode;
    this.actualMode = status.actualMode;
    this.sensorStatus = status.sensorStatus;
    this.baudrate = status.baudrate;
    this.lastSeen = status.timestamp || new Date();

    if (this.connected && !this.connectedAt) {
      this.connectedAt = new Date();
    } else if (!this.connected) {
      this.connectedAt = null;
    }
  }

  /**
   * Cache process data
   */
  cacheProcessData(data: ProcessDataCache): void {
    this.processDataCache = {
      data: data.data,
      status: data.status,
      timestamp: data.timestamp,
    };
    this.lastDataRead = data.timestamp;
  }

  /**
   * Cache parameter value
   */
  cacheParameter(index: number, subIndex: number, parameterData: Omit<ParameterCache, 'cachedAt'>): void {
    const key = `${index}.${subIndex}`;
    this.parameterCache.set(key, {
      ...parameterData,
      cachedAt: new Date(),
    });
    this.lastParameterRead = new Date();
  }

  /**
   * Get cached parameter value
   */
  getCachedParameter(index: number, subIndex: number): ParameterCache | undefined {
    const key = `${index}.${subIndex}`;
    return this.parameterCache.get(key);
  }

  /**
   * Check if parameter cache is still valid (within specified time)
   */
  isParameterCacheValid(index: number, subIndex: number, maxAgeMs: number = 30000): boolean {
    const cached = this.getCachedParameter(index, subIndex);
    if (!cached) return false;

    const age = new Date().getTime() - cached.cachedAt.getTime();
    return age < maxAgeMs;
  }

  /**
   * Check if process data cache is still valid
   */
  isProcessDataCacheValid(maxAgeMs: number = 1000): boolean {
    if (!this.processDataCache) return false;

    const age = new Date().getTime() - this.processDataCache.timestamp.getTime();
    return age < maxAgeMs;
  }

  /**
   * Get device summary for API responses
   */
  toJSON(): Record<string, any> {
    return {
      port: this.port,
      vendorId: this.vendorId,
      deviceId: this.deviceId,
      functionId: this.functionId,
      revisionId: this.revisionId,
      vendorName: this.vendorName,
      deviceName: this.deviceName,
      processDataInputLength: this.processDataInputLength,
      processDataOutputLength: this.processDataOutputLength,
      connected: this.connected,
      connectionState: this.connectionState,
      actualMode: this.actualMode,
      sensorStatus: this.sensorStatus,
      baudrate: this.baudrate,
      connectedAt: this.connectedAt,
      lastSeen: this.lastSeen,
      lastDataRead: this.lastDataRead,
      lastParameterRead: this.lastParameterRead,
      serialNumber: this.serialNumber,
      firmwareVersion: this.firmwareVersion,
      hardwareVersion: this.hardwareVersion,
      applicationName: this.applicationName,
      supportedParametersCount: this.supportedParameters.size,
      hasProcessDataCache: !!this.processDataCache,
      parameterCacheSize: this.parameterCache.size,
    };
  }

  /**
   * Get device info suitable for device listing
   */
  getDeviceInfo(): Record<string, any> {
    return {
      port: this.port,
      vendorName: this.vendorName,
      deviceName: this.deviceName,
      vendorId: this.vendorId,
      deviceId: this.deviceId,
      connected: this.connected,
      connectionState: this.connectionState,
      processDataInputLength: this.processDataInputLength,
      processDataOutputLength: this.processDataOutputLength,
      lastSeen: this.lastSeen,
    };
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): Record<string, any> {
    return {
      port: this.port,
      connected: this.connected,
      connectionState: this.connectionState,
      actualMode: this.actualMode,
      sensorStatus: this.sensorStatus,
      baudrate: this.baudrate,
      connectedAt: this.connectedAt,
      lastSeen: this.lastSeen,
      uptime: this.connectedAt ? new Date().getTime() - this.connectedAt.getTime() : 0,
    };
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.processDataCache = null;
    this.parameterCache.clear();
    this.lastDataRead = null;
    this.lastParameterRead = null;
  }

  /**
   * Update device metadata from parameters
   */
  updateMetadata(metadata: DeviceMetadata): void {
    if (metadata.serialNumber !== undefined) {
      this.serialNumber = metadata.serialNumber;
    }
    if (metadata.firmwareVersion !== undefined) {
      this.firmwareVersion = metadata.firmwareVersion;
    }
    if (metadata.hardwareVersion !== undefined) {
      this.hardwareVersion = metadata.hardwareVersion;
    }
    if (metadata.applicationName !== undefined) {
      this.applicationName = metadata.applicationName;
    }
  }

  /**
   * Check if device is ready for operations
   */
  isReady(): boolean {
    return this.connected && this.connectionState === 'OPERATE';
  }

  /**
   * Check if device is in communication
   */
  isInCommunication(): boolean {
    return (
      this.connected &&
      (this.connectionState === 'OPERATE' ||
        this.connectionState === 'PREOPERATE')
    );
  }

  /**
   * Get device identifier string
   */
  getIdentifier(): string {
    return `${this.vendorName}_${this.deviceName}_Port${this.port}`;
  }
}

export default Device;
