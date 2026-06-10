import type { ToolName } from "./types.js"

export const SUPPORTED_TOOLS = [
  "typescript",
  "eslint",
  "vitest",
  "jest",
  "next",
  "vite",
  "playwright",
  "generic"
] as const

export type SupportedTool = (typeof SUPPORTED_TOOLS)[number]

export const isSupportedTool = (tool: string): tool is SupportedTool =>
  SUPPORTED_TOOLS.some((candidate) => candidate === tool)

export const detectTools = (command: string, log: string): readonly ToolName[] => {
  const lowerCommand = command.toLowerCase()
  const tools = new Set<ToolName>()

  if (/\btsc\b/.test(lowerCommand) || /error TS\d+/.test(log)) {
    tools.add("typescript")
  }
  if (/\beslint\b/.test(lowerCommand) || /"ruleId"\s*:/.test(log) || /\s(no-[\w-]+|@[\w-]+\/[\w-]+)/.test(log)) {
    tools.add("eslint")
  }
  if (/\bvitest\b/.test(lowerCommand) || /vitest/i.test(log)) {
    tools.add("vitest")
  }
  if (/\bjest\b/.test(lowerCommand) || /jest/i.test(log)) {
    tools.add("jest")
  }
  if (/\bnext\b/.test(lowerCommand) || /Failed to compile\./.test(log)) {
    tools.add("next")
  }
  if (/\bvite\b/.test(lowerCommand) || /\[vite\]:/.test(log)) {
    tools.add("vite")
  }
  if (/\bplaywright\b/.test(lowerCommand) || /Running \d+ tests? using \d+ workers?/.test(log)) {
    tools.add("playwright")
  }
  if (tools.size === 0) {
    tools.add("generic")
  }

  return [...tools]
}
