const { logoutSession } = require("./logout-session");

function logoutAuthenticatedSession(session, sessionRepository, loggedOutAt) {
  return logoutSession(session, sessionRepository, loggedOutAt);
}

module.exports = { logoutAuthenticatedSession };
