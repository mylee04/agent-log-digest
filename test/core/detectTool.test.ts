import { describe, expect, it } from "vitest"

import { detectTools } from "../../src/core/detectTool.js"

describe("detectTools", () => {
  it("detects tsc from command and TS error", () => {
    expect(detectTools("pnpm tsc --noEmit", "src/a.ts(1,1): error TS2322: bad")).toEqual([
      "typescript"
    ])
  })
})
