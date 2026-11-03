const { createClinicSession } = require("./create-clinic-session");
const { LoginRestrictedError } = require("./authentication-error");
const {
  isLoginRestrictionActive,
} = require("./login-failure-policy");
const { recordLoginEvent } = require("./record-login-event");
const {
  rejectInvalidPassword,
} = require("./reject-invalid-password");
const { rejectLogin } = require("./reject-login");
const {
  resetStoredLoginFailure,
} = require("./reset-stored-login-failure");
const { createSecureSessionId } = require("./create-secure-session-id");

async function authenticateClinic(credentials, dependencies) {
  const {
    accountRepository,
    auditEventRepository,
    loginFailureStateRepository,
    loginFailureObservationPeriodMs,
    passwordVerifier,
    sessionRepository,
    clock,
    sessionIdGenerator = createSecureSessionId,
  } = dependencies;

  const account = await accountRepository.findByLoginId(credentials.loginId);
  if (!account) {
    return rejectLogin({
      account: null,
      createdAt: clock.now(),
      auditEventRepository,
    });
  }

  if (account.status !== "active") {
    return rejectLogin({
      account,
      createdAt: clock.now(),
      auditEventRepository,
    });
  }

  const failureState =
    await loginFailureStateRepository.findByAccountId(account.id);
  const attemptedAt = clock.now();

  if (isLoginRestrictionActive({ state: failureState, at: attemptedAt })) {
    throw new LoginRestrictedError(failureState.blockedUntil);
  }

  const passwordIsValid = await passwordVerifier.verify(
    credentials.password,
    account.passwordHash,
  );

  if (!passwordIsValid) {
    const failedAt = clock.now();
    return rejectInvalidPassword(
      {
        account,
        failedAt,
        observationPeriodMs: loginFailureObservationPeriodMs,
      },
      { auditEventRepository, loginFailureStateRepository },
    );
  }

  const authenticatedAt = clock.now();
  const session = createClinicSession({
    id: sessionIdGenerator(),
    account,
    authenticatedAt,
  });

  await sessionRepository.save(session);
  await resetStoredLoginFailure({
    accountId: account.id,
    state: failureState,
    loginFailureStateRepository,
  });
  await recordLoginEvent({
    account,
    createdAt: authenticatedAt,
    eventType: "login_succeeded",
    auditEventRepository,
  });

  return session;
}

module.exports = { authenticateClinic };
