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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const extractJsonArray = (text: string): string => {
  const prettyJsonStart = text.indexOf("[\n  {")
  if (prettyJsonStart >= 0) {
    return text.slice(prettyJsonStart)
  }
  const compactJsonStart = text.indexOf("[{")
  if (compactJsonStart >= 0) {
    return text.slice(compactJsonStart)
  }
  throw new Error("Expected npm pack JSON output")
}

const parsePackedFilePaths = (text: string): readonly string[] => {
  const parsed: unknown = JSON.parse(extractJsonArray(text))
  if (!Array.isArray(parsed) || !isRecord(parsed[0])) {
    throw new Error("Expected npm pack JSON array")
  }
  const rawFiles = parsed[0]["files"]
  if (!Array.isArray(rawFiles)) {
    throw new Error("Expected npm pack files array")
  }

  return rawFiles.flatMap((file) => {
    if (!isRecord(file)) return []
    const path = file["path"]
    return typeof path === "string" ? [path] : []
  })
}

describe("package contents", () => {
  it("packs intended runtime files and excludes development artifacts", async () => {
    const result = await runProcess("npm", ["pack", "--json", "--dry-run"])
    expect(result.code).toBe(0)

    const files = parsePackedFilePaths(result.stdout)
    expect(files).toEqual(expect.arrayContaining([
      "dist/cli.js",
      "dist/index.js",
      "dist/cli.d.ts",
      "dist/index.d.ts",
      "README.md",
      "README.ko.md",
      "LICENSE",
      "AGENTS.md",
      "package.json"
    ]))
    expect(files.some((file) =>
      file.startsWith("src/")
      || file.startsWith("test/")
      || file.startsWith(".omo/")
      || file.startsWith("plans/")
      || file.startsWith("evidence/")
    )).toBe(false)
  }, 30_000)
})
