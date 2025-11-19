/**
 * Electron Main Process
 * Manages application lifecycle and window creation
 */

import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;
let backendProcess: ChildProcess | null = null;

// Server configuration
const BACKEND_PORT = 3000;
const BACKEND_HOST = 'localhost';

/**
 * Start the Node.js backend server
 */
function startBackendServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    const serverScript = path.join(__dirname, '../server.js');
    
    console.log('Starting backend server:', serverScript);

    backendProcess = spawn('node', [serverScript], {
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
function stopBackendServer(): void {
  if (backendProcess) {
    console.log('Stopping backend server...');
    backendProcess.kill();
    backendProcess = null;
  }
}

/**
 * Create the main application window
 */
async function createMainWindow(): Promise<void> {
  // Start backend server first
  await startBackendServer();

  // Create the browser window
  mainWindow = new BrowserWindow({
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
  } else {
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
function createMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
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

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ============================================================================
// APP LIFECYCLE
// ============================================================================

// When Electron has finished initialization
app.whenReady().then(createMainWindow);

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    stopBackendServer();
    app.quit();
  }
});

// On macOS, re-create window when dock icon is clicked
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

// Clean up before quit
app.on('before-quit', () => {
  stopBackendServer();
});

// ============================================================================
// IPC HANDLERS
// ============================================================================

// Get server info
ipcMain.handle('get-server-info', async () => {
  return {
    host: BACKEND_HOST,
    port: BACKEND_PORT,
    url: `http://${BACKEND_HOST}:${BACKEND_PORT}`
  };
});

// Get app version
ipcMain.handle('get-app-version', async () => {
  return app.getVersion();
});