const iolink = require("./iolink-interface");

async function main() {
  try {
    console.log("Starting IO-Link Discovery...\n");

    // Use the new enhanced discovery function
    const topology = await iolink.discoverAllDevices();

    if (topology.masters.length === 0) {
      console.log("No IO-Link Masters found");

      return;
    }

    // Display the complete topology
    console.log("\n === IO-Link Network Topology ===");
    topology.masters.forEach((master, masterIndex) => {
      console.log(`\n IO-Link Master ${masterIndex + 1}: ${master.name}`);
      console.log(`   Product: ${master.productCode}`);
      console.log(`   Handle: ${master.handle}`);
      console.log(
        `   Connected IO-Link Devices/Sensors: ${master.totalDevices}`
      );

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

    // Work with the first available IO-Link Device/Sensor
    const firstMasterWithDevices = topology.masters.find(
      (master) => master.connectedDevices.length > 0
    );

    if (
      firstMasterWithDevices &&
      firstMasterWithDevices.connectedDevices.length > 0
    ) {
      const device = firstMasterWithDevices.connectedDevices[0];
      const handle = firstMasterWithDevices.handle;

      console.log(
        `\n Testing operations with IO-Link Device/Sensor on port ${device.port}...`
      );

      try {
        // Read process data from the specific IO-Link Device/Sensor
        const processData = iolink.readDeviceProcessData(handle, device.port);
        console.log(
          ` Process Data from port ${device.port}:`,
          processData.data.toString("hex")
        );

        // Try to write process data if device supports output
        if (device.processDataOutputLength > 0) {
          const dataToWrite = Buffer.from([0x01, 0x02, 0x03, 0x04]);
          iolink.writeDeviceProcessData(handle, device.port, dataToWrite);
          console.log(
            ` Data written to IO-Link Device/Sensor on port ${device.port}`
          );
        } else {
          console.log(
            `  IO-Link Device/Sensor on port ${device.port} has no output data`
          );
        }

        // Try to read a device parameter (Device Name - Index 18)
        try {
          const deviceNameParam = iolink.readDeviceParameter(
            handle,
            device.port,
            18
          );
          const deviceName = deviceNameParam.data
            .toString("ascii")
            .replace(/\0/g, "")
            .trim();
          console.log(` Device Name from parameter: "${deviceName}"`);
        } catch (paramError) {
          console.log(
            `  Could not read device name parameter:`,
            paramError.message
          );
        }
        /*
        // Start streaming data from the specific IO-Link Device/Sensor
        console.log(
          `\n Starting data stream from IO-Link Device/Sensor on port ${device.port}...`
        );
                const stopStreaming = iolink.streamDeviceData(
          handle,
          device.port,
          1000,
          (err, data) => {
            if (err) {
              console.error(" Stream error:", err.message);
              return;
            }
            console.log(
              ` [Port ${data.port}] ${
                data.deviceInfo?.vendorName
              }: ${data.data.data.toString(
                "hex"
              )} (${data.timestamp.toISOString()})`
            );
          }
        ); */

        // Stop streaming after 10 seconds
        /*     setTimeout(() => {
          stopStreaming();
          console.log("\n  Stopped streaming");

          // Cleanup - disconnect from all IO-Link Masters
          iolink.disconnectAllMasters(topology);
          console.log("Disconnected from all IO-Link Masters");
          console.log("\n Demo completed successfully!");
        }, 10000); */
      } catch (deviceError) {
        console.error(
          ` Error working with IO-Link Device/Sensor on port ${device.port}:`,
          deviceError.message
        );
        iolink.disconnectAllMasters(topology);
      }
    } else {
      console.log(
        "\n  No IO-Link Devices/Sensors found connected to any IO-Link Master"
      );
      console.log(
        "Please connect IO-Link Devices/Sensors to the IO-Link Master ports and try again."
      );
      iolink.disconnectAllMasters(topology);
    }
  } catch (err) {
    console.error(" Fatal Error:", err.message);
    console.error("Stack:", err.stack);
  }
}

main();
