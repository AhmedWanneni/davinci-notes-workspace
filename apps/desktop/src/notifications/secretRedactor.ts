/**
 * Redacts notification secrets (Telegram bot tokens, Slack webhook URLs,
 * CallMeBot API keys, phone numbers, and explicit secret strings) before any
 * message is written to SQLite, UI state, or the Vault Activity Logs.
 */
export function redactSecrets(
  input: string,
  explicitSecrets: readonly string[] = [],
): string {
  if (!input) return "";
  let out = input;

  for (const secret of explicitSecrets) {
    const trimmed = secret?.trim();
    if (trimmed && trimmed.length >= 4) {
      out = out.split(trimmed).join("[REDACTED]");
      const encoded = encodeURIComponent(trimmed);
      if (encoded !== trimmed) {
        out = out.split(encoded).join("[REDACTED]");
      }
    }
  }

  // Slack incoming webhook URLs
  out = out.replace(
    /https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9/_-]+/gi,
    "https://hooks.slack.com/services/[REDACTED]",
  );

  // Telegram Bot API URLs and raw bot tokens (e.g. 123456789:AAH_xyz...)
  out = out.replace(
    /https:\/\/api\.telegram\.org\/bot[^/\s]+\//gi,
    "https://api.telegram.org/bot[REDACTED]/",
  );
  out = out.replace(/\b(?:bot)?\d{6,15}:[A-Za-z0-9_-]{15,}\b/g, "[REDACTED_BOT_TOKEN]");

  // CallMeBot query parameters
  out = out.replace(/([?&]apikey=)[^&\s]+/gi, "$1[REDACTED]");
  out = out.replace(/([?&]phone=)[^&\s]+/gi, "$1[REDACTED]");

  return out;
}
