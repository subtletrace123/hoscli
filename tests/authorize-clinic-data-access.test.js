const assert = require("node:assert/strict");
const test = require("node:test");

const {
  authorizeClinicDataAccess,
} = require("../src/auth/authorize-clinic-data-access");

test("医院セッションは自院データへアクセスできる", () => {
  const session = { accountId: "clinic-user-1", role: "clinic", clinicId: "clinic-1" };

  assert.equal(authorizeClinicDataAccess(session, { clinicId: "clinic-1" }), session);
});

test("医院セッションは他医院データへのアクセスを拒否する", () => {
  const session = { accountId: "clinic-user-1", role: "clinic", clinicId: "clinic-1" };

  assert.throws(
    () => authorizeClinicDataAccess(session, { clinicId: "clinic-2" }),
    (error) => error.code === "FORBIDDEN" && error.status === 403,
  );
  assert.throws(
    () => authorizeClinicDataAccess(session, {}),
    (error) => error.code === "FORBIDDEN" && error.status === 403,
  );
});
