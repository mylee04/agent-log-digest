import { mkdtemp, readFile, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import { runCli } from "../../src/cli.js"

describe("init command", () => {
  it("writes local example files after explicit invocation", async () => {
    const dir = await mkdtemp(join(tmpdir(), "agent-log-digest-init-"))

    const code = await runCli(["init", "--cwd", dir])

    await expect(readFile(join(dir, ".agent-log-digest", "example.ci.sh"), "utf8")).resolves.toContain("agent-log-digest")
    await expect(readFile(join(dir, ".agent-log-digest", "README.md"), "utf8")).resolves.toContain("local-only")
    expect(code).toBe(0)
  })

  it("writes a no-install local-only example script", async () => {
    const dir = await mkdtemp(join(tmpdir(), "agent-log-digest-init-"))

    expect(await runCli(["init", "--cwd", dir])).toBe(0)

    const script = await readFile(join(dir, ".agent-log-digest", "example.ci.sh"), "utf8")
    expect(script).toContain("./node_modules/.bin/agent-log-digest")
    expect(script).not.toContain("npx")
  })

  it("refuses to overwrite unless force is provided", async () => {
    const dir = await mkdtemp(join(tmpdir(), "agent-log-digest-init-"))
    const exampleFile = join(dir, ".agent-log-digest", "example.ci.sh")

    expect(await runCli(["init", "--cwd", dir])).toBe(0)
    await writeFile(exampleFile, "custom")

    expect(await runCli(["init", "--cwd", dir])).toBe(2)
    await expect(readFile(exampleFile, "utf8")).resolves.toBe("custom")
    expect(await runCli(["init", "--cwd", dir, "--force"])).toBe(0)
    await expect(readFile(exampleFile, "utf8")).resolves.toContain("agent-log-digest")
  })
})
