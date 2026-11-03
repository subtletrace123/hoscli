const assert = require("node:assert/strict");
const test = require("node:test");

const { isSessionActive } = require("../src/auth/is-session-active");

test("セッションの有効期限を共通判定する", () => {
  const expiresAt = new Date("2026-11-03T01:00:00.000Z");
  const session = { expiresAt };

  assert.equal(
    isSessionActive(session, new Date("2026-11-03T00:59:59.999Z")),
    true,
  );
  assert.equal(isSessionActive(session, expiresAt), false);
  assert.equal(
    isSessionActive(session, new Date("2026-11-03T01:00:00.001Z")),
    false,
  );
});
