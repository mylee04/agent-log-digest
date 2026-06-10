import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"

import { SUPPORTED_TOOLS, detectTools } from "../../src/core/detectTool.js"

describe("detectTools", () => {
  it("detects tsc from command and TS error", () => {
    expect(detectTools("pnpm tsc --noEmit", "src/a.ts(1,1): error TS2322: bad")).toEqual([
      "typescript"
    ])
  })

  it("detects framework build and browser test tools", () => {
    expect(detectTools("next build", readFileSync("test/fixtures/next-build.log", "utf8"))).toContain("next")
    expect(detectTools("vite build", readFileSync("test/fixtures/vite-build.log", "utf8"))).toContain("vite")
    expect(detectTools("playwright test", readFileSync("test/fixtures/playwright-report.log", "utf8"))).toContain("playwright")
  })

  it("lists every forceable parser tool", () => {
    expect(SUPPORTED_TOOLS).toEqual([
      "typescript",
      "eslint",
      "vitest",
      "jest",
      "next",
      "vite",
      "playwright",
      "generic"
    ])
  })
})
