/**
 * FFI Bindings for TMG IO-Link DLL
 * Type-safe FFI declarations and struct definitions
 */
import ref from 'ref-napi';
import StructType from 'ref-struct-napi';
import type { IOLinkDLL } from './types';
export declare const BYTE: ref.Type<number>;
export declare const WORD: ref.Type<number>;
export declare const LONG: ref.Type<number>;
export declare const DWORD: ref.Type<number>;
export declare const TBLOBStatus: StructType;
export declare const TDeviceIdentification: StructType;
export declare const TInfoEx: StructType;
export declare const TParameter: StructType;
export declare const TPortConfiguration: StructType;
export declare const iolinkDll: IOLinkDLL;
export { ref };
//# sourceMappingURL=ffi-bindings.d.ts.map