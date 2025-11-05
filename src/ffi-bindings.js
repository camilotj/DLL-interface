/**
 * This file contains the JavaScript implementation of FFI bindings.
 * We use JavaScript here to avoid TypeScript type checking issues with FFI.
 */
const ffi = require('ffi-napi');
const ref = require('ref-napi');
const StructType = require('ref-struct-napi');
const ArrayType = require('ref-array-napi');

// Basic FFI type definitions
const types = {
    BYTE: ref.types.uint8,
    WORD: ref.types.uint16,
    LONG: ref.types.int32,
    DWORD: ref.types.uint32
};

// Create array type definitions
const arrays = {
    ByteArray8: ArrayType(types.BYTE, 8),
    ByteArray16: ArrayType(types.BYTE, 16),
    ByteArray100: ArrayType(types.BYTE, 100),
    ByteArray256: ArrayType(types.BYTE, 256),
    ByteArray2: ArrayType(types.BYTE, 2),
    ByteArray3: ArrayType(types.BYTE, 3),
    ByteArray10: ArrayType(types.BYTE, 10)
};

// Define struct types directly as constructors
const TBLOBStatus = StructType({
    executedState: types.BYTE,
    errorCode: types.BYTE,
    additionalCode: types.BYTE,
    dllReturnValue: types.LONG,
    Position: types.DWORD,
    PercentComplete: types.BYTE,
    nextState: types.BYTE
});

const TDeviceIdentification = StructType({
    Name: arrays.ByteArray8,
    ProductCode: arrays.ByteArray16,
    ViewName: arrays.ByteArray100
});

const TInfoEx = StructType({
    COM: arrays.ByteArray10,
    DirectParameterPage: arrays.ByteArray16,
    ActualMode: types.BYTE,
    SensorStatus: types.BYTE,
    CurrentBaudrate: types.BYTE
});

const TParameter = StructType({
    Result: arrays.ByteArray256,
    Index: types.WORD,
    SubIndex: types.BYTE,
    Length: types.BYTE,
    ErrorCode: types.BYTE,
    AdditionalCode: types.BYTE
});

const TPortConfiguration = StructType({
    PortModeDetails: types.BYTE,
    TargetMode: types.BYTE,
    CRID: types.BYTE,
    DSConfigure: types.BYTE,
    Synchronisation: types.BYTE,
    FunctionID: arrays.ByteArray2,
    InspectionLevel: types.BYTE,
    VendorID: arrays.ByteArray2,
    DeviceID: arrays.ByteArray3,
    SerialNumber: arrays.ByteArray16,
    InputLength: types.BYTE,
    OutputLength: types.BYTE
});

// Constants
const constants = {
    RETURN_CODES: {
        RETURN_OK: 0,
        RETURN_INTERNAL_ERROR: -1,
        RETURN_DEVICE_NOT_AVAILABLE: -2,
        RETURN_UNKNOWN_HANDLE: -7,
        RETURN_WRONG_PARAMETER: -10,
    },

    PORT_MODES: {
        SM_MODE_RESET: 0,
        SM_MODE_IOLINK_PREOP: 1,
        SM_MODE_SIO_INPUT: 3,
        SM_MODE_SIO_OUTPUT: 4,
        SM_MODE_IOLINK_OPERATE: 12,
    },

    SENSOR_STATUS: {
        BIT_CONNECTED: 0x01,
        BIT_PREOPERATE: 0x02,
        BIT_WRONGSENSOR: 0x10,
        BIT_EVENTAVAILABLE: 0x04,
        BIT_PDVALID: 0x08,
        BIT_SENSORSTATEKNOWN: 0x80,
    },

    VALIDATION_MODES: {
        SM_VALIDATION_MODE_NONE: 0,
        SM_VALIDATION_MODE_COMPATIBLE: 1,
        SM_VALIDATION_MODE_IDENTICAL: 2,
    },

    PARAMETER_INDEX: {
        DIRECT_PARAMETER_PAGE: 0,
        MIN_CYCLE_TIME: 2,
        MSEQUENCE_CAPABILITY: 3,
        VENDOR_NAME: 10,
        VENDOR_TEXT: 11,
        PRODUCT_NAME: 12,
        SERIAL_NUMBER: 15,
        HARDWARE_REVISION: 16,
        FIRMWARE_REVISION: 17,
        APPLICATION_SPECIFIC_NAME: 18,
    }
};

// Export everything
module.exports = {
    // FFI types
    BYTE: types.BYTE,
    WORD: types.WORD,
    LONG: types.LONG,
    DWORD: types.DWORD,

    // Array types
    ByteArray8: arrays.ByteArray8,
    ByteArray16: arrays.ByteArray16,
    ByteArray100: arrays.ByteArray100,
    ByteArray256: arrays.ByteArray256,
    ByteArray2: arrays.ByteArray2,
    ByteArray3: arrays.ByteArray3,
    ByteArray10: arrays.ByteArray10,

    // Struct constructors
    TBLOBStatus,
    TDeviceIdentification,
    TInfoEx,
    TParameter,
    TPortConfiguration,

    // Structs object for backward compatibility
    structs: {
        BLOBStatus: TBLOBStatus,
        DeviceIdentification: TDeviceIdentification,
        InfoEx: TInfoEx,
        Parameter: TParameter,
        PortConfiguration: TPortConfiguration
    },

    // Constants
    RETURN_CODES: constants.RETURN_CODES,
    PORT_MODES: constants.PORT_MODES,
    SENSOR_STATUS: constants.SENSOR_STATUS,
    VALIDATION_MODES: constants.VALIDATION_MODES,
    PARAMETER_INDEX: constants.PARAMETER_INDEX
};