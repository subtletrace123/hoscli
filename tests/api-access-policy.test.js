const assert = require("node:assert/strict");
const test = require("node:test");

const { API_TARGET_SCREENS } = require("../src/auth/api-access-policy");

test("病院・admin APIの認可先画面を定義する", () => {
  assert.deepEqual(API_TARGET_SCREENS, {
    clinic: "clinic",
    hospital: "hospital",
    admin: "admin",
  });
});
