/**
 * Validation Middleware - TypeScript Port
 * Request validation using Joi schemas
 *
 * CRITICAL: Maintains exact validation behavior from JavaScript version
 */
import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            validatedPort?: number;
            validatedMasterHandle?: number;
            validatedDataLength?: number;
        }
    }
}
declare const schemas: {
    deviceId: Joi.ObjectSchema<any>;
    masterHandle: Joi.ObjectSchema<any>;
    parameterIndex: Joi.ObjectSchema<any>;
    parameterWrite: Joi.ObjectSchema<any>;
    processDataWrite: Joi.ObjectSchema<any>;
    masterConnection: Joi.ObjectSchema<any>;
    queryParams: Joi.ObjectSchema<any>;
    streamParams: Joi.ObjectSchema<any>;
};
/**
 * Generic validation middleware factory
 */
declare function validate(schema: Joi.ObjectSchema, property?: string): (req: Request, res: Response, next: NextFunction) => void;
declare const validateDeviceId: (req: Request, res: Response, next: NextFunction) => void;
declare const validateMasterHandle: (req: Request, res: Response, next: NextFunction) => void;
declare const validateParameterIndex: (req: Request, res: Response, next: NextFunction) => void;
declare const validateParameterWrite: (req: Request, res: Response, next: NextFunction) => void;
declare const validateProcessDataWrite: (req: Request, res: Response, next: NextFunction) => void;
declare const validateMasterConnection: (req: Request, res: Response, next: NextFunction) => void;
declare const validateQueryParams: (req: Request, res: Response, next: NextFunction) => void;
declare const validateStreamParams: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Validate that device ID corresponds to a valid port
 */
declare function validatePortNumber(req: Request, res: Response, next: NextFunction): void;
/**
 * Validate that master handle exists in request
 */
declare function validateMasterExists(req: Request, res: Response, next: NextFunction): void;
/**
 * Validate process data length
 */
declare function validateProcessDataLength(req: Request, res: Response, next: NextFunction): void;
/**
 * Sanitize and validate parameter value based on data type
 */
declare function validateParameterValue(req: Request, res: Response, next: NextFunction): void;
export { validateDeviceId, validateMasterHandle, validateParameterIndex, validateParameterWrite, validateProcessDataWrite, validateMasterConnection, validateQueryParams, validateStreamParams, validatePortNumber, validateMasterExists, validateProcessDataLength, validateParameterValue, validate, schemas, };
//# sourceMappingURL=validation.d.ts.map