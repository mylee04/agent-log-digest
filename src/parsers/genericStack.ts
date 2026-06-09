import { normalizeFilePath } from "../core/pathUtils.js"
import type { Problem, StackFrame } from "../core/types.js"

const STACK_FRAME_RE = /\(?((?:[A-Za-z]:)?[^()\s]+):(?<line>\d+):(?<column>\d+)\)?/g

export const parseGenericStack = (log: string): readonly Problem[] => {
  const frames: StackFrame[] = []
  for (const match of log.matchAll(STACK_FRAME_RE)) {
    const file = match[1]
    const line = match.groups?.["line"]
    const column = match.groups?.["column"]
    if (file === undefined || line === undefined || column === undefined) continue
    frames.push({
      file: normalizeFilePath(file),
      line: Number(line),
      column: Number(column)
    })
  }

  return frames.map((frame, index) => ({
    id: "",
    severity: "error",
    tool: "generic",
    file: frame.file,
    ...(frame.line === undefined ? {} : { line: frame.line }),
    ...(frame.column === undefined ? {} : { column: frame.column }),
    code: "stack-frame",
    message: `Stack frame at ${frame.file}:${frame.line ?? 0}:${frame.column ?? 0}`,
    stack: [frame],
    confidence: frame.file.includes("node_modules") ? 0.35 : 0.7 + Math.max(0, 0.1 - index * 0.01)
  }))
}
