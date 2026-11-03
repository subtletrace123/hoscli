function createAdminLoginAuditEvent({
  accountId,
  createdAt,
  eventType = "admin_login_succeeded",
  failureReason,
}) {
  return {
    eventType,
    accountId,
    role: "admin",
    createdAt,
    ...(failureReason ? { failureReason } : {}),
  };
}

module.exports = { createAdminLoginAuditEvent };
