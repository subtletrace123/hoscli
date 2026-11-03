const { AuthenticationError } = require("./authentication-error");

function requireAccountRole(account, role) {
  if (account?.role !== role) {
    throw new AuthenticationError();
  }
  return account;
}

module.exports = { requireAccountRole };
