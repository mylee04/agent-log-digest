import { parseArgs as parseNodeArgs } from "node:util"

export const CLI_FORMATS = ["json", "markdown", "pretty"] as const
export type CliFormat = (typeof CLI_FORMATS)[number]

export type CliHelp = {
  readonly kind: "help"
}

export type CliVersion = {
  readonly kind: "version"
}

export type CliUsageError = {
  readonly kind: "usage-error"
  readonly message: string
  readonly exitCode: 2
}

export type CliRun = {
  readonly kind: "run"
  readonly commandArgs: readonly string[]
  readonly format: CliFormat
  readonly alwaysZero: boolean
  readonly stream: boolean
  readonly redact: boolean
  readonly maxErrors: number
  readonly maxLogBytes: number
  readonly cwd: string
  readonly timeoutMs?: number
  readonly outputFile?: string
  readonly rawLogFile?: string
  readonly tool?: string
  readonly notify: boolean
}

export type CliParse = {
  readonly kind: "parse"
  readonly file: string
  readonly format: CliFormat
  readonly alwaysZero: boolean
  readonly stream: boolean
  readonly redact: boolean
  readonly maxErrors: number
  readonly maxLogBytes: number
  readonly cwd: string
  readonly timeoutMs?: number
  readonly outputFile?: string
  readonly rawLogFile?: string
  readonly tool?: string
  readonly notify: boolean
}

export type CliDoctor = {
  readonly kind: "doctor"
  readonly format: CliFormat
}

export type CliArgsResult =
  | CliHelp
  | CliVersion
  | CliRun
  | CliParse
  | CliDoctor
  | CliUsageError

type ParsedValues = Readonly<Record<string, string | boolean | undefined>>
type ParsedArgs = {
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
  help: { type: "boolean" },
  version: { type: "boolean" },
} satisfies Record<string, { readonly type: "boolean" | "string" }>

const parseNode = (argv: readonly string[]): ParsedArgs => {
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

const buildUsageError = (message: string): CliUsageError => ({
  kind: "usage-error",
  message,
  exitCode: 2
})

const toBoolean = (values: ParsedValues, key: string): boolean =>
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

const resolveFormat = (values: ParsedValues): CliFormat => {
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

const toSharedOptions = (values: ParsedValues) => {
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

const parseRunCommand = (values: ParsedValues, commandArgs: readonly string[]): CliRun => ({
  kind: "run",
  commandArgs,
  ...toSharedOptions(values)
})

const parseParseCommand = (values: ParsedValues, positionals: readonly string[]): CliArgsResult => {
  if (positionals.length !== 2) {
    return buildUsageError("parse requires exactly one log file path")
  }
  const file = positionals[1]
  if (file === undefined) {
    return buildUsageError("parse requires a valid file path")
  }
  return {
    kind: "parse",
    file,
    ...toSharedOptions(values)
  }
}

const parseDoctorCommand = (values: ParsedValues): CliDoctor => ({
  kind: "doctor",
  format: resolveFormat(values)
})

export const parseCliArgs = (argv: readonly string[]): CliArgsResult => {
  const separatorIndex = argv.indexOf("--")
  const preSeparator = separatorIndex === -1 ? argv : argv.slice(0, separatorIndex)
  const wrappedCommandArgs = separatorIndex === -1 ? [] : argv.slice(separatorIndex + 1)

  let rootParsed: ParsedArgs
  try {
    rootParsed = parseNode(preSeparator)
  } catch (error) {
    if (error instanceof Error) {
      return buildUsageError(error.message)
    }
    return buildUsageError("Invalid command-line arguments")
  }

  if (toBoolean(rootParsed.values, "help")) {
    return { kind: "help" }
  }
  if (toBoolean(rootParsed.values, "version")) {
    return { kind: "version" }
  }

  const command = rootParsed.positionals[0]
  if (command === "parse") {
    return parseParseCommand(rootParsed.values, rootParsed.positionals)
  }

  if (command === "doctor") {
    if (rootParsed.positionals.length > 1) {
      return buildUsageError("doctor accepts no positional arguments")
    }
    return parseDoctorCommand(rootParsed.values)
  }

  if (separatorIndex !== -1) {
    if (wrappedCommandArgs.length === 0) {
      return buildUsageError("-- requires a command, for example: -- node -e ...")
    }
    return parseRunCommand(rootParsed.values, wrappedCommandArgs)
  }

  if (command === undefined) {
    return { kind: "help" }
  }

  return buildUsageError("Missing -- before wrapped command")
}
