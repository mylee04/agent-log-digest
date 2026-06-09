import { mkdtemp, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { describe, expect, it } from "vitest"

import { runCli } from "../../src/cli.js"

describe("parse command", () => {
  it("parses log file and emits digest", async () => {
    const dir = await mkdtemp(join(tmpdir(), "agent-log-digest-"))
    const log = join(dir, "tsc.log")
    const output = join(dir, "digest.json")
    await writeFile(log, "src/a.ts(1,1): error TS2307: Cannot find module x.")

    const code = await runCli(["parse", log, "--json", "--output", output])

    expect(code).toBe(0)
  })

  it("missing file exits usage error 2", async () => {
    const code = await runCli(["parse", "does-not-exist.log", "--json"])

    expect(code).toBe(2)
  })
})
