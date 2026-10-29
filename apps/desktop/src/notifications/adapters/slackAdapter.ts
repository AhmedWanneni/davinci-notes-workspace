import type {
  NotificationPayload,
  NotifyResult,
  SlackSecret,
} from "../channelTypes";
import { redactSecrets } from "../secretRedactor";

const SLACK_WEBHOOK_PREFIX = "https://hooks.slack.com/services/";

/**
 * Per-webhook minimum spacing (Slack Incoming Webhooks rate limit: 1 msg/sec).
 */
const lastSentByWebhook = new Map<string, number>();

export function resetSlackRateLimiterForTests(): void {
  lastSentByWebhook.clear();
}

export function isValidSlackWebhookUrl(url: string): boolean {
  const trimmed = url.trim();
  return (
    trimmed.startsWith(SLACK_WEBHOOK_PREFIX) &&
    trimmed.length > SLACK_WEBHOOK_PREFIX.length + 10
  );
}

/**
 * Mention safety policy (ADR-0224):
 * - Always neutralize raw `<!channel>`, `<!here>`, and `<!everyone>` injection tokens.
 * - For automated reminders (`sourceKind === "reminder"`) or when `allowChannelMentions`
 *   is false, neutralize `@channel`, `@here`, and `@everyone` with a zero-width space
 *   (`@\u200Bchannel`) so they render visibly in Slack without triggering channel-wide alerts.
 * - When `sourceKind !== "reminder"` and `allowChannelMentions === true`, convert explicit
 *   `@channel`, `@here`, and `@everyone` into `<!channel>`, `<!here>`, `<!everyone>`.
 */
export function sanitizeSlackMentions(
  text: string,
  options: {
    sourceKind: NotificationPayload["sourceKind"];
    allowChannelMentions?: boolean;
  },
): string {
  // First neutralize any raw angle-bracket control tokens
  let safe = text
    .replace(/<!channel(?:\|[^>]+)?>/gi, "@\u200Bchannel")
    .replace(/<!here(?:\|[^>]+)?>/gi, "@\u200Bhere")
    .replace(/<!everyone(?:\|[^>]+)?>/gi, "@\u200Beveryone");

  const permitExplicit =
    options.sourceKind !== "reminder" && Boolean(options.allowChannelMentions);

  if (permitExplicit) {
    safe = safe
      .replace(/(^|[^\w\u200B])@channel\b/gi, "$1<!channel>")
      .replace(/(^|[^\w\u200B])@here\b/gi, "$1<!here>")
      .replace(/(^|[^\w\u200B])@everyone\b/gi, "$1<!everyone>");
  } else {
    safe = safe
      .replace(/(^|[^\w])@(channel|here|everyone)\b/gi, "$1@\u200B$2");
  }

  return safe;
}

export function formatSlackPayloadText(
  payload: NotificationPayload,
  destinationAllowMentions = false,
): string {
  const allowChannelMentions =
    Boolean(payload.allowChannelMentions) || Boolean(destinationAllowMentions);
  const rawText = payload.text ?? payload.body ?? "";
  const safeBody = sanitizeSlackMentions(rawText, {
    sourceKind: payload.sourceKind,
    allowChannelMentions,
  });

  const parts: string[] = [];
  if (payload.title) {
    const safeTitle = sanitizeSlackMentions(payload.title, {
      sourceKind: "reminder",
      allowChannelMentions: false,
    });
    parts.push(`*🔔 ${safeTitle}*`);
  }
  parts.push(safeBody);
  if (payload.notePath) {
    const loc = payload.line
      ? `${payload.notePath}:L${payload.line}`
      : payload.notePath;
    parts.push(`_Note: ${loc}_`);
  }
  return parts.join("\n");
}

export async function sendSlackNotification(
  secret: SlackSecret,
  payload: NotificationPayload,
  options?: {
    destinationAllowMentions?: boolean;
    fetchImpl?: typeof fetch;
    minIntervalMs?: number;
  },
): Promise<NotifyResult> {
  const webhookUrl = secret.webhookUrl.trim();
  if (!isValidSlackWebhookUrl(webhookUrl)) {
    return {
      ok: false,
      status: "failed",
      retryable: false,
      error:
        "Invalid Slack Incoming Webhook URL. Must start with https://hooks.slack.com/services/.",
    };
  }

  const minIntervalMs = options?.minIntervalMs ?? 1000;
  const now = Date.now();
  const prev = lastSentByWebhook.get(webhookUrl) ?? 0;
  const elapsed = now - prev;
  if (elapsed < minIntervalMs && minIntervalMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, minIntervalMs - elapsed));
  }
  lastSentByWebhook.set(webhookUrl, Date.now());

  const fetchImpl = options?.fetchImpl ?? fetch;
  const text = formatSlackPayloadText(
    payload,
    options?.destinationAllowMentions,
  );

  try {
    const response = await fetchImpl(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const bodyText = await response.text().catch(() => "");
    const safeBody = redactSecrets(bodyText, [webhookUrl]);

    if (response.ok) {
      return { ok: true, status: "sent" };
    }

    const status = response.status;
    if (status === 403 || status === 404 || status === 410) {
      return {
        ok: false,
        status: "failed",
        retryable: false,
        error: `Slack webhook revoked, archived, or restricted by workspace admin (HTTP ${status}: ${safeBody || "forbidden"}).`,
      };
    }

    if (status === 400) {
      return {
        ok: false,
        status: "failed",
        retryable: false,
        error: `Slack rejected payload (HTTP 400: ${safeBody || "invalid_payload"}).`,
      };
    }

    if (status === 429) {
      const retryHeader = response.headers?.get?.("Retry-After");
      const retrySec = retryHeader ? parseInt(retryHeader, 10) : 2;
      const waitSec = Number.isFinite(retrySec) && retrySec > 0 ? retrySec : 2;
      return {
        ok: false,
        status: "failed",
        retryable: true,
        retryAfterMs: waitSec * 1000,
        error: `Slack rate limit reached (HTTP 429). Retry after ${waitSec}s.`,
      };
    }

    return {
      ok: false,
      status: "failed",
      retryable: status >= 500,
      error: `Slack webhook error (HTTP ${status}): ${safeBody}`,
    };
  } catch (err) {
    const rawErr = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      status: "failed",
      retryable: true,
      error: `Slack network failure: ${redactSecrets(rawErr, [webhookUrl])}`,
    };
  }
}
