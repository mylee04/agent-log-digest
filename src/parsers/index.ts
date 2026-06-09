import { detectTools, isSupportedTool } from "../core/detectTool.js"
import type { Problem, ToolName } from "../core/types.js"
import { parseESLint } from "./eslint.js"
import { parseGenericStack } from "./genericStack.js"
import { parseJest } from "./jest.js"
import { parseTypeScript } from "./typescript.js"
import { parseVitest } from "./vitest.js"

export interface ParseProblemsInput {
  readonly command: string
  readonly log: string
  readonly forcedTool?: string
}

const parseByTool = (tool: ToolName, log: string): readonly Problem[] => {
  switch (tool) {
    case "typescript":
      return parseTypeScript(log)
    case "eslint":
      return parseESLint(log)
    case "vitest":
      return parseVitest(log)
    case "jest":
      return parseJest(log)
    case "generic":
      return parseGenericStack(log)
    case "next":
    case "vite":
    case "playwright":
    case "unknown":
      return []
  }
}

export const parseProblems = (input: ParseProblemsInput): readonly Problem[] => {
  if (input.forcedTool !== undefined && isSupportedTool(input.forcedTool)) {
    return parseByTool(input.forcedTool, input.log)
  }
  const detected = detectTools(input.command, input.log)
  const problems: Problem[] = []
  for (const tool of detected) {
    problems.push(...parseByTool(tool, input.log))
  }
  if (problems.length === 0) {
    problems.push(...parseGenericStack(input.log))
  }
  return problems
}
