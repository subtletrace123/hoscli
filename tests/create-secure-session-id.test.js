const assert = require("node:assert/strict");
const test = require("node:test");

const {
  createSecureSessionId,
} = require("../src/auth/create-secure-session-id");

test("セッションIDは暗号学的乱数で64桁の16進文字列を生成する", () => {
  const first = createSecureSessionId();
  const second = createSecureSessionId();

  assert.match(first, /^[0-9a-f]{64}$/);
  assert.match(second, /^[0-9a-f]{64}$/);
  assert.equal(Buffer.from(first, "hex").length, 32);
  assert.notEqual(first, second);
});
