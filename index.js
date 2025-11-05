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

    // Test 6: Performance Testing
    console.log(`\n6. Testing Data Retrieval Performance...`);
    await testDataPerformance(handle, device);
  } catch (error) {
    console.error(`   Error during device testing:`, error.message);
  }
}

// ADDED: Process data reading test
async function testProcessDataReading(handle, device) {
  try {
    const processData = iolink.readDeviceProcessData(handle, device.port);
    console.log(
      `   Process Data: ${processData.data.toString("hex")} (${
        processData.data.length
      } bytes)`
    );
    console.log(`   Status: 0x${processData.status.toString(16)}`);
    console.log(`   Timestamp: ${processData.timestamp.toISOString()}`);

    // ADDED: Try multiple reads to show consistency
    console.log(`   → Reading 3 more samples...`);
    for (let i = 1; i <= 3; i++) {
      await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay
      const sample = iolink.readDeviceProcessData(handle, device.port);
      console.log(`   Sample ${i}: ${sample.data.toString("hex")}`);
    }
  } catch (error) {
    console.log(`   Process data reading failed: ${error.message}`);
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
        `   Written ${result.bytesWritten} bytes: ${trimmedData.toString(
          "hex"
        )}`
      );
      console.log(`   Write timestamp: ${result.timestamp.toISOString()}`);

      // ADDED: Read back to verify
      await new Promise((resolve) => setTimeout(resolve, 100));
      const readback = iolink.readDeviceProcessData(handle, device.port);
      console.log(`   → Readback: ${readback.data.toString("hex")}`);
    } else {
      console.log(`   Device has no output data (read-only device)`);
    }
  } catch (error) {
    console.log(`   Process data writing failed: ${error.message}`);
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
      console.log(`   ${param.name} (Index ${param.index}): "${value}"`);
    } catch (error) {
      console.log(`   ${param.name} (Index ${param.index}): ${error.message}`);
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
      console.log(`   Parameter write successful`);
      console.log(`   Write timestamp: ${result.timestamp.toISOString()}`);

      // ADDED: Read back to verify
      await new Promise((resolve) => setTimeout(resolve, 100));
      const readback = iolink.readDeviceName(handle, device.port);
      console.log(`   → Readback name: "${readback}"`);
    } catch (writeError) {
      console.log(
        `   Parameter writing not supported or failed: ${writeError.message}`
      );
    }
  } catch (error) {
    console.log(`   Parameter writing test failed: ${error.message}`);
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
            console.error(`   Stream error: ${err.message}`);
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
          `   Streaming completed - ${sampleCount} samples collected`
        );
        resolve();
      }, 5000);
    } catch (error) {
      console.log(`   Data streaming failed: ${error.message}`);
      resolve();
    }
  });
}

// ADDED: Data performance testing
async function testDataPerformance(handle, device) {
  console.log(`   → Testing maximum data retrieval speed...`);
  console.log(`   → TARGET: 1000 samples/second (1 kHz)`);

  // Test 1: Absolute maximum burst speed
  await testMaximumBurstSpeed(handle, device);

  // Test 2: Sustained 1000 Hz test
  await test1000HzTarget(handle, device);

  // Test 3: Different timing strategies for high speed
  await testHighSpeedIntervals(handle, device);

  // Test 4: Legacy performance test
  await testLegacyPerformance(handle, device);
}

// ADDED: Legacy performance testing function
async function testLegacyPerformance(handle, device) {
  const testDuration = 5000; // 5 seconds
  const startTime = Date.now();
  let sampleCount = 0;
  let errorCount = 0;
  let totalLatency = 0;
  let minLatency = Infinity;
  let maxLatency = 0;

  while (Date.now() - startTime < testDuration) {
    const sampleStart = process.hrtime.bigint();

    try {
      const processData = iolink.readDeviceProcessData(handle, device.port);
      const sampleEnd = process.hrtime.bigint();

      const latencyNs = Number(sampleEnd - sampleStart);
      const latencyMs = latencyNs / 1000000;

      totalLatency += latencyMs;
      minLatency = Math.min(minLatency, latencyMs);
      maxLatency = Math.max(maxLatency, latencyMs);
      sampleCount++;

      // Show progress every 100 samples
      if (sampleCount % 100 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const currentRate = sampleCount / elapsed;
        process.stdout.write(
          `\r   → Samples: ${sampleCount}, Rate: ${currentRate.toFixed(
            1
          )} Hz, Latency: ${latencyMs.toFixed(2)}ms`
        );
      }
    } catch (error) {
      errorCount++;
      // Small delay on error to prevent overwhelming the system
      await new Promise((resolve) => setTimeout(resolve, 1));
    }
  }

  const totalTime = (Date.now() - startTime) / 1000;
  const avgLatency = totalLatency / sampleCount;
  const samplesPerSecond = sampleCount / totalTime;

  console.log(`\n   Performance Test Results:`);
  console.log(`     • Total Samples: ${sampleCount}`);
  console.log(`     • Total Time: ${totalTime.toFixed(2)} seconds`);
  console.log(
    `     • Average Rate: ${samplesPerSecond.toFixed(2)} samples/second`
  );
  console.log(`     • Maximum Rate: ~${samplesPerSecond.toFixed(0)} Hz`);
  console.log(`     • Error Count: ${errorCount}`);
  console.log(
    `     • Success Rate: ${(
      (sampleCount / (sampleCount + errorCount)) *
      100
    ).toFixed(1)}%`
  );
  console.log(`     • Average Latency: ${avgLatency.toFixed(2)}ms`);
  console.log(`     • Min Latency: ${minLatency.toFixed(2)}ms`);
  console.log(`     • Max Latency: ${maxLatency.toFixed(2)}ms`);

  // Performance rating
  if (samplesPerSecond > 100) {
    console.log(
      `     EXCELLENT: ${samplesPerSecond.toFixed(
        0
      )} Hz - Real-time control capable`
    );
  } else if (samplesPerSecond > 50) {
    console.log(
      `     VERY GOOD: ${samplesPerSecond.toFixed(
        0
      )} Hz - High-speed monitoring`
    );
  } else if (samplesPerSecond > 20) {
    console.log(
      `     GOOD: ${samplesPerSecond.toFixed(0)} Hz - Standard monitoring`
    );
  } else if (samplesPerSecond > 5) {
    console.log(
      `     MODERATE: ${samplesPerSecond.toFixed(0)} Hz - Basic monitoring`
    );
  } else {
    console.log(
      `     SLOW: ${samplesPerSecond.toFixed(0)} Hz - Limited applications`
    );
  }

  // Test different timing strategies
  console.log(`\n   → Testing timed intervals...`);
  await testTimedIntervals(handle, device);
}

// ADDED: Test specific timing intervals
async function testTimedIntervals(handle, device) {
  const intervals = [1, 5, 10, 20, 50, 100]; // milliseconds

  for (const intervalMs of intervals) {
    const targetHz = 1000 / intervalMs;
    let sampleCount = 0;
    let errorCount = 0;
    const testDuration = 2000; // 2 seconds per interval test

    console.log(
      `   → Testing ${intervalMs}ms intervals (target: ${targetHz} Hz)...`
    );

    const startTime = Date.now();
    const endTime = startTime + testDuration;

    while (Date.now() < endTime) {
      const iterStart = Date.now();

      try {
        const processData = iolink.readDeviceProcessData(handle, device.port);
        sampleCount++;
      } catch (error) {
        errorCount++;
      }

      // Wait for next interval
      const elapsed = Date.now() - iterStart;
      const waitTime = Math.max(0, intervalMs - elapsed);
      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    const actualDuration = (Date.now() - startTime) / 1000;
    const actualHz = sampleCount / actualDuration;
    const efficiency = (actualHz / targetHz) * 100;

    console.log(
      `     ${intervalMs}ms: ${actualHz.toFixed(1)} Hz (${efficiency.toFixed(
        0
      )}% efficiency, ${errorCount} errors)`
    );
  }
}

// Test absolute maximum speed without any delays
async function testMaximumBurstSpeed(handle, device) {
  console.log(`\n   → BURST TEST: Maximum speed (no delays)...`);

  const testDuration = 5000; // 5 seconds for burst
  const startTime = Date.now();
  let sampleCount = 0;
  let errorCount = 0;
  let totalLatency = 0;
  let minLatency = Infinity;
  let maxLatency = 0;

  while (Date.now() - startTime < testDuration) {
    const sampleStart = process.hrtime.bigint();

    try {
      const processData = iolink.readDeviceProcessData(handle, device.port);
      const sampleEnd = process.hrtime.bigint();

      const latencyNs = Number(sampleEnd - sampleStart);
      const latencyMs = latencyNs / 1000000;

      totalLatency += latencyMs;
      minLatency = Math.min(minLatency, latencyMs);
      maxLatency = Math.max(maxLatency, latencyMs);
      sampleCount++;

      // Show progress every 1000 samples for high speed
      if (sampleCount % 1000 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const currentRate = sampleCount / elapsed;
        process.stdout.write(
          `\r   → Samples: ${sampleCount}, Rate: ${currentRate.toFixed(
            0
          )} Hz, Latency: ${latencyMs.toFixed(2)}ms`
        );
      }
    } catch (error) {
      errorCount++;
    }
  }

  const totalTime = (Date.now() - startTime) / 1000;
  const avgLatency = totalLatency / sampleCount;
  const samplesPerSecond = sampleCount / totalTime;

  console.log(`\n   BURST Results:`);
  console.log(`     • Maximum Rate: ${samplesPerSecond.toFixed(0)} Hz`);
  console.log(`     • Samples: ${sampleCount} in ${totalTime.toFixed(1)}s`);
  console.log(`     • Avg Latency: ${avgLatency.toFixed(2)}ms`);
  console.log(`     • Min Latency: ${minLatency.toFixed(2)}ms`);
  console.log(`     • Max Latency: ${maxLatency.toFixed(2)}ms`);
  console.log(`     • Errors: ${errorCount}`);

  if (samplesPerSecond >= 1000) {
    console.log(
      `     SUCCESS: ${samplesPerSecond.toFixed(0)} Hz ≥ 1000 Hz TARGET!`
    );
  } else {
    console.log(
      `     Below target: ${samplesPerSecond.toFixed(0)} Hz < 1000 Hz target`
    );
    console.log(
      `     Theoretical max: ~${(1000 / avgLatency).toFixed(
        0
      )} Hz based on latency`
    );
  }
}

// Test sustained 1000 Hz with precise timing
async function test1000HzTarget(handle, device) {
  console.log(`\n   → 1000 Hz TARGET TEST: Sustained 1ms intervals...`);

  const targetInterval = 1; // 1ms = 1000 Hz
  const testDuration = 10000; // 10 seconds
  let sampleCount = 0;
  let errorCount = 0;
  let missedIntervals = 0;
  let latencySum = 0;

  const startTime = Date.now();
  const endTime = startTime + testDuration;
  let lastSampleTime = startTime;

  while (Date.now() < endTime) {
    const iterStart = process.hrtime.bigint();
    const currentTime = Date.now();

    // Check if we're maintaining interval
    const actualInterval = currentTime - lastSampleTime;
    if (actualInterval > targetInterval * 1.5) {
      missedIntervals++;
    }

    try {
      const processData = iolink.readDeviceProcessData(handle, device.port);
      const iterEnd = process.hrtime.bigint();

      const latencyMs = Number(iterEnd - iterStart) / 1000000;
      latencySum += latencyMs;
      sampleCount++;
      lastSampleTime = currentTime;

      // Show progress every 1000 samples
      if (sampleCount % 1000 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const currentRate = sampleCount / elapsed;
        process.stdout.write(
          `\r   → ${sampleCount} samples, ${currentRate.toFixed(
            0
          )} Hz, ${missedIntervals} missed`
        );
      }
    } catch (error) {
      errorCount++;
    }

    // Precise timing: wait remaining time in interval
    const processingTime =
      Number(process.hrtime.bigint() - iterStart) / 1000000; // ms
    const waitTime = Math.max(0, targetInterval - processingTime);

    if (waitTime > 0.01) {
      // Only wait if meaningful
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  const actualDuration = (Date.now() - startTime) / 1000;
  const achievedRate = sampleCount / actualDuration;
  const avgLatency = latencySum / sampleCount;
  const efficiency = (achievedRate / 1000) * 100;

  console.log(`\n   1000 Hz TARGET Results:`);
  console.log(`     • Target: 1000 Hz (1ms intervals)`);
  console.log(`     • Achieved: ${achievedRate.toFixed(1)} Hz`);
  console.log(`     • Efficiency: ${efficiency.toFixed(1)}%`);
  console.log(
    `     • Samples: ${sampleCount}/${Math.floor(
      testDuration / targetInterval
    )} expected`
  );
  console.log(`     • Avg Latency: ${avgLatency.toFixed(2)}ms`);
  console.log(`     • Missed Intervals: ${missedIntervals}`);
  console.log(`     • Errors: ${errorCount}`);

  if (achievedRate >= 1000) {
    console.log(`     AMAZING: 1000+ Hz sustained!`);
  } else if (achievedRate >= 800) {
    console.log(`     EXCELLENT: Very close to 1000 Hz!`);
  } else if (achievedRate >= 500) {
    console.log(`     GOOD: High speed achieved`);
  } else {
    console.log(`     MODERATE: Below high-speed threshold`);
  }
}

// Test various high-speed intervals
async function testHighSpeedIntervals(handle, device) {
  console.log(`\n   → HIGH-SPEED INTERVAL TESTS...`);

  const highSpeedTests = [
    { interval: 0.5, target: 2000, name: "2000 Hz (0.5ms)" },
    { interval: 1, target: 1000, name: "1000 Hz (1ms)" },
    { interval: 2, target: 500, name: "500 Hz (2ms)" },
    { interval: 5, target: 200, name: "200 Hz (5ms)" },
    { interval: 10, target: 100, name: "100 Hz (10ms)" },
  ];

  for (const test of highSpeedTests) {
    let sampleCount = 0;
    let errorCount = 0;
    const testDuration = 3000; // 3 seconds per test

    const startTime = Date.now();
    const endTime = startTime + testDuration;

    while (Date.now() < endTime) {
      const iterStart = Date.now();

      try {
        const processData = iolink.readDeviceProcessData(handle, device.port);
        sampleCount++;
      } catch (error) {
        errorCount++;
      }

      // Precise wait
      const elapsed = Date.now() - iterStart;
      const waitTime = Math.max(0, test.interval - elapsed);

      if (waitTime > 0.01) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    const actualDuration = (Date.now() - startTime) / 1000;
    const actualHz = sampleCount / actualDuration;
    const efficiency = (actualHz / test.target) * 100;

    const status =
      efficiency >= 95
        ? "[OK]"
        : efficiency >= 80
        ? "[GOOD]"
        : efficiency >= 50
        ? "[WARN]"
        : "[FAIL]";
    console.log(
      `     ${status} ${test.name}: ${actualHz.toFixed(
        0
      )} Hz (${efficiency.toFixed(0)}% eff, ${errorCount} err)`
    );

    // Special highlight for 1000 Hz achievement
    if (test.target === 1000 && actualHz >= 1000) {
      console.log(`        1000 Hz TARGET ACHIEVED!`);
    }
  }
}

// Start the demo
main();
