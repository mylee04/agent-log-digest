import { describe, expect, it } from "vitest"

import { createDigest } from "../../src/core/createDigest.js"

describe("createDigest", () => {
  it("creates failed TypeScript digest with grouped problems", () => {
    const digest = createDigest({
      command: "pnpm tsc --noEmit --pretty false",
      cwd: "/repo",
      exitCode: 2,
      durationMs: 10,
      log: "src/user.ts(3,7): error TS2322: Type string is not assignable to number.",
      maxErrors: 20,
      truncated: false,
      redacted: true
    })

    expect(digest.status).toBe("failed")
    expect(digest.summary.errors).toBe(1)
    expect(digest.groups[0]).toMatchObject({
      key: "typescript:TS2322",
      count: 1
    })
    expect(digest.nextCommands).toContain("pnpm tsc --noEmit --pretty false")
    expect(digest.meta.packageVersion).toBe("0.1.1")
  })
})
