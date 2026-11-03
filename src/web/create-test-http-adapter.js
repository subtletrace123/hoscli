const { invokeTestHandler } = require("./invoke-test-handler");

function createTestHttpAdapter(handler) {
  return {
    request(request) {
      return invokeTestHandler(handler, request);
    },
  };
}

module.exports = { createTestHttpAdapter };
