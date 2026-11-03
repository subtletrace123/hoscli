const assert = require("node:assert/strict");
const test = require("node:test");

const { belongsToClinic } = require("../src/data/belongs-to-clinic");

test("データが指定医院に属するか判定する", () => {
  assert.equal(belongsToClinic({ clinicId: "clinic-1" }, "clinic-1"), true);
  assert.equal(belongsToClinic({ clinicId: "clinic-2" }, "clinic-1"), false);
  assert.equal(belongsToClinic({}, "clinic-1"), false);
});
