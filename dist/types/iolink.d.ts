/**
 * IO-Link Interface Type Definitions
 * Based on TMG USB IO-Link Interface V2 DLL specifications
 * Following IEC 61131-9 specifications
 */
/**
 * BLOB Status Structure (from TMGIOLBlob.h)
 * Used for firmware update and BLOB transfer operations
 */
export interface TBLOBStatus {
    executedState: number;
    errorCode: number;
    additionalCode: number;
    dllReturnValue: number;
    Position: number;
    PercentComplete: number;
    nextState: number;
}
/**
 * Device Identification Structure (from TMGIOLUSBIF20.h)
 * Identifies a USB IO-Link Master device
 */
export interface TDeviceIdentification {
    Name: number[];
    ProductCode: number[];
    ViewName: number[];
}
/**
 * Extended Info Structure (from TMGIOLUSBIF20.h)
 * Provides detailed port status information
 */
export interface TInfoEx {
    COM: number[];
    DirectParameterPage: number[];
    ActualMode: number;
    SensorStatus: number;
    CurrentBaudrate: number;
}
/**
 * Parameter Structure for ISDU (Indexed Service Data Unit) communication
 * Used for reading/writing device parameters (from TMGIOLUSBIF20.h)
 */
export interface TParameter {
    Result: number[];
    Index: number;
    SubIndex: number;
    Length: number;
    ErrorCode: number;
    AdditionalCode: number;
}
/**
 * Port Configuration Structure (from TMGIOLUSBIF20.h)
 * Configures port operating mode and device identification
 */
export interface TPortConfiguration {
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
/**
 * DLL Return Codes
 */
export declare const RETURN_CODES: {
    readonly RETURN_OK: 0;
    readonly RETURN_INTERNAL_ERROR: -1;
    readonly RETURN_DEVICE_NOT_AVAILABLE: -2;
    readonly RETURN_UNKNOWN_HANDLE: -7;
    readonly RETURN_WRONG_PARAMETER: -10;
};
export type ReturnCode = typeof RETURN_CODES[keyof typeof RETURN_CODES];
/**
 * Port Modes
 */
export declare const PORT_MODES: {
    readonly DEACTIVATED: 0;
    readonly DI: 1;
    readonly DO: 2;
    readonly IOLINK_AUTOSTART: 11;
    readonly IOLINK_OPERATE: 12;
};
export type PortMode = typeof PORT_MODES[keyof typeof PORT_MODES];
/**
 * Sensor Status Values
 */
export declare const SENSOR_STATUS: {
    readonly NO_SENSOR: 0;
    readonly SENSOR_CONNECTED: 1;
    readonly SENSOR_OPERATING: 2;
    readonly COMMUNICATION_ERROR: 3;
};
export type SensorStatus = typeof SENSOR_STATUS[keyof typeof SENSOR_STATUS];
/**
 * Master State
 */
export interface MasterState {
    handle: number;
    deviceName: string;
    connected: boolean;
    ports: Map<number, PortState> | PortState[];
    initialized?: boolean;
    configurationComplete?: boolean;
}
/**
 * Port State
 */
export interface PortState {
    portNumber: number;
    mode: PortMode;
    sensorStatus: SensorStatus;
    processDataIn: Buffer | null;
    processDataOut: Buffer | null;
}
/**
 * Device Information
 */
export interface DeviceInfo {
    vendorId: string;
    deviceId: string;
    serialNumber: string;
    productName: string;
}
/**
 * Parameter Read/Write Options
 */
export interface ParameterOptions {
    index: number;
    subIndex?: number;
    data?: Buffer;
}
/**
 * Streaming Configuration
 */
export interface StreamingConfig {
    portNumber: number;
    intervalMs: number;
    loggingMode?: number;
    bufferSize?: number;
}
//# sourceMappingURL=iolink.d.ts.map