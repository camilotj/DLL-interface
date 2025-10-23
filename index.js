const { TMGIOLinkInterface, RETURN_CODES, BLOB_RETURN_CODES, PORT_MODES } = require('./tmg-iolink-interface');

async function demonstrateTMGInterface() {
    const tmgInterface = new TMGIOLinkInterface();
    
    try {
        console.log('=== TMG IO-Link Interface Demo ===\n');

        // Step 1: Initialize the DLL interface
        console.log('1. Initializing TMG IO-Link interface...');
        tmgInterface.initialize();
        console.log('✅ Interface initialized\n');

        // Step 2: Get available USB devices
        console.log('2. Scanning for USB devices...');
        try {
            const devices = tmgInterface.getUSBDevices();
            console.log(`Found ${devices.length} USB devices:`);
            devices.forEach((device, index) => {
                console.log(`  [${index}] ${device.name} - ${device.viewName} (${device.productCode})`);
            });
            console.log();
        } catch (error) {
            console.log('⚠️  Could not scan USB devices (this is normal if no TMG device is connected)');
            console.log(`   Error: ${error.message}\n`);
        }

        // Step 3: Connect to device (you'll need to adjust the device name)
        console.log('3. Connecting to device...');
        const deviceName = "COM3"; // Adjust this to your actual device
        
        try {
            const handle = tmgInterface.connect(deviceName);
            console.log(`✅ Connected with handle: ${handle}\n`);

            // Step 4: BLOB Operations Demo
            console.log('4. BLOB Operations Demo');
            const port = 1;        // Port number (adjust as needed)
            const blobId = 0x01;   // BLOB ID (adjust as needed)

            // Write BLOB example
            console.log('4.1 Writing BLOB data...');
            const dataToSend = Buffer.from('Hello TMG Device!', 'utf-8');
            try {
                const writeResult = tmgInterface.writeBlob(port, blobId, dataToSend);
                console.log('✅ BLOB write successful');
                console.log(`   Status: ${JSON.stringify(writeResult.status)}\n`);
            } catch (error) {
                console.log(`⚠️  BLOB write failed: ${error.message}\n`);
            }

            // Read BLOB example
            console.log('4.2 Reading BLOB data...');
            try {
                const readResult = tmgInterface.readBlob(port, blobId, 1024);
                console.log('✅ BLOB read successful');
                console.log(`   Bytes read: ${readResult.bytesRead}`);
                console.log(`   Data: ${readResult.data.toString()}`);
                console.log(`   Status: ${JSON.stringify(readResult.status)}\n`);
            } catch (error) {
                console.log(`⚠️  BLOB read failed: ${error.message}\n`);
            }

            // Step 5: Process Data Demo
            console.log('5. Process Data Demo');
            
            // Read process data
            console.log('5.1 Reading process data...');
            try {
                const processData = tmgInterface.readProcessData(port);
                console.log('✅ Process data read successful');
                console.log(`   Length: ${processData.length} bytes`);
                console.log(`   Data: ${processData.data.toString('hex')}`);
                console.log(`   Status: 0x${processData.status.toString(16)}\n`);
            } catch (error) {
                console.log(`⚠️  Process data read failed: ${error.message}\n`);
            }

            // Write process data
            console.log('5.2 Writing process data...');
            const processDataToWrite = Buffer.from([0x01, 0x02, 0x03, 0x04]);
            try {
                tmgInterface.writeProcessData(port, processDataToWrite);
                console.log('✅ Process data write successful\n');
            } catch (error) {
                console.log(`⚠️  Process data write failed: ${error.message}\n`);
            }

            // Step 6: Streaming Demo
            console.log('6. Streaming Demo');
            console.log('6.1 Starting BLOB data streaming (5 seconds)...');
            
            let dataCount = 0;
            const stream = tmgInterface.startStreaming(port, blobId, 1000, (streamData) => {
                if (streamData.error) {
                    console.log(`   Stream error: ${streamData.error}`);
                } else {
                    dataCount++;
                    console.log(`   [${dataCount}] Received ${streamData.bytesRead} bytes at ${streamData.timestamp.toISOString()}`);
                    if (streamData.bytesRead > 0) {
                        console.log(`       Data: ${streamData.data.toString('hex')}`);
                    }
                }
            });

            // Run streaming for 5 seconds
            setTimeout(() => {
                stream.stop();
                console.log(`✅ Streaming completed. Received ${dataCount} data packets\n`);
            }, 5000);

            // Wait for streaming to complete
            await new Promise(resolve => setTimeout(resolve, 6000));

        } catch (connectionError) {
            console.log(`⚠️  Could not connect to device ${deviceName}`);
            console.log(`   Error: ${connectionError.message}`);
            console.log('   This is normal if the device is not connected or the COM port is different\n');
        }

    } catch (error) {
        console.error('❌ Demo failed:', error.message);
    } finally {
        // Step 7: Cleanup
        console.log('7. Cleaning up...');
        tmgInterface.cleanup();
        console.log('✅ Cleanup completed');
    }
}

// Additional utility functions for advanced usage
function advancedUsageExample() {
    console.log('\n=== Advanced Usage Examples ===\n');

    const tmgInterface = new TMGIOLinkInterface();
    
    // Example: Custom error handling
    console.log('Example: Custom error handling wrapper');
    const safeExecute = async (operation, description) => {
        try {
            console.log(`Executing: ${description}`);
            const result = await operation();
            console.log(`✅ ${description} successful`);
            return result;
        } catch (error) {
            console.log(`❌ ${description} failed: ${error.message}`);
            return null;
        }
    };

    // Example: Data validation
    console.log('\nExample: Data validation for BLOB operations');
    const validateBlobData = (data, maxSize = 1024) => {
        if (!Buffer.isBuffer(data)) {
            throw new Error('Data must be a Buffer');
        }
        if (data.length === 0) {
            throw new Error('Data cannot be empty');
        }
        if (data.length > maxSize) {
            throw new Error(`Data size ${data.length} exceeds maximum ${maxSize}`);
        }
        return true;
    };

    // Example: Retry mechanism
    console.log('\nExample: Retry mechanism for unreliable operations');
    const retryOperation = async (operation, maxRetries = 3, delayMs = 1000) => {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await operation();
            } catch (error) {
                console.log(`Attempt ${i + 1} failed: ${error.message}`);
                if (i === maxRetries - 1) {
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    };

    console.log('\n✅ Advanced examples shown above can be integrated into your application');
}

// Configuration and installation instructions
function showSetupInstructions() {
    console.log('\n=== Setup Instructions ===\n');
    
    console.log('1. Install Node.js dependencies:');
    console.log('   If npm install failed due to native compilation issues, try:');
    console.log('   - Install Visual Studio Build Tools');
    console.log('   - Set npm config: npm config set msvs_version 2019');
    console.log('   - Or try: npm install --build-from-source');
    console.log('   - Alternative: npm install node-gyp -g');
    console.log();
    
    console.log('2. TMG DLL Setup:');
    console.log('   - Ensure TMGIOLUSBIF20.dll is in the correct path');
    console.log('   - Default path: ./TMG_USB_IO-Link_Interface_V2_DLL_V2.31/Binaries/');
    console.log('   - Or provide custom path in initialize() method');
    console.log();
    
    console.log('3. Device Connection:');
    console.log('   - Install TMG USB drivers from the Driver/ folder');
    console.log('   - Connect TMG IO-Link USB Master device');
    console.log('   - Check Windows Device Manager for COM port number');
    console.log('   - Update deviceName variable in example (e.g., "COM3")');
    console.log();
    
    console.log('4. Port and BLOB Configuration:');
    console.log('   - Adjust port number (typically 1-4 depending on device)');
    console.log('   - Set correct BLOB ID based on your device documentation');
    console.log('   - Configure port settings if needed using SetPortConfig');
    console.log();
}

// Main execution
if (require.main === module) {
    showSetupInstructions();
    demonstrateTMGInterface()
        .then(() => {
            advancedUsageExample();
            console.log('\n🎉 Demo completed successfully!');
            console.log('Modify the device name, port, and BLOB ID as needed for your setup.');
        })
        .catch((error) => {
            console.error('Demo failed:', error);
        });
}

module.exports = {
    demonstrateTMGInterface,
    advancedUsageExample,
    showSetupInstructions
};