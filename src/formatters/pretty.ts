import type { AgentLogDigest } from "../core/types.js"

export const formatPretty = (digest: AgentLogDigest): string => {
  const firstProblem = digest.problems[0]
  const nextCommand = digest.nextCommands[0]
  const firstLine = firstProblem === undefined
    ? ""
    : `\nFirst problem: ${firstProblem.file ?? firstProblem.tool} ${firstProblem.message}`
  const nextLine = nextCommand === undefined ? "" : `\nNext: ${nextCommand}`
  return `${digest.status}: ${digest.summary.headline}${firstLine}${nextLine}\n`
}
