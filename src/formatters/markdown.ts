import type { AgentLogDigest, Problem } from "../core/types.js"

const problemLocation = (problem: Problem): string =>
  [problem.file, problem.line, problem.column].filter((part) => part !== undefined).join(":")

export const formatMarkdown = (digest: AgentLogDigest): string => {
  const problems = digest.problems.slice(0, 10).map((problem, index) => {
    const location = problemLocation(problem)
    return `${index + 1}. \`${location.length > 0 ? location : problem.tool}\`\n   - Message: \`${problem.message}\``
  })
  const groups = digest.groups.map((group) =>
    `- ${group.label}: ${group.count}`
  )
  const commands = digest.nextCommands.map((command) => `\`${command}\``)

  return [
    "# Agent Log Digest",
    "",
    `Status: ${digest.status}`,
    `Command: \`${digest.command}\``,
    `Detected tools: ${digest.detectedTools.join(", ")}`,
    "",
    "## Summary",
    "",
    digest.summary.headline,
    "",
    "## Top problems",
    "",
    problems.length > 0 ? problems.join("\n") : "None",
    "",
    "## Groups",
    "",
    groups.length > 0 ? groups.join("\n") : "None",
    "",
    "## Suggested next commands",
    "",
    commands.length > 0 ? commands.join("\n") : "None"
  ].join("\n")
}
