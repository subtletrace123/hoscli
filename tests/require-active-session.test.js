const assert = require("node:assert/strict");
const test = require("node:test");

const {
  requireActiveSession,
} = require("../src/auth/require-active-session");

test("期限切れセッションを拒否する", () => {
  const session = {
    id: "session-1",
    accountId: "account-1",
    expiresAt: new Date("2026-11-03T01:00:00.000Z"),
  };

  assert.throws(
    () => requireActiveSession(session, new Date("2026-11-03T01:00:00.001Z")),
    (error) => error.code === "INVALID_CREDENTIALS",
  );
  assert.throws(
    () => requireActiveSession(session, session.expiresAt),
    (error) => error.code === "INVALID_CREDENTIALS",
  );
});

test("期限内セッションを返す", () => {
  const session = {
    id: "session-1",
    accountId: "account-1",
    expiresAt: new Date("2026-11-03T01:00:00.000Z"),
  };

  assert.equal(
    requireActiveSession(session, new Date("2026-11-03T00:59:59.999Z")),
    session,
  );
});
