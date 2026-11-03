const assert = require("node:assert/strict");
const test = require("node:test");

const {
  createSessionCookie,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_ATTRIBUTES,
} = require("../src/auth/create-session-cookie");

test("セッションCookieの名前と属性を定数で管理する", () => {
  assert.equal(SESSION_COOKIE_NAME, "__Host-session");
  assert.deepEqual(SESSION_COOKIE_ATTRIBUTES, [
    "Path=/",
    "Secure",
    "HttpOnly",
    "SameSite=Lax",
  ]);
});

test("セッションCookieにSecure・HttpOnly・SameSiteを設定する", () => {
  assert.equal(
    createSessionCookie("session-id-1"),
    "__Host-session=session-id-1; Path=/; Secure; HttpOnly; SameSite=Lax",
  );
  assert.match(createSessionCookie("session-id-2"), /^__Host-session=session-id-2;/);
});
