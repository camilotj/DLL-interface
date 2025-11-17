const io = require("socket.io-client");

// Server configuration
const SERVER_URL = "ws://localhost:3000";
const HTTP_BASE_URL = "http://localhost:3000/api/v1";
const API_KEY = "dev-api-key-12345";
const USER_ROLE = "admin";

// Configuration
const SUBSCRIPTION_INTERVAL = 1000; // 1 second
const WORKFLOW_DELAY = 2000; // Delay between workflow steps

// State tracking
let discoveredMasters = [];
let connectedMaster = null;
let discoveredDevices = [];
let currentSubscriptions = [];

console.log("=== Complete IO-Link Backend Test Client ===");
console.log(`HTTP API: ${HTTP_BASE_URL}`);
console.log(`WebSocket: ${SERVER_URL}`);

// HTTP request helper with authentication using fetch
async function httpRequest(method, endpoint, data = null) {
  try {
    const options = {
      method,
      headers: {
        "X-API-Key": API_KEY,
        "X-User-Role": USER_ROLE,
        "Content-Type": "application/json",
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${HTTP_BASE_URL}${endpoint}`, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`HTTP ${method} ${endpoint} failed:`, error.message);
    throw error;
  }
}

// Workflow step functions
async function step1_discoverMasters() {
  console.log("\nStep 1: Discovering IO-Link Masters...");
  try {
    const response = await httpRequest("GET", "/masters");
    const masters = response.data || [];
    discoveredMasters = masters;
    console.log(`Found ${masters.length} master(s):`);
    masters.forEach((master, idx) => {
      console.log(`   ${idx + 1}. Name: ${master.name}`);
      console.log(`      Product Code: ${master.productCode}`);
      console.log(`      View Name: ${master.viewName}`);
      console.log(`      Index: ${master.index}`);
    });
    return masters.length > 0;
  } catch (error) {
    console.error("Failed to discover masters");
    return false;
  }
}

async function step2_connectMaster() {
  if (discoveredMasters.length === 0) {
    console.log("No masters available to connect");
    return false;
  }

  const firstMaster = discoveredMasters[0];
  console.log(`\nStep 2: Connecting to Master ${firstMaster.name}...`);

  try {
    const response = await httpRequest("POST", "/masters/connect", {
      deviceName: firstMaster.name,
    });

    connectedMaster = response.data;
    console.log(`Connected to master:`);
    console.log(`   Handle: ${connectedMaster.handle}`);
    console.log(`   Device Name: ${connectedMaster.deviceName}`);
    console.log(`   Connected At: ${connectedMaster.connectedAt}`);
    return true;
  } catch (error) {
    console.error("Failed to connect to master");
    return false;
  }
}

async function step3_discoverDevices() {
  console.log("\nStep 3: Discovering connected sensors/devices...");
  try {
    const response = await httpRequest("GET", "/devices");
    const devices = response.data || [];
    discoveredDevices = devices;

    console.log(` Found ${devices.length} device(s):`);
    devices.forEach((device, idx) => {
      console.log(`   ${idx + 1}. Port: ${device.port}`);
      console.log(
        `      Vendor: ${device.vendorName} (ID: ${device.vendorId})`
      );
      console.log(
        `      Device: ${device.deviceName} (ID: ${device.deviceId})`
      );
      console.log(`      Connected: ${device.connected}`);
      console.log(`      State: ${device.connectionState}`);
      console.log(
        `      Process Data In: ${device.processDataInputLength} bytes`
      );
      console.log(
        `      Process Data Out: ${device.processDataOutputLength} bytes`
      );
      console.log(`      Last Seen: ${device.lastSeen}`);
    });

    return devices.length > 0;
  } catch (error) {
    console.error("Failed to discover devices");
    return false;
  }
}

async function step4_testProcessData() {
  if (discoveredDevices.length === 0) {
    console.log("No devices available for process data testing");
    return false;
  }

  const firstDevice = discoveredDevices[0];
  console.log(`\nStep 4: Testing process data from device...`);
  console.log(
    `   Master Handle: ${connectedMaster.handle}, Port: ${firstDevice.port}`
  );

  try {
    const response = await httpRequest(
      "GET",
      `/data/${connectedMaster.handle}/${firstDevice.port}/process`
    );

    console.log(`Process data received:`);
    console.log(`   Response:`, response);

    return true;
  } catch (error) {
    console.error("Failed to read process data");
    return false;
  }
}

async function step5_setupWebSocketSubscription() {
  if (discoveredDevices.length === 0) {
    console.log("No devices available for WebSocket subscription");
    return false;
  }

  const firstDevice = discoveredDevices[0];
  console.log(`\nStep 5: Setting up WebSocket subscription...`);
  console.log(
    `   Master Handle: ${connectedMaster.handle}, Device Port: ${firstDevice.port}`
  );
  console.log(`   Interval: ${SUBSCRIPTION_INTERVAL}ms`);

  socket.emit("subscribe:process-data", {
    masterHandle: connectedMaster.handle,
    deviceId: firstDevice.port, // Using port as device ID
    interval: SUBSCRIPTION_INTERVAL,
  });

  return true;
}

// Execute the complete workflow
async function runCompleteWorkflow() {
  console.log("\nStarting complete IO-Link workflow...");

  try {
    // Step 1: Discover Masters
    const mastersFound = await step1_discoverMasters();
    if (!mastersFound) {
      console.log("Workflow stopped: No masters found");
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, WORKFLOW_DELAY));

    // Step 2: Connect to Master
    const masterConnected = await step2_connectMaster();
    if (!masterConnected) {
      console.log("Workflow stopped: Master connection failed");
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, WORKFLOW_DELAY));

    // Step 3: Discover Devices
    const devicesFound = await step3_discoverDevices();
    if (!devicesFound) {
      console.log("Workflow stopped: No devices found");
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, WORKFLOW_DELAY));

    // Step 4: Test Process Data
    const processDataWorking = await step4_testProcessData();
    if (!processDataWorking) {
      console.log("Process data test failed, but continuing...");
    }
    await new Promise((resolve) => setTimeout(resolve, WORKFLOW_DELAY));

    // Step 5: Setup WebSocket Subscription
    if (socket.connected) {
      await step5_setupWebSocketSubscription();
    } else {
      console.log("WebSocket not connected, skipping subscription");
    }

    console.log("\nComplete workflow finished successfully!");
    console.log(
      "WebSocket subscription active - waiting for real-time data...\n"
    );
  } catch (error) {
    console.error("Workflow failed:", error.message);
  }
}

// Connect to WebSocket server with authentication
const socket = io(SERVER_URL, {
  auth: {
    "X-API-Key": API_KEY,
    "X-User-Role": USER_ROLE,
  },
  extraHeaders: {
    "X-API-Key": API_KEY,
    "X-User-Role": USER_ROLE,
  },
});

// WebSocket Connection handlers
socket.on("connect", () => {
  console.log(`WebSocket connected with socket ID: ${socket.id}`);

  // Start the complete workflow after WebSocket connection
  setTimeout(() => {
    runCompleteWorkflow();
  }, 1000);
});

socket.on("connected", (data) => {
  console.log("Server confirmed WebSocket connection:", data);
});

socket.on("disconnect", (reason) => {
  console.log(`WebSocket disconnected: ${reason}`);
});

socket.on("connect_error", (error) => {
  console.error("WebSocket connection error:", error);
});

// WebSocket Subscription handlers
socket.on("subscribed", (info) => {
  console.log("WebSocket subscription confirmed:", info);
  console.log("Waiting for real-time process data...\n");
});

socket.on("process-data:value", (data) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Real-time Process Data:`);
  console.log(`   Raw Data: ${data.dataHex || "N/A"}`);
  console.log(`   Length: ${data.length || 0} bytes`);
  console.log(`   Status: 0x${data.status ? data.status.toString(16) : "00"}`);
  console.log(
    `   Device: ${data.deviceKey || `${data.masterHandle}:${data.deviceId}`}`
  );
  if (data.timestamp) {
    console.log(`   Server Timestamp: ${data.timestamp}`);
  }
  console.log("");
});

socket.on("process-data:error", (error) => {
  console.error("Real-time Process Data Error:", error);
});

socket.on("unsubscribed", (info) => {
  console.log("Unsubscribed from:", info);
});

socket.on("subscriptions", (subscriptions) => {
  console.log("Current WebSocket subscriptions:", subscriptions);
  currentSubscriptions = subscriptions;
});

// Graceful shutdown
let running = true;

function shutdown() {
  if (!running) return;
  running = false;

  console.log("\nShutting down complete test client...");

  // Unsubscribe from all streams
  if (socket.connected) {
    socket.emit("unsubscribe:all");
  }

  setTimeout(() => {
    socket.disconnect();
    console.log("Goodbye!");
    process.exit(0);
  }, 1000);
}

// Handle Ctrl+C
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log("Press Ctrl+C to exit...");
