const assert = require("node:assert/strict");
const test = require("node:test");

const {
  requireSessionForAccount,
} = require("../src/auth/require-session-for-account");

function session() {
  return {
    id: "session-1",
    accountId: "account-1",
    authenticatedAt: new Date("2026-11-03T01:00:00.000Z"),
    expiresAt: new Date("2026-11-03T05:00:00.000Z"),
  };
}

test("停止されたアカウントの既存セッションを拒否する", () => {
  assert.throws(
    () => requireSessionForAccount(
      session(),
      { id: "account-1", status: "suspended" },
      new Date("2026-11-03T02:00:00.000Z"),
    ),
    (error) => error.code === "INVALID_CREDENTIALS",
  );
});

test("パスワード変更前に発行されたセッションを拒否する", () => {
  assert.throws(
    () => requireSessionForAccount(
      session(),
      {
        id: "account-1",
        status: "active",
        passwordChangedAt: new Date("2026-11-03T01:30:00.000Z"),
      },
      new Date("2026-11-03T02:00:00.000Z"),
    ),
    (error) => error.code === "INVALID_CREDENTIALS",
  );
});

test("有効なアカウントの有効なセッションを返す", () => {
  const currentSession = session();
  assert.equal(
    requireSessionForAccount(
      currentSession,
      { id: "account-1", status: "active" },
      new Date("2026-11-03T02:00:00.000Z"),
    ),
    currentSession,
  );
});
