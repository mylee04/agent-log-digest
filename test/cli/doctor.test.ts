import { describe, expect, it } from "vitest"

import { createDoctorReport } from "../../src/cli/doctor.js"

describe("doctor", () => {
  it("reports node package manager and recommendations", async () => {
    const report = await createDoctorReport(process.cwd())

    expect(report.ok).toBe(true)
    expect(report.node).toContain("v")
    expect(report.recommendations).toContain("Use TypeScript --pretty false for stable parsing.")
  })
})
