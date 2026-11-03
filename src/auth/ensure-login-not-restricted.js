const { LoginRestrictedError } = require("./authentication-error");
const { isLoginRestrictionActive } = require("./login-failure-policy");

async function ensureLoginNotRestricted({
  accountId,
  loginFailureStateRepository,
  at,
}) {
  const state = await loginFailureStateRepository?.findByAccountId(accountId);
  if (isLoginRestrictionActive({ state, at })) {
    throw new LoginRestrictedError(state.blockedUntil);
  }
  return state;
}

module.exports = { ensureLoginNotRestricted };
