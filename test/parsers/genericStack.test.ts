import { describe, expect, it } from "vitest"

import { parseGenericStack } from "../../src/parsers/genericStack.js"

describe("parseGenericStack", () => {
  it("extracts Node stack frames", () => {
    const problems = parseGenericStack("Error: boom\n    at main (/repo/src/index.ts:10:5)")

    expect(problems[0]).toMatchObject({
      tool: "generic",
      file: "src/index.ts",
      line: 10,
      column: 5
    })
  })

  it("handles bare file line column", () => {
    const problems = parseGenericStack("src/index.ts:12:8")

    expect(problems[0]).toMatchObject({
      file: "src/index.ts",
      line: 12,
      column: 8
    })
  })
})
