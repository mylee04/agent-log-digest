import { describe, expect, it } from "vitest"

import { CLI_HELP, runCli } from "../src/cli.js"

describe("infrastructure", () => {
  it("prints placeholder help", async () => {
    await expect(runCli([])).resolves.toBe(0)
    expect(CLI_HELP).toContain("agent-log-digest")
  })
})
