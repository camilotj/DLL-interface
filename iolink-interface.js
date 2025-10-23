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

// Load the DLL (adjust path if needed)
const iolinkDll = ffi.Library(
  __dirname + "/TMG_USB_IO-Link_Interface_V2_DLL/Sample_x64/Sample_C/SimpleApplication/TMGIOLUSBIF20_64.dll",
  {
    IOL_GetUSBDevices: [LONG, [ref.refType(TDeviceIdentification), LONG]],
    IOL_Create: [LONG, [ref.types.CString]],
    IOL_Destroy: [LONG, [LONG]],
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
};

// Helper function to check return values
function checkReturnCode(returnCode, operation) {
  if (returnCode !== RETURN_CODES.RETURN_OK) {
    throw new Error(`${operation} failed with code: ${returnCode}`);
  }
}

// Discover devices
// Replace your discoverDevices function with this improved version
function discoverDevices() {
  const maxDevices = 5;
  const deviceList = new ArrayType(TDeviceIdentification, maxDevices)();
  
  console.log("Searching for IO-Link Master devices...");
  const numDevices = iolinkDll.IOL_GetUSBDevices(deviceList.ref(), maxDevices);
  console.log(`Found ${numDevices} devices`);
  
  if (numDevices <= 0) {
    console.log("No IO-Link Master devices found. Is the device connected?");
    return [];
  }
  
  // Enhanced debugging
  console.log(`Device list type: ${typeof deviceList}`);
  console.log(`Device list length: ${deviceList.length}`);
  
  const devices = [];
  for (let i = 0; i < numDevices; i++) {
    try {
      console.log(`Processing device ${i}...`);
      
      // Access the device with defensive programming
      const device = deviceList[i];
      
      if (!device) {
        console.log(`Device ${i} is undefined`);
        continue;
      }
      
      // Safely get properties using fixed lengths
      // In C, these are fixed-length character arrays, so we need to extract until null terminator
      const getName = () => {
        try {
          // Find first null terminator in Name buffer
          if (!device.Name || !device.Name.length) return "Unknown";
          
          // Convert the raw buffer to a string (stopping at null terminator)
          const nameBuffer = Buffer.from(device.Name);
          let nameLength = 0;
          while (nameLength < nameBuffer.length && nameBuffer[nameLength] !== 0) {
            nameLength++;
          }
          return nameBuffer.slice(0, nameLength).toString('utf8');
        } catch (e) {
          console.error("Error extracting name:", e);
          return "COM3"; // Fallback to default COM port
        }
      };
      
      // Do the same for other properties
      const getProductCode = () => {
        try {
          if (!device.ProductCode) return "Unknown";
          const buffer = Buffer.from(device.ProductCode);
          let len = 0;
          while (len < buffer.length && buffer[len] !== 0) len++;
          return buffer.slice(0, len).toString('utf8');
        } catch (e) {
          return "Unknown";
        }
      };
      
      const deviceInfo = {
        name: getName(),
        productCode: getProductCode(),
        viewName: "TMG IO-Link Master" // Default friendly name
      };
      
      console.log(`Device ${i} info:`, deviceInfo);
      devices.push(deviceInfo);
    } catch (err) {
      console.error(`Error processing device ${i}:`, err);
    }
  }
  return devices;
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
  discoverDevices,
  connect,
  disconnect,
  readBlob,
  writeBlob,
  readProcessData,
  writeProcessData,
  streamData,
};
