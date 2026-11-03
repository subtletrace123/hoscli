const { createInMemoryCollection } = require("./in-memory-collection");

function createInMemoryAccountRepository() {
  const accounts = createInMemoryCollection();
  return {
    async save(account) { accounts.set(account.loginId, account); },
    async findByLoginId(loginId) { return accounts.get(loginId) ?? null; },
  };
}

function createInMemorySessionRepository() {
  const sessions = createInMemoryCollection();
  return {
    async save(session) { sessions.set(session.id, session); },
    async findById(id) { return sessions.get(id) ?? null; },
    async revoke(id, revokedAt) {
      const session = sessions.get(id);
      if (session) sessions.set(id, { ...session, revokedAt });
    },
  };
}

function createInMemoryAuditEventRepository() {
  const events = createInMemoryCollection();
  return {
    async save(event) { events.set(events.list().length, event); },
    async list() { return events.list(); },
  };
}

module.exports = {
  createInMemoryAccountRepository,
  createInMemorySessionRepository,
  createInMemoryAuditEventRepository,
};
