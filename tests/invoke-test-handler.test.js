const assert = require("node:assert/strict");
const test = require("node:test");

const { invokeTestHandler } = require("../src/web/invoke-test-handler");

test("テストハンドラをリクエスト付きで呼び出す", async () => {
  const request = { path: "/health" };
  const response = await invokeTestHandler(async (received) => {
    assert.equal(received, request);
    return { status: 200 };
  }, request);

  assert.deepEqual(response, { status: 200 });
});
