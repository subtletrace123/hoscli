const { AuthenticationError } = require("./authentication-error");
const { recordLoginEvent } = require("./record-login-event");

async function rejectLogin({ account, createdAt, auditEventRepository }) {
  if (auditEventRepository) {
    await recordLoginEvent({
      account,
      createdAt,
      eventType: "login_failed",
      auditEventRepository,
    });
  }

  throw new AuthenticationError();
}

module.exports = { rejectLogin };
