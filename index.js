/**
 * IO-Link Interface Demo Application
 * Demonstrates complete IO-Link functionality including:
 * - Master discovery and initialization
 * - Device detection and identification
 * - Process data reading/writing
 * - Parameter reading/writing
 * - Performance testing
 */

const iolink = require("./iolink-interface");

async function main() {
  try {
    console.log("Starting IO-Link Discovery...\n");

    // 1. alle gerate entdecken
    const topology = await iolink.discoverAllDevices();

    if (topology.masters.length === 0) {
      console.log("No IO-Link Masters found");
      return;
    }

    // 2. network topology
    displayTopology(topology);

    // 3. ops testen wenn gerate entdeckt
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

    // 4. cleanup
    iolink.disconnectAllMasters(topology);
    console.log("\nDemo completed successfully!");
  } catch (err) {
    console.error(" Fatal Error:", err.message);
    console.error("Stack:", err.stack);
  }
}

function displayTopology(topology) {
  console.log("\n === IO-Link Network Topology ===");

  topology.masters.forEach((master, masterIndex) => {
    console.log(`\n IO-Link Master ${masterIndex + 1}: ${master.name}`);
    console.log(`   Product: ${master.viewName}`);
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

// device testing fct
async function testDeviceOperations(master) {
  const device = master.connectedDevices[0];
  const handle = master.handle;

  console.log(`\n=== Testing IO-Link Device Operations ===`);
  console.log(
    `Device: ${device.vendorName} ${device.deviceName} on Port ${device.port}`
  );

  // sequential testing of all functionalities
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

    // Test 4: Data Streaming
    console.log(`\n4. Testing Data Streaming...`);
    await testDataStreaming(handle, device);
  } catch (error) {
    console.error(`   Error during device testing:`, error.message);
  }
}

// 1. Process data reading test
async function testProcessDataReading(handle, device) {
  try {
    // First read with timing
    const start1 = Date.now();
    const processData = iolink.readProcessData(handle, device.port);
    const end1 = Date.now();

    console.log(
      `   Process Data: ${processData.data.toString("hex")} (${
        processData.data.length
      } bytes)`
    );
    console.log(`   Status: 0x${processData.status.toString(16)}`);
    console.log(`   Timestamp: ${processData.timestamp.toISOString()}`);
    console.log(`   First read took: ${end1 - start1}ms`);

    // multiple reads to show consistency with timing
    console.log(`   Reading 3 more samples with timing...`);
    for (let i = 1; i <= 3; i++) {
      await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay

      const startRead = Date.now();
      const sample = iolink.readProcessData(handle, device.port);
      const endRead = Date.now();

      console.log(
        `   Sample ${i}: ${sample.data.toString("hex")} (took ${
          endRead - startRead
        }ms)`
      );
    }
  } catch (error) {
    console.log(`   Process data reading failed: ${error.message}`);
  }
}

// 2. Process data writing test
async function testProcessDataWriting(handle, device) {
  try {
    if (device.processDataOutputLength > 0) {
      const testData = Buffer.from([0x01, 0x02, 0x03, 0x04]);
      const trimmedData = testData.slice(0, device.processDataOutputLength);

      const result = iolink.writeProcessData(handle, device.port, trimmedData);
      console.log(
        `   Written ${result.bytesWritten} bytes: ${trimmedData.toString(
          "hex"
        )}`
      );
      console.log(`   Write timestamp: ${result.timestamp.toISOString()}`);

      // Read back to verify
      await new Promise((resolve) => setTimeout(resolve, 100));
      const readback = iolink.readProcessData(handle, device.port);
      console.log(`   Readback: ${readback.data.toString("hex")}`);
    } else {
      console.log(`   Device has no output data (read-only device)`);
    }
  } catch (error) {
    console.log(`   Process data writing failed: ${error.message}`);
  }
}

// 3. Parameter reading test
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
      console.log(`   ${param.name} (Index ${param.index}): "${value}"`);
    } catch (error) {
      console.log(
        `   ✗ ${param.name} (Index ${param.index}): ${error.message}`
      );
    }
  }

  // Test convenience functions
  console.log(`   Testing convenience functions:`);
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

// 4. Parameter writing test
// 4. Native data streaming test
async function testDataStreaming(handle, device) {
  return new Promise((resolve) => {
    try {
      console.log(`   Starting native data logging test...`);

      const samplesPerSecond = 1000; // Test with 1000 Hz for higher performance
      const bufferSize = 8192; // 8KB buffer
      const testDuration = 2000; // 2 seconds for faster testing

      // Start native streaming
      iolink.startNativeStreaming(
        handle,
        device.port,
        samplesPerSecond,
        bufferSize
      );

      let totalSamples = 0;
      let readCount = 0;
      const startTime = Date.now();

      // Maximum speed continuous reading loop
      let lastReadTime = Date.now();
      let readAttempts = 0;
      let running = true;

      // Continuous high-speed reading function
      const performRead = () => {
        if (!running) return;

        const readStart = Date.now();
        readAttempts++;

        try {
          const result = iolink.readNativeLoggingBuffer(
            handle,
            device.port,
            bufferSize
          );

          const readEnd = Date.now();
          const timeSinceLastRead = readStart - lastReadTime;
          lastReadTime = readStart;

          if (result.bytesRead > 0) {
            readCount++;
            totalSamples += result.samples.length;

            const elapsed = Date.now() - startTime;
            console.log(
              `   Read ${readCount}/${readAttempts}: ${
                result.samples.length
              } samples, ${
                result.bytesRead
              } bytes (${elapsed}ms, gap: ${timeSinceLastRead}ms, read: ${
                readEnd - readStart
              }ms)`
            );

            // Show hardware buffer status
            const status = result.status;
            console.log(
              `   Status: running=${status.isRunning}, moreData=${status.hasMoreData}, overrun=${status.overrun}`
            );

            // Show sample data (only for first successful read)
            if (result.samples.length > 0 && readCount === 1) {
              const firstSample = result.samples[0];
              console.log(
                `   Sample data: ${firstSample.inputData.toString("hex")}`
              );
            }
          } else {
            // Show empty reads periodically
            if (readAttempts % 1000 === 0) {
              console.log(
                `   Read attempt ${readAttempts}: No data (gap: ${timeSinceLastRead}ms)`
              );
            }
          }
        } catch (readError) {
          console.error(`   Buffer read error: ${readError.message}`);
        }

        // Continue reading as fast as possible
        setImmediate(performRead);
      };

      // Start the continuous reading loop
      console.log(`   Starting maximum speed continuous reading...`);
      performRead();

      // Stop streaming after test duration
      setTimeout(() => {
        try {
          running = false; // Stop the continuous reading loop

          // Try to read any remaining data before stopping
          try {
            const finalResult = iolink.readNativeLoggingBuffer(
              handle,
              device.port,
              bufferSize
            );
            if (finalResult.bytesRead > 0) {
              totalSamples += finalResult.samples.length;
              console.log(
                `   Final read: ${finalResult.samples.length} samples, ${finalResult.bytesRead} bytes`
              );
            }
          } catch (finalReadError) {
            console.log(`   Final read error: ${finalReadError.message}`);
          }

          // Stop the logging
          try {
            iolink.stopNativeStreaming(handle, device.port);
            console.log(`   Native streaming stopped successfully`);
          } catch (stopError) {
            console.log(
              `   Stop warning: ${stopError.message} (may be normal)`
            );
          }

          const totalTime = (Date.now() - startTime) / 1000;
          const effectiveRate = totalSamples / totalTime;

          console.log(
            `   Native streaming completed - ${totalSamples} samples in ${totalTime.toFixed(
              1
            )}s`
          );
          console.log(
            `   Effective sample rate: ${effectiveRate.toFixed(
              1
            )} Hz (target: ${samplesPerSecond} Hz)`
          );
          console.log(`   Buffer reads: ${readCount}`);
        } catch (overallError) {
          console.error(`   Overall streaming error: ${overallError.message}`);
        }
        resolve();
      }, testDuration);
    } catch (error) {
      console.log(`   Native data streaming failed: ${error.message}`);
      resolve();
    }
  });
}

main();
