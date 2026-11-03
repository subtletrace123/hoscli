async function logoutSession(session, sessionRepository, revokedAt) {
  const effectiveRevokedAt = session.revokedAt ?? revokedAt;
  const revokedSession = { ...session, revokedAt: effectiveRevokedAt };
  await sessionRepository.revoke(session.id, effectiveRevokedAt);
  return revokedSession;
}

module.exports = { logoutSession };
