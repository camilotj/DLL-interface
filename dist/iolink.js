"use strict";
/**
 * Export barrel for TMG IO-Link Interface
 * Provides clean public API matching original JavaScript module.exports
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PARAMETER_INDEX = exports.VALIDATION_MODES = exports.SENSOR_STATUS = exports.PORT_MODES = exports.RETURN_CODES = exports.resetGlobalRegistry = exports.getMasterState = exports.getConnectedDeviceInfo = exports.disconnectAllMasters = exports.discoverAllDevices = exports.streamDeviceData = exports.writeBlob = exports.readBlob = exports.readProductName = exports.readVendorName = exports.readSerialNumber = exports.readDeviceName = exports.writeDeviceParameter = exports.readDeviceParameter = exports.writeProcessData = exports.readProcessData = exports.scanMasterPorts = exports.checkPortStatus = exports.initializeMaster = exports.disconnect = exports.connect = exports.discoverMasters = void 0;
// Core Master Functions
var iolink_interface_1 = require("./iolink-interface");
Object.defineProperty(exports, "discoverMasters", { enumerable: true, get: function () { return iolink_interface_1.discoverMasters; } });
Object.defineProperty(exports, "connect", { enumerable: true, get: function () { return iolink_interface_1.connect; } });
Object.defineProperty(exports, "disconnect", { enumerable: true, get: function () { return iolink_interface_1.disconnect; } });
Object.defineProperty(exports, "initializeMaster", { enumerable: true, get: function () { return iolink_interface_1.initializeMaster; } });
// Port Management
var iolink_interface_2 = require("./iolink-interface");
Object.defineProperty(exports, "checkPortStatus", { enumerable: true, get: function () { return iolink_interface_2.checkPortStatus; } });
Object.defineProperty(exports, "scanMasterPorts", { enumerable: true, get: function () { return iolink_interface_2.scanMasterPorts; } });
// Process Data Communication
var iolink_interface_3 = require("./iolink-interface");
Object.defineProperty(exports, "readProcessData", { enumerable: true, get: function () { return iolink_interface_3.readProcessData; } });
Object.defineProperty(exports, "writeProcessData", { enumerable: true, get: function () { return iolink_interface_3.writeProcessData; } });
// Parameter Communication (ISDU)
var iolink_interface_4 = require("./iolink-interface");
Object.defineProperty(exports, "readDeviceParameter", { enumerable: true, get: function () { return iolink_interface_4.readDeviceParameter; } });
Object.defineProperty(exports, "writeDeviceParameter", { enumerable: true, get: function () { return iolink_interface_4.writeDeviceParameter; } });
Object.defineProperty(exports, "readDeviceName", { enumerable: true, get: function () { return iolink_interface_4.readDeviceName; } });
Object.defineProperty(exports, "readSerialNumber", { enumerable: true, get: function () { return iolink_interface_4.readSerialNumber; } });
Object.defineProperty(exports, "readVendorName", { enumerable: true, get: function () { return iolink_interface_4.readVendorName; } });
Object.defineProperty(exports, "readProductName", { enumerable: true, get: function () { return iolink_interface_4.readProductName; } });
// BLOB Communication
var iolink_interface_5 = require("./iolink-interface");
Object.defineProperty(exports, "readBlob", { enumerable: true, get: function () { return iolink_interface_5.readBlob; } });
Object.defineProperty(exports, "writeBlob", { enumerable: true, get: function () { return iolink_interface_5.writeBlob; } });
// Streaming Function
var iolink_interface_6 = require("./iolink-interface");
Object.defineProperty(exports, "streamDeviceData", { enumerable: true, get: function () { return iolink_interface_6.streamDeviceData; } });
// High-Level Functions
var iolink_interface_7 = require("./iolink-interface");
Object.defineProperty(exports, "discoverAllDevices", { enumerable: true, get: function () { return iolink_interface_7.discoverAllDevices; } });
Object.defineProperty(exports, "disconnectAllMasters", { enumerable: true, get: function () { return iolink_interface_7.disconnectAllMasters; } });
Object.defineProperty(exports, "getConnectedDeviceInfo", { enumerable: true, get: function () { return iolink_interface_7.getConnectedDeviceInfo; } });
// State Management
var iolink_interface_8 = require("./iolink-interface");
Object.defineProperty(exports, "getMasterState", { enumerable: true, get: function () { return iolink_interface_8.getMasterState; } });
Object.defineProperty(exports, "resetGlobalRegistry", { enumerable: true, get: function () { return iolink_interface_8.resetGlobalRegistry; } });
// Constants
var types_1 = require("./types");
Object.defineProperty(exports, "RETURN_CODES", { enumerable: true, get: function () { return types_1.RETURN_CODES; } });
Object.defineProperty(exports, "PORT_MODES", { enumerable: true, get: function () { return types_1.PORT_MODES; } });
Object.defineProperty(exports, "SENSOR_STATUS", { enumerable: true, get: function () { return types_1.SENSOR_STATUS; } });
Object.defineProperty(exports, "VALIDATION_MODES", { enumerable: true, get: function () { return types_1.VALIDATION_MODES; } });
Object.defineProperty(exports, "PARAMETER_INDEX", { enumerable: true, get: function () { return types_1.PARAMETER_INDEX; } });
//# sourceMappingURL=iolink.js.map