import process from "node:process"
import { parseArgs as parseNodeArgs } from "node:util"

export const CLI_FORMATS = ["json", "markdown", "pretty"] as const
export type CliFormat = (typeof CLI_FORMATS)[number]

export type ParsedValues = Readonly<Record<string, string | boolean | undefined>>
export type ParsedArgs = {
  readonly values: ParsedValues
  readonly positionals: readonly string[]
}

const DEFAULT_MAX_ERRORS = 100
const DEFAULT_MAX_LOG_BYTES = 1_000_000

const CLI_OPTIONS = {
  json: { type: "boolean" },
  markdown: { type: "boolean" },
  pretty: { type: "boolean" },
  output: { type: "string" },
  "raw-log": { type: "string" },
  "no-raw-log": { type: "boolean" },
  "max-errors": { type: "string" },
  "max-log-bytes": { type: "string" },
  cwd: { type: "string" },
  timeout: { type: "string" },
  "always-zero": { type: "boolean" },
  "no-stream": { type: "boolean" },
  notify: { type: "boolean" },
  redact: { type: "boolean" },
  "no-redact": { type: "boolean" },
  tool: { type: "string" },
  force: { type: "boolean" },
  help: { type: "boolean" },
  version: { type: "boolean" },
} satisfies Record<string, { readonly type: "boolean" | "string" }>

export const parseNode = (argv: readonly string[]): ParsedArgs => {
  const parsed = parseNodeArgs({
    args: [...argv],
    options: CLI_OPTIONS,
    allowPositionals: true
  })
  return {
    values: parsed.values,
    positionals: parsed.positionals
  }
}

export const toBoolean = (values: ParsedValues, key: string): boolean =>
  values[key] === true

const toString = (values: ParsedValues, key: string): string | undefined => {
  const value = values[key]
  if (typeof value === "string") {
    return value
  }
  return undefined
}

const parsePositiveInteger = (text: string, label: string): number => {
  const value = Number.parseInt(text, 10)
  if (!Number.isInteger(value) || !Number.isSafeInteger(value) || value < 0 || String(value) !== text) {
    throw new Error(`Invalid value for --${label}: ${text}`)
  }
  return value
}

export const resolveFormat = (values: ParsedValues): CliFormat => {
  if (toBoolean(values, "markdown")) {
    return "markdown"
  }
  if (toBoolean(values, "json")) {
    return "json"
  }
  return "pretty"
}

const resolveStream = (values: ParsedValues, format: CliFormat): boolean => {
  if (toBoolean(values, "no-stream")) {
    return false
  }
  return format === "pretty"
}

const resolveRedact = (values: ParsedValues): boolean => {
  if (toBoolean(values, "no-redact")) {
    return false
  }
  return true
}

const resolveRawLogFile = (values: ParsedValues): string | undefined => {
  if (toBoolean(values, "no-raw-log")) {
    return undefined
  }
  return toString(values, "raw-log")
}

const resolveNumber = (
  values: ParsedValues,
  key: string,
  fallback: number
): number => {
  const raw = toString(values, key)
  if (raw === undefined) {
    return fallback
  }
  return parsePositiveInteger(raw, key)
}

export const toSharedOptions = (values: ParsedValues) => {
  const format = resolveFormat(values)
  const rawTimeout = toString(values, "timeout")
  const timeoutMs = rawTimeout === undefined ? undefined : parsePositiveInteger(rawTimeout, "timeout")
  const outputFile = toString(values, "output")
  const rawLogFile = resolveRawLogFile(values)
  const tool = toString(values, "tool")
  return {
    format,
    stream: resolveStream(values, format),
    redact: resolveRedact(values),
    maxErrors: resolveNumber(values, "max-errors", DEFAULT_MAX_ERRORS),
    maxLogBytes: resolveNumber(values, "max-log-bytes", DEFAULT_MAX_LOG_BYTES),
    cwd: toString(values, "cwd") ?? process.cwd(),
    alwaysZero: toBoolean(values, "always-zero"),
    notify: toBoolean(values, "notify"),
    ...(timeoutMs === undefined ? {} : { timeoutMs }),
    ...(outputFile === undefined ? {} : { outputFile }),
    ...(rawLogFile === undefined ? {} : { rawLogFile }),
    ...(tool === undefined ? {} : { tool })
  } as const
}
