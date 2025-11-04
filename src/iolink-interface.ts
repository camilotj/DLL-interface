import ffi from 'ffi-napi';
import ref from 'ref-napi';
import path from 'path';
import {
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
  PARAMETER_INDEX,
  type IOLinkDLL,
  type IBLOBStatus
} from './types';

// ============================================================================
// DLL LOADING
// ============================================================================

const dllPath = path.join(__dirname, '..', 'TMG_USB_IO-Link_Interface_V2_DLL/Sample_x64/Sample_C/SimpleApplication/TMGIOLUSBIF20_64.dll');
console.log('Loading DLL from:', dllPath);

// Check if DLL exists
if (!require('fs').existsSync(dllPath)) {
  throw new Error(`DLL not found at path: ${dllPath}`);
}

let iolinkDll: any;
try {
  iolinkDll = ffi.Library(dllPath,
  {
    // Core master functions (master management)
    IOL_GetUSBDevices: [LONG, [ref.refType(TDeviceIdentification), LONG]],
    IOL_Create: [LONG, [ref.types.CString]],
    IOL_Destroy: [LONG, [LONG]],

    // Port configuration and status (port ops)
    IOL_GetModeEx: [LONG, [LONG, DWORD, 'pointer', ref.types.bool]],
    IOL_GetSensorStatus: [LONG, [LONG, DWORD, 'pointer']],
    IOL_GetPortConfig: [LONG, [LONG, DWORD, 'pointer']],
    IOL_SetPortConfig: [LONG, [LONG, DWORD, 'pointer']],

    // Parameter communication (ISDU)
    IOL_ReadReq: [LONG, [LONG, DWORD, 'pointer']],
    IOL_WriteReq: [LONG, [LONG, DWORD, 'pointer']],

    // Process data communication
    IOL_ReadInputs: [LONG, [LONG, DWORD, 'pointer', 'pointer', 'pointer']],
    IOL_WriteOutputs: [LONG, [LONG, DWORD, 'pointer', DWORD]],

    // BLOB functions
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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function checkReturnCode(code: number, operation: string): void {
  if (code !== RETURN_CODES.RETURN_OK) {
    throw new Error(`${operation} failed with code ${code}`);
  }
}

function arrayToString(array: number[]): string {
  try {
    // Convert the array to a Buffer and then to a string, removing null terminators
    const buf = Buffer.from(array);
    let str = '';
    for (let i = 0; i < buf.length; i++) {
      if (buf[i] === 0) break;  // Stop at first null terminator
      str += String.fromCharCode(buf[i]);
    }
    return str.trim();
  } catch (error) {
    console.error('Error converting array to string:', error);
    return '';
  }
}

// ============================================================================
// CLASS IMPLEMENTATION
// ============================================================================

export class IOLinkInterface {
  private handle: number = -1;

  constructor() {
    // Initialize the interface
  }

  connect(portName: string): void {
    if (this.handle !== -1) {
      throw new Error('Already connected to a device');
    }
    
    console.log(`Attempting to connect to device: ${portName}`);
    const result = iolinkDll.IOL_Create(portName);
    console.log(`Connection result: ${result}`);
    
    if (result <= 0) {
      let errorMessage: string;
      switch(result) {
        case -1: errorMessage = 'Internal error'; break;
        case -2: errorMessage = 'Device not available'; break;
        case -7: errorMessage = 'Unknown handle'; break;
        case -9: errorMessage = 'Device access error - Check permissions and if device is properly connected'; break;
        case -10: errorMessage = 'Wrong parameter'; break;
        default: errorMessage = `Unknown error code ${result}`; break;
      }
      throw new Error(`Device connection failed: ${errorMessage} (code ${result})`);
    }
    this.handle = result;
  }

  disconnect(): void {
    if (this.handle === -1) {
      return;
    }

    const result = iolinkDll.IOL_Destroy(this.handle);
    checkReturnCode(result, 'Device disconnection');
    this.handle = -1;
  }

  getConnectedDevices(): string[] {
    const maxDevices = 10;
    const devices: string[] = [];
    console.log('Searching for USB devices...');

    try {
      // Create a device structure for the DLL to fill
      const device = new TDeviceIdentification();
      console.log('Created device structure:', {
        size: TDeviceIdentification.size,
        fields: {
          Name: device.Name ? device.Name.length : 'undefined',
          ProductCode: device.ProductCode ? device.ProductCode.length : 'undefined',
          ViewName: device.ViewName ? device.ViewName.length : 'undefined'
        }
      });

      // Call DLL to get devices
      const count = iolinkDll.IOL_GetUSBDevices(device.ref(), maxDevices);
      console.log(`Found ${count} devices`);

      if (count <= 0) {
        return devices;
      }

      // Extract device info
      if (device && device.ViewName) {
        const name = arrayToString(device.Name);
        const viewName = arrayToString(device.ViewName);
        console.log('Device info:', {
          name: name || '(empty)',
          viewName: viewName || '(empty)'
        });
        
        if (viewName && viewName.trim()) {
          devices.push(viewName.trim());
        }
      }

      console.log('Detected devices:', devices);
      return devices;
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
    checkReturnCode(result, 'Get sensor status');
    return status.deref();
  }

  getPortConfig(port: number): typeof TPortConfiguration {
    const config = new TPortConfiguration();
    const result = iolinkDll.IOL_GetPortConfig(this.handle, port, (config as any).ref());
    checkReturnCode(result, 'Get port configuration');
    return config;
  }

  setPortConfig(port: number, config: typeof TPortConfiguration): void {
    const result = iolinkDll.IOL_SetPortConfig(this.handle, port, (config as any).ref());
    checkReturnCode(result, 'Set port configuration');
  }

  readParameter(port: number, index: number, subIndex: number = 0): typeof TParameter {
    const param = new TParameter();
    param.Index = index;
    param.SubIndex = subIndex;

    const result = iolinkDll.IOL_ReadReq(this.handle, port, (param as any).ref());
    checkReturnCode(result, 'Read parameter');
    return param;
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
      ref.ref(data) as ref.Pointer<number>,
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
      ref.ref(data) as ref.Pointer<number>,
      data.length
    );
    checkReturnCode(result, 'Write outputs');
  }

  uploadBlob(port: number, blobId: number, size: number): { data: Buffer; status: typeof TBLOBStatus } {
    const data = Buffer.alloc(size);
    const actual = ref.alloc(DWORD);
    const status = new TBLOBStatus();

    const result = iolinkDll.BLOB_uploadBLOB(
      this.handle,
      port,
      blobId,
      size,
      ref.ref(data) as ref.Pointer<number>,
      actual,
      status.ref()
    );
    checkReturnCode(result, 'Upload BLOB');

    return {
      data: data.slice(0, actual.deref()),
      status
    };
  }

  downloadBlob(port: number, blobId: number, data: Buffer): typeof TBLOBStatus {
    const status = new TBLOBStatus();

    const result = iolinkDll.BLOB_downloadBLOB(
      this.handle,
      port,
      blobId,
      data.length,
      ref.ref(data) as ref.Pointer<number>,
      status.ref()
    );
    checkReturnCode(result, 'Download BLOB');

    return status;
  }

  continueBlob(port: number): typeof TBLOBStatus {
    const status = new TBLOBStatus();
    const result = iolinkDll.BLOB_Continue(this.handle, port, status.ref());
    checkReturnCode(result, 'Continue BLOB');
    return status;
  }

  readBlobId(port: number): { blobId: number; status: typeof TBLOBStatus } {
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