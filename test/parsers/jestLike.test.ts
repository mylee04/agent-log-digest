import { describe, expect, it } from "vitest"

import { parseJest } from "../../src/parsers/jest.js"
import { parseVitest } from "../../src/parsers/vitest.js"

describe("jest-like parsers", () => {
  it("parses Vitest JSON reporter output", () => {
    const problems = parseVitest(JSON.stringify({
      numFailedTests: 1,
      testResults: [
        {
          name: "/repo/src/user.test.ts",
          assertionResults: [
            {
              fullName: "UserService returns user",
              status: "failed",
              failureMessages: ["expected 5 to be 4"],
              location: { line: 42, column: 15 }
            }
          ]
        }
      ]
    }))

    expect(problems[0]).toMatchObject({
      tool: "vitest",
      severity: "fail",
      file: "src/user.test.ts",
      line: 42,
      testName: "UserService returns user"
    })
  })

  it("parses Jest JSON output", () => {
    const problems = parseJest(JSON.stringify({
      numFailedTests: 1,
      testResults: [
        {
          name: "/repo/src/user.test.ts",
          assertionResults: [
            {
              fullName: "UserService returns user",
              status: "failed",
              failureMessages: ["Expected: 123\nReceived: 456"]
            }
          ]
        }
      ]
    }))

    expect(problems[0]).toMatchObject({
      tool: "jest",
      code: "test-failure",
      testName: "UserService returns user"
    })
  })
})
