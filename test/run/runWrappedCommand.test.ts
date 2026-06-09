import { describe, expect, it } from "vitest"

import { runWrappedCommand } from "../../src/run/runWrappedCommand.js"

describe("runWrappedCommand", () => {
  it("preserves nonzero exit code", async () => {
    const result = await runWrappedCommand(["node", "-e", "console.error('boom'); process.exit(7)"], {
      cwd: process.cwd(),
      maxLogBytes: 10_000,
      stream: false
    })

    expect(result.exitCode).toBe(7)
    expect(result.stderr).toContain("boom")
    expect(result.rawLog).toContain("boom")
  })

  it("truncates captured log and marks truncated", async () => {
    const result = await runWrappedCommand(["node", "-e", "console.log('abcdefghij')"], {
      cwd: process.cwd(),
      maxLogBytes: 5,
      stream: false
    })

    expect(result.truncated).toBe(true)
    expect(result.rawLog.length).toBeLessThanOrEqual(5)
  })

  it("times out and kills child", async () => {
    const result = await runWrappedCommand(["node", "-e", "setTimeout(() => {}, 10_000)"], {
      cwd: process.cwd(),
      maxLogBytes: 10_000,
      stream: false,
      timeoutMs: 50
    })

    expect(result.timedOut).toBe(true)
    expect(result.exitCode).not.toBe(0)
  })
})
