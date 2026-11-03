const assert = require("node:assert/strict");
const test = require("node:test");

const { logoutSession } = require("../src/auth/logout-session");
const { requireActiveSession } = require("../src/auth/require-active-session");

test("ログアウトしたセッションを再利用できない", async () => {
  const loggedOutAt = new Date("2026-11-03T01:00:00.000Z");
  const session = {
    id: "session-1",
    accountId: "account-1",
    expiresAt: new Date("2026-11-03T05:00:00.000Z"),
  };
  const revokedSessions = [];
  const sessionRepository = {
    async revoke(sessionId, revokedAt) {
      revokedSessions.push({ sessionId, revokedAt });
    },
  };

  const revokedSession = await logoutSession(
    session,
    sessionRepository,
    loggedOutAt,
  );

  assert.deepEqual(revokedSessions, [
    { sessionId: "session-1", revokedAt: loggedOutAt },
  ]);
  assert.equal(revokedSession.revokedAt, loggedOutAt);
  assert.equal(revokedSession.id, session.id);
  assert.throws(
    () => requireActiveSession(revokedSession, new Date("2026-11-03T02:00:00.000Z")),
    (error) => error.code === "INVALID_CREDENTIALS",
  );
});

test("二重ログアウトでは最初の失効時刻を保持する", async () => {
  const firstRevokedAt = new Date("2026-11-03T01:00:00.000Z");
  const session = {
    id: "session-1",
    accountId: "account-1",
    expiresAt: new Date("2026-11-03T05:00:00.000Z"),
    revokedAt: firstRevokedAt,
  };

  const result = await logoutSession(
    session,
    { async revoke() {} },
    new Date("2026-11-03T02:00:00.000Z"),
  );

  assert.equal(result.revokedAt, firstRevokedAt);
});
