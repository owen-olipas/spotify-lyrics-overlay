const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  onTrackUpdate: (callback) => {
    ipcRenderer.on("track-update", (_e, data) => callback(data));
  },
});
