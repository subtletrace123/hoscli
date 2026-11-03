const assert = require("node:assert/strict");
const test = require("node:test");

const {
  advanceLoginFailureState,
  createLoginFailureState,
  isLoginRestrictionActive,
  resetLoginFailureState,
} = require("../src/auth/login-failure-policy");

function failedAtForAttempt(attempt) {
  return new Date(Date.UTC(2026, 10, 1, 1, 0, attempt - 1));
}

function advanceToFirstRestriction() {
  let state = createLoginFailureState();

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    state = advanceLoginFailureState({
      state,
      failedAt: failedAtForAttempt(attempt),
    });
  }

  return state;
}

function advanceFiveFailuresAfterRestriction(state, onIntermediateFailure) {
  const restrictionEndsAt = state.blockedUntil;

  for (let offset = 0; offset < 5; offset += 1) {
    const failedAt = new Date(restrictionEndsAt.getTime() + offset * 1000);
    state = advanceLoginFailureState({ state, failedAt });

    if (offset < 4) {
      onIntermediateFailure?.({
        state,
        failedAt,
        offset,
        restrictionEndsAt,
      });
    }
  }

  return state;
}

function assertFailureState(
  state,
  { consecutiveFailures, restrictionStage, blockedUntil, lastFailedAt },
) {
  assert.deepEqual(state, {
    consecutiveFailures,
    restrictionStage,
    blockedUntil: blockedUntil === null ? null : new Date(blockedUntil),
    lastFailedAt: lastFailedAt === null ? null : new Date(lastFailedAt),
  });
}

test("5回目のログイン失敗直後から5分間の制限を開始する", () => {
  let state = createLoginFailureState();

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const failedAt = failedAtForAttempt(attempt);

    state = advanceLoginFailureState({ state, failedAt });
    assert.equal(state.consecutiveFailures, attempt);

    if (attempt < 5) {
      assert.equal(state.blockedUntil, null);
      assert.equal(state.restrictionStage, 0);
    }
  }

  assertFailureState(state, {
    consecutiveFailures: 5,
    restrictionStage: 1,
    blockedUntil: "2026-11-01T01:05:04.000Z",
    lastFailedAt: "2026-11-01T01:00:04.000Z",
  });
});

test("制限中の再試行では失敗状態と制限終了時刻を変更しない", () => {
  const stateAtRestrictionStart = advanceToFirstRestriction();
  const stateAfterRetry = advanceLoginFailureState({
    state: stateAtRestrictionStart,
    failedAt: new Date("2026-11-01T01:01:04.000Z"),
  });

  assert.equal(stateAfterRetry, stateAtRestrictionStart);
  assert.deepEqual(stateAfterRetry, stateAtRestrictionStart);
});

test("制限終了時刻の直前は制限中で終了時刻ちょうどに解除する", () => {
  const state = advanceToFirstRestriction();

  assert.equal(
    isLoginRestrictionActive({
      state,
      at: new Date(state.blockedUntil.getTime() - 1),
    }),
    true,
  );
  assert.equal(
    isLoginRestrictionActive({ state, at: state.blockedUntil }),
    false,
  );
});

test("5分制限の解除後に追加5回失敗すると10分間の制限を開始する", () => {
  const state = advanceFiveFailuresAfterRestriction(
    advanceToFirstRestriction(),
    ({ state: intermediateState, failedAt, offset, restrictionEndsAt }) => {
      assert.equal(intermediateState.consecutiveFailures, 6 + offset);
      assert.equal(intermediateState.restrictionStage, 1);
      assert.equal(intermediateState.blockedUntil, restrictionEndsAt);
      assert.ok(restrictionEndsAt.getTime() <= failedAt.getTime());
    },
  );

  assertFailureState(state, {
    consecutiveFailures: 10,
    restrictionStage: 2,
    blockedUntil: "2026-11-01T01:15:08.000Z",
    lastFailedAt: "2026-11-01T01:05:08.000Z",
  });
});

test("10分制限の解除後に追加5回失敗すると30分間の制限を開始する", () => {
  const secondRestrictionState = advanceFiveFailuresAfterRestriction(
    advanceToFirstRestriction(),
  );
  const state = advanceFiveFailuresAfterRestriction(
    secondRestrictionState,
    ({ state: intermediateState, offset, restrictionEndsAt }) => {
      assert.equal(intermediateState.consecutiveFailures, 11 + offset);
      assert.equal(intermediateState.restrictionStage, 2);
      assert.equal(intermediateState.blockedUntil, restrictionEndsAt);
    },
  );

  assertFailureState(state, {
    consecutiveFailures: 15,
    restrictionStage: 3,
    blockedUntil: "2026-11-01T01:45:12.000Z",
    lastFailedAt: "2026-11-01T01:15:12.000Z",
  });
});

test("認証に成功すると連続失敗数と制限段階をリセットする", () => {
  const restrictedState = advanceToFirstRestriction();

  const resetState = resetLoginFailureState(restrictedState);

  assert.notEqual(resetState, restrictedState);
  assert.deepEqual(resetState, createLoginFailureState());
});

test("観測期間中に失敗がなければ段階をリセットして新しい1回目として数える", () => {
  const previousState = advanceToFirstRestriction();
  const observationPeriodMs = 24 * 60 * 60 * 1000;
  const failedAt = new Date(
    previousState.lastFailedAt.getTime() + observationPeriodMs,
  );

  const state = advanceLoginFailureState({
    state: previousState,
    failedAt,
    observationPeriodMs,
  });

  assert.notEqual(state, previousState);
  assertFailureState(state, {
    consecutiveFailures: 1,
    restrictionStage: 0,
    blockedUntil: null,
    lastFailedAt: failedAt,
  });
});
