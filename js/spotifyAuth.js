const fetch = require("node-fetch");
const open = require("open");
const http = require("http");
require('dotenv').config();

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const redirectUri = process.env.REDIRECT_URI;

let accessToken = null;
let refreshToken = null;

function authorizeSpotify() {
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=user-read-currently-playing`;

  // Open browser to login
  open(authUrl);

  // Local server to handle redirect
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
      track: data.item?.name,
      artist: data.item?.artists?.map((a) => a.name).join(", "),
      progress: data.progress_ms,
      duration: data.item?.duration_ms,
    };
  } else if (res.status === 401 && refreshToken) {
    // Token expired → try refresh
    await refreshAccessToken();
    return getCurrentlyPlaying();
  } else {
    return null;
  }
}

async function refreshAccessToken() {
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
  accessToken = tokenData.access_token;
  console.log("🔄 Access token refreshed");
}

module.exports = { authorizeSpotify, getCurrentlyPlaying };