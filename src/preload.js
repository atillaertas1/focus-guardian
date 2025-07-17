const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  onMenuClick: (callback) => ipcRenderer.on('menu-click', callback),
  
  // Website blocking functions
  startBlocking: (sites) => ipcRenderer.invoke('start-blocking', sites),
  stopBlocking: () => ipcRenderer.invoke('stop-blocking'),
  
  // Get blocking status
  getBlockingStatus: () => ipcRenderer.invoke('get-blocking-status'),
  
  // Listen for blocking status updates
  onBlockingStatusChange: (callback) => ipcRenderer.on('blocking-status-changed', callback),
  
  // Persistent data storage functions
  setBlockedList: (blockedList) => ipcRenderer.invoke('set-blocked-list', blockedList),
  getBlockedList: () => ipcRenderer.invoke('get-blocked-list'),

  // Add notification API to electronAPI
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),

  // Add admin permission check to electronAPI
  checkAdminPermissions: () => ipcRenderer.invoke('check-admin-permissions'),

  // Add force clean hosts API
  forceCleanHosts: () => ipcRenderer.invoke('force-clean-hosts'),
});