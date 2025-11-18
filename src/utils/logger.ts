/**
 * Logger Utility
 * Centralized logging for the IO-Link backend
 * 
 */

import { format } from 'util';

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

class Logger {
  private logLevel: LogLevel;
  private levels: Record<LogLevel, number>;

  constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
    this.levels = LOG_LEVELS;
  }

  private _shouldLog(level: LogLevel): boolean {
    return this.levels[level] <= this.levels[this.logLevel];
  }

  private _formatMessage(level: LogLevel, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const formattedMessage =
      args.length > 0 ? format(message, ...args) : message;
    return `[${timestamp}] [${level.toUpperCase()}] ${formattedMessage}`;
  }

  private _log(level: LogLevel, message: string, ...args: any[]): void {
    if (!this._shouldLog(level)) return;

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

  error(message: string, ...args: any[]): void {
    this._log('error', message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this._log('warn', message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this._log('info', message, ...args);
  }

  debug(message: string, ...args: any[]): void {
    this._log('debug', message, ...args);
  }

  // Convenience methods for API logging
  apiRequest(method: string, path: string, statusCode: number | null = null, duration: number | null = null): void {
    const parts: string[] = [`${method} ${path}`];
    if (statusCode !== null) parts.push(`- ${statusCode}`);
    if (duration !== null) parts.push(`(${duration}ms)`);
    this.info(parts.join(' '));
  }

  apiError(method: string, path: string, error: Error, statusCode: number = 500): void {
    this.error(`${method} ${path} - ${statusCode} - ${error.message}`);
    if (error.stack && this.logLevel === 'debug') {
      this.debug('Stack trace:', error.stack);
    }
  }

  deviceOperation(
    operation: string,
    deviceId: string | number,
    port: number,
    result: string = 'success',
    details: string | null = null
  ): void {
    const message = `Device ${deviceId} Port ${port}: ${operation} - ${result}`;
    if (details) {
      this.info(`${message} - ${details}`);
    } else {
      this.info(message);
    }
  }

  deviceError(operation: string, deviceId: string | number, port: number, error: Error): void {
    this.error(
      `Device ${deviceId} Port ${port}: ${operation} failed - ${error.message}`
    );
  }

  masterOperation(operation: string, masterName: string, result: string = 'success', details: string | null = null): void {
    const message = `Master ${masterName}: ${operation} - ${result}`;
    if (details) {
      this.info(`${message} - ${details}`);
    } else {
      this.info(message);
    }
  }

  streamEvent(deviceId: string | number, port: number, event: string, data: any = null): void {
    const message = `Stream Device ${deviceId} Port ${port}: ${event}`;
    if (data) {
      this.debug(`${message} - ${JSON.stringify(data)}`);
    } else {
      this.debug(message);
    }
  }

  // Method to create child loggers with context
  child(context: string): ChildLogger {
    return new ChildLogger(this, context);
  }

  setLevel(level: string): void {
    if (this.levels.hasOwnProperty(level)) {
      this.logLevel = level as LogLevel;
      this.info(`Log level changed to: ${level}`);
    } else {
      this.warn(
        `Invalid log level: ${level}. Valid levels: ${Object.keys(
          this.levels
        ).join(', ')}`
      );
    }
  }
}

class ChildLogger {
  private parent: Logger;
  private context: string;

  constructor(parent: Logger, context: string) {
    this.parent = parent;
    this.context = context;
  }

  private _formatWithContext(message: string): string {
    return `[${this.context}] ${message}`;
  }

  error(message: string, ...args: any[]): void {
    this.parent.error(this._formatWithContext(message), ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.parent.warn(this._formatWithContext(message), ...args);
  }

  info(message: string, ...args: any[]): void {
    this.parent.info(this._formatWithContext(message), ...args);
  }

  debug(message: string, ...args: any[]): void {
    this.parent.debug(this._formatWithContext(message), ...args);
  }
}

// Create and export singleton logger instance
const logger = new Logger();

export default logger;
