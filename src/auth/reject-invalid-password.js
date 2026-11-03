const { registerLoginFailure } = require("./register-login-failure");
const { rejectLogin } = require("./reject-login");

async function rejectInvalidPassword(
  { account, failedAt, observationPeriodMs },
  { auditEventRepository, loginFailureStateRepository },
) {
  await registerLoginFailure(
    {
      accountId: account.id,
      clinicId: account.clinicId,
      failedAt,
      observationPeriodMs,
    },
    { auditEventRepository, loginFailureStateRepository },
  );

  return rejectLogin({
    account,
    createdAt: failedAt,
    auditEventRepository,
  });
}

module.exports = { rejectInvalidPassword };
