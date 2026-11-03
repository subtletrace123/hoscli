const { isSessionRevoked } = require("./is-session-revoked");

function isSessionActive(session, at) {
  return Boolean(
    session?.expiresAt instanceof Date &&
      !isSessionRevoked(session) &&
      at < session.expiresAt,
  );
}

module.exports = { isSessionActive };
