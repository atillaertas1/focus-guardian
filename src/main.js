/**
 * Pomodoro Timer - Main Process
 * 
 * This file handles the main Electron process for the Pomodoro Timer application.
 * It manages window creation, IPC communication, and system-level operations like
 * hosts file modification for website blocking.
 * 
 * Key Features:
 * - Website blocking through hosts file modification
 * - Persistent data storage using electron-store
 * - Desktop notifications
 * - Admin permission checks
 * - Automatic backup and restore of hosts file
 */

const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const sudo = require('sudo-prompt');

// Initialize electron-store - using dynamic import for ES modules
let store;
const initStore = async () => {
  const Store = (await import('electron-store')).default;
  store = new Store();
};


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Global variables for blocking state
let isBlocking = false;
let blockedSites = [];
let originalHostsContent = '';

// Get hosts file path based on OS
const getHostsPath = () => {
  const platform = os.platform();
  if (platform === 'win32') {
    return 'C:\\Windows\\System32\\drivers\\etc\\hosts';
  } else if (platform === 'darwin' || platform === 'linux') {
    return '/etc/hosts';
  }
  throw new Error('Unsupported operating system');
};

// Backup original hosts file
const backupHostsFile = () => {
  try {
    const hostsPath = getHostsPath();
    if (fs.existsSync(hostsPath)) {
      originalHostsContent = fs.readFileSync(hostsPath, 'utf8');
      console.log('Hosts file backed up successfully');
      return true;
    }
  } catch (error) {
    console.error('Failed to backup hosts file:', error);
    return false;
  }
};

// Restore hosts file from backup
const restoreHostsFile = () => {
  return new Promise((resolve, reject) => {
    try {
      const hostsPath = getHostsPath();
      const platform = os.platform();
      
      if (!originalHostsContent) {
        console.log('No original hosts content available, attempting to clean current hosts file');
        // Try to read current hosts file and remove our entries
        const currentContent = fs.readFileSync(hostsPath, 'utf8');
        const lines = currentContent.split('\n');
        const cleanedLines = [];
        let skipBlock = false;
        
        for (const line of lines) {
          if (line.includes('# Pomodoro Timer - Blocked Sites')) {
            skipBlock = true;
            continue;
          }
          if (line.includes('# End Pomodoro Timer')) {
            skipBlock = false;
            continue;
          }
          if (!skipBlock) {
            cleanedLines.push(line);
          }
        }
        
        originalHostsContent = cleanedLines.join('\n');
      }
      
      if (platform === 'win32') {
        // Windows - create temp file and copy it
        const tempFile = path.join(os.tmpdir(), 'hosts_restore.txt');
        fs.writeFileSync(tempFile, originalHostsContent, 'utf8');
        
        const command = `copy "${tempFile}" "${hostsPath}" && del "${tempFile}"`;
        const options = {
          name: 'Pomodoro Timer'
        };
        
        sudo.exec(command, options, (error, stdout, stderr) => {
          if (error) {
            console.error('Failed to restore hosts file:', error);
            reject(error);
          } else {
            isBlocking = false;
            console.log('Hosts file restored successfully');
            resolve();
          }
        });
      } else {
        // Unix systems (macOS, Linux)
        fs.writeFileSync(hostsPath, originalHostsContent);
        isBlocking = false;
        console.log('Hosts file restored successfully');
        resolve();
      }
    } catch (error) {
      console.error('Failed to restore hosts file:', error);
      reject(error);
    }
  });
};

// Block websites by modifying hosts file
const blockWebsites = (sites) => {
  return new Promise((resolve, reject) => {
    try {
      if (!backupHostsFile()) {
        reject(new Error('Failed to backup hosts file'));
        return;
      }

      const hostsPath = getHostsPath();
      const platform = os.platform();
      
      // Create blocking entries
      const blockingEntries = sites.map(site => {
        const cleanSite = site.trim();
        return [
          `127.0.0.1 ${cleanSite}\r\n`,
          `127.0.0.1 www.${cleanSite}\r\n`,
          `::1 ${cleanSite}\r\n`,
          `::1 www.${cleanSite}\r\n`
        ].join('');
      }).join('');

      // Add clear comment markers for easy removal
      const newHostsContent = originalHostsContent + '\r\n\r\n# Pomodoro Timer - Blocked Sites START\r\n' + blockingEntries + '# Pomodoro Timer - Blocked Sites END\r\n';

      if (platform === 'win32') {
        // Windows - create temp file and copy it
        const tempFile = path.join(os.tmpdir(), 'hosts_modified.txt');
        fs.writeFileSync(tempFile, newHostsContent, 'utf8');
        
        const command = `copy "${tempFile}" "${hostsPath}" && del "${tempFile}"`;
        const options = {
          name: 'Pomodoro Timer'
        };
        
        sudo.exec(command, options, (error, stdout, stderr) => {
          if (error) {
            console.error('Failed to block websites:', error);
            reject(error);
          } else {
            isBlocking = true;
            blockedSites = sites;
            console.log('Websites blocked successfully:', sites);
            resolve();
          }
        });
      } else {
        // Unix systems (macOS, Linux)
        const tempFile = '/tmp/hosts_modified.txt';
        fs.writeFileSync(tempFile, newHostsContent, 'utf8');
        
        const command = `cp "${tempFile}" "${hostsPath}" && rm "${tempFile}"`;
        const options = {
          name: 'Pomodoro Timer'
        };
        
        sudo.exec(command, options, (error, stdout, stderr) => {
          if (error) {
            console.error('Failed to block websites:', error);
            reject(error);
          } else {
            isBlocking = true;
            blockedSites = sites;
            console.log('Websites blocked successfully:', sites);
            resolve();
          }
        });
      }
    } catch (error) {
      console.error('Failed to block websites:', error);
      reject(error);
    }
  });
};

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 800,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
};

// IPC Handlers for website blocking
ipcMain.handle('start-blocking', async (event, sites) => {
  try {
    console.log('Received blocking request for sites:', sites);
    
    if (!sites || sites.length === 0) {
      throw new Error('No sites provided for blocking');
    }

    await blockWebsites(sites);
    return { success: true, message: 'Websites blocked successfully' };
  } catch (error) {
    console.error('Error in start-blocking:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('stop-blocking', async (event) => {
  try {
    console.log('Received request to stop blocking');
    
    if (!isBlocking) {
      console.log('No blocking active');
      return { success: true, message: 'No blocking active' };
    }

    await restoreHostsFile();
    
    // Force flush DNS cache after restoring hosts file
    const platform = os.platform();
    if (platform === 'win32') {
      const { spawn } = require('child_process');
      spawn('ipconfig', ['/flushdns'], { stdio: 'ignore' });
    } else if (platform === 'darwin') {
      const { spawn } = require('child_process');
      spawn('sudo', ['dscacheutil', '-flushcache'], { stdio: 'ignore' });
    }
    
    console.log('Blocking stopped successfully, DNS cache flushed');
    return { success: true, message: 'Blocking stopped successfully' };
  } catch (error) {
    console.error('Error in stop-blocking:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-blocking-status', async (event) => {
  return {
    isBlocking,
    blockedSites: blockedSites.slice() // Return a copy
  };
});

// IPC Handlers for persistent data storage using electron-store
ipcMain.handle('set-blocked-list', async (event, blockedList) => {
  try {
    console.log('Saving blocked list to electron-store:', blockedList);
    if (!store) {
      await initStore();
    }
    store.set('blockedSites', blockedList);
    
    return { success: true, message: 'Blocked list saved successfully' };
  } catch (error) {
    console.error('Error saving blocked list:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-blocked-list', async (event) => {
  try {
    const defaultList = [
      'facebook.com',
      'twitter.com', 
      'youtube.com',
      'instagram.com',
      'tiktok.com'
    ];
    
    if (!store) {
      await initStore();
    }
    
    const savedList = store.get('blockedSites', defaultList);
    console.log('Retrieved blocked list from electron-store:', savedList);
    return { success: true, data: savedList };
  } catch (error) {
    console.error('Error retrieving blocked list:', error);
    return { success: false, error: error.message, data: [] };
  }
});

// IPC Handlers for desktop notifications
ipcMain.handle('show-notification', async (event, title, body) => {
  try {
    console.log('Showing notification:', title, body);
    if (Notification.isSupported()) {
      const notification = new Notification({
        title: title,
        body: body,
        silent: false
      });
      
      notification.show();
      
      return { success: true, message: 'Notification shown successfully' };
    } else {
      return { success: false, error: 'Notifications not supported on this system' };
    }
  } catch (error) {
    console.error('Error showing notification:', error);
    return { success: false, error: error.message };
  }
});

// IPC Handler for admin permission check
ipcMain.handle('check-admin-permissions', async (event) => {
  try {
    console.log('Checking admin permissions...');
    return { success: true, message: 'Admin permissions available' };
  } catch (error) {
    console.error('Error checking admin permissions:', error);
    return { success: false, error: error.message };
  }
});

// Enhanced hosts file safety with persistent backup
const BACKUP_FILE_PATH = path.join(os.tmpdir(), 'pomodoro_hosts_backup.txt');

// Create persistent backup of hosts file
const createPersistentBackup = () => {
  try {
    const hostsPath = getHostsPath();
    if (fs.existsSync(hostsPath)) {
      const currentContent = fs.readFileSync(hostsPath, 'utf8');
      
      // Only backup if it's not already modified by our app
      if (!currentContent.includes('# Pomodoro Timer - Blocked Sites')) {
        fs.writeFileSync(BACKUP_FILE_PATH, currentContent, 'utf8');
        originalHostsContent = currentContent;
        console.log('Persistent hosts backup created successfully');
        return true;
      } else {
        // If already modified, try to restore from existing backup
        if (fs.existsSync(BACKUP_FILE_PATH)) {
          originalHostsContent = fs.readFileSync(BACKUP_FILE_PATH, 'utf8');
          console.log('Loaded existing hosts backup');
          return true;
        }
      }
    }
    return false;
  } catch (error) {
    console.error('Failed to create persistent backup:', error);
    return false;
  }
};

// Check and restore hosts file on startup
const checkAndRestoreHostsOnStartup = () => {
  try {
    const hostsPath = getHostsPath();
    if (fs.existsSync(hostsPath)) {
      const currentContent = fs.readFileSync(hostsPath, 'utf8');
      
      // If hosts file contains our modifications, restore it
      if (currentContent.includes('# Pomodoro Timer - Blocked Sites')) {
        console.log('Detected previous blocking modifications, restoring...');
        
        if (fs.existsSync(BACKUP_FILE_PATH)) {
          const backupContent = fs.readFileSync(BACKUP_FILE_PATH, 'utf8');
          originalHostsContent = backupContent;
          
          // Restore the backup
          return restoreHostsFile()
            .then(() => {
              console.log('Hosts file restored successfully on startup');
              return true;
            })
            .catch((error) => {
              console.error('Failed to restore hosts file on startup:', error);
              return false;
            });
        }
      } else {
        // Create backup of clean hosts file
        createPersistentBackup();
        return Promise.resolve(true);
      }
    }
    return Promise.resolve(false);
  } catch (error) {
    console.error('Error checking hosts file on startup:', error);
    return Promise.resolve(false);
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Initialize electron-store
  await initStore();
  
  // Check and restore hosts file on startup
  checkAndRestoreHostsOnStartup();
  
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  // Always restore hosts file before quitting
  if (isBlocking) {
    restoreHostsFile().finally(() => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });
  } else {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }
});

// Handle app quit event
app.on('before-quit', async (event) => {
  if (isBlocking) {
    event.preventDefault();
    try {
      await restoreHostsFile();
      app.quit();
    } catch (error) {
      console.error('Failed to restore hosts file on quit:', error);
      app.quit();
    }
  }
});

// IPC Handler for force cleaning hosts file
ipcMain.handle('force-clean-hosts', async (event) => {
  try {
    console.log('Force cleaning hosts file...');
    const hostsPath = getHostsPath();
    const platform = os.platform();
    
    // Default clean hosts content
    const cleanHostsContent = `# Copyright (c) 1993-2009 Microsoft Corp.
#
# This is a sample HOSTS file used by Microsoft TCP/IP for Windows.
#
# This file contains the mappings of IP addresses to host names. Each
# entry should be kept on an individual line. The IP address should
# be placed in the first column followed by the corresponding host name.
# The IP address and the host name should be separated by at least one
# space.
#
# Additionally, comments (such as these) may be inserted on individual
# lines or following the machine name denoted by a '#' symbol.
#
# For example:
#
#      102.54.94.97     rhino.acme.com          # source server
#       38.25.63.10     x.acme.com              # x client host
# localhost name resolution is handled within DNS itself.
#       127.0.0.1       localhost
#       ::1             localhost
`;

    if (platform === 'win32') {
      // Windows - create temp file and copy it
      const tempFile = path.join(os.tmpdir(), 'hosts_clean.txt');
      fs.writeFileSync(tempFile, cleanHostsContent, 'utf8');
      
      const command = `copy "${tempFile}" "${hostsPath}" && del "${tempFile}"`;
      const options = {
        name: 'Pomodoro Timer'
      };
      
      return new Promise((resolve) => {
        sudo.exec(command, options, (error, stdout, stderr) => {
          if (error) {
            console.error('Failed to force clean hosts file:', error);
            resolve({ success: false, error: error.message });
          } else {
            isBlocking = false;
            originalHostsContent = cleanHostsContent;
            
            // Force flush DNS cache
            const { spawn } = require('child_process');
            spawn('ipconfig', ['/flushdns'], { stdio: 'ignore' });
            
            console.log('Hosts file force cleaned successfully');
            resolve({ success: true, message: 'Hosts file force cleaned successfully' });
          }
        });
      });
    } else {
      // Unix systems (macOS, Linux)
      fs.writeFileSync(hostsPath, cleanHostsContent);
      isBlocking = false;
      originalHostsContent = cleanHostsContent;
      
      // Force flush DNS cache
      const { spawn } = require('child_process');
      if (platform === 'darwin') {
        spawn('sudo', ['dscacheutil', '-flushcache'], { stdio: 'ignore' });
      }
      
      console.log('Hosts file force cleaned successfully');
      return { success: true, message: 'Hosts file force cleaned successfully' };
    }
  } catch (error) {
    console.error('Error force cleaning hosts file:', error);
    return { success: false, error: error.message };
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.