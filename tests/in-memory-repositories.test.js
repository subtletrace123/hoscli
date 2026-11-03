const assert = require("node:assert/strict");
const test = require("node:test");

const {
  createInMemoryAccountRepository,
  createInMemorySessionRepository,
  createInMemoryAuditEventRepository,
} = require("../src/in-memory-repositories");

test("インメモリアカウントリポジトリで検索と保存ができる", async () => {
  const repository = createInMemoryAccountRepository();
  const account = { id: "account-1", loginId: "clinic-1" };

  await repository.save(account);
  assert.deepEqual(await repository.findByLoginId("clinic-1"), account);
  assert.equal(await repository.findByLoginId("unknown"), null);
});

test("インメモリセッションリポジトリで保存・取得・失効ができる", async () => {
  const repository = createInMemorySessionRepository();
  const session = { id: "session-1", accountId: "account-1" };
  const revokedAt = new Date("2026-11-03T01:00:00.000Z");

  await repository.save(session);
  assert.deepEqual(await repository.findById("session-1"), session);
  await repository.revoke("session-1", revokedAt);
  assert.equal((await repository.findById("session-1")).revokedAt, revokedAt);
});

test("インメモリ監査ログリポジトリでイベントを保存して一覧取得できる", async () => {
  const repository = createInMemoryAuditEventRepository();
  const event = { eventType: "login_failed", accountId: "account-1" };

  await repository.save(event);
  assert.deepEqual(await repository.list(), [event]);
});
