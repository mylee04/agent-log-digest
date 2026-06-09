const ASSIGNMENT_SECRET_RE =
  /\b([A-Z][A-Z0-9_]*(?:API_KEY|TOKEN|SECRET|PASSWORD))=([^\s]+)/g

const BEARER_RE = /\bBearer\s+[A-Za-z0-9._-]+/g
const OPENAI_KEY_RE = /\bsk-[A-Za-z0-9_-]{20,}\b/g
const GITHUB_TOKEN_RE = /\bghp_[A-Za-z0-9_]{20,}\b/g

export const redactSecrets = (input: string): string =>
  input
    .replace(ASSIGNMENT_SECRET_RE, "$1=[REDACTED]")
    .replace(BEARER_RE, "Bearer [REDACTED]")
    .replace(OPENAI_KEY_RE, "sk-[REDACTED]")
    .replace(GITHUB_TOKEN_RE, "ghp_[REDACTED]")
