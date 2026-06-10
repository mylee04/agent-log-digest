import { afterEach, describe, expect, it, vi } from "vitest"

import { runCli } from "../../src/cli.js"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

const captureStdout = async (argv: readonly string[]): Promise<string> => {
  let output = ""
  vi.spyOn(process.stdout, "write").mockImplementation((chunk: string | Uint8Array) => {
    output += chunk.toString()
    return true
  })

  await runCli(argv)

  return output
}

describe("command redaction", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("redacts secrets from digest command metadata", async () => {
    const secret = "sk-abcdefghijklmnopqrstuvwxyz"
    const output = await captureStdout([
      "--json",
      "--always-zero",
      "--",
      "node",
      "-e",
      `console.error("${secret}"); process.exit(1)`
    ])

    const digest: unknown = JSON.parse(output)
    if (!isRecord(digest) || typeof digest["command"] !== "string") {
      throw new Error("Expected JSON digest to include string command metadata")
    }

    expect(output).not.toContain(secret)
    expect(digest["command"]).toContain("sk-[REDACTED]")
  })
})
