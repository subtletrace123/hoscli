const { HTTPS_PROTOCOL } = require("./web-security-policy");

function requireHttps(request) {
  if (request?.protocol !== HTTPS_PROTOCOL) {
    const error = new Error("HTTPS required");
    error.status = 400;
    throw error;
  }
  return true;
}

module.exports = { requireHttps };
