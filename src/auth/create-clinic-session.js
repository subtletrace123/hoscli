const SESSION_DURATION_MS = 4 * 60 * 60 * 1000;

function createClinicSession({ id, account, authenticatedAt }) {
  return {
    id,
    accountId: account.id,
    clinicId: account.clinicId,
    authenticatedAt,
    expiresAt: new Date(authenticatedAt.getTime() + SESSION_DURATION_MS),
    ...(account.mustChangePassword
      ? { access: "password_change_only" }
      : {}),
  };
}

module.exports = { createClinicSession };
