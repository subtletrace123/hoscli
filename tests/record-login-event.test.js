const assert = require("node:assert/strict");
const test = require("node:test");

const { recordLoginEvent } = require("../src/auth/record-login-event");

test("秘密情報を含めずにログイン監査イベントを記録する", async () => {
  const savedEvents = [];
  const account = {
    id: "account-1",
    clinicId: "clinic-1",
    passwordHash: "stored-password-hash",
  };
  const createdAt = new Date("2026-11-01T01:00:00.000Z");

  await recordLoginEvent({
    account,
    createdAt,
    eventType: "login_succeeded",
    auditEventRepository: {
      async save(event) {
        savedEvents.push(event);
      },
    },
  });

  assert.deepEqual(savedEvents, [
    {
      eventType: "login_succeeded",
      clinicId: "clinic-1",
      accountId: "account-1",
      createdAt,
    },
  ]);
  assert.equal("passwordHash" in savedEvents[0], false);
});
