const { authorizeScreenAccess } = require("./authorize-screen-access");
const { API_TARGET_SCREENS } = require("./api-access-policy");
const { requireAuthenticatedSession } = require("./require-authenticated-session");

function authorizeApiRequest(session, api) {
  requireAuthenticatedSession(session);
  authorizeScreenAccess(session, API_TARGET_SCREENS[api]);
  return session;
}

module.exports = { authorizeApiRequest };
