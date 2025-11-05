"use strict";
/**
 * IO-Link Interface Library - TypeScript Implementation
 * Provides complete IO-Link Master and Device communication functionality
 * Following IEC 61131-9 specifications
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.discoverMasters = discoverMasters;
exports.connect = connect;
exports.disconnect = disconnect;
exports.resetMaster = resetMaster;
exports.initializeMaster = initializeMaster;
exports.checkPortStatus = checkPortStatus;
exports.scanMasterPorts = scanMasterPorts;
exports.readProcessData = readProcessData;
exports.writeProcessData = writeProcessData;
exports.readDeviceParameter = readDeviceParameter;
exports.writeDeviceParameter = writeDeviceParameter;
exports.readDeviceName = readDeviceName;
exports.readVendorName = readVendorName;
exports.readProductName = readProductName;
exports.readSerialNumber = readSerialNumber;
exports.readBlob = readBlob;
exports.writeBlob = writeBlob;
exports.streamDeviceData = streamDeviceData;
exports.discoverAllDevices = discoverAllDevices;
exports.disconnectAllMasters = disconnectAllMasters;
exports.getConnectedDeviceInfo = getConnectedDeviceInfo;
exports.getMasterState = getMasterState;
exports.resetGlobalRegistry = resetGlobalRegistry;
const ffi_bindings_1 = require("./ffi-bindings");
const types_1 = require("./types");
// ============================================================================
// STATE MANAGEMENT
// ============================================================================
const globalMasterRegistry = new Map();
const masterStates = new Map();
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
function checkReturnCode(returnCode, operation) {
    if (returnCode !== types_1.RETURN_CODES.RETURN_OK) {
        throw new Error(`${operation} failed with code: ${returnCode}`);
    }
}
function extractString(arrayField) {
    try {
        if (!arrayField)
            return 'Unknown';
        const buffer = Buffer.isBuffer(arrayField) ? arrayField : Buffer.from(arrayField);
        let length = 0;
        while (length < buffer.length && buffer[length] !== 0)
            length++;
        return buffer.slice(0, length).toString('utf8').trim() || 'Unknown';
    }
    catch (e) {
        return 'Unknown';
    }
}
// ============================================================================
// MASTER DISCOVERY AND CONNECTION
// ============================================================================
function discoverMasters() {
    const maxDevices = 5;
    console.log('Searching for IO-Link Master devices...');
    try {
        const structSize = ffi_bindings_1.TDeviceIdentification.size;
        const bufferSize = structSize * maxDevices;
        const deviceBuffer = Buffer.alloc(bufferSize);
        const numDevices = ffi_bindings_1.iolinkDll.IOL_GetUSBDevices(deviceBuffer, maxDevices);
        console.log(`Found ${numDevices} devices`);
        if (numDevices <= 0) {
            return [];
        }
        const devices = [];
        for (let i = 0; i < numDevices; i++) {
            try {
                const offset = i * structSize;
                const deviceSlice = deviceBuffer.slice(offset, offset + structSize);
                const device = ffi_bindings_1.ref.get(deviceSlice, 0, ffi_bindings_1.TDeviceIdentification);
                if (!device)
                    continue;
                devices.push({
                    name: extractString(device.Name),
                    productCode: extractString(device.ProductCode),
                    viewName: extractString(device.ViewName),
                });
            }
            catch (err) {
                console.error(`Error processing device ${i}:`, err.message);
            }
        }
        return devices;
    }
    catch (error) {
        console.error('Error in discoverMasters:', error.message);
        return [];
    }
}
function connect(deviceName) {
    const handle = ffi_bindings_1.iolinkDll.IOL_Create(deviceName);
    if (handle <= 0) {
        throw new Error(`Failed to connect to device: ${deviceName}`);
    }
    resetMaster(handle);
    return handle;
}
function disconnect(handle) {
    try {
        if (!handle || handle <= 0) {
            console.log(`Skipping disconnect - invalid handle: ${handle}`);
            return;
        }
        const masterState = masterStates.get(handle);
        if (masterState && masterState.ports) {
            console.log(`Clearing port configurations for master handle ${handle}...`);
            for (const [portNumber, portState] of masterState.ports) {
                if (portState.configured) {
                    try {
                        const clearConfig = new ffi_bindings_1.TPortConfiguration();
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
                        const clearResult = ffi_bindings_1.iolinkDll.IOL_SetPortConfig(handle, portNumber - 1, clearConfig.ref());
                        if (clearResult === types_1.RETURN_CODES.RETURN_OK) {
                            console.log(`Port ${portNumber}: Configuration cleared successfully`);
                        }
                    }
                    catch (clearError) {
                        console.log(`Port ${portNumber}: Error clearing configuration - ${clearError.message}`);
                    }
                }
            }
        }
        masterStates.delete(handle);
        const result = ffi_bindings_1.iolinkDll.IOL_Destroy(handle);
        checkReturnCode(result, 'Disconnect');
    }
    catch (error) {
        console.error(`Error during disconnect:`, error.message);
        if (handle && handle > 0) {
            masterStates.delete(handle);
        }
    }
}
function resetMaster(handle) {
    console.log(`Resetting master state for handle ${handle}...`);
    try {
        for (let port = 0; port < 2; port++) {
            try {
                const clearConfig = new ffi_bindings_1.TPortConfiguration();
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
                const clearResult = ffi_bindings_1.iolinkDll.IOL_SetPortConfig(handle, port, clearConfig.ref());
                console.log(`Port ${port + 1}: Reset result = ${clearResult}`);
            }
            catch (portError) {
                console.log(`Port ${port + 1}: Reset failed - ${portError.message}`);
            }
        }
        console.log(`Master reset complete, waiting for stabilization...`);
        return true;
    }
    catch (error) {
        console.error(`Master reset failed: ${error.message}`);
        return false;
    }
}
// ============================================================================
// MASTER INITIALIZATION
// ============================================================================
async function initializeMaster(handle, deviceName, maxPorts = 2) {
    console.log(`Initializing IO-Link Master: ${deviceName}`);
    const registryEntry = globalMasterRegistry.get(deviceName);
    const wasRecentlyConfigured = registryEntry && Date.now() - registryEntry.lastConfigTime < 120000;
    const masterState = new types_1.MasterState(handle, deviceName);
    masterStates.set(handle, masterState);
    if (wasRecentlyConfigured) {
        console.log(`Master ${deviceName} was recently configured, skipping port configuration...`);
        for (let port = 1; port <= maxPorts; port++) {
            const portState = new types_1.PortState(port);
            portState.configured = true;
            portState.targetMode = types_1.PORT_MODES.SM_MODE_IOLINK_OPERATE;
            portState.configurationTimestamp = registryEntry.lastConfigTime;
            masterState.ports.set(port, portState);
        }
        masterState.initialized = true;
        masterState.configurationComplete = true;
        console.log(`Master ${deviceName} initialization complete (using existing configuration)`);
        return masterState;
    }
    console.log(`Configuring ${maxPorts} ports for IO-Link operation...`);
    for (let port = 1; port <= maxPorts; port++) {
        const portState = new types_1.PortState(port);
        try {
            const configSuccess = await configurePortForIOLink(handle, port);
            if (configSuccess) {
                portState.markConfigured(types_1.PORT_MODES.SM_MODE_IOLINK_OPERATE, 0x11, types_1.VALIDATION_MODES.SM_VALIDATION_MODE_NONE);
                console.log(`Port ${port}: Configured for IO-Link operation`);
            }
            else {
                console.log(`Port ${port}: Configuration failed or port does not exist`);
            }
        }
        catch (error) {
            console.error(`Port ${port}: Configuration error:`, error.message);
        }
        masterState.ports.set(port, portState);
    }
    globalMasterRegistry.set(deviceName, {
        configured: true,
        lastConfigTime: Date.now(),
    });
    masterState.initialized = true;
    masterState.configurationComplete = true;
    console.log('Waiting for port stabilization (IO-Link timing requirements)...');
    console.log(`Stabilization period: 5000ms`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('Additional device detection wait...');
    await new Promise(resolve => setTimeout(resolve, 7000));
    console.log(`Master ${deviceName} initialization complete`);
    return masterState;
}
async function configurePortForIOLink(handle, port) {
    try {
        const zeroBasedPort = port - 1;
        console.log(`Port ${port}: Checking current configuration state...`);
        const currentInfo = new ffi_bindings_1.TInfoEx();
        const currentModeResult = ffi_bindings_1.iolinkDll.IOL_GetModeEx(handle, zeroBasedPort, currentInfo.ref(), false);
        if (currentModeResult === types_1.RETURN_CODES.RETURN_OK) {
            console.log(`Port ${port}: Current mode = ${currentInfo.ActualMode}, target mode = ${types_1.PORT_MODES.SM_MODE_IOLINK_OPERATE}`);
            if (currentInfo.ActualMode === types_1.PORT_MODES.SM_MODE_IOLINK_OPERATE) {
                console.log(`Port ${port}: Already in IO-Link operate mode, skipping reconfiguration`);
                return true;
            }
            if (currentInfo.ActualMode === types_1.PORT_MODES.SM_MODE_IOLINK_PREOP) {
                console.log(`Port ${port}: In preoperate mode, waiting before reconfiguration...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        try {
            const currentConfig = new ffi_bindings_1.TPortConfiguration();
            const checkResult = ffi_bindings_1.iolinkDll.IOL_GetPortConfig(handle, zeroBasedPort, currentConfig.ref());
            if (checkResult === types_1.RETURN_CODES.RETURN_WRONG_PARAMETER) {
                return false;
            }
            console.log(`Port ${port}: Current config - TargetMode=${currentConfig.TargetMode}, CRID=0x${currentConfig.CRID.toString(16)}`);
        }
        catch (e) {
            return false;
        }
        const portConfig = new ffi_bindings_1.TPortConfiguration();
        portConfig.PortModeDetails = 0;
        portConfig.TargetMode = types_1.PORT_MODES.SM_MODE_IOLINK_OPERATE;
        portConfig.CRID = 0x11;
        portConfig.DSConfigure = 0;
        portConfig.Synchronisation = 0;
        portConfig.FunctionID[0] = 0;
        portConfig.FunctionID[1] = 0;
        portConfig.InspectionLevel = types_1.VALIDATION_MODES.SM_VALIDATION_MODE_NONE;
        portConfig.VendorID[0] = 0;
        portConfig.VendorID[1] = 0;
        portConfig.DeviceID[0] = 0;
        portConfig.DeviceID[1] = 0;
        portConfig.DeviceID[2] = 0;
        portConfig.InputLength = 32;
        portConfig.OutputLength = 32;
        const masterState = masterStates.get(handle);
        if (masterState && masterState.ports.has(port)) {
            const existingPortState = masterState.ports.get(port);
            if (!existingPortState.needsReconfiguration(portConfig.TargetMode, portConfig.CRID, portConfig.InspectionLevel)) {
                console.log(`Port ${port}: Configuration unchanged, skipping reconfiguration`);
                return true;
            }
        }
        console.log(`Port ${port}: Setting config - CRID=0x${portConfig.CRID.toString(16)}, TargetMode=${portConfig.TargetMode}, InspectionLevel=${portConfig.InspectionLevel}`);
        const result = ffi_bindings_1.iolinkDll.IOL_SetPortConfig(handle, zeroBasedPort, portConfig.ref());
        console.log(`Port ${port}: IOL_SetPortConfig result = ${result} (${result === types_1.RETURN_CODES.RETURN_OK ? 'SUCCESS' : 'FAILED'})`);
        return result === types_1.RETURN_CODES.RETURN_OK;
    }
    catch (error) {
        console.error(`Port ${port} configuration error:`, error.message);
        return false;
    }
}
// ============================================================================
// PORT STATUS AND DEVICE DETECTION
// ============================================================================
function checkPortStatus(handle, port) {
    try {
        const masterState = masterStates.get(handle);
        if (!masterState || !masterState.initialized) {
            throw new Error('Master not initialized. Call initializeMaster() first.');
        }
        const portState = masterState.ports.get(port);
        if (!portState || !portState.configured) {
            return {
                port: port,
                connected: false,
                mode: 'NOT_CONFIGURED',
                error: 'Port not configured during master initialization',
            };
        }
        const zeroBasedPort = port - 1;
        const infoEx = new ffi_bindings_1.TInfoEx();
        ffi_bindings_1.iolinkDll.IOL_GetModeEx(handle, zeroBasedPort, infoEx.ref(), false);
        portState.actualMode = infoEx.ActualMode;
        portState.lastStatusCheck = Date.now();
        const isConnected = (infoEx.SensorStatus & types_1.SENSOR_STATUS.BIT_CONNECTED) !== 0;
        const isPreoperate = (infoEx.SensorStatus & types_1.SENSOR_STATUS.BIT_PREOPERATE) !== 0;
        const isWrongSensor = (infoEx.SensorStatus & types_1.SENSOR_STATUS.BIT_WRONGSENSOR) !== 0;
        const isSensorStateKnown = (infoEx.SensorStatus & types_1.SENSOR_STATUS.BIT_SENSORSTATEKNOWN) !== 0;
        let connectionState = 'DISCONNECTED';
        if (isConnected)
            connectionState = 'OPERATE';
        else if (isPreoperate)
            connectionState = 'PREOPERATE';
        else if (isWrongSensor)
            connectionState = 'WRONG_DEVICE';
        else if (isSensorStateKnown)
            connectionState = 'DETECTED';
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
        if (status.connected && !portState.deviceInfo) {
            portState.deviceInfo = parseDeviceInfoFromDPP(status.directParameterPage, port);
        }
        else if (!status.connected) {
            portState.deviceInfo = null;
        }
        return status;
    }
    catch (error) {
        console.error(`Error checking port ${port} status:`, error.message);
        return {
            port: port,
            connected: false,
            mode: 'ERROR',
            error: error.message,
        };
    }
}
function parseDeviceInfoFromDPP(dpp, port) {
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
        const vendorSpecific = dpp.slice(11, 16);
        return {
            port: port,
            vendorId: `0x${vendorId.toString(16).toUpperCase().padStart(4, '0')}`,
            deviceId: `0x${deviceId.toString(16).toUpperCase().padStart(6, '0')}`,
            functionId: `0x${functionId.toString(16).toUpperCase().padStart(4, '0')}`,
            revisionId: `0x${revisionId.toString(16).toUpperCase().padStart(2, '0')}`,
            vendorName: 'Unknown Vendor',
            deviceName: 'Unknown Device',
            processDataInputLength: pdInLength,
            processDataOutputLength: pdOutLength,
            vendorSpecific: vendorSpecific,
        };
    }
    catch (error) {
        console.error(`Error parsing device info from DPP:`, error.message);
        return null;
    }
}
function scanMasterPorts(handle) {
    console.log('Scanning configured ports for connected devices...');
    const masterState = masterStates.get(handle);
    if (!masterState || !masterState.initialized) {
        throw new Error('Master not initialized. Call initializeMaster() first.');
    }
    const connectedDevices = [];
    for (const [portNumber, portState] of masterState.ports) {
        if (!portState.configured) {
            console.log(`Port ${portNumber}: Not configured, skipping`);
            continue;
        }
        console.log(`Checking port ${portNumber} for connected devices...`);
        try {
            const status = checkPortStatus(handle, portNumber);
            console.log(`Port ${portNumber}: ${status.mode} (connected: ${status.connected})`);
            if (status.connected && portState.deviceInfo) {
                let actualVendorName = 'Unknown Vendor';
                let actualDeviceName = 'Unknown Device';
                try {
                    actualVendorName = readVendorName(handle, portNumber);
                    if (actualVendorName === 'Unknown Vendor') {
                        actualVendorName = `Vendor_${portState.deviceInfo.vendorId}`;
                    }
                }
                catch (e) {
                    console.log(`   Debug: Could not read vendor name for port ${portNumber}: ${e.message}`);
                    actualVendorName = `Vendor_${portState.deviceInfo.vendorId}`;
                }
                try {
                    actualDeviceName = readDeviceName(handle, portNumber);
                    if (actualDeviceName === 'Unknown Device') {
                        actualDeviceName = `Device_${portState.deviceInfo.deviceId}`;
                    }
                }
                catch (e) {
                    console.log(`   Debug: Could not read device name for port ${portNumber}: ${e.message}`);
                    actualDeviceName = `Device_${portState.deviceInfo.deviceId}`;
                }
                portState.deviceInfo.vendorName = actualVendorName;
                portState.deviceInfo.deviceName = actualDeviceName;
                console.log(`Port ${portNumber}: Found ${actualVendorName} ${actualDeviceName}`);
                connectedDevices.push({
                    ...portState.deviceInfo,
                    status: status,
                });
            }
        }
        catch (error) {
            console.error(`Error checking port ${portNumber}:`, error.message);
        }
    }
    console.log(`Scan complete: Found ${connectedDevices.length} connected devices`);
    return connectedDevices;
}
// ============================================================================
// PROCESS DATA COMMUNICATION
// ============================================================================
function readProcessData(handle, port, maxLength = 32) {
    validatePortConnection(handle, port);
    const masterState = masterStates.get(handle);
    if (!masterState || !masterState.initialized) {
        throw new Error('Master not initialized. Call initializeMaster() first.');
    }
    const buffer = Buffer.alloc(maxLength);
    const length = ffi_bindings_1.ref.alloc(ffi_bindings_1.DWORD, maxLength);
    const status = ffi_bindings_1.ref.alloc(ffi_bindings_1.DWORD);
    const result = ffi_bindings_1.iolinkDll.IOL_ReadInputs(handle, port - 1, buffer, length, status);
    checkReturnCode(result, 'Read Process Data');
    const actualLength = length.deref();
    return {
        data: buffer.slice(0, actualLength),
        status: status.deref(),
        port: port,
        timestamp: new Date(),
    };
}
function writeProcessData(handle, port, data) {
    validatePortConnection(handle, port);
    const masterState = masterStates.get(handle);
    if (!masterState || !masterState.initialized) {
        throw new Error('Master not initialized. Call initializeMaster() first.');
    }
    const buffer = data instanceof Buffer ? data : Buffer.from(data);
    const result = ffi_bindings_1.iolinkDll.IOL_WriteOutputs(handle, port - 1, buffer, buffer.length);
    checkReturnCode(result, 'Write Process Data');
    return {
        success: true,
        bytesWritten: buffer.length,
        port: port,
        timestamp: new Date(),
    };
}
// ============================================================================
// PARAMETER COMMUNICATION (ISDU)
// ============================================================================
function readDeviceParameter(handle, port, index, subIndex = 0) {
    try {
        validatePortConnection(handle, port);
        const parameter = new ffi_bindings_1.TParameter();
        parameter.Index = index;
        parameter.SubIndex = subIndex;
        parameter.Length = 0;
        const result = ffi_bindings_1.iolinkDll.IOL_ReadReq(handle, port - 1, parameter.ref());
        checkReturnCode(result, `Read parameter ${index}.${subIndex} from port ${port}`);
        if (parameter.ErrorCode !== 0) {
            throw new Error(`IO-Link Device parameter read error: Code=${parameter.ErrorCode}, Additional=${parameter.AdditionalCode}`);
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
    }
    catch (error) {
        throw new Error(`Failed to read parameter ${index}.${subIndex} from port ${port}: ${error.message}`);
    }
}
function writeDeviceParameter(handle, port, index, subIndex = 0, data) {
    try {
        validatePortConnection(handle, port);
        const parameter = new ffi_bindings_1.TParameter();
        parameter.Index = index;
        parameter.SubIndex = subIndex;
        parameter.Length = data.length;
        const dataBuffer = data instanceof Buffer ? data : Buffer.from(data);
        dataBuffer.copy(Buffer.from(parameter.Result), 0, 0, Math.min(dataBuffer.length, 256));
        const result = ffi_bindings_1.iolinkDll.IOL_WriteReq(handle, port - 1, parameter.ref());
        checkReturnCode(result, `Write parameter ${index}.${subIndex} to port ${port}`);
        if (parameter.ErrorCode !== 0) {
            throw new Error(`IO-Link Device parameter write error: Code=${parameter.ErrorCode}, Additional=${parameter.AdditionalCode}`);
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
    }
    catch (error) {
        throw new Error(`Failed to write parameter ${index}.${subIndex} to port ${port}: ${error.message}`);
    }
}
function readDeviceName(handle, port) {
    try {
        const param = readDeviceParameter(handle, port, types_1.PARAMETER_INDEX.APPLICATION_SPECIFIC_NAME);
        const result = param.data.toString('ascii').replace(/\0/g, '').trim();
        return result && result.length > 0 ? result : 'Unknown Device';
    }
    catch (error) {
        console.log(`   Debug: APPLICATION_SPECIFIC_NAME not available for port ${port}: ${error.message}`);
        return 'Unknown Device';
    }
}
function readVendorName(handle, port) {
    try {
        const param = readDeviceParameter(handle, port, types_1.PARAMETER_INDEX.VENDOR_NAME);
        const result = param.data.toString('ascii').replace(/\0/g, '').trim();
        return result && result.length > 0 ? result : 'Unknown Vendor';
    }
    catch (error) {
        console.log(`   Debug: VENDOR_NAME not available for port ${port}: ${error.message}`);
        return 'Unknown Vendor';
    }
}
function readProductName(handle, port) {
    try {
        const param = readDeviceParameter(handle, port, types_1.PARAMETER_INDEX.PRODUCT_NAME);
        const result = param.data.toString('ascii').replace(/\0/g, '').trim();
        return result && result.length > 0 ? result : 'Unknown Product';
    }
    catch (error) {
        console.log(`   Debug: PRODUCT_NAME not available for port ${port}: ${error.message}`);
        return 'Unknown Product';
    }
}
function readSerialNumber(handle, port) {
    try {
        const param = readDeviceParameter(handle, port, types_1.PARAMETER_INDEX.SERIAL_NUMBER);
        const result = param.data.toString('ascii').replace(/\0/g, '').trim();
        return result && result.length > 0 ? result : '';
    }
    catch (error) {
        console.log(`   Debug: SERIAL_NUMBER not available for port ${port}: ${error.message}`);
        return '';
    }
}
// ============================================================================
// BLOB COMMUNICATION
// ============================================================================
function readBlob(handle, port, blobId, maxSize = 1024) {
    const buffer = Buffer.alloc(maxSize);
    const lengthRead = ffi_bindings_1.ref.alloc(ffi_bindings_1.DWORD);
    const status = new ffi_bindings_1.TBLOBStatus();
    const result = ffi_bindings_1.iolinkDll.BLOB_uploadBLOB(handle, port - 1, blobId, maxSize, buffer, lengthRead, status.ref());
    if (result !== types_1.RETURN_CODES.RETURN_OK && status.nextState !== 0) {
        const continueResult = continueBlob(handle, port, status);
        if (continueResult !== types_1.RETURN_CODES.RETURN_OK) {
            throw new Error(`BLOB read failed: ${result}, continue failed: ${continueResult}`);
        }
    }
    else if (result !== types_1.RETURN_CODES.RETURN_OK) {
        throw new Error(`BLOB read failed with code: ${result}`);
    }
    const actualLength = lengthRead.deref();
    return {
        data: buffer.slice(0, actualLength),
        blobId: blobId,
        port: port,
        timestamp: new Date(),
    };
}
function writeBlob(handle, port, blobId, data) {
    const buffer = data instanceof Buffer ? data : Buffer.from(data);
    const status = new ffi_bindings_1.TBLOBStatus();
    const result = ffi_bindings_1.iolinkDll.BLOB_downloadBLOB(handle, port - 1, blobId, buffer.length, buffer, status.ref());
    if (result !== types_1.RETURN_CODES.RETURN_OK && status.nextState !== 0) {
        const continueResult = continueBlob(handle, port, status);
        if (continueResult !== types_1.RETURN_CODES.RETURN_OK) {
            throw new Error(`BLOB write failed: ${result}, continue failed: ${continueResult}`);
        }
    }
    else if (result !== types_1.RETURN_CODES.RETURN_OK) {
        throw new Error(`BLOB write failed with code: ${result}`);
    }
    return {
        success: true,
        blobId: blobId,
        bytesWritten: buffer.length,
        port: port,
        timestamp: new Date(),
    };
}
function continueBlob(handle, port, status) {
    let result;
    do {
        result = ffi_bindings_1.iolinkDll.BLOB_Continue(handle, port - 1, status.ref());
        if (result !== types_1.RETURN_CODES.RETURN_OK)
            return result;
        if (status.nextState === 7)
            return -1;
    } while (status.nextState !== 0);
    return result;
}
// ============================================================================
// STREAMING FUNCTIONS
// ============================================================================
function streamDeviceData(handle, port, interval, callback) {
    const deviceInfo = getConnectedDeviceInfo(handle, port);
    console.log(`Starting data stream from IO-Link Device/Sensor on port ${port}: ${deviceInfo?.vendorName} ${deviceInfo?.deviceName}`);
    let running = true;
    const intervalId = setInterval(() => {
        if (!running) {
            clearInterval(intervalId);
            return;
        }
        try {
            const data = readProcessData(handle, port);
            callback(null, {
                ...data,
                deviceInfo: deviceInfo,
            });
        }
        catch (err) {
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
// ============================================================================
// HIGH-LEVEL DISCOVERY FUNCTIONS
// ============================================================================
async function discoverAllDevices() {
    console.log('=== IO-Link Discovery ===');
    const masters = discoverMasters();
    if (masters.length === 0) {
        console.log('No IO-Link Masters found.');
        return { masters: [] };
    }
    console.log(`Found ${masters.length} IO-Link Master(s)`);
    const topology = { masters: [] };
    for (const [index, master] of masters.entries()) {
        console.log(`\n--- Initializing IO-Link Master ${index + 1}: ${master.name} ---`);
        let handle = null;
        try {
            handle = connect(master.name);
            console.log(`Connected to IO-Link Master: ${master.name}`);
            const masterState = await initializeMaster(handle, master.name);
            const connectedDevices = scanMasterPorts(handle);
            topology.masters.push({
                ...master,
                handle: handle,
                connectedDevices: connectedDevices,
                totalDevices: connectedDevices.length,
                initialized: true,
                ports: Array.from(masterState.ports.keys()),
            });
        }
        catch (error) {
            console.error(`Failed to initialize IO-Link Master ${master.name}:`, error.message);
            topology.masters.push({
                ...master,
                handle: handle || 0,
                connectedDevices: [],
                totalDevices: 0,
                initialized: false,
                error: error.message,
            });
        }
    }
    const totalDevices = topology.masters.reduce((sum, master) => sum + master.totalDevices, 0);
    console.log(`\n=== Discovery Complete ===`);
    console.log(`IO-Link Masters found: ${topology.masters.length}`);
    console.log(`Total IO-Link Devices found: ${totalDevices}`);
    return topology;
}
function disconnectAllMasters(topology) {
    console.log('Disconnecting from all IO-Link Masters...');
    topology.masters.forEach((master) => {
        if (master.handle && master.handle > 0) {
            try {
                disconnect(master.handle);
                console.log(`Disconnected from IO-Link Master: ${master.name}`);
            }
            catch (error) {
                console.error(`Error disconnecting from IO-Link Master ${master.name}:`, error.message);
            }
        }
        else {
            console.log(`Skipping ${master.name} - no valid connection (handle: ${master.handle})`);
        }
    });
}
// ============================================================================
// UTILITY AND VALIDATION FUNCTIONS
// ============================================================================
function validatePortConnection(handle, port) {
    const masterState = masterStates.get(handle);
    if (!masterState || !masterState.initialized) {
        throw new Error('Master not initialized. Call initializeMaster() first.');
    }
    const portState = masterState.ports.get(port);
    if (!portState || !portState.configured) {
        throw new Error(`Port ${port} not configured during master initialization`);
    }
    const status = checkPortStatus(handle, port);
    if (!status.connected) {
        throw new Error(`No IO-Link Device/Sensor connected to port ${port}`);
    }
    return status;
}
function getConnectedDeviceInfo(handle, port) {
    try {
        const portStatus = checkPortStatus(handle, port);
        if (!portStatus.connected) {
            return null;
        }
        const dpp = portStatus.directParameterPage;
        if (!dpp || dpp.length < 16) {
            return {
                port: port,
                vendorId: 'Unknown',
                deviceId: 'Unknown',
                vendorName: 'Unknown Vendor',
                deviceName: 'Unknown Device',
                serialNumber: 'Unknown',
                processDataInputLength: 0,
                processDataOutputLength: 0,
                status: portStatus,
            };
        }
        const vendorId = (dpp[0] << 8) | dpp[1];
        const deviceId = (dpp[2] << 16) | (dpp[3] << 8) | dpp[4];
        const functionId = (dpp[5] << 8) | dpp[6];
        const revisionId = dpp[8];
        const pdInLength = dpp[9];
        const pdOutLength = dpp[10];
        let serialNumber = '';
        let deviceName = 'Unknown Device';
        let vendorName = 'Unknown Vendor';
        try {
            serialNumber = readSerialNumber(handle, port);
        }
        catch (e) {
            console.log(`   Debug: Serial number not available for port ${port}`);
        }
        try {
            deviceName = readDeviceName(handle, port);
        }
        catch (e) {
            console.log(`   Debug: Device name not available for port ${port}`);
        }
        try {
            vendorName = readVendorName(handle, port);
        }
        catch (e) {
            console.log(`   Debug: Vendor name not available for port ${port}`);
        }
        const finalVendorName = vendorName !== 'Unknown Vendor'
            ? vendorName
            : `Vendor_${vendorId.toString(16).toUpperCase()}`;
        const finalDeviceName = deviceName !== 'Unknown Device'
            ? deviceName
            : `Device_${deviceId.toString(16).toUpperCase()}`;
        return {
            port: port,
            vendorId: `0x${vendorId.toString(16).toUpperCase().padStart(4, '0')}`,
            deviceId: `0x${deviceId.toString(16).toUpperCase().padStart(6, '0')}`,
            functionId: `0x${functionId.toString(16).toUpperCase().padStart(4, '0')}`,
            revisionId: `0x${revisionId.toString(16).toUpperCase().padStart(2, '0')}`,
            vendorName: finalVendorName,
            deviceName: finalDeviceName,
            serialNumber: serialNumber,
            processDataInputLength: pdInLength,
            processDataOutputLength: pdOutLength,
            status: portStatus,
        };
    }
    catch (error) {
        console.error(`Error reading IO-Link Device/Sensor info from port ${port}:`, error.message);
        return null;
    }
}
function getMasterState(handle) {
    return masterStates.get(handle);
}
function resetGlobalRegistry() {
    globalMasterRegistry.clear();
}
//# sourceMappingURL=iolink-interface.js.map