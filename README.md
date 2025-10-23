# TMG IO-Link Node.js Interface

A comprehensive Node.js interface for the TMG USB IO-Link Master V2 DLL, enabling BLOB transfers, process data handling, and streaming functionality.

## 🚀 Quick Start

### Prerequisites

1. **Node.js Dependencies**: Install the required FFI packages

```bash
npm install ffi-napi ref-napi ref-struct-napi
```

2. **TMG Hardware & Drivers**:

   - TMG USB IO-Link Master V2 device
   - Install drivers from `Driver/` folder in the TMG DLL package
   - Connect device and note the COM port (e.g., COM3)

3. **TMG DLL Files**:
   - `TMGIOLUSBIF20.dll` - Main DLL
   - `TMGIOLUSBIF20.h` - Function definitions
   - `TMGIOLBlob.h` - BLOB function definitions

## 📦 Installation

1. **Clone/Copy the interface files**:

   ```
   tmg-iolink-interface.js
   example.js
   package.json
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

   **If npm install fails** (common with native modules):

   ```bash
   # Install Visual Studio Build Tools first, then:
   npm config set msvs_version 2019
   npm install --build-from-source
   ```

3. **Setup DLL path**: Ensure `TMGIOLUSBIF20.dll` is accessible:
   - Default: `./TMG_USB_IO-Link_Interface_V2_DLL_V2.31/Binaries/TMGIOLUSBIF20.dll`
   - Or specify custom path in `initialize()` method

## 🔧 Basic Usage

### Initialize and Connect

```javascript
const { TMGIOLinkInterface } = require("./tmg-iolink-interface");

const tmg = new TMGIOLinkInterface();

// Initialize DLL interface
tmg.initialize(); // Uses default DLL path
// Or specify custom path:
// tmg.initialize('C:/path/to/TMGIOLUSBIF20.dll');

// Connect to device
const handle = tmg.connect("COM3"); // Adjust COM port as needed
```

### BLOB Operations

```javascript
const port = 1;
const blobId = 0x01;

// Write BLOB data
const dataToSend = Buffer.from("Hello Device!", "utf-8");
const writeResult = tmg.writeBlob(port, blobId, dataToSend);
console.log("Write status:", writeResult.status);

// Read BLOB data
const readResult = tmg.readBlob(port, blobId, 1024);
console.log("Read data:", readResult.data.toString());
console.log("Bytes read:", readResult.bytesRead);
```

### Process Data

```javascript
// Read process data
const processData = tmg.readProcessData(port);
console.log("Process data:", processData.data.toString("hex"));

// Write process data
const outputData = Buffer.from([0x01, 0x02, 0x03, 0x04]);
tmg.writeProcessData(port, outputData);
```

### Streaming Data

```javascript
// Start streaming with 1-second interval
const stream = tmg.startStreaming(port, blobId, 1000, (data) => {
  if (data.error) {
    console.error("Stream error:", data.error);
  } else {
    console.log("Received:", data.data.toString("hex"));
    console.log("Timestamp:", data.timestamp);
  }
});

// Stop streaming after 10 seconds
setTimeout(() => {
  stream.stop();
}, 10000);
```

## 📚 API Reference

### TMGIOLinkInterface Class

#### Constructor

```javascript
const tmg = new TMGIOLinkInterface();
```

#### Methods

##### `initialize(dllPath?)`

Initialize the DLL interface.

- `dllPath` (optional): Path to TMGIOLUSBIF20.dll

##### `connect(deviceName)`

Connect to TMG device.

- `deviceName`: Device name (e.g., "COM3")
- Returns: Handle number

##### `disconnect()`

Disconnect from device and cleanup resources.

##### `getUSBDevices()`

Get list of available USB devices.

- Returns: Array of device info objects

##### `readBlob(port, blobId, bufferSize?)`

Read BLOB data from device.

- `port`: Port number (1-4)
- `blobId`: BLOB identifier
- `bufferSize`: Buffer size (default: 1024)
- Returns: `{ data, bytesRead, status }`

##### `writeBlob(port, blobId, dataBuffer)`

Write BLOB data to device.

- `port`: Port number
- `blobId`: BLOB identifier
- `dataBuffer`: Buffer with data to write
- Returns: `{ status }`

##### `readProcessData(port)`

Read process data from device.

- `port`: Port number
- Returns: `{ data, length, status }`

##### `writeProcessData(port, data)`

Write process data to device.

- `port`: Port number
- `data`: Buffer with data to write

##### `startStreaming(port, blobId, intervalMs, callback)`

Start streaming data from device.

- `port`: Port number
- `blobId`: BLOB identifier
- `intervalMs`: Polling interval
- `callback`: Function to handle received data
- Returns: Stream control object with `stop()` method

## 🔍 Error Handling

The interface provides comprehensive error handling:

```javascript
try {
  const result = tmg.readBlob(port, blobId);
  console.log("Success:", result);
} catch (error) {
  console.error("Operation failed:", error.message);

  // Error contains detailed information:
  // - DLL return codes
  // - BLOB error codes
  // - Descriptive messages
}
```

### Common Error Codes

**DLL Return Codes:**

- `RETURN_OK (0)`: Success
- `RETURN_DEVICE_NOT_AVAILABLE (-2)`: Device not available
- `RETURN_UNKNOWN_HANDLE (-7)`: Invalid handle
- `RETURN_WRONG_PARAMETER (-10)`: Invalid parameter

**BLOB Return Codes:**

- `BLOB_RET_OK (0)`: Success
- `BLOB_RET_ERROR_BUSY (1)`: Service pending
- `BLOB_RET_ERROR_WRONGCRC (6)`: CRC error
- `BLOB_RET_ERROR_SIZEOVERRUN (7)`: Size too large

## 🎯 Complete Example

```javascript
const { TMGIOLinkInterface } = require("./tmg-iolink-interface");

async function main() {
  const tmg = new TMGIOLinkInterface();

  try {
    // Initialize and connect
    tmg.initialize();
    const handle = tmg.connect("COM3");

    const port = 1;
    const blobId = 0x01;

    // Write data
    const data = Buffer.from("Hello TMG!", "utf-8");
    await tmg.writeBlob(port, blobId, data);
    console.log("Write successful");

    // Read data back
    const result = tmg.readBlob(port, blobId);
    console.log("Read data:", result.data.toString());

    // Start streaming
    const stream = tmg.startStreaming(port, blobId, 2000, (streamData) => {
      console.log("Stream:", streamData.data.toString("hex"));
    });

    // Stop after 10 seconds
    setTimeout(() => stream.stop(), 10000);
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    tmg.cleanup();
  }
}

main();
```

## 🛠 Troubleshooting

### Common Issues

1. **"Cannot find module 'ffi-napi'"**

   - Run `npm install` to install dependencies
   - If build fails, install Visual Studio Build Tools

2. **"Failed to load DLL"**

   - Check DLL path is correct
   - Ensure DLL is compatible with your system architecture (x64/x86)
   - Verify all dependency DLLs are available

3. **"Device not available"**

   - Check device is connected and drivers installed
   - Verify correct COM port number
   - Ensure device is not used by another application

4. **"BLOB operation failed"**
   - Check device is in correct state
   - Verify BLOB ID is valid for your device
   - Ensure port number is correct (usually 1-4)

### Dependencies Build Issues

If you encounter native module build issues:

1. **Install Visual Studio Build Tools**:

   ```bash
   # Download and install Visual Studio Build Tools
   # Then configure npm:
   npm config set msvs_version 2019
   ```

2. **Alternative FFI packages** (if ffi-napi fails):

   ```bash
   npm install ffi-rs  # Alternative FFI implementation
   ```

3. **Python dependency**:
   ```bash
   npm config set python /path/to/python2.7
   ```

## 📁 Project Structure

```
DLLInterface/
├── package.json                    # Node.js project configuration
├── tmg-iolink-interface.js        # Main interface implementation
├── example.js                     # Complete usage examples
├── README.md                      # This documentation
└── TMG_USB_IO-Link_Interface_V2_DLL_V2.31/
    └── Binaries/
        ├── TMGIOLUSBIF20.dll      # Main TMG DLL
        ├── TMGIOLUSBIF20.h        # Header definitions
        └── TMGIOLBlob.h           # BLOB function headers
```

## 🔧 Advanced Configuration

### Custom Port Configuration

```javascript
// Configure port settings (if needed)
const portConfig = {
  PortModeDetails: 0,
  TargetMode: PORT_MODES.SM_MODE_IOLINK_OPERATE,
  // ... other configuration options
};

// Note: Port configuration functions need to be implemented
// based on your specific requirements
```

### Performance Optimization

```javascript
// Adjust streaming interval based on your needs
const fastStream = tmg.startStreaming(port, blobId, 100, callback); // 100ms - fast
const slowStream = tmg.startStreaming(port, blobId, 5000, callback); // 5s - slow

// Use appropriate buffer sizes
const smallRead = tmg.readBlob(port, blobId, 64); // Small buffer
const largeRead = tmg.readBlob(port, blobId, 4096); // Large buffer
```

## 📝 License

This interface is provided as-is for use with TMG IO-Link hardware. Please refer to TMG's licensing terms for the underlying DLL usage.

## 🤝 Contributing

Feel free to extend this interface with additional TMG DLL functions as needed for your application.

---

**Note**: This interface requires the TMG USB IO-Link Master V2 hardware and official TMG DLL. Ensure you have proper licensing and hardware before using this interface.
