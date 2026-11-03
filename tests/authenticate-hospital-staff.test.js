const assert = require("node:assert/strict");
const test = require("node:test");

const {
  authenticateHospitalStaff,
} = require("../src/auth/authenticate-hospital-staff");
const { requireAccount } = require("../src/auth/require-account");
const { isActiveAccount } = require("../src/auth/is-active-account");
const { requireAccountRole } = require("../src/auth/require-account-role");

test("病院事務は試行回数制限中のログインを拒否する", async () => {
  const account = {
    id: "hospital-staff-1",
    loginId: "hospital-office-a",
    passwordHash: "stored-password-hash",
    role: "hospital_staff",
    status: "active",
  };
  let passwordVerificationCount = 0;
  const blockedUntil = new Date("2026-11-03T01:05:00.000Z");

  await assert.rejects(
    authenticateHospitalStaff(
      { loginId: account.loginId, password: "correct-password" },
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
        sessionRepository: { async save() {} },
        clock: { now: () => new Date("2026-11-03T01:01:00.000Z") },
        sessionIdGenerator: () => "hospital-session-1",
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

test("病院事務のログイン失敗を監査ログに記録する", async () => {
  const account = {
    id: "hospital-staff-1",
    clinicId: "hospital-1",
    loginId: "hospital-office-a",
    passwordHash: "stored-password-hash",
    role: "hospital_staff",
    status: "active",
  };
  const createdAt = new Date("2026-11-03T01:00:00.000Z");
  const savedAuditEvents = [];
  const savedSessions = [];

  await assert.rejects(
    authenticateHospitalStaff(
      { loginId: account.loginId, password: "wrong-password" },
      {
        accountRepository: { async findByLoginId() { return account; } },
        passwordVerifier: { async verify() { return false; } },
        sessionRepository: { async save(session) { savedSessions.push(session); } },
        auditEventRepository: { async save(event) { savedAuditEvents.push(event); } },
        clock: { now: () => createdAt },
        sessionIdGenerator: () => "hospital-session-1",
      },
    ),
    (error) => error.code === "INVALID_CREDENTIALS",
  );

  assert.deepEqual(savedAuditEvents, [
    {
      eventType: "login_failed",
      clinicId: "hospital-1",
      accountId: "hospital-staff-1",
      createdAt,
    },
  ]);
  assert.deepEqual(savedSessions, []);
});

test("ログイン対象ロールが一致しなければ共通認証エラーにする", () => {
  assert.throws(
    () => requireAccountRole({ role: "admin" }, "hospital_staff"),
    (error) => error.code === "INVALID_CREDENTIALS",
  );
});

test("有効なアカウントだけをactiveとして判定する", () => {
  assert.equal(isActiveAccount({ status: "active" }), true);
  assert.equal(isActiveAccount({ status: "suspended" }), false);
});

test("アカウントが存在しなければ共通認証エラーにする", () => {
  assert.throws(
    () => requireAccount(null),
    (error) => error.code === "INVALID_CREDENTIALS",
  );
});

test("有効な病院事務アカウントでログインすると4時間有効な病院事務セッションを発行する", async () => {
  const authenticatedAt = new Date("2026-11-03T01:00:00.000Z");
  const savedSessions = [];
  let accountLookupCount = 0;
  const account = {
    id: "hospital-staff-1",
    loginId: "hospital-office-a",
    passwordHash: "stored-password-hash",
    role: "hospital_staff",
    status: "active",
  };

  const session = await authenticateHospitalStaff(
    {
      loginId: "hospital-office-a",
      password: "correct-password",
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
      sessionRepository: {
        async save(value) {
          savedSessions.push(value);
        },
      },
      clock: { now: () => authenticatedAt },
      sessionIdGenerator: () => "hospital-session-1",
    },
  );

  assert.deepEqual(session, {
    id: "hospital-session-1",
    accountId: "hospital-staff-1",
    role: "hospital_staff",
    authenticatedAt,
    expiresAt: new Date("2026-11-03T05:00:00.000Z"),
  });
  assert.deepEqual(savedSessions, [session]);
  assert.equal(accountLookupCount, 1);
  assert.equal("password" in session, false);
  assert.equal("passwordHash" in session, false);
});

test("存在しない病院事務IDは共通認証エラーで拒否してセッションを保存しない", async () => {
  const savedSessions = [];
  let passwordVerificationCount = 0;
  let accountLookupCount = 0;

  await assert.rejects(
    authenticateHospitalStaff(
      { loginId: "unknown-hospital-staff", password: "some-password" },
      {
        accountRepository: {
          async findByLoginId() {
            accountLookupCount += 1;
            return null;
          },
        },
        passwordVerifier: {
          async verify() {
            passwordVerificationCount += 1;
            return false;
          },
        },
        sessionRepository: {
          async save(session) {
            savedSessions.push(session);
          },
        },
        clock: { now: () => new Date("2026-11-03T01:00:00.000Z") },
        sessionIdGenerator: () => "hospital-session-1",
      },
    ),
    (error) => {
      assert.equal(error.name, "AuthenticationError");
      assert.equal(error.code, "INVALID_CREDENTIALS");
      assert.equal(error.message, "Authentication failed");
      return true;
    },
  );

  assert.equal(passwordVerificationCount, 0);
  assert.equal(accountLookupCount, 1);
  assert.deepEqual(savedSessions, []);
});

test("病院事務のパスワード不一致は共通認証エラーで拒否してセッションを保存しない", async () => {
  const savedSessions = [];
  const account = {
    id: "hospital-staff-1",
    loginId: "hospital-office-a",
    passwordHash: "stored-password-hash",
    role: "hospital_staff",
    status: "active",
  };

  await assert.rejects(
    authenticateHospitalStaff(
      { loginId: account.loginId, password: "wrong-password" },
      {
        accountRepository: { async findByLoginId() { return account; } },
        passwordVerifier: { async verify() { return false; } },
        sessionRepository: { async save(session) { savedSessions.push(session); } },
        clock: { now: () => new Date("2026-11-03T01:00:00.000Z") },
        sessionIdGenerator: () => "hospital-session-1",
      },
    ),
    (error) => {
      assert.equal(error.name, "AuthenticationError");
      assert.equal(error.code, "INVALID_CREDENTIALS");
      return true;
    },
  );

  assert.deepEqual(savedSessions, []);
});

test("停止中の病院事務アカウントは共通認証エラーで拒否してセッションを保存しない", async () => {
  const savedSessions = [];
  let passwordVerificationCount = 0;
  const account = {
    id: "hospital-staff-1",
    loginId: "hospital-office-a",
    passwordHash: "stored-password-hash",
    role: "hospital_staff",
    status: "suspended",
  };

  await assert.rejects(
    authenticateHospitalStaff(
      { loginId: account.loginId, password: "correct-password" },
      {
        accountRepository: { async findByLoginId() { return account; } },
        passwordVerifier: {
          async verify() {
            passwordVerificationCount += 1;
            return true;
          },
        },
        sessionRepository: { async save(session) { savedSessions.push(session); } },
        clock: { now: () => new Date("2026-11-03T01:00:00.000Z") },
        sessionIdGenerator: () => "hospital-session-1",
      },
    ),
    (error) => error.code === "INVALID_CREDENTIALS",
  );

  assert.deepEqual(savedSessions, []);
  assert.equal(passwordVerificationCount, 0);
});

test("異なるロールのアカウントは病院事務ログインとして拒否する", async () => {
  const savedSessions = [];
  let passwordVerificationCount = 0;
  const account = {
    id: "admin-1",
    loginId: "admin-a",
    passwordHash: "stored-password-hash",
    role: "admin",
    status: "active",
  };

  await assert.rejects(
    authenticateHospitalStaff(
      { loginId: account.loginId, password: "correct-password" },
      {
        accountRepository: { async findByLoginId() { return account; } },
        passwordVerifier: {
          async verify() {
            passwordVerificationCount += 1;
            return true;
          },
        },
        sessionRepository: { async save(session) { savedSessions.push(session); } },
        clock: { now: () => new Date("2026-11-03T01:00:00.000Z") },
        sessionIdGenerator: () => "hospital-session-1",
      },
    ),
    (error) => error.code === "INVALID_CREDENTIALS",
  );

  assert.deepEqual(savedSessions, []);
  assert.equal(passwordVerificationCount, 0);
});
