import type { AgentLogDigest } from "../core/types.js"

export const formatJson = (digest: AgentLogDigest): string =>
  JSON.stringify(digest)
