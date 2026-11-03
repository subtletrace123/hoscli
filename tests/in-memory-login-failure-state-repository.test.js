const assert = require("node:assert/strict");
const test = require("node:test");

const {
  createInMemoryLoginFailureStateRepository,
} = require("../src/in-memory-login-failure-state-repository");

test("インメモリ失敗状態リポジトリで保存と取得ができる", async () => {
  const repository = createInMemoryLoginFailureStateRepository();
  const state = { consecutiveFailures: 1 };

  await repository.save("account-1", state);
  assert.deepEqual(await repository.findByAccountId("account-1"), state);
  assert.equal(await repository.findByAccountId("unknown"), null);
});
