import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import { parseVite } from "../../src/parsers/vite.js"

describe("parseVite", () => {
  it("extracts Vite build module resolution failures", () => {
    const log = readFileSync("test/fixtures/vite-build.log", "utf8")
    const problems = parseVite(log)

    expect(problems).toHaveLength(1)
    expect(problems[0]).toMatchObject({
      tool: "vite",
      severity: "error",
      file: "src/main.ts",
      line: 3,
      column: 18,
      message: "Could not resolve \"./missing\" from \"src/main.ts\"",
      confidence: 0.88
    })
  })
})
