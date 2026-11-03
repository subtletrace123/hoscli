const assert = require("node:assert/strict");
const test = require("node:test");

const {
  rotateSessionId,
  MAX_SESSION_ID_ROTATION_ATTEMPTS,
} = require("../src/auth/rotate-session-id");

test("セッションIDローテーションの試行回数上限を定義する", () => {
  assert.equal(MAX_SESSION_ID_ROTATION_ATTEMPTS, 100);
});

test("認証前のセッションIDを引き継がず新しいIDへローテーションする", () => {
  let generated = 0;
  const nextId = rotateSessionId("attacker-known-session", () => {
    generated += 1;
    return "fresh-session-id";
  });

  assert.equal(generated, 1);
  assert.equal(nextId, "fresh-session-id");
  assert.notEqual(nextId, "attacker-known-session");
});

test("生成器が既存IDを返した場合は再生成する", () => {
  const values = ["attacker-known-session", "fresh-session-id"];
  assert.equal(
    rotateSessionId("attacker-known-session", () => values.shift()),
    "fresh-session-id",
  );
});
