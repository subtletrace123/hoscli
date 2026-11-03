const assert = require("node:assert/strict");
const test = require("node:test");

const { authorizeRole } = require("../src/auth/authorize-role");
const { AuthorizationError } = require("../src/auth/authorization-error");

test("病院事務セッションはadmin機能を利用できない", () => {
  assert.equal(
    authorizeRole(
      { accountId: "hospital-staff-1", role: "hospital_staff" },
      "hospital_staff",
    ),
    true,
  );
  assert.throws(
    () =>
      authorizeRole(
        { accountId: "hospital-staff-1", role: "hospital_staff" },
        "admin",
      ),
    (error) => {
      assert.equal(error.name, "AuthorizationError");
      assert.equal(error.code, "FORBIDDEN");
      assert.equal(error instanceof AuthorizationError, true);
      return true;
    },
  );
});

test("adminセッションは病院事務機能として扱わない", () => {
  assert.equal(
    authorizeRole({ accountId: "admin-1", role: "admin" }, "admin"),
    true,
  );
  assert.throws(
    () =>
      authorizeRole(
        { accountId: "admin-1", role: "admin" },
        "hospital_staff",
      ),
    (error) => {
      assert.equal(error.name, "AuthorizationError");
      assert.equal(error.code, "FORBIDDEN");
      assert.equal(error instanceof AuthorizationError, true);
      return true;
    },
  );
});
