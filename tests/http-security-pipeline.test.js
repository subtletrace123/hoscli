const assert = require("node:assert/strict");
const test = require("node:test");

const {
  handleSecureRequest,
} = require("../src/web/handle-secure-request");

test("HTTPS・CSRF・Cookie・セキュリティヘッダをHTTP風に統合検証する", () => {
  const response = handleSecureRequest({
    protocol: "https",
    csrfToken: "csrf-1",
    sessionCsrfToken: "csrf-1",
    sessionId: "session-1",
  });

  assert.equal(
    response.setCookie,
    "__Host-session=session-1; Path=/; Secure; HttpOnly; SameSite=Lax",
  );
  assert.equal(response.headers["X-Frame-Options"], "DENY");
  assert.equal(response.headers["Content-Security-Policy"], "default-src 'self'");
  assert.equal(response.status, 200);
});

test("HTTP風リクエストのCSRF不一致を403で拒否する", () => {
  assert.throws(
    () => handleSecureRequest({
      protocol: "https",
      csrfToken: "request",
      sessionCsrfToken: "session",
      sessionId: "session-1",
    }),
    (error) => error.status === 403,
  );
});
