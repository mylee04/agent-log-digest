import type { Problem } from "../core/types.js"

const TSC_ERROR_RE =
  /^(?<file>.+?)\((?<line>\d+),(?<column>\d+)\): error (?<code>TS\d+): (?<message>.+)$/gm

export const parseTypeScript = (log: string): readonly Problem[] => {
  const problems: Problem[] = []
  for (const match of log.matchAll(TSC_ERROR_RE)) {
    const groups = match.groups
    if (groups === undefined) continue
    const file = groups["file"]
    const line = groups["line"]
    const column = groups["column"]
    const code = groups["code"]
    const message = groups["message"]
    if (file === undefined || line === undefined || column === undefined || code === undefined || message === undefined) {
      continue
    }
    problems.push({
      id: "",
      severity: "error",
      tool: "typescript",
      file,
      line: Number(line),
      column: Number(column),
      code,
      message: message.trim(),
      confidence: 0.98
    })
  }
  return problems
}
