const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const provider = process.argv[2];
if (provider !== "copilot" && provider !== "codex") {
  process.stderr.write("Expected provider argument: copilot or codex.\n");
  process.exit(1);
}

function respond(value = {}) {
  fs.writeSync(1, JSON.stringify(value));
  process.exit(0);
}

function deny(reason) {
  if (provider === "codex") {
    respond({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
    });
  }

  respond({ permissionDecision: "deny", permissionDecisionReason: reason });
}

function isValidBranchName(name) {
  const [kind, ...descriptionParts] = name.split("/");
  const description = descriptionParts.join("/");

  if (!description || !["feature", "fix", "docs", "chore", "release"].includes(kind)) {
    return false;
  }

  if (kind === "release") {
    return /^v(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)$/.test(description);
  }

  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(description);
}

function getToolStrings(value, output = []) {
  if (typeof value === "string") {
    output.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) getToolStrings(item, output);
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) getToolStrings(item, output);
  }
  return output;
}

function normalizePath(value) {
  let normalized = String(value).trim().replace(/^["']|["']$/g, "");
  if (/^file:/i.test(normalized)) {
    try {
      normalized = decodeURIComponent(new URL(normalized).pathname).replace(/^\/([A-Za-z]:)/, "$1");
    } catch {
      return "";
    }
  }
  return normalized.replace(/\\/g, "/");
}

function collectPaths(value, output = []) {
  if (typeof value === "string") {
    const patchPatterns = [
      /^\*\*\*\s+(?:Add|Update|Delete) File:\s*(.+?)\s*$/gm,
      /^\+\+\+\s+b\/(.+?)\s*$/gm,
    ];
    for (const pattern of patchPatterns) {
      for (const match of value.matchAll(pattern)) output.push(normalizePath(match[1]));
    }
  } else if (Array.isArray(value)) {
    for (const item of value) collectPaths(item, output);
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (/^(?:file_?path|path|uri|filename|target_?path)$/i.test(key) && typeof item === "string") {
        output.push(normalizePath(item));
      }
      collectPaths(item, output);
    }
  }
  return [...new Set(output.filter(Boolean))];
}

function isTestPath(filePath) {
  const normalized = normalizePath(filePath).toLowerCase();
  const baseName = path.posix.basename(normalized);
  return /(?:^|\/)(?:tests?|specs?|__tests__)(?:\/|$)/.test(normalized) ||
    /^(?:test_[^/]+|[^/]+_test|[^/]+\.(?:test|spec))\.[^.]+$/.test(baseName);
}

const sourceExtensions = new Set([
  ".c", ".cc", ".cpp", ".cs", ".css", ".dart", ".ex", ".exs", ".fs", ".fsx",
  ".go", ".h", ".hpp", ".htm", ".html", ".ipynb", ".java", ".js", ".jsx", ".kt",
  ".kts", ".m", ".mjs", ".mm", ".php", ".pl", ".py", ".r", ".rb", ".rs", ".scala",
  ".sh", ".sql", ".swift", ".svelte", ".ts", ".tsx", ".vue", ".ps1",
]);

function isImplementationPath(filePath) {
  return sourceExtensions.has(path.posix.extname(normalizePath(filePath)).toLowerCase()) &&
    !isTestPath(filePath);
}

function isFileChangeTool(toolName) {
  return ["edit", "write", "create", "apply_patch", "str_replace_editor", "replace_string_in_file"]
    .includes(toolName);
}

function isTestCommand(command) {
  return /\bnode\s+--test\b/i.test(command) ||
    /\b(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?test(?::[\w:-]+)?\b/i.test(command) ||
    /\b(?:pytest|py\.test|jest|vitest|mocha|playwright|cypress|phpunit|rspec)\b/i.test(command) ||
    /\bpython(?:\d(?:\.\d+)?)?\s+-m\s+(?:pytest|unittest)\b/i.test(command) ||
    /\b(?:go\s+test|cargo\s+test|dotnet\s+test|mvn\s+test|gradle\s+test|mix\s+test)\b/i.test(command) ||
    /\b(?:php\s+artisan\s+test|composer\s+test)\b/i.test(command);
}

function getExitCode(value) {
  if (!value || typeof value !== "object") return undefined;
  for (const [key, item] of Object.entries(value)) {
    const numericValue = typeof item === "number"
      ? item
      : typeof item === "string" && item.trim() !== ""
        ? Number(item)
        : Number.NaN;
    if (/^(?:exit_?code|return_?code)$/i.test(key) && Number.isInteger(numericValue)) {
      return numericValue;
    }
    const nested = getExitCode(item);
    if (nested !== undefined) return nested;
  }
  return undefined;
}

function getResultText(event) {
  return getToolStrings([
    event.error,
    event.tool_result ?? event.toolResult,
    event.tool_response,
  ]).join("\n");
}

function testCommandFailed(event, eventName) {
  if (eventName === "posttoolusefailure") return true;
  const exitCode = getExitCode(event.tool_result ?? event.toolResult ?? event.tool_response);
  if (exitCode !== undefined) return exitCode !== 0;
  return /(?:exit(?:ed)?\s+(?:with\s+)?(?:code|status)\s*[:=]?\s*[1-9]\d*|\bnot ok\b|\bFAIL(?:ED)?\b|test result:\s*FAILED|\d+\s+failed\b)/i
    .test(getResultText(event));
}

function testCommandPassed(event) {
  const exitCode = getExitCode(event.tool_result ?? event.toolResult ?? event.tool_response);
  if (exitCode !== undefined) return exitCode === 0;
  return /(?:#\s*pass\s+\d+[\s\S]*?#\s*fail\s+0\b|\b\d+\s+passed\b|\bpassed!\s*-\s*failed:\s*0\b|test result:\s*ok\b|test suites?:\s*\d+\s+passed\b)/i
    .test(getResultText(event));
}

function getStatePath(repositoryRoot, event) {
  const sessionId = event.session_id ?? event.sessionId;
  if (typeof sessionId !== "string" || sessionId.length === 0) return null;
  const key = crypto.createHash("sha256")
    .update(`${provider}\0${repositoryRoot}\0${sessionId}`)
    .digest("hex");
  return path.join(os.tmpdir(), "hoscli-agent-tdd", `${key}.json`);
}

function readState(statePath) {
  if (!statePath) return { testFilesTouched: false, redTestObserved: false };
  try {
    return JSON.parse(fs.readFileSync(statePath, "utf8"));
  } catch {
    return { testFilesTouched: false, redTestObserved: false };
  }
}

function writeState(statePath, state) {
  if (!statePath) return;
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  const temporaryPath = `${statePath}.${process.pid}.tmp`;
  fs.writeFileSync(temporaryPath, JSON.stringify(state));
  fs.renameSync(temporaryPath, statePath);
}

function removeState(statePath) {
  if (statePath) fs.rmSync(statePath, { force: true });
}

function commandMayWriteImplementation(command) {
  if (/\bgit\s+apply\b/i.test(command)) return true;
  const mutatingCommand = /(?:\b(?:tee|set-content|add-content|out-file)\b|\bsed\s+-i\b|\bperl\s+-i\b|\b(?:cat|echo|printf)\b[^\r\n;&|]*(?:>>?|\|\s*tee)\s*|\bnode\s+-e\b|\bpython(?:\d(?:\.\d+)?)?\s+-c\b)/i;
  if (!mutatingCommand.test(command)) return false;
  const paths = command.match(/[\w./\\-]+\.(?:c|cc|cpp|cs|css|go|h|hpp|htm|html|java|js|jsx|kt|kts|mjs|php|py|rb|rs|scala|sh|sql|swift|svelte|ts|tsx|vue|ps1)\b/gi) || [];
  return paths.some(isImplementationPath);
}

function branchPolicyFailure(currentBranch, toolName, commandText) {
  if (currentBranch === "main" && ["edit", "write", "create", "apply_patch"].includes(toolName)) {
    return "main への直接編集は禁止です。作業ブランチを作成してから変更してください。";
  }
  if (currentBranch === "main" && /\bgit\s+(?:add|commit|merge|cherry-pick|rebase|reset|push)\b/i.test(commandText)) {
    return "main 上での変更系 Git 操作は禁止です。作業ブランチで操作してください。";
  }
  if (/\bgit\s+push\b[^\r\n;&|]*(?:\s|:)(?:main|refs\/heads\/main)(?=$|[\s;&|])/i.test(commandText)) {
    return "main への直接 push は禁止です。PR を作成してください。";
  }

  const branchCreationPattern =
    /\bgit\s+(?:switch\s+-c|checkout\s+-b|branch\s+(?:--create|-c))\s+("([^"\r\n]+)"|'([^'\r\n]+)'|[^\s;&|]+)/gi;
  for (const match of commandText.matchAll(branchCreationPattern)) {
    const branchName = match[2] ?? match[3] ?? match[1];
    if (!isValidBranchName(branchName)) {
      return `ブランチ名 '${branchName}' は規則に合いません。feature/、fix/、docs/、chore/、release/ の形式を使ってください。`;
    }
  }
  return null;
}

let event;
try {
  event = JSON.parse(fs.readFileSync(0, "utf8"));
} catch (error) {
  process.stderr.write(`Unable to parse hook input: ${error.message}\n`);
  process.exit(1);
}

const eventName = String(event.hook_event_name ?? "PreToolUse").toLowerCase();
const toolName = String(event.tool_name ?? event.toolName ?? "").toLowerCase();
const toolInput = event.tool_input ?? event.toolArgs;
const commandText = getToolStrings(toolInput).join("\n");
const workingDirectory = event.cwd || process.cwd();

let repositoryRoot;
let currentBranch;
try {
  repositoryRoot = execFileSync("git", ["-C", workingDirectory, "rev-parse", "--show-toplevel"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
  currentBranch = execFileSync("git", ["-C", repositoryRoot, "branch", "--show-current"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
} catch {
  respond();
}

const statePath = getStatePath(repositoryRoot, event);
if (eventName === "userpromptsubmit") {
  writeState(statePath, { testFilesTouched: false, redTestObserved: false });
  respond();
}
if (eventName === "sessionend") {
  removeState(statePath);
  respond();
}

if (eventName === "posttooluse" || eventName === "posttoolusefailure") {
  const state = readState(statePath);
  if (isFileChangeTool(toolName)) {
    const changedPaths = collectPaths(toolInput);
    if (changedPaths.some(isTestPath)) {
      state.testFilesTouched = true;
      state.redTestObserved = false;
    }
  }
  if (["bash", "powershell"].includes(toolName) && isTestCommand(commandText) && state.testFilesTouched) {
    if (testCommandFailed(event, eventName)) state.redTestObserved = true;
    else if (testCommandPassed(event)) state.redTestObserved = false;
  }
  writeState(statePath, state);
  respond();
}

if (eventName !== "pretooluse") respond();

const branchFailure = branchPolicyFailure(currentBranch, toolName, commandText);
if (branchFailure) deny(branchFailure);

if (isFileChangeTool(toolName)) {
  const changedPaths = collectPaths(toolInput);
  if (changedPaths.length === 0) {
    deny("変更対象のファイルを特定できないため編集を止めました。ファイルパスが分かる形で変更してください。");
  }
  const implementationPaths = changedPaths.filter(isImplementationPath);
  if (implementationPaths.length > 0) {
    const state = readState(statePath);
    if (!statePath || !state.testFilesTouched || !state.redTestObserved) {
      deny("TDD 順序を確認できません。先にテストを追加し、そのテストを実行して失敗を確認してから実装してください。");
    }
  }
}

if (["bash", "powershell"].includes(toolName)) {
  if (commandMayWriteImplementation(commandText)) {
    const state = readState(statePath);
    if (!statePath || !state.testFilesTouched || !state.redTestObserved) {
      deny("TDD 順序を確認できません。先にテストを追加し、そのテストを実行して失敗を確認してから実装してください。");
    }
  }
}

respond();