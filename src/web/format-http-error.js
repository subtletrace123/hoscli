const { toPublicError } = require("./to-public-error");

function formatHttpError(error) {
  return {
    status: error.status,
    body: { error: toPublicError(error) },
  };
}

module.exports = { formatHttpError };
