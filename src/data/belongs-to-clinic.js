function belongsToClinic(data, clinicId) {
  return Boolean(data?.clinicId && data.clinicId === clinicId);
}

module.exports = { belongsToClinic };
