async function recordLoginEvent({
  account,
  createdAt,
  eventType,
  auditEventRepository,
}) {
  await auditEventRepository.save({
    eventType,
    clinicId: account?.clinicId ?? null,
    accountId: account?.id ?? null,
    createdAt,
  });
}

module.exports = { recordLoginEvent };
