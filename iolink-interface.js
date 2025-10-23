const ffi = require('ffi-napi');
const ref = require('ref-napi');
const Struct = require('ref-struct-napi');
const path = require('path');

// Define basic C types
const BYTE = ref.types.uchar;
const WORD = ref.types.uint16;
const DWORD = ref.types.uint32;
const LONG = ref.types.int32;
const BOOL = ref.types.bool;

// Pointer types
const BYTE_PTR = ref.refType(BYTE);
const DWORD_PTR = ref.refType(DWORD);
const LONG_PTR = ref.refType(LONG);
const char_PTR = ref.refType(ref.types.char);

// TBLOBStatus struct - exact match from header
const TBLOBStatus = Struct({
    executedState: BYTE,     // State which was executed during the call
    errorCode: BYTE,         // error code for the result of the service
    additionalCode: BYTE,    // additional error code of the result
    dllReturnValue: LONG,    // return value from IOL - function
    Position: DWORD,         // actual position
    PercentComplete: BYTE,   // percentage of download will be computed
    nextState: BYTE          // next step which will be executed
});
const TBLOBStatusPtr = ref.refType(TBLOBStatus);

// TParameter struct for ISDU requests
const TParameter = Struct({
    Result: ref.types.CString,  // buffer for data bytes - simplified as string for now
    Index: WORD,                // index of the variable
    SubIndex: BYTE,             // subindex of the variable
    Length: BYTE,               // length of the parameter data
    ErrorCode: BYTE,            // error code for the result
    AdditionalCode: BYTE        // additional error code
});
const TParameterPtr = ref.refType(TParameter);

// TDeviceIdentification struct
const TDeviceIdentification = Struct({
    Name: ref.types.CString,        // device name (simplified)
    ProductCode: ref.types.CString, // product identification
    ViewName: ref.types.CString     // name shown in device manager
});
const TDeviceIdentificationPtr = ref.refType(TDeviceIdentification);

// TMasterInfo struct
const TMasterInfo = Struct({
    Version: ref.types.CString,     // version string
    Major: BYTE,                    // major firmware revision
    Minor: BYTE,                    // minor firmware revision
    Build: BYTE,                    // build revision
    MajorRevisionIOLStack: BYTE,    // major revision of IO-Link stack
    MinorRevisionIOLStack: BYTE,    // minor revision of IO-Link stack
    BuildRevisionIOLStack: BYTE     // build revision of IO-Link stack
});
const TMasterInfoPtr = ref.refType(TMasterInfo);

// TPortConfiguration struct
const TPortConfiguration = Struct({
    PortModeDetails: BYTE,      // additional info for the port
    TargetMode: BYTE,           // Mode in which the port shall be run
    CRID: BYTE,                 // configured revision ID
    DSConfigure: BYTE,          // Data Storage configuration
    Synchronisation: BYTE,      // Synchronisation, not used
    FunctionID: ref.types.CString, // Function ID - simplified
    InspectionLevel: BYTE,      // validation level
    VendorID: ref.types.CString,   // Vendor ID - simplified
    DeviceID: ref.types.CString,   // Device ID - simplified
    SerialNumber: ref.types.CString, // Serial number
    InputLength: BYTE,          // configured input length
    OutputLength: BYTE          // configured output length
});
const TPortConfigurationPtr = ref.refType(TPortConfiguration);

// Return code constants from header
const RETURN_CODES = {
    RETURN_OK: 0,
    RETURN_INTERNAL_ERROR: -1,
    RETURN_DEVICE_NOT_AVAILABLE: -2,
    RETURN_DEVICE_ERROR: -3,
    RETURN_OUT_OF_MEMORY: -4,
    RETURN_CONNECTION_LOST: -5,
    RETURN_UART_TIMEOUT: -6,
    RETURN_UNKNOWN_HANDLE: -7,
    RETURN_NO_EVENT: -8,
    RETURN_WRONG_DEVICE: -9,
    RETURN_WRONG_PARAMETER: -10,
    RETURN_WRONG_COMMAND: -11,
    RETURN_STATE_CONFLICT: -12,
    RETURN_FUNCTION_NOT_IMPLEMENTED: -13,
    RETURN_FUNCTION_DELAYED: -14,
    RETURN_FUNCTION_CALLEDFROMCALLBACK: -15,
    RETURN_FIRMWARE_NOT_COMPATIBLE: -16
};

// BLOB return codes
const BLOB_RETURN_CODES = {
    BLOB_RET_OK: 0,
    BLOB_RET_ERROR_BUSY: 1,
    BLOB_RET_ERROR_ISDU_READ: 2,
    BLOB_RET_ERROR_ISDU_WRITE: 3,
    BLOB_RET_ERROR_STATECONFLICT: 4,
    BLOB_RET_ERROR_CHECKBLOBINFO_FAILED: 5,
    BLOB_RET_ERROR_WRONGCRC: 6,
    BLOB_RET_ERROR_SIZEOVERRUN: 7,
    BLOB_RET_ERROR_STOPPED: 8
};

// BLOB state definitions
const BLOB_STATES = {
    BLOB_STATE_IDLE: 0,
    BLOB_STATE_PREPARE_DOWNLOAD: 1,
    BLOB_STATE_DOWNLOAD: 2,
    BLOB_STATE_FINALIZE_DOWNLOAD: 3,
    BLOB_STATE_PREPARE_UPLOAD: 4,
    BLOB_STATE_UPLOAD: 5,
    BLOB_STATE_FINALIZE_UPLOAD: 6,
    BLOB_STATE_ERROR: 7
};

// Port modes
const PORT_MODES = {
    SM_MODE_RESET: 0,
    SM_MODE_IOLINK_PREOP: 1,
    SM_MODE_SIO_INPUT: 3,
    SM_MODE_SIO_OUTPUT: 4,
    SM_MODE_IOLINK_PREOP_FALLBACK: 10,
    SM_MODE_IOLINK_OPER_FALLBACK: 11,
    SM_MODE_IOLINK_OPERATE: 12,
    SM_MODE_IOLINK_FALLBACK: 13
};

class TMGIOLinkInterface {
    constructor() {
        this.dll = null;
        this.blobDll = null;
        this.handle = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the DLL interface
     * @param {string} dllPath - Path to the TMGIOLUSBIF20.dll file
     */
    initialize(dllPath = null) {
        try {
            // Default DLL path if not provided
            const defaultDllPath = path.join(__dirname, 'TMG_USB_IO-Link_Interface_V2_DLL_V2.31', 'Binaries', 'TMGIOLUSBIF20.dll');
            const actualDllPath = dllPath || defaultDllPath;

            // Load the main IO-Link DLL
            this.dll = ffi.Library(actualDllPath, {
                // USB interface management
                'IOL_Create': [LONG, [char_PTR]],
                'IOL_Destroy': [LONG, [LONG]],
                'IOL_GetUSBDevices': [LONG, [TDeviceIdentificationPtr, LONG]],
                'IOL_GetMasterInfo': [LONG, [LONG, TMasterInfoPtr]],
                
                // Port Configuration
                'IOL_SetPortConfig': [LONG, [LONG, DWORD, TPortConfigurationPtr]],
                'IOL_GetPortConfig': [LONG, [LONG, DWORD, TPortConfigurationPtr]],
                'IOL_SetCommand': [LONG, [LONG, DWORD, DWORD]],
                'IOL_GetSensorStatus': [LONG, [LONG, DWORD, DWORD_PTR]],
                
                // Process Data Handling
                'IOL_ReadInputs': [LONG, [LONG, DWORD, BYTE_PTR, DWORD_PTR, DWORD_PTR]],
                'IOL_WriteOutputs': [LONG, [LONG, DWORD, BYTE_PTR, DWORD]],
                'IOL_TransferProcessData': [LONG, [LONG, DWORD, BYTE_PTR, DWORD, BYTE_PTR, DWORD_PTR, DWORD_PTR]],
                
                // ISDU handling
                'IOL_ReadReq': [LONG, [LONG, DWORD, TParameterPtr]],
                'IOL_WriteReq': [LONG, [LONG, DWORD, TParameterPtr]]
            });

            // Load BLOB functions - these might be in the same DLL or separate
            this.blobDll = ffi.Library(actualDllPath, {
                'BLOB_downloadBLOB': [LONG, [LONG, DWORD, LONG, DWORD, BYTE_PTR, TBLOBStatusPtr]],
                'BLOB_uploadBLOB': [LONG, [LONG, DWORD, LONG, DWORD, BYTE_PTR, DWORD_PTR, TBLOBStatusPtr]],
                'BLOB_Continue': [LONG, [LONG, DWORD, TBLOBStatusPtr]],
                'BLOB_Abort': [LONG, [LONG, DWORD, TBLOBStatusPtr]],
                'BLOB_ReadBlobID': [LONG, [LONG, DWORD, LONG_PTR, TBLOBStatusPtr]]
            });

            this.isInitialized = true;
            console.log('TMG IO-Link interface initialized successfully');
            
        } catch (error) {
            throw new Error(`Failed to initialize TMG IO-Link interface: ${error.message}`);
        }
    }

    /**
     * Connect to a TMG IO-Link device
     * @param {string} deviceName - Device name (e.g., "COM3", or device name from USB device list)
     * @returns {number} Handle for subsequent operations
     */
    connect(deviceName) {
        if (!this.isInitialized) {
            throw new Error('Interface not initialized. Call initialize() first.');
        }

        const handle = this.dll.IOL_Create(deviceName);
        
        if (handle <= 0) {
            const errorMsg = this.getErrorMessage(handle);
            throw new Error(`Failed to connect to device ${deviceName}: ${errorMsg}`);
        }

        this.handle = handle;
        console.log(`Connected to device ${deviceName} with handle ${handle}`);
        return handle;
    }

    /**
     * Disconnect from the device
     */
    disconnect() {
        if (this.handle) {
            const result = this.dll.IOL_Destroy(this.handle);
            if (result !== RETURN_CODES.RETURN_OK) {
                console.warn(`Warning during disconnect: ${this.getErrorMessage(result)}`);
            }
            this.handle = null;
            console.log('Disconnected from device');
        }
    }

    /**
     * Get list of available USB devices
     * @returns {Array} Array of device information objects
     */
    getUSBDevices() {
        if (!this.isInitialized) {
            throw new Error('Interface not initialized. Call initialize() first.');
        }

        const maxDevices = 10;
        const deviceArray = ref.alloc(TDeviceIdentification, maxDevices);
        
        const count = this.dll.IOL_GetUSBDevices(deviceArray, maxDevices);
        
        if (count < 0) {
            throw new Error(`Failed to get USB devices: ${this.getErrorMessage(count)}`);
        }

        const devices = [];
        for (let i = 0; i < count; i++) {
            const device = deviceArray[i];
            devices.push({
                name: device.Name,
                productCode: device.ProductCode,
                viewName: device.ViewName
            });
        }

        return devices;
    }

    /**
     * Read BLOB data from device
     * @param {number} port - Port number
     * @param {number} blobId - BLOB ID to read
     * @param {number} bufferSize - Size of read buffer (default: 1024)
     * @returns {Object} Object containing data, bytesRead, and status
     */
    readBlob(port, blobId, bufferSize = 1024) {
        if (!this.handle) {
            throw new Error('Not connected to device. Call connect() first.');
        }

        const readBuffer = Buffer.alloc(bufferSize);
        const bytesRead = ref.alloc(DWORD);
        const status = new TBLOBStatus();

        const result = this.blobDll.BLOB_uploadBLOB(
            this.handle,
            port,
            blobId,
            bufferSize,
            readBuffer,
            bytesRead,
            status.ref()
        );

        if (result !== BLOB_RETURN_CODES.BLOB_RET_OK) {
            throw new Error(`Upload BLOB failed: ${this.getBlobErrorMessage(result)}, ErrorCode: ${status.errorCode}`);
        }

        // Continue until transfer is complete
        while (status.nextState !== BLOB_STATES.BLOB_STATE_IDLE && status.PercentComplete < 100) {
            const contResult = this.blobDll.BLOB_Continue(this.handle, port, status.ref());
            
            if (contResult !== BLOB_RETURN_CODES.BLOB_RET_OK || status.errorCode !== 0) {
                this.blobDll.BLOB_Abort(this.handle, port, status.ref());
                throw new Error(`Continue BLOB failed: ${this.getBlobErrorMessage(contResult)}, ErrorCode: ${status.errorCode}`);
            }

            // Small delay to prevent overwhelming the device
            this.sleep(10);
        }

        return {
            data: readBuffer.slice(0, bytesRead.deref()),
            bytesRead: bytesRead.deref(),
            status: {
                executedState: status.executedState,
                errorCode: status.errorCode,
                additionalCode: status.additionalCode,
                dllReturnValue: status.dllReturnValue,
                position: status.Position,
                percentComplete: status.PercentComplete,
                nextState: status.nextState
            }
        };
    }

    /**
     * Write BLOB data to device
     * @param {number} port - Port number
     * @param {number} blobId - BLOB ID to write to
     * @param {Buffer} dataBuffer - Data to write
     * @returns {Object} Status information
     */
    writeBlob(port, blobId, dataBuffer) {
        if (!this.handle) {
            throw new Error('Not connected to device. Call connect() first.');
        }

        const status = new TBLOBStatus();

        const result = this.blobDll.BLOB_downloadBLOB(
            this.handle,
            port,
            blobId,
            dataBuffer.length,
            dataBuffer,
            status.ref()
        );

        if (result !== BLOB_RETURN_CODES.BLOB_RET_OK) {
            throw new Error(`Download BLOB failed: ${this.getBlobErrorMessage(result)}, ErrorCode: ${status.errorCode}`);
        }

        // Continue transferring until done
        while (status.nextState !== BLOB_STATES.BLOB_STATE_IDLE && status.PercentComplete < 100) {
            const contResult = this.blobDll.BLOB_Continue(this.handle, port, status.ref());

            if (contResult !== BLOB_RETURN_CODES.BLOB_RET_OK || status.errorCode !== 0) {
                this.blobDll.BLOB_Abort(this.handle, port, status.ref());
                throw new Error(`Continue BLOB failed: ${this.getBlobErrorMessage(contResult)}, ErrorCode: ${status.errorCode}`);
            }

            // Small delay and progress logging
            console.log(`BLOB write progress: ${status.PercentComplete}%`);
            this.sleep(10);
        }

        return {
            status: {
                executedState: status.executedState,
                errorCode: status.errorCode,
                additionalCode: status.additionalCode,
                dllReturnValue: status.dllReturnValue,
                position: status.Position,
                percentComplete: status.PercentComplete,
                nextState: status.nextState
            }
        };
    }

    /**
     * Start streaming data from device
     * @param {number} port - Port number
     * @param {number} blobId - BLOB ID to read from
     * @param {number} intervalMs - Polling interval in milliseconds (default: 1000)
     * @param {Function} callback - Callback function to handle received data
     * @returns {Object} Stream control object with stop() method
     */
    startStreaming(port, blobId, intervalMs = 1000, callback) {
        if (!this.handle) {
            throw new Error('Not connected to device. Call connect() first.');
        }

        if (typeof callback !== 'function') {
            throw new Error('Callback function is required for streaming');
        }

        let isStreaming = true;
        
        const streamInterval = setInterval(() => {
            if (!isStreaming) {
                clearInterval(streamInterval);
                return;
            }

            try {
                const { data, bytesRead, status } = this.readBlob(port, blobId);
                
                callback({
                    data: data,
                    bytesRead: bytesRead,
                    status: status,
                    timestamp: new Date()
                });
                
            } catch (err) {
                console.error('Stream error:', err.message);
                callback({
                    error: err.message,
                    timestamp: new Date()
                });
            }
        }, intervalMs);

        // Return control object
        return {
            stop: () => {
                isStreaming = false;
                clearInterval(streamInterval);
                console.log('Streaming stopped');
            },
            isActive: () => isStreaming
        };
    }

    /**
     * Read process data from device
     * @param {number} port - Port number
     * @returns {Object} Process data and status
     */
    readProcessData(port) {
        if (!this.handle) {
            throw new Error('Not connected to device. Call connect() first.');
        }

        const bufferSize = 32; // Max IO-Link process data size
        const dataBuffer = Buffer.alloc(bufferSize);
        const length = ref.alloc(DWORD);
        const status = ref.alloc(DWORD);

        const result = this.dll.IOL_ReadInputs(
            this.handle,
            port,
            dataBuffer,
            length,
            status
        );

        if (result !== RETURN_CODES.RETURN_OK) {
            throw new Error(`Failed to read process data: ${this.getErrorMessage(result)}`);
        }

        return {
            data: dataBuffer.slice(0, length.deref()),
            length: length.deref(),
            status: status.deref()
        };
    }

    /**
     * Write process data to device
     * @param {number} port - Port number
     * @param {Buffer} data - Data to write
     */
    writeProcessData(port, data) {
        if (!this.handle) {
            throw new Error('Not connected to device. Call connect() first.');
        }

        const result = this.dll.IOL_WriteOutputs(
            this.handle,
            port,
            data,
            data.length
        );

        if (result !== RETURN_CODES.RETURN_OK) {
            throw new Error(`Failed to write process data: ${this.getErrorMessage(result)}`);
        }
    }

    /**
     * Get error message for return code
     * @param {number} code - Return code
     * @returns {string} Error message
     */
    getErrorMessage(code) {
        const errorMessages = {
            [RETURN_CODES.RETURN_OK]: 'Success',
            [RETURN_CODES.RETURN_INTERNAL_ERROR]: 'Internal library error',
            [RETURN_CODES.RETURN_DEVICE_NOT_AVAILABLE]: 'Device not available',
            [RETURN_CODES.RETURN_DEVICE_ERROR]: 'Error accessing USB device driver',
            [RETURN_CODES.RETURN_OUT_OF_MEMORY]: 'Out of memory',
            [RETURN_CODES.RETURN_CONNECTION_LOST]: 'USB master unplugged during communication',
            [RETURN_CODES.RETURN_UART_TIMEOUT]: 'Timeout - no answer to command',
            [RETURN_CODES.RETURN_UNKNOWN_HANDLE]: 'Unknown handle',
            [RETURN_CODES.RETURN_NO_EVENT]: 'No event available',
            [RETURN_CODES.RETURN_WRONG_DEVICE]: 'Wrong device name or unsupported device',
            [RETURN_CODES.RETURN_WRONG_PARAMETER]: 'Invalid function parameter',
            [RETURN_CODES.RETURN_WRONG_COMMAND]: 'Wrong answer to command received',
            [RETURN_CODES.RETURN_STATE_CONFLICT]: 'Function cannot be used in current state',
            [RETURN_CODES.RETURN_FUNCTION_NOT_IMPLEMENTED]: 'Function not implemented',
            [RETURN_CODES.RETURN_FUNCTION_DELAYED]: 'Result will come later via callback',
            [RETURN_CODES.RETURN_FUNCTION_CALLEDFROMCALLBACK]: 'Cannot call DLL function from callback',
            [RETURN_CODES.RETURN_FIRMWARE_NOT_COMPATIBLE]: 'Firmware needs update'
        };

        return errorMessages[code] || `Unknown error code: ${code}`;
    }

    /**
     * Get BLOB error message for return code
     * @param {number} code - BLOB return code
     * @returns {string} Error message
     */
    getBlobErrorMessage(code) {
        const blobErrorMessages = {
            [BLOB_RETURN_CODES.BLOB_RET_OK]: 'Success',
            [BLOB_RETURN_CODES.BLOB_RET_ERROR_BUSY]: 'Service pending - abort or end before starting new one',
            [BLOB_RETURN_CODES.BLOB_RET_ERROR_ISDU_READ]: 'Error in ISDU read',
            [BLOB_RETURN_CODES.BLOB_RET_ERROR_ISDU_WRITE]: 'Error in ISDU write',
            [BLOB_RETURN_CODES.BLOB_RET_ERROR_STATECONFLICT]: 'Cannot call function in current state',
            [BLOB_RETURN_CODES.BLOB_RET_ERROR_CHECKBLOBINFO_FAILED]: 'Error checking BLOB info',
            [BLOB_RETURN_CODES.BLOB_RET_ERROR_WRONGCRC]: 'Wrong CRC',
            [BLOB_RETURN_CODES.BLOB_RET_ERROR_SIZEOVERRUN]: 'BLOB content size too large',
            [BLOB_RETURN_CODES.BLOB_RET_ERROR_STOPPED]: 'BLOB has stopped'
        };

        return blobErrorMessages[code] || `Unknown BLOB error code: ${code}`;
    }

    /**
     * Simple sleep function
     * @param {number} ms - Milliseconds to sleep
     */
    sleep(ms) {
        const start = Date.now();
        while (Date.now() - start < ms) {
            // Busy wait
        }
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.disconnect();
        this.dll = null;
        this.blobDll = null;
        this.isInitialized = false;
    }
}

// Export constants and class
module.exports = {
    TMGIOLinkInterface,
    RETURN_CODES,
    BLOB_RETURN_CODES,
    BLOB_STATES,
    PORT_MODES
};