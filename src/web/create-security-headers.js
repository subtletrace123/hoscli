const { SECURITY_HEADERS } = require("./web-security-policy");

function createSecurityHeaders() {
  return { ...SECURITY_HEADERS };
}

module.exports = { createSecurityHeaders };
