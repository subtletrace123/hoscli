const assert = require("node:assert/strict");
const test = require("node:test");

const { queryOne } = require("../src/data/query-one");

test("クエリ結果の先頭行を取得し、空結果はnullにする", async () => {
  assert.deepEqual(
    await queryOne({ async query() { return { rows: [{ id: "row-1" }] }; } }, "SELECT 1", []),
    { id: "row-1" },
  );
  assert.equal(
    await queryOne({ async query() { return { rows: [] }; } }, "SELECT 1", []),
    null,
  );
});
