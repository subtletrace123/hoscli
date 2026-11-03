const SESSION_DURATION_MS = 4 * 60 * 60 * 1000;

function createAdminSession({ id, account, authenticatedAt }) {
  return {
    id,
    accountId: account.id,
    role: account.role,
    authenticatedAt,
    expiresAt: new Date(authenticatedAt.getTime() + SESSION_DURATION_MS),
  };
}

module.exports = { createAdminSession };
