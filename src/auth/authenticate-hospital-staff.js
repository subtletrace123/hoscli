const { createHospitalStaffSession } = require("./create-hospital-staff-session");
const { requireAccount } = require("./require-account");
const { AuthenticationError } = require("./authentication-error");
const { isActiveAccount } = require("./is-active-account");
const { requireAccountRole } = require("./require-account-role");
const { ensureLoginNotRestricted } = require("./ensure-login-not-restricted");
const { rejectLogin } = require("./reject-login");
const { createSecureSessionId } = require("./create-secure-session-id");

async function authenticateHospitalStaff(credentials, dependencies) {
  const {
    accountRepository,
    passwordVerifier,
    sessionRepository,
    auditEventRepository,
    loginFailureStateRepository,
    clock,
    sessionIdGenerator = createSecureSessionId,
  } = dependencies;

  const account = requireAccount(
    await accountRepository.findByLoginId(credentials.loginId),
  );
  if (!isActiveAccount(account)) {
    throw new AuthenticationError();
  }
  await ensureLoginNotRestricted({
    accountId: account.id,
    loginFailureStateRepository,
    at: clock.now(),
  });
  requireAccountRole(account, "hospital_staff");

  const passwordIsValid = await passwordVerifier.verify(
    credentials.password,
    account.passwordHash,
  );

  if (!passwordIsValid) {
    return rejectLogin({
      account,
      createdAt: clock.now(),
      auditEventRepository,
    });
  }

  const session = createHospitalStaffSession({
    id: sessionIdGenerator(),
    account,
    authenticatedAt: clock.now(),
  });

  await sessionRepository.save(session);
  return session;
}

module.exports = { authenticateHospitalStaff };
