const {
  advanceLoginFailureState,
  createLoginFailureState,
} = require("./login-failure-policy");
const {
  recordLoginRestriction,
} = require("./record-login-restriction");

async function registerLoginFailure(
  { accountId, clinicId, failedAt, observationPeriodMs },
  { auditEventRepository, loginFailureStateRepository },
) {
  const storedState =
    await loginFailureStateRepository.findByAccountId(accountId);
  const currentState = storedState ?? createLoginFailureState();
  const nextState = advanceLoginFailureState({
    state: currentState,
    failedAt,
    observationPeriodMs,
  });

  await loginFailureStateRepository.save(accountId, nextState);

  if (nextState.restrictionStage > currentState.restrictionStage) {
    await recordLoginRestriction({
      clinicId,
      accountId,
      state: nextState,
      createdAt: failedAt,
      auditEventRepository,
    });
  }

  return nextState;
}

module.exports = { registerLoginFailure };
