const { UnauthenticatedError } = require("./authentication-error");

function requireAuthenticatedSession(session) {
  if (!session) throw new UnauthenticatedError();
  return session;
}

module.exports = { requireAuthenticatedSession };
