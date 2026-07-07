const { contextBridge, ipcRenderer } = require('electron');

// Schmale, explizite Brücke zwischen UI und Hauptprozess –
// die Webviews der Dienste haben hierauf KEINEN Zugriff (kein Preload dort).
contextBridge.exposeInMainWorld('socially', {
  loadConfig: () => ipcRenderer.invoke('config:load'),
  saveConfig: (config) => ipcRenderer.invoke('config:save', config),
  getUserAgent: () => ipcRenderer.invoke('app:userAgent'),
  getDataDir: () => ipcRenderer.invoke('app:dataDir'),
  clearServiceData: (partition) => ipcRenderer.invoke('service:clearData', partition),
  setAutostart: (enable) => ipcRenderer.invoke('app:setAutostart', enable),
  openExternal: (url) => ipcRenderer.invoke('app:openExternal', url),
  checkForUpdate: () => ipcRenderer.invoke('app:checkForUpdate')
});
