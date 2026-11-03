const { belongsToClinic } = require("./belongs-to-clinic");

async function findClinicData(clinicId, repository) {
  const rows = await repository.list();
  return rows.filter((row) => belongsToClinic(row, clinicId));
}

module.exports = { findClinicData };
