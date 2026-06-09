import type { Problem } from "./types.js"

const severityScore = (problem: Problem): number => {
  switch (problem.severity) {
    case "error":
      return 100
    case "fail":
      return 90
    case "warning":
      return 40
    case "info":
      return 10
  }
}

export const scoreProblem = (problem: Problem): number => {
  let score = severityScore(problem)
  if (problem.file !== undefined) score += 30
  if (problem.line !== undefined) score += 20
  if (problem.column !== undefined) score += 10
  if (problem.code !== undefined) score += 10
  if (problem.file?.includes("node_modules")) score -= 80
  if (problem.file?.includes("dist/")) score -= 40
  if (problem.file?.includes("coverage/")) score -= 40
  score += problem.confidence
  return score
}

export const rankProblems = (problems: readonly Problem[]): readonly Problem[] =>
  [...problems].sort((left, right) => scoreProblem(right) - scoreProblem(left))
