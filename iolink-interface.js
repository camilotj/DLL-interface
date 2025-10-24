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

// Helper function to check return values
function checkReturnCode(returnCode, operation) {
  if (returnCode !== RETURN_CODES.RETURN_OK) {
    throw new Error(`${operation} failed with code: ${returnCode}`);
  }
}

// Configure port to IO-Link mode - THIS WAS THE MISSING CRITICAL STEP!
function setPortToIOLinkMode(handle, port) {
  try {
    console.log(`Configuring port ${port} for IO-Link mode...`);

    // Create port configuration structure (based on TMG sample code)
    const portConfig = new TPortConfiguration();

    // Set all fields to zero first (like memset in C)
    portConfig.PortModeDetails = 0; // free running IO-Link
    portConfig.TargetMode = PORT_MODES.SM_MODE_IOLINK_OPERATE; // IO-Link mode with auto-operate
    portConfig.CRID = 0x11; // IO-Link version 1.1
    portConfig.DSConfigure = 0; // Data storage disabled
    portConfig.Synchronisation = 0; // Not used
    portConfig.FunctionID[0] = 0; // Not used
    portConfig.FunctionID[1] = 0; // Not used
    portConfig.InspectionLevel = 0; // SM_VALIDATION_MODE_NONE - no validation
    portConfig.VendorID[0] = 0; // No validation
    portConfig.VendorID[1] = 0;
    portConfig.DeviceID[0] = 0; // No validation
    portConfig.DeviceID[1] = 0;
    portConfig.DeviceID[2] = 0;
    // SerialNumber array already initialized to zeros
    portConfig.InputLength = 32; // Max input length
    portConfig.OutputLength = 32; // Max output length

    // **CRITICAL FIX**: Use port 0-based indexing like the TMG sample!
    const zeroBasedPort = port - 1; // Convert 1-4 to 0-3

    const result = iolinkDll.IOL_SetPortConfig(
      handle,
      zeroBasedPort,
      portConfig.ref()
    );

    if (result === RETURN_CODES.RETURN_OK) {
      console.log(`Port ${port} configured for IO-Link mode successfully`);
      return true;
    } else {
      console.log(`Failed to configure port ${port}: error code ${result}`);
      return false;
    }
  } catch (error) {
    console.error(`Failed to configure port ${port}:`, error.message);
    return false;
  }
}

// Get port status - checks what's connected to a specific port on the IO-Link Master
function getPortStatus(handle, port) {
  try {
    // **CRITICAL FIX**: First configure the port to IO-Link mode!
    const configSuccess = setPortToIOLinkMode(handle, port);
    if (!configSuccess) {
      console.log(`Port ${port}: Failed to configure for IO-Link mode`);
      return {
        port: port,
        connected: false,
        mode: "CONFIG_FAILED",
        error: "Port configuration failed",
      };
    }

    // Give the port a moment to initialize after configuration
    // In production code, you might want to poll for status change
    console.log(`Waiting for port ${port} to initialize...`);

    // Use zero-based port indexing for DLL calls (convert 1-4 to 0-3)
    const zeroBasedPort = port - 1;

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

    // Error code 1 might still provide valid sensor status information
    // Let's check the sensor status regardless of the return code
    const isConnected =
      (infoEx.SensorStatus & SENSOR_STATUS.BIT_CONNECTED) !== 0;
    const isPreoperate =
      (infoEx.SensorStatus & SENSOR_STATUS.BIT_PREOPERATE) !== 0;
    const isWrongSensor =
      (infoEx.SensorStatus & SENSOR_STATUS.BIT_WRONGSENSOR) !== 0;
    const isSensorStateKnown =
      (infoEx.SensorStatus & SENSOR_STATUS.BIT_SENSORSTATEKNOWN) !== 0;

    console.log(
      `Port ${port}: Connected=${isConnected}, Preoperate=${isPreoperate}, WrongSensor=${isWrongSensor}, StateKnown=${isSensorStateKnown}`
    );

    // Try alternative detection method using IOL_GetSensorStatus
    if (result !== RETURN_CODES.RETURN_OK && !isSensorStateKnown) {
      console.log(
        `Port ${port}: Trying alternative sensor status detection...`
      );
      try {
        const sensorStatusRef = ref.alloc(DWORD);
        const sensorResult = iolinkDll.IOL_GetSensorStatus(
          handle,
          zeroBasedPort,
          sensorStatusRef
        );
        const altSensorStatus = sensorStatusRef.deref();

        console.log(
          `Port ${port}: IOL_GetSensorStatus result = ${sensorResult}, status = 0x${altSensorStatus.toString(
            16
          )}`
        );

        if (sensorResult === RETURN_CODES.RETURN_OK) {
          const altConnected =
            (altSensorStatus & SENSOR_STATUS.BIT_CONNECTED) !== 0;
          const altPreoperate =
            (altSensorStatus & SENSOR_STATUS.BIT_PREOPERATE) !== 0;
          const altStateKnown =
            (altSensorStatus & SENSOR_STATUS.BIT_SENSORSTATEKNOWN) !== 0;

          console.log(
            `Port ${port}: Alt method - Connected=${altConnected}, Preoperate=${altPreoperate}, StateKnown=${altStateKnown}`
          );

          if (altConnected || altPreoperate || altStateKnown) {
            console.log(
              `Port ${port}: Device detected via alternative method!`
            );
            return {
              port: port,
              connected: altConnected || altPreoperate,
              mode: altConnected
                ? "OPERATE"
                : altPreoperate
                ? "PREOPERATE"
                : "DETECTED",
              actualMode: infoEx.ActualMode,
              sensorStatus: altSensorStatus,
              baudrate: infoEx.CurrentBaudrate,
              directParameterPage: Buffer.from(
                infoEx.DirectParameterPage
              ).slice(0, 16),
              detectionMethod: "IOL_GetSensorStatus",
            };
          }
        }
      } catch (altError) {
        console.log(
          `Port ${port}: Alternative detection failed:`,
          altError.message
        );
      }

      console.log(
        `Port ${port}: No response or error (${result}) and sensor state unknown`
      );
      return {
        port: port,
        connected: false,
        mode: "UNKNOWN",
        sensorStatus: infoEx.SensorStatus,
        error: result,
      };
    }

    let connectionState = "DISCONNECTED";
    if (isConnected) connectionState = "OPERATE";
    else if (isPreoperate) connectionState = "PREOPERATE";
    else if (isWrongSensor) connectionState = "WRONG_SENSOR";

    return {
      port: port,
      connected: isConnected || isPreoperate,
      mode: connectionState,
      actualMode: infoEx.ActualMode,
      sensorStatus: infoEx.SensorStatus,
      baudrate: infoEx.CurrentBaudrate,
      directParameterPage: Buffer.from(infoEx.DirectParameterPage).slice(0, 16),
    };
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

// Get connected IO-Link Device/Sensor information from a specific port
function getConnectedDeviceInfo(handle, port) {
  try {
    const portStatus = getPortStatus(handle, port);
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

// Helper function to get vendor name from Vendor ID
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
    // Add more vendors as needed
  };
  return vendors[vendorId] || `Vendor_${vendorId.toString(16).toUpperCase()}`;
}

// Helper function to get device name (simplified)
function getDeviceName(vendorId, deviceId) {
  // This would normally require a device database lookup
  // For now, return a generic name with device ID
  return `Device_${deviceId.toString(16).toUpperCase()}`;
}

// Scan all ports of an IO-Link Master for connected IO-Link Devices/Sensors
function scanMasterPorts(handle, maxPorts = 4) {
  console.log(
    `Scanning IO-Link Master ports for connected IO-Link Devices/Sensors...`
  );
  const connectedDevices = [];

  for (let port = 1; port <= maxPorts; port++) {
    try {
      console.log(`Checking port ${port}...`);

      const portStatus = getPortStatus(handle, port);
      console.log(
        `Port ${port} status: ${portStatus.mode} (connected: ${portStatus.connected})`
      );

      if (portStatus.connected) {
        const deviceInfo = getConnectedDeviceInfo(handle, port);
        if (deviceInfo) {
          console.log(
            `Port ${port}: Found ${deviceInfo.vendorName} ${deviceInfo.deviceName}`
          );
          connectedDevices.push(deviceInfo);
        } else {
          console.log(
            `Port ${port}: Connected but could not read IO-Link Device/Sensor info`
          );
        }
      } else {
        console.log(`Port ${port}: No IO-Link Device/Sensor connected`);
      }
    } catch (error) {
      console.error(`Error scanning port ${port}:`, error.message);
    }
  }

  console.log(
    `Found ${connectedDevices.length} connected IO-Link Devices/Sensors`
  );
  return connectedDevices;
}

// Discover all IO-Link Masters and their connected IO-Link Devices/Sensors
function discoverAllDevices() {
  console.log("=== Starting Complete IO-Link Discovery ===");

  // Step 1: Find IO-Link Masters
  const masters = discoverDevices(); // This finds IO-Link Masters
  if (masters.length === 0) {
    console.log("No IO-Link Masters found.");
    return { masters: [] };
  }

  console.log(`Found ${masters.length} IO-Link Master(s)`);

  // Step 2: For each IO-Link Master, scan for connected IO-Link Devices/Sensors
  const topology = { masters: [] };

  masters.forEach((master, index) => {
    console.log(
      `\n--- Scanning IO-Link Master ${index + 1}: ${master.name} ---`
    );

    let handle = null;
    try {
      // Connect to this IO-Link Master
      handle = connect(master.name);
      console.log(`Connected to IO-Link Master: ${master.name}`);

      // Scan all ports for IO-Link Devices/Sensors
      const connectedDevices = scanMasterPorts(handle);

      // Add to topology
      topology.masters.push({
        ...master,
        handle: handle,
        connectedDevices: connectedDevices,
        totalDevices: connectedDevices.length,
      });
    } catch (error) {
      console.error(
        `Failed to scan IO-Link Master ${master.name}:`,
        error.message
      );
      topology.masters.push({
        ...master,
        handle: null,
        connectedDevices: [],
        totalDevices: 0,
        error: error.message,
      });
    }
    // Note: We keep connections open for further operations
    // They should be closed manually when done
  });

  // Summary
  const totalDevices = topology.masters.reduce(
    (sum, master) => sum + master.totalDevices,
    0
  );
  console.log(`\n=== Discovery Complete ===`);
  console.log(`IO-Link Masters found: ${topology.masters.length}`);
  console.log(`Total IO-Link Devices/Sensors found: ${totalDevices}`);

  return topology;
}

// Read process data from specific IO-Link Device/Sensor on given port
function readDeviceProcessData(handle, port) {
  const portStatus = getPortStatus(handle, port);
  if (!portStatus.connected) {
    throw new Error(`No IO-Link Device/Sensor connected to port ${port}`);
  }

  return readProcessData(handle, port); // Use existing function
}

// Write process data to specific IO-Link Device/Sensor on given port
function writeDeviceProcessData(handle, port, data) {
  const portStatus = getPortStatus(handle, port);
  if (!portStatus.connected) {
    throw new Error(`No IO-Link Device/Sensor connected to port ${port}`);
  }

  return writeProcessData(handle, port, data); // Use existing function
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
  // First verify device is connected
  const portStatus = getPortStatus(handle, port);
  if (!portStatus.connected) {
    callback(new Error(`No IO-Link Device/Sensor connected to port ${port}`));
    return () => {}; // Return empty stop function
  }

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
      const data = readDeviceProcessData(handle, port);
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
    if (master.handle) {
      try {
        disconnect(master.handle);
        console.log(`Disconnected from IO-Link Master: ${master.name}`);
      } catch (error) {
        console.error(
          `Error disconnecting from IO-Link Master ${master.name}:`,
          error.message
        );
      }
    }
  });
}

// Discover devices
// Fixed discoverDevices function with better array handling
function discoverDevices() {
  const maxDevices = 5;

  console.log("Searching for IO-Link Master devices...");

  try {
    // Create buffer to receive device information
    const structSize = TDeviceIdentification.size;
    const bufferSize = structSize * maxDevices;
    const deviceBuffer = Buffer.alloc(bufferSize);

    // Call DLL function to get device list
    const numDevices = iolinkDll.IOL_GetUSBDevices(deviceBuffer, maxDevices);
    console.log(`Found ${numDevices} devices`);

    if (numDevices <= 0) {
      console.log("No IO-Link Master devices found. Is the device connected?");
      return [];
    }

    // Enhanced debugging
    console.log(`Buffer size: ${bufferSize}, Struct size: ${structSize}`);
    console.log(`Number of devices to process: ${numDevices}`);

    const devices = [];

    // Parse each device from the buffer
    for (let i = 0; i < numDevices; i++) {
      try {
        console.log(`Processing device ${i}...`);

        // Calculate offset for this device in the buffer
        const offset = i * structSize;

        // Extract device struct from buffer
        const deviceSlice = deviceBuffer.slice(offset, offset + structSize);
        const device = ref.get(deviceSlice, 0, TDeviceIdentification);

        console.log(
          `Device ${i} extracted:`,
          typeof device,
          device ? "exists" : "undefined"
        );

        if (!device) {
          console.log(
            `Device ${i} is still undefined after all access methods`
          );
          continue;
        }

        // Extract device information safely
        const extractStringFromArray = (arrayField, fieldName) => {
          try {
            if (!arrayField) {
              console.log(`${fieldName} is null/undefined`);
              return "Unknown";
            }

            // Convert to Buffer if it's not already
            const buffer = Buffer.isBuffer(arrayField)
              ? arrayField
              : Buffer.from(arrayField);

            // Find null terminator
            let length = 0;
            while (length < buffer.length && buffer[length] !== 0) {
              length++;
            }

            const result = buffer.slice(0, length).toString("utf8").trim();
            console.log(`Extracted ${fieldName}: "${result}"`);
            return result || "Unknown";
          } catch (e) {
            console.error(`Error extracting ${fieldName}:`, e);
            return "Unknown";
          }
        };

        const deviceInfo = {
          name: extractStringFromArray(device.Name, "Name"),
          productCode: extractStringFromArray(
            device.ProductCode,
            "ProductCode"
          ),
          viewName: extractStringFromArray(device.ViewName, "ViewName"),
        };

        console.log(`Device ${i} final info:`, deviceInfo);
        devices.push(deviceInfo);
      } catch (err) {
        console.error(`Error processing device ${i}:`, err.message);
      }
    }

    console.log(`Successfully processed ${devices.length} devices`);
    return devices;
  } catch (error) {
    console.error("Error in discoverDevices:", error.message);
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

// Disconnect
function disconnect(handle) {
  const result = iolinkDll.IOL_Destroy(handle);
  checkReturnCode(result, "Disconnect");
}

// Read BLOB
function readBlob(handle, port, blobId, maxSize = 1024) {
  const buffer = Buffer.alloc(maxSize);
  const lengthRead = ref.alloc(DWORD);
  const status = new TBLOBStatus();
  const result = iolinkDll.BLOB_uploadBLOB(
    handle,
    port,
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

// Write BLOB
function writeBlob(handle, port, blobId, data) {
  const buffer = data instanceof Buffer ? data : Buffer.from(data);
  const status = new TBLOBStatus();
  const result = iolinkDll.BLOB_downloadBLOB(
    handle,
    port,
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

// Continue BLOB
function continueBlob(handle, port, status) {
  let result;
  do {
    result = iolinkDll.BLOB_Continue(handle, port, status.ref());
    if (result !== RETURN_CODES.RETURN_OK) return result;
    if (status.nextState === 7) return -1; // Error state
  } while (status.nextState !== 0);
  return result;
}

// Read process data
function readProcessData(handle, port, maxLength = 32) {
  const buffer = Buffer.alloc(maxLength);
  const length = ref.alloc(DWORD, maxLength);
  const status = ref.alloc(DWORD);
  const result = iolinkDll.IOL_ReadInputs(handle, port, buffer, length, status);
  checkReturnCode(result, "Read Process Data");
  const actualLength = length.deref();
  return { data: buffer.slice(0, actualLength), status: status.deref() };
}

// Write process data
function writeProcessData(handle, port, data) {
  const buffer = data instanceof Buffer ? data : Buffer.from(data);
  const result = iolinkDll.IOL_WriteOutputs(
    handle,
    port,
    buffer,
    buffer.length
  );
  checkReturnCode(result, "Write Process Data");
  return true;
}

// Stream data
function streamData(handle, port, interval, callback) {
  let running = true;
  const intervalId = setInterval(() => {
    if (!running) {
      clearInterval(intervalId);
      return;
    }
    try {
      const data = readProcessData(handle, port);
      callback(null, data);
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
  // Original functions (IO-Link Master discovery and basic operations)
  discoverDevices, // Discover IO-Link Masters
  connect,
  disconnect,
  readBlob,
  writeBlob,
  readProcessData,
  writeProcessData,
  streamData,

  // New enhanced functions (IO-Link Device/Sensor discovery and operations)
  discoverAllDevices, // Discover IO-Link Masters AND their connected IO-Link Devices/Sensors
  getPortStatus, // Check port status on IO-Link Master
  getConnectedDeviceInfo, // Get info about IO-Link Device/Sensor on specific port
  scanMasterPorts, // Scan all ports of an IO-Link Master
  readDeviceProcessData, // Read from specific IO-Link Device/Sensor
  writeDeviceProcessData, // Write to specific IO-Link Device/Sensor
  readDeviceParameter, // Read parameter from IO-Link Device/Sensor
  streamDeviceData, // Stream from specific IO-Link Device/Sensor
  disconnectAllMasters, // Cleanup function

  // Constants
  RETURN_CODES,
  PORT_MODES,
  SENSOR_STATUS,
};
