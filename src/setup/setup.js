const checkPython = require("./checkPython");
const ensureSyricsInstalled = require("./ensureSyrics");

function setupEnvironment() {
  if (!checkPython()) {
    throw new Error("Python setup failed.");
  }
  ensureSyricsInstalled();
}

module.exports = setupEnvironment;
