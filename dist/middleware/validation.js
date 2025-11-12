"use strict";
/**
 * Validation Middleware - TypeScript Port
 * Request validation using Joi schemas
 *
 * CRITICAL: Maintains exact validation behavior from JavaScript version
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemas = exports.validateStreamParams = exports.validateQueryParams = exports.validateMasterConnection = exports.validateProcessDataWrite = exports.validateParameterWrite = exports.validateParameterIndex = exports.validateMasterHandle = exports.validateDeviceId = void 0;
exports.validatePortNumber = validatePortNumber;
exports.validateMasterExists = validateMasterExists;
exports.validateProcessDataLength = validateProcessDataLength;
exports.validateParameterValue = validateParameterValue;
exports.validate = validate;
const joi_1 = __importDefault(require("joi"));
const constants_1 = require("../utils/constants");
// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================
const schemas = {
    // Device ID validation (port number)
    deviceId: joi_1.default.object({
        deviceId: joi_1.default.number().integer().min(1).max(8).required().messages({
            'number.base': 'Device ID must be a number',
            'number.integer': 'Device ID must be an integer',
            'number.min': 'Device ID must be between 1 and 8',
            'number.max': 'Device ID must be between 1 and 8',
            'any.required': 'Device ID is required',
        }),
    }),
    // Master handle validation
    masterHandle: joi_1.default.object({
        masterHandle: joi_1.default.number().integer().min(0).required().messages({
            'number.base': 'Master handle must be a number',
            'number.integer': 'Master handle must be an integer',
            'number.min': 'Master handle must be non-negative',
            'any.required': 'Master handle is required',
        }),
    }),
    // Parameter index validation
    parameterIndex: joi_1.default.object({
        index: joi_1.default.number().integer().min(0).max(65535).required().messages({
            'number.base': 'Parameter index must be a number',
            'number.integer': 'Parameter index must be an integer',
            'number.min': 'Parameter index must be non-negative',
            'number.max': 'Parameter index must be less than 65536',
            'any.required': 'Parameter index is required',
        }),
        subIndex: joi_1.default.number()
            .integer()
            .min(0)
            .max(255)
            .optional()
            .default(0)
            .messages({
            'number.base': 'Parameter sub-index must be a number',
            'number.integer': 'Parameter sub-index must be an integer',
            'number.min': 'Parameter sub-index must be non-negative',
            'number.max': 'Parameter sub-index must be less than 256',
        }),
    }),
    // Parameter write validation
    parameterWrite: joi_1.default.object({
        value: joi_1.default.alternatives()
            .try(joi_1.default.number(), joi_1.default.string().max(256), joi_1.default.array().items(joi_1.default.number().integer().min(0).max(255)).max(256), joi_1.default.boolean())
            .required()
            .messages({
            'alternatives.match': 'Value must be a number, string, byte array, or boolean',
            'any.required': 'Parameter value is required',
        }),
        dataType: joi_1.default.string()
            .valid('uint8', 'uint16', 'uint32', 'int8', 'int16', 'int32', 'float32', 'float64', 'string', 'bytes', 'boolean')
            .optional()
            .messages({
            'any.only': 'Data type must be one of: uint8, uint16, uint32, int8, int16, int32, float32, float64, string, bytes, boolean',
        }),
    }),
    // Process data write validation
    processDataWrite: joi_1.default.object({
        data: joi_1.default.alternatives()
            .try(joi_1.default.array().items(joi_1.default.number().integer().min(0).max(255)).max(32), joi_1.default.string().max(32))
            .required()
            .messages({
            'alternatives.match': 'Data must be a byte array or string (max 32 bytes)',
            'any.required': 'Process data is required',
        }),
    }),
    // Master connection validation
    masterConnection: joi_1.default.object({
        deviceName: joi_1.default.string().min(1).max(100).required().messages({
            'string.base': 'Device name must be a string',
            'string.min': 'Device name cannot be empty',
            'string.max': 'Device name too long (max 100 characters)',
            'any.required': 'Device name is required',
        }),
    }),
    // Query parameters validation
    queryParams: joi_1.default.object({
        limit: joi_1.default.number()
            .integer()
            .min(1)
            .max(100)
            .optional()
            .default(50)
            .messages({
            'number.base': 'Limit must be a number',
            'number.integer': 'Limit must be an integer',
            'number.min': 'Limit must be at least 1',
            'number.max': 'Limit cannot exceed 100',
        }),
        offset: joi_1.default.number().integer().min(0).optional().default(0).messages({
            'number.base': 'Offset must be a number',
            'number.integer': 'Offset must be an integer',
            'number.min': 'Offset must be non-negative',
        }),
        includeDisconnected: joi_1.default.boolean().optional().default(false).messages({
            'boolean.base': 'includeDisconnected must be true or false',
        }),
    }),
    // Streaming parameters validation
    streamParams: joi_1.default.object({
        interval: joi_1.default.number()
            .integer()
            .min(100)
            .max(60000)
            .optional()
            .default(1000)
            .messages({
            'number.base': 'Interval must be a number',
            'number.integer': 'Interval must be an integer',
            'number.min': 'Interval must be at least 100ms',
            'number.max': 'Interval cannot exceed 60000ms (1 minute)',
        }),
        parameters: joi_1.default.array()
            .items(joi_1.default.object({
            index: joi_1.default.number().integer().min(0).max(65535).required(),
            subIndex: joi_1.default.number()
                .integer()
                .min(0)
                .max(255)
                .optional()
                .default(0),
        }))
            .optional()
            .default([])
            .messages({
            'array.base': 'Parameters must be an array',
        }),
    }),
};
exports.schemas = schemas;
// ============================================================================
// VALIDATION MIDDLEWARE FUNCTIONS
// ============================================================================
/**
 * Generic validation middleware factory
 */
function validate(schema, property = 'body') {
    return (req, res, next) => {
        const dataToValidate = property === 'params'
            ? req.params
            : property === 'query'
                ? req.query
                : property === 'body'
                    ? req.body
                    : req[property];
        const { error, value } = schema.validate(dataToValidate, {
            abortEarly: false, // Get all validation errors
            stripUnknown: true, // Remove unknown properties
            convert: true, // Convert strings to numbers where appropriate
        });
        if (error) {
            const validationError = new Error('Validation failed');
            validationError.isJoi = true;
            validationError.details = error.details.map((detail) => ({
                field: detail.path.join('.'),
                message: detail.message,
                value: detail.context?.value,
            }));
            return next(validationError);
        }
        // Replace the original data with validated/sanitized data
        if (property === 'params')
            req.params = value;
        else if (property === 'query')
            req.query = value;
        else if (property === 'body')
            req.body = value;
        else
            req[property] = value;
        next();
    };
}
// ============================================================================
// SPECIFIC VALIDATION MIDDLEWARE
// ============================================================================
const validateDeviceId = validate(schemas.deviceId, 'params');
exports.validateDeviceId = validateDeviceId;
const validateMasterHandle = validate(schemas.masterHandle, 'params');
exports.validateMasterHandle = validateMasterHandle;
const validateParameterIndex = validate(schemas.parameterIndex, 'params');
exports.validateParameterIndex = validateParameterIndex;
const validateParameterWrite = validate(schemas.parameterWrite, 'body');
exports.validateParameterWrite = validateParameterWrite;
const validateProcessDataWrite = validate(schemas.processDataWrite, 'body');
exports.validateProcessDataWrite = validateProcessDataWrite;
const validateMasterConnection = validate(schemas.masterConnection, 'body');
exports.validateMasterConnection = validateMasterConnection;
const validateQueryParams = validate(schemas.queryParams, 'query');
exports.validateQueryParams = validateQueryParams;
const validateStreamParams = validate(schemas.streamParams, 'body');
exports.validateStreamParams = validateStreamParams;
// ============================================================================
// CUSTOM VALIDATION FUNCTIONS
// ============================================================================
/**
 * Validate that device ID corresponds to a valid port
 */
function validatePortNumber(req, res, next) {
    const port = parseInt(req.params.deviceId || req.params.port);
    if (!(0, constants_1.isValidPort)(port)) {
        const error = new Error(`Invalid port number: ${port}. Must be between 1 and 8.`);
        error.isJoi = true;
        return next(error);
    }
    // Attach validated port to request
    req.validatedPort = port;
    next();
}
/**
 * Validate that master handle exists in request
 */
function validateMasterExists(req, res, next) {
    const masterHandle = parseInt(req.params.masterHandle || req.body.masterHandle);
    if (isNaN(masterHandle) || masterHandle < 0) {
        const error = new Error('Valid master handle is required');
        error.isJoi = true;
        return next(error);
    }
    req.validatedMasterHandle = masterHandle;
    next();
}
/**
 * Validate process data length
 */
function validateProcessDataLength(req, res, next) {
    const data = req.body.data;
    let length = 0;
    if (Array.isArray(data)) {
        length = data.length;
    }
    else if (typeof data === 'string') {
        length = Buffer.from(data, 'utf8').length;
    }
    else if (Buffer.isBuffer(data)) {
        length = data.length;
    }
    if (length > 32) {
        const error = new Error('Process data cannot exceed 32 bytes');
        error.isJoi = true;
        return next(error);
    }
    req.validatedDataLength = length;
    next();
}
/**
 * Sanitize and validate parameter value based on data type
 */
function validateParameterValue(req, res, next) {
    const { value, dataType } = req.body;
    if (!dataType) {
        // If no data type specified, try to infer it
        if (typeof value === 'number') {
            req.body.dataType = Number.isInteger(value) ? 'uint32' : 'float64';
        }
        else if (typeof value === 'string') {
            req.body.dataType = 'string';
        }
        else if (typeof value === 'boolean') {
            req.body.dataType = 'boolean';
        }
        else if (Array.isArray(value)) {
            req.body.dataType = 'bytes';
        }
    }
    // Additional validation based on data type could be added here
    next();
}
//# sourceMappingURL=validation.js.map