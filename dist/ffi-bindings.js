"use strict";
/**
 * FFI Bindings for TMG IO-Link DLL
 * Type-safe FFI declarations and struct definitions
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ref = exports.iolinkDll = exports.TPortConfiguration = exports.TParameter = exports.TInfoEx = exports.TDeviceIdentification = exports.TBLOBStatus = exports.DWORD = exports.LONG = exports.WORD = exports.BYTE = void 0;
const ffi_napi_1 = __importDefault(require("ffi-napi"));
const ref_napi_1 = __importDefault(require("ref-napi"));
exports.ref = ref_napi_1.default;
const ref_struct_napi_1 = __importDefault(require("ref-struct-napi"));
const ref_array_napi_1 = __importDefault(require("ref-array-napi"));
const path = __importStar(require("path"));
// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
exports.BYTE = ref_napi_1.default.types.uint8;
exports.WORD = ref_napi_1.default.types.uint16;
exports.LONG = ref_napi_1.default.types.int32;
exports.DWORD = ref_napi_1.default.types.uint32;
// ============================================================================
// STRUCT DEFINITIONS
// ============================================================================
exports.TBLOBStatus = (0, ref_struct_napi_1.default)({
    executedState: exports.BYTE,
    errorCode: exports.BYTE,
    additionalCode: exports.BYTE,
    dllReturnValue: exports.LONG,
    Position: exports.DWORD,
    PercentComplete: exports.BYTE,
    nextState: exports.BYTE,
});
exports.TDeviceIdentification = (0, ref_struct_napi_1.default)({
    Name: (0, ref_array_napi_1.default)(exports.BYTE, 8),
    ProductCode: (0, ref_array_napi_1.default)(exports.BYTE, 16),
    ViewName: (0, ref_array_napi_1.default)(exports.BYTE, 100),
});
exports.TInfoEx = (0, ref_struct_napi_1.default)({
    COM: (0, ref_array_napi_1.default)(exports.BYTE, 10),
    DirectParameterPage: (0, ref_array_napi_1.default)(exports.BYTE, 16),
    ActualMode: exports.BYTE,
    SensorStatus: exports.BYTE,
    CurrentBaudrate: exports.BYTE,
});
exports.TParameter = (0, ref_struct_napi_1.default)({
    Result: (0, ref_array_napi_1.default)(exports.BYTE, 256),
    Index: exports.WORD,
    SubIndex: exports.BYTE,
    Length: exports.BYTE,
    ErrorCode: exports.BYTE,
    AdditionalCode: exports.BYTE,
});
exports.TPortConfiguration = (0, ref_struct_napi_1.default)({
    PortModeDetails: exports.BYTE,
    TargetMode: exports.BYTE,
    CRID: exports.BYTE,
    DSConfigure: exports.BYTE,
    Synchronisation: exports.BYTE,
    FunctionID: (0, ref_array_napi_1.default)(exports.BYTE, 2),
    InspectionLevel: exports.BYTE,
    VendorID: (0, ref_array_napi_1.default)(exports.BYTE, 2),
    DeviceID: (0, ref_array_napi_1.default)(exports.BYTE, 3),
    SerialNumber: (0, ref_array_napi_1.default)(exports.BYTE, 16),
    InputLength: exports.BYTE,
    OutputLength: exports.BYTE,
});
// ============================================================================
// DLL LOADING
// ============================================================================
const dllPath = path.join(__dirname, '../TMG_USB_IO-Link_Interface_V2_DLL/Sample_x64/Sample_C/SimpleApplication/TMGIOLUSBIF20_64.dll');
exports.iolinkDll = ffi_napi_1.default.Library(dllPath, {
    IOL_GetUSBDevices: [exports.LONG, [ref_napi_1.default.refType(exports.TDeviceIdentification), exports.LONG]],
    IOL_Create: [exports.LONG, [ref_napi_1.default.types.CString]],
    IOL_Destroy: [exports.LONG, [exports.LONG]],
    IOL_GetModeEx: [exports.LONG, [exports.LONG, exports.DWORD, ref_napi_1.default.refType(exports.TInfoEx), ref_napi_1.default.types.bool]],
    IOL_GetSensorStatus: [exports.LONG, [exports.LONG, exports.DWORD, ref_napi_1.default.refType(exports.DWORD)]],
    IOL_GetPortConfig: [exports.LONG, [exports.LONG, exports.DWORD, ref_napi_1.default.refType(exports.TPortConfiguration)]],
    IOL_SetPortConfig: [exports.LONG, [exports.LONG, exports.DWORD, ref_napi_1.default.refType(exports.TPortConfiguration)]],
    IOL_ReadReq: [exports.LONG, [exports.LONG, exports.DWORD, ref_napi_1.default.refType(exports.TParameter)]],
    IOL_WriteReq: [exports.LONG, [exports.LONG, exports.DWORD, ref_napi_1.default.refType(exports.TParameter)]],
    IOL_ReadInputs: [exports.LONG, [exports.LONG, exports.DWORD, ref_napi_1.default.refType(exports.BYTE), ref_napi_1.default.refType(exports.DWORD), ref_napi_1.default.refType(exports.DWORD)]],
    IOL_WriteOutputs: [exports.LONG, [exports.LONG, exports.DWORD, ref_napi_1.default.refType(exports.BYTE), exports.DWORD]],
    BLOB_uploadBLOB: [exports.LONG, [exports.LONG, exports.DWORD, exports.LONG, exports.DWORD, ref_napi_1.default.refType(exports.BYTE), ref_napi_1.default.refType(exports.DWORD), ref_napi_1.default.refType(exports.TBLOBStatus)]],
    BLOB_downloadBLOB: [exports.LONG, [exports.LONG, exports.DWORD, exports.LONG, exports.DWORD, ref_napi_1.default.refType(exports.BYTE), ref_napi_1.default.refType(exports.TBLOBStatus)]],
    BLOB_Continue: [exports.LONG, [exports.LONG, exports.DWORD, ref_napi_1.default.refType(exports.TBLOBStatus)]],
    BLOB_ReadBlobID: [exports.LONG, [exports.LONG, exports.DWORD, ref_napi_1.default.refType(exports.LONG), ref_napi_1.default.refType(exports.TBLOBStatus)]],
});
//# sourceMappingURL=ffi-bindings.js.map