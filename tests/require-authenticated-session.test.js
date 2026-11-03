const assert = require("node:assert/strict");
const test = require("node:test");

const {
  requireAuthenticatedSession,
} = require("../src/auth/require-authenticated-session");

test("未認証セッションを401で拒否する", () => {
  assert.throws(
    () => requireAuthenticatedSession(null),
    (error) =>
      error.code === "UNAUTHENTICATED" &&
      error.status === 401 &&
      error.message === "Authentication required",
  );
});

test("認証済みセッションを返す", () => {
  const session = { accountId: "account-1", role: "admin" };
  assert.equal(requireAuthenticatedSession(session), session);
});
