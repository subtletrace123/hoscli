const assert = require("node:assert/strict");
const test = require("node:test");

const { HTTP_STATUS } = require("../src/auth/http-status");

test("認証エラーで使うHTTPステータスを定義する", () => {
  assert.deepEqual(HTTP_STATUS, {
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
  });
});
