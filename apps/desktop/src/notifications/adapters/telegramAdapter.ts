import type {
  NotificationPayload,
  NotifyResult,
  TelegramSecret,
} from "../channelTypes";
import { redactSecrets } from "../secretRedactor";

interface TelegramApiResponse {
  ok?: boolean;
  description?: string;
  error_code?: number;
  parameters?: {
    retry_after?: number;
  };
}

export function formatTelegramMessage(payload: NotificationPayload): string {
  const parts: string[] = [];
  if (payload.title) {
    parts.push(`🔔 ${payload.title}`);
  }
  parts.push(payload.text ?? payload.body ?? "");
  if (payload.notePath) {
    const loc = payload.line
      ? `${payload.notePath}:L${payload.line}`
      : payload.notePath;
    parts.push(`— Note: ${loc}`);
  }
  return parts.join("\n");
}

export async function sendTelegramNotification(
  secret: TelegramSecret,
  payload: NotificationPayload,
  fetchImpl: typeof fetch = fetch,
): Promise<NotifyResult> {
  const botToken = secret.botToken.trim();
  const chatId = secret.chatId.trim();

  if (!botToken || !chatId) {
    return {
      ok: false,
      status: "failed",
      retryable: false,
      error: "Telegram bot token or Chat ID is missing.",
    };
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const text = formatTelegramMessage(payload);

  try {
    const response = await fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
    });

    let body: TelegramApiResponse | null = null;
    try {
      body = (await response.json()) as TelegramApiResponse;
    } catch {
      // Non-JSON response
    }

    if (response.ok && body?.ok !== false) {
      return { ok: true, status: "sent" };
    }

    const status = response.status;
    const rawDesc = body?.description
      ? redactSecrets(body.description, [botToken])
      : `HTTP ${status}`;

    if (status === 401 || status === 404) {
      return {
        ok: false,
        status: "failed",
        retryable: false,
        error: `Telegram rejected the bot token (${status} Unauthorized). Verify your BotFather token.`,
      };
    }

    if (status === 400) {
      return {
        ok: false,
        status: "failed",
        retryable: false,
        error: `Telegram could not send to Chat ID (${rawDesc}). Open your bot in Telegram and send /start, or verify the Chat ID.`,
      };
    }

    if (status === 403) {
      return {
        ok: false,
        status: "failed",
        retryable: false,
        error: `Telegram bot was blocked or removed from the chat (${rawDesc}).`,
      };
    }

    if (status === 429) {
      const retryAfterSec = body?.parameters?.retry_after ?? 2;
      return {
        ok: false,
        status: "failed",
        retryable: true,
        retryAfterMs: retryAfterSec * 1000,
        error: `Telegram rate limit reached (429). Retry after ${retryAfterSec}s.`,
      };
    }

    return {
      ok: false,
      status: "failed",
      retryable: status >= 500,
      error: `Telegram API error (${status}): ${rawDesc}`,
    };
  } catch (err) {
    const rawErr = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      status: "failed",
      retryable: true,
      error: `Telegram network failure: ${redactSecrets(rawErr, [botToken])}`,
    };
  }
}
