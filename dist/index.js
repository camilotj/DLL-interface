"use strict";
/**
 * IO-Link Interface Demo Application
 * Demonstrates complete IO-Link functionality including:
 * - Master discovery and initialization
 * - Device detection and identification
 * - Process data reading/writing
 * - Parameter reading/writing
 * - Data streaming
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const iolink = __importStar(require("./iolink-interface"));
const types_1 = require("./types");
async function main() {
    try {
        console.log('Starting IO-Link Discovery...\n');
        // 1. Discover all devices
        const topology = await iolink.discoverAllDevices();
        if (topology.masters.length === 0) {
            console.log('No IO-Link Masters found');
            return;
        }
        // 2. Display network topology
        displayTopology(topology);
        // 3. Test operations if devices are discovered
        const firstMasterWithDevices = topology.masters.find((master) => master.connectedDevices.length > 0);
        if (firstMasterWithDevices && firstMasterWithDevices.connectedDevices.length > 0) {
            await testDeviceOperations(firstMasterWithDevices);
        }
        else {
            console.log('\n  No IO-Link Devices/Sensors found connected to any IO-Link Master');
            console.log('Please connect IO-Link Devices/Sensors to the IO-Link Master ports and try again.');
        }
        // 4. Cleanup
        iolink.disconnectAllMasters(topology);
        console.log('\nDemo completed successfully!');
    }
    catch (err) {
        console.error('✗ Fatal Error:', err.message);
        console.error('Stack:', err.stack);
    }
}
function displayTopology(topology) {
    console.log('\n=== IO-Link Network Topology ===');
    topology.masters.forEach((master, masterIndex) => {
        console.log(`\nIO-Link Master ${masterIndex + 1}: ${master.name}`);
        console.log(`  Product: ${master.viewName}`);
        console.log(`  Handle: ${master.handle}`);
        console.log(`  Connected IO-Link Devices/Sensors: ${master.totalDevices}`);
        if (master.connectedDevices.length > 0) {
            master.connectedDevices.forEach((device) => {
                console.log(`   Port ${device.port}: ${device.vendorName} ${device.deviceName}`);
                console.log(`     Vendor ID: ${device.vendorId}, Device ID: ${device.deviceId}`);
                console.log(`     Serial: ${device.serialNumber}`);
                console.log(`     Process Data: ${device.processDataInputLength}/${device.processDataOutputLength} bytes`);
                console.log(`     Status: ${device.status?.mode}`);
            });
        }
        else {
            console.log('  (No IO-Link Devices/Sensors connected)');
        }
    });
}
async function testDeviceOperations(master) {
    const device = master.connectedDevices[0];
    const handle = master.handle;
    console.log(`\n=== Testing IO-Link Device Operations ===`);
    console.log(`Device: ${device.vendorName} ${device.deviceName} on Port ${device.port}`);
    try {
        // Test 1: Process Data Reading
        console.log(`\n1. Reading Process Data...`);
        await testProcessDataReading(handle, device);
        // Test 2: Process Data Writing (if supported)
        console.log(`\n2. Testing Process Data Writing...`);
        await testProcessDataWriting(handle, device);
        // Test 3: Parameter Reading
        console.log(`\n3. Reading Device Parameters...`);
        await testParameterReading(handle, device);
        // Test 4: Parameter Writing (if supported)
        console.log(`\n4. Testing Parameter Writing...`);
        await testParameterWriting(handle, device);
        // Test 5: Data Streaming
        console.log(`\n5. Testing Data Streaming...`);
        await testDataStreaming(handle, device);
    }
    catch (error) {
        console.error(`  ✗ Error during device testing:`, error.message);
    }
}
async function testProcessDataReading(handle, device) {
    try {
        const processData = iolink.readProcessData(handle, device.port);
        console.log(`  ✓ Process Data: ${processData.data.toString('hex')} (${processData.data.length} bytes)`);
        console.log(`  ✓ Status: 0x${processData.status.toString(16)}`);
        console.log(`  ✓ Timestamp: ${processData.timestamp.toISOString()}`);
        // Multiple reads to show consistency
        console.log(`  → Reading 3 more samples...`);
        for (let i = 1; i <= 3; i++) {
            await new Promise((resolve) => setTimeout(resolve, 100));
            const sample = iolink.readProcessData(handle, device.port);
            console.log(`  Sample ${i}: ${sample.data.toString('hex')}`);
        }
    }
    catch (error) {
        console.log(`  ✗ Process data reading failed: ${error.message}`);
    }
}
async function testProcessDataWriting(handle, device) {
    try {
        if (device.processDataOutputLength > 0) {
            const testData = Buffer.from([0x01, 0x02, 0x03, 0x04]);
            const trimmedData = testData.slice(0, device.processDataOutputLength);
            const result = iolink.writeProcessData(handle, device.port, trimmedData);
            console.log(`  ✓ Written ${result.bytesWritten} bytes: ${trimmedData.toString('hex')}`);
            console.log(`  ✓ Write timestamp: ${result.timestamp.toISOString()}`);
            // Read back to verify
            await new Promise((resolve) => setTimeout(resolve, 100));
            const readback = iolink.readProcessData(handle, device.port);
            console.log(`  → Readback: ${readback.data.toString('hex')}`);
        }
        else {
            console.log(`  ⚠ Device has no output data (read-only device)`);
        }
    }
    catch (error) {
        console.log(`  ✗ Process data writing failed: ${error.message}`);
    }
}
async function testParameterReading(handle, device) {
    const parametersToTest = [
        { index: types_1.PARAMETER_INDEX.VENDOR_NAME, name: 'Vendor Name' },
        { index: types_1.PARAMETER_INDEX.PRODUCT_NAME, name: 'Product Name' },
        { index: types_1.PARAMETER_INDEX.SERIAL_NUMBER, name: 'Serial Number' },
        { index: types_1.PARAMETER_INDEX.APPLICATION_SPECIFIC_NAME, name: 'Device Name' },
        { index: types_1.PARAMETER_INDEX.HARDWARE_REVISION, name: 'Hardware Revision' },
        { index: types_1.PARAMETER_INDEX.FIRMWARE_REVISION, name: 'Firmware Revision' },
    ];
    for (const param of parametersToTest) {
        try {
            const result = iolink.readDeviceParameter(handle, device.port, param.index);
            const value = result.data.toString('ascii').replace(/\0/g, '').trim();
            console.log(`  ✓ ${param.name} (Index ${param.index}): "${value}"`);
        }
        catch (error) {
            console.log(`  ✗ ${param.name} (Index ${param.index}): ${error.message}`);
        }
    }
    // Test convenience functions
    console.log(`  → Testing convenience functions:`);
    try {
        const deviceName = iolink.readDeviceName(handle, device.port);
        const serialNumber = iolink.readSerialNumber(handle, device.port);
        const vendorName = iolink.readVendorName(handle, device.port);
        const productName = iolink.readProductName(handle, device.port);
        console.log(`    Device Name: "${deviceName}"`);
        console.log(`    Serial Number: "${serialNumber}"`);
        console.log(`    Vendor Name: "${vendorName}"`);
        console.log(`    Product Name: "${productName}"`);
    }
    catch (error) {
        console.log(`    ✗ Error with convenience functions: ${error.message}`);
    }
}
async function testParameterWriting(handle, device) {
    try {
        const newName = `TestDevice_${Date.now().toString().slice(-4)}`;
        const nameData = Buffer.from(newName, 'ascii');
        console.log(`  → Attempting to write device name: "${newName}"`);
        try {
            const result = iolink.writeDeviceParameter(handle, device.port, types_1.PARAMETER_INDEX.APPLICATION_SPECIFIC_NAME, 0, nameData);
            console.log(`  ✓ Parameter write successful`);
            console.log(`  ✓ Write timestamp: ${result.timestamp.toISOString()}`);
            // Read back to verify
            await new Promise((resolve) => setTimeout(resolve, 100));
            const readback = iolink.readDeviceName(handle, device.port);
            console.log(`  → Readback name: "${readback}"`);
        }
        catch (writeError) {
            console.log(`  ⚠ Parameter writing not supported or failed: ${writeError.message}`);
        }
    }
    catch (error) {
        console.log(`  ✗ Parameter writing test failed: ${error.message}`);
    }
}
async function testDataStreaming(handle, device) {
    return new Promise((resolve) => {
        try {
            console.log(`  → Starting 5-second data stream (200ms interval)...`);
            let sampleCount = 0;
            const startTime = Date.now();
            const stopStreaming = iolink.streamDeviceData(handle, device.port, 200, (err, data) => {
                if (err) {
                    console.error(`  ✗ Stream error: ${err.message}`);
                    resolve();
                    return;
                }
                if (data) {
                    sampleCount++;
                    const elapsed = Date.now() - startTime;
                    console.log(`  Sample ${sampleCount}: ${data.data.toString('hex')} (${elapsed}ms)`);
                }
            });
            // Stop streaming after 5 seconds
            setTimeout(() => {
                stopStreaming();
                console.log(`  ✓ Streaming completed - ${sampleCount} samples collected`);
                resolve();
            }, 5000);
        }
        catch (error) {
            console.log(`  ✗ Data streaming failed: ${error.message}`);
            resolve();
        }
    });
}
main();
//# sourceMappingURL=index.js.map