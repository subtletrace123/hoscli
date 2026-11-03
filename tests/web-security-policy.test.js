const assert = require("node:assert/strict");
const test = require("node:test");

const {
  SECURITY_HEADERS,
  HTTPS_PROTOCOL,
} = require("../src/web/web-security-policy");

test("Webセキュリティ設定を定数で管理する", () => {
  assert.equal(HTTPS_PROTOCOL, "https");
  assert.equal(SECURITY_HEADERS["X-Frame-Options"], "DENY");
  assert.equal(SECURITY_HEADERS["X-Content-Type-Options"], "nosniff");
});
