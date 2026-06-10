import { normalizeFilePath } from "../core/pathUtils.js"
import type { Problem } from "../core/types.js"

const PLAYWRIGHT_FAILURE_RE =
  /^\s+\d+\)\s+(?<file>.+?):(?<line>\d+):(?<column>\d+)\s+›\s+(?<testName>.+)$/m
const PLAYWRIGHT_ERROR_RE = /^\s+Error:\s+(?<message>.+)$/m

export const parsePlaywright = (log: string): readonly Problem[] => {
  const match = PLAYWRIGHT_FAILURE_RE.exec(log)
  const groups = match?.groups
  if (groups === undefined) return []
  const file = groups["file"]
  const line = groups["line"]
  const column = groups["column"]
  const testName = groups["testName"]
  if (file === undefined || line === undefined || column === undefined || testName === undefined) return []
  const message = PLAYWRIGHT_ERROR_RE.exec(log)?.groups?.["message"]?.trim()

  return [{
    id: "",
    severity: "fail",
    tool: "playwright",
    file: normalizeFilePath(file),
    line: Number(line),
    column: Number(column),
    code: "test-failure",
    testName: testName.trim(),
    message: message ?? "Playwright test failed",
    confidence: 0.9
  }]
}
