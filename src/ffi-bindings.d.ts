/**
 * Type definitions for ffi-bindings.js
 */
import { Type } from 'ref-napi';
import * as refArray from 'ref-array-napi';
import * as refStruct from 'ref-struct-napi';

// Create type aliases for ffi types
type StructType<T = any> = { new(): T & { ref(): Buffer; deref(): T } };

declare module './ffi-bindings' {
    export const BYTE: Type;
    export const WORD: Type;
    export const LONG: Type;
    export const DWORD: Type;

    export const structs: {
        BLOBStatus: StructType<{
            executedState: number;
            errorCode: number;
            additionalCode: number;
            dllReturnValue: number;
            Position: number;
            PercentComplete: number;
            nextState: number;
        }>;
        DeviceIdentification: StructType<{
            Name: Buffer;
            ProductCode: Buffer;
            ViewName: Buffer;
        }>;
        InfoEx: StructType<{
            COM: Buffer;
            DirectParameterPage: Buffer;
            ActualMode: number;
            SensorStatus: number;
            CurrentBaudrate: number;
        }>;
        Parameter: StructType<{
            Result: Buffer;
            Index: number;
            SubIndex: number;
            Length: number;
            ErrorCode: number;
            AdditionalCode: number;
        }>;
        PortConfiguration: StructType<{
            PortModeDetails: number;
            TargetMode: number;
            CRID: number;
            DSConfigure: number;
            Synchronisation: number;
            FunctionID: Buffer;
            InspectionLevel: number;
            VendorID: Buffer;
            DeviceID: Buffer;
            SerialNumber: Buffer;
            InputLength: number;
            OutputLength: number;
        }>;
    };
    
    // Array constructors
    export const ByteArray8: refArray.ArrayType<Buffer>;
    export const ByteArray16: refArray.ArrayType<Buffer>;
    export const ByteArray100: refArray.ArrayType<Buffer>;
    export const ByteArray256: refArray.ArrayType<Buffer>;
    export const ByteArray2: refArray.ArrayType<Buffer>;
    export const ByteArray3: refArray.ArrayType<Buffer>;
    export const ByteArray10: refArray.ArrayType<Buffer>;

    // Struct constructors
    export const TBLOBStatus: StructType<{
        executedState: number;
        errorCode: number;
        additionalCode: number;
        dllReturnValue: number;
        Position: number;
        PercentComplete: number;
        nextState: number;
    }>;
    export const TDeviceIdentification: StructType<{
        Name: Buffer;
        ProductCode: Buffer;
        ViewName: Buffer;
    }>;
    export const TInfoEx: StructType<{
        COM: Buffer;
        DirectParameterPage: Buffer;
        ActualMode: number;
        SensorStatus: number;
        CurrentBaudrate: number;
    }>;
    export const TParameter: StructType<{
        Result: Buffer;
        Index: number;
        SubIndex: number;
        Length: number;
        ErrorCode: number;
        AdditionalCode: number;
    }>;
    export const TPortConfiguration: StructType<{
        PortModeDetails: number;
        TargetMode: number;
        CRID: number;
        DSConfigure: number;
        Synchronisation: number;
        FunctionID: Buffer;
        InspectionLevel: number;
        VendorID: Buffer;
        DeviceID: Buffer;
        SerialNumber: Buffer;
        InputLength: number;
        OutputLength: number;
    }>;

    // Constants
    export const RETURN_CODES: { [key: string]: number };
    export const PORT_MODES: { [key: string]: number };
    export const SENSOR_STATUS: { [key: string]: number };
    export const VALIDATION_MODES: { [key: string]: number };
    export const PARAMETER_INDEX: { [key: string]: number };
}