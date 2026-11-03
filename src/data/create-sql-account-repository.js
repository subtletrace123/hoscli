const { ACCOUNT_BY_LOGIN_ID_QUERY } = require("../auth/account-queries");
const { queryOne } = require("./query-one");

function createSqlAccountRepository(db) {
  return {
    async findByLoginId(loginId) {
      return queryOne(db, ACCOUNT_BY_LOGIN_ID_QUERY, [loginId]);
    },
  };
}

module.exports = { createSqlAccountRepository };
