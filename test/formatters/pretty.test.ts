import { describe, expect, it } from "vitest"

import { formatPretty } from "../../src/formatters/pretty.js"
import { createDigest } from "../../src/core/createDigest.js"

describe("formatPretty", () => {
  it("renders concise summary", () => {
    const digest = createDigest({
      command: "pnpm tsc",
      cwd: "/repo",
      exitCode: 2,
      durationMs: 10,
      log: "src/user.ts(3,7): error TS2322: bad",
      maxErrors: 20,
      truncated: false,
      redacted: true
    })

    expect(formatPretty(digest)).toContain("failed")
  })
})
