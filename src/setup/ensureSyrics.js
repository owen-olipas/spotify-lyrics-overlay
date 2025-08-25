const { execSync } = require("child_process");

function ensureSyricsInstalled() {
  try {
    execSync("python3 -m pip show syrics", { stdio: "ignore" });
    console.log("✅ syrics already installed");
  } catch {
    console.log("⬇️ Installing syrics...");
    try {
      execSync("python3 -m pip install syrics", { stdio: "inherit" });
      console.log("✅ syrics installed successfully");
    } catch (err) {
      console.error("❌ Failed to install syrics. Error:", err);
      throw err;
    }
  }
}

module.exports = ensureSyricsInstalled;
