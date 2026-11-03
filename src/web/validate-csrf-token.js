function validateCsrfToken(requestToken, sessionToken) {
  if (requestToken !== sessionToken) {
    const error = new Error("CSRF validation failed");
    error.status = 403;
    throw error;
  }
  return true;
}

module.exports = { validateCsrfToken };
