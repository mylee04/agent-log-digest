import { mkdir, mkdtemp, symlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import { describe, expect, it } from "vitest"

import { CLI_HELP, isCliEntrypoint, runCli } from "../src/cli.js"

describe("infrastructure", () => {
  it("prints placeholder help", async () => {
    await expect(runCli([])).resolves.toBe(0)
    expect(CLI_HELP).toContain("agent-log-digest")
  })

  it("recognizes npm bin symlinks as the CLI entrypoint", async () => {
    const dir = await mkdtemp(join(tmpdir(), "agent-log-digest-bin-"))
    const realCliPath = join(dir, "dist", "cli.js")
    const binPath = join(dir, "agent-log-digest")
    await mkdir(join(dir, "dist"))
    await writeFile(realCliPath, "#!/usr/bin/env node\n")
    await symlink(realCliPath, binPath)

    expect(isCliEntrypoint(pathToFileURL(realCliPath).href, binPath)).toBe(true)
  })
})
