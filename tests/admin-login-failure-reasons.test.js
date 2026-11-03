const assert = require("node:assert/strict");
const test = require("node:test");

const {
  ADMIN_LOGIN_FAILURE_REASONS,
} = require("../src/auth/admin-login-failure-reasons");

test("adminログイン失敗理由を定数で管理する", () => {
  assert.equal(
    ADMIN_LOGIN_FAILURE_REASONS.SECOND_FACTOR_MISMATCH,
    "second_factor_mismatch",
  );
});
