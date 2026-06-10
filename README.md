# agent-log-digest

[![npm version](https://img.shields.io/npm/v/agent-log-digest)](https://www.npmjs.com/package/agent-log-digest)
[![npm downloads](https://img.shields.io/npm/dw/agent-log-digest)](https://www.npmjs.com/package/agent-log-digest)
[![CI](https://github.com/mylee04/agent-log-digest/actions/workflows/ci.yml/badge.svg)](https://github.com/mylee04/agent-log-digest/actions/workflows/ci.yml)
[![GitHub stars](https://img.shields.io/github/stars/mylee04/agent-log-digest)](https://github.com/mylee04/agent-log-digest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

[한국어 README](./README.ko.md)

Turn noisy test, lint, typecheck, and build logs into compact JSON that AI coding agents can route, summarize, and store.

`agent-log-digest` is a local-only Node CLI. It runs a command or parses an existing log file, redacts common secrets by default, detects known tool output, and writes deterministic digests without telemetry, hosted services, or LLM calls.

If this CLI saves you time, please [star the GitHub repo](https://github.com/mylee04/agent-log-digest). It helps other developers discover local-only tooling for AI coding agents.

## Install

```bash
npm install -D agent-log-digest
```

Use directly with `npx` during early testing:

```bash
npx agent-log-digest --json -- npm test
```

## Usage

Wrap a command and preserve its exit code:

```bash
agent-log-digest --json -- npm run typecheck
```

Parse a saved log:

```bash
agent-log-digest parse ./logs/eslint.log --tool eslint --json --output ./digest.json
```

Keep CI green while still recording the failing command in the digest:

```bash
agent-log-digest --json --always-zero -- npm test
```

Write a redacted raw log next to the digest:

```bash
agent-log-digest --json --raw-log ./raw.log --output ./digest.json -- npm test
```

Check local runtime assumptions:

```bash
agent-log-digest doctor --json
```

Print the project URL:

```bash
agent-log-digest repo
```

Write local example files explicitly:

```bash
agent-log-digest init
```

## CI Recipe

Keep a CI step green while saving a structured digest for agents:

```yaml
- name: Test with digest
  run: npx agent-log-digest --json --always-zero --output ./agent-log-digest.json -- npm test
```

## Before and After

TypeScript log:

```text
src/user.ts(3,7): error TS2322: Type string is not assignable to number.
```

Digest summary:

```json
{"status":"failed","detectedTools":["typescript"],"summary":{"headline":"TypeScript failed with 1 error in 1 file."}}
```

Vite build log:

```text
[vite]: Rollup failed to resolve import "./missing" from "src/main.ts".
file: /repo/src/main.ts:3:18
```

Digest summary:

```json
{"status":"failed","detectedTools":["vite"],"nextCommands":["vite build"]}
```

## Output

The JSON output uses schema version `0.1`.

```json
{
  "schemaVersion": "0.1",
  "status": "failed",
  "exitCode": 2,
  "command": "npm run typecheck",
  "detectedTools": ["typescript"],
  "summary": {
    "headline": "TypeScript failed with 1 error in 1 file.",
    "errors": 1,
    "warnings": 0,
    "failedTests": 0,
    "filesWithProblems": 1
  },
  "problems": []
}
```

Public TypeScript types and helpers are exported from the package root:

```ts
import { SCHEMA_VERSION, createDigest, redactSecrets } from "agent-log-digest"
import type { AgentLogDigest, Problem } from "agent-log-digest"
```

## Supported Parsers

- TypeScript `tsc` diagnostics
- ESLint JSON formatter and minimal stylish output
- Vitest JSON-style failed test results
- Jest JSON-style failed test results
- Next.js text build failures
- Vite/Rollup text build failures
- Playwright text/list reporter failures
- Generic Node-style stack traces and `file:line:column` references

## CLI Options

- `--json`, `--markdown`, `--pretty`: choose formatter.
- `--output <file>`: write formatted digest to disk.
- `--raw-log <file>`: write the captured raw log after redaction.
- `--no-raw-log`: disable raw-log output even if configured.
- `--max-errors <n>`: cap reported problems.
- `--max-log-bytes <n>`: cap captured command output.
- `--cwd <dir>`: run or parse from another working directory.
- `--timeout <ms>`: terminate wrapped commands after a timeout.
- `--always-zero`: return exit code 0 while preserving the command exit code in JSON.
- `--no-stream`: capture command output without live passthrough.
- `--notify`: call `code-notify` or `cn` if available.
- `--redact`, `--no-redact`: enable or disable secret redaction.
- `--tool <name>`: force parser preference for `typescript`, `eslint`, `vitest`, `jest`, `next`, `vite`, `playwright`, or `generic`.

Usage errors exit `2`. Internal CLI errors exit `1`. Wrapped command exit codes are preserved unless `--always-zero` is set.

## Trust Model

Runtime behavior is local-only:

- no telemetry
- no runtime network calls
- no install hooks
- no automatic fixing
- no AI API calls

The package uses `child_process.spawn` with `shell: false` for wrapped commands.
