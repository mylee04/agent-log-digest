import type { DigestSummary, Problem } from "./types.js"

const toolLabel = (tool: string): string =>
  ({
    typescript: "TypeScript",
    eslint: "ESLint",
    vitest: "Vitest",
    jest: "Jest",
    generic: "Log"
  })[tool] ?? (tool.length === 0 ? "Log" : `${tool[0]?.toUpperCase() ?? ""}${tool.slice(1)}`)

export const summarizeProblems = (problems: readonly Problem[]): DigestSummary => {
  const errors = problems.filter((problem) => problem.severity === "error").length
  const warnings = problems.filter((problem) => problem.severity === "warning").length
  const failedTests = problems.filter((problem) => problem.severity === "fail").length
  const files = new Set(problems.map((problem) => problem.file).filter((file) => file !== undefined))
  const firstTool = problems[0]?.tool ?? "generic"

  if (problems.length === 0) {
    return {
      headline: "No problems detected.",
      errors: 0,
      warnings: 0,
      failedTests: 0,
      filesWithProblems: 0
    }
  }

  const issueCount = errors + failedTests
  const issueLabel = issueCount === 1 ? "error" : "errors"
  const fileLabel = files.size === 1 ? "file" : "files"

  return {
    headline: `${toolLabel(firstTool)} failed with ${issueCount} ${issueLabel} in ${files.size} ${fileLabel}.`,
    errors,
    warnings,
    failedTests,
    filesWithProblems: files.size
  }
}
