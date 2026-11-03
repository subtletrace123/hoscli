const assert = require("node:assert/strict");
const test = require("node:test");

const { isSameClinic } = require("../src/auth/is-same-clinic");

test("セッションとデータの医院ID一致を判定する", () => {
  assert.equal(
    isSameClinic({ clinicId: "clinic-1" }, { clinicId: "clinic-1" }),
    true,
  );
  assert.equal(
    isSameClinic({ clinicId: "clinic-1" }, { clinicId: "clinic-2" }),
    false,
  );
  assert.equal(isSameClinic({}, { clinicId: "clinic-1" }), false);
});
