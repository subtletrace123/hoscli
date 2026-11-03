const assert = require("node:assert/strict");
const test = require("node:test");

const { isPasswordCompliant } = require("../src/auth/password-policy");

test("8文字以上64文字以下で大文字・小文字・数字・記号を含むパスワードだけを許可する", () => {
  assert.equal(isPasswordCompliant("Abcdef1!"), true);
  assert.equal(isPasswordCompliant(`Aa1!${"x".repeat(60)}`), true);

  const invalidCases = [
    { password: "Ab1!xyz", reason: "8文字未満" },
    { password: "abcdef1!", reason: "大文字なし" },
    { password: "ABCDEF1!", reason: "小文字なし" },
    { password: "Abcdefg!", reason: "数字なし" },
    { password: "Abcdef12", reason: "記号なし" },
    { password: "Abcdef1 ", reason: "空白は記号として扱わない" },
    { password: `Aa1!${"x".repeat(61)}`, reason: "64文字超過" },
  ];

  for (const { password, reason } of invalidCases) {
    assert.equal(isPasswordCompliant(password), false, reason);
  }
});
