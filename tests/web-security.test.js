const assert = require("node:assert/strict");
const test = require("node:test");

const { requireHttps } = require("../src/web/require-https");
const { validateCsrfToken } = require("../src/web/validate-csrf-token");
const { createSecurityHeaders } = require("../src/web/create-security-headers");

test("HTTP接続を拒否してHTTPSだけを許可する", () => {
  assert.throws(
    () => requireHttps({ protocol: "http" }),
    (error) => error.status === 400,
  );
  assert.throws(() => requireHttps({}), (error) => error.status === 400);
  assert.equal(requireHttps({ protocol: "https" }), true);
});

test("CSRFトークン不一致を拒否する", () => {
  assert.throws(
    () => validateCsrfToken("request-token", "session-token"),
    (error) => error.status === 403,
  );
  assert.equal(validateCsrfToken("same-token", "same-token"), true);
});

test("セキュリティヘッダを設定する", () => {
  assert.deepEqual(createSecurityHeaders(), {
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Content-Security-Policy": "default-src 'self'",
  });
});
