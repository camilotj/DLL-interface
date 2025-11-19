/**
 * Electron Preload Script
 * Exposes safe APIs to the renderer process
 */

import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Server information
  getServerInfo: () => ipcRenderer.invoke('get-server-info'),
  
  // App information
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Platform information
  platform: process.platform,
  
  // Node environment
  nodeVersion: process.versions.node,
  chromeVersion: process.versions.chrome,
  electronVersion: process.versions.electron
});

// Type definitions for TypeScript
export interface ElectronAPI {
  getServerInfo: () => Promise<{ host: string; port: number; url: string }>;
  getAppVersion: () => Promise<string>;
  platform: NodeJS.Platform;
  nodeVersion: string;
  chromeVersion: string;
  electronVersion: string;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}