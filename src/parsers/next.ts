import { normalizeFilePath } from "../core/pathUtils.js"
import type { Problem } from "../core/types.js"

const NEXT_LOCATION_RE = /^(?<file>\.?\/?\S+):(?<line>\d+):(?<column>\d+)$/m
const ERROR_PREFIX_RE = /^(?:Type |Build |Syntax )?error:\s*/i

const normalizeNextFile = (file: string): string =>
  normalizeFilePath(file.replace(/^\.\//, ""))

const messageAfter = (log: string, offset: number): string | undefined =>
  log.slice(offset)
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0)

export const parseNext = (log: string): readonly Problem[] => {
  const match = NEXT_LOCATION_RE.exec(log)
  const groups = match?.groups
  if (match === null || groups === undefined) return []
  const file = groups["file"]
  const line = groups["line"]
  const column = groups["column"]
  if (file === undefined || line === undefined || column === undefined) return []
  const rawMessage = messageAfter(log, match.index + match[0].length)
  if (rawMessage === undefined) return []

  return [{
    id: "",
    severity: "error",
    tool: "next",
    file: normalizeNextFile(file),
    line: Number(line),
    column: Number(column),
    code: "next-build",
    message: rawMessage.replace(ERROR_PREFIX_RE, "").trim(),
    confidence: 0.9
  }]
}
