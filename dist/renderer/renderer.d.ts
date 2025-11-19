/**
 * Renderer Process
 * Frontend logic for the Electron app
 */
declare let serverInfo: {
    host: string;
    port: number;
    url: string;
} | null;
declare const activityLog: string[];
/**
 * Initialize the application
 */
declare function init(): Promise<void>;
/**
 * Setup navigation between views
 */
declare function setupNavigation(): void;
/**
 * Setup button event listeners
 */
declare function setupButtons(): void;
/**
 * Check server connection
 */
declare function checkServerConnection(): Promise<void>;
/**
 * Discover IO-Link masters
 */
declare function discoverMasters(): Promise<void>;
/**
 * Display masters in the UI
 */
declare function displayMasters(masters: any[]): void;
/**
 * Refresh all data
 */
declare function refreshData(): Promise<void>;
/**
 * Add entry to activity log
 */
declare function log(message: string): void;
//# sourceMappingURL=renderer.d.ts.map