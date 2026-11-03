const { authorizeRole } = require("./authorize-role");
const { AuthorizationError } = require("./authorization-error");
const { ADMIN_ACTIONS } = require("./admin-action-policy");

function authorizeAdminAction(session, action) {
  authorizeRole(session, "admin");
  if (!ADMIN_ACTIONS.has(action)) {
    throw new AuthorizationError();
  }
  return true;
}

module.exports = { authorizeAdminAction };
