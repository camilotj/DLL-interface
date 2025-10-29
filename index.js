/**
 * IO-Link Interface Demo Application
 * Demonstrates complete IO-Link functionality including:
 * - Master discovery and initialization
 * - Device detection and identification
 * - Process data reading/writing
 * - Parameter reading/writing
 * - Data streaming
 */

const iolink = require("./iolink-interface");

async function main() {
  try {
    console.log("Starting IO-Link Discovery...\n");

    // CHANGED: Use the enhanced discovery function
    const topology = await iolink.discoverAllDevices();

    if (topology.masters.length === 0) {
      console.log("No IO-Link Masters found");
      return;
    }

    // CHANGED: Enhanced topology display with more details
    displayTopology(topology);

    // CHANGED: Work with the first available device
    const firstMasterWithDevices = topology.masters.find(
      (master) => master.connectedDevices.length > 0
    );

    if (
      firstMasterWithDevices &&
      firstMasterWithDevices.connectedDevices.length > 0
    ) {
      await testDeviceOperations(firstMasterWithDevices);
    } else {
      console.log(
        "\n  No IO-Link Devices/Sensors found connected to any IO-Link Master"
      );
      console.log(
        "Please connect IO-Link Devices/Sensors to the IO-Link Master ports and try again."
      );
    }

    // CHANGED: Always clean up
    iolink.disconnectAllMasters(topology);
    console.log("\nDemo completed successfully!");
  } catch (err) {
    console.error(" Fatal Error:", err.message);
    console.error("Stack:", err.stack);
  }
}

// ADDED: Enhanced topology display function
function displayTopology(topology) {
  console.log("\n === IO-Link Network Topology ===");

  topology.masters.forEach((master, masterIndex) => {
    console.log(`\n IO-Link Master ${masterIndex + 1}: ${master.name}`);
    console.log(`   Product: ${master.productCode}`);
    console.log(`   Handle: ${master.handle}`);
    console.log(`   Connected IO-Link Devices/Sensors: ${master.totalDevices}`);

    if (master.connectedDevices.length > 0) {
      master.connectedDevices.forEach((device) => {
        console.log(
          `    Port ${device.port}: ${device.vendorName} ${device.deviceName}`
        );
        console.log(
          `      Vendor ID: ${device.vendorId}, Device ID: ${device.deviceId}`
        );
        console.log(`      Serial: ${device.serialNumber}`);
        console.log(
          `      Process Data: ${device.processDataInputLength}/${device.processDataOutputLength} bytes`
        );
        console.log(`      Status: ${device.status.mode}`);
      });
    } else {
      console.log("   (No IO-Link Devices/Sensors connected)");
    }
  });
}

// ADDED: Comprehensive device testing function
async function testDeviceOperations(master) {
  const device = master.connectedDevices[0];
  const handle = master.handle;

  console.log(`\n=== Testing IO-Link Device Operations ===`);
  console.log(
    `Device: ${device.vendorName} ${device.deviceName} on Port ${device.port}`
  );

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
  } catch (error) {
    console.error(`   Error during device testing:`, error.message);
  }
}

// ADDED: Process data reading test
async function testProcessDataReading(handle, device) {
  try {
    const processData = iolink.readDeviceProcessData(handle, device.port);
    console.log(
      `   ✓ Process Data: ${processData.data.toString("hex")} (${
        processData.data.length
      } bytes)`
    );
    console.log(`   ✓ Status: 0x${processData.status.toString(16)}`);
    console.log(`   ✓ Timestamp: ${processData.timestamp.toISOString()}`);

    // ADDED: Try multiple reads to show consistency
    console.log(`   → Reading 3 more samples...`);
    for (let i = 1; i <= 3; i++) {
      await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay
      const sample = iolink.readDeviceProcessData(handle, device.port);
      console.log(`   Sample ${i}: ${sample.data.toString("hex")}`);
    }
  } catch (error) {
    console.log(`   ✗ Process data reading failed: ${error.message}`);
  }
}

// ADDED: Process data writing test
async function testProcessDataWriting(handle, device) {
  try {
    if (device.processDataOutputLength > 0) {
      const testData = Buffer.from([0x01, 0x02, 0x03, 0x04]);
      const trimmedData = testData.slice(0, device.processDataOutputLength);

      const result = iolink.writeDeviceProcessData(
        handle,
        device.port,
        trimmedData
      );
      console.log(
        `   ✓ Written ${result.bytesWritten} bytes: ${trimmedData.toString(
          "hex"
        )}`
      );
      console.log(`   ✓ Write timestamp: ${result.timestamp.toISOString()}`);

      // ADDED: Read back to verify
      await new Promise((resolve) => setTimeout(resolve, 100));
      const readback = iolink.readDeviceProcessData(handle, device.port);
      console.log(`   → Readback: ${readback.data.toString("hex")}`);
    } else {
      console.log(`   ⚠ Device has no output data (read-only device)`);
    }
  } catch (error) {
    console.log(`   ✗ Process data writing failed: ${error.message}`);
  }
}

// ADDED: Parameter reading test
async function testParameterReading(handle, device) {
  const parametersToTest = [
    { index: iolink.PARAMETER_INDEX.VENDOR_NAME, name: "Vendor Name" },
    { index: iolink.PARAMETER_INDEX.PRODUCT_NAME, name: "Product Name" },
    { index: iolink.PARAMETER_INDEX.SERIAL_NUMBER, name: "Serial Number" },
    {
      index: iolink.PARAMETER_INDEX.APPLICATION_SPECIFIC_NAME,
      name: "Device Name",
    },
    {
      index: iolink.PARAMETER_INDEX.HARDWARE_REVISION,
      name: "Hardware Revision",
    },
    {
      index: iolink.PARAMETER_INDEX.FIRMWARE_REVISION,
      name: "Firmware Revision",
    },
  ];

  for (const param of parametersToTest) {
    try {
      const result = iolink.readDeviceParameter(
        handle,
        device.port,
        param.index
      );
      const value = result.data.toString("ascii").replace(/\0/g, "").trim();
      console.log(`   ✓ ${param.name} (Index ${param.index}): "${value}"`);
    } catch (error) {
      console.log(
        `   ✗ ${param.name} (Index ${param.index}): ${error.message}`
      );
    }
  }

  // ADDED: Test convenience functions
  console.log(`   → Testing convenience functions:`);
  try {
    const deviceName = iolink.readDeviceName(handle, device.port);
    const serialNumber = iolink.readSerialNumber(handle, device.port);
    const vendorName = iolink.readVendorName(handle, device.port);
    const productName = iolink.readProductName(handle, device.port);

    console.log(`     Device Name: "${deviceName}"`);
    console.log(`     Serial Number: "${serialNumber}"`);
    console.log(`     Vendor Name: "${vendorName}"`);
    console.log(`     Product Name: "${productName}"`);
  } catch (error) {
    console.log(`     Error with convenience functions: ${error.message}`);
  }
}

// ADDED: Parameter writing test
async function testParameterWriting(handle, device) {
  try {
    // ADDED: Test writing Application Specific Name (if writable)
    const newName = `TestDevice_${Date.now().toString().slice(-4)}`;
    const nameData = Buffer.from(newName, "ascii");

    console.log(`   → Attempting to write device name: "${newName}"`);

    try {
      const result = iolink.writeDeviceParameter(
        handle,
        device.port,
        iolink.PARAMETER_INDEX.APPLICATION_SPECIFIC_NAME,
        0,
        nameData
      );
      console.log(`   ✓ Parameter write successful`);
      console.log(`   ✓ Write timestamp: ${result.timestamp.toISOString()}`);

      // ADDED: Read back to verify
      await new Promise((resolve) => setTimeout(resolve, 100));
      const readback = iolink.readDeviceName(handle, device.port);
      console.log(`   → Readback name: "${readback}"`);
    } catch (writeError) {
      console.log(
        `   ⚠ Parameter writing not supported or failed: ${writeError.message}`
      );
    }
  } catch (error) {
    console.log(`   ✗ Parameter writing test failed: ${error.message}`);
  }
}

// ADDED: Data streaming test
async function testDataStreaming(handle, device) {
  return new Promise((resolve) => {
    try {
      console.log(`   → Starting 5-second data stream (200ms interval)...`);

      let sampleCount = 0;
      const startTime = Date.now();

      const stopStreaming = iolink.streamDeviceData(
        handle,
        device.port,
        200, // 200ms interval
        (err, data) => {
          if (err) {
            console.error(`   ✗ Stream error: ${err.message}`);
            resolve();
            return;
          }

          sampleCount++;
          const elapsed = Date.now() - startTime;
          console.log(
            `   Sample ${sampleCount}: ${data.data.toString(
              "hex"
            )} (${elapsed}ms)`
          );
        }
      );

      // ADDED: Stop streaming after 5 seconds
      setTimeout(() => {
        stopStreaming();
        console.log(
          `   ✓ Streaming completed - ${sampleCount} samples collected`
        );
        resolve();
      }, 5000);
    } catch (error) {
      console.log(`   ✗ Data streaming failed: ${error.message}`);
      resolve();
    }
  });
}

// Start the demo
main();
