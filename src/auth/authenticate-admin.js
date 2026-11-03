const { createAdminSession } = require("./create-admin-session");
const { AuthenticationError } = require("./authentication-error");
const {
  createAdminLoginAuditEvent,
} = require("./create-admin-login-audit-event");
const { isActiveAccount } = require("./is-active-account");
const { requireAccountRole } = require("./require-account-role");
const { rejectAdminLogin } = require("./reject-admin-login");
const { ensureLoginNotRestricted } = require("./ensure-login-not-restricted");
const {
  ADMIN_LOGIN_FAILURE_REASONS,
} = require("./admin-login-failure-reasons");
const { createSecureSessionId } = require("./create-secure-session-id");

async function authenticateAdmin(credentials, dependencies) {
  const {
    accountRepository,
    passwordVerifier,
    secondFactorVerifier,
    sessionRepository,
    auditEventRepository,
    loginFailureStateRepository,
    clock,
    sessionIdGenerator = createSecureSessionId,
  } = dependencies;

  const account = await accountRepository.findByLoginId(credentials.loginId);
  if (!account) {
    throw new AuthenticationError();
  }

  if (!isActiveAccount(account)) {
    return rejectAdminLogin({
      account,
      createdAt: clock.now(),
      auditEventRepository,
    });
  }

  await ensureLoginNotRestricted({
    accountId: account.id,
    loginFailureStateRepository,
    at: clock.now(),
  });

  try {
    requireAccountRole(account, "admin");
  } catch {
    return rejectAdminLogin({
      account,
      createdAt: clock.now(),
      auditEventRepository,
    });
  }

  const passwordIsValid = await passwordVerifier.verify(
    credentials.password,
    account.passwordHash,
  );

  if (!passwordIsValid) {
    return rejectAdminLogin({
      account,
      createdAt: clock.now(),
      auditEventRepository,
    });
  }

  if (!secondFactorVerifier) {
    throw new AuthenticationError();
  }

  const secondFactorIsValid = await secondFactorVerifier.verify(
    credentials.secondFactor,
    account,
  );
  if (!secondFactorIsValid) {
    return rejectAdminLogin({
      account,
      createdAt: clock.now(),
      auditEventRepository,
      failureReason: ADMIN_LOGIN_FAILURE_REASONS.SECOND_FACTOR_MISMATCH,
    });
  }

  const session = createAdminSession({
    id: sessionIdGenerator(),
    account,
    authenticatedAt: clock.now(),
  });

  await sessionRepository.save(session);
  await auditEventRepository.save(
    createAdminLoginAuditEvent({
      accountId: account.id,
      createdAt: session.authenticatedAt,
    }),
  );
  return session;
}

module.exports = { authenticateAdmin };
