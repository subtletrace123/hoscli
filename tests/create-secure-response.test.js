const assert = require("node:assert/strict");
const test = require("node:test");

const {
  createSecureResponse,
} = require("../src/web/create-secure-response");

test("セキュアなHTTPレスポンスを生成する", () => {
  const response = createSecureResponse("session-1");

  assert.equal(response.status, 200);
  assert.equal(response.setCookie.includes("Secure"), true);
  assert.equal(response.headers["X-Frame-Options"], "DENY");
});
