// Main appplication file: entry point (step 4 from the previous response). It uses the module from iolink-interface.js to run the example.

const iolink = require("./iolink-interface");

async function main() {
  try {
    const devices = iolink.discoverDevices();
    console.log("Found devices:", devices);
    if (devices.length === 0) {
      console.log("No IO-Link devices found. Please check if:");
      console.log("1. The TMG IO-Link Master is physically connected via USB");
      console.log("2. The device drivers are properly installed");
      console.log("3. The device is not in use by another application");
      return;
    }

    const handle = iolink.connect(devices[0].name);
    console.log("Connected to device:", devices[0].name);

    const port = 0;
    const processData = iolink.readProcessData(handle, port);
    console.log("Process Data:", processData.data);

    const dataToWrite = Buffer.from([0x01, 0x02, 0x03, 0x04]);
    iolink.writeProcessData(handle, port, dataToWrite);
    console.log("Data written successfully");

    console.log("Starting data stream...");
    const stopStreaming = iolink.streamData(handle, port, 100, (err, data) => {
      if (err) {
        console.error("Stream error:", err);
        return;
      }
      console.log("Received data:", data.data);
    });

    setTimeout(() => {
      stopStreaming();
      console.log("Stopped streaming");
      iolink.disconnect(handle);
      console.log("Disconnected");
    }, 10000);
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
