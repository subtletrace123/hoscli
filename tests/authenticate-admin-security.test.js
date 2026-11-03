const assert = require("node:assert/strict");
const test = require("node:test");

const { authenticateAdmin } = require("../src/auth/authenticate-admin");
const {
  createAdminLoginAuditEvent,
} = require("../src/auth/create-admin-login-audit-event");
const { rejectAdminLogin } = require("../src/auth/reject-admin-login");

test("adminは試行回数制限中のログインを拒否する", async () => {
  const account = {
    id: "admin-1",
    loginId: "admin-a",
    passwordHash: "stored-password-hash",
    role: "admin",
    status: "active",
  };
  let passwordVerificationCount = 0;
  const blockedUntil = new Date("2026-11-03T01:05:00.000Z");

  await assert.rejects(
    authenticateAdmin(
      { loginId: account.loginId, password: "correct-password", secondFactor: "123456" },
      {
        accountRepository: { async findByLoginId() { return account; } },
        passwordVerifier: {
          async verify() {
            passwordVerificationCount += 1;
            return true;
          },
        },
        loginFailureStateRepository: {
          async findByAccountId() {
            return {
              consecutiveFailures: 5,
              restrictionStage: 1,
              blockedUntil,
              lastFailedAt: new Date("2026-11-03T01:00:00.000Z"),
            };
          },
        },
        secondFactorVerifier: { async verify() { return true; } },
        sessionRepository: { async save() {} },
        auditEventRepository: { async save() {} },
        clock: { now: () => new Date("2026-11-03T01:01:00.000Z") },
        sessionIdGenerator: () => "admin-session-1",
      },
    ),
    (error) => {
      assert.equal(error.name, "LoginRestrictedError");
      assert.equal(error.retryAt, blockedUntil);
      return true;
    },
  );

  assert.equal(passwordVerificationCount, 0);
});

test("adminの二要素認証失敗を監査ログに記録する", async () => {
  const account = {
    id: "admin-1",
    loginId: "admin-a",
    passwordHash: "stored-password-hash",
    role: "admin",
    status: "active",
  };
  const createdAt = new Date("2026-11-03T01:00:00.000Z");
  const savedAuditEvents = [];
  const savedSessions = [];

  await assert.rejects(
    authenticateAdmin(
      { loginId: account.loginId, password: "correct-password", secondFactor: "000000" },
      {
        accountRepository: { async findByLoginId() { return account; } },
        passwordVerifier: { async verify() { return true; } },
        secondFactorVerifier: { async verify() { return false; } },
        sessionRepository: { async save(session) { savedSessions.push(session); } },
        auditEventRepository: { async save(event) { savedAuditEvents.push(event); } },
        clock: { now: () => createdAt },
        sessionIdGenerator: () => "admin-session-1",
      },
    ),
    (error) => error.code === "INVALID_CREDENTIALS",
  );

  assert.deepEqual(savedAuditEvents, [
    {
      eventType: "admin_login_failed",
      accountId: "admin-1",
      role: "admin",
      createdAt,
      failureReason: "second_factor_mismatch",
    },
  ]);
  assert.deepEqual(savedSessions, []);
});

test("adminの二要素認証不一致を失敗理由付きで監査ログに記録する", async () => {
  const account = {
    id: "admin-1",
    loginId: "admin-a",
    passwordHash: "stored-password-hash",
    role: "admin",
    status: "active",
  };
  const createdAt = new Date("2026-11-03T01:00:00.000Z");
  const savedAuditEvents = [];

  await assert.rejects(
    authenticateAdmin(
      { loginId: account.loginId, password: "correct-password", secondFactor: "000000" },
      {
        accountRepository: { async findByLoginId() { return account; } },
        passwordVerifier: { async verify() { return true; } },
        secondFactorVerifier: { async verify() { return false; } },
        sessionRepository: { async save() {} },
        auditEventRepository: { async save(event) { savedAuditEvents.push(event); } },
        clock: { now: () => createdAt },
        sessionIdGenerator: () => "admin-session-1",
      },
    ),
    (error) => error.code === "INVALID_CREDENTIALS",
  );

  assert.equal(savedAuditEvents[0].failureReason, "second_factor_mismatch");
  assert.equal("secondFactor" in savedAuditEvents[0], false);
});

test("admin拒否処理は失敗監査を記録して共通認証エラーにする", async () => {
  const savedAuditEvents = [];
  const account = { id: "admin-1", role: "admin" };
  const createdAt = new Date("2026-11-03T01:00:00.000Z");

  await assert.rejects(
    rejectAdminLogin({
      account,
      createdAt,
      auditEventRepository: {
        async save(event) {
          savedAuditEvents.push(event);
        },
      },
    }),
    (error) => error.code === "INVALID_CREDENTIALS",
  );

  assert.deepEqual(savedAuditEvents, [
    {
      eventType: "admin_login_failed",
      accountId: "admin-1",
      role: "admin",
      createdAt,
    },
  ]);
});

test("adminログイン監査イベントは秘密情報を含めない", () => {
  const event = createAdminLoginAuditEvent({
    accountId: "admin-1",
    createdAt: new Date("2026-11-03T01:00:00.000Z"),
  });

  assert.deepEqual(event, {
    eventType: "admin_login_succeeded",
    accountId: "admin-1",
    role: "admin",
    createdAt: new Date("2026-11-03T01:00:00.000Z"),
  });
});

test("adminログイン失敗監査イベントは種別だけを切り替える", () => {
  assert.deepEqual(
    createAdminLoginAuditEvent({
      accountId: "admin-1",
      createdAt: new Date("2026-11-03T01:00:00.000Z"),
      eventType: "admin_login_failed",
    }),
    {
      eventType: "admin_login_failed",
      accountId: "admin-1",
      role: "admin",
      createdAt: new Date("2026-11-03T01:00:00.000Z"),
    },
  );
});

test("adminログインはパスワードに加えて二要素認証を要求し成功監査を記録する", async () => {
  const authenticatedAt = new Date("2026-11-03T01:00:00.000Z");
  const savedAuditEvents = [];
  let auditSaveCount = 0;
  let secondFactorVerificationCount = 0;
  const account = {
    id: "admin-1",
    loginId: "admin-a",
    passwordHash: "stored-password-hash",
    role: "admin",
    status: "active",
  };

  await authenticateAdmin(
    {
      loginId: "admin-a",
      password: "correct-password",
      secondFactor: "123456",
    },
    {
      accountRepository: {
        async findByLoginId() {
          return account;
        },
      },
      passwordVerifier: { async verify() { return true; } },
      secondFactorVerifier: {
        async verify(value, receivedAccount) {
          secondFactorVerificationCount += 1;
          assert.equal(value, "123456");
          assert.equal(receivedAccount.id, account.id);
          return true;
        },
      },
      sessionRepository: { async save() {} },
      auditEventRepository: {
        async save(event) {
          auditSaveCount += 1;
          savedAuditEvents.push(event);
        },
      },
      clock: { now: () => authenticatedAt },
      sessionIdGenerator: () => "admin-session-1",
    },
  );

  assert.equal(secondFactorVerificationCount, 1);
  assert.equal(auditSaveCount, 1);
  assert.deepEqual(savedAuditEvents, [
    {
      eventType: "admin_login_succeeded",
      accountId: "admin-1",
      role: "admin",
      createdAt: authenticatedAt,
    },
  ]);
  assert.equal("password" in savedAuditEvents[0], false);
  assert.equal("secondFactor" in savedAuditEvents[0], false);
});

test("adminのパスワード不一致は拒否しセッションを保存せず失敗監査を記録する", async () => {
  const savedSessions = [];
  const savedAuditEvents = [];
  let secondFactorVerificationCount = 0;
  const account = {
    id: "admin-1",
    loginId: "admin-a",
    passwordHash: "stored-password-hash",
    role: "admin",
    status: "active",
  };

  await assert.rejects(
    authenticateAdmin(
      { loginId: account.loginId, password: "wrong-password", secondFactor: "123456" },
      {
        accountRepository: { async findByLoginId() { return account; } },
        passwordVerifier: { async verify() { return false; } },
        secondFactorVerifier: {
          async verify() {
            secondFactorVerificationCount += 1;
            return true;
          },
        },
        sessionRepository: { async save(session) { savedSessions.push(session); } },
        auditEventRepository: { async save(event) { savedAuditEvents.push(event); } },
        clock: { now: () => new Date("2026-11-03T01:00:00.000Z") },
        sessionIdGenerator: () => "admin-session-1",
      },
    ),
    (error) => {
      assert.equal(error.name, "AuthenticationError");
      assert.equal(error.code, "INVALID_CREDENTIALS");
      return true;
    },
  );

  assert.deepEqual(savedSessions, []);
  assert.equal(secondFactorVerificationCount, 0);
  assert.deepEqual(savedAuditEvents, [
    {
      eventType: "admin_login_failed",
      accountId: "admin-1",
      role: "admin",
      createdAt: new Date("2026-11-03T01:00:00.000Z"),
    },
  ]);
});

test("停止中のadminアカウントは拒否しセッションを保存せず失敗監査を記録する", async () => {
  const savedSessions = [];
  const savedAuditEvents = [];
  let passwordVerificationCount = 0;
  let secondFactorVerificationCount = 0;
  const account = {
    id: "admin-1",
    loginId: "admin-a",
    passwordHash: "stored-password-hash",
    role: "admin",
    status: "suspended",
  };

  await assert.rejects(
    authenticateAdmin(
      { loginId: account.loginId, password: "correct-password", secondFactor: "123456" },
      {
        accountRepository: { async findByLoginId() { return account; } },
        passwordVerifier: {
          async verify() {
            passwordVerificationCount += 1;
            return true;
          },
        },
        secondFactorVerifier: {
          async verify() {
            secondFactorVerificationCount += 1;
            return true;
          },
        },
        sessionRepository: { async save(session) { savedSessions.push(session); } },
        auditEventRepository: { async save(event) { savedAuditEvents.push(event); } },
        clock: { now: () => new Date("2026-11-03T01:00:00.000Z") },
        sessionIdGenerator: () => "admin-session-1",
      },
    ),
    (error) => error.code === "INVALID_CREDENTIALS",
  );

  assert.deepEqual(savedSessions, []);
  assert.equal(passwordVerificationCount, 0);
  assert.equal(secondFactorVerificationCount, 0);
  assert.deepEqual(savedAuditEvents, [
    {
      eventType: "admin_login_failed",
      accountId: "admin-1",
      role: "admin",
      createdAt: new Date("2026-11-03T01:00:00.000Z"),
    },
  ]);
});

test("異なるロールのアカウントはadminログインとして拒否する", async () => {
  const savedSessions = [];
  const savedAuditEvents = [];
  let passwordVerificationCount = 0;
  let secondFactorVerificationCount = 0;
  const account = {
    id: "hospital-staff-1",
    loginId: "hospital-office-a",
    passwordHash: "stored-password-hash",
    role: "hospital_staff",
    status: "active",
  };

  await assert.rejects(
    authenticateAdmin(
      { loginId: account.loginId, password: "correct-password", secondFactor: "123456" },
      {
        accountRepository: { async findByLoginId() { return account; } },
        passwordVerifier: {
          async verify() {
            passwordVerificationCount += 1;
            return true;
          },
        },
        secondFactorVerifier: {
          async verify() {
            secondFactorVerificationCount += 1;
            return true;
          },
        },
        sessionRepository: { async save(session) { savedSessions.push(session); } },
        auditEventRepository: { async save(event) { savedAuditEvents.push(event); } },
        clock: { now: () => new Date("2026-11-03T01:00:00.000Z") },
        sessionIdGenerator: () => "admin-session-1",
      },
    ),
    (error) => error.code === "INVALID_CREDENTIALS",
  );

  assert.deepEqual(savedSessions, []);
  assert.equal(passwordVerificationCount, 0);
  assert.equal(secondFactorVerificationCount, 0);
  assert.deepEqual(savedAuditEvents, [
    {
      eventType: "admin_login_failed",
      accountId: "hospital-staff-1",
      role: "admin",
      createdAt: new Date("2026-11-03T01:00:00.000Z"),
    },
  ]);
});
