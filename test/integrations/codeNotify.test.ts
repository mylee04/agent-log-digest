import { describe, expect, it } from "vitest"

import { notifyDigest } from "../../src/integrations/codeNotify.js"

describe("notifyDigest", () => {
  it("notify is skipped when code-notify is missing", async () => {
    const result = await notifyDigest({
      headline: "failed",
      status: "failed",
      command: "pnpm test",
      envPath: "/usr/bin:/bin"
    })

    expect(result.delivered).toBe(false)
  })
})
