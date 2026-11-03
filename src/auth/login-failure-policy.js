const RESTRICTIONS = [
  { failureCount: 5, stage: 1, durationMs: 5 * 60 * 1000 },
  { failureCount: 10, stage: 2, durationMs: 10 * 60 * 1000 },
  { failureCount: 15, stage: 3, durationMs: 30 * 60 * 1000 },
];

function createLoginFailureState() {
  return {
    consecutiveFailures: 0,
    restrictionStage: 0,
    blockedUntil: null,
    lastFailedAt: null,
  };
}

function isLoginRestrictionActive({ state, at }) {
  return (
    state?.blockedUntil !== null &&
    state?.blockedUntil !== undefined &&
    at.getTime() < state.blockedUntil.getTime()
  );
}

function advanceLoginFailureState({ state, failedAt, observationPeriodMs }) {
  if (isLoginRestrictionActive({ state, at: failedAt })) {
    return state;
  }

  const observationPeriodExpired =
    observationPeriodMs !== undefined &&
    state.lastFailedAt !== null &&
    failedAt.getTime() - state.lastFailedAt.getTime() >= observationPeriodMs;
  const currentState = observationPeriodExpired
    ? createLoginFailureState()
    : state;
  const consecutiveFailures = currentState.consecutiveFailures + 1;
  const nextRestriction = RESTRICTIONS.find(
    ({ failureCount, stage }) =>
      consecutiveFailures === failureCount &&
      currentState.restrictionStage === stage - 1,
  );

  return {
    ...currentState,
    consecutiveFailures,
    restrictionStage:
      nextRestriction?.stage ?? currentState.restrictionStage,
    blockedUntil: nextRestriction
      ? new Date(failedAt.getTime() + nextRestriction.durationMs)
      : currentState.blockedUntil,
    lastFailedAt: failedAt,
  };
}

function resetLoginFailureState() {
  return createLoginFailureState();
}

module.exports = {
  advanceLoginFailureState,
  createLoginFailureState,
  isLoginRestrictionActive,
  resetLoginFailureState,
};
