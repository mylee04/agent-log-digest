import { spawn } from "node:child_process"
import { describe, expect, it } from "vitest"

type ProcessResult = {
  readonly code: number
  readonly stdout: string
  readonly stderr: string
}

const runProcess = (
  command: string,
  args: readonly string[]
): Promise<ProcessResult> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, [...args], {
      cwd: process.cwd(),
      shell: false
    })
    let stdout = ""
    let stderr = ""

    child.stdout.setEncoding("utf8")
    child.stderr.setEncoding("utf8")
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk
    })
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk
    })
    child.on("error", reject)
    child.on("close", (code) => {
      resolve({
        code: code ?? 1,
        stdout,
        stderr
      })
    })
  })

const runBuiltCli = (args: readonly string[]): Promise<ProcessResult> =>
  runProcess("node", ["dist/cli.js", ...args])

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const parseJsonObject = (text: string): Record<string, unknown> => {
  const parsed: unknown = JSON.parse(text)
  if (!isRecord(parsed)) {
    throw new Error("Expected JSON object")
  }
  return parsed
}

describe("built CLI smoke", () => {
  it("prints help repo and valid doctor json from dist binary", async () => {
    const build = await runProcess("npm", ["run", "build"])
    expect(build.code).toBe(0)

    const help = await runBuiltCli(["--help"])
    const repo = await runBuiltCli(["repo"])
    const doctor = await runBuiltCli(["doctor", "--json"])

    expect(help.code).toBe(0)
    expect(help.stdout).toContain("agent-log-digest")
    expect(help.stdout).toContain("agent-log-digest repo")
    expect(repo.code).toBe(0)
    expect(repo.stdout).toContain("https://github.com/mylee04/agent-log-digest")
    expect(doctor.code).toBe(0)
    expect(parseJsonObject(doctor.stdout)).toMatchObject({ ok: true })
    expect(doctor.stdout).not.toContain("star the repo")
  }, 30_000)

  it("preserves wrapped exit code in json while always-zero exits zero", async () => {
    const build = await runProcess("npm", ["run", "build"])
    expect(build.code).toBe(0)

    const result = await runBuiltCli([
      "--json",
      "--always-zero",
      "--",
      "node",
      "test/fixtures/commands/fail-tsc-like.mjs"
    ])

    const digest = parseJsonObject(result.stdout)
    expect(result.code).toBe(0)
    expect(digest).toMatchObject({
      status: "failed",
      exitCode: 2
    })
  }, 30_000)
})
