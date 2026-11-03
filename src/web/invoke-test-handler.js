function invokeTestHandler(handler, request) {
  return handler(request);
}

module.exports = { invokeTestHandler };
