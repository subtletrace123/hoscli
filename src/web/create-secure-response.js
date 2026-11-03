const { createSessionCookie } = require("../auth/create-session-cookie");
const { createSecurityHeaders } = require("./create-security-headers");

function createSecureResponse(sessionId) {
  return {
    status: 200,
    setCookie: createSessionCookie(sessionId),
    headers: createSecurityHeaders(),
  };
}

module.exports = { createSecureResponse };
