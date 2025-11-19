"use strict";
/**
 * Electron Main Process
 * Manages application lifecycle and window creation
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
    electron_1.app.quit();
}
let mainWindow = null;
let backendProcess = null;
// Server configuration
const BACKEND_PORT = 3000;
const BACKEND_HOST = 'localhost';
/**
 * Start the Node.js backend server
 */
function startBackendServer() {
    return new Promise((resolve, reject) => {
        const serverScript = path.join(__dirname, '../server.js');
        console.log('Starting backend server:', serverScript);
        backendProcess = (0, child_process_1.spawn)('node', [serverScript], {
            env: {
                ...process.env,
                PORT: BACKEND_PORT.toString(),
                NODE_ENV: 'production',
                ELECTRON_MODE: 'true'
            },
            stdio: 'inherit'
        });
        backendProcess.on('error', (err) => {
            console.error('Failed to start backend server:', err);
            reject(err);
        });
        // Wait a bit for server to start
        setTimeout(() => {
            console.log('Backend server should be running on port', BACKEND_PORT);
            resolve();
        }, 2000);
    });
}
/**
 * Stop the backend server
 */
function stopBackendServer() {
    if (backendProcess) {
        console.log('Stopping backend server...');
        backendProcess.kill();
        backendProcess = null;
    }
}
/**
 * Create the main application window
 */
async function createMainWindow() {
    // Start backend server first
    await startBackendServer();
    // Create the browser window
    mainWindow = new electron_1.BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 600,
        title: 'TMG IO-Link Interface',
        backgroundColor: '#1e1e1e',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            devTools: true
        },
        show: false // Don't show until ready-to-show
    });
    // Load the frontend
    if (process.env.NODE_ENV === 'development') {
        // In development, load from webpack dev server or file
        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }
    else {
        // In production, load from built files
        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }
    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
        mainWindow?.focus();
    });
    // Open DevTools in development
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }
    // Handle window closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    // Create application menu
    createMenu();
}
/**
 * Create application menu
 */
function createMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Quit',
                    accelerator: 'CmdOrCtrl+Q',
                    click: () => {
                        electron_1.app.quit();
                    }
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                { role: 'close' }
            ]
        }
    ];
    const menu = electron_1.Menu.buildFromTemplate(template);
    electron_1.Menu.setApplicationMenu(menu);
}
// ============================================================================
// APP LIFECYCLE
// ============================================================================
// When Electron has finished initialization
electron_1.app.whenReady().then(createMainWindow);
// Quit when all windows are closed (except on macOS)
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        stopBackendServer();
        electron_1.app.quit();
    }
});
// On macOS, re-create window when dock icon is clicked
electron_1.app.on('activate', () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
});
// Clean up before quit
electron_1.app.on('before-quit', () => {
    stopBackendServer();
});
// ============================================================================
// IPC HANDLERS
// ============================================================================
// Get server info
electron_1.ipcMain.handle('get-server-info', async () => {
    return {
        host: BACKEND_HOST,
        port: BACKEND_PORT,
        url: `http://${BACKEND_HOST}:${BACKEND_PORT}`
    };
});
// Get app version
electron_1.ipcMain.handle('get-app-version', async () => {
    return electron_1.app.getVersion();
});
//# sourceMappingURL=main.js.map