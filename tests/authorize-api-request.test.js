const assert = require("node:assert/strict");
const test = require("node:test");

const {
  authorizeApiRequest,
} = require("../src/auth/authorize-api-request");

test("病院事務セッションは病院APIへのアクセスを許可する", () => {
  const session = { accountId: "staff-1", role: "hospital_staff" };

  assert.equal(authorizeApiRequest(session, "hospital"), session);
});

test("CLセッションは病院・admin APIへのアクセスを拒否する", () => {
  const session = { accountId: "clinic-1", role: "clinic" };

  assert.throws(
    () => authorizeApiRequest(session, "hospital"),
    (error) => error.code === "FORBIDDEN",
  );
  assert.throws(
    () => authorizeApiRequest(session, "admin"),
    (error) => error.code === "FORBIDDEN",
  );
});

test("adminセッションはadmin APIへのアクセスを許可する", () => {
  const session = { accountId: "admin-1", role: "admin" };

  assert.equal(authorizeApiRequest(session, "admin"), session);
});

test("医院セッションは医院APIへのアクセスを許可する", () => {
  const session = { accountId: "clinic-1", role: "clinic", clinicId: "clinic-1" };

  assert.equal(authorizeApiRequest(session, "clinic"), session);
});

test("未認証セッションは病院APIへのアクセスを拒否する", () => {
  assert.throws(
    () => authorizeApiRequest(null, "hospital"),
    (error) =>
      error.code === "UNAUTHENTICATED" &&
      error.status === 401 &&
      error.message === "Authentication required",
  );
});

test("認証済みでも権限不足は403を返す", () => {
  assert.throws(
    () => authorizeApiRequest({ accountId: "clinic-1", role: "clinic" }, "admin"),
    (error) =>
      error.code === "FORBIDDEN" &&
      error.status === 403 &&
      error.message === "Forbidden",
  );
});
