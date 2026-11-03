const { randomBytes } = require("node:crypto");

function createSecureSessionId() {
  return randomBytes(32).toString("hex");
}

module.exports = { createSecureSessionId };
