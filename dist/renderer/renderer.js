/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/*!**********************************!*\
  !*** ./src/renderer/renderer.ts ***!
  \**********************************/

/**
 * Renderer Process
 * Frontend logic for the Electron app
 */
// Server connection info
let serverInfo = null;
// Activity log
const activityLog = [];
/**
 * Initialize the application
 */
async function init() {
    try {
        // Get server info from main process
        serverInfo = await window.electronAPI.getServerInfo();
        // Get app version
        const version = await window.electronAPI.getAppVersion();
        document.getElementById('app-version').textContent = `v${version}`;
        // Update settings page
        document.getElementById('server-url').textContent = serverInfo.url;
        document.getElementById('platform-info').textContent = window.electronAPI.platform;
        document.getElementById('electron-version').textContent = window.electronAPI.electronVersion;
        document.getElementById('node-version').textContent = window.electronAPI.nodeVersion;
        document.getElementById('chrome-version').textContent = window.electronAPI.chromeVersion;
        // Setup navigation
        setupNavigation();
        // Setup buttons
        setupButtons();
        // Check server connection
        await checkServerConnection();
        log('Application initialized');
    }
    catch (error) {
        console.error('Initialization error:', error);
        log(`ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Setup navigation between views
 */
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const viewName = item.getAttribute('data-view');
            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            // Show corresponding view
            views.forEach(view => view.classList.remove('active'));
            document.getElementById(`${viewName}-view`)?.classList.add('active');
        });
    });
}
/**
 * Setup button event listeners
 */
function setupButtons() {
    document.getElementById('discover-btn')?.addEventListener('click', discoverMasters);
    document.getElementById('refresh-btn')?.addEventListener('click', refreshData);
}
/**
 * Check server connection
 */
async function checkServerConnection() {
    if (!serverInfo)
        return;
    try {
        const response = await fetch(`${serverInfo.url}/api/v1/health`);
        const data = await response.json();
        if (data.success) {
            document.getElementById('connection-status').textContent = 'Connected';
            document.getElementById('connection-status').className = 'badge status-connected';
            document.getElementById('server-status').textContent = 'Online';
            log('Connected to backend server');
        }
        else {
            throw new Error('Server returned unsuccessful response');
        }
    }
    catch (error) {
        document.getElementById('connection-status').textContent = 'Disconnected';
        document.getElementById('connection-status').className = 'badge status-disconnected';
        document.getElementById('server-status').textContent = 'Offline';
        log(`Server connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Discover IO-Link masters
 */
async function discoverMasters() {
    if (!serverInfo)
        return;
    log('Discovering IO-Link masters...');
    try {
        const response = await fetch(`${serverInfo.url}/api/v1/masters`);
        const data = await response.json();
        if (data.success && data.data) {
            const masters = data.data;
            document.getElementById('master-count').textContent = masters.length.toString();
            displayMasters(masters);
            log(`Found ${masters.length} master(s)`);
        }
        else {
            log('No masters found');
        }
    }
    catch (error) {
        log(`Discovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Display masters in the UI
 */
function displayMasters(masters) {
    const mastersList = document.getElementById('masters-list');
    if (!mastersList)
        return;
    if (masters.length === 0) {
        mastersList.innerHTML = '<p class="placeholder">No masters found</p>';
        return;
    }
    mastersList.innerHTML = masters.map((master, index) => `
        <div class="stat-card" style="margin-bottom: 1rem;">
            <h3>Master ${index + 1}</h3>
            <p><strong>Name:</strong> ${master.name}</p>
            <p><strong>Product:</strong> ${master.viewName}</p>
            <p><strong>Index:</strong> ${master.index}</p>
        </div>
    `).join('');
}
/**
 * Refresh all data
 */
async function refreshData() {
    log('Refreshing data...');
    await checkServerConnection();
    await discoverMasters();
}
/**
 * Add entry to activity log
 */
function log(message) {
    const timestamp = new Date().toLocaleTimeString();
    const entry = `[${timestamp}] ${message}`;
    activityLog.unshift(entry);
    if (activityLog.length > 50) {
        activityLog.pop();
    }
    const logBox = document.getElementById('activity-log');
    if (logBox) {
        logBox.innerHTML = activityLog
            .map(entry => `<div class="log-entry">${entry}</div>`)
            .join('');
    }
}
// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);

/******/ })()
;
//# sourceMappingURL=renderer.js.map