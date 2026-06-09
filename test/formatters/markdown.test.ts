import { describe, expect, it } from "vitest"

import { formatMarkdown } from "../../src/formatters/markdown.js"
import { createDigest } from "../../src/core/createDigest.js"

describe("formatMarkdown", () => {
  it("includes top problems and commands", () => {
    const digest = createDigest({
      command: "pnpm tsc --noEmit --pretty false",
      cwd: "/repo",
      exitCode: 2,
      durationMs: 10,
      log: "src/user.ts(3,7): error TS2322: bad",
      maxErrors: 20,
      truncated: false,
      redacted: true
    })

    const markdown = formatMarkdown(digest)

    expect(markdown).toContain("## Summary")
    expect(markdown).toContain("## Top problems")
    expect(markdown).toContain("## Suggested next commands")
  })
})
