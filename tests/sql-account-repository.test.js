const assert = require("node:assert/strict");
const test = require("node:test");

const {
  createSqlAccountRepository,
} = require("../src/data/create-sql-account-repository");

test("モックDBでSQLアカウントリポジトリを検証する", async () => {
  let queryCall;
  const account = { id: "account-1", loginId: "clinic-1" };
  const repository = createSqlAccountRepository({
    async query(sql, parameters) {
      queryCall = { sql, parameters };
      return { rows: [account] };
    },
  });

  const result = await repository.findByLoginId("clinic-1");

  assert.deepEqual(result, account);
  assert.match(queryCall.sql, /\$1/);
  assert.deepEqual(queryCall.parameters, ["clinic-1"]);
});

test("SQLリポジトリは該当なしをnullで返す", async () => {
  const repository = createSqlAccountRepository({
    async query() { return { rows: [] }; },
  });

  assert.equal(await repository.findByLoginId("unknown"), null);
});
