"use strict";
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
const http = __importStar(require("http"));
let mainWindow = null;
let backendProcess = null;
// ============================================================================
// BACKEND SERVER MANAGEMENT
// ============================================================================
function checkServerHealth() {
    return new Promise((resolve) => {
        const req = http.get('http://localhost:3000/api/v1/health', (res) => {
            resolve(res.statusCode === 200);
        });
        req.on('error', () => {
            resolve(false);
        });
        req.setTimeout(1000, () => {
            req.destroy();
            resolve(false);
        });
    });
}
async function waitForServer(maxAttempts = 30) {
    console.log('Waiting for backend server to be ready...');
    for (let i = 0; i < maxAttempts; i++) {
        const isHealthy = await checkServerHealth();
        if (isHealthy) {
            console.log(`Backend server is ready! (attempt ${i + 1}/${maxAttempts})`);
            return;
        }
        console.log(`Waiting for backend... (attempt ${i + 1}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error('Backend server failed to start within timeout');
}
async function startBackendServer() {
    return new Promise((resolve, reject) => {
        console.log('Starting backend server as separate Node.js process...');
        const serverPath = path.join(__dirname, '../server.js');
        // Start backend with pure Node.js
        backendProcess = (0, child_process_1.spawn)('node', [serverPath], {
            env: {
                ...process.env,
                NODE_ENV: 'production',
                PORT: '3000',
            },
            shell: true,
            windowsHide: true, // Hide console window on Windows
        });
        // Capture stdout
        backendProcess.stdout?.on('data', (data) => {
            console.log(`[Backend] ${data.toString().trim()}`);
        });
        // Capture stderr
        backendProcess.stderr?.on('data', (data) => {
            console.error(`[Backend Error] ${data.toString().trim()}`);
        });
        backendProcess.on('error', (error) => {
            console.error('Failed to start backend server:', error);
            reject(error);
        });
        backendProcess.on('exit', (code) => {
            if (code !== 0 && code !== null) {
                console.error(`Backend process exited with code ${code}`);
            }
        });
        // Wait for server to be actually ready
        waitForServer()
            .then(resolve)
            .catch(reject);
    });
}
function stopBackendServer() {
    if (backendProcess) {
        console.log('Stopping backend server...');
        if (process.platform === 'win32') {
            // Windows needs special handling
            (0, child_process_1.spawn)('taskkill', ['/pid', backendProcess.pid.toString(), '/f', '/t']);
        }
        else {
            backendProcess.kill('SIGTERM');
        }
        backendProcess = null;
    }
}
// ============================================================================
// WINDOW MANAGEMENT
// ============================================================================
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: false,
        },
        icon: path.join(__dirname, '../../assets/icon.png'),
        show: false,
    });
    const rendererPath = path.join(__dirname, '../renderer/index.html');
    console.log('Loading renderer from:', rendererPath);
    mainWindow.loadFile(rendererPath);
    mainWindow.once('ready-to-show', () => {
        console.log('Window ready to show');
        mainWindow?.show();
    });
    mainWindow.webContents.openDevTools();
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    mainWindow.webContents.on('console-message', (event, level, message) => {
        console.log(`[Renderer] ${message}`);
    });
}
// ============================================================================
// APP LIFECYCLE
// ============================================================================
electron_1.app.whenReady().then(async () => {
    try {
        console.log('Electron app ready, starting backend...');
        await startBackendServer();
        console.log('Backend ready, creating window...');
        createWindow();
    }
    catch (error) {
        console.error('Failed to initialize app:', error);
        electron_1.app.quit();
    }
});
electron_1.app.on('window-all-closed', () => {
    stopBackendServer();
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
electron_1.app.on('before-quit', () => {
    stopBackendServer();
});
electron_1.app.on('will-quit', () => {
    stopBackendServer();
});
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    stopBackendServer();
    electron_1.app.quit();
});
//# sourceMappingURL=main.js.map