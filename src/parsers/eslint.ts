import { normalizeFilePath } from "../core/pathUtils.js"
import type { Problem } from "../core/types.js"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const asString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined

const asNumber = (value: unknown): number | undefined =>
  typeof value === "number" ? value : undefined

const parseJson = (log: string): readonly Problem[] => {
  let parsed: unknown
  try {
    parsed = JSON.parse(log)
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []
  const problems: Problem[] = []
  for (const result of parsed) {
    if (!isRecord(result)) continue
    const filePath = asString(result["filePath"])
    const messages = result["messages"]
    if (filePath === undefined || !Array.isArray(messages)) continue
    for (const message of messages) {
      if (!isRecord(message)) continue
      const text = asString(message["message"])
      if (text === undefined) continue
      const severity = asNumber(message["severity"]) === 2 ? "error" : "warning"
      const line = asNumber(message["line"])
      const column = asNumber(message["column"])
      problems.push({
        id: "",
        severity,
        tool: "eslint",
        file: normalizeFilePath(filePath),
        ...(line === undefined ? {} : { line }),
        ...(column === undefined ? {} : { column }),
        code: asString(message["ruleId"]) ?? "eslint",
        message: text,
        confidence: 0.95
      })
    }
  }
  return problems
}

const STYLISH_RE =
  /^(?<file>\/?[^\n]+)\n\s+(?<line>\d+):(?<column>\d+)\s+(?<severity>error|warning)\s+(?<message>.+?)\s+(?<code>[\w@/-]+)$/gm

const parseStylish = (log: string): readonly Problem[] => {
  const problems: Problem[] = []
  for (const match of log.matchAll(STYLISH_RE)) {
    const groups = match.groups
    if (groups === undefined) continue
    const file = groups["file"]
    const line = groups["line"]
    const column = groups["column"]
    const severity = groups["severity"]
    const message = groups["message"]
    const code = groups["code"]
    if (file === undefined || line === undefined || column === undefined || message === undefined || code === undefined) continue
    problems.push({
      id: "",
      severity: severity === "warning" ? "warning" : "error",
      tool: "eslint",
      file: normalizeFilePath(file),
      line: Number(line),
      column: Number(column),
      code,
      message: message.trim(),
      confidence: 0.75
    })
  }
  return problems
}

export const parseESLint = (log: string): readonly Problem[] => {
  const jsonProblems = parseJson(log)
  if (jsonProblems.length > 0) return jsonProblems
  return parseStylish(log)
}
