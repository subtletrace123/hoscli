function isSessionRevoked(session) {
  return session?.revokedAt instanceof Date;
}

module.exports = { isSessionRevoked };
