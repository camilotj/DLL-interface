/**
 * Validation Middleware - TypeScript Port
 * Request validation using Joi schemas
 *
 * CRITICAL: Maintains exact validation behavior from JavaScript version
 */

import Joi from "joi";
import { Request, Response, NextFunction } from "express";
import { isValidPort } from "../utils/constants";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ValidationError extends Error {
  isJoi: boolean;
  details?: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
}

// Extend Express Request with custom validation properties
declare global {
  namespace Express {
    interface Request {
      validatedPort?: number;
      validatedMasterHandle?: number;
      validatedDataLength?: number;
    }
  }
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const schemas = {
  // Device ID validation (port number)
  deviceId: Joi.object({
    deviceId: Joi.number().integer().min(1).max(8).required().messages({
      "number.base": "Device ID must be a number",
      "number.integer": "Device ID must be an integer",
      "number.min": "Device ID must be between 1 and 8",
      "number.max": "Device ID must be between 1 and 8",
      "any.required": "Device ID is required",
    }),
  }),

  // Master handle validation
  masterHandle: Joi.object({
    masterHandle: Joi.number().integer().min(0).required().messages({
      "number.base": "Master handle must be a number",
      "number.integer": "Master handle must be an integer",
      "number.min": "Master handle must be non-negative",
      "any.required": "Master handle is required",
    }),
  }),

  // Parameter index validation
  parameterIndex: Joi.object({
    index: Joi.number().integer().min(0).max(65535).required().messages({
      "number.base": "Parameter index must be a number",
      "number.integer": "Parameter index must be an integer",
      "number.min": "Parameter index must be non-negative",
      "number.max": "Parameter index must be less than 65536",
      "any.required": "Parameter index is required",
    }),
    subIndex: Joi.number()
      .integer()
      .min(0)
      .max(255)
      .optional()
      .default(0)
      .messages({
        "number.base": "Parameter sub-index must be a number",
        "number.integer": "Parameter sub-index must be an integer",
        "number.min": "Parameter sub-index must be non-negative",
        "number.max": "Parameter sub-index must be less than 256",
      }),
  }),

  // Parameter write validation
  parameterWrite: Joi.object({
    value: Joi.alternatives()
      .try(
        Joi.number(),
        Joi.string().max(256),
        Joi.array().items(Joi.number().integer().min(0).max(255)).max(256),
        Joi.boolean()
      )
      .required()
      .messages({
        "alternatives.match":
          "Value must be a number, string, byte array, or boolean",
        "any.required": "Parameter value is required",
      }),
    dataType: Joi.string()
      .valid(
        "uint8",
        "uint16",
        "uint32",
        "int8",
        "int16",
        "int32",
        "float32",
        "float64",
        "string",
        "bytes",
        "boolean"
      )
      .optional()
      .messages({
        "any.only":
          "Data type must be one of: uint8, uint16, uint32, int8, int16, int32, float32, float64, string, bytes, boolean",
      }),
  }),

  // Process data write validation
  processDataWrite: Joi.object({
    data: Joi.alternatives()
      .try(
        Joi.array().items(Joi.number().integer().min(0).max(255)).max(32),
        Joi.string().max(32)
      )
      .required()
      .messages({
        "alternatives.match":
          "Data must be a byte array or string (max 32 bytes)",
        "any.required": "Process data is required",
      }),
  }),

  // Master connection validation
  masterConnection: Joi.object({
    deviceName: Joi.string().min(1).max(100).required().messages({
      "string.base": "Device name must be a string",
      "string.min": "Device name cannot be empty",
      "string.max": "Device name too long (max 100 characters)",
      "any.required": "Device name is required",
    }),
  }),

  // Query parameters validation
  queryParams: Joi.object({
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .optional()
      .default(50)
      .messages({
        "number.base": "Limit must be a number",
        "number.integer": "Limit must be an integer",
        "number.min": "Limit must be at least 1",
        "number.max": "Limit cannot exceed 100",
      }),
    offset: Joi.number().integer().min(0).optional().default(0).messages({
      "number.base": "Offset must be a number",
      "number.integer": "Offset must be an integer",
      "number.min": "Offset must be non-negative",
    }),
    includeDisconnected: Joi.boolean().optional().default(false).messages({
      "boolean.base": "includeDisconnected must be true or false",
    }),
  }),

  // Streaming parameters validation
  streamParams: Joi.object({
    interval: Joi.number()
      .integer()
      .min(100)
      .max(60000)
      .optional()
      .default(1000)
      .messages({
        "number.base": "Interval must be a number",
        "number.integer": "Interval must be an integer",
        "number.min": "Interval must be at least 100ms",
        "number.max": "Interval cannot exceed 60000ms (1 minute)",
      }),
    parameters: Joi.array()
      .items(
        Joi.object({
          index: Joi.number().integer().min(0).max(65535).required(),
          subIndex: Joi.number()
            .integer()
            .min(0)
            .max(255)
            .optional()
            .default(0),
        })
      )
      .optional()
      .default([])
      .messages({
        "array.base": "Parameters must be an array",
      }),
  }),
};

// ============================================================================
// VALIDATION MIDDLEWARE FUNCTIONS
// ============================================================================

/**
 * Generic validation middleware factory
 */
function validate(schema: Joi.ObjectSchema, property: string = "body") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const dataToValidate =
      property === "params"
        ? req.params
        : property === "query"
        ? req.query
        : property === "body"
        ? req.body
        : (req as any)[property];

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false, // Get all validation errors
      stripUnknown: true, // Remove unknown properties
      convert: true, // Convert strings to numbers where appropriate
    });

    if (error) {
      const validationError: ValidationError = new Error(
        "Validation failed"
      ) as ValidationError;
      validationError.isJoi = true;
      validationError.details = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
        value: detail.context?.value,
      }));
      return next(validationError);
    }

    // Replace the original data with validated/sanitized data
    if (property === "params") req.params = value;
    else if (property === "query") {
      // For query parameters, we need to handle readonly property carefully
      Object.keys(value).forEach((key) => {
        (req.query as any)[key] = (value as any)[key];
      });
    } else if (property === "body") req.body = value;
    else (req as any)[property] = value;

    next();
  };
}

// ============================================================================
// SPECIFIC VALIDATION MIDDLEWARE
// ============================================================================

const validateDeviceId = validate(schemas.deviceId, "params");
const validateMasterHandle = validate(schemas.masterHandle, "params");
const validateParameterIndex = validate(schemas.parameterIndex, "params");
const validateParameterWrite = validate(schemas.parameterWrite, "body");
const validateProcessDataWrite = validate(schemas.processDataWrite, "body");
const validateMasterConnection = validate(schemas.masterConnection, "body");
const validateQueryParams = validate(schemas.queryParams, "query");
const validateStreamParams = validate(schemas.streamParams, "body");

// ============================================================================
// CUSTOM VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate that device ID corresponds to a valid port
 */
function validatePortNumber(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const port = parseInt((req.params as any).deviceId || req.params.port);

  if (!isValidPort(port)) {
    const error: ValidationError = new Error(
      `Invalid port number: ${port}. Must be between 1 and 8.`
    ) as ValidationError;
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
function validateMasterExists(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const masterHandle = parseInt(
    (req.params as any).masterHandle || req.body.masterHandle
  );

  if (isNaN(masterHandle) || masterHandle < 0) {
    const error: ValidationError = new Error(
      "Valid master handle is required"
    ) as ValidationError;
    error.isJoi = true;
    return next(error);
  }

  req.validatedMasterHandle = masterHandle;
  next();
}

/**
 * Validate process data length
 */
function validateProcessDataLength(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const data = req.body.data;
  let length = 0;

  if (Array.isArray(data)) {
    length = data.length;
  } else if (typeof data === "string") {
    length = Buffer.from(data, "utf8").length;
  } else if (Buffer.isBuffer(data)) {
    length = data.length;
  }

  if (length > 32) {
    const error: ValidationError = new Error(
      "Process data cannot exceed 32 bytes"
    ) as ValidationError;
    error.isJoi = true;
    return next(error);
  }

  req.validatedDataLength = length;
  next();
}

/**
 * Sanitize and validate parameter value based on data type
 */
function validateParameterValue(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { value, dataType } = req.body;

  if (!dataType) {
    // If no data type specified, try to infer it
    if (typeof value === "number") {
      req.body.dataType = Number.isInteger(value) ? "uint32" : "float64";
    } else if (typeof value === "string") {
      req.body.dataType = "string";
    } else if (typeof value === "boolean") {
      req.body.dataType = "boolean";
    } else if (Array.isArray(value)) {
      req.body.dataType = "bytes";
    }
  }

  // Additional validation based on data type could be added here
  next();
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  // Schema validation middleware
  validateDeviceId,
  validateMasterHandle,
  validateParameterIndex,
  validateParameterWrite,
  validateProcessDataWrite,
  validateMasterConnection,
  validateQueryParams,
  validateStreamParams,
  // Custom validation middleware
  validatePortNumber,
  validateMasterExists,
  validateProcessDataLength,
  validateParameterValue,
  // Generic validation function
  validate,
  // Schemas for direct use
  schemas,
};
