import { mkdir, mkdtemp, symlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import { afterEach, describe, expect, it, vi } from "vitest"

import { CLI_HELP, REPOSITORY_URL, STAR_PROMPT, isCliEntrypoint, runCli } from "../src/cli.js"

const captureStdout = async (argv: readonly string[]): Promise<string> => {
  let output = ""
  vi.spyOn(process.stdout, "write").mockImplementation((chunk: string | Uint8Array) => {
    output += chunk.toString()
    return true
  })

  await runCli(argv)

  return output
}

describe("infrastructure", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("prints help with an opt-in GitHub star link", async () => {
    await expect(runCli([])).resolves.toBe(0)
    expect(CLI_HELP).toContain("agent-log-digest")
    expect(CLI_HELP).toContain(REPOSITORY_URL)
  })

  it("prints repository support text from repo and support commands", async () => {
    const repoOutput = await captureStdout(["repo"])
    const supportOutput = await captureStdout(["support"])

    expect(repoOutput).toContain(REPOSITORY_URL)
    expect(repoOutput).toContain(STAR_PROMPT)
    expect(supportOutput).toBe(repoOutput)
  })

  it("prints star prompt after pretty doctor without changing json doctor output", async () => {
    const prettyOutput = await captureStdout(["doctor"])
    const jsonOutput = await captureStdout(["doctor", "--json"])

    expect(prettyOutput).toContain(STAR_PROMPT)
    expect(JSON.parse(jsonOutput)).toMatchObject({ ok: true })
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
