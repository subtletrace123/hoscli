const assert = require("node:assert/strict");
const test = require("node:test");

const { authenticateClinic } = require("../src/auth/authenticate-clinic");
const {
  createInMemoryLoginFixture,
} = require("../src/in-memory-login-fixture");
const {
  logoutAuthenticatedSession,
} = require("../src/auth/logout-authenticated-session");
const { requireActiveSession } = require("../src/auth/require-active-session");

test("ログアウト処理を統合検証し、セッションを再利用できない", async () => {
  const now = new Date("2026-11-03T01:00:00.000Z");
  const fixture = createInMemoryLoginFixture({
    account: {
      id: "clinic-1",
      loginId: "clinic-login",
      clinicId: "clinic-1",
      passwordHash: "hash",
      status: "active",
    },
    password: "correct-password",
    now,
  });
  const session = await authenticateClinic(
    { loginId: "clinic-login", password: "correct-password" },
    fixture.dependencies,
  );

  const loggedOut = await logoutAuthenticatedSession(
    session,
    fixture.sessionRepository,
    new Date("2026-11-03T01:05:00.000Z"),
  );

  assert.ok(loggedOut.revokedAt);
  assert.equal(loggedOut.id, session.id);
  assert.throws(
    () => requireActiveSession(loggedOut, new Date("2026-11-03T01:06:00.000Z")),
    (error) => error.code === "INVALID_CREDENTIALS",
  );
});
