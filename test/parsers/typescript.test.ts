import { describe, expect, it } from "vitest"

import { parseTypeScript } from "../../src/parsers/typescript.js"

describe("parseTypeScript", () => {
  it("extracts tsc errors", () => {
    const problems = parseTypeScript("src/index.ts(3,7): error TS2322: Type 'string' is not assignable to type 'number'.")

    expect(problems).toHaveLength(1)
    expect(problems[0]).toMatchObject({
      tool: "typescript",
      file: "src/index.ts",
      line: 3,
      column: 7,
      code: "TS2322"
    })
  })

  it("extracts windows paths", () => {
    const problems = parseTypeScript("C:\\repo\\src\\index.ts(4,9): error TS7006: Parameter 'x' implicitly has an 'any' type.")

    expect(problems[0]?.file).toBe("C:\\repo\\src\\index.ts")
    expect(problems[0]?.code).toBe("TS7006")
  })
})
