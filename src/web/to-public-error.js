function toPublicError(error) {
  return { code: error.code, message: error.message };
}

module.exports = { toPublicError };
