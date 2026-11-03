const assert = require("node:assert/strict");
const test = require("node:test");

const {
  ACCOUNT_BY_LOGIN_ID_QUERY,
} = require("../src/auth/account-queries");

test("アカウント検索クエリはプレースホルダーを使う", () => {
  assert.match(ACCOUNT_BY_LOGIN_ID_QUERY, /WHERE\s+login_id\s*=\s*\$1/i);
});
