import { normalizeFilePath } from "../core/pathUtils.js"
import type { Problem, ToolName } from "../core/types.js"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const asString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined

const asNumber = (value: unknown): number | undefined =>
  typeof value === "number" ? value : undefined

export const parseJestLikeJson = (log: string, tool: Extract<ToolName, "vitest" | "jest">): readonly Problem[] => {
  let parsed: unknown
  try {
    parsed = JSON.parse(log)
  } catch {
    return []
  }
  if (!isRecord(parsed)) return []
  const testResults = parsed["testResults"]
  if (!Array.isArray(testResults)) return []
  const problems: Problem[] = []
  for (const suite of testResults) {
    if (!isRecord(suite)) continue
    const file = asString(suite["name"])
    const assertionResults = suite["assertionResults"]
    if (file === undefined || !Array.isArray(assertionResults)) continue
    for (const assertion of assertionResults) {
      if (!isRecord(assertion) || assertion["status"] !== "failed") continue
      const failureMessages = assertion["failureMessages"]
      const firstMessage = Array.isArray(failureMessages) ? asString(failureMessages[0]) : undefined
      const location = assertion["location"]
      const line = isRecord(location) ? asNumber(location["line"]) : undefined
      const column = isRecord(location) ? asNumber(location["column"]) : undefined
      const testName = asString(assertion["fullName"]) ?? asString(assertion["title"])
      problems.push({
        id: "",
        severity: "fail",
        tool,
        file: normalizeFilePath(file),
        ...(line === undefined ? {} : { line }),
        ...(column === undefined ? {} : { column }),
        code: "test-failure",
        ...(testName === undefined ? {} : { testName }),
        message: firstMessage ?? "Test failed",
        confidence: 0.9
      })
    }
  }
  return problems
}

export const parseRawJestLike = (log: string, tool: Extract<ToolName, "vitest" | "jest">): readonly Problem[] => {
  const failMatch = /^FAIL\s+(?<file>\S+)/m.exec(log)
  if (failMatch?.groups === undefined) return []
  const file = failMatch.groups["file"]
  if (file === undefined) return []
  const testMatch = /^\s*(?:[\u25cf\u2715]|x)\s+(?<testName>.+)$/m.exec(log)
  const testName = testMatch?.groups?.["testName"]?.trim()
  return [{
    id: "",
    severity: "fail",
    tool,
    file: normalizeFilePath(file),
    code: "test-failure",
    ...(testName === undefined ? {} : { testName }),
    message: log.split("\n").find((line) => line.includes("Expected") || line.includes("expected")) ?? "Test failed",
    confidence: 0.65
  }]
}
