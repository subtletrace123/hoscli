const assert = require("node:assert/strict");
const test = require("node:test");

const {
  sanitizeAuditEvent,
  AUDIT_SECRET_FIELDS,
} = require("../src/auth/sanitize-audit-event");

test("監査ログの秘密フィールド一覧を定数で管理する", () => {
  assert.deepEqual(AUDIT_SECRET_FIELDS, [
    "password",
    "passwordHash",
    "secondFactor",
    "token",
    "accessToken",
  ]);
});

test("監査ログから秘密情報を除外する", () => {
  const sanitized = sanitizeAuditEvent({
    eventType: "login_failed",
    accountId: "account-1",
    password: "secret",
    passwordHash: "hash",
    secondFactor: "123456",
    token: "token",
    accessToken: "access-token",
  });

  assert.deepEqual(sanitized, {
    eventType: "login_failed",
    accountId: "account-1",
  });
});
