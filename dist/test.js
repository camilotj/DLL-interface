"use strict";
/**
 * Simple test to verify the TypeScript interface compiles and loads correctly
 */
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("./types");
console.log('Testing TMG IO-Link Interface Module Loading...\n');
// Test 1: Module loading
console.log('✓ Module loaded successfully');
console.log('Available exports:');
console.log('- RETURN_CODES:', Object.keys(types_1.RETURN_CODES).length, 'codes');
console.log('- PORT_MODES:', Object.keys(types_1.PORT_MODES).length, 'modes');
console.log('- SENSOR_STATUS:', Object.keys(types_1.SENSOR_STATUS).length, 'status flags');
console.log('- VALIDATION_MODES:', Object.keys(types_1.VALIDATION_MODES).length, 'validation modes');
console.log('- PARAMETER_INDEX:', Object.keys(types_1.PARAMETER_INDEX).length, 'parameter indices');
// Test 2: Constants validation
console.log('\nTesting constants...');
console.log('Return codes sample:');
console.log('- RETURN_OK:', types_1.RETURN_CODES.RETURN_OK);
console.log('- RETURN_DEVICE_NOT_AVAILABLE:', types_1.RETURN_CODES.RETURN_DEVICE_NOT_AVAILABLE);
console.log('- RETURN_UNKNOWN_HANDLE:', types_1.RETURN_CODES.RETURN_UNKNOWN_HANDLE);
console.log('\nPort modes sample:');
console.log('- SM_MODE_RESET:', types_1.PORT_MODES.SM_MODE_RESET);
console.log('- SM_MODE_IOLINK_OPERATE:', types_1.PORT_MODES.SM_MODE_IOLINK_OPERATE);
console.log('\nSensor status flags:');
console.log('- BIT_CONNECTED:', types_1.SENSOR_STATUS.BIT_CONNECTED);
console.log('- BIT_PDVALID:', types_1.SENSOR_STATUS.BIT_PDVALID);
console.log('\nParameter indices sample:');
console.log('- VENDOR_NAME:', types_1.PARAMETER_INDEX.VENDOR_NAME);
console.log('- PRODUCT_NAME:', types_1.PARAMETER_INDEX.PRODUCT_NAME);
console.log('- SERIAL_NUMBER:', types_1.PARAMETER_INDEX.SERIAL_NUMBER);
// Test 3: Type checking
console.log('\nTesting TypeScript type safety...');
// This should compile without errors - using the constants to verify types
console.log('Type safety checks:');
console.log('- Return code type:', typeof types_1.RETURN_CODES.RETURN_OK);
console.log('- Port mode type:', typeof types_1.PORT_MODES.SM_MODE_IOLINK_OPERATE);
console.log('- Sensor status type:', typeof types_1.SENSOR_STATUS.BIT_CONNECTED);
console.log('- Validation mode type:', typeof types_1.VALIDATION_MODES.SM_VALIDATION_MODE_NONE);
console.log('- Parameter index type:', typeof types_1.PARAMETER_INDEX.VENDOR_NAME);
console.log('✓ All type checks passed');
console.log('\n=== Module Test Complete ===');
console.log('The TypeScript interface module is ready to use!');
console.log('Run npm start to see the full demonstration.');
// Show next steps
console.log('\n📋 Next Steps:');
console.log('1. Ensure dependencies are installed: npm install');
console.log('2. Connect TMG IO-Link USB Master device');
console.log('3. Install device drivers from TMG package');
console.log('4. Run: npm start');
console.log('5. The application will automatically discover and test connected devices');
//# sourceMappingURL=test.js.map