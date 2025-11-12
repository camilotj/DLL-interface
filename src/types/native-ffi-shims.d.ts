/**
 * Type declarations for native FFI modules
 * These modules don't have official TypeScript types
 */

declare module 'ffi-napi' {
  export function Library(library: string | null, functions: any): any;
  export const types: any;
}

declare module 'ref-napi' {
  export const types: {
    uint8: any;
    uint16: any;
    int32: any;
    uint32: any;
    bool: any;
    CString: any;
    void: any;
  };
  export function alloc(type: any, value?: any): Buffer;
  export function get(buffer: Buffer, offset: number, type: any): any;
  export function refType(type: any): any;
  export function isNull(pointer: any): boolean;
}

declare module 'ref-struct-napi' {
  function StructType(fields: any): any;
  export = StructType;
}

declare module 'ref-array-napi' {
  function ArrayType(type: any, length?: number): any;
  export = ArrayType;
}
