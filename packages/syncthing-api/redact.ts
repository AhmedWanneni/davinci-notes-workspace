/**
 * Redacts a secret/API key string so it is never exposed in logs or UI.
 */
export function redactApiKey(key?: string | null): string {
  if (!key || key.trim().length === 0) return "";
  return "[REDACTED]";
}

/**
 * Sanitizes an error message or string by stripping any occurrences of the active API key.
 */
export function sanitizeError(error: unknown, apiKey?: string | null): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (!apiKey || apiKey.trim().length === 0) {
    return msg;
  }
  return msg.split(apiKey.trim()).join("[REDACTED]");
}
