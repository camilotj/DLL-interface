// contains the DLL loading, structure definitions, and wrapper functions (steps 1-3 from the previous response). It exports the functions for use in other files.

const ffi = require("ffi-napi");
const ref = require("ref-napi");
const StructType = require("ref-struct-napi");
const ArrayType = require("ref-array-napi");

// Define types
const BYTE = ref.types.uint8;
const WORD = ref.types.uint16;
const LONG = ref.types.int32;
const DWORD = ref.types.uint32;
const BYTE_PTR = ref.refType(BYTE);
const DWORD_PTR = ref.refType(DWORD);
const LONG_PTR = ref.refType(LONG);

// Define TBLOBStatus structure (from TMGIOLBlob.h)
const TBLOBStatus = StructType({
  executedState: BYTE,
  errorCode: BYTE,
  additionalCode: BYTE,
  dllReturnValue: LONG,
  Position: DWORD,
  PercentComplete: BYTE,
  nextState: BYTE,
});

// Define TDeviceIdentification structure (from TMGIOLUSBIF20.h)
const TDeviceIdentification = StructType({
  Name: ArrayType(BYTE, 8),
  ProductCode: ArrayType(BYTE, 16),
  ViewName: ArrayType(BYTE, 100),
});

// Define TInfoEx structure for extended device info (from TMGIOLUSBIF20.h)
const TInfoEx = StructType({
  COM: ArrayType(BYTE, 10),
  DirectParameterPage: ArrayType(BYTE, 16),
  ActualMode: BYTE,
  SensorStatus: BYTE,
  CurrentBaudrate: BYTE,
});

// Define TParameter structure for ISDU requests (from TMGIOLUSBIF20.h)
const TParameter = StructType({
  Result: ArrayType(BYTE, 256),
  Index: WORD,
  SubIndex: BYTE,
  Length: BYTE,
  ErrorCode: BYTE,
  AdditionalCode: BYTE,
});

// Define TPortConfiguration structure (from TMGIOLUSBIF20.h)
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

// Load the DLL (adjust path if needed)
const iolinkDll = ffi.Library(
  __dirname +
    "/TMG_USB_IO-Link_Interface_V2_DLL/Sample_x64/Sample_C/SimpleApplication/TMGIOLUSBIF20_64.dll",
  {
    IOL_GetUSBDevices: [LONG, [ref.refType(TDeviceIdentification), LONG]],
    IOL_Create: [LONG, [ref.types.CString]],
    IOL_Destroy: [LONG, [LONG]],

    // Port and device discovery functions
    IOL_GetModeEx: [LONG, [LONG, DWORD, ref.refType(TInfoEx), ref.types.bool]],
    IOL_GetSensorStatus: [LONG, [LONG, DWORD, ref.refType(DWORD)]],
    IOL_GetPortConfig: [LONG, [LONG, DWORD, ref.refType(TPortConfiguration)]],
    IOL_SetPortConfig: [LONG, [LONG, DWORD, ref.refType(TPortConfiguration)]], // CRITICAL MISSING FUNCTION!
    IOL_ReadReq: [LONG, [LONG, DWORD, ref.refType(TParameter)]],

    // BLOB functions
    BLOB_uploadBLOB: [
      LONG,
      [
        LONG,
        DWORD,
        LONG,
        DWORD,
        ref.refType(BYTE),
        ref.refType(DWORD),
        ref.refType(TBLOBStatus),
      ],
    ],
    BLOB_downloadBLOB: [
      LONG,
      [LONG, DWORD, LONG, DWORD, ref.refType(BYTE), ref.refType(TBLOBStatus)],
    ],
    BLOB_Continue: [LONG, [LONG, DWORD, ref.refType(TBLOBStatus)]],
    BLOB_ReadBlobID: [
      LONG,
      [LONG, DWORD, ref.refType(LONG), ref.refType(TBLOBStatus)],
    ],

    // Process data functions
    IOL_ReadInputs: [
      LONG,
      [LONG, DWORD, ref.refType(BYTE), ref.refType(DWORD), ref.refType(DWORD)],
    ],
    IOL_WriteOutputs: [LONG, [LONG, DWORD, ref.refType(BYTE), DWORD]],
  }
);

// Return codes
const RETURN_CODES = {
  RETURN_OK: 0,
  RETURN_INTERNAL_ERROR: -1,
  RETURN_DEVICE_NOT_AVAILABLE: -2,
  RETURN_UNKNOWN_HANDLE: -7,
  RETURN_WRONG_PARAMETER: -10,
};

// Port modes (from TMGIOLUSBIF20.h)
const PORT_MODES = {
  SM_MODE_RESET: 0,
  SM_MODE_IOLINK_PREOP: 1,
  SM_MODE_SIO_INPUT: 3,
  SM_MODE_SIO_OUTPUT: 4,
  SM_MODE_IOLINK_OPERATE: 12,
};

// Sensor status bits (from TMGIOLUSBIF20.h)
const SENSOR_STATUS = {
  BIT_CONNECTED: 0x01, // IO-Link Device/Sensor connected and in OPERATE
  BIT_PREOPERATE: 0x02, // IO-Link Device/Sensor in PREOPERATE
  BIT_WRONGSENSOR: 0x10, // Wrong IO-Link Device/Sensor connected
  BIT_EVENTAVAILABLE: 0x04, // Events available
  BIT_PDVALID: 0x08, // Process data valid
  BIT_SENSORSTATEKNOWN: 0x80, // Sensor state is known
};

// Validation modes (from TMGIOLUSBIF20.h)
const VALIDATION_MODES = {
  SM_VALIDATION_MODE_NONE: 0, // No validation, each combination of device and vendor id is allowed
  SM_VALIDATION_MODE_COMPATIBLE: 1, // Device and vendor ID will be checked
  SM_VALIDATION_MODE_IDENTICAL: 2, // Device and vendor ID and the serial number will be checked
};

// Each master maintains its own state and port configurations
const masterStates = new Map(); // key: handle, value: MasterState

class MasterState {
  constructor(handle, deviceName) {
    this.handle = handle;
    this.deviceName = deviceName;
    this.ports = new Map(); // key: port number (1-based), value: PortState
    this.initialized = false;
  }
}

class PortState {
  constructor(portNumber) {
    this.portNumber = portNumber;
    this.configured = false;
    this.targetMode = PORT_MODES.SM_MODE_RESET;
    this.actualMode = PORT_MODES.SM_MODE_RESET;
    this.deviceInfo = null;
    this.lastStatusCheck = 0;
    this.configurationTimestamp = 0;
  }
}

// CHANGE 2: Helper function to check return values
function checkReturnCode(returnCode, operation) {
  if (returnCode !== RETURN_CODES.RETURN_OK) {
    throw new Error(`${operation} failed with code: ${returnCode}`);
  }
}

// This configures ALL ports during master initialization, not during status checks
function initializeMaster(handle, deviceName, maxPorts = 2) {
  console.log(`Initializing IO-Link Master: ${deviceName}`);

  // Create master state
  const masterState = new MasterState(handle, deviceName);
  masterStates.set(handle, masterState);

  // CHANGE 4: Configure all available ports during initialization
  console.log(`Configuring ${maxPorts} ports for IO-Link operation...`);

  for (let port = 1; port <= maxPorts; port++) {
    const portState = new PortState(port);

    try {
      const configSuccess = configurePortForIOLink(handle, port);
      if (configSuccess) {
        portState.configured = true;
        portState.targetMode = PORT_MODES.SM_MODE_IOLINK_OPERATE;
        portState.configurationTimestamp = Date.now();
        console.log(`Port ${port}: Configured for IO-Link operation`);
      } else {
        console.log(
          `Port ${port}: Configuration failed or port does not exist`
        );
      }
    } catch (error) {
      console.error(`Port ${port}: Configuration error:`, error.message);
    }

    masterState.ports.set(port, portState);
  }

  masterState.initialized = true;

  // CHANGE 5: Enhanced port stabilization timing based on TMG documentation
  console.log(
    "Waiting for port stabilization (IO-Link timing requirements)..."
  );

  // TMG Documentation recommends longer stabilization time for device detection
  const stabilizationTime = 5000;
  console.log(`Stabilization period: ${stabilizationTime}ms)`);

  const start = Date.now();
  while (Date.now() - start < stabilizationTime) {
    // Extended stabilization period for better device detection
  }

  // Additional device detection wait - some IO-Link devices need extra time
  console.log("Additional device detection wait...");
  const detectionStart = Date.now();
  while (Date.now() - detectionStart < 20000) {
    // Extra 2 seconds for slow-responding devices
  }

  console.log(
    `Master ${deviceName} initialization complete (total wait: ${
      Date.now() - start
    }ms)`
  );
  return masterState;
}

// CHANGE 6: Pure port configuration function (called only during initialization)
function configurePortForIOLink(handle, port) {
  try {
    const zeroBasedPort = port - 1; // Convert to 0-based indexing for DLL

    // Verify port exists by attempting to read current configuration
    try {
      const currentConfig = new TPortConfiguration();
      const checkResult = iolinkDll.IOL_GetPortConfig(
        handle,
        zeroBasedPort,
        currentConfig.ref()
      );
      if (checkResult === RETURN_CODES.RETURN_WRONG_PARAMETER) {
        return false; // Port does not exist
      }
    } catch (e) {
      return false; // Port validation failed
    }

    // Create IO-Link port configuration
    const portConfig = new TPortConfiguration();

    // CHANGE 7: Configuration values according to IO-Link specification
    portConfig.PortModeDetails = 0; // Free running mode
    portConfig.TargetMode = PORT_MODES.SM_MODE_IOLINK_OPERATE; // Target: IO-Link operational
    portConfig.CRID = 0x11; // IO-Link Capability/Revision ID v1.1
    portConfig.DSConfigure = 0; // Data storage disabled initially
    portConfig.Synchronisation = 0; // Asynchronous operation
    portConfig.FunctionID[0] = 0; // No specific function
    portConfig.FunctionID[1] = 0;
    portConfig.InspectionLevel = VALIDATION_MODES.SM_VALIDATION_MODE_NONE; // Use proper constant for no validation
    portConfig.VendorID[0] = 0; // No vendor restriction
    portConfig.VendorID[1] = 0;
    portConfig.DeviceID[0] = 0; // No device restriction
    portConfig.DeviceID[1] = 0;
    portConfig.DeviceID[2] = 0;
    // SerialNumber array defaults to zeros (no serial restriction)
    portConfig.InputLength = 32; // Maximum input data length
    portConfig.OutputLength = 32; // Maximum output data length

    console.log(
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

    console.log(
      `Port ${port}: IOL_SetPortConfig result = ${result} (${
        result === RETURN_CODES.RETURN_OK ? "SUCCESS" : "FAILED"
      })`
    );
    return result === RETURN_CODES.RETURN_OK;
  } catch (error) {
    console.error(`Port ${port} configuration error:`, error.message);
    return false;
  }
}

// CHANGE 8: Status checking function (NO configuration, just status)
// This follows the IO-Link state machine - configuration is separate from monitoring
function checkPortStatus(handle, port) {
  try {
    const masterState = masterStates.get(handle);
    if (!masterState || !masterState.initialized) {
      throw new Error("Master not initialized. Call initializeMaster() first.");
    }

    const portState = masterState.ports.get(port);
    if (!portState || !portState.configured) {
      return {
        port: port,
        connected: false,
        mode: "NOT_CONFIGURED",
        error: "Port not configured during master initialization",
      };
    }

    const zeroBasedPort = port - 1;

    // Get current port status without any configuration changes
    const infoEx = new TInfoEx();
    const result = iolinkDll.IOL_GetModeEx(
      handle,
      zeroBasedPort,
      infoEx.ref(),
      false
    );

    // Update port state with current actual mode
    portState.actualMode = infoEx.ActualMode;
    portState.lastStatusCheck = Date.now();

    // Parse sensor status according to IO-Link specification
    const isConnected =
      (infoEx.SensorStatus & SENSOR_STATUS.BIT_CONNECTED) !== 0;
    const isPreoperate =
      (infoEx.SensorStatus & SENSOR_STATUS.BIT_PREOPERATE) !== 0;
    const isWrongSensor =
      (infoEx.SensorStatus & SENSOR_STATUS.BIT_WRONGSENSOR) !== 0;
    const isSensorStateKnown =
      (infoEx.SensorStatus & SENSOR_STATUS.BIT_SENSORSTATEKNOWN) !== 0;

    // Determine connection state according to IO-Link state machine
    let connectionState = "DISCONNECTED";
    if (isConnected) connectionState = "OPERATE";
    else if (isPreoperate) connectionState = "PREOPERATE";
    else if (isWrongSensor) connectionState = "WRONG_DEVICE";
    else if (isSensorStateKnown) connectionState = "DETECTED";

    const status = {
      port: port,
      connected: isConnected || isPreoperate,
      mode: connectionState,
      actualMode: infoEx.ActualMode,
      targetMode: portState.targetMode,
      sensorStatus: infoEx.SensorStatus,
      baudrate: infoEx.CurrentBaudrate,
      directParameterPage: Buffer.from(infoEx.DirectParameterPage).slice(0, 16),
      configuredAt: portState.configurationTimestamp,
      lastChecked: portState.lastStatusCheck,
    };

    // CHANGE 9: Update device info in port state if device is connected
    if (status.connected && !portState.deviceInfo) {
      portState.deviceInfo = parseDeviceInfoFromDPP(
        status.directParameterPage,
        port
      );
    } else if (!status.connected) {
      portState.deviceInfo = null; // Clear device info if disconnected
    }

    return status;
  } catch (error) {
    console.error(`Error checking port ${port} status:`, error.message);
    return {
      port: port,
      connected: false,
      mode: "ERROR",
      error: error.message,
    };
  }
}

// CHANGE 10: Parse device information from Direct Parameter Page according to IO-Link spec
function parseDeviceInfoFromDPP(dpp, port) {
  try {
    if (!dpp || dpp.length < 16) {
      return null;
    }

    // Parse according to IO-Link Direct Parameter Page specification (Index 0)
    const vendorId = (dpp[0] << 8) | dpp[1]; // Bytes 0-1: Vendor ID
    const deviceId = (dpp[2] << 16) | (dpp[3] << 8) | dpp[4]; // Bytes 2-4: Device ID
    const functionId = (dpp[5] << 8) | dpp[6]; // Bytes 5-6: Function ID
    const reserved = dpp[7]; // Byte 7: Reserved
    const revisionId = dpp[8]; // Byte 8: Revision ID
    const pdInLength = dpp[9]; // Byte 9: Process Data Input Length
    const pdOutLength = dpp[10]; // Byte 10: Process Data Output Length
    const vendorSpecific = dpp.slice(11, 16); // Bytes 11-15: Vendor specific

    return {
      port: port,
      vendorId: `0x${vendorId.toString(16).toUpperCase().padStart(4, "0")}`,
      deviceId: `0x${deviceId.toString(16).toUpperCase().padStart(6, "0")}`,
      functionId: `0x${functionId.toString(16).toUpperCase().padStart(4, "0")}`,
      revisionId: `0x${revisionId.toString(16).toUpperCase().padStart(2, "0")}`,
      vendorName: getVendorName(vendorId),
      deviceName: getDeviceName(vendorId, deviceId),
      processDataInputLength: pdInLength,
      processDataOutputLength: pdOutLength,
      vendorSpecific: vendorSpecific,
    };
  } catch (error) {
    console.error(`Error parsing device info from DPP:`, error.message);
    return null;
  }
}

/* // Synchronous version of the status check with retries
function waitForInitializationSync(
  handle,
  port,
  zeroBasedPort,
  maxRetries = 3
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`Port ${port}: Status check attempt ${attempt}/${maxRetries}`);

    try {
      const infoEx = new TInfoEx();
      const result = iolinkDll.IOL_GetModeEx(
        handle,
        zeroBasedPort,
        infoEx.ref(),
        false
      );

      console.log(`Port ${port}: IOL_GetModeEx result = ${result}`);
      console.log(
        `Port ${port}: SensorStatus = 0x${infoEx.SensorStatus.toString(16)}`
      );
      console.log(`Port ${port}: ActualMode = ${infoEx.ActualMode}`);

      const isConnected =
        (infoEx.SensorStatus & SENSOR_STATUS.BIT_CONNECTED) !== 0;
      const isPreoperate =
        (infoEx.SensorStatus & SENSOR_STATUS.BIT_PREOPERATE) !== 0;
      const isSensorStateKnown =
        (infoEx.SensorStatus & SENSOR_STATUS.BIT_SENSORSTATEKNOWN) !== 0;

      // If device is found, return immediately
      if (isConnected || isPreoperate) {
        const connectionState = isConnected ? "OPERATE" : "PREOPERATE";
        console.log(`Port ${port}: Device found in ${connectionState} mode!`);

        return {
          port: port,
          connected: true,
          mode: connectionState,
          actualMode: infoEx.ActualMode,
          sensorStatus: infoEx.SensorStatus,
          baudrate: infoEx.CurrentBaudrate,
          directParameterPage: Buffer.from(infoEx.DirectParameterPage).slice(
            0,
            16
          ),
          attempts: attempt,
        };
      }

      // If this is the last attempt, return the final state
      if (attempt === maxRetries) {
        console.log(
          `Port ${port}: No device detected after ${maxRetries} attempts`
        );
        return {
          port: port,
          connected: false,
          mode: "DISCONNECTED",
          actualMode: infoEx.ActualMode,
          sensorStatus: infoEx.SensorStatus,
          attempts: attempt,
        };
      }

      // Wait before next attempt (simple blocking wait)
      console.log(`Port ${port}: Waiting 2 seconds before next attempt...`);
      const start = Date;
      while (Date.now() - start < 2000) {
        // Blocking wait
      }
    } catch (error) {
      console.error(
        `Port ${port}: Error in attempt ${attempt}:`,
        error.message
      );
      if (attempt === maxRetries) {
        return {
          port: port,
          connected: false,
          mode: "ERROR",
          error: error.message,
          attempts: attempt,
        };
      }
    }
  }
} */

// Get connected IO-Link Device/Sensor information from a specific port
function getConnectedDeviceInfo(handle, port) {
  try {
    const portStatus = checkPortStatus(handle, port);
    if (!portStatus.connected) {
      return null; // No IO-Link Device/Sensor connected to this port
    }

    // Extract device info from Direct Parameter Page (DPP)
    const dpp = portStatus.directParameterPage;
    if (!dpp || dpp.length < 16) {
      return {
        port: port,
        vendorId: "Unknown",
        deviceId: "Unknown",
        vendorName: "Unknown",
        deviceName: "Unknown",
        serialNumber: "Unknown",
        status: portStatus,
      };
    }

    // Parse Direct Parameter Page (Index 0) according to IO-Link spec
    const vendorId = (dpp[0] << 8) | dpp[1]; // Bytes 0-1: Vendor ID
    const deviceId = (dpp[2] << 16) | (dpp[3] << 8) | dpp[4]; // Bytes 2-4: Device ID
    const functionId = (dpp[5] << 8) | dpp[6]; // Bytes 5-6: Function ID
    const revisionId = dpp[8]; // Byte 8: Revision ID
    const pdInLength = dpp[9]; // Byte 9: Process Data Input Length
    const pdOutLength = dpp[10]; // Byte 10: Process Data Output Length

    // Try to read additional parameters like serial number (Index 21)
    let serialNumber = "Unknown";
    try {
      const serialParam = new TParameter();
      serialParam.Index = 21; // Serial Number parameter index
      serialParam.SubIndex = 0;
      serialParam.Length = 0;

      const serialResult = iolinkDll.IOL_ReadReq(
        handle,
        port,
        serialParam.ref()
      );
      if (
        serialResult === RETURN_CODES.RETURN_OK &&
        serialParam.ErrorCode === 0
      ) {
        // Extract serial number from Result buffer
        const serialBuffer = Buffer.from(serialParam.Result).slice(
          0,
          serialParam.Length
        );
        serialNumber = serialBuffer.toString("ascii").replace(/\0/g, "").trim();
      }
    } catch (e) {
      // Serial number reading failed, use Unknown
    }

    return {
      port: port,
      vendorId: `0x${vendorId.toString(16).toUpperCase().padStart(4, "0")}`,
      deviceId: `0x${deviceId.toString(16).toUpperCase().padStart(6, "0")}`,
      functionId: `0x${functionId.toString(16).toUpperCase().padStart(4, "0")}`,
      revisionId: `0x${revisionId.toString(16).toUpperCase().padStart(2, "0")}`,
      vendorName: getVendorName(vendorId),
      deviceName: getDeviceName(vendorId, deviceId),
      serialNumber: serialNumber,
      processDataInputLength: pdInLength,
      processDataOutputLength: pdOutLength,
      status: portStatus,
    };
  } catch (error) {
    console.error(
      `Error reading IO-Link Device/Sensor info from port ${port}:`,
      error.message
    );
    return null;
  }
}

// CHANGE 11: Scan master ports (uses status checking, not configuration)
function scanMasterPorts(handle) {
  console.log("Scanning configured ports for connected devices...");

  const masterState = masterStates.get(handle);
  if (!masterState || !masterState.initialized) {
    throw new Error("Master not initialized. Call initializeMaster() first.");
  }

  const connectedDevices = [];

  // Check each configured port
  for (const [portNumber, portState] of masterState.ports) {
    if (!portState.configured) {
      console.log(`Port ${portNumber}: Not configured, skipping`);
      continue;
    }

    console.log(`Checking port ${portNumber} for connected devices...`);

    try {
      const status = checkPortStatus(handle, portNumber);
      console.log(
        `Port ${portNumber}: ${status.mode} (connected: ${status.connected})`
      );

      if (status.connected && portState.deviceInfo) {
        console.log(
          `Port ${portNumber}: Found ${portState.deviceInfo.vendorName} ${portState.deviceInfo.deviceName}`
        );
        connectedDevices.push({
          ...portState.deviceInfo,
          status: status,
        });
      }
    } catch (error) {
      console.error(`Error checking port ${portNumber}:`, error.message);
    }
  }

  console.log(
    `Scan complete: Found ${connectedDevices.length} connected devices`
  );
  return connectedDevices;
}

function discoverAllDevices() {
  console.log("=== IO-Link Discovery===");

  // Step 1: Discover IO-Link Masters
  const masters = discoverMasters();
  if (masters.length === 0) {
    console.log("No IO-Link Masters found.");
    return { masters: [] };
  }

  console.log(`Found ${masters.length} IO-Link Master(s)`);

  // Step 2: Initialize each master and scan for devices
  const topology = { masters: [] };

  masters.forEach((master, index) => {
    console.log(
      `\n--- Initializing IO-Link Master ${index + 1}: ${master.name} ---`
    );

    let handle = null;
    try {
      // Connect to master
      handle = connect(master.name);
      console.log(`Connected to IO-Link Master: ${master.name}`);

      // CHANGE 13: Initialize master (configures all ports once)
      const masterState = initializeMaster(handle, master.name);

      // Scan for connected devices (no configuration, just status checking)
      const connectedDevices = scanMasterPorts(handle);

      topology.masters.push({
        ...master,
        handle: handle,
        connectedDevices: connectedDevices,
        totalDevices: connectedDevices.length,
        initialized: true,
        ports: Array.from(masterState.ports.keys()),
      });
    } catch (error) {
      console.error(
        `Failed to initialize IO-Link Master ${master.name}:`,
        error.message
      );
      topology.masters.push({
        ...master,
        handle: handle,
        connectedDevices: [],
        totalDevices: 0,
        initialized: false,
        error: error.message,
      });
    }
  });

  const totalDevices = topology.masters.reduce(
    (sum, master) => sum + master.totalDevices,
    0
  );
  console.log(`\n=== Discovery Complete ===`);
  console.log(`IO-Link Masters found: ${topology.masters.length}`);
  console.log(`Total IO-Link Devices found: ${totalDevices}`);

  return topology;
}

function getVendorName(vendorId) {
  const vendors = {
    0x0001: "SICK AG",
    0x0002: "Balluff",
    0x0003: "ifm electronic",
    0x0004: "Turck",
    0x0005: "Pepperl+Fuchs",
    0x0006: "OMRON",
    0x0007: "Baumer",
    0x0008: "Banner Engineering",
    0x0009: "Leuze electronic",
  };
  return vendors[vendorId] || `Vendor_${vendorId.toString(16).toUpperCase()}`;
}

function getDeviceName(vendorId, deviceId) {
  return `Device_${deviceId.toString(16).toUpperCase()}`;
}

//Connection validation helper
function validatePortConnection(handle, port) {
  const masterState = masterStates.get(handle);
  if (!masterState || !masterState.initialized) {
    throw new Error("Master not initialized. Call initializeMaster() first.");
  }

  const portState = masterState.ports.get(port);
  if (!portState || !portState.configured) {
    throw new Error(`Port ${port} not configured during master initialization`);
  }

  // Only check actual connection status when really needed
  const status = checkPortStatus(handle, port);
  if (!status.connected) {
    throw new Error(`No IO-Link Device/Sensor connected to port ${port}`);
  }

  return status;
}

// Read process data from specific IO-Link Device/Sensor on given port
function readDeviceProcessData(handle, port) {
  validatePortConnection(handle, port);
  return readProcessData(handle, port); // Direct call without redundant status check
}

// Write process data to specific IO-Link Device/Sensor on given port
function writeDeviceProcessData(handle, port, data) {
  validatePortConnection(handle, port);
  return writeProcessData(handle, port, data); // Direct call without redundant status check
}

// Read parameter from specific IO-Link Device/Sensor
function readDeviceParameter(handle, port, index, subIndex = 0) {
  try {
    const parameter = new TParameter();
    parameter.Index = index;
    parameter.SubIndex = subIndex;
    parameter.Length = 0; // Will be filled by the device

    const result = iolinkDll.IOL_ReadReq(handle, port, parameter.ref());
    checkReturnCode(
      result,
      `Read parameter ${index}.${subIndex} from port ${port}`
    );

    if (parameter.ErrorCode !== 0) {
      throw new Error(
        `IO-Link Device/Sensor parameter read error: ${parameter.ErrorCode}, Additional: ${parameter.AdditionalCode}`
      );
    }

    return {
      index: parameter.Index,
      subIndex: parameter.SubIndex,
      length: parameter.Length,
      data: Buffer.from(parameter.Result).slice(0, parameter.Length),
      errorCode: parameter.ErrorCode,
      additionalCode: parameter.AdditionalCode,
    };
  } catch (error) {
    throw new Error(
      `Failed to read parameter ${index}.${subIndex} from IO-Link Device/Sensor on port ${port}: ${error.message}`
    );
  }
}

// Enhanced streaming for specific IO-Link Device/Sensor
function streamDeviceData(handle, port, interval, callback) {
  const connectionStatus = validatePortConnection(handle, port);

  const deviceInfo = getConnectedDeviceInfo(handle, port);
  console.log(
    `Starting data stream from IO-Link Device/Sensor on port ${port}: ${deviceInfo?.vendorName} ${deviceInfo?.deviceName}`
  );

  let running = true;
  const intervalId = setInterval(() => {
    if (!running) {
      clearInterval(intervalId);
      return;
    }
    try {
      // OPTIMIZATION: Direct data read without redundant status checks
      const data = readProcessData(handle, port);
      callback(null, {
        ...data,
        port: port,
        deviceInfo: deviceInfo,
        timestamp: new Date(),
      });
    } catch (err) {
      callback(err);
      running = false;
      clearInterval(intervalId);
    }
  }, interval);

  return () => {
    running = false;
    clearInterval(intervalId);
    console.log(`Stopped streaming from IO-Link Device/Sensor on port ${port}`);
  };
}

// Cleanup function to disconnect from all IO-Link Masters
function disconnectAllMasters(topology) {
  console.log("Disconnecting from all IO-Link Masters...");
  topology.masters.forEach((master) => {
    if (master.handle && master.handle > 0) {
      try {
        disconnect(master.handle);
        console.log(`Disconnected from IO-Link Master: ${master.name}`);
      } catch (error) {
        console.error(
          `Error disconnecting from IO-Link Master ${master.name}:`,
          error.message
        );
      }
    } else {
      console.log(
        `Skipping ${master.name} - no valid connection (handle: ${master.handle})`
      );
    }
  });
}

// Discover masters (renamed for clarity)
function discoverMasters() {
  const maxDevices = 5;
  console.log("Searching for IO-Link Master devices...");

  try {
    const structSize = TDeviceIdentification.size;
    const bufferSize = structSize * maxDevices;
    const deviceBuffer = Buffer.alloc(bufferSize);

    const numDevices = iolinkDll.IOL_GetUSBDevices(deviceBuffer, maxDevices);
    console.log(`Found ${numDevices} devices`);

    if (numDevices <= 0) {
      return [];
    }

    const devices = [];
    for (let i = 0; i < numDevices; i++) {
      try {
        const offset = i * structSize;
        const deviceSlice = deviceBuffer.slice(offset, offset + structSize);
        const device = ref.get(deviceSlice, 0, TDeviceIdentification);

        if (!device) continue;

        const extractString = (arrayField) => {
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
        };

        devices.push({
          name: extractString(device.Name),
          productCode: extractString(device.ProductCode),
          viewName: extractString(device.ViewName),
        });
      } catch (err) {
        console.error(`Error processing device ${i}:`, err.message);
      }
    }

    return devices;
  } catch (error) {
    console.error("Error in discoverMasters:", error.message);
    return [];
  }
}

// Connect to device
function connect(deviceName) {
  const handle = iolinkDll.IOL_Create(deviceName);
  if (handle <= 0) {
    throw new Error(`Failed to connect to device: ${deviceName}`);
  }
  return handle;
}

// Clean disconnect function that properly cleans up master states
function disconnect(handle) {
  try {
    // Clean up master state
    if (!handle || handle <= 0) {
      console.log(`Skipping disconnect - invalid handle: ${handle}`);
      return;
    }

    masterStates.delete(handle);

    // Disconnect from DLL
    const result = iolinkDll.IOL_Destroy(handle);
    checkReturnCode(result, "Disconnect");
  } catch (error) {
    console.error(`Error during disconnect:`, error.message);
    // Still remove from tracking even if DLL disconnect fails
    if (handle && handle > 0) {
      masterStates.delete(handle);
    }
  }
}

// Process data and BLOB functions (unchanged but updated to require initialized master)
function readProcessData(handle, port, maxLength = 32) {
  const masterState = masterStates.get(handle);
  if (!masterState || !masterState.initialized) {
    throw new Error("Master not initialized. Call initializeMaster() first.");
  }

  const buffer = Buffer.alloc(maxLength);
  const length = ref.alloc(DWORD, maxLength);
  const status = ref.alloc(DWORD);
  const result = iolinkDll.IOL_ReadInputs(
    handle,
    port - 1,
    buffer,
    length,
    status
  );
  checkReturnCode(result, "Read Process Data");
  const actualLength = length.deref();
  return { data: buffer.slice(0, actualLength), status: status.deref() };
}

function writeProcessData(handle, port, data) {
  const masterState = masterStates.get(handle);
  if (!masterState || !masterState.initialized) {
    throw new Error("Master not initialized. Call initializeMaster() first.");
  }

  const buffer = data instanceof Buffer ? data : Buffer.from(data);
  const result = iolinkDll.IOL_WriteOutputs(
    handle,
    port - 1,
    buffer,
    buffer.length
  );
  checkReturnCode(result, "Write Process Data");
  return true;
}

// BLOB functions (unchanged)
function readBlob(handle, port, blobId, maxSize = 1024) {
  const buffer = Buffer.alloc(maxSize);
  const lengthRead = ref.alloc(DWORD);
  const status = new TBLOBStatus();
  const result = iolinkDll.BLOB_uploadBLOB(
    handle,
    port - 1,
    blobId,
    maxSize,
    buffer,
    lengthRead,
    status.ref()
  );

  if (result !== RETURN_CODES.RETURN_OK && status.nextState !== 0) {
    const continueResult = continueBlob(handle, port, status);
    if (continueResult !== RETURN_CODES.RETURN_OK) {
      throw new Error(
        `BLOB read failed: ${result}, continue failed: ${continueResult}`
      );
    }
  } else if (result !== RETURN_CODES.RETURN_OK) {
    throw new Error(`BLOB read failed with code: ${result}`);
  }

  const actualLength = lengthRead.deref();
  return buffer.slice(0, actualLength);
}

function writeBlob(handle, port, blobId, data) {
  const buffer = data instanceof Buffer ? data : Buffer.from(data);
  const status = new TBLOBStatus();
  const result = iolinkDll.BLOB_downloadBLOB(
    handle,
    port - 1,
    blobId,
    buffer.length,
    buffer,
    status.ref()
  );

  if (result !== RETURN_CODES.RETURN_OK && status.nextState !== 0) {
    const continueResult = continueBlob(handle, port, status);
    if (continueResult !== RETURN_CODES.RETURN_OK) {
      throw new Error(
        `BLOB write failed: ${result}, continue failed: ${continueResult}`
      );
    }
  } else if (result !== RETURN_CODES.RETURN_OK) {
    throw new Error(`BLOB write failed with code: ${result}`);
  }

  return true;
}

function continueBlob(handle, port, status) {
  let result;
  do {
    result = iolinkDll.BLOB_Continue(handle, port - 1, status.ref());
    if (result !== RETURN_CODES.RETURN_OK) return result;
    if (status.nextState === 7) return -1;
  } while (status.nextState !== 0);
  return result;
}

// Streaming function
function streamData(handle, port, interval, callback) {
  let running = true;
  const intervalId = setInterval(() => {
    if (!running) {
      clearInterval(intervalId);
      return;
    }
    try {
      const data = readProcessData(handle, port);
      callback(null, { ...data, timestamp: new Date(), port });
    } catch (err) {
      callback(err);
      running = false;
      clearInterval(intervalId);
    }
  }, interval);

  return () => {
    running = false;
    clearInterval(intervalId);
  };
}

module.exports = {
  discoverMasters, // Step 1: Discover available masters
  connect, // Step 2: Connect to a master
  initializeMaster, // Step 3: Initialize master (configure all ports)
  checkPortStatus, // Step 4: Monitor port status (no config)
  scanMasterPorts, // Step 5: Scan for connected devices
  disconnect, // Step 6: Clean disconnect

  // Optimization helpers
  validatePortConnection, // One-time connection validation for efficient operations

  // Legacy compatibility (but updated to require initialization)
  discoverAllDevices,
  disconnectAllMasters, // Combined discovery and initialization
  readProcessData,
  writeProcessData,
  readBlob,
  writeBlob,
  streamData,

  // Constants
  RETURN_CODES,
  PORT_MODES,
  SENSOR_STATUS,

  // State access (for debugging)
  getMasterState: (handle) => masterStates.get(handle),
};
