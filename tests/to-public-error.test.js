const assert = require("node:assert/strict");
const test = require("node:test");

const { toPublicError } = require("../src/web/to-public-error");

test("エラーから公開項目だけを抽出する", () => {
  assert.deepEqual(
    toPublicError({ code: "FORBIDDEN", message: "Forbidden", password: "secret" }),
    { code: "FORBIDDEN", message: "Forbidden" },
  );
});
