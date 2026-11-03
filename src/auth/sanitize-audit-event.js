const AUDIT_SECRET_FIELDS = Object.freeze([
  "password",
  "passwordHash",
  "secondFactor",
  "token",
  "accessToken",
]);
const SECRET_FIELDS = new Set(AUDIT_SECRET_FIELDS);

function sanitizeAuditEvent(event) {
  return Object.fromEntries(
    Object.entries(event).filter(([key]) => !SECRET_FIELDS.has(key)),
  );
}

module.exports = { sanitizeAuditEvent, AUDIT_SECRET_FIELDS };
