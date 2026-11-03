const assert = require("node:assert/strict");
const test = require("node:test");

const {
  ensureLoginNotRestricted,
} = require("../src/auth/ensure-login-not-restricted");

test("制限中のログインを共通ヘルパーで拒否する", async () => {
  const blockedUntil = new Date("2026-11-03T01:05:00.000Z");

  await assert.rejects(
    ensureLoginNotRestricted({
      accountId: "account-1",
      loginFailureStateRepository: {
        async findByAccountId(accountId) {
          assert.equal(accountId, "account-1");
          return {
            consecutiveFailures: 5,
            restrictionStage: 1,
            blockedUntil,
            lastFailedAt: new Date("2026-11-03T01:00:00.000Z"),
          };
        },
      },
      at: new Date("2026-11-03T01:01:00.000Z"),
    }),
    (error) => {
      assert.equal(error.name, "LoginRestrictedError");
      assert.equal(error.retryAt, blockedUntil);
      return true;
    },
  );
});
