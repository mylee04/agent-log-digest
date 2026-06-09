import { access } from "node:fs/promises"
import { delimiter, join } from "node:path"
import process from "node:process"
import { spawn } from "node:child_process"

export interface RunWrappedCommandOptions {
  readonly cwd: string
  readonly maxLogBytes: number
  readonly stream: boolean
  readonly timeoutMs?: number
}

export interface RunWrappedCommandResult {
  readonly exitCode: number
  readonly signal: NodeJS.Signals | null
  readonly stdout: string
  readonly stderr: string
  readonly rawLog: string
  readonly durationMs: number
  readonly truncated: boolean
  readonly timedOut: boolean
}

const appendLimited = (
  current: string,
  next: string,
  maxBytes: number
): readonly [string, boolean] => {
  if (maxBytes <= 0) {
    return ["", next.length > 0]
  }
  const combined = `${current}${next}`
  if (Buffer.byteLength(combined) <= maxBytes) {
    return [combined, false]
  }
  return [combined.slice(0, maxBytes), true]
}

const pathCandidates = (command: string, pathValue: string): readonly string[] => {
  const pathEntries = pathValue.split(delimiter).filter(Boolean)
  if (process.platform !== "win32") {
    return pathEntries.map((entry) => join(entry, command))
  }
  const extensions = (process.env["PATHEXT"] ?? ".EXE;.CMD;.BAT")
    .split(";")
    .filter(Boolean)
  return pathEntries.flatMap((entry) => [
    join(entry, command),
    ...extensions.map((extension) => join(entry, `${command}${extension.toLowerCase()}`)),
    ...extensions.map((extension) => join(entry, `${command}${extension.toUpperCase()}`))
  ])
}

const resolveCommand = async (command: string): Promise<string> => {
  if (command.includes("/") || command.includes("\\")) {
    return command
  }
  const pathValue = process.env["PATH"] ?? ""
  for (const candidate of pathCandidates(command, pathValue)) {
    try {
      await access(candidate)
      return candidate
    } catch (error) {
      if (error instanceof Error) {
        continue
      }
      throw error
    }
  }
  return command
}

export const runWrappedCommand = async (
  commandArgs: readonly string[],
  options: RunWrappedCommandOptions
): Promise<RunWrappedCommandResult> => {
  const command = commandArgs[0]
  if (command === undefined) {
    return {
      exitCode: 2,
      signal: null,
      stdout: "",
      stderr: "Missing command after --",
      rawLog: "Missing command after --",
      durationMs: 0,
      truncated: false,
      timedOut: false
    }
  }

  const resolvedCommand = await resolveCommand(command)
  const args = commandArgs.slice(1)
  const startedAt = Date.now()

  return await new Promise((resolve) => {
    const child = spawn(resolvedCommand, args, {
      cwd: options.cwd,
      env: { ...process.env, FORCE_COLOR: "0", NO_COLOR: "1" },
      shell: false,
      stdio: ["pipe", "pipe", "pipe"]
    })

    let stdout = ""
    let stderr = ""
    let rawLog = ""
    let truncated = false
    let timedOut = false

    const onChunk = (target: "stdout" | "stderr", chunk: Buffer): void => {
      const text = chunk.toString()
      if (target === "stdout") {
        stdout += text
        if (options.stream) process.stdout.write(chunk)
      } else {
        stderr += text
        if (options.stream) process.stderr.write(chunk)
      }
      const limited = appendLimited(rawLog, text, options.maxLogBytes)
      rawLog = limited[0]
      truncated = truncated || limited[1]
    }

    child.stdout.on("data", (chunk: Buffer) => onChunk("stdout", chunk))
    child.stderr.on("data", (chunk: Buffer) => onChunk("stderr", chunk))

    if (!process.stdin.destroyed && child.stdin !== null) {
      process.stdin.pipe(child.stdin)
    }

    const forwardSignal = (signal: NodeJS.Signals): void => {
      child.kill(signal)
    }
    process.once("SIGINT", forwardSignal)
    process.once("SIGTERM", forwardSignal)

    const timeout = options.timeoutMs === undefined
      ? undefined
      : setTimeout(() => {
          timedOut = true
          child.kill("SIGTERM")
        }, options.timeoutMs)

    child.on("error", (error) => {
      if (timeout !== undefined) clearTimeout(timeout)
      process.removeListener("SIGINT", forwardSignal)
      process.removeListener("SIGTERM", forwardSignal)
      resolve({
        exitCode: 1,
        signal: null,
        stdout,
        stderr: `${stderr}${error.message}`,
        rawLog: `${rawLog}${error.message}`,
        durationMs: Date.now() - startedAt,
        truncated,
        timedOut
      })
    })

    child.on("close", (code, signal) => {
      if (timeout !== undefined) clearTimeout(timeout)
      process.removeListener("SIGINT", forwardSignal)
      process.removeListener("SIGTERM", forwardSignal)
      resolve({
        exitCode: code ?? (timedOut ? 124 : 1),
        signal,
        stdout,
        stderr,
        rawLog,
        durationMs: Date.now() - startedAt,
        truncated,
        timedOut
      })
    })
  })
}
