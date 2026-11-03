const {
  resetLoginFailureState,
} = require("./login-failure-policy");

async function resetStoredLoginFailure({
  accountId,
  state,
  loginFailureStateRepository,
}) {
  if (state === null) {
    return;
  }

  await loginFailureStateRepository.save(
    accountId,
    resetLoginFailureState(state),
  );
}

module.exports = { resetStoredLoginFailure };
