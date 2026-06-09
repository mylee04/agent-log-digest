import { describe, expect, it } from "vitest"

import { parseCliArgs } from "../../src/cli/parseArgs.js"

describe("parseCliArgs", () => {
  it("returns usage error when -- appears with no wrapped command", () => {
    const result = parseCliArgs(["--json", "--"])

    if (result.kind !== "usage-error") {
      throw new Error("Expected usage error")
    }

    expect(result.exitCode).toBe(2)
    expect(result.message).toContain("requires a command")
  })

  it("separates run command options from wrapped command args", () => {
    const result = parseCliArgs([
      "--json",
      "--always-zero",
      "--",
      "node",
      "-e",
      "console.error('src/a.ts(1,2): error TS2322: bad')"
    ])

    if (result.kind !== "run") {
      throw new Error("Expected run command args")
    }

    expect(result).toMatchObject({
      kind: "run",
      format: "json",
      alwaysZero: true,
      stream: false,
      commandArgs: [
        "node",
        "-e",
        "console.error('src/a.ts(1,2): error TS2322: bad')"
      ]
    })
  })

  it("defaults parse command output to pretty and streaming", () => {
    const result = parseCliArgs(["parse", "test.log"])

    if (result.kind !== "parse") {
      throw new Error("Expected parse command")
    }

    expect(result).toMatchObject({
      file: "test.log",
      format: "pretty",
      stream: true,
      redact: true,
      maxErrors: 100,
      maxLogBytes: 1000000
    })
  })

  it("parses parse command options", () => {
    const result = parseCliArgs([
      "parse",
      "test.log",
      "--json",
      "--max-errors",
      "42",
      "--tool",
      "eslint",
      "--notify"
    ])

    if (result.kind !== "parse") {
      throw new Error("Expected parse command")
    }

    expect(result).toMatchObject({
      format: "json",
      stream: false,
      maxErrors: 42,
      tool: "eslint",
      notify: true
    })
  })

  it("returns help when no args are provided", () => {
    const result = parseCliArgs([])

    if (result.kind !== "help") {
      throw new Error("Expected help command")
    }
  })

  it("returns version command when --version is provided", () => {
    const result = parseCliArgs(["--version"])

    if (result.kind !== "version") {
      throw new Error("Expected version command")
    }
  })

  it("returns doctor command and supports format overrides", () => {
    const result = parseCliArgs(["doctor", "--markdown"])

    if (result.kind !== "doctor") {
      throw new Error("Expected doctor command")
    }

    expect(result.format).toBe("markdown")
  })
})
