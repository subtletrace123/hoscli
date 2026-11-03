const SESSION_COOKIE_NAME = "__Host-session";
const SESSION_COOKIE_ATTRIBUTES = Object.freeze([
  "Path=/",
  "Secure",
  "HttpOnly",
  "SameSite=Lax",
]);

function createSessionCookie(sessionId) {
  return `${SESSION_COOKIE_NAME}=${sessionId}; ${SESSION_COOKIE_ATTRIBUTES.join("; ")}`;
}

module.exports = {
  createSessionCookie,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_ATTRIBUTES,
};
