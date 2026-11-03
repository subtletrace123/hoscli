const assert = require("node:assert/strict");
const test = require("node:test");

const {
  AuthenticationError,
  LoginRestrictedError,
} = require("../src/auth/authentication-error");
const { authenticateClinic } = require("../src/auth/authenticate-clinic");

const ACTIVE_ACCOUNT = {
  id: "account-1",
  clinicId: "clinic-1",
  passwordHash: "stored-password-hash",
  status: "active",
};
const AUTHENTICATED_AT = new Date("2026-11-01T01:00:00.000Z");

function createAuthenticationFixture({
  account = ACTIVE_ACCOUNT,
  loginId = "clinic-a",
  loginFailureState = null,
  password = "correct-password",
  passwordIsValid = true,
} = {}) {
  const savedSessions = [];
  const savedAuditEvents = [];
  const savedLoginFailureStates = [];
  let accountLookupCount = 0;
  let passwordVerificationCount = 0;

  return {
    credentials: { loginId, password },
    dependencies: {
      accountRepository: {
        async findByLoginId(receivedLoginId) {
          accountLookupCount += 1;
          assert.equal(receivedLoginId, loginId);
          return account;
        },
      },
      passwordVerifier: {
        async verify(receivedPassword, passwordHash) {
          passwordVerificationCount += 1;
          assert.equal(receivedPassword, password);
          assert.equal(passwordHash, account.passwordHash);
          return passwordIsValid;
        },
      },
      sessionRepository: {
        async save(session) {
          savedSessions.push(session);
        },
      },
      auditEventRepository: {
        async save(event) {
          savedAuditEvents.push(event);
        },
      },
      loginFailureStateRepository: {
        async findByAccountId(accountId) {
          assert.equal(accountId, account?.id);
          return loginFailureState;
        },
        async save(accountId, state) {
          savedLoginFailureStates.push({ accountId, state });
        },
      },
      clock: { now: () => AUTHENTICATED_AT },
      loginFailureObservationPeriodMs: 24 * 60 * 60 * 1000,
      sessionIdGenerator: () => "session-1",
    },
    savedAuditEvents,
    savedLoginFailureStates,
    savedSessions,
    get accountLookupCount() {
      return accountLookupCount;
    },
    get passwordVerificationCount() {
      return passwordVerificationCount;
    },
  };
}

async function assertAuthenticationRejected(fixture) {
  const authentication = authenticateClinic(
    fixture.credentials,
    fixture.dependencies,
  );

  await assert.rejects(authentication, (error) => {
    assert.ok(error instanceof AuthenticationError);
    assert.equal(error.name, "AuthenticationError");
    assert.equal(error.code, "INVALID_CREDENTIALS");
    assert.equal(error.message, "Authentication failed");
    return true;
  });
  assert.deepEqual(fixture.savedSessions, []);
}

function assertAuditEvent(fixture, expectedEvent) {
  assert.deepEqual(fixture.savedAuditEvents, [expectedEvent]);
  assert.equal(fixture.savedAuditEvents.length, 1);

  const [event] = fixture.savedAuditEvents;
  assert.equal("loginId" in event, false);
  assert.equal("password" in event, false);
  assert.equal("passwordHash" in event, false);
}

test("有効な医院アカウントでログインすると4時間有効なセッションを発行する", async () => {
  const fixture = createAuthenticationFixture();

  const session = await authenticateClinic(
    fixture.credentials,
    fixture.dependencies,
  );

  assert.deepEqual(session, {
    id: "session-1",
    accountId: "account-1",
    clinicId: "clinic-1",
    authenticatedAt: AUTHENTICATED_AT,
    expiresAt: new Date("2026-11-01T05:00:00.000Z"),
  });
  assert.deepEqual(fixture.savedSessions, [session]);
  assert.equal(fixture.accountLookupCount, 1);
  assert.equal("password" in session, false);
  assert.equal("passwordHash" in session, false);
});

test("パスワードが一致しない場合は認証を拒否してセッションを保存しない", async () => {
  const fixture = createAuthenticationFixture({
    password: "wrong-password",
    passwordIsValid: false,
  });

  await assertAuthenticationRejected(fixture);

  assert.equal(fixture.accountLookupCount, 1);
});

test("存在しないIDの場合も共通の認証エラーで拒否してセッションを保存しない", async () => {
  const fixture = createAuthenticationFixture({
    account: null,
    loginId: "unknown-clinic",
    password: "some-password",
  });

  await assertAuthenticationRejected(fixture);
});

test("停止中の医院アカウントは認証を拒否してセッションを保存しない", async () => {
  const fixture = createAuthenticationFixture({
    account: { ...ACTIVE_ACCOUNT, status: "suspended" },
  });

  await assertAuthenticationRejected(fixture);
});

test("パスワード不一致の認証失敗を秘密情報なしで監査ログに記録する", async () => {
  const fixture = createAuthenticationFixture({
    password: "wrong-password",
    passwordIsValid: false,
  });

  await assertAuthenticationRejected(fixture);

  assertAuditEvent(fixture, {
    eventType: "login_failed",
    clinicId: "clinic-1",
    accountId: "account-1",
    createdAt: AUTHENTICATED_AT,
  });
});

test("ログイン成功を秘密情報なしで監査ログに記録する", async () => {
  const fixture = createAuthenticationFixture();

  await authenticateClinic(fixture.credentials, fixture.dependencies);

  assertAuditEvent(fixture, {
    eventType: "login_succeeded",
    clinicId: "clinic-1",
    accountId: "account-1",
    createdAt: AUTHENTICATED_AT,
  });
});

test("存在しないIDの認証失敗を秘密情報なしで監査ログに記録する", async () => {
  const fixture = createAuthenticationFixture({
    account: null,
    loginId: "unknown-clinic",
    password: "some-password",
  });

  await assertAuthenticationRejected(fixture);

  assertAuditEvent(fixture, {
    eventType: "login_failed",
    clinicId: null,
    accountId: null,
    createdAt: AUTHENTICATED_AT,
  });
});

test("停止中アカウントの認証失敗を秘密情報なしで監査ログに記録する", async () => {
  const fixture = createAuthenticationFixture({
    account: { ...ACTIVE_ACCOUNT, status: "suspended" },
  });

  await assertAuthenticationRejected(fixture);
  assert.equal(fixture.accountLookupCount, 1);

  assertAuditEvent(fixture, {
    eventType: "login_failed",
    clinicId: "clinic-1",
    accountId: "account-1",
    createdAt: AUTHENTICATED_AT,
  });
});

test("制限中は正しい認証情報でもログインを拒否して状態を変更しない", async () => {
  const blockedUntil = new Date("2026-11-01T01:05:00.000Z");
  const fixture = createAuthenticationFixture({
    loginFailureState: {
      consecutiveFailures: 5,
      restrictionStage: 1,
      blockedUntil,
      lastFailedAt: AUTHENTICATED_AT,
    },
  });

  await assert.rejects(
    authenticateClinic(fixture.credentials, fixture.dependencies),
    (error) => {
      assert.ok(error instanceof LoginRestrictedError);
      assert.equal(error.name, "LoginRestrictedError");
      assert.equal(error.code, "LOGIN_RESTRICTED");
      assert.equal(error.message, "Login temporarily restricted");
      assert.deepEqual(error.retryAt, blockedUntil);
      return true;
    },
  );

  assert.equal(fixture.passwordVerificationCount, 0);
  assert.deepEqual(fixture.savedLoginFailureStates, []);
  assert.deepEqual(fixture.savedSessions, []);
});

test("パスワード不一致を5回目の失敗として保存して5分制限を開始する", async () => {
  const fixture = createAuthenticationFixture({
    loginFailureState: {
      consecutiveFailures: 4,
      restrictionStage: 0,
      blockedUntil: null,
      lastFailedAt: new Date("2026-11-01T00:59:59.000Z"),
    },
    password: "wrong-password",
    passwordIsValid: false,
  });

  await assertAuthenticationRejected(fixture);

  assert.equal(fixture.passwordVerificationCount, 1);
  assert.deepEqual(fixture.savedLoginFailureStates, [
    {
      accountId: "account-1",
      state: {
        consecutiveFailures: 5,
        restrictionStage: 1,
        blockedUntil: new Date("2026-11-01T01:05:00.000Z"),
        lastFailedAt: AUTHENTICATED_AT,
      },
    },
  ]);
});

test("制限解除後の認証成功で保存済みの連続失敗状態をリセットする", async () => {
  const fixture = createAuthenticationFixture({
    loginFailureState: {
      consecutiveFailures: 5,
      restrictionStage: 1,
      blockedUntil: new Date("2026-11-01T00:59:59.000Z"),
      lastFailedAt: new Date("2026-11-01T00:54:59.000Z"),
    },
  });

  const session = await authenticateClinic(
    fixture.credentials,
    fixture.dependencies,
  );

  assert.equal(fixture.passwordVerificationCount, 1);
  assert.deepEqual(fixture.savedSessions, [session]);
  assert.deepEqual(fixture.savedLoginFailureStates, [
    {
      accountId: "account-1",
      state: {
        consecutiveFailures: 0,
        restrictionStage: 0,
        blockedUntil: null,
        lastFailedAt: null,
      },
    },
  ]);
});

test("初期パスワードでログインするとパスワード変更専用セッションを発行する", async () => {
  const fixture = createAuthenticationFixture({
    account: { ...ACTIVE_ACCOUNT, mustChangePassword: true },
  });

  const session = await authenticateClinic(
    fixture.credentials,
    fixture.dependencies,
  );

  assert.equal(session.access, "password_change_only");
  assert.deepEqual(fixture.savedSessions, [session]);
});
