import { describe, expect, it } from "vitest"

import { parseProblems } from "../../src/parsers/index.js"

describe("parseProblems", () => {
  it("forced tool only runs requested parser", () => {
    const problems = parseProblems({
      command: "pnpm test",
      log: "src/index.ts(3,7): error TS2322: bad",
      forcedTool: "typescript"
    })

    expect(problems).toHaveLength(1)
    expect(problems[0]?.tool).toBe("typescript")
  })
})
