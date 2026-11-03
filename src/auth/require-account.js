const { AuthenticationError } = require("./authentication-error");

function requireAccount(account) {
  if (!account) {
    throw new AuthenticationError();
  }
  return account;
}

module.exports = { requireAccount };
