/**
 * Renderer Process - Frontend Logic
 * Handles UI interactions and API communication
 */

// Configuration
const API_BASE_URL = 'http://localhost:3000/api/v1';
const API_HEADERS = {
  'Content-Type': 'application/json',
};

// State
let selectedMaster: string | null = null;
let selectedPort: number | null = null;
let connectedMastersCount: number = 0;
let activeDevicesCount: number = 0;

// UI Elements - will be initialized after DOM loads
let statusElement: HTMLDivElement;
let mastersListElement: HTMLDivElement;
let devicesListElement: HTMLDivElement;
let processDataElement: HTMLDivElement;
let refreshMastersBtn: HTMLButtonElement;
let refreshDevicesBtn: HTMLButtonElement;
let refreshProcessDataBtn: HTMLButtonElement;
let masterCountElement: HTMLParagraphElement;
let deviceCountElement: HTMLParagraphElement;
let activityLogElement: HTMLDivElement;

// Activity log settings
const MAX_LOG_ENTRIES = 100;
const activityLogEntries: Array<{ timestamp: Date; message: string; type: string }> = [];

// ============================================================================
// ACTIVITY LOG FUNCTIONS
// ============================================================================

function addActivityLog(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info'): void {
  const entry = {
    timestamp: new Date(),
    message,
    type,
  };

  // Add to array
  activityLogEntries.unshift(entry);

  // Keep only last MAX_LOG_ENTRIES
  if (activityLogEntries.length > MAX_LOG_ENTRIES) {
    activityLogEntries.pop();
  }

  // Update display
  updateActivityLogDisplay();

  // Also log to console
  console.log(`[Activity] [${type.toUpperCase()}] ${message}`);
}

function updateActivityLogDisplay(): void {
  if (!activityLogElement) return;

  if (activityLogEntries.length === 0) {
    activityLogElement.innerHTML = '<p class="log-empty">No activity yet</p>';
    return;
  }

  const logHtml = activityLogEntries
    .map((entry) => {
      const time = entry.timestamp.toLocaleTimeString();
      return `
        <div class="log-entry log-${entry.type}">
          <span class="log-time">${time}</span>
          <span class="log-message">${entry.message}</span>
        </div>
      `;
    })
    .join('');

  activityLogElement.innerHTML = logHtml;

  // Auto-scroll to top (newest entries)
  activityLogElement.scrollTop = 0;
}

// ============================================================================
// STATS UPDATE FUNCTIONS
// ============================================================================

function updateDashboardStats(): void {
  if (masterCountElement) {
    masterCountElement.textContent = connectedMastersCount.toString();
  }

  if (deviceCountElement) {
    deviceCountElement.textContent = activeDevicesCount.toString();
  }

  console.log(
    `Stats updated - Masters: ${connectedMastersCount}, Devices: ${activeDevicesCount}`
  );
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function fetchMasters(): Promise<any[]> {
  try {
    updateStatus('Discovering IO-Link Masters...', 'info');
    addActivityLog('Scanning for IO-Link Masters...', 'info');

    const response = await fetch(`${API_BASE_URL}/masters`, {
      method: 'GET',
      headers: API_HEADERS,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const result = await response.json();
    const masters = result.data || [];

    updateStatus(`Found ${result.count} master(s)`, 'success');
    addActivityLog(
      `Discovered ${result.count} IO-Link Master${result.count !== 1 ? 's' : ''}`,
      'success'
    );

    return masters;
  } catch (error: any) {
    updateStatus(`Error discovering masters: ${error.message}`, 'error');
    addActivityLog(`Failed to discover masters: ${error.message}`, 'error');
    console.error('Failed to fetch masters:', error);
    return [];
  }
}

async function connectToMaster(deviceName: string): Promise<any> {
  try {
    updateStatus(`Connecting to master: ${deviceName}...`, 'info');
    addActivityLog(`Connecting to master ${deviceName}...`, 'info');

    const response = await fetch(`${API_BASE_URL}/masters/connect`, {
      method: 'POST',
      headers: API_HEADERS,
      body: JSON.stringify({ deviceName }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const result = await response.json();

    // Increment connected masters count
    connectedMastersCount++;
    updateDashboardStats();

    updateStatus(`Connected to master: ${deviceName}`, 'success');
    addActivityLog(`Successfully connected to master ${deviceName}`, 'success');

    return result.data;
  } catch (error: any) {
    updateStatus(`Error connecting to master: ${error.message}`, 'error');
    addActivityLog(
      `Connection failed for ${deviceName}: ${error.message}`,
      'error'
    );
    console.error('Failed to connect to master:', error);
    throw error;
  }
}

async function fetchDevices(): Promise<any[]> {
  try {
    updateStatus('Fetching connected devices...', 'info');
    addActivityLog('Fetching device list...', 'info');

    const response = await fetch(`${API_BASE_URL}/devices`, {
      method: 'GET',
      headers: API_HEADERS,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const result = await response.json();
    const devices = result.data || [];

    // Update active devices count
    activeDevicesCount = devices.filter(
      (d: any) => d.status?.connected
    ).length;
    updateDashboardStats();

    updateStatus(`Found ${result.count} device(s)`, 'success');
    addActivityLog(
      `Found ${devices.length} device${devices.length !== 1 ? 's' : ''} (${activeDevicesCount} active)`,
      'success'
    );

    return devices;
  } catch (error: any) {
    updateStatus(`Error fetching devices: ${error.message}`, 'error');
    addActivityLog(`Failed to fetch devices: ${error.message}`, 'error');
    console.error('Failed to fetch devices:', error);
    return [];
  }
}

// ============================================================================
// UI UPDATE FUNCTIONS
// ============================================================================

function updateStatus(
  message: string,
  type: 'info' | 'success' | 'error' | 'warning' = 'info'
): void {
  if (!statusElement) {
    console.warn('Status element not found!');
    return;
  }

  const timestamp = new Date().toLocaleTimeString();
  const statusClass = `status-${type}`;

  statusElement.className = `status ${statusClass}`;
  statusElement.innerHTML = `
    <span class="status-message">${message}</span>
    <span class="status-time">${timestamp}</span>
  `;

  console.log(`[Status] ${message}`);
}

function displayMasters(masters: any[]): void {
  if (!mastersListElement) {
    console.warn('Masters list element not found!');
    return;
  }

  console.log(`Displaying ${masters.length} masters`);

  if (masters.length === 0) {
    mastersListElement.innerHTML =
      '<p class="empty-state">No IO-Link Masters found</p>';
    return;
  }

  mastersListElement.innerHTML = masters
    .map(
      (master) => `
    <div class="master-card" data-device-name="${master.name}">
      <div class="master-header">
        <h3>${master.viewName || master.name}</h3>
        <span class="master-status">Available</span>
      </div>
      <div class="master-details">
        <p><strong>Device Name:</strong> ${master.name}</p>
        <p><strong>Product Code:</strong> ${master.productCode}</p>
      </div>
      <button class="btn btn-primary" onclick="window.handleMasterSelect('${master.name}')">
        Select Master
      </button>
    </div>
  `
    )
    .join('');
}

function displayDevices(devices: any[]): void {
  if (!devicesListElement) return;

  if (devices.length === 0) {
    devicesListElement.innerHTML =
      '<p class="empty-state">No devices connected</p>';
    return;
  }

  devicesListElement.innerHTML = devices
    .map(
      (device) => `
    <div class="device-card" data-port="${device.port}" data-master="${device.master}">
      <div class="device-header">
        <h4>Port ${device.port}</h4>
        <span class="device-status ${device.status?.connected ? 'connected' : 'disconnected'}">
          ${device.status?.connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      <div class="device-details">
        <p><strong>Master Handle:</strong> ${device.master}</p>
        <p><strong>Vendor:</strong> ${device.vendorName || 'Unknown'}</p>
        <p><strong>Device:</strong> ${device.deviceName || 'Unknown'}</p>
        <p><strong>Vendor ID:</strong> ${device.vendorId || 'N/A'}</p>
        <p><strong>Device ID:</strong> ${device.deviceId || 'N/A'}</p>
        ${device.serialNumber ? `<p><strong>Serial:</strong> ${device.serialNumber}</p>` : ''}
      </div>
      <button class="btn btn-secondary" onclick="window.handleDeviceSelect(${device.master}, ${device.port})">
        Read Process Data
      </button>
    </div>
  `
    )
    .join('');
}

async function handleDeviceSelect(
  master: number,
  port: number
): Promise<void> {
  console.log(`Device selected: master=${master}, port=${port}`);
  selectedMaster = master.toString();
  selectedPort = port;
  await loadProcessData();
}

async function fetchProcessData(master: string, port: number): Promise<any> {
  try {
    updateStatus(`Reading process data from ${master}:${port}...`, 'info');
    addActivityLog(`Reading process data from master ${master} port ${port}...`, 'info');

    const response = await fetch(
      `${API_BASE_URL}/data/${master}/${port}/process`,
      {
        method: 'GET',
        headers: API_HEADERS,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const result = await response.json();
    const data = result.data;

    updateStatus(`Process data retrieved from ${master}:${port}`, 'success');
    addActivityLog(
      `Process data read: ${data.data.length} bytes from master ${master} port ${port}`,
      'success'
    );

    return data;
  } catch (error: any) {
    updateStatus(`Error reading process data: ${error.message}`, 'error');
    addActivityLog(
      `Process data read failed: ${error.message}`,
      'error'
    );
    console.error('Failed to fetch process data:', error);
    return null;
  }
}

function displayProcessData(data: any): void {
  if (!processDataElement) return;

  if (!data) {
    processDataElement.innerHTML =
      '<p class="empty-state">No process data available</p>';
    return;
  }

  const dataArray = Array.from(data.data || []);
  const hexString = dataArray
    .map((b: any) => b.toString(16).padStart(2, '0'))
    .join(' ');

  processDataElement.innerHTML = `
    <div class="process-data-display">
      <div class="data-header">
        <h4>Process Data - Port ${data.port}</h4>
        <span class="data-timestamp">${new Date(data.timestamp).toLocaleTimeString()}</span>
      </div>
      <div class="data-content">
        <div class="data-row">
          <span class="data-label">Hex:</span>
          <span class="data-value monospace">${hexString}</span>
        </div>
        <div class="data-row">
          <span class="data-label">Decimal:</span>
          <span class="data-value">${dataArray.join(', ')}</span>
        </div>
        <div class="data-row">
          <span class="data-label">Length:</span>
          <span class="data-value">${dataArray.length} bytes</span>
        </div>
        <div class="data-row">
          <span class="data-label">Status:</span>
          <span class="data-value">0x${(data.status || 0).toString(16).toUpperCase()}</span>
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

async function handleMasterSelect(deviceName: string): Promise<void> {
  try {
    console.log(`Selecting master: ${deviceName}`);
    selectedMaster = deviceName;
    await connectToMaster(deviceName);
    await loadDevices();
  } catch (error: any) {
    console.error('Error selecting master:', error);
  }
}

async function loadMasters(): Promise<void> {
  const masters = await fetchMasters();
  displayMasters(masters);
}

async function loadDevices(): Promise<void> {
  const devices = await fetchDevices();
  displayDevices(devices);
}

async function loadProcessData(): Promise<void> {
  if (!selectedMaster || !selectedPort) {
    updateStatus('Please select a device first', 'warning');
    addActivityLog('No device selected for process data read', 'warning');
    return;
  }

  const data = await fetchProcessData(selectedMaster, selectedPort);
  displayProcessData(data);
}

// ============================================================================
// INITIALIZATION
// ============================================================================

async function initialize(): Promise<void> {
  console.log('Initializing application...');
  addActivityLog('Application starting...', 'info');

  // Get DOM elements
  statusElement = document.getElementById('status') as HTMLDivElement;
  mastersListElement = document.getElementById(
    'masters-list'
  ) as HTMLDivElement;
  devicesListElement = document.getElementById(
    'devices-list'
  ) as HTMLDivElement;
  processDataElement = document.getElementById(
    'process-data'
  ) as HTMLDivElement;
  refreshMastersBtn = document.getElementById(
    'refresh-masters'
  ) as HTMLButtonElement;
  refreshDevicesBtn = document.getElementById(
    'refresh-devices'
  ) as HTMLButtonElement;
  refreshProcessDataBtn = document.getElementById(
    'refresh-process-data'
  ) as HTMLButtonElement;
  masterCountElement = document.getElementById(
    'master-count'
  ) as HTMLParagraphElement;
  deviceCountElement = document.getElementById(
    'device-count'
  ) as HTMLParagraphElement;
  activityLogElement = document.getElementById(
    'activity-log'
  ) as HTMLDivElement;

  if (!statusElement) {
    console.error('Critical: Status element not found in DOM!');
    return;
  }

  try {
    updateStatus('Connecting to backend server...', 'info');
    addActivityLog('Connecting to backend server...', 'info');

    // Wait for backend with retries
    let isHealthy = false;
    const maxAttempts = 10;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`Health check attempt ${attempt}/${maxAttempts}`);
      updateStatus(
        `Connecting to server... (${attempt}/${maxAttempts})`,
        'info'
      );

      try {
        const response = await fetch(`${API_BASE_URL}/health`, {
          method: 'GET',
          headers: API_HEADERS,
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            isHealthy = true;
            console.log('Backend health check SUCCESS');
            break;
          }
        }
      } catch (error) {
        console.error(`Health check ${attempt} failed:`, error);
      }

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    if (!isHealthy) {
      updateStatus('Backend server is not responding. Please restart.', 'error');
      addActivityLog('Backend server connection failed', 'error');
      return;
    }

    updateStatus('Backend server connected successfully!', 'success');
    addActivityLog('Backend server connected successfully', 'success');

    // Initialize stats
    updateDashboardStats();

    // Setup event listeners for action buttons
    if (refreshMastersBtn) {
      refreshMastersBtn.addEventListener('click', () => {
        console.log('Refresh masters button clicked');
        addActivityLog('Refreshing masters list...', 'info');
        loadMasters().catch((err) => {
          console.error('Error loading masters:', err);
          updateStatus('Failed to load masters', 'error');
        });
      });
    }

    if (refreshDevicesBtn) {
      refreshDevicesBtn.addEventListener('click', () => {
        addActivityLog('Refreshing devices list...', 'info');
        loadDevices().catch((err) => {
          console.error('Error loading devices:', err);
          updateStatus('Failed to load devices', 'error');
        });
      });
    }

    if (refreshProcessDataBtn) {
      refreshProcessDataBtn.addEventListener('click', () => {
        addActivityLog('Refreshing process data...', 'info');
        loadProcessData().catch((err) => {
          console.error('Error loading process data:', err);
          updateStatus('Failed to load process data', 'error');
        });
      });
    }

    // ========================================================================
    // SETUP NAVIGATION (SIDEBAR VIEW SWITCHING)
    // ========================================================================

    const navButtons = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');

    navButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const viewName = button.getAttribute('data-view');
        console.log(`Switching to view: ${viewName}`);
        addActivityLog(`Switched to ${viewName} view`, 'info');

        // Remove active class from all nav buttons
        navButtons.forEach((btn) => btn.classList.remove('active'));

        // Add active class to clicked button
        button.classList.add('active');

        // Hide all views
        views.forEach((view) => view.classList.remove('active'));

        // Show selected view
        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
          targetView.classList.add('active');

          // Auto-load data when switching to certain views
          if (viewName === 'masters') {
            loadMasters().catch((err) => {
              console.error('Error loading masters:', err);
            });
          } else if (viewName === 'devices') {
            loadDevices().catch((err) => {
              console.error('Error loading devices:', err);
            });
          }
        }
      });
    });

    console.log('Event listeners attached, loading masters...');
    addActivityLog('Initialization complete', 'success');

    // Initial load
    await loadMasters();
  } catch (error: any) {
    console.error('Initialization error:', error);
    updateStatus(`Initialization failed: ${error.message}`, 'error');
    addActivityLog(`Initialization failed: ${error.message}`, 'error');
  }
}

// Make functions globally available for inline onclick handlers
(window as any).handleMasterSelect = handleMasterSelect;
(window as any).handleDeviceSelect = handleDeviceSelect;

// Start the application when DOM is COMPLETELY ready
console.log('Renderer script loaded, waiting for DOM...');

if (document.readyState === 'loading') {
  console.log('DOM still loading, adding event listener...');
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired!');
    initialize();
  });
} else {
  console.log('DOM already ready, initializing immediately...');
  // Give it a tiny delay to ensure everything is rendered
  setTimeout(initialize, 100);
}