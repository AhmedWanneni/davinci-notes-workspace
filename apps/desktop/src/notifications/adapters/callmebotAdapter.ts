import type {
  CallMeBotSecret,
  NotificationPayload,
  NotifyResult,
} from "../channelTypes";
import { redactSecrets } from "../secretRedactor";

/**
 * CallMeBot enforces a soft rate limit of ~1 message per 2 seconds per phone number.
 */
const lastCallMeBotSendByPhone = new Map<string, number>();

export function resetCallMeBotRateLimiterForTests(): void {
  lastCallMeBotSendByPhone.clear();
}

export async function sendCallMeBotNotification(
  secret: CallMeBotSecret,
  payload: NotificationPayload,
  options?: {
    fetchImpl?: typeof fetch;
    minIntervalMs?: number;
  },
): Promise<NotifyResult> {
  const phone = secret.phoneNumber.trim();
  const apiKey = secret.apiKey.trim();

  if (!phone || !apiKey) {
    return {
      ok: false,
      status: "failed",
      retryable: false,
      error: "CallMeBot phone number or API key is missing.",
    };
  }

  const minIntervalMs = options?.minIntervalMs ?? 2000;
  const now = Date.now();
  const prev = lastCallMeBotSendByPhone.get(phone) ?? 0;
  const elapsed = now - prev;
  if (elapsed < minIntervalMs && minIntervalMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, minIntervalMs - elapsed));
  }
  lastCallMeBotSendByPhone.set(phone, Date.now());

  const messageText = payload.text ?? payload.body ?? "";
  const fullText = payload.title
    ? `🔔 ${payload.title}\n${messageText}`
    : messageText;

  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(fullText)}&apikey=${encodeURIComponent(apiKey)}`;
  const fetchImpl = options?.fetchImpl ?? fetch;

  try {
    const response = await fetchImpl(url, { method: "GET" });
    const bodyText = await response.text().catch(() => "");
    const safeBody = redactSecrets(bodyText, [apiKey, phone]);

    if (
      response.ok &&
      !/apikey is invalid|error|not activated/i.test(bodyText)
    ) {
      return { ok: true, status: "sent" };
    }

    if (response.status === 401 || response.status === 403 || /apikey is invalid|not activated/i.test(bodyText)) {
      return {
        ok: false,
        status: "failed",
        retryable: false,
        error:
          "CallMeBot rejected the API key or phone number. Confirm you activated CallMeBot from your WhatsApp.",
      };
    }

    if (response.status === 429 || /too many/i.test(bodyText)) {
      return {
        ok: false,
        status: "failed",
        retryable: true,
        retryAfterMs: 3000,
        error: "CallMeBot rate limit reached (max 1 message per 2s).",
      };
    }

    return {
      ok: false,
      status: "failed",
      retryable: response.status >= 500,
      error: `CallMeBot error (HTTP ${response.status}): ${safeBody.slice(0, 140)}`,
    };
  } catch (err) {
    const rawErr = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      status: "failed",
      retryable: true,
      error: `CallMeBot network failure: ${redactSecrets(rawErr, [apiKey, phone])}`,
    };
  }
}
