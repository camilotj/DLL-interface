"use strict";
/**
 * Electron Preload Script
 * Exposes safe APIs to the renderer process
 */
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Server information
    getServerInfo: () => electron_1.ipcRenderer.invoke('get-server-info'),
    // App information
    getAppVersion: () => electron_1.ipcRenderer.invoke('get-app-version'),
    // Platform information
    platform: process.platform,
    // Node environment
    nodeVersion: process.versions.node,
    chromeVersion: process.versions.chrome,
    electronVersion: process.versions.electron
});
//# sourceMappingURL=preload.js.map