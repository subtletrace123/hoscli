class AuthorizationError extends Error {
  constructor() {
    super("Forbidden");
    this.name = "AuthorizationError";
    this.code = "FORBIDDEN";
    this.status = HTTP_STATUS.FORBIDDEN;
  }
}

module.exports = { AuthorizationError };
const { HTTP_STATUS } = require("./http-status");

