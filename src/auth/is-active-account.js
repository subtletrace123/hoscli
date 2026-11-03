function isActiveAccount(account) {
  return account?.status === "active";
}

module.exports = { isActiveAccount };
