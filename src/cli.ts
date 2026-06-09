#!/usr/bin/env node

import { pathToFileURL } from "node:url"
import process from "node:process"
import { readFile } from "node:fs/promises"

import { parseCliArgs } from "./cli/parseArgs.js"
import { createDoctorReport } from "./cli/doctor.js"
import { createDigest } from "./core/createDigest.js"
import { redactSecrets } from "./core/redact.js"
import { formatJson } from "./formatters/json.js"
import { formatMarkdown } from "./formatters/markdown.js"
import { formatPretty } from "./formatters/pretty.js"
import { notifyDigest } from "./integrations/codeNotify.js"
import { runWrappedCommand } from "./run/runWrappedCommand.js"
import { writeArtifacts } from "./run/writeArtifacts.js"
import type { AgentLogDigest } from "./core/types.js"

export const CLI_HELP = `agent-log-digest

Usage:
  agent-log-digest [options] -- <command...>
  agent-log-digest parse <file> [options]
  agent-log-digest doctor
`
const CLI_VERSION = "0.1.0"

const formatPrettyDoctor = (report: Awaited<ReturnType<typeof createDoctorReport>>): string =>
  [
    `ok: ${report.ok}`,
    `node: ${report.node}`,
    `packageManager: ${report.packageManager}`,
    `recommendations: ${report.recommendations.join("; ")}`
  ].join("\n")

const formatDigest = (digest: AgentLogDigest, format: "json" | "markdown" | "pretty"): string => {
  switch (format) {
    case "json":
      return formatJson(digest)
    case "markdown":
      return formatMarkdown(digest)
    case "pretty":
      return formatPretty(digest)
  }
}

const notifyIfRequested = async (
  requested: boolean,
  digest: AgentLogDigest
): Promise<void> => {
  if (!requested) return
  await notifyDigest({
    headline: digest.summary.headline,
    status: digest.status,
    command: digest.command
  })
}

export const runCli = async (argv: readonly string[]): Promise<number> => {
  const parsed = parseCliArgs(argv)

  if (parsed.kind === "help") {
    process.stdout.write(`${CLI_HELP}\n`)
    return 0
  }
  if (parsed.kind === "version") {
    process.stdout.write(`${CLI_VERSION}\n`)
    return 0
  }
  if (parsed.kind === "usage-error") {
    process.stderr.write(`${parsed.message}\n`)
    return parsed.exitCode
  }

  if (parsed.kind === "doctor") {
    const report = await createDoctorReport(process.cwd())
    process.stdout.write(parsed.format === "json" ? `${JSON.stringify(report)}\n` : `${formatPrettyDoctor(report)}\n`)
    return 0
  }

  if (parsed.kind === "parse") {
    let rawLog: string
    try {
      rawLog = await readFile(parsed.file, "utf8")
    } catch (error) {
      process.stderr.write(`${error instanceof Error ? error.message : "Unable to read log file"}\n`)
      return 2
    }
    const log = parsed.redact ? redactSecrets(rawLog) : rawLog
    const digest = createDigest({
      command: `parse ${parsed.file}`,
      cwd: parsed.cwd,
      exitCode: null,
      durationMs: 0,
      log,
      maxErrors: parsed.maxErrors,
      truncated: false,
      redacted: parsed.redact,
      ...(parsed.tool === undefined ? {} : { forcedTool: parsed.tool }),
      artifacts: {
        ...(parsed.rawLogFile === undefined ? {} : { rawLog: parsed.rawLogFile }),
        ...(parsed.outputFile === undefined ? {} : { json: parsed.outputFile })
      }
    })
    const formatted = formatDigest(digest, parsed.format)
    await writeArtifacts({
      formatted,
      rawLog: log,
      redact: false,
      ...(parsed.outputFile === undefined ? {} : { outputFile: parsed.outputFile }),
      ...(parsed.rawLogFile === undefined ? {} : { rawLogFile: parsed.rawLogFile })
    })
    await notifyIfRequested(parsed.notify, digest)
    process.stdout.write(`${formatted}\n`)
    return 0
  }

  const runResult = await runWrappedCommand(parsed.commandArgs, {
    cwd: parsed.cwd,
    maxLogBytes: parsed.maxLogBytes,
    stream: parsed.stream,
    ...(parsed.timeoutMs === undefined ? {} : { timeoutMs: parsed.timeoutMs })
  })
  const log = parsed.redact ? redactSecrets(runResult.rawLog) : runResult.rawLog
  const digest = createDigest({
    command: parsed.commandArgs.join(" "),
    cwd: parsed.cwd,
    exitCode: runResult.exitCode,
    durationMs: runResult.durationMs,
    log,
    maxErrors: parsed.maxErrors,
    truncated: runResult.truncated,
    redacted: parsed.redact,
    ...(parsed.tool === undefined ? {} : { forcedTool: parsed.tool }),
    timedOut: runResult.timedOut,
    artifacts: {
      ...(parsed.rawLogFile === undefined ? {} : { rawLog: parsed.rawLogFile }),
      ...(parsed.outputFile === undefined ? {} : { json: parsed.outputFile })
    }
  })
  const formatted = formatDigest(digest, parsed.format)
  await writeArtifacts({
    formatted,
    rawLog: log,
    redact: false,
    ...(parsed.outputFile === undefined ? {} : { outputFile: parsed.outputFile }),
    ...(parsed.rawLogFile === undefined ? {} : { rawLogFile: parsed.rawLogFile })
  })
  await notifyIfRequested(parsed.notify, digest)
  process.stdout.write(`${formatted}\n`)
  return parsed.alwaysZero ? 0 : runResult.exitCode
}

const isEntrypoint = import.meta.url === pathToFileURL(process.argv[1] ?? "").href
if (isEntrypoint) {
  try {
    process.exitCode = await runCli(process.argv.slice(2))
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : "Internal error"}\n`)
    process.exitCode = 1
  }
}
