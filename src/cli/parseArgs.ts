import { parseNode, resolveFormat, toBoolean, toSharedOptions } from "./sharedOptions.js"
import type { CliFormat, ParsedValues } from "./sharedOptions.js"

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

export type CliRepo = {
  readonly kind: "repo"
}

export type CliInit = {
  readonly kind: "init"
  readonly cwd: string
  readonly force: boolean
}

export type CliArgsResult =
  | CliHelp
  | CliVersion
  | CliRun
  | CliParse
  | CliDoctor
  | CliRepo
  | CliInit
  | CliUsageError

const buildUsageError = (message: string): CliUsageError => ({
  kind: "usage-error",
  message,
  exitCode: 2
})

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

const parseInitCommand = (
  values: ParsedValues,
  positionals: readonly string[]
): CliArgsResult => {
  if (positionals.length > 1) {
    return buildUsageError("init accepts no positional arguments")
  }
  return {
    kind: "init",
    cwd: toSharedOptions(values).cwd,
    force: toBoolean(values, "force")
  }
}

export const parseCliArgs = (argv: readonly string[]): CliArgsResult => {
  const separatorIndex = argv.indexOf("--")
  const preSeparator = separatorIndex === -1 ? argv : argv.slice(0, separatorIndex)
  const wrappedCommandArgs = separatorIndex === -1 ? [] : argv.slice(separatorIndex + 1)

  let rootParsed: ReturnType<typeof parseNode>
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

  if (command === "repo" || command === "support") {
    if (rootParsed.positionals.length > 1) {
      return buildUsageError(`${command} accepts no positional arguments`)
    }
    return { kind: "repo" }
  }

  if (command === "init") {
    return parseInitCommand(rootParsed.values, rootParsed.positionals)
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
