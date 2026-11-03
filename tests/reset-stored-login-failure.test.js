const assert = require("node:assert/strict");
const test = require("node:test");

const {
  resetStoredLoginFailure,
} = require("../src/auth/reset-stored-login-failure");

test("保存済みの連続失敗状態を初期化する", async () => {
  const savedStates = [];
  const state = {
    consecutiveFailures: 5,
    restrictionStage: 1,
    blockedUntil: new Date("2026-11-01T00:59:59.000Z"),
    lastFailedAt: new Date("2026-11-01T00:54:59.000Z"),
  };

  await resetStoredLoginFailure({
    accountId: "account-1",
    state,
    loginFailureStateRepository: {
      async save(accountId, resetState) {
        savedStates.push({ accountId, state: resetState });
      },
    },
  });

  assert.deepEqual(savedStates, [
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
  assert.equal(state.consecutiveFailures, 5);
});
