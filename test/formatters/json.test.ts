import { describe, expect, it } from "vitest"

import { formatJson } from "../../src/formatters/json.js"

describe("formatJson", () => {
  it("emits parseable schema JSON", () => {
    const text = formatJson({
      schemaVersion: "0.1",
      status: "passed",
      exitCode: 0,
      command: "echo ok",
      cwd: "/repo",
      durationMs: 1,
      detectedTools: ["generic"],
      summary: { headline: "No problems detected.", errors: 0, warnings: 0, failedTests: 0, filesWithProblems: 0 },
      problems: [],
      groups: [],
      nextCommands: [],
      artifacts: {},
      meta: { generatedAt: "2026-06-09T00:00:00.000Z", packageName: "agent-log-digest", packageVersion: "0.1.0", truncated: false, redacted: true }
    })

    expect(JSON.parse(text)).toMatchObject({ schemaVersion: "0.1" })
  })
})
