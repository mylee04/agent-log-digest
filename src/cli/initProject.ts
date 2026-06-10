import { mkdir, stat, writeFile } from "node:fs/promises"
import { join } from "node:path"

export type InitProjectResult =
  | {
    readonly ok: true
    readonly files: readonly string[]
  }
  | {
    readonly ok: false
    readonly message: string
  }

const EXAMPLE_SCRIPT = `set -euo pipefail
AGENT_LOG_DIGEST_BIN="\${AGENT_LOG_DIGEST_BIN:-./node_modules/.bin/agent-log-digest}"
if [ ! -x "$AGENT_LOG_DIGEST_BIN" ]; then
  echo "agent-log-digest is not installed locally. Run npm install -D agent-log-digest first." >&2
  exit 2
fi
"$AGENT_LOG_DIGEST_BIN" --json --always-zero --output ./agent-log-digest.json -- npm test
`

const README = `# agent-log-digest local examples

These files are local-only examples for capturing test, lint, typecheck, and build logs.

Run:

\`\`\`bash
sh .agent-log-digest/example.ci.sh
\`\`\`
`

const hasErrorCode = (error: unknown): error is Error & { readonly code: unknown } =>
  error instanceof Error && "code" in error

const fileExists = async (path: string): Promise<boolean> => {
  try {
    await stat(path)
    return true
  } catch (error) {
    if (hasErrorCode(error) && error.code === "ENOENT") {
      return false
    }
    throw error
  }
}

export const initProject = async (
  cwd: string,
  force: boolean
): Promise<InitProjectResult> => {
  const dir = join(cwd, ".agent-log-digest")
  const exampleFile = join(dir, "example.ci.sh")
  const readmeFile = join(dir, "README.md")
  const files = [exampleFile, readmeFile]

  if (!force) {
    for (const file of files) {
      if (await fileExists(file)) {
        return {
          ok: false,
          message: `${file} already exists; rerun with --force to overwrite`
        }
      }
    }
  }

  await mkdir(dir, { recursive: true })
  await writeFile(exampleFile, EXAMPLE_SCRIPT)
  await writeFile(readmeFile, README)
  return {
    ok: true,
    files
  }
}
