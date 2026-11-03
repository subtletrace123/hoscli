const { AuthenticationError } = require("./authentication-error");
const {
  createAdminLoginAuditEvent,
} = require("./create-admin-login-audit-event");

async function rejectAdminLogin({
  account,
  createdAt,
  auditEventRepository,
  failureReason,
}) {
  await auditEventRepository.save(
    createAdminLoginAuditEvent({
      eventType: "admin_login_failed",
      accountId: account.id,
      createdAt,
      failureReason,
    }),
  );
  throw new AuthenticationError();
}

module.exports = { rejectAdminLogin };
