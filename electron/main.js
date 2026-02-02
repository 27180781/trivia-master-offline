const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

const isDev = !app.isPackaged;

Menu.setApplicationMenu(null);

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    fullscreen: true,
    fullscreenable: true,
    autoHideMenuBar: true,
    backgroundColor: '#0a0a0a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      devTools: true
    },
  });

  // נתיב נכון לפי מצב האפליקציה
  let startUrl;
  if (isDev) {
    // מצב פיתוח - dist נמצאת בתיקייה הראשית
    startUrl = path.join(__dirname, '../dist/index.html');
  } else {
    // מצב EXE ארוז - dist ארוזה בתוך app.asar
    startUrl = path.join(process.resourcesPath, 'app.asar', 'dist', 'index.html');
  }

  console.log('isDev:', isDev);
  console.log('Loading file from:', startUrl);

  win.loadFile(startUrl).catch(err => {
    console.error('Failed to load file:', err);
    // הצג הודעת שגיאה בחלון עצמו
    win.loadURL(`data:text/html,<h1 style="color:white;background:#0a0a0a;padding:50px;">שגיאה בטעינה: ${err.message}<br><br>נתיב: ${startUrl}</h1>`);
  });

  win.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F11') {
      win.setFullScreen(!win.isFullScreen());
    }
    if (input.key === 'F12') {
      win.webContents.openDevTools();
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
