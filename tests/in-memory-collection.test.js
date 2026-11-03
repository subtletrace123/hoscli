const assert = require("node:assert/strict");
const test = require("node:test");

const { createInMemoryCollection } = require("../src/in-memory-collection");

test("インメモリコレクションで値を保存・取得・一覧化する", () => {
  const collection = createInMemoryCollection();
  const value = { id: "value-1" };

  collection.set("value-1", value);
  assert.equal(collection.get("value-1"), value);
  assert.deepEqual(collection.list(), [value]);
});
