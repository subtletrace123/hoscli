const assert = require("node:assert/strict");
const test = require("node:test");

const { findClinicData } = require("../src/data/find-clinic-data");

test("医院IDでデータを分離し自院データだけを返す", async () => {
  const rows = [
    { id: "data-1", clinicId: "clinic-1" },
    { id: "data-2", clinicId: "clinic-2" },
  ];
  const result = await findClinicData("clinic-1", {
    async list() { return rows; },
  });

  assert.deepEqual(result, [{ id: "data-1", clinicId: "clinic-1" }]);
});

test("対象医院のデータがない場合は空配列を返す", async () => {
  const result = await findClinicData("clinic-9", {
    async list() { return [{ id: "data-1", clinicId: "clinic-1" }]; },
  });

  assert.deepEqual(result, []);
});
