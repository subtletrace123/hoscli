const assert = require("node:assert/strict");
const test = require("node:test");

const {
  findAccountByLoginId,
} = require("../src/auth/find-account-by-login-id");

test("ログインID検索はプレースホルダーでDBへ渡す", async () => {
  let receivedQuery;
  let receivedParameters;
  const account = { id: "account-1", loginId: "clinic-1" };

  const result = await findAccountByLoginId("clinic-1' OR 1=1 --", {
    async query(query, parameters) {
      receivedQuery = query;
      receivedParameters = parameters;
      return { rows: [account] };
    },
  });

  assert.match(receivedQuery, /WHERE\s+login_id\s*=\s*\$1/i);
  assert.deepEqual(receivedParameters, ["clinic-1' OR 1=1 --"]);
  assert.deepEqual(result, account);
});

test("該当アカウントがない場合はnullを返す", async () => {
  const result = await findAccountByLoginId("unknown", {
    async query() {
      return { rows: [] };
    },
  });

  assert.equal(result, null);
});
