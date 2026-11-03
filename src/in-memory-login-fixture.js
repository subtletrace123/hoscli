const {
  createInMemoryAccountRepository,
  createInMemorySessionRepository,
  createInMemoryAuditEventRepository,
} = require("./in-memory-repositories");
const {
  createInMemoryLoginFailureStateRepository,
} = require("./in-memory-login-failure-state-repository");

function createInMemoryLoginFixture({ account, password, now }) {
  const accountRepository = createInMemoryAccountRepository();
  const sessionRepository = createInMemorySessionRepository();
  const auditEventRepository = createInMemoryAuditEventRepository();
  const loginFailureStateRepository =
    createInMemoryLoginFailureStateRepository();

  accountRepository.save(account);

  return {
    accountRepository,
    sessionRepository,
    auditEventRepository,
    dependencies: {
      accountRepository,
      passwordVerifier: {
        async verify(value, hash) {
          return value === password && hash === account.passwordHash;
        },
      },
      sessionRepository,
      auditEventRepository,
      loginFailureStateRepository,
      clock: { now: () => now },
      sessionIdGenerator: () => "integration-session-1",
    },
  };
}

module.exports = { createInMemoryLoginFixture };
