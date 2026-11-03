const assert = require("node:assert/strict");
const test = require("node:test");

const { createClinicSession } = require("../src/auth/create-clinic-session");

test("認証済みアカウントから4時間有効な医院セッションを生成する", () => {
  const authenticatedAt = new Date("2026-11-01T01:00:00.000Z");

  const session = createClinicSession({
    id: "session-1",
    account: { id: "account-1", clinicId: "clinic-1" },
    authenticatedAt,
  });

  assert.deepEqual(session, {
    id: "session-1",
    accountId: "account-1",
    clinicId: "clinic-1",
    authenticatedAt,
    expiresAt: new Date("2026-11-01T05:00:00.000Z"),
  });
});

test("初期パスワードのアカウントにはパスワード変更専用アクセスを設定する", () => {
  const session = createClinicSession({
    id: "session-1",
    account: {
      id: "account-1",
      clinicId: "clinic-1",
      mustChangePassword: true,
    },
    authenticatedAt: new Date("2026-11-01T01:00:00.000Z"),
  });

  assert.equal(session.access, "password_change_only");
  assert.equal("mustChangePassword" in session, false);
});
