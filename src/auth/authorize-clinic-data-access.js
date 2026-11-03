const { AuthorizationError } = require("./authorization-error");
const { isSameClinic } = require("./is-same-clinic");

function authorizeClinicDataAccess(session, data) {
  if (session?.role !== "clinic" || !isSameClinic(session, data)) {
    throw new AuthorizationError();
  }
  return session;
}

module.exports = { authorizeClinicDataAccess };
