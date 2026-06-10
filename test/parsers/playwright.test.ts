import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import { parsePlaywright } from "../../src/parsers/playwright.js"

describe("parsePlaywright", () => {
  it("extracts Playwright text reporter failures", () => {
    const log = readFileSync("test/fixtures/playwright-report.log", "utf8")
    const problems = parsePlaywright(log)

    expect(problems).toHaveLength(1)
    expect(problems[0]).toMatchObject({
      tool: "playwright",
      severity: "fail",
      file: "tests/login.spec.ts",
      line: 8,
      column: 5,
      testName: "login flow › shows dashboard",
      message: "expect(locator).toBeVisible() failed",
      confidence: 0.9
    })
  })
})
