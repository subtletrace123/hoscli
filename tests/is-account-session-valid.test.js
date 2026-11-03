const assert = require("node:assert/strict");
const test = require("node:test");

const {
  isAccountSessionValid,
} = require("../src/auth/is-account-session-valid");

test("アカウント変更に対するセッション有効性を判定する", () => {
  const session = {
    authenticatedAt: new Date("2026-11-03T01:00:00.000Z"),
  };

  assert.equal(isAccountSessionValid(session, { status: "active" }), true);
  assert.equal(isAccountSessionValid(session, { status: "suspended" }), false);
  assert.equal(
    isAccountSessionValid(session, {
      status: "active",
      passwordChangedAt: new Date("2026-11-03T01:30:00.000Z"),
    }),
    false,
  );
});
