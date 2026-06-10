import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"

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
    expect(digest.meta.packageVersion).toBe("0.1.2")
  })

  it("suggests next commands for framework and browser test tools", () => {
    const nextDigest = createDigest({
      command: "parse test/fixtures/next-build.log",
      cwd: "/repo",
      exitCode: null,
      durationMs: 0,
      log: readFileSync("test/fixtures/next-build.log", "utf8"),
      maxErrors: 20,
      truncated: false,
      redacted: true,
      forcedTool: "next"
    })
    const viteDigest = createDigest({
      command: "parse test/fixtures/vite-build.log",
      cwd: "/repo",
      exitCode: null,
      durationMs: 0,
      log: readFileSync("test/fixtures/vite-build.log", "utf8"),
      maxErrors: 20,
      truncated: false,
      redacted: true,
      forcedTool: "vite"
    })
    const playwrightDigest = createDigest({
      command: "parse test/fixtures/playwright-report.log",
      cwd: "/repo",
      exitCode: null,
      durationMs: 0,
      log: readFileSync("test/fixtures/playwright-report.log", "utf8"),
      maxErrors: 20,
      truncated: false,
      redacted: true,
      forcedTool: "playwright"
    })

    expect(nextDigest.nextCommands).toEqual(["next build"])
    expect(viteDigest.nextCommands).toEqual(["vite build"])
    expect(playwrightDigest.nextCommands).toEqual(["playwright test tests/login.spec.ts"])
    expect(playwrightDigest.groups[0]?.label).toContain("login flow")
  })
})
