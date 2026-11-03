const { AuthenticationError } = require("./authentication-error");
const { requireActiveSession } = require("./require-active-session");
const { isAccountSessionValid } = require("./is-account-session-valid");

function requireSessionForAccount(session, account, at) {
  requireActiveSession(session, at);
  if (!isAccountSessionValid(session, account)) {
    throw new AuthenticationError();
  }
  return session;
}

module.exports = { requireSessionForAccount };
