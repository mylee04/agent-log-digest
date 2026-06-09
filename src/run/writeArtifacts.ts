import { mkdir, writeFile } from "node:fs/promises"
import { dirname } from "node:path"

import { redactSecrets } from "../core/redact.js"

export interface WriteArtifactsInput {
  readonly formatted: string
  readonly outputFile?: string
  readonly rawLog?: string
  readonly rawLogFile?: string
  readonly redact: boolean
}

const ensureParent = async (filePath: string): Promise<void> => {
  await mkdir(dirname(filePath), { recursive: true })
}

export const writeArtifacts = async (input: WriteArtifactsInput): Promise<void> => {
  if (input.outputFile !== undefined) {
    await ensureParent(input.outputFile)
    await writeFile(input.outputFile, input.formatted)
  }

  if (input.rawLogFile !== undefined && input.rawLog !== undefined) {
    await ensureParent(input.rawLogFile)
    const rawLog = input.redact ? redactSecrets(input.rawLog) : input.rawLog
    await writeFile(input.rawLogFile, rawLog)
  }
}
