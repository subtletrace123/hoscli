const { ACCOUNT_BY_LOGIN_ID_QUERY } = require("./account-queries");

async function findAccountByLoginId(loginId, db) {
  const result = await db.query(
    ACCOUNT_BY_LOGIN_ID_QUERY,
    [loginId],
  );
  return result.rows[0] ?? null;
}

module.exports = { findAccountByLoginId };
