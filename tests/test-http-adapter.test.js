const assert = require("node:assert/strict");
const test = require("node:test");

const {
  createTestHttpAdapter,
} = require("../src/web/create-test-http-adapter");

test("テスト用HTTPアダプタでハンドラへリクエストを渡す", async () => {
  const adapter = createTestHttpAdapter(async (request) => ({
    status: 200,
    body: { path: request.path },
  }));

  const response = await adapter.request({ method: "GET", path: "/health" });

  assert.deepEqual(response, {
    status: 200,
    body: { path: "/health" },
  });
});

test("非同期ハンドラのレスポンスを返す", async () => {
  const adapter = createTestHttpAdapter(async () => ({ status: 204 }));
  assert.deepEqual(await adapter.request({}), { status: 204 });
});
