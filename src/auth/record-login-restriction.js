async function recordLoginRestriction({
  accountId,
  clinicId,
  state,
  createdAt,
  auditEventRepository,
}) {
  await auditEventRepository.save({
    eventType: "login_restricted",
    clinicId,
    accountId,
    restrictionStage: state.restrictionStage,
    consecutiveFailures: state.consecutiveFailures,
    blockedUntil: state.blockedUntil,
    createdAt,
  });
}

module.exports = { recordLoginRestriction };
