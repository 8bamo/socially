const { app, BrowserWindow, ipcMain, session, shell, Menu, systemPreferences } = require('electron');
const path = require('path');
const fs = require('fs');

// ---------------------------------------------------------------------------
// Portabel: alle Daten (Sessions, Cookies, Konfiguration) liegen neben der
// EXE im Ordner "SociallyData" statt in %APPDATA%. So kann die App inklusive
// aller Logins auf einem USB-Stick mitgenommen werden.
// ---------------------------------------------------------------------------
const portableDir = process.env.PORTABLE_EXECUTABLE_DIR // gesetzt vom electron-builder-Portable-Launcher
  || (app.isPackaged ? path.dirname(process.execPath) : path.join(__dirname, '..'));
const dataDir = path.join(portableDir, 'SociallyData');
fs.mkdirSync(dataDir, { recursive: true });
app.setPath('userData', dataDir);

const configFile = path.join(dataDir, 'services.json');

// Datenschutz: Chrome-typische UA ohne Electron/App-Kennung, damit die Dienste
// weder die App identifizieren noch Electron-UAs blockieren (z. B. WhatsApp Web).
const cleanUserAgent = () =>
  app.userAgentFallback
    .replace(/ Electron\/[\d.]+/i, '')
    .replace(/ socially\/[\d.]+/i, '');

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(configFile, 'utf8'));
  } catch {
    return { services: [], settings: {} };
  }
}

function saveConfig(config) {
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf8');
}

// Aktuelle Konfiguration im Hauptprozess spiegeln, damit der
// Berechtigungs-Handler Stummschaltungen sofort berücksichtigt.
let currentConfig = loadConfig();

function serviceOfSession(ses) {
  for (const svc of currentConfig.services || []) {
    if (session.fromPartition(`persist:socially-${svc.id}`) === ses) return svc;
  }
  return null;
}

function notificationsAllowedFor(ses) {
  if (currentConfig.settings?.notifications === false) return false; // global aus
  const svc = serviceOfSession(ses);
  return !(svc && svc.muted); // pro Dienst stummgeschaltet
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 900,
    minHeight: 600,
    title: 'Socially by mystu',
    backgroundColor: '#12131a',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webviewTag: true,
      spellcheck: false
    }
  });

  Menu.setApplicationMenu(null);
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

// Sicherheits- und Datenschutzregeln für jede eingebettete Dienst-Webview.
app.on('web-contents-created', (_event, contents) => {
  if (contents.getType() !== 'webview') return;

  // Links, die der Dienst in neuen Fenstern öffnen will, landen im
  // Standardbrowser statt in unsichtbaren Electron-Fenstern.
  contents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Berechtigungen restriktiv: nur was Messenger wirklich brauchen.
  // Benachrichtigungen hängen zusätzlich am globalen Schalter und an der
  // Stummschaltung des jeweiligen Dienstes.
  const allowed = new Set(['media', 'fullscreen', 'clipboard-sanitized-write']);
  const decide = (permission) => {
    if (permission === 'notifications') return notificationsAllowedFor(contents.session);
    return allowed.has(permission);
  };
  contents.session.setPermissionRequestHandler(async (_wc, permission, callback, details) => {
    // macOS gibt Mikrofon/Kamera nur frei, wenn die App die Systemabfrage
    // (TCC-Dialog) selbst auslöst – ohne das schlagen Sprach-/Videoanrufe
    // z. B. in Discord kommentarlos fehl.
    if (permission === 'media' && process.platform === 'darwin') {
      const types = details?.mediaTypes || ['audio', 'video'];
      if (types.includes('audio')) await systemPreferences.askForMediaAccess('microphone').catch(() => {});
      if (types.includes('video')) await systemPreferences.askForMediaAccess('camera').catch(() => {});
    }
    callback(decide(permission));
  });
  contents.session.setPermissionCheckHandler((_wc, permission) => decide(permission));
});

// --------------------------- IPC-Schnittstelle -----------------------------

ipcMain.handle('config:load', () => loadConfig());

ipcMain.handle('config:save', (_event, config) => {
  currentConfig = config;
  saveConfig(config);
  return true;
});

// Autostart beim Hochfahren. Bei der Portable-EXE zeigt der Eintrag auf die
// echte EXE-Datei (PORTABLE_EXECUTABLE_FILE), nicht auf den Temp-Entpackpfad.
ipcMain.handle('app:setAutostart', (_event, enable) => {
  app.setLoginItemSettings({
    openAtLogin: !!enable,
    path: process.env.PORTABLE_EXECUTABLE_FILE || process.execPath
  });
  return app.getLoginItemSettings().openAtLogin;
});

ipcMain.handle('app:userAgent', () => cleanUserAgent());

ipcMain.handle('app:dataDir', () => dataDir);

// Löscht sämtliche Daten (Cookies, Cache, LocalStorage, IndexedDB …) eines
// Dienstes – wird beim Entfernen eines Dienstes oder auf Wunsch aufgerufen.
ipcMain.handle('service:clearData', async (_event, partition) => {
  if (!/^persist:socially-/.test(partition)) return false; // nur eigene Partitionen
  const ses = session.fromPartition(partition);
  await ses.clearStorageData();
  await ses.clearCache();
  await ses.clearAuthCache();
  return true;
});

ipcMain.handle('app:openExternal', (_event, url) => {
  if (url.startsWith('https://') || url.startsWith('http://')) shell.openExternal(url);
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => app.quit());
