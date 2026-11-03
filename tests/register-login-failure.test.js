const assert = require("node:assert/strict");
const test = require("node:test");

const {
  registerLoginFailure,
} = require("../src/auth/register-login-failure");

function createRegisterLoginFailureFixture(accountId, currentState) {
  const savedAuditEvents = [];
  const savedStates = [];
  const revokedAccountIds = [];

  return {
    dependencies: {
      auditEventRepository: {
        async save(event) {
          savedAuditEvents.push(event);
        },
      },
      loginFailureStateRepository: {
        async findByAccountId(receivedAccountId) {
          assert.equal(receivedAccountId, accountId);
          return currentState;
        },
        async save(receivedAccountId, state) {
          savedStates.push({ accountId: receivedAccountId, state });
        },
      },
      sessionRepository: {
        async revokeAllForAccount(receivedAccountId) {
          revokedAccountIds.push(receivedAccountId);
        },
      },
    },
    revokedAccountIds,
    savedAuditEvents,
    savedStates,
  };
}

test("外部からのログイン失敗で既存セッションを失効させない", async () => {
  const accountId = "account-1";
  const currentState = {
    consecutiveFailures: 4,
    restrictionStage: 0,
    blockedUntil: null,
    lastFailedAt: new Date("2026-11-01T01:00:03.000Z"),
  };
  const fixture = createRegisterLoginFailureFixture(accountId, currentState);

  const nextState = await registerLoginFailure(
    {
      accountId,
      failedAt: new Date("2026-11-01T01:00:04.000Z"),
      observationPeriodMs: 24 * 60 * 60 * 1000,
    },
    fixture.dependencies,
  );

  assert.notEqual(nextState, currentState);
  assert.deepEqual(nextState, {
    consecutiveFailures: 5,
    restrictionStage: 1,
    blockedUntil: new Date("2026-11-01T01:05:04.000Z"),
    lastFailedAt: new Date("2026-11-01T01:00:04.000Z"),
  });
  assert.deepEqual(fixture.savedStates, [{ accountId, state: nextState }]);
  assert.deepEqual(fixture.revokedAccountIds, []);
});

test("制限段階に入ると管理側で確認できる監査イベントを記録する", async () => {
  const accountId = "account-1";
  const clinicId = "clinic-1";
  const failedAt = new Date("2026-11-01T01:00:04.000Z");
  const fixture = createRegisterLoginFailureFixture(accountId, {
    consecutiveFailures: 4,
    restrictionStage: 0,
    blockedUntil: null,
    lastFailedAt: new Date("2026-11-01T01:00:03.000Z"),
  });

  await registerLoginFailure(
    {
      accountId,
      clinicId,
      failedAt,
      observationPeriodMs: 24 * 60 * 60 * 1000,
    },
    fixture.dependencies,
  );

  assert.deepEqual(fixture.savedAuditEvents, [
    {
      eventType: "login_restricted",
      clinicId,
      accountId,
      restrictionStage: 1,
      consecutiveFailures: 5,
      blockedUntil: new Date("2026-11-01T01:05:04.000Z"),
      createdAt: failedAt,
    },
  ]);
  assert.equal(fixture.savedAuditEvents.length, 1);
  assert.equal("loginId" in fixture.savedAuditEvents[0], false);
  assert.equal("password" in fixture.savedAuditEvents[0], false);
  assert.equal("passwordHash" in fixture.savedAuditEvents[0], false);
});
