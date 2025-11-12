/**
 * Parameter Model - TypeScript Port
 * Represents an IO-Link device parameter with its properties and validation
 *
 * CRITICAL: Maintains exact behavior and validation logic from JavaScript version
 */
type ParameterAccess = 'r' | 'w' | 'rw';
type ParameterDataType = 'uint8' | 'uint16' | 'uint32' | 'int8' | 'int16' | 'int32' | 'float32' | 'float64' | 'string' | 'bytes' | 'boolean' | 'unknown';
interface ParameterConstructorParams {
    index: number;
    subIndex?: number;
    name: string;
    description?: string;
    dataType?: ParameterDataType;
    access?: ParameterAccess;
    length?: number;
    minValue?: number | null;
    maxValue?: number | null;
    defaultValue?: any;
    unit?: string;
    isStandard?: boolean;
}
interface ValidationResult {
    valid: boolean;
    errors: string[];
}
interface ParameterError {
    message: string;
    timestamp: Date;
}
declare class Parameter {
    index: number;
    subIndex: number;
    name: string;
    description: string;
    dataType: ParameterDataType;
    access: ParameterAccess;
    length: number;
    minValue: number | null;
    maxValue: number | null;
    defaultValue: any;
    unit: string;
    isStandard: boolean;
    lastRead: Date | null;
    lastWrite: Date | null;
    currentValue: any;
    errorCount: number;
    lastError: ParameterError | null;
    constructor({ index, subIndex, name, description, dataType, access, length, minValue, maxValue, defaultValue, unit, isStandard, }: ParameterConstructorParams);
    /**
     * Get parameter identifier
     */
    getId(): string;
    /**
     * Check if parameter is readable
     */
    isReadable(): boolean;
    /**
     * Check if parameter is writable
     */
    isWritable(): boolean;
    /**
     * Validate value against parameter constraints
     */
    validateValue(value: any): ValidationResult;
    /**
     * Check if data type is numeric
     */
    isNumericType(): boolean;
    /**
     * Validate value data type
     */
    isValidDataType(value: any): boolean;
    /**
     * Convert value to appropriate format for transmission
     */
    formatValue(value: any): Buffer;
    /**
     * Parse value from buffer based on data type
     */
    parseValue(buffer: Buffer): any;
    /**
     * Update current value
     */
    updateValue(value: any, timestamp?: Date): void;
    /**
     * Record successful write
     */
    recordWrite(timestamp?: Date): void;
    /**
     * Record error
     */
    recordError(error: Error | string, timestamp?: Date): void;
    /**
     * Get parameter info for API responses
     */
    toJSON(): Record<string, any>;
    /**
     * Get parameter summary for listings
     */
    getSummary(): Record<string, any>;
    /**
     * Create parameter from standard IO-Link parameter definition
     */
    static createStandardParameter(index: number, definition: Partial<ParameterConstructorParams>): Parameter;
    /**
     * Get data type size in bytes
     */
    getDataTypeSize(): number;
}
export default Parameter;
//# sourceMappingURL=Parameter.d.ts.map