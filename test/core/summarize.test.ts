import { describe, expect, it } from "vitest"

import { summarizeProblems } from "../../src/core/summarize.js"

describe("summarizeProblems", () => {
  it("headline includes tool error counts and file counts", () => {
    const summary = summarizeProblems([
      { id: "p1", severity: "error", tool: "typescript", file: "src/a.ts", code: "TS2322", message: "bad", confidence: 0.98 }
    ])

    expect(summary.headline).toContain("TypeScript failed with 1 error in 1 file")
    expect(summary.filesWithProblems).toBe(1)
  })
})
