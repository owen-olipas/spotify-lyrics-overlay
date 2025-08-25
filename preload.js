const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  onTrackUpdate: (callback) => ipcRenderer.on("track-update", (_, data) => callback(data)),
  onLyricsUpdate: (callback) => ipcRenderer.on("lyrics-update", (_, data) => callback(data)),
});
