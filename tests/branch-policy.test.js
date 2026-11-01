const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const { mkdtempSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const test = require("node:test");

const repositoryRoot = path.resolve(__dirname, "..");
const hookPath = path.join(repositoryRoot, ".github", "hooks", "branch-policy.js");

function runEvent(provider, event, cwd = repositoryRoot) {
  const result = spawnSync(process.execPath, [hookPath, provider], {
    cwd: repositoryRoot,
    encoding: "utf8",
    input: JSON.stringify({ cwd, ...event }),
  });

  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

function runHook(provider, toolName, command, cwd = repositoryRoot) {
  return runEvent(provider, {
    hook_event_name: "PreToolUse",
    tool_name: toolName,
    tool_input: command === undefined ? {} : { command },
  }, cwd);
}

function getPermissionDecision(provider, result) {
  return provider === "codex"
    ? result.hookSpecificOutput?.permissionDecision
    : result.permissionDecision;
}

for (const provider of ["copilot", "codex"]) {
  test(`${provider} blocks invalid branch names`, () => {
    const result = runHook(provider, "Bash", "git switch -c Feature/BadName");
    const decision = provider === "codex"
      ? result.hookSpecificOutput.permissionDecision
      : result.permissionDecision;

    assert.equal(decision, "deny");
  });

  test(`${provider} allows valid branch names`, () => {
    const result = runHook(provider, "Bash", "git switch -c feature/123-reservation-search");
    assert.deepEqual(result, {});
  });

  test(`${provider} blocks pushes targeting main`, () => {
    const repository = mkdtempSync(path.join(tmpdir(), "branch-policy-"));
    spawnSync("git", ["init", "--quiet", "-b", "feature/demo", repository]);
    const result = runHook(provider, "Bash", "git push origin feature/demo:main", repository);
    const decision = provider === "codex"
      ? result.hookSpecificOutput.permissionDecision
      : result.permissionDecision;

    try {
      assert.equal(decision, "deny");
    } finally {
      rmSync(repository, { force: true, recursive: true });
    }
  });

  test(`${provider} blocks direct edits on main`, () => {
    const toolName = provider === "codex" ? "apply_patch" : "Edit";
    const result = runHook(provider, toolName);
    const decision = provider === "codex"
      ? result.hookSpecificOutput.permissionDecision
      : result.permissionDecision;

    assert.equal(decision, "deny");
  });

  test(`${provider} requires a failing test before implementation`, () => {
    const repository = mkdtempSync(path.join(tmpdir(), "branch-policy-tdd-"));
    const init = spawnSync("git", ["init", "--quiet", "-b", "feature/tdd-demo", repository]);
    assert.equal(init.status, 0, init.stderr.toString());

    const sessionId = `tdd-${provider}-${Date.now()}-${Math.random()}`;
    const toolName = provider === "codex" ? "apply_patch" : "Edit";
    const emit = (event) => runEvent(provider, { session_id: sessionId, ...event }, repository);
    const sourceChange = {
      hook_event_name: "PreToolUse",
      tool_name: toolName,
      tool_input: { command: "*** Begin Patch\n*** Update File: src/service.js\n@@\n+export function service() {}\n*** End Patch" },
    };
    const testChange = {
      hook_event_name: "PreToolUse",
      tool_name: toolName,
      tool_input: { command: "*** Begin Patch\n*** Add File: tests/service.test.js\n+assert.equal(service(), 1);\n*** End Patch" },
    };
    const testEditCompleted = {
      hook_event_name: "PostToolUse",
      tool_name: toolName,
      tool_input: testChange.tool_input,
    };
    const failingTest = provider === "codex"
      ? {
          hook_event_name: "PostToolUse",
          tool_name: "Bash",
          tool_input: { command: "npm test" },
          tool_response: { exit_code: 1, output: "1 failed" },
        }
      : {
          hook_event_name: "PostToolUseFailure",
          tool_name: "Bash",
          tool_input: { command: "npm test" },
          error: "Tests failed with exit code 1",
        };
    const passingTest = provider === "codex"
      ? {
          hook_event_name: "PostToolUse",
          tool_name: "Bash",
          tool_input: { command: "npm test" },
          tool_response: { exit_code: 0, output: "1 passed" },
        }
      : {
          hook_event_name: "PostToolUse",
          tool_name: "Bash",
          tool_input: { command: "npm test" },
          tool_result: { result_type: "success", text_result_for_llm: "1 passed" },
        };

    try {
      emit({ hook_event_name: "UserPromptSubmit" });
      emit(failingTest);
      assert.equal(getPermissionDecision(provider, emit(sourceChange)), "deny");
      assert.deepEqual(emit(testChange), {});
      emit(testEditCompleted);
      assert.equal(getPermissionDecision(provider, emit(sourceChange)), "deny");
      emit(failingTest);
      assert.deepEqual(emit(sourceChange), {});
      emit(passingTest);
      assert.equal(getPermissionDecision(provider, emit(sourceChange)), "deny");
    } finally {
      emit({ hook_event_name: "SessionEnd" });
      rmSync(repository, { force: true, recursive: true });
    }
  });
}