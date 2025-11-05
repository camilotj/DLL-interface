import { IOLinkInterface } from './iolink-interface';
import { SENSOR_STATUS } from './types';

interface Device {
  port: number;
  vendorName: string;
  deviceName: string;
  vendorId: string;
  deviceId: string;
  serialNumber: string;
  processDataInputLength: number;
  processDataOutputLength: number;
  status: {
    mode: string;
  };
}

interface Master {
  name: string;
  viewName: string;
  handle: number;
  totalDevices: number;
  connectedDevices: Device[];
}

interface Topology {
  masters: Master[];
}

async function main(): Promise<void> {
  try {
    console.log("Starting IO-Link Discovery...\n");

    const iolink = new IOLinkInterface();
    const topology = await discoverAllDevices(iolink);

    // Add a delay to ensure proper cleanup before exit
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (topology.masters.length === 0) {
      console.log("No IO-Link Masters found");
      return;
    }

    // Display network topology
    displayTopology(topology);

    // Test operations if devices are found
    const firstMasterWithDevices = topology.masters.find(
      (master) => master.connectedDevices.length > 0
    );

    if (firstMasterWithDevices && firstMasterWithDevices.connectedDevices.length > 0) {
      await testDeviceOperations(firstMasterWithDevices);
    } else {
      console.log("\n  No IO-Link Devices/Sensors found connected to any IO-Link Master");
      console.log("Please connect IO-Link Devices/Sensors to the IO-Link Master ports and try again.");
    }

    // Cleanup
    disconnectAllMasters(topology);
    console.log("\nDemo completed successfully!");
  } catch (err) {
    if (err instanceof Error) {
      console.error(" Fatal Error:", err.message);
      console.error("Stack:", err.stack);
    } else {
      console.error(" Fatal Error:", err);
    }
  }
}

async function discoverAllDevices(iolink: IOLinkInterface): Promise<Topology> {
  const devices = iolink.getConnectedDevices();
  const masters: Master[] = [];

  for (const deviceName of devices) {
    try {
      await iolink.connect(deviceName);
      const master: Master = {
        name: deviceName,
        viewName: deviceName,
        handle: iolink.getHandle(),
        totalDevices: 0,
        connectedDevices: []
      };

      console.log('Checking port 1 for connected devices...');
      // Only scan the first 2 ports as per the JS version
      for (let port = 0; port < 2; port++) {
        try {
          console.log(`Checking port ${port + 1} for connected devices...`);
          
          // Get current port mode
          const mode = iolink.getPortMode(port);
          console.log(`Port ${port + 1}: ${getModeString(mode.mode)}`);

          // Check if device is connected
          const status = iolink.getSensorStatus(port);
          const isConnected = (status & SENSOR_STATUS.BIT_CONNECTED) !== 0;
          
          if (isConnected) {
            const config = iolink.getPortConfig(port);
            
            // Try to read device information
            const deviceName = iolink.readDeviceName(port) || 'Unknown Device';
            const vendorName = iolink.readVendorName(port) || 'Unknown Vendor';
            const serialNumber = iolink.readSerialNumber(port) || '';
            
            const device: Device = {
              port: port + 1, // Convert to 1-based for display
              vendorName,
              deviceName,
              vendorId: Buffer.from(config.VendorID).toString('hex'),
              deviceId: Buffer.from(config.DeviceID).toString('hex'),
              serialNumber,
              processDataInputLength: config.InputLength,
              processDataOutputLength: config.OutputLength,
              status: {
                mode: getModeString(mode.mode)
              }
            };

            console.log(`Port ${port + 1}: Found ${device.vendorName} ${device.deviceName}`);
            master.connectedDevices.push(device);
          } else {
            console.log(`Port ${port + 1}: No device connected`);
          }
        } catch (err) {
          console.log(`Port ${port + 1}: UNKNOWN (connected: false)`);
        }
      }

      master.totalDevices = master.connectedDevices.length;
      masters.push(master);
    } catch (err) {
      console.warn(`Warning: Error connecting to master ${deviceName}:`, err);
    }
  }

  return { masters };
}

function getModeString(mode: number): string {
  switch (mode) {
    case 0: return 'RESET';
    case 1: return 'PREOPERATE';
    case 3: return 'SIO INPUT';
    case 4: return 'SIO OUTPUT';
    case 12: return 'IO-LINK OPERATE';
    default: return `UNKNOWN (${mode})`;
  }
}

function displayTopology(topology: Topology): void {
  console.log("\n === IO-Link Network Topology ===");

  topology.masters.forEach((master, masterIndex) => {
    console.log(`\n IO-Link Master ${masterIndex + 1}: ${master.name}`);
    console.log(`   Product: ${master.viewName}`);
    console.log(`   Handle: ${master.handle}`);
    console.log(`   Connected IO-Link Devices/Sensors: ${master.totalDevices}`);

    if (master.connectedDevices.length > 0) {
      master.connectedDevices.forEach((device) => {
        console.log(`    Port ${device.port}: ${device.vendorName} ${device.deviceName}`);
        console.log(`      Vendor ID: ${device.vendorId}, Device ID: ${device.deviceId}`);
        console.log(`      Serial: ${device.serialNumber}`);
        console.log(`      Process Data: ${device.processDataInputLength}/${device.processDataOutputLength} bytes`);
        console.log(`      Status: ${device.status.mode}`);
      });
    } else {
      console.log("   (No IO-Link Devices/Sensors connected)");
    }
  });
}

async function testDeviceOperations(master: Master): Promise<void> {
  const device = master.connectedDevices[0];
  const handle = master.handle;

  console.log(`\n=== Testing IO-Link Device Operations ===`);
  console.log(`Device: ${device.vendorName} ${device.deviceName} on Port ${device.port}`);

  try {
    // Test 1: Process Data Reading
    console.log(`\n1. Reading Process Data...`);
    await testProcessDataReading(handle, device);
  } catch (err) {
    console.error('Error during device operations:', err);
  }
}

async function testProcessDataReading(handle: number, device: Device): Promise<void> {
  // Implementation of process data reading test
  // This would need to be implemented based on your specific requirements
}

function disconnectAllMasters(topology: Topology): void {
  topology.masters.forEach(master => {
    try {
      const iolink = new IOLinkInterface();
      iolink.disconnect();
    } catch (err) {
      console.warn(`Warning: Error disconnecting master ${master.name}:`, err);
    }
  });
}

// Run the main function
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});