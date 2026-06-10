import { SCHEMA_VERSION, type AgentLogDigest, type Problem, type ProblemGroup } from "./types.js"
import { detectTools, isSupportedTool } from "./detectTool.js"
import { parseProblems } from "../parsers/index.js"
import { rankProblems } from "./rankProblems.js"
import { summarizeProblems } from "./summarize.js"

export interface CreateDigestInput {
  readonly command: string
  readonly cwd: string
  readonly exitCode: number | null
  readonly durationMs: number
  readonly log: string
  readonly maxErrors: number
  readonly truncated: boolean
  readonly redacted: boolean
  readonly forcedTool?: string
  readonly timedOut?: boolean
  readonly artifacts?: {
    readonly rawLog?: string
    readonly json?: string
    readonly markdown?: string
  }
}

const problemKey = (problem: Problem): string =>
  [problem.tool, problem.file ?? "", problem.line ?? "", problem.column ?? "", problem.code ?? "", problem.message].join("|")

const withIds = (problems: readonly Problem[], maxErrors: number): readonly Problem[] => {
  const seen = new Set<string>()
  const deduped: Problem[] = []
  for (const problem of rankProblems(problems)) {
    const key = problemKey(problem)
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push({
      ...problem,
      id: `p${deduped.length + 1}`
    })
    if (deduped.length >= maxErrors) break
  }
  return deduped
}

const groupProblems = (problems: readonly Problem[]): readonly ProblemGroup[] => {
  const groups = new Map<string, ProblemGroup>()
  for (const problem of problems) {
    const key = `${problem.tool}:${problem.code ?? problem.severity}`
    const label = problem.testName === undefined
      ? `${problem.tool} ${problem.code ?? problem.severity}`
      : `${problem.tool} ${problem.testName}`
    const existing = groups.get(key)
    if (existing === undefined) {
      groups.set(key, {
        key,
        label,
        count: 1,
        firstProblemId: problem.id
      })
    } else {
      groups.set(key, {
        ...existing,
        count: existing.count + 1
      })
    }
  }
  return [...groups.values()]
}

const commandIncludesExecutable = (command: string, executable: string): boolean =>
  command.split(/\s+/).some((part) => part === executable || part.endsWith(`/${executable}`))

const nextCommands = (command: string, problems: readonly Problem[]): readonly string[] => {
  const first = problems[0]
  if (first?.tool === "typescript") {
    return [command.includes("tsc") ? command : "pnpm tsc --noEmit --pretty false"]
  }
  if (first?.tool === "eslint" && first.file !== undefined) {
    return [`eslint ${first.file} --format json`]
  }
  if ((first?.tool === "vitest" || first?.tool === "jest") && first.file !== undefined) {
    return [`pnpm test ${first.file}`]
  }
  if (first?.tool === "next") {
    return [commandIncludesExecutable(command, "next") ? command : "next build"]
  }
  if (first?.tool === "vite") {
    return [commandIncludesExecutable(command, "vite") ? command : "vite build"]
  }
  if (first?.tool === "playwright" && first.file !== undefined) {
    return [`playwright test ${first.file}`]
  }
  return command.length > 0 ? [command] : []
}

const statusFor = (exitCode: number | null, problems: readonly Problem[]): "passed" | "failed" | "unknown" => {
  if (problems.length > 0) return "failed"
  if (exitCode === null) return "unknown"
  return exitCode === 0 ? "passed" : "failed"
}

export const createDigest = (input: CreateDigestInput): AgentLogDigest => {
  const detectedTools = input.forcedTool !== undefined && isSupportedTool(input.forcedTool)
    ? [input.forcedTool]
    : detectTools(input.command, input.log)
  const parseInput = {
    command: input.command,
    log: input.log,
    ...(input.forcedTool === undefined ? {} : { forcedTool: input.forcedTool })
  }
  const problems = withIds(parseProblems(parseInput), input.maxErrors)
  return {
    schemaVersion: SCHEMA_VERSION,
    status: statusFor(input.exitCode, problems),
    exitCode: input.exitCode,
    command: input.command,
    cwd: input.cwd,
    durationMs: input.durationMs,
    detectedTools,
    summary: summarizeProblems(problems),
    problems,
    groups: groupProblems(problems),
    nextCommands: nextCommands(input.command, problems),
    artifacts: input.artifacts ?? {},
    meta: {
      generatedAt: new Date().toISOString(),
      packageName: "agent-log-digest",
      packageVersion: "0.1.2",
      truncated: input.truncated,
      redacted: input.redacted,
      ...(input.timedOut === undefined ? {} : { timedOut: input.timedOut })
    }
  }
}
