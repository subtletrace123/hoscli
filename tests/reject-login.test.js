const assert = require("node:assert/strict");
const test = require("node:test");

const { AuthenticationError } = require("../src/auth/authentication-error");
const { rejectLogin } = require("../src/auth/reject-login");

test("失敗監査を保存してから共通認証エラーで拒否する", async () => {
  const savedEvents = [];
  const createdAt = new Date("2026-11-01T01:00:00.000Z");

  await assert.rejects(
    rejectLogin({
      account: { id: "account-1", clinicId: "clinic-1" },
      createdAt,
      auditEventRepository: {
        async save(event) {
          savedEvents.push(event);
        },
      },
    }),
    AuthenticationError,
  );

  assert.deepEqual(savedEvents, [
    {
      eventType: "login_failed",
      clinicId: "clinic-1",
      accountId: "account-1",
      createdAt,
    },
  ]);
});

test("監査リポジトリがなくても共通認証エラーで拒否する", async () => {
  await assert.rejects(
    rejectLogin({
      account: { id: "account-1" },
      createdAt: new Date("2026-11-01T01:00:00.000Z"),
    }),
    (error) => error.code === "INVALID_CREDENTIALS",
  );
});
