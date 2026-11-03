const { AuthenticationError } = require("./authentication-error");
const { isSessionActive } = require("./is-session-active");

function requireActiveSession(session, at) {
  if (!isSessionActive(session, at)) {
    throw new AuthenticationError();
  }
  return session;
}

module.exports = { requireActiveSession };
