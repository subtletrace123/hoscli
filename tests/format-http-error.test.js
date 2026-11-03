const assert = require("node:assert/strict");
const test = require("node:test");

const {
  formatHttpError,
} = require("../src/web/format-http-error");

test("認証エラーを統一HTTP形式へ変換する", () => {
  const response = formatHttpError({
    code: "UNAUTHENTICATED",
    status: 401,
    message: "Authentication required",
  });

  assert.deepEqual(response, {
    status: 401,
    body: {
      error: {
        code: "UNAUTHENTICATED",
        message: "Authentication required",
      },
    },
  });
});

test("権限エラーを403形式へ変換する", () => {
  assert.deepEqual(
    formatHttpError({ code: "FORBIDDEN", status: 403, message: "Forbidden" }),
    {
      status: 403,
      body: { error: { code: "FORBIDDEN", message: "Forbidden" } },
    },
  );
});

test("HTTPエラー形式に秘密情報を含めない", () => {
  const response = formatHttpError({
    code: "FORBIDDEN",
    status: 403,
    message: "Forbidden",
    password: "secret",
  });

  assert.equal("password" in response.body.error, false);
});
