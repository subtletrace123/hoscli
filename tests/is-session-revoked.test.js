const assert = require("node:assert/strict");
const test = require("node:test");

const { isSessionRevoked } = require("../src/auth/is-session-revoked");

test("失効日時を持つセッションを失効済みと判定する", () => {
  assert.equal(
    isSessionRevoked({ revokedAt: new Date("2026-11-03T01:00:00.000Z") }),
    true,
  );
  assert.equal(isSessionRevoked({ revokedAt: null }), false);
  assert.equal(isSessionRevoked({}), false);
});
