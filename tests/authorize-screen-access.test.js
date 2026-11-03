const assert = require("node:assert/strict");
const test = require("node:test");

const {
  authorizeScreenAccess,
} = require("../src/auth/authorize-screen-access");
const { SCREEN_ROLES } = require("../src/auth/screen-access-policy");

test("画面ごとの許可ロールを定義する", () => {
  assert.deepEqual(SCREEN_ROLES, {
    clinic: "clinic",
    hospital: "hospital_staff",
    admin: "admin",
  });
});

test("CLセッションは自院画面へアクセスできる", () => {
  assert.equal(
    authorizeScreenAccess({ accountId: "clinic-1", role: "clinic" }, "clinic"),
    true,
  );
});

test("CLセッションは病院事務画面へアクセスできない", () => {
  assert.throws(
    () =>
      authorizeScreenAccess(
        { accountId: "clinic-1", role: "clinic" },
        "hospital",
      ),
    (error) => error.code === "FORBIDDEN",
  );
});

test("CLセッションはadmin画面へアクセスできない", () => {
  assert.throws(
    () =>
      authorizeScreenAccess(
        { accountId: "clinic-1", role: "clinic" },
        "admin",
      ),
    (error) => error.code === "FORBIDDEN",
  );
});
