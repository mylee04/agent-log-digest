import { describe, expect, it } from "vitest"

import { SCHEMA_VERSION } from "../../src/index.js"
import type { AgentLogDigest } from "../../src/index.js"

const schemaFixture = {
  schemaVersion: "0.1",
  status: "failed",
  exitCode: 2,
  command: "pnpm tsc --noEmit --pretty false",
  cwd: "/repo",
  durationMs: 1250,
  detectedTools: ["typescript"],
  summary: {
    headline: "TypeScript failed with 1 error in 1 file.",
    errors: 1,
    warnings: 0,
    failedTests: 0,
    passedTests: 12,
    filesWithProblems: 1
  },
  problems: [
    {
      id: "p1",
      severity: "error",
      tool: "typescript",
      file: "src/index.ts",
      line: 18,
      column: 22,
      code: "TS2339",
      message: "Property 'email' does not exist on type 'UserDTO'.",
      snippet: "user.email",
      stack: [
        {
          file: "src/index.ts",
          line: 18,
          column: 22,
          functionName: "loadUser"
        }
      ],
      confidence: 0.98
    }
  ],
  groups: [
    {
      key: "typescript:TS2339",
      label: "TypeScript TS2339",
      count: 1,
      firstProblemId: "p1"
    }
  ],
  nextCommands: ["pnpm tsc --noEmit --pretty false"],
  artifacts: {
    rawLog: ".agent-log-digest/latest.log",
    json: ".agent-log-digest/latest.json",
    markdown: ".agent-log-digest/latest.md"
  },
  meta: {
    generatedAt: "2026-06-09T00:00:00.000Z",
    packageName: "agent-log-digest",
    packageVersion: "0.1.1",
    truncated: false,
    redacted: true
  }
} satisfies AgentLogDigest

describe("core types", () => {
  it("schema fixture satisfies AgentLogDigest", () => {
    expect(SCHEMA_VERSION).toBe("0.1")
    expect(schemaFixture.schemaVersion).toBe("0.1")
  })
})
