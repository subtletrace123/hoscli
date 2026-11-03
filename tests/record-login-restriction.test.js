const assert = require("node:assert/strict");
const test = require("node:test");

const {
  recordLoginRestriction,
} = require("../src/auth/record-login-restriction");

test("秘密情報を含めずにログイン制限を記録する", async () => {
  const savedEvents = [];
  const createdAt = new Date("2026-11-01T01:00:04.000Z");
  const blockedUntil = new Date("2026-11-01T01:05:04.000Z");

  await recordLoginRestriction({
    accountId: "account-1",
    clinicId: "clinic-1",
    state: {
      consecutiveFailures: 5,
      restrictionStage: 1,
      blockedUntil,
    },
    createdAt,
    auditEventRepository: {
      async save(event) {
        savedEvents.push(event);
      },
    },
  });

  assert.deepEqual(savedEvents, [
    {
      eventType: "login_restricted",
      clinicId: "clinic-1",
      accountId: "account-1",
      restrictionStage: 1,
      consecutiveFailures: 5,
      blockedUntil,
      createdAt,
    },
  ]);
  assert.equal("password" in savedEvents[0], false);
  assert.equal("passwordHash" in savedEvents[0], false);
});
