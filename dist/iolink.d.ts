/**
 * Export barrel for TMG IO-Link Interface
 * Provides clean public API matching original JavaScript module.exports
 */
export { discoverMasters, connect, disconnect, initializeMaster, } from './iolink-interface';
export { checkPortStatus, scanMasterPorts, } from './iolink-interface';
export { readProcessData, writeProcessData, } from './iolink-interface';
export { readDeviceParameter, writeDeviceParameter, readDeviceName, readSerialNumber, readVendorName, readProductName, } from './iolink-interface';
export { readBlob, writeBlob, } from './iolink-interface';
export { streamDeviceData, } from './iolink-interface';
export { discoverAllDevices, disconnectAllMasters, getConnectedDeviceInfo, } from './iolink-interface';
export { getMasterState, resetGlobalRegistry, } from './iolink-interface';
export { RETURN_CODES, PORT_MODES, SENSOR_STATUS, VALIDATION_MODES, PARAMETER_INDEX, } from './types';
export type { MasterDevice, PortStatus, DeviceInfo, ProcessDataResult, WriteResult, ParameterResult, ParameterWriteResult, BlobResult, BlobWriteResult, StreamCallback, StopStreamingFunction, MasterTopology, NetworkTopology, MasterState, PortState, } from './types';
//# sourceMappingURL=iolink.d.ts.map