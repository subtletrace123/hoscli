function isAccountSessionValid(session, account) {
  const passwordChanged =
    account?.passwordChangedAt instanceof Date &&
    account.passwordChangedAt > session.authenticatedAt;
  return account?.status === "active" && !passwordChanged;
}

module.exports = { isAccountSessionValid };
