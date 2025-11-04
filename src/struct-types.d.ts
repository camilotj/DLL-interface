declare module 'ref-struct-napi' {
  export interface StructType {
    new(): any;
    (arg?: any): any;
    prototype: any;
  }

  export interface StructTypeConstructor {
    (fields: { [key: string]: any }): any;
    new(fields: { [key: string]: any }): any;
  }

  const StructType: StructTypeConstructor;
  export = StructType;
}

declare module 'ref-array-napi' {
  export interface ArrayType {
    new(size?: number): any[];
    (size?: number): any[];
    prototype: any;
  }

  export interface ArrayTypeConstructor {
    (type: any): any;
    new(type: any): any;
  }

  const ArrayType: ArrayTypeConstructor;
  export = ArrayType;
}

declare module 'ref-array-napi' {
  interface ArrayType<T = any> extends Function {
    new(size?: number): T[];
    BYTES_PER_ELEMENT: number;
    name: string;
    size: number;
    alignment: number;
    (arg?: any): T[];
  }

  interface ArrayTypeConstructor {
    new<T = any>(type: any): ArrayType<T>;
    <T = any>(type: any): ArrayType<T>;
  }

  const ArrayType: ArrayTypeConstructor;
  export = ArrayType;
}