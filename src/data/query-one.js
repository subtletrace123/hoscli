async function queryOne(db, sql, parameters) {
  const result = await db.query(sql, parameters);
  return result.rows[0] ?? null;
}

module.exports = { queryOne };
