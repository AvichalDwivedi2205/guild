const SECRET_ASSIGNMENT_PATTERN =
  /\b(OPENAI_API_KEY|ANTHROPIC_API_KEY|WORKOS_API_KEY|WORKOS_COOKIE_PASSWORD|GUILD_RUNNER_TOKEN|CODEX_ACCESS_TOKEN)\s*[:=]\s*(["']?)[^\s,"'}]+\2/gi;
const JSON_SECRET_PATTERN =
  /(["'](?:access[_-]?token|refresh[_-]?token|assignment[_-]?token|runner[_-]?token|authorization|api[_-]?key)["']\s*:\s*["'])[^"']+(["'])/gi;
const BEARER_PATTERN = /\bBearer\s+[A-Za-z0-9._~+\/-]{16,}={0,2}/gi;
const API_KEY_PATTERN = /\b(?:sk|sk-ant|sess|oauth)[-_][A-Za-z0-9_-]{16,}\b/g;
const JWT_PATTERN = /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g;

function escapedPattern(value: string): RegExp {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
}

export function redactText(value: string, knownSecrets: readonly string[] = []): string {
  let redacted = value;
  for (const secret of knownSecrets) {
    if (secret.length >= 8) {
      redacted = redacted.replace(escapedPattern(secret), '[REDACTED]');
    }
  }
  return redacted
    .replace(SECRET_ASSIGNMENT_PATTERN, '$1=[REDACTED]')
    .replace(JSON_SECRET_PATTERN, '$1[REDACTED]$2')
    .replace(BEARER_PATTERN, 'Bearer [REDACTED]')
    .replace(API_KEY_PATTERN, '[REDACTED]')
    .replace(JWT_PATTERN, '[REDACTED]');
}

export function safeStatusMessage(
  value: string,
  knownSecrets: readonly string[] = [],
  maxLength = 2_000,
): string {
  const compact = redactText(value, knownSecrets)
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, Math.max(0, maxLength - 1))}…`;
}

export function errorMessage(error: unknown, knownSecrets: readonly string[] = []): string {
  return safeStatusMessage(
    error instanceof Error ? error.message : String(error),
    knownSecrets,
    1_000,
  );
}
