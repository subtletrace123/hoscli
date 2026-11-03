class AuthenticationError extends Error {
  constructor() {
    super("Authentication failed");
    this.name = "AuthenticationError";
    this.code = "INVALID_CREDENTIALS";
  }
}

class LoginRestrictedError extends Error {
  constructor(retryAt) {
    super("Login temporarily restricted");
    this.name = "LoginRestrictedError";
    this.code = "LOGIN_RESTRICTED";
    this.retryAt = retryAt;
  }
}

class UnauthenticatedError extends Error {
  constructor() {
    super("Authentication required");
    this.name = "UnauthenticatedError";
    this.code = "UNAUTHENTICATED";
    this.status = HTTP_STATUS.UNAUTHORIZED;
  }
}

module.exports = {
  AuthenticationError,
  LoginRestrictedError,
  UnauthenticatedError,
};
const { HTTP_STATUS } = require("./http-status");

