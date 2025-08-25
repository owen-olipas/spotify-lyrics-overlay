const { app, BrowserWindow } = require("electron");
const path = require("path");
const { authorizeSpotify, getCurrentlyPlaying } = require("./js/spotifyAuth.js");

// Auto-reload
try {
  require("electron-reload")(__dirname, {
    electron: path.join(
      __dirname,
      "node_modules",
      ".bin",
      process.platform === "win32" ? "electron.cmd" : "electron"
    ),
  });
  console.log("✅ Auto-reload enabled");
} catch (e) {
  console.log("⚠️ Auto-reload not enabled:", e.message);
}

let win;

app.on("ready", () => {
  win = new BrowserWindow({
    width: 600,
    height: 200,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile("index.html");

  // Start Spotify auth
  authorizeSpotify();

  // Poll Spotify every 5 seconds
  setInterval(async () => {
    const data = await getCurrentlyPlaying();
    if (data) {
      // console.log("data", data);
      win.webContents.send("track-update", data);
    }
  }, 500);
});
