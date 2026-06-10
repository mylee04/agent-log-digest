import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import { parseNext } from "../../src/parsers/next.js"

describe("parseNext", () => {
  it("extracts Next.js build compile failures", () => {
    const log = readFileSync("test/fixtures/next-build.log", "utf8")
    const problems = parseNext(log)

    expect(problems).toHaveLength(1)
    expect(problems[0]).toMatchObject({
      tool: "next",
      severity: "error",
      file: "app/page.tsx",
      line: 12,
      column: 7,
      message: "Type 'string' is not assignable to type 'number'.",
      confidence: 0.9
    })
  })
})
