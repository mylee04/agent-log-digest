import { describe, expect, it } from "vitest"

import { redactSecrets } from "../../src/core/redact.js"

describe("redactSecrets", () => {
  it("redacts common API tokens", () => {
    const redacted = redactSecrets([
      "OPENAI_API_KEY=sk-abcdefghijklmnopqrstuvwxyz",
      "ANTHROPIC_API_KEY=anthropic-secret-value",
      "GITHUB_TOKEN=ghp_abcdefghijklmnopqrstuvwxyz",
      "Authorization: Bearer abc.def-ghi"
    ].join("\n"))

    expect(redacted).toContain("OPENAI_API_KEY=[REDACTED]")
    expect(redacted).toContain("ANTHROPIC_API_KEY=[REDACTED]")
    expect(redacted).toContain("GITHUB_TOKEN=[REDACTED]")
    expect(redacted).toContain("Bearer [REDACTED]")
    expect(redacted).not.toContain("abcdefghijklmnopqrstuvwxyz")
    expect(redacted).not.toContain("abc.def-ghi")
  })
})
