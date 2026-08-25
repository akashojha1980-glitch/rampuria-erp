const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let mainWindow;
let serverProcess;

function startServer() {
  // Spawns backend Express server inside a child process
  const serverPath = path.join(__dirname, '..', 'backend', 'server.js');
  
  console.log(`[Electron] Launching backend server process at: ${serverPath}`);
  
  // Fork the process to run node backend/server.js asynchronously
  serverProcess = fork(serverPath, [], {
    env: { 
      ...process.env, 
      PORT: '5000', 
      NODE_ENV: 'production' 
    },
    silent: false // Keep server logs visible in terminal for diagnostic convenience
  });

  serverProcess.on('error', (err) => {
    console.error('[Electron] Failed to start backend child process:', err.message);
  });

  serverProcess.on('exit', (code, signal) => {
    console.log(`[Electron] Backend server exited with code ${code} (signal: ${signal})`);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    title: "College Admission Management ERP System",
    icon: path.join(__dirname, 'icon.ico'), // placeholder or fallback icon
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Hide the default file/edit menu bar for a premium SaaS look
  mainWindow.setMenuBarVisibility(false);

  // Wait 1.5 seconds for backend to start up before loading page
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:5000');
  }, 1500);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Start server
  startServer();
  // Create window
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // Safe cleanup: terminate backend process when app closes
  if (serverProcess) {
    console.log('[Electron] Terminating backend server child process...');
    serverProcess.kill('SIGINT');
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
