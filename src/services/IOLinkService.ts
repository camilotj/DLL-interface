/**
 * IO-Link Service
 * Core service class that wraps the TMG DLL functionality
 * Extracted from the original iolink-interface.js
 *
 */

import * as ffi from "ffi-napi";
import * as ref from "ref-napi";
import StructType from "ref-struct-napi";
import ArrayType from "ref-array-napi";
import logger from "../utils/logger";
import {
  RETURN_CODES,
  PORT_MODES,
  SENSOR_STATUS,
  PARAMETER_INDEX,
} from "../utils/constants";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

const BYTE = ref.types.uint8;
const WORD = ref.types.uint16;
const LONG = ref.types.int32;
const DWORD = ref.types.uint32;

// Device Identification Structure
const TDeviceIdentification = StructType({
  Name: ArrayType(BYTE, 8),
  ProductCode: ArrayType(BYTE, 16),
  ViewName: ArrayType(BYTE, 100),
});

// Extended Info Structure
const TInfoEx = StructType({
  COM: ArrayType(BYTE, 10),
  DirectParameterPage: ArrayType(BYTE, 16),
  ActualMode: BYTE,
  SensorStatus: BYTE,
  CurrentBaudrate: BYTE,
});

// Parameter Structure for ISDU
const TParameter = StructType({
  Result: ArrayType(BYTE, 256),
  Index: WORD,
  SubIndex: BYTE,
  Length: BYTE,
  ErrorCode: BYTE,
  AdditionalCode: BYTE,
});

// Port Configuration Structure
const TPortConfiguration = StructType({
  PortModeDetails: BYTE,
  TargetMode: BYTE,
  CRID: BYTE,
  DSConfigure: BYTE,
  Synchronisation: BYTE,
  FunctionID: ArrayType(BYTE, 2),
  InspectionLevel: BYTE,
  VendorID: ArrayType(BYTE, 2),
  DeviceID: ArrayType(BYTE, 3),
  SerialNumber: ArrayType(BYTE, 16),
  InputLength: BYTE,
  OutputLength: BYTE,
});

// ============================================================================
// DLL LOADING
// ============================================================================

const iolinkDll = ffi.Library(
  __dirname +
    "/../../TMG_USB_IO-Link_Interface_V2_DLL/Sample_x64/Sample_C/SimpleApplication/TMGIOLUSBIF20_64.dll",
  {
    // Core master functions
    IOL_GetUSBDevices: [LONG, [ref.refType(TDeviceIdentification), LONG]],
    IOL_Create: [LONG, [ref.types.CString]],
    IOL_Destroy: [LONG, [LONG]],

    // Port configuration and status
    IOL_GetModeEx: [LONG, [LONG, DWORD, ref.refType(TInfoEx), ref.types.bool]],
    IOL_GetSensorStatus: [LONG, [LONG, DWORD, ref.refType(DWORD)]],
    IOL_GetPortConfig: [LONG, [LONG, DWORD, ref.refType(TPortConfiguration)]],
    IOL_SetPortConfig: [LONG, [LONG, DWORD, ref.refType(TPortConfiguration)]],

    // Parameter communication (ISDU)
    IOL_ReadReq: [LONG, [LONG, DWORD, ref.refType(TParameter)]],
    IOL_WriteReq: [LONG, [LONG, DWORD, ref.refType(TParameter)]],

    // Process data communication
    IOL_ReadInputs: [
      LONG,
      [LONG, DWORD, ref.refType(BYTE), ref.refType(DWORD), ref.refType(DWORD)],
    ],
    IOL_WriteOutputs: [LONG, [LONG, DWORD, ref.refType(BYTE), DWORD]],
  }
) as any;

// ============================================================================
// INTERFACES
// ============================================================================

interface MasterState {
  handle: number;
  deviceName: string;
  ports: Map<number, PortState>;
  initialized: boolean;
  configurationComplete: boolean;
}

interface PortState {
  portNumber: number;
  configured: boolean;
  actualMode: number;
  deviceInfo: any;
}

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

interface DeviceInfo {
  port: number;
  vendorId: string;
  deviceId: string;
  functionId: string;
  revisionId: string;
  vendorName: string;
  deviceName: string;
  processDataInputLength: number;
  processDataOutputLength: number;
}

// ============================================================================
// IO-LINK SERVICE CLASS
// ============================================================================

class IOLinkService {
  private masterStates: Map<number, MasterState>;
  private globalMasterRegistry: Map<
    string,
    { handle: number; connected: boolean }
  >;

  constructor() {
    this.masterStates = new Map();
    this.globalMasterRegistry = new Map();
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private checkReturnCode(returnCode: number, operation: string): void {
    if (returnCode !== RETURN_CODES.RETURN_OK) {
      const error: any = new Error(
        `${operation} failed with code: ${returnCode}`
      );
      error.code = returnCode;
      throw error;
    }
  }

  private extractString(arrayField: any): string {
    try {
      if (!arrayField) return "Unknown";
      const buffer = Buffer.isBuffer(arrayField)
        ? arrayField
        : Buffer.from(arrayField);
      let length = 0;
      while (length < buffer.length && buffer[length] !== 0) length++;
      return buffer.slice(0, length).toString("utf8").trim() || "Unknown";
    } catch (e) {
      return "Unknown";
    }
  }

  private getVendorName(vendorId: number): string {
    const vendors: Record<number, string> = {
      0x0001: "SICK AG",
      0x0002: "Balluff",
      0x0003: "ifm electronic",
      0x0004: "Turck",
      0x0005: "Pepperl+Fuchs",
      0x0006: "OMRON",
      0x0007: "Baumer",
      0x0008: "Banner Engineering",
      0x0009: "Leuze electronic",
      0x000a: "Vendor_A",
    };
    return vendors[vendorId] || `Vendor_${vendorId.toString(16).toUpperCase()}`;
  }

  private getDeviceName(vendorId: number, deviceId: number): string {
    const deviceMappings: Record<string, Record<string, string>> = {
      "0x000A": {
        "0x0A2B11": "Temperature Sensor",
      },
    };

    const vendorKey = `0x${vendorId
      .toString(16)
      .toUpperCase()
      .padStart(4, "0")}`;
    const deviceKey = `0x${deviceId
      .toString(16)
      .toUpperCase()
      .padStart(6, "0")}`;

    if (deviceMappings[vendorKey] && deviceMappings[vendorKey][deviceKey]) {
      return deviceMappings[vendorKey][deviceKey];
    }

    return `Device_${deviceId.toString(16).toUpperCase()}`;
  }

  private parseDeviceInfoFromDPP(dpp: Buffer, port: number): DeviceInfo | null {
    try {
      if (!dpp || dpp.length < 16) {
        return null;
      }

      const vendorId = (dpp[0] << 8) | dpp[1];
      const deviceId = (dpp[2] << 16) | (dpp[3] << 8) | dpp[4];
      const functionId = (dpp[5] << 8) | dpp[6];
      const revisionId = dpp[8];
      const pdInLength = dpp[9];
      const pdOutLength = dpp[10];

      return {
        port: port,
        vendorId: `0x${vendorId.toString(16).toUpperCase().padStart(4, "0")}`,
        deviceId: `0x${deviceId.toString(16).toUpperCase().padStart(6, "0")}`,
        functionId: `0x${functionId
          .toString(16)
          .toUpperCase()
          .padStart(4, "0")}`,
        revisionId: `0x${revisionId
          .toString(16)
          .toUpperCase()
          .padStart(2, "0")}`,
        vendorName: this.getVendorName(vendorId),
        deviceName: this.getDeviceName(vendorId, deviceId),
        processDataInputLength: pdInLength,
        processDataOutputLength: pdOutLength,
      };
    } catch (error: any) {
      logger.error(`Error parsing device info from DPP: ${error.message}`);
      return null;
    }
  }

  // ============================================================================
  // MASTER DISCOVERY AND CONNECTION
  // ============================================================================

  async discoverMasters(): Promise<DiscoveredMaster[]> {
    const maxDevices = 5;
    logger.info("Searching for IO-Link Master devices...");

    try {
      const structSize = (TDeviceIdentification as any).size;
      const bufferSize = structSize * maxDevices;
      const deviceBuffer = Buffer.alloc(bufferSize);

      const numDevices = iolinkDll.IOL_GetUSBDevices(deviceBuffer, maxDevices);
      logger.info(`Found ${numDevices} device(s)`);

      if (numDevices <= 0) {
        return [];
      }

      const discoveredMasters: DiscoveredMaster[] = [];
      for (let i = 0; i < numDevices; i++) {
        try {
          const offset = i * structSize;
          const deviceSlice = deviceBuffer.slice(offset, offset + structSize);
          const device = ref.get(deviceSlice, 0, TDeviceIdentification) as any;

          if (!device) continue;

          const master: DiscoveredMaster = {
            name: this.extractString(device.Name),
            productCode: this.extractString(device.ProductCode),
            viewName: this.extractString(device.ViewName),
            index: i,
          };

          if (
            master.name &&
            master.name !== "Unknown" &&
            master.name.trim() !== ""
          ) {
            discoveredMasters.push(master);
            logger.info(`Found Master: ${master.name} (${master.productCode})`);
          }
        } catch (err: any) {
          logger.error(`Error processing device ${i}:`, err.message);
        }
      }

      return discoveredMasters;
    } catch (error: any) {
      logger.error(`Error discovering masters: ${error.message}`);
      throw error;
    }
  }

  async connectToMaster(deviceName: string): Promise<number> {
    try {
      logger.info(`Connecting to master: ${deviceName}`);
      const handle = iolinkDll.IOL_Create(deviceName);

      if (handle <= 0) {
        throw new Error(
          `Failed to connect to device: ${deviceName} (handle: ${handle})`
        );
      }

      const masterState: MasterState = {
        handle: handle,
        deviceName: deviceName,
        ports: new Map(),
        initialized: false,
        configurationComplete: false,
      };

      this.masterStates.set(handle, masterState);
      this.globalMasterRegistry.set(deviceName, { handle, connected: true });

      // Reset master state first (clean initialization)
      await this.resetMaster(handle);

      // Initialize the master (configure ports for IO-Link operation)
      await this.initializeMaster(handle, deviceName);

      logger.info(
        `Successfully connected and initialized master ${deviceName} with handle ${handle}`
      );
      return handle;
    } catch (error: any) {
      logger.error(
        `Failed to connect to master ${deviceName}: ${error.message}`
      );
      throw error;
    }
  }

  async resetMaster(handle: number): Promise<boolean> {
    logger.info(`Resetting master state for handle ${handle}...`);

    try {
      // Clear all port configurations first
      for (let port = 0; port < 2; port++) {
        // 0-based for DLL
        try {
          const clearConfig = new (TPortConfiguration as any)();
          // Set all fields to 0 (like memset in TMG sample)
          clearConfig.PortModeDetails = 0;
          clearConfig.TargetMode = 0;
          clearConfig.CRID = 0;
          clearConfig.DSConfigure = 0;
          clearConfig.Synchronisation = 0;
          clearConfig.FunctionID[0] = 0;
          clearConfig.FunctionID[1] = 0;
          clearConfig.InspectionLevel = 0;
          clearConfig.VendorID[0] = 0;
          clearConfig.VendorID[1] = 0;
          clearConfig.DeviceID[0] = 0;
          clearConfig.DeviceID[1] = 0;
          clearConfig.DeviceID[2] = 0;
          clearConfig.InputLength = 0;
          clearConfig.OutputLength = 0;

          const clearResult = iolinkDll.IOL_SetPortConfig(
            handle,
            port,
            clearConfig.ref()
          );
          logger.debug(`Port ${port + 1}: Reset result = ${clearResult}`);
        } catch (portError: any) {
          logger.debug(`Port ${port + 1}: Reset failed - ${portError.message}`);
        }
      }

      logger.info(`Master reset complete, waiting for stabilization...`);
      // Wait for hardware stabilization after reset
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return true;
    } catch (error: any) {
      logger.error(`Master reset failed: ${error.message}`);
      return false;
    }
  }

  async initializeMaster(
    handle: number,
    deviceName: string,
    maxPorts: number = 2
  ): Promise<void> {
    logger.info(`Initializing IO-Link Master: ${deviceName}`);

    const masterState = this.masterStates.get(handle);
    if (!masterState) {
      throw new Error(`Master state not found for handle ${handle}`);
    }

    logger.info(`Configuring ${maxPorts} ports for IO-Link operation...`);

    for (let port = 1; port <= maxPorts; port++) {
      try {
        const configSuccess = await this.configurePortForIOLink(handle, port);
        if (configSuccess) {
          logger.info(`Port ${port}: Configured for IO-Link operation`);
        } else {
          logger.debug(
            `Port ${port}: Configuration failed or port does not exist`
          );
        }
      } catch (error: any) {
        logger.error(`Port ${port}: Configuration error: ${error.message}`);
      }
    }

    masterState.initialized = true;
    masterState.configurationComplete = true;

    logger.info(
      "Waiting for port stabilization (IO-Link timing requirements)..."
    );
    await new Promise((resolve) => setTimeout(resolve, 5000));

    logger.info("Additional device detection wait...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    logger.info(`Master ${deviceName} initialization complete`);
  }

  async configurePortForIOLink(handle: number, port: number): Promise<boolean> {
    try {
      const zeroBasedPort = port - 1; // 0-based for DLL

      logger.debug(`Port ${port}: Checking current configuration state...`);

      // Get current port configuration
      const currentConfig = new (TPortConfiguration as any)();
      const checkResult = iolinkDll.IOL_GetPortConfig(
        handle,
        zeroBasedPort,
        currentConfig.ref()
      );

      if (checkResult === RETURN_CODES.RETURN_WRONG_PARAMETER) {
        return false; // Port doesn't exist
      }

      logger.debug(
        `Port ${port}: Current config - TargetMode=${
          currentConfig.TargetMode
        }, CRID=0x${currentConfig.CRID.toString(16)}`
      );

      // Create IO-Link port configuration
      const portConfig = new (TPortConfiguration as any)();
      portConfig.PortModeDetails = 0;
      portConfig.TargetMode = PORT_MODES.SM_MODE_IOLINK_OPERATE;
      portConfig.CRID = 0x11;
      portConfig.DSConfigure = 0;
      portConfig.Synchronisation = 0;
      portConfig.FunctionID[0] = 0;
      portConfig.FunctionID[1] = 0;
      portConfig.InspectionLevel = 0; // SM_VALIDATION_MODE_NONE
      portConfig.VendorID[0] = 0;
      portConfig.VendorID[1] = 0;
      portConfig.DeviceID[0] = 0;
      portConfig.DeviceID[1] = 0;
      portConfig.DeviceID[2] = 0;
      portConfig.InputLength = 32;
      portConfig.OutputLength = 32;

      logger.debug(
        `Port ${port}: Setting config - CRID=0x${portConfig.CRID.toString(
          16
        )}, TargetMode=${portConfig.TargetMode}, InspectionLevel=${
          portConfig.InspectionLevel
        }`
      );

      const result = iolinkDll.IOL_SetPortConfig(
        handle,
        zeroBasedPort,
        portConfig.ref()
      );

      this.checkReturnCode(result, `Configure port ${port}`);
      logger.debug(
        `Port ${port}: IOL_SetPortConfig result = ${result} (SUCCESS)`
      );

      return true;
    } catch (error: any) {
      logger.error(`Failed to configure port ${port}: ${error.message}`);
      return false;
    }
  }

  async disconnectFromMaster(handle: number): Promise<boolean> {
    try {
      const masterState = this.masterStates.get(handle);
      if (!masterState) {
        throw new Error(`No master found with handle ${handle}`);
      }

      logger.info(`Disconnecting from master: ${masterState.deviceName}`);

      for (const [portNumber] of masterState.ports) {
        await this.clearPortConfiguration(handle, portNumber);
      }

      const result = iolinkDll.IOL_Destroy(handle);
      this.checkReturnCode(
        result,
        `Disconnect from master ${masterState.deviceName}`
      );

      this.globalMasterRegistry.delete(masterState.deviceName);
      this.masterStates.delete(handle);

      logger.info(
        `Successfully disconnected from master ${masterState.deviceName}`
      );
      return true;
    } catch (error: any) {
      logger.error(`Failed to disconnect from master: ${error.message}`);
      throw error;
    }
  }

  // ============================================================================
  // PORT CONFIGURATION
  // ============================================================================

  async clearPortConfiguration(handle: number, port: number): Promise<boolean> {
    try {
      const clearConfig = new (TPortConfiguration as any)();

      clearConfig.PortModeDetails = 0;
      clearConfig.TargetMode = 0;
      clearConfig.CRID = 0;
      clearConfig.DSConfigure = 0;
      clearConfig.Synchronisation = 0;
      clearConfig.FunctionID[0] = 0;
      clearConfig.FunctionID[1] = 0;
      clearConfig.InspectionLevel = 0;
      clearConfig.VendorID[0] = 0;
      clearConfig.VendorID[1] = 0;
      clearConfig.DeviceID[0] = 0;
      clearConfig.DeviceID[1] = 0;
      clearConfig.DeviceID[2] = 0;
      clearConfig.InputLength = 0;
      clearConfig.OutputLength = 0;

      const result = iolinkDll.IOL_SetPortConfig(
        handle,
        port - 1,
        clearConfig.ref()
      );
      this.checkReturnCode(result, `Clear port ${port} configuration`);

      return true;
    } catch (error: any) {
      logger.error(
        `Error clearing port ${port} configuration: ${error.message}`
      );
      throw error;
    }
  }

  async checkPortStatus(handle: number, port: number): Promise<PortStatus> {
    try {
      const infoEx = new (TInfoEx as any)();
      const result = iolinkDll.IOL_GetModeEx(
        handle,
        port - 1,
        infoEx.ref(),
        true
      );
      this.checkReturnCode(result, `Get port ${port} status`);

      const isConnected =
        (infoEx.SensorStatus & SENSOR_STATUS.BIT_CONNECTED) !== 0;
      const isPreoperate =
        (infoEx.SensorStatus & SENSOR_STATUS.BIT_PREOPERATE) !== 0;
      const isWrongSensor =
        (infoEx.SensorStatus & SENSOR_STATUS.BIT_WRONGSENSOR) !== 0;

      let connectionState = "DISCONNECTED";
      if (isConnected) connectionState = "OPERATE";
      else if (isPreoperate) connectionState = "PREOPERATE";
      else if (isWrongSensor) connectionState = "WRONG_DEVICE";

      return {
        port: port,
        connected: isConnected || isPreoperate,
        mode: connectionState,
        actualMode: infoEx.ActualMode,
        sensorStatus: infoEx.SensorStatus,
        baudrate: infoEx.CurrentBaudrate,
        directParameterPage: Buffer.from(infoEx.DirectParameterPage).slice(
          0,
          16
        ),
        timestamp: new Date(),
      };
    } catch (error: any) {
      logger.error(`Error checking port ${port} status: ${error.message}`);
      throw error;
    }
  }

  // ============================================================================
  // PROCESS DATA COMMUNICATION
  // ============================================================================

  async readProcessData(
    handle: number,
    port: number,
    maxLength: number = 32
  ): Promise<ProcessDataRead> {
    try {
      const buffer = Buffer.alloc(maxLength);
      const length = ref.alloc(DWORD, maxLength) as any;
      const status = ref.alloc(DWORD) as any;

      const result = iolinkDll.IOL_ReadInputs(
        handle,
        port - 1,
        buffer,
        length,
        status
      );
      this.checkReturnCode(result, `Read process data from port ${port}`);

      const actualLength = length.deref();
      return {
        data: buffer.slice(0, actualLength),
        status: status.deref(),
        port: port,
        timestamp: new Date(),
      };
    } catch (error: any) {
      logger.error(
        `Error reading process data from port ${port}: ${error.message}`
      );
      throw error;
    }
  }

  async writeProcessData(
    handle: number,
    port: number,
    data: Buffer | number[]
  ): Promise<ProcessDataWrite> {
    try {
      const buffer = data instanceof Buffer ? data : Buffer.from(data);
      const result = iolinkDll.IOL_WriteOutputs(
        handle,
        port - 1,
        buffer,
        buffer.length
      );
      this.checkReturnCode(result, `Write process data to port ${port}`);

      return {
        success: true,
        bytesWritten: buffer.length,
        port: port,
        timestamp: new Date(),
      };
    } catch (error: any) {
      logger.error(
        `Error writing process data to port ${port}: ${error.message}`
      );
      throw error;
    }
  }

  // ============================================================================
  // PARAMETER COMMUNICATION (ISDU)
  // ============================================================================

  async readParameter(
    handle: number,
    port: number,
    index: number,
    subIndex: number = 0
  ): Promise<ParameterRead> {
    try {
      const parameter = new (TParameter as any)();
      parameter.Index = index;
      parameter.SubIndex = subIndex;
      parameter.Length = 0;

      const result = iolinkDll.IOL_ReadReq(handle, port - 1, parameter.ref());
      this.checkReturnCode(
        result,
        `Read parameter ${index}.${subIndex} from port ${port}`
      );

      if (parameter.ErrorCode !== 0) {
        throw new Error(
          `IO-Link parameter read error: Code=${parameter.ErrorCode}, Additional=${parameter.AdditionalCode}`
        );
      }

      return {
        index: parameter.Index,
        subIndex: parameter.SubIndex,
        length: parameter.Length,
        data: Buffer.from(parameter.Result).slice(0, parameter.Length),
        errorCode: parameter.ErrorCode,
        additionalCode: parameter.AdditionalCode,
        port: port,
        timestamp: new Date(),
      };
    } catch (error: any) {
      logger.error(
        `Failed to read parameter ${index}.${subIndex} from port ${port}: ${error.message}`
      );
      throw error;
    }
  }

  async writeParameter(
    handle: number,
    port: number,
    index: number,
    subIndex: number = 0,
    data: Buffer | number[]
  ): Promise<ParameterWrite> {
    try {
      const parameter = new (TParameter as any)();
      parameter.Index = index;
      parameter.SubIndex = subIndex;
      parameter.Length = data.length;

      const dataBuffer = data instanceof Buffer ? data : Buffer.from(data);
      dataBuffer.copy(
        Buffer.from(parameter.Result),
        0,
        0,
        Math.min(dataBuffer.length, 256)
      );

      const result = iolinkDll.IOL_WriteReq(handle, port - 1, parameter.ref());
      this.checkReturnCode(
        result,
        `Write parameter ${index}.${subIndex} to port ${port}`
      );

      if (parameter.ErrorCode !== 0) {
        throw new Error(
          `IO-Link parameter write error: Code=${parameter.ErrorCode}, Additional=${parameter.AdditionalCode}`
        );
      }

      return {
        index: parameter.Index,
        subIndex: parameter.SubIndex,
        length: parameter.Length,
        errorCode: parameter.ErrorCode,
        additionalCode: parameter.AdditionalCode,
        port: port,
        timestamp: new Date(),
        success: true,
      };
    } catch (error: any) {
      logger.error(
        `Failed to write parameter ${index}.${subIndex} to port ${port}: ${error.message}`
      );
      throw error;
    }
  }
}

export default IOLinkService;
