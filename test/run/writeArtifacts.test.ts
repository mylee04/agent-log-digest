import { mkdtemp, readFile, stat } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { describe, expect, it } from "vitest"

import { writeArtifacts } from "../../src/run/writeArtifacts.js"

describe("writeArtifacts", () => {
  it("writes redacted raw log only when raw-log path is provided", async () => {
    const dir = await mkdtemp(join(tmpdir(), "agent-log-digest-"))
    const rawLog = join(dir, "raw.log")
    const output = join(dir, "digest.json")

    await writeArtifacts({
      formatted: "{\"ok\":true}",
      outputFile: output,
      rawLog: "GITHUB_TOKEN=ghp_abcdefghijklmnopqrstuvwxyz",
      rawLogFile: rawLog,
      redact: true
    })

    await expect(stat(rawLog)).resolves.toBeDefined()
    await expect(readFile(rawLog, "utf8")).resolves.toContain("[REDACTED]")
    await expect(readFile(output, "utf8")).resolves.toBe("{\"ok\":true}")
  })
})
