const { AuthorizationError } = require("./authorization-error");
const { SCREEN_ROLES } = require("./screen-access-policy");

function authorizeScreenAccess(session, screen) {
  if (session?.role !== SCREEN_ROLES[screen]) {
    throw new AuthorizationError();
  }
  return true;
}

module.exports = { authorizeScreenAccess };
