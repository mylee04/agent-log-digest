import { access } from "node:fs/promises"
import { delimiter, join } from "node:path"
import { spawn } from "node:child_process"

export interface NotifyDigestInput {
  readonly headline: string
  readonly status: string
  readonly command: string
  readonly envPath?: string
}

export interface NotifyDigestResult {
  readonly delivered: boolean
  readonly command?: string
  readonly error?: string
}

const findExecutable = async (name: string, pathValue: string): Promise<string | undefined> => {
  for (const entry of pathValue.split(delimiter).filter(Boolean)) {
    const candidate = join(entry, name)
    try {
      await access(candidate)
      return candidate
    } catch (error) {
      if (error instanceof Error) continue
      throw error
    }
  }
  return undefined
}

const runNotify = async (command: string, message: string): Promise<NotifyDigestResult> =>
  await new Promise((resolve) => {
    const child = spawn(command, ["test", message], { shell: false, stdio: "ignore" })
    child.on("error", (error) => resolve({ delivered: false, command, error: error.message }))
    child.on("close", (code) => resolve({ delivered: code === 0, command }))
  })

export const notifyDigest = async (input: NotifyDigestInput): Promise<NotifyDigestResult> => {
  const pathValue = input.envPath ?? process.env["PATH"] ?? ""
  const command = await findExecutable("code-notify", pathValue) ?? await findExecutable("cn", pathValue)
  if (command === undefined) {
    return { delivered: false }
  }
  return await runNotify(command, `${input.status}: ${input.headline} (${input.command})`)
}
