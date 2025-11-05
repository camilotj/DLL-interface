/**
 * Export barrel for TMG IO-Link Interface
 * Provides clean public API matching original JavaScript module.exports
 */

// Core Master Functions
export {
  discoverMasters,
  connect,
  disconnect,
  initializeMaster,
} from './iolink-interface';

// Port Management
export {
  checkPortStatus,
  scanMasterPorts,
} from './iolink-interface';

// Process Data Communication
export {
  readProcessData,
  writeProcessData,
} from './iolink-interface';

// Parameter Communication (ISDU)
export {
  readDeviceParameter,
  writeDeviceParameter,
  readDeviceName,
  readSerialNumber,
  readVendorName,
  readProductName,
} from './iolink-interface';

// BLOB Communication
export {
  readBlob,
  writeBlob,
} from './iolink-interface';

// Streaming Function
export {
  streamDeviceData,
} from './iolink-interface';

// High-Level Functions
export {
  discoverAllDevices,
  disconnectAllMasters,
  getConnectedDeviceInfo,
} from './iolink-interface';

// State Management
export {
  getMasterState,
  resetGlobalRegistry,
} from './iolink-interface';

// Constants
export {
  RETURN_CODES,
  PORT_MODES,
  SENSOR_STATUS,
  VALIDATION_MODES,
  PARAMETER_INDEX,
} from './types';

// Types
export type {
  MasterDevice,
  PortStatus,
  DeviceInfo,
  ProcessDataResult,
  WriteResult,
  ParameterResult,
  ParameterWriteResult,
  BlobResult,
  BlobWriteResult,
  StreamCallback,
  StopStreamingFunction,
  MasterTopology,
  NetworkTopology,
  MasterState,
  PortState,
} from './types';