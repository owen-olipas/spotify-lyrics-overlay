const fetch = require("node-fetch");
const open = require("open");
const http = require("http");
require("dotenv").config();

const { saveTokens, loadTokens } = require("./tokenStore");

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const redirectUri = process.env.REDIRECT_URI;

let accessToken = null;
let refreshToken = null;

async function authorizeSpotify(force = false) {
  // 🔑 Load stored tokens
  const stored = await loadTokens();

  if (!force) {
    const stored = await loadTokens();
    if (stored && stored.refreshToken) {
      refreshToken = stored.refreshToken;
      console.log("🔑 Using stored refresh token");
      const ok = await refreshAccessToken();
      if (ok) return; // no need to reauthorize
    }
  }

  // 🔄 Otherwise start full OAuth flow
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=user-read-currently-playing`;

  open(authUrl);

  const server = http.createServer(async (req, res) => {
    if (req.url.startsWith("/callback")) {
      const url = new URL(req.url, `http://127.0.0.1:8888`);
      const code = url.searchParams.get("code");

      // Exchange code for tokens
      const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      const tokenData = await tokenRes.json();
      accessToken = tokenData.access_token;
      refreshToken = tokenData.refresh_token;

      saveTokens({ accessToken, refreshToken }); // ✅ persist
      res.end("✅ Spotify authentication successful! You can close this tab.");
      server.close();

      console.log("Spotify access token received.");
    }
  });

  server.listen(8888, "127.0.0.1", () => {
    console.log("Listening for Spotify auth on http://127.0.0.1:8888/callback");
  });
}

async function getCurrentlyPlaying() {
  if (!accessToken) return null;

  const res = await fetch(
    "https://api.spotify.com/v1/me/player/currently-playing",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (res.status === 200) {
    const data = await res.json();
    return {
      id: data.item?.id,
      track: data.item?.name,
      artist: data.item?.artists?.map((a) => a.name).join(", "),
      progress: data.progress_ms,
      duration: data.item?.duration_ms,
      is_playing: data.is_playing,
    };
  } else if (res.status === 401 && refreshToken) {
    // Token expired → try refresh
    const ok = await refreshAccessToken();
    if (ok) return getCurrentlyPlaying();
    // ❌ Refresh failed → force re-login next time
    await authorizeSpotify(true);
    return null;
  } else {
    return null;
  }
}

async function refreshAccessToken() {
  if (!refreshToken) return false;

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  const tokenData = await tokenRes.json();

  if (tokenData.error) {
    console.error("❌ Failed to refresh:", tokenData.error);
    return false;
  }

  accessToken = tokenData.access_token;
  if (tokenData.refresh_token) {
    refreshToken = tokenData.refresh_token; // Spotify may rotate
  }

  saveTokens({ accessToken, refreshToken });
  console.log("🔄 Access token refreshed");
  return true;
}

module.exports = { authorizeSpotify, getCurrentlyPlaying };
