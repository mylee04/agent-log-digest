import { describe, expect, it } from "vitest"

import { parseESLint } from "../../src/parsers/eslint.js"

describe("parseESLint", () => {
  it("parses ESLint JSON formatter output", () => {
    const problems = parseESLint(JSON.stringify([
      {
        filePath: "/repo/src/index.ts",
        messages: [
          {
            ruleId: "no-unused-vars",
            severity: 2,
            message: "'foo' is assigned a value but never used.",
            line: 10,
            column: 7
          }
        ]
      }
    ]))

    expect(problems[0]).toMatchObject({
      tool: "eslint",
      severity: "error",
      file: "src/index.ts",
      code: "no-unused-vars"
    })
  })

  it("parses minimal stylish output fallback", () => {
    const problems = parseESLint("/repo/src/index.ts\n  10:7  error  bad thing  no-unused-vars")

    expect(problems[0]).toMatchObject({
      file: "src/index.ts",
      line: 10,
      column: 7,
      code: "no-unused-vars"
    })
  })
})
