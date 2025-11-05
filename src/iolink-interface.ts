import { Buffer } from 'node:buffer';
import * as ffi from 'ffi-napi';
import * as ref from 'ref-napi';
import * as path from 'path';
import {
  type IBLOBStatus,
  type StructInstance,
  type TDeviceIdentificationData,
  BYTE,
  WORD,
  LONG,
  DWORD,
  TBLOBStatus,
  TDeviceIdentification,
  TInfoEx,
  TParameter,
  TPortConfiguration,
  RETURN_CODES,
  PORT_MODES,
  SENSOR_STATUS,
  VALIDATION_MODES,
  PARAMETER_INDEX
} from './types';

// DLL loading
const dllPath = path.join(__dirname, '..', 'TMG_USB_IO-Link_Interface_V2_DLL/Sample_x64/Sample_C/SimpleApplication/TMGIOLUSBIF20_64.dll');
console.log('Loading DLL from:', dllPath);

if (!require('fs').existsSync(dllPath)) {
  throw new Error(`DLL not found at path: ${dllPath}`);
}

let iolinkDll: any;
try {
  iolinkDll = ffi.Library(dllPath, {
    IOL_GetUSBDevices: [LONG, ['pointer', LONG]],
    IOL_Create: [LONG, [ref.types.CString]],
    IOL_Destroy: [LONG, [LONG]],
    IOL_GetModeEx: [LONG, [LONG, DWORD, 'pointer', 'bool']],
    IOL_GetSensorStatus: [LONG, [LONG, DWORD, 'pointer']],
    IOL_GetPortConfig: [LONG, [LONG, DWORD, 'pointer']],
    IOL_SetPortConfig: [LONG, [LONG, DWORD, 'pointer']],
    IOL_ReadReq: [LONG, [LONG, DWORD, 'pointer']],
    IOL_WriteReq: [LONG, [LONG, DWORD, 'pointer']],
    IOL_ReadInputs: [LONG, [LONG, DWORD, 'pointer', 'pointer', 'pointer']],
    IOL_WriteOutputs: [LONG, [LONG, DWORD, 'pointer', DWORD]],
    BLOB_uploadBLOB: [LONG, [LONG, DWORD, LONG, DWORD, 'pointer', 'pointer', 'pointer']],
    BLOB_downloadBLOB: [LONG, [LONG, DWORD, LONG, DWORD, 'pointer', 'pointer']],
    BLOB_Continue: [LONG, [LONG, DWORD, 'pointer']],
    BLOB_ReadBlobID: [LONG, [LONG, DWORD, 'pointer', 'pointer']],
  });
  console.log('DLL loaded successfully');
} catch (error) {
  console.error('Error loading DLL:', error);
  throw error;
}

function checkReturnCode(code: number, operation: string): void {
  if (code !== RETURN_CODES.RETURN_OK) {
    throw new Error(`${operation} failed with code ${code}`);
  }
}

function arrayToString(array: Buffer | number[]): string {
  try {
    const buf = Buffer.isBuffer(array) ? array : Buffer.from(array);
    let str = '';
    for (let i = 0; i < buf.length; i++) {
      if (buf[i] === 0) break;
      str += String.fromCharCode(buf[i]);
    }
    return str.trim();
  } catch (error) {
    console.error('Error converting array to string:', error);
    return '';
  }
}

export class IOLinkInterface {
  private handle: number = -1;

  constructor() {
    // Initialize
  }

  getHandle(): number {
    return this.handle;
  }

  async connect(portName: string): Promise<void> {
    if (this.handle !== -1) {
      throw new Error('Already connected to a device');
    }
    
    console.log('\n=== IO-Link Discovery ===');
    console.log('Searching for IO-Link Master devices...');
    console.log(`Attempting to connect to device: ${portName}`);
    
    const result = iolinkDll.IOL_Create(portName);
    console.log(`Connection result: ${result}`);
    
    if (result <= 0) {
      let errorMessage: string;
      switch(result) {
        case RETURN_CODES.RETURN_INTERNAL_ERROR: errorMessage = 'Internal error'; break;
        case RETURN_CODES.RETURN_DEVICE_NOT_AVAILABLE: 
          console.warn(`Warning: Device ${portName} not available`);
          return; // Just return without throwing
        case RETURN_CODES.RETURN_UNKNOWN_HANDLE: errorMessage = 'Unknown handle'; break;
        case -9: errorMessage = 'Device access error'; break;
        case RETURN_CODES.RETURN_WRONG_PARAMETER: errorMessage = 'Wrong parameter'; break;
        default: errorMessage = `Unknown error code ${result}`; break;
      }
      
      // Only throw for non-availability errors
      if (result !== RETURN_CODES.RETURN_DEVICE_NOT_AVAILABLE) {
        throw new Error(`Device connection failed: ${errorMessage} (code ${result})`);
      }
    }
    
    this.handle = result;
    console.log(`Connected to IO-Link Master: ${portName}`);
    
    console.log(`\n--- Initializing IO-Link Master: ${portName} ---`);
    console.log('Resetting master state...');

    await this.initializePorts();
    console.log(`Master ${portName} initialization complete`);

    // Start scanning for devices
    console.log('Scanning configured ports for connected devices...');
  }

  private async initializePorts(): Promise<void> {
    console.log('Configuring 2 ports for IO-Link operation...');

    // First reset all ports
    for (let port = 1; port <= 2; port++) {
      try {
        console.log(`Port ${port}: Checking current configuration state...`);
        
        // Get current port mode
        const currentInfo = new TInfoEx();
        const currentModeResult = iolinkDll.IOL_GetModeEx(
          this.handle,
          port - 1,  // Convert to 0-based for DLL
          currentInfo.ref(),
          false
        );

        if (currentModeResult === RETURN_CODES.RETURN_OK) {
          console.log(`Port ${port}: Current mode = ${currentInfo.ActualMode}, target mode = ${PORT_MODES.SM_MODE_IOLINK_OPERATE}`);

          // If already in the desired mode, skip reconfiguration
          if (currentInfo.ActualMode === PORT_MODES.SM_MODE_IOLINK_OPERATE) {
            console.log(`Port ${port}: Already in IO-Link operate mode, skipping reconfiguration`);
            continue;
          }

          // If in a transitional state, wait before reconfiguring
          if (currentInfo.ActualMode === PORT_MODES.SM_MODE_IOLINK_PREOP) {
            console.log(`Port ${port}: In preoperate mode, waiting before reconfiguration...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }

        // Get and check current config
        const currentConfig = new TPortConfiguration();
        const checkResult = iolinkDll.IOL_GetPortConfig(this.handle, port - 1, currentConfig.ref());
        if (checkResult === RETURN_CODES.RETURN_OK) {
          console.log(`Port ${port}: Current config - TargetMode=${currentConfig.TargetMode}, CRID=0x${currentConfig.CRID.toString(16)}`);
        }

        // Set new configuration
        const config = new TPortConfiguration();
        Object.assign(config, currentConfig);
        
        config.CRID = 0x11;
        config.TargetMode = PORT_MODES.SM_MODE_IOLINK_OPERATE;
        config.InspectionLevel = 0;

        console.log(`Port ${port}: Setting config - CRID=0x${config.CRID.toString(16)}, TargetMode=${config.TargetMode}, InspectionLevel=${config.InspectionLevel}`);
        const result = iolinkDll.IOL_SetPortConfig(this.handle, port - 1, config.ref());
        
        if (result === RETURN_CODES.RETURN_OK) {
          console.log(`Port ${port}: IOL_SetPortConfig result = ${result} (SUCCESS)`);
          console.log(`Port ${port}: Configured for IO-Link operation`);
        } else {
          console.error(`Port ${port}: IOL_SetPortConfig failed with result = ${result}`);
        }
      } catch (error) {
        console.error(`Error configuring port ${port}:`, error);
      }
    }

    // Wait for port stabilization
    console.log('Waiting for port stabilization (IO-Link timing requirements)...');
    console.log('Stabilization period: 5000ms');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('Additional device detection wait...');
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  disconnect(): void {
    if (this.handle === -1) {
      return;
    }

    for (let port = 0; port < 2; port++) {
      try {
        const config = this.getPortConfig(port);
        config.TargetMode = PORT_MODES.SM_MODE_RESET;
        config.CRID = 0;
        iolinkDll.IOL_SetPortConfig(this.handle, port, config.ref());
      } catch (error) {
        console.warn(`Warning: Failed to clear port ${port + 1} configuration:`, error);
      }
    }

    const result = iolinkDll.IOL_Destroy(this.handle);
    checkReturnCode(result, 'Device disconnection');
    this.handle = -1;
  }

  getConnectedDevices(): string[] {
    const maxDevices = 10;
    const devices: string[] = [];

    try {
      try {
        const devicesArray = [];
        const DeviceStruct = TDeviceIdentification;
        
        for (let i = 0; i < maxDevices; i++) {
          const device = new DeviceStruct();
          if (!device || !device.ref) {
            throw new Error('Failed to create device identification structure');
          }
          devicesArray.push(device);
        }

        const foundDevices = iolinkDll.IOL_GetUSBDevices(devicesArray[0].ref(), maxDevices);
        
        if (foundDevices > 0) {
          for (let i = 0; i < foundDevices; i++) {
            const deviceName = arrayToString(devicesArray[i].Name);
            if (deviceName) {
              devices.push(deviceName);
            }
          }
        }
        
        return devices;
      } catch (arrayError) {
        console.log('Array method failed, trying single device method...');
        
        const deviceStruct = require('./ffi-bindings').structs.DeviceIdentification;
        const device = new deviceStruct();
        if (!device || !device.ref) {
          throw new Error('Failed to create device identification structure');
        }

        const count = iolinkDll.IOL_GetUSBDevices(device.ref(), maxDevices);

        if (count > 0 && device && device.Name) {
          const name = arrayToString(device.Name);
          if (name) {
            devices.push(name);
          }
        }

        return devices;
      }
    } catch (error) {
      console.error('Error in getConnectedDevices:', error);
      return [];
    }
  }

  getPortMode(port: number): { mode: number; status: number; baudrate: number } {
    const info = new TInfoEx();
    const result = iolinkDll.IOL_GetModeEx(this.handle, port, info.ref(), false);
    checkReturnCode(result, 'Get port mode');

    return {
      mode: info.ActualMode,
      status: info.SensorStatus,
      baudrate: info.CurrentBaudrate
    };
  }

  getSensorStatus(port: number): number {
    const status = ref.alloc(DWORD);
    const result = iolinkDll.IOL_GetSensorStatus(this.handle, port, status);
    
    // Don't throw on common errors
    if (result === RETURN_CODES.RETURN_UNKNOWN_HANDLE || 
        result === RETURN_CODES.RETURN_DEVICE_NOT_AVAILABLE) {
      return 0;
    }
    
    if (result !== RETURN_CODES.RETURN_OK) {
      console.warn(`Warning: Get sensor status failed with code ${result}`);
      return 0;
    }
    
    return status.deref();
  }

  getPortConfig(port: number): InstanceType<typeof TPortConfiguration> {
    const config = new TPortConfiguration();
    const result = iolinkDll.IOL_GetPortConfig(this.handle, port, config.ref());
    checkReturnCode(result, 'Get port configuration');
    return config;
  }

  setPortConfig(port: number, config: InstanceType<typeof TPortConfiguration>): void {
    const result = iolinkDll.IOL_SetPortConfig(this.handle, port, config.ref());
    checkReturnCode(result, 'Set port configuration');
  }

  readParameter(port: number, index: number, subIndex: number = 0, defaultValue = ''): string {
    try {
      const param = new TParameter();
      param.Index = index;
      param.SubIndex = subIndex;
      param.Length = 0;

      const result = iolinkDll.IOL_ReadReq(this.handle, port, param.ref());
      if (result !== 0) {
        return defaultValue;
      }

      return Buffer.from(param.Result).toString('utf8').replace(/\0/g, '').trim() || defaultValue;
    } catch (error) {
      console.error('Error reading parameter:', error);
      return defaultValue;
    }
  }

  readDeviceName(port: number): string {
    return this.readParameter(port, PARAMETER_INDEX.APPLICATION_SPECIFIC_NAME, 0, 'Unknown Device');
  }

  readVendorName(port: number): string {
    return this.readParameter(port, PARAMETER_INDEX.VENDOR_NAME, 0, 'Unknown Vendor');
  }

  readProductName(port: number): string {
    return this.readParameter(port, PARAMETER_INDEX.PRODUCT_NAME, 0, 'Unknown Product');
  }

  readSerialNumber(port: number): string {
    return this.readParameter(port, PARAMETER_INDEX.SERIAL_NUMBER, 0, '');
  }

  writeParameter(port: number, index: number, data: Buffer, subIndex: number = 0): void {
    const param = new TParameter();
    param.Index = index;
    param.SubIndex = subIndex;
    param.Length = data.length;
    data.copy(Buffer.from(param.Result));

    const result = iolinkDll.IOL_WriteReq(this.handle, port, param.ref());
    checkReturnCode(result, 'Write parameter');
  }

  readInputs(port: number, maxLength: number = 32): { data: Buffer; valid: boolean } {
    const data = Buffer.alloc(maxLength);
    const length = ref.alloc(DWORD);
    const valid = ref.alloc(DWORD);

    const result = iolinkDll.IOL_ReadInputs(
      this.handle,
      port,
      data,
      length,
      valid
    );
    checkReturnCode(result, 'Read inputs');

    return {
      data: data.slice(0, length.deref()),
      valid: valid.deref() !== 0
    };
  }

  writeOutputs(port: number, data: Buffer): void {
    const result = iolinkDll.IOL_WriteOutputs(
      this.handle,
      port,
      data,
      data.length
    );
    checkReturnCode(result, 'Write outputs');
  }

  async streamData(port: number, duration: number = 5000, interval: number = 200): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let sampleCount = 0;
      
      const streamInterval = setInterval(() => {
        try {
          const currentTime = Date.now();
          const elapsedTime = currentTime - startTime;
          
          if (elapsedTime >= duration) {
            clearInterval(streamInterval);
            resolve();
            return;
          }
          
          const { data, valid } = this.readInputs(port);
          sampleCount++;
          console.log(`Sample ${sampleCount}: ${data.toString('hex')} (${elapsedTime}ms)`);
        } catch (error) {
          console.error('Error reading sample:', error);
        }
      }, interval);
    });
  }

  uploadBlob(port: number, blobId: number, size: number): { data: Buffer; status: StructInstance<IBLOBStatus> } {
    const data = Buffer.alloc(size);
    const actual = ref.alloc(DWORD);
    const status = new TBLOBStatus();

    const result = iolinkDll.BLOB_uploadBLOB(
      this.handle,
      port,
      blobId,
      size,
      data,
      actual,
      status.ref()
    );
    checkReturnCode(result, 'Upload BLOB');

    return {
      data: data.slice(0, actual.deref()),
      status
    };
  }

  downloadBlob(port: number, blobId: number, data: Buffer): StructInstance<IBLOBStatus> {
    const status = new TBLOBStatus();

    const result = iolinkDll.BLOB_downloadBLOB(
      this.handle,
      port,
      blobId,
      data.length,
      data,
      status.ref()
    );
    checkReturnCode(result, 'Download BLOB');

    return status;
  }

  continueBlob(port: number): StructInstance<IBLOBStatus> {
    const status = new TBLOBStatus();
    const result = iolinkDll.BLOB_Continue(this.handle, port, status.ref());
    checkReturnCode(result, 'Continue BLOB');
    return status;
  }

  readBlobId(port: number): { blobId: number; status: StructInstance<IBLOBStatus> } {
    const blobId = ref.alloc(LONG);
    const status = new TBLOBStatus();

    const result = iolinkDll.BLOB_ReadBlobID(
      this.handle,
      port,
      blobId,
      status.ref()
    );
    checkReturnCode(result, 'Read BLOB ID');

    return {
      blobId: blobId.deref(),
      status
    };
  }
}