/**
 * Renderer Process - Frontend Logic
 * Handles UI interactions and API communication
 */
declare const API_BASE_URL = "http://localhost:3000/api/v1";
declare const API_HEADERS: {
    'Content-Type': string;
};
declare let selectedMaster: string | null;
declare let selectedPort: number | null;
declare let connectedMastersCount: number;
declare let activeDevicesCount: number;
declare let statusElement: HTMLDivElement;
declare let mastersListElement: HTMLDivElement;
declare let devicesListElement: HTMLDivElement;
declare let processDataElement: HTMLDivElement;
declare let refreshMastersBtn: HTMLButtonElement;
declare let refreshDevicesBtn: HTMLButtonElement;
declare let refreshProcessDataBtn: HTMLButtonElement;
declare let masterCountElement: HTMLParagraphElement;
declare let deviceCountElement: HTMLParagraphElement;
declare let activityLogElement: HTMLDivElement;
declare const MAX_LOG_ENTRIES = 100;
declare const activityLogEntries: Array<{
    timestamp: Date;
    message: string;
    type: string;
}>;
declare function addActivityLog(message: string, type?: 'info' | 'success' | 'error' | 'warning'): void;
declare function updateActivityLogDisplay(): void;
declare function updateDashboardStats(): void;
declare function fetchMasters(): Promise<any[]>;
declare function connectToMaster(deviceName: string): Promise<any>;
declare function fetchDevices(): Promise<any[]>;
declare function updateStatus(message: string, type?: 'info' | 'success' | 'error' | 'warning'): void;
declare function displayMasters(masters: any[]): void;
declare function displayDevices(devices: any[]): void;
declare function handleDeviceSelect(master: number, port: number): Promise<void>;
declare function fetchProcessData(master: string, port: number): Promise<any>;
declare function displayProcessData(data: any): void;
declare function handleMasterSelect(deviceName: string): Promise<void>;
declare function loadMasters(): Promise<void>;
declare function loadDevices(): Promise<void>;
declare function loadProcessData(): Promise<void>;
declare function initialize(): Promise<void>;
//# sourceMappingURL=renderer.d.ts.map