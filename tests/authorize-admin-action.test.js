const assert = require("node:assert/strict");
const test = require("node:test");

const {
  authorizeAdminAction,
} = require("../src/auth/authorize-admin-action");
const { ADMIN_ACTIONS } = require("../src/auth/admin-action-policy");

test("admin操作ポリシーに医院停止操作を定義する", () => {
  assert.equal(ADMIN_ACTIONS.has("suspend_clinic"), true);
});

test("病院事務セッションはadmin機能を操作できない", () => {
  assert.throws(
    () =>
      authorizeAdminAction(
        { accountId: "hospital-staff-1", role: "hospital_staff" },
        "suspend_clinic",
      ),
    (error) => error.code === "FORBIDDEN",
  );
});

test("未認証セッションはadmin機能を操作できない", () => {
  assert.throws(
    () => authorizeAdminAction(null, "suspend_clinic"),
    (error) => error.code === "FORBIDDEN",
  );
});

test("adminセッションはadmin機能を操作できる", () => {
  assert.equal(
    authorizeAdminAction(
      { accountId: "admin-1", role: "admin" },
      "suspend_clinic",
    ),
    true,
  );
});
