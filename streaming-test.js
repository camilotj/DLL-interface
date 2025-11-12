/**
 * Focused Native Streaming Test
 * Tests only the native streaming functionality without full device initialization
 */

const iolink = require("./iolink-interface");

async function testNativeStreaming() {
  try {
    console.log("=== Native Streaming Test ===");

    // Discover and connect to master
    const masters = iolink.discoverMasters();
    if (masters.length === 0) {
      console.log("No IO-Link Masters found");
      return;
    }

    const master = masters[0];
    console.log(`Found master: ${master.name}`);

    const handle = iolink.connect(master.name);
    if (handle <= 0) {
      console.log("Failed to connect to master");
      return;
    }

    console.log(`Connected with handle: ${handle}`);

    // Initialize master
    await iolink.initializeMaster(handle);
    console.log("Master initialized");

    // Scan for devices
    const devices = iolink.scanMasterPorts(handle);
    if (devices.length === 0) {
      console.log("No devices found");
      iolink.disconnect(handle);
      return;
    }

    const device = devices[0];
    console.log(
      `Testing with device: ${device.deviceName} on port ${device.port}`
    );

    // Test regular read first
    console.log("\n--- Regular Read Test ---");
    const regularData = iolink.readProcessData(handle, device.port);
    console.log(`Regular read: ${regularData.data.toString("hex")}`);

    // Test native streaming
    console.log("\n--- Native Streaming Test ---");

    const samplingRate = 500; // 500 Hz
    const bufferSize = 4096; // 4KB buffer
    const testDuration = 2000; // 2 seconds

    console.log(
      `Starting native streaming: ${samplingRate} Hz, ${bufferSize} byte buffer`
    );

    // Start streaming
    iolink.startNativeStreaming(handle, device.port, samplingRate, bufferSize);

    let totalSamples = 0;
    let readCount = 0;
    const startTime = Date.now();

    // Read data multiple times
    const readInterval = setInterval(() => {
      try {
        const result = iolink.readNativeLoggingBuffer(
          handle,
          device.port,
          bufferSize
        );

        if (result.bytesRead > 0) {
          readCount++;
          totalSamples += result.samples.length;

          console.log(
            `Read ${readCount}: ${result.samples.length} samples, ${result.bytesRead} bytes`
          );

          // Show sample data
          if (result.samples.length > 0) {
            const sample = result.samples[0];
            console.log(`  Sample data: ${sample.inputData.toString("hex")}`);
          }
        } else {
          console.log(`Read ${readCount + 1}: No new data`);
        }
      } catch (error) {
        console.error(`Read error: ${error.message}`);
      }
    }, 100); // Read every 100ms

    // Stop after test duration
    setTimeout(() => {
      clearInterval(readInterval);

      try {
        iolink.stopNativeStreaming(handle, device.port);
        console.log("Streaming stopped");
      } catch (error) {
        console.log(`Stop warning: ${error.message}`);
      }

      const totalTime = (Date.now() - startTime) / 1000;
      const effectiveRate = totalSamples / totalTime;

      console.log(`\n--- Results ---`);
      console.log(`Total samples: ${totalSamples}`);
      console.log(`Total time: ${totalTime.toFixed(1)}s`);
      console.log(`Effective rate: ${effectiveRate.toFixed(1)} Hz`);
      console.log(`Buffer reads: ${readCount}`);

      // Cleanup
      iolink.disconnect(handle);
      console.log("Test completed");
    }, testDuration);
  } catch (error) {
    console.error("Test failed:", error.message);
  }
}

testNativeStreaming();
