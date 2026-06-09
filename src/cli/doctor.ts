import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import process from "node:process"

export interface DoctorReport {
  readonly ok: boolean
  readonly node: string
  readonly packageManager: string
  readonly supportedCommands: Readonly<Record<string, string>>
  readonly recommendations: readonly string[]
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const detectPackageManager = (cwd: string): string => {
  if (existsSync(join(cwd, "pnpm-lock.yaml"))) return "pnpm"
  if (existsSync(join(cwd, "bun.lockb")) || existsSync(join(cwd, "bun.lock"))) return "bun"
  if (existsSync(join(cwd, "yarn.lock"))) return "yarn"
  if (existsSync(join(cwd, "package-lock.json"))) return "npm"
  return "unknown"
}

const readScripts = (cwd: string): Readonly<Record<string, string>> => {
  const packageJsonPath = join(cwd, "package.json")
  if (!existsSync(packageJsonPath)) return {}
  try {
    const parsed: unknown = JSON.parse(readFileSync(packageJsonPath, "utf8"))
    if (!isRecord(parsed)) return {}
    const record = parsed
    const scripts = record["scripts"]
    if (!isRecord(scripts)) return {}
    const scriptRecord = scripts
    const supported: Record<string, string> = {}
    for (const key of ["test", "lint", "typecheck", "build"]) {
      const value = scriptRecord[key]
      if (typeof value === "string") {
        supported[key] = value
      }
    }
    return supported
  } catch {
    return {}
  }
}

export const createDoctorReport = async (cwd: string): Promise<DoctorReport> => ({
  ok: true,
  node: process.version,
  packageManager: detectPackageManager(cwd),
  supportedCommands: readScripts(cwd),
  recommendations: [
    "Use TypeScript --pretty false for stable parsing.",
    "Use ESLint --format json for best results.",
    "Use Vitest --reporter=json or Jest --json for structured test output."
  ]
})
