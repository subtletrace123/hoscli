const { requireHttps } = require("./require-https");
const { validateCsrfToken } = require("./validate-csrf-token");
const { createSecureResponse } = require("./create-secure-response");

function handleSecureRequest(request) {
  requireHttps(request);
  validateCsrfToken(request.csrfToken, request.sessionCsrfToken);
  return createSecureResponse(request.sessionId);
}

module.exports = { handleSecureRequest };
