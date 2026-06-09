export const SCHEMA_VERSION = "0.1" as const

export type DigestStatus = "passed" | "failed" | "unknown"

export type ToolName =
  | "typescript"
  | "eslint"
  | "vitest"
  | "jest"
  | "next"
  | "vite"
  | "playwright"
  | "generic"
  | "unknown"

export interface StackFrame {
  readonly file: string
  readonly line?: number
  readonly column?: number
  readonly functionName?: string
}

export interface Problem {
  readonly id: string
  readonly severity: "error" | "warning" | "fail" | "info"
  readonly tool: ToolName
  readonly file?: string
  readonly line?: number
  readonly column?: number
  readonly code?: string
  readonly testName?: string
  readonly message: string
  readonly snippet?: string
  readonly stack?: readonly StackFrame[]
  readonly confidence: number
}

export interface ProblemGroup {
  readonly key: string
  readonly label: string
  readonly count: number
  readonly firstProblemId: string
}

export interface DigestSummary {
  readonly headline: string
  readonly errors: number
  readonly warnings: number
  readonly failedTests: number
  readonly passedTests?: number
  readonly filesWithProblems: number
}

export interface DigestArtifacts {
  readonly rawLog?: string
  readonly json?: string
  readonly markdown?: string
}

export interface DigestMeta {
  readonly generatedAt: string
  readonly packageName: string
  readonly packageVersion: string
  readonly truncated: boolean
  readonly redacted: boolean
  readonly timedOut?: boolean
}

export type AgentLogDigest = {
  readonly schemaVersion: "0.1"
  readonly status: DigestStatus
  readonly exitCode: number | null
  readonly command: string
  readonly cwd: string
  readonly durationMs: number
  readonly detectedTools: readonly ToolName[]
  readonly summary: DigestSummary
  readonly problems: readonly Problem[]
  readonly groups: readonly ProblemGroup[]
  readonly nextCommands: readonly string[]
  readonly artifacts: DigestArtifacts
  readonly meta: DigestMeta
}
