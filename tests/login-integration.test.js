const assert = require("node:assert/strict");
const test = require("node:test");

const { authenticateClinic } = require("../src/auth/authenticate-clinic");
const {
  createInMemoryLoginFixture,
} = require("../src/in-memory-login-fixture");

test("インメモリ依存関係で医院ログインを統合検証する", async () => {
  const fixture = createInMemoryLoginFixture({
    account: {
      id: "clinic-1",
      loginId: "clinic-login",
      clinicId: "clinic-1",
      passwordHash: "hash",
      status: "active",
    },
    password: "correct-password",
    now: new Date("2026-11-03T01:00:00.000Z"),
  });

  const session = await authenticateClinic(
    { loginId: "clinic-login", password: "correct-password" },
    fixture.dependencies,
  );

  assert.equal(session.accountId, "clinic-1");
  assert.deepEqual(await fixture.sessionRepository.findById(session.id), session);
  assert.equal((await fixture.auditEventRepository.list())[0].eventType, "login_succeeded");
});

test("統合フィクスチャは登録済みパスワード以外を成功扱いしない", () => {
  const fixture = createInMemoryLoginFixture({
    account: { id: "clinic-1", loginId: "clinic-login", passwordHash: "hash" },
    password: "correct-password",
    now: new Date("2026-11-03T01:00:00.000Z"),
  });

  return fixture.dependencies.passwordVerifier
    .verify("wrong-password", "hash")
    .then((result) => assert.equal(result, false));
});
