const { spawn } = require("child_process");
const path = require("path");

function getLyrics(trackId, spDc) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "python", "get_lyrics.py");
    const py = spawn("python3", [scriptPath, trackId, spDc]);

    let data = "";
    let errorData = "";

    py.stdout.on("data", (chunk) => (data += chunk.toString()));
    py.stderr.on("data", (err) => (errorData += err.toString()));

    py.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(errorData || "Python exited with code " + code));
      }
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
  });
}

module.exports = getLyrics;
