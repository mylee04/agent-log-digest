import { normalizeFilePath } from "../core/pathUtils.js"
import type { Problem } from "../core/types.js"

const VITE_FILE_RE = /^file:\s+(?<file>\S+):(?<line>\d+):(?<column>\d+)$/m
const VITE_ERROR_RE = /^Error:\s+(?<message>.+)$/m

export const parseVite = (log: string): readonly Problem[] => {
  const locationMatch = VITE_FILE_RE.exec(log)
  const groups = locationMatch?.groups
  if (groups === undefined) return []
  const file = groups["file"]
  const line = groups["line"]
  const column = groups["column"]
  if (file === undefined || line === undefined || column === undefined) return []
  const message = VITE_ERROR_RE.exec(log)?.groups?.["message"]?.trim()

  return [{
    id: "",
    severity: "error",
    tool: "vite",
    file: normalizeFilePath(file),
    line: Number(line),
    column: Number(column),
    code: "vite-build",
    message: message ?? "Vite build failed",
    confidence: 0.88
  }]
}
