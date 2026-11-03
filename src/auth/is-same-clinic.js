function isSameClinic(session, data) {
  return Boolean(
    session?.clinicId && data?.clinicId && session.clinicId === data.clinicId,
  );
}

module.exports = { isSameClinic };
