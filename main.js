const { app, BrowserWindow } = require("electron");
const path = require("path");
const { authorizeSpotify, getCurrentlyPlaying } = require("./js/spotifyAuth.js");

const setupEnvironment = require("./src/setup/setup");
const getLyrics = require("./src/lyrics");

// Auto-reload in dev
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

app.on("ready", async () => {
  // Setup environment once at startup
  try {
    setupEnvironment();
  } catch (err) {
    console.error("❌ Environment setup failed:", err);
    app.quit();
    return;
  }

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

  // Start Spotify auth flow
  authorizeSpotify();

  let lastTrackId = null;

  setInterval(async () => {
    const data = await getCurrentlyPlaying();
    if (data && data.id !== lastTrackId) {
      win.webContents.send("track-update", data);
      lastTrackId = data.id;
      try {
        // TODO: Replace with value from user settings/secure store
        // const spDc = process.env.SP_DC || "USER_PROVIDED_SPDC";
        const spDc = "AQC3YEJ-LM93LbR1QcfOsV_CHMONLFJmfuDytvT91JtOVpapc3oNr8QJSWY0ZWZKsNsgdlVuC7AU5ri29S7Lje4mjyZuFvHOE7gsDHdfFDYUUNLlC1mEDadgoZa9f84BQO3O8pSovVTVmr9S1_CyaMxqWQVoSLQcX2oEwafF3RNLUIwqNEwyKWAdMJmxwC-ZYzwkw5w4GPQoualGEJ4I30aegC_gJU1Z3xePngOXKus2WqzELREzusEwaaID7tCp2rRlVSqJ8MpL__s";
        if (spDc) {
          const lyrics = await getLyrics(data.id, spDc);
          win.webContents.send("lyrics-update", lyrics);
          // console.log("lyrics", JSON.stringify(lyrics, null, 2));
        } else {
          console.warn("⚠️ No SP_DC cookie provided by user yet.");
        }
      } catch (err) {
        console.error("❌ Lyrics fetch failed:", err);
      }
    }
  }, 500);
});
