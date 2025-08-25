// tokenStore.js
const fs = require("fs");
const path = require("path");
const { app } = require("electron");

let keytar;
try {
  keytar = require("keytar"); // Secure storage
} catch (err) {
  console.warn("⚠️ keytar not available, falling back to file storage");
}

const SERVICE_NAME = "MySpotifyApp";
const ACCOUNT = "spotify";

// Path to safe app data directory
const tokenPath = path.join(app.getPath("userData"), "tokens.json");

async function saveTokens({ accessToken, refreshToken }) {
  if (keytar && refreshToken) {
    // store securely in OS keychain
    await keytar.setPassword(SERVICE_NAME, ACCOUNT, refreshToken);
  } else {
    // fallback to local JSON file
    const data = { accessToken, refreshToken };
    fs.writeFileSync(tokenPath, JSON.stringify(data, null, 2), { mode: 0o600 });
  }
}

async function loadTokens() {
  if (keytar) {
    const refreshToken = await keytar.getPassword(SERVICE_NAME, ACCOUNT);
    if (refreshToken) return { refreshToken };
  }

  // fallback to local JSON
  if (fs.existsSync(tokenPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(tokenPath, "utf-8"));
      return data;
    } catch (err) {
      console.error("❌ Failed to read tokens.json:", err);
    }
  }

  return null;
}

module.exports = { saveTokens, loadTokens };
