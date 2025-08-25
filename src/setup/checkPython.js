const { execSync } = require("child_process");
const os = require("os");

function installPython() {
  const platform = os.platform();

  console.log("⬇️ Attempting to install Python...");

  try {
    if (platform === "win32") {
      // Windows: use winget (Win10/11) or choco
      execSync("winget install -e --id Python.Python.3", { stdio: "inherit" });
    } else if (platform === "darwin") {
      // macOS: use Homebrew
      execSync("brew install python", { stdio: "inherit" });
    } else if (platform === "linux") {
      // Linux: try apt first
      try {
        execSync("sudo apt-get update && sudo apt-get install -y python3 python3-pip", { stdio: "inherit" });
      } catch {
        console.error("⚠️ Auto-install failed. Please install Python3 manually via your package manager.");
        process.exit(1);
      }
    } else {
      console.error("⚠️ Unsupported platform. Please install Python 3 manually.");
      process.exit(1);
    }
    console.log("✅ Python installed successfully.");
  } catch (err) {
    console.error("❌ Failed to install Python automatically. Please install it manually.");
    process.exit(1);
  }
}

function checkPython() {
  try {
    const version = execSync("python3 --version", { encoding: "utf-8" });
    console.log("✅ Python found:", version.trim());
    return true;
  } catch {
    console.error("❌ Python 3 not found.");
    installPython();
    return true;
  }
}

module.exports = checkPython;
