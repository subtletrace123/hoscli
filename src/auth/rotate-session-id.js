const MAX_SESSION_ID_ROTATION_ATTEMPTS = 100;

function rotateSessionId(previousId, sessionIdGenerator) {
  for (let attempt = 0; attempt < MAX_SESSION_ID_ROTATION_ATTEMPTS; attempt += 1) {
    const nextId = sessionIdGenerator();
    if (nextId !== previousId) return nextId;
  }
  throw new Error("Unable to rotate session ID");
}

module.exports = { rotateSessionId, MAX_SESSION_ID_ROTATION_ATTEMPTS };
