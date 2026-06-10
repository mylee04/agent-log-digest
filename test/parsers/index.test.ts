import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"

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

  it("routes forced framework tools to their parsers", () => {
    expect(parseProblems({
      command: "parse",
      log: readFileSync("test/fixtures/next-build.log", "utf8"),
      forcedTool: "next"
    })[0]?.tool).toBe("next")
    expect(parseProblems({
      command: "parse",
      log: readFileSync("test/fixtures/vite-build.log", "utf8"),
      forcedTool: "vite"
    })[0]?.tool).toBe("vite")
    expect(parseProblems({
      command: "parse",
      log: readFileSync("test/fixtures/playwright-report.log", "utf8"),
      forcedTool: "playwright"
    })[0]?.tool).toBe("playwright")
  })

  it("falls back to detection when forced tool is unsupported", () => {
    const problems = parseProblems({
      command: "parse",
      log: readFileSync("test/fixtures/next-build.log", "utf8"),
      forcedTool: "not-a-tool"
    })

    expect(problems[0]?.tool).toBe("next")
  })
})
