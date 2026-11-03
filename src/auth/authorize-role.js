const { AuthorizationError } = require("./authorization-error");

function authorizeRole(session, requiredRole) {
  if (session?.role !== requiredRole) {
    throw new AuthorizationError();
  }
  return true;
}

module.exports = { AuthorizationError, authorizeRole };
