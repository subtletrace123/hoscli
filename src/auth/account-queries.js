const ACCOUNT_BY_LOGIN_ID_QUERY =
  "SELECT * FROM accounts WHERE login_id = $1";

module.exports = { ACCOUNT_BY_LOGIN_ID_QUERY };
