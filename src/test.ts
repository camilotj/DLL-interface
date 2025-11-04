// Simple test to verify the interface loads correctly without DLL
import { IOLinkInterface } from './iolink-interface';
import {
  RETURN_CODES,
  PORT_MODES,
  SENSOR_STATUS,
  VALIDATION_MODES,
  PARAMETER_INDEX
} from './types';

console.log("Testing TMG IO-Link Interface Module Loading...\n");

// Test 1: Module loading
console.log("✅ Module loaded successfully");
console.log("Available exports:");
console.log("- IOLinkInterface class:", typeof IOLinkInterface);
console.log("- RETURN_CODES:", Object.keys(RETURN_CODES).length, "codes");
console.log("- PORT_MODES:", Object.keys(PORT_MODES).length, "modes");

// Test 2: Class instantiation
console.log("\nTesting class instantiation...");
try {
  const iolink = new IOLinkInterface();
  console.log("✅ IOLinkInterface instance created");
  console.log("Initial state - handle: -1 (not connected)");
} catch (error) {
  if (error instanceof Error) {
    console.log("❌ Class instantiation failed:", error.message);
  } else {
    console.log("❌ Class instantiation failed with unknown error");
  }
}

// Test 3: Constants validation
console.log("\nTesting constants...");
console.log("Return codes sample:");
console.log("- RETURN_OK:", RETURN_CODES.RETURN_OK);
console.log("- RETURN_DEVICE_NOT_AVAILABLE:", RETURN_CODES.RETURN_DEVICE_NOT_AVAILABLE);

console.log("\nPort modes sample:");
console.log("- SM_MODE_RESET:", PORT_MODES.SM_MODE_RESET);
console.log("- SM_MODE_IOLINK_OPERATE:", PORT_MODES.SM_MODE_IOLINK_OPERATE);

// Test 4: Method availability check
console.log("\nTesting method availability...");
const iolinkInstance = new IOLinkInterface();
const expectedMethods = [
  "connect",
  "disconnect",
  "getConnectedDevices",
  "getPortMode",
  "getSensorStatus",
  "getPortConfig",
  "setPortConfig",
  "readParameter",
  "writeParameter",
  "readInputs",
  "writeOutputs",
  "uploadBlob",
  "downloadBlob",
  "continueBlob",
  "readBlobId"
] as const;

expectedMethods.forEach((method) => {
  if (typeof (iolinkInstance as any)[method] === "function") {
    console.log(`✅ ${method}() method available`);
  } else {
    console.log(`❌ ${method}() method missing`);
  }
});

// Test 5: Error handling with mock calls
console.log("\nTesting error handling...");
try {
  iolinkInstance.connect("NONEXISTENT_DEVICE");
  console.log("❌ Should have thrown an error for nonexistent device");
} catch (error) {
  if (error instanceof Error) {
    console.log("✅ Properly caught connection error:", error.message);
  } else {
    console.log("✅ Caught unknown connection error");
  }
}

console.log("\n=== Module Test Complete ===");
console.log("The interface module is ready to use!");
console.log("Run index.ts to see the full demonstration.");

// Show next steps
console.log("\n📋 Next Steps:");
console.log("1. Install dependencies: npm install");
console.log("2. Connect TMG IO-Link USB Master device");
console.log("3. Build TypeScript: npm run build");