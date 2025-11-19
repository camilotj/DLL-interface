"use strict";
/**
 * Parameter Model
 * Represents an IO-Link device parameter with its properties and validation
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
class Parameter {
    constructor({ index, subIndex = 0, name, description = '', dataType = 'unknown', access = 'rw', length = 0, minValue = null, maxValue = null, defaultValue = null, unit = '', isStandard = false, }) {
        this.index = index;
        this.subIndex = subIndex;
        this.name = name;
        this.description = description;
        this.dataType = dataType;
        this.access = access;
        this.length = length;
        this.minValue = minValue;
        this.maxValue = maxValue;
        this.defaultValue = defaultValue;
        this.unit = unit;
        this.isStandard = isStandard;
        // Runtime properties
        this.lastRead = null;
        this.lastWrite = null;
        this.currentValue = null;
        this.errorCount = 0;
        this.lastError = null;
    }
    /**
     * Get parameter identifier
     */
    getId() {
        return `${this.index}.${this.subIndex}`;
    }
    /**
     * Check if parameter is readable
     */
    isReadable() {
        return this.access === 'r' || this.access === 'rw';
    }
    /**
     * Check if parameter is writable
     */
    isWritable() {
        return this.access === 'w' || this.access === 'rw';
    }
    /**
     * Validate value against parameter constraints
     */
    validateValue(value) {
        const errors = [];
        // Check data type
        if (!this.isValidDataType(value)) {
            errors.push(`Invalid data type. Expected ${this.dataType}`);
        }
        // Check length for string/bytes
        if ((this.dataType === 'string' || this.dataType === 'bytes') &&
            this.length > 0) {
            const actualLength = value.length || (Buffer.isBuffer(value) ? value.length : 0);
            if (actualLength > this.length) {
                errors.push(`Value too long. Maximum length: ${this.length}, actual: ${actualLength}`);
            }
        }
        // Check numeric ranges
        if (this.isNumericType() && typeof value === 'number') {
            if (this.minValue !== null && value < this.minValue) {
                errors.push(`Value ${value} is below minimum ${this.minValue}`);
            }
            if (this.maxValue !== null && value > this.maxValue) {
                errors.push(`Value ${value} is above maximum ${this.maxValue}`);
            }
        }
        return {
            valid: errors.length === 0,
            errors: errors,
        };
    }
    /**
     * Check if data type is numeric
     */
    isNumericType() {
        return [
            'uint8',
            'uint16',
            'uint32',
            'int8',
            'int16',
            'int32',
            'float32',
            'float64',
        ].includes(this.dataType);
    }
    /**
     * Validate value data type
     */
    isValidDataType(value) {
        switch (this.dataType) {
            case 'uint8':
            case 'uint16':
            case 'uint32':
            case 'int8':
            case 'int16':
            case 'int32':
                return typeof value === 'number' && Number.isInteger(value);
            case 'float32':
            case 'float64':
                return typeof value === 'number';
            case 'string':
                return typeof value === 'string';
            case 'bytes':
                return Buffer.isBuffer(value) || Array.isArray(value);
            case 'boolean':
                return typeof value === 'boolean';
            default:
                return true;
        }
    }
    /**
     * Convert value to appropriate format for transmission
     */
    formatValue(value) {
        switch (this.dataType) {
            case 'uint8':
                return Buffer.from([value & 0xff]);
            case 'uint16': {
                const uint16Buffer = Buffer.allocUnsafe(2);
                uint16Buffer.writeUInt16LE(value, 0);
                return uint16Buffer;
            }
            case 'uint32': {
                const uint32Buffer = Buffer.allocUnsafe(4);
                uint32Buffer.writeUInt32LE(value, 0);
                return uint32Buffer;
            }
            case 'int8':
                return Buffer.from([value & 0xff]);
            case 'int16': {
                const int16Buffer = Buffer.allocUnsafe(2);
                int16Buffer.writeInt16LE(value, 0);
                return int16Buffer;
            }
            case 'int32': {
                const int32Buffer = Buffer.allocUnsafe(4);
                int32Buffer.writeInt32LE(value, 0);
                return int32Buffer;
            }
            case 'string':
                return Buffer.from(value, 'utf8');
            case 'bytes':
                return Buffer.isBuffer(value) ? value : Buffer.from(value);
            case 'boolean':
                return Buffer.from([value ? 1 : 0]);
            default:
                return Buffer.from(value);
        }
    }
    /**
     * Parse value from buffer based on data type
     */
    parseValue(buffer) {
        if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
            return null;
        }
        try {
            switch (this.dataType) {
                case 'uint8':
                    return buffer.readUInt8(0);
                case 'uint16':
                    return buffer.length >= 2 ? buffer.readUInt16LE(0) : null;
                case 'uint32':
                    return buffer.length >= 4 ? buffer.readUInt32LE(0) : null;
                case 'int8':
                    return buffer.readInt8(0);
                case 'int16':
                    return buffer.length >= 2 ? buffer.readInt16LE(0) : null;
                case 'int32':
                    return buffer.length >= 4 ? buffer.readInt32LE(0) : null;
                case 'float32':
                    return buffer.length >= 4 ? buffer.readFloatLE(0) : null;
                case 'float64':
                    return buffer.length >= 8 ? buffer.readDoubleLE(0) : null;
                case 'string':
                    return buffer.toString('utf8').replace(/\0+$/, '');
                case 'boolean':
                    return buffer.readUInt8(0) !== 0;
                case 'bytes':
                default:
                    return buffer;
            }
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Update current value
     */
    updateValue(value, timestamp = new Date()) {
        this.currentValue = value;
        this.lastRead = timestamp;
    }
    /**
     * Record successful write
     */
    recordWrite(timestamp = new Date()) {
        this.lastWrite = timestamp;
    }
    /**
     * Record error
     */
    recordError(error, timestamp = new Date()) {
        this.lastError = {
            message: typeof error === 'string' ? error : error.message,
            timestamp: timestamp,
        };
        this.errorCount++;
    }
    /**
     * Get parameter info for API responses
     */
    toJSON() {
        return {
            index: this.index,
            subIndex: this.subIndex,
            id: this.getId(),
            name: this.name,
            description: this.description,
            dataType: this.dataType,
            access: this.access,
            length: this.length,
            minValue: this.minValue,
            maxValue: this.maxValue,
            defaultValue: this.defaultValue,
            unit: this.unit,
            isStandard: this.isStandard,
            readable: this.isReadable(),
            writable: this.isWritable(),
            currentValue: this.currentValue,
            lastRead: this.lastRead,
            lastWrite: this.lastWrite,
            errorCount: this.errorCount,
            lastError: this.lastError,
        };
    }
    /**
     * Get parameter summary for listings
     */
    getSummary() {
        return {
            index: this.index,
            subIndex: this.subIndex,
            id: this.getId(),
            name: this.name,
            dataType: this.dataType,
            access: this.access,
            unit: this.unit,
            currentValue: this.currentValue,
            lastRead: this.lastRead,
        };
    }
    /**
     * Create parameter from standard IO-Link parameter definition
     */
    static createStandardParameter(index, definition) {
        return new Parameter({
            ...definition,
            index: index,
            name: definition.name || 'Unknown',
            isStandard: true,
        });
    }
    /**
     * Get data type size in bytes
     */
    getDataTypeSize() {
        switch (this.dataType) {
            case 'uint8':
            case 'int8':
            case 'boolean':
                return 1;
            case 'uint16':
            case 'int16':
                return 2;
            case 'uint32':
            case 'int32':
            case 'float32':
                return 4;
            case 'float64':
                return 8;
            case 'string':
            case 'bytes':
                return this.length || 0;
            default:
                return 0;
        }
    }
}
exports.default = Parameter;
//# sourceMappingURL=Parameter.js.map