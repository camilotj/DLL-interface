import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';
import * as http from 'http';

let mainWindow: BrowserWindow | null = null;
let backendProcess: ChildProcess | null = null;

// ============================================================================
// BACKEND SERVER MANAGEMENT
// ============================================================================

function checkServerHealth(): Promise<boolean> {
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

async function waitForServer(maxAttempts: number = 30): Promise<void> {
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

async function startBackendServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('Starting backend server as separate Node.js process...');

    const serverPath = path.join(__dirname, '../server.js');
    
    // Start backend with pure Node.js
    backendProcess = spawn('node', [serverPath], {
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

function stopBackendServer(): void {
  if (backendProcess) {
    console.log('Stopping backend server...');
    
    if (process.platform === 'win32') {
      // Windows needs special handling
      spawn('taskkill', ['/pid', backendProcess.pid!.toString(), '/f', '/t']);
    } else {
      backendProcess.kill('SIGTERM');
    }
    
    backendProcess = null;
  }
}

// ============================================================================
// WINDOW MANAGEMENT
// ============================================================================

function createWindow(): void {
  mainWindow = new BrowserWindow({
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

app.whenReady().then(async () => {
  try {
    console.log('Electron app ready, starting backend...');
    await startBackendServer();
    console.log('Backend ready, creating window...');
    createWindow();
  } catch (error) {
    console.error('Failed to initialize app:', error);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  stopBackendServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  stopBackendServer();
});

app.on('will-quit', () => {
  stopBackendServer();
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  stopBackendServer();
  app.quit();
});