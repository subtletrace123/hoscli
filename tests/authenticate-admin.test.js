const assert = require("node:assert/strict");
const test = require("node:test");

const { authenticateAdmin } = require("../src/auth/authenticate-admin");
const { createAdminSession } = require("../src/auth/create-admin-session");

test("adminセッション生成は認証情報を含めず4時間後を期限にする", () => {
  const authenticatedAt = new Date("2026-11-03T01:00:00.000Z");
  const account = { id: "admin-1", role: "admin", passwordHash: "secret" };

  assert.deepEqual(
    createAdminSession({ id: "session-1", account, authenticatedAt }),
    {
      id: "session-1",
      accountId: "admin-1",
      role: "admin",
      authenticatedAt,
      expiresAt: new Date("2026-11-03T05:00:00.000Z"),
    },
  );
});

test("有効なadminアカウントでログインすると4時間有効なadminセッションを発行する", async () => {
  const authenticatedAt = new Date("2026-11-03T01:00:00.000Z");
  const savedSessions = [];
  let accountLookupCount = 0;
  const account = {
    id: "admin-1",
    loginId: "admin-a",
    passwordHash: "stored-password-hash",
    role: "admin",
    status: "active",
  };

  const session = await authenticateAdmin(
    {
      loginId: "admin-a",
      password: "correct-password",
      secondFactor: "123456",
    },
    {
      accountRepository: {
        async findByLoginId(loginId) {
          accountLookupCount += 1;
          assert.equal(loginId, account.loginId);
          return account;
        },
      },
      passwordVerifier: {
        async verify(password, passwordHash) {
          assert.equal(password, "correct-password");
          assert.equal(passwordHash, account.passwordHash);
          return true;
        },
      },
      secondFactorVerifier: { async verify() { return true; } },
      sessionRepository: {
        async save(value) {
          savedSessions.push(value);
        },
      },
      auditEventRepository: { async save() {} },
      clock: { now: () => authenticatedAt },
      sessionIdGenerator: () => "admin-session-1",
    },
  );

  assert.deepEqual(session, {
    id: "admin-session-1",
    accountId: "admin-1",
    role: "admin",
    authenticatedAt,
    expiresAt: new Date("2026-11-03T05:00:00.000Z"),
  });
  assert.deepEqual(savedSessions, [session]);
  assert.equal("password" in session, false);
  assert.equal("passwordHash" in session, false);
  assert.equal(accountLookupCount, 1);
});

test("adminログインはID生成器未指定時に暗号学的に安全なセッションIDを発行する", async () => {
  const session = await authenticateAdmin(
    { loginId: "admin-a", password: "correct-password", secondFactor: "123456" },
    {
      accountRepository: {
        async findByLoginId() {
          return {
            id: "admin-1",
            loginId: "admin-a",
            passwordHash: "stored-password-hash",
            role: "admin",
            status: "active",
          };
        },
      },
      passwordVerifier: { async verify() { return true; } },
      secondFactorVerifier: { async verify() { return true; } },
      sessionRepository: { async save() {} },
      auditEventRepository: { async save() {} },
      clock: { now: () => new Date("2026-11-03T01:00:00.000Z") },
    },
  );

  assert.match(session.id, /^[0-9a-f]{64}$/);
});
