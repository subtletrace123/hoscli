function createInMemoryLoginFailureStateRepository() {
  const states = new Map();
  return {
    async findByAccountId(accountId) { return states.get(accountId) ?? null; },
    async save(accountId, state) { states.set(accountId, state); },
  };
}

module.exports = { createInMemoryLoginFailureStateRepository };
