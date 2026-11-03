const assert = require("node:assert/strict");
const test = require("node:test");

const {
  createApiAccessPolicy,
} = require("../src/auth/create-api-access-policy");

test("画面ロール定義からAPI認可対象を生成する", () => {
  assert.deepEqual(
    createApiAccessPolicy({ clinic: "clinic", hospital: "hospital_staff", admin: "admin" }),
    { clinic: "clinic", hospital: "hospital", admin: "admin" },
  );
});
