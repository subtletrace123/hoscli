function createInMemoryCollection() {
  const values = new Map();
  return {
    set(key, value) { values.set(key, value); },
    get(key) { return values.get(key); },
    list() { return [...values.values()]; },
  };
}

module.exports = { createInMemoryCollection };
