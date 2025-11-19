/**
 * Electron Preload Script
 * Exposes safe APIs to the renderer process
 */
export interface ElectronAPI {
    getServerInfo: () => Promise<{
        host: string;
        port: number;
        url: string;
    }>;
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
//# sourceMappingURL=preload.d.ts.map