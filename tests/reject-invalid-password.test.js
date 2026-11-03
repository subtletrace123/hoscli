const assert = require("node:assert/strict");
const test = require("node:test");

const { AuthenticationError } = require("../src/auth/authentication-error");
const {
  rejectInvalidPassword,
} = require("../src/auth/reject-invalid-password");

test("失敗状態と監査ログを保存してパスワード不一致を拒否する", async () => {
  const account = { id: "account-1", clinicId: "clinic-1" };
  const failedAt = new Date("2026-11-01T01:00:00.000Z");
  const savedEvents = [];
  const savedStates = [];

  await assert.rejects(
    rejectInvalidPassword(
      {
        account,
        failedAt,
        observationPeriodMs: 24 * 60 * 60 * 1000,
      },
      {
        auditEventRepository: {
          async save(event) {
            savedEvents.push(event);
          },
        },
        loginFailureStateRepository: {
          async findByAccountId() {
            return null;
          },
          async save(accountId, state) {
            savedStates.push({ accountId, state });
          },
        },
      },
    ),
    AuthenticationError,
  );

  assert.equal(savedStates.length, 1);
  assert.deepEqual(savedEvents, [
    {
      eventType: "login_failed",
      clinicId: "clinic-1",
      accountId: "account-1",
      createdAt: failedAt,
    },
  ]);
});
