"use strict";
/**
 * Logger Utility
 * Centralized logging for the IO-Link backend
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("util");
const LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
};
class Logger {
    constructor() {
        this.logLevel = process.env.LOG_LEVEL || 'info';
        this.levels = LOG_LEVELS;
    }
    _shouldLog(level) {
        return this.levels[level] <= this.levels[this.logLevel];
    }
    _formatMessage(level, message, ...args) {
        const timestamp = new Date().toISOString();
        const formattedMessage = args.length > 0 ? (0, util_1.format)(message, ...args) : message;
        return `[${timestamp}] [${level.toUpperCase()}] ${formattedMessage}`;
    }
    _log(level, message, ...args) {
        if (!this._shouldLog(level))
            return;
        const formattedMessage = this._formatMessage(level, message, ...args);
        switch (level) {
            case 'error':
                console.error(formattedMessage);
                break;
            case 'warn':
                console.warn(formattedMessage);
                break;
            case 'info':
                console.info(formattedMessage);
                break;
            case 'debug':
                console.debug(formattedMessage);
                break;
            default:
                console.log(formattedMessage);
        }
    }
    error(message, ...args) {
        this._log('error', message, ...args);
    }
    warn(message, ...args) {
        this._log('warn', message, ...args);
    }
    info(message, ...args) {
        this._log('info', message, ...args);
    }
    debug(message, ...args) {
        this._log('debug', message, ...args);
    }
    // Convenience methods for API logging
    apiRequest(method, path, statusCode = null, duration = null) {
        const parts = [`${method} ${path}`];
        if (statusCode !== null)
            parts.push(`- ${statusCode}`);
        if (duration !== null)
            parts.push(`(${duration}ms)`);
        this.info(parts.join(' '));
    }
    apiError(method, path, error, statusCode = 500) {
        this.error(`${method} ${path} - ${statusCode} - ${error.message}`);
        if (error.stack && this.logLevel === 'debug') {
            this.debug('Stack trace:', error.stack);
        }
    }
    deviceOperation(operation, deviceId, port, result = 'success', details = null) {
        const message = `Device ${deviceId} Port ${port}: ${operation} - ${result}`;
        if (details) {
            this.info(`${message} - ${details}`);
        }
        else {
            this.info(message);
        }
    }
    deviceError(operation, deviceId, port, error) {
        this.error(`Device ${deviceId} Port ${port}: ${operation} failed - ${error.message}`);
    }
    masterOperation(operation, masterName, result = 'success', details = null) {
        const message = `Master ${masterName}: ${operation} - ${result}`;
        if (details) {
            this.info(`${message} - ${details}`);
        }
        else {
            this.info(message);
        }
    }
    streamEvent(deviceId, port, event, data = null) {
        const message = `Stream Device ${deviceId} Port ${port}: ${event}`;
        if (data) {
            this.debug(`${message} - ${JSON.stringify(data)}`);
        }
        else {
            this.debug(message);
        }
    }
    // Method to create child loggers with context
    child(context) {
        return new ChildLogger(this, context);
    }
    setLevel(level) {
        if (this.levels.hasOwnProperty(level)) {
            this.logLevel = level;
            this.info(`Log level changed to: ${level}`);
        }
        else {
            this.warn(`Invalid log level: ${level}. Valid levels: ${Object.keys(this.levels).join(', ')}`);
        }
    }
}
class ChildLogger {
    constructor(parent, context) {
        this.parent = parent;
        this.context = context;
    }
    _formatWithContext(message) {
        return `[${this.context}] ${message}`;
    }
    error(message, ...args) {
        this.parent.error(this._formatWithContext(message), ...args);
    }
    warn(message, ...args) {
        this.parent.warn(this._formatWithContext(message), ...args);
    }
    info(message, ...args) {
        this.parent.info(this._formatWithContext(message), ...args);
    }
    debug(message, ...args) {
        this.parent.debug(this._formatWithContext(message), ...args);
    }
}
// Create and export singleton logger instance
const logger = new Logger();
exports.default = logger;
//# sourceMappingURL=logger.js.map